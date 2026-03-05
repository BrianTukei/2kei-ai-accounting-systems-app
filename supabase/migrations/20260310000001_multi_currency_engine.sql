-- ============================================================
-- 2K AI Accounting Systems — Multi-Currency Engine
-- Migration: 20260310000001
-- ============================================================
-- Adds:
--   1. exchange_rates          — cached live forex rates
--   2. exchange_rate_history   — immutable audit trail
--   3. admin_rate_overrides    — manual admin overrides
--   4. Currency columns on transactions table
-- ============================================================

-- ─────────────────────────────────────────
-- 1. Exchange Rates (cached live rates, refreshed every 10 min)
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency   TEXT NOT NULL DEFAULT 'USD',
  target_currency TEXT NOT NULL,
  rate            NUMERIC(18,8) NOT NULL,
  source          TEXT NOT NULL DEFAULT 'exchangerate-api',  -- 'exchangerate-api' | 'admin_override' | 'fallback'
  fetched_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '10 minutes'),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (base_currency, target_currency)
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair
  ON public.exchange_rates(base_currency, target_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_expires
  ON public.exchange_rates(expires_at);

-- ─────────────────────────────────────────
-- 2. Exchange Rate History (immutable audit trail)
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.exchange_rate_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency   TEXT NOT NULL DEFAULT 'USD',
  target_currency TEXT NOT NULL,
  rate            NUMERIC(18,8) NOT NULL,
  source          TEXT NOT NULL DEFAULT 'exchangerate-api',
  recorded_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_history_pair_date
  ON public.exchange_rate_history(base_currency, target_currency, recorded_at DESC);

-- ─────────────────────────────────────────
-- 3. Admin Rate Overrides
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_rate_overrides (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency   TEXT NOT NULL DEFAULT 'USD',
  target_currency TEXT NOT NULL,
  override_rate   NUMERIC(18,8) NOT NULL,
  reason          TEXT,
  set_by          UUID NOT NULL REFERENCES auth.users(id),
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  effective_from  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  effective_until TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_overrides_active
  ON public.admin_rate_overrides(base_currency, target_currency, active)
  WHERE active = TRUE;

-- ─────────────────────────────────────────
-- 4. Add multi-currency columns to transactions
-- ─────────────────────────────────────────

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS currency             TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS original_amount      NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS original_currency    TEXT,
  ADD COLUMN IF NOT EXISTS base_currency_amount NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS exchange_rate_used   NUMERIC(18,8),
  ADD COLUMN IF NOT EXISTS exchange_rate_date   TIMESTAMP WITH TIME ZONE;

-- Backfill existing transactions: original = current, rate = 1.0 (assumed USD)
UPDATE public.transactions
SET original_amount      = amount,
    original_currency    = 'USD',
    base_currency_amount = amount,
    exchange_rate_used   = 1.00000000,
    exchange_rate_date   = created_at,
    currency             = 'USD'
WHERE original_amount IS NULL;

-- ─────────────────────────────────────────
-- 5. Add multi-currency columns to invoice_payments
-- ─────────────────────────────────────────

ALTER TABLE public.invoice_payments
  ADD COLUMN IF NOT EXISTS currency             TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS original_amount      NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS original_currency    TEXT,
  ADD COLUMN IF NOT EXISTS base_currency_amount NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS exchange_rate_used   NUMERIC(18,8);

-- ─────────────────────────────────────────
-- 6. Add multi-currency columns to imported_transactions
-- ─────────────────────────────────────────

ALTER TABLE public.imported_transactions
  ADD COLUMN IF NOT EXISTS currency             TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS original_currency    TEXT,
  ADD COLUMN IF NOT EXISTS exchange_rate_used   NUMERIC(18,8);

-- ─────────────────────────────────────────
-- 7. RLS Policies
-- ─────────────────────────────────────────

-- exchange_rates: readable by all authenticated users
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exchange_rates_read" ON public.exchange_rates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role (Edge Functions) to insert/update
CREATE POLICY "exchange_rates_service_write" ON public.exchange_rates
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- exchange_rate_history: readable by authenticated
ALTER TABLE public.exchange_rate_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rate_history_read" ON public.exchange_rate_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "rate_history_service_write" ON public.exchange_rate_history
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- admin_rate_overrides: admins only
ALTER TABLE public.admin_rate_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_overrides_read" ON public.admin_rate_overrides
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_overrides_write" ON public.admin_rate_overrides
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    )
  );

-- ─────────────────────────────────────────
-- 8. Helper function: get effective exchange rate
--    (admin override > cached rate > fallback 1.0)
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_exchange_rate(
  p_base TEXT DEFAULT 'USD',
  p_target TEXT DEFAULT 'USD'
) RETURNS NUMERIC AS $$
DECLARE
  v_rate NUMERIC;
BEGIN
  -- Same currency → 1.0
  IF UPPER(p_base) = UPPER(p_target) THEN
    RETURN 1.0;
  END IF;

  -- 1. Check active admin override
  SELECT override_rate INTO v_rate
  FROM public.admin_rate_overrides
  WHERE base_currency   = UPPER(p_base)
    AND target_currency = UPPER(p_target)
    AND active          = TRUE
    AND (effective_until IS NULL OR effective_until > now())
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;

  -- 2. Check cached rate (not expired)
  SELECT rate INTO v_rate
  FROM public.exchange_rates
  WHERE base_currency   = UPPER(p_base)
    AND target_currency = UPPER(p_target)
    AND expires_at > now()
  LIMIT 1;

  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;

  -- 3. Check cached rate (even if expired — better than nothing)
  SELECT rate INTO v_rate
  FROM public.exchange_rates
  WHERE base_currency   = UPPER(p_base)
    AND target_currency = UPPER(p_target)
  ORDER BY fetched_at DESC
  LIMIT 1;

  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;

  -- 4. Fallback
  RETURN 1.0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────
-- 9. Helper function: convert amount between currencies
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.convert_currency(
  p_amount NUMERIC,
  p_from   TEXT,
  p_to     TEXT
) RETURNS NUMERIC AS $$
BEGIN
  RETURN p_amount * public.get_exchange_rate(UPPER(p_from), UPPER(p_to));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

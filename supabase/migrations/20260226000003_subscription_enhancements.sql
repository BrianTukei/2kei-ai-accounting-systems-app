-- ============================================================
-- Subscription Enhancements Migration
-- Migration: 20260226000003
-- Adds payment tracking and user-level subscription checks
-- ============================================================

-- ─────────────────────────────────────────
-- 1. Payment Transactions (for verification tracking)
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id),
  plan_id           TEXT NOT NULL REFERENCES public.subscription_plans(id),
  billing_cycle     TEXT NOT NULL DEFAULT 'monthly',
  amount            NUMERIC(14,2) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'USD',
  payment_provider  TEXT,                         -- 'stripe' | 'flutterwave' | 'paystack' | 'demo'
  payment_status    TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  transaction_ref   TEXT UNIQUE,                  -- External provider reference
  checkout_session_id TEXT,                       -- Stripe/other checkout session
  webhook_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  error_message     TEXT,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at      TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS payment_transactions_org_idx ON public.payment_transactions(organization_id);
CREATE INDEX IF NOT EXISTS payment_transactions_status_idx ON public.payment_transactions(payment_status);
CREATE INDEX IF NOT EXISTS payment_transactions_ref_idx ON public.payment_transactions(transaction_ref);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- 2. Add last_payment_id to subscriptions
-- ─────────────────────────────────────────

ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS last_payment_id UUID REFERENCES public.payment_transactions(id);

ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE;

-- ─────────────────────────────────────────
-- 3. RLS Policies for payment_transactions
-- ─────────────────────────────────────────

-- Users can view their organization's payments
CREATE POLICY "Users can view org payments" ON public.payment_transactions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = true
    )
  );

-- Users can insert payments for their organization
CREATE POLICY "Users can create org payments" ON public.payment_transactions
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = true
    )
  );

-- ─────────────────────────────────────────
-- 4. Function to activate subscription after payment
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.activate_subscription(
  p_organization_id UUID,
  p_plan_id TEXT,
  p_billing_cycle TEXT,
  p_payment_id UUID DEFAULT NULL,
  p_payment_provider TEXT DEFAULT 'demo'
)
RETURNS UUID AS $$
DECLARE
  v_subscription_id UUID;
  v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate period end
  IF p_billing_cycle = 'annual' THEN
    v_period_end := now() + INTERVAL '1 year';
  ELSE
    v_period_end := now() + INTERVAL '1 month';
  END IF;

  -- Upsert subscription
  INSERT INTO public.subscriptions (
    organization_id,
    plan_id,
    status,
    billing_cycle,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    payment_provider,
    last_payment_id,
    activated_at,
    updated_at
  ) VALUES (
    p_organization_id,
    p_plan_id,
    'active',
    p_billing_cycle,
    now(),
    v_period_end,
    false,
    p_payment_provider,
    p_payment_id,
    now(),
    now()
  )
  ON CONFLICT (organization_id)
  DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = 'active',
    billing_cycle = EXCLUDED.billing_cycle,
    current_period_start = now(),
    current_period_end = v_period_end,
    cancel_at_period_end = false,
    payment_provider = EXCLUDED.payment_provider,
    last_payment_id = EXCLUDED.last_payment_id,
    activated_at = now(),
    updated_at = now()
  RETURNING id INTO v_subscription_id;

  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────
-- 5. Function to check user subscription status
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_user_subscription_status(p_user_id UUID)
RETURNS TABLE (
  has_active_subscription BOOLEAN,
  subscription_status TEXT,
  plan_id TEXT,
  organization_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.status IN ('active', 'trialing') AS has_active_subscription,
    s.status::TEXT AS subscription_status,
    s.plan_id,
    s.organization_id
  FROM public.subscriptions s
  JOIN public.organization_users ou ON ou.organization_id = s.organization_id
  WHERE ou.user_id = p_user_id
    AND ou.invite_accepted = true
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.activate_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_subscription_status TO authenticated;

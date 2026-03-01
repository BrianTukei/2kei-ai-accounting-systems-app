-- ============================================================
-- INVOICES, INVOICE ITEMS, PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  client_name   TEXT NOT NULL,
  client_email  TEXT,
  client_address TEXT,
  issue_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date      DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  subtotal      NUMERIC NOT NULL DEFAULT 0,
  tax_rate      NUMERIC NOT NULL DEFAULT 0,
  tax_amount    NUMERIC NOT NULL DEFAULT 0,
  discount      NUMERIC NOT NULL DEFAULT 0,
  total         NUMERIC NOT NULL DEFAULT 0,
  notes         TEXT,
  currency      TEXT NOT NULL DEFAULT 'USD',
  paid_at       TIMESTAMPTZ,
  payment_method TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  quantity      NUMERIC NOT NULL DEFAULT 1,
  unit_price    NUMERIC NOT NULL DEFAULT 0,
  total         NUMERIC NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount        NUMERIC NOT NULL,
  payment_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  reference     TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BANK IMPORTS & IMPORTED TRANSACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bank_imports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,
  file_type     TEXT NOT NULL,   -- 'csv', 'excel', 'pdf'
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','processing','reviewed','posted','failed')),
  total_rows    INTEGER DEFAULT 0,
  imported_rows INTEGER DEFAULT 0,
  duplicate_rows INTEGER DEFAULT 0,
  hash          TEXT,            -- SHA-256 of file content to prevent re-import
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.imported_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id     UUID NOT NULL REFERENCES public.bank_imports(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  description   TEXT NOT NULL,
  debit         NUMERIC DEFAULT 0,
  credit        NUMERIC DEFAULT 0,
  balance       NUMERIC,
  ai_category   TEXT,
  ai_type       TEXT CHECK (ai_type IN ('income','expense')),
  account_code  TEXT,
  is_duplicate  BOOLEAN DEFAULT FALSE,
  is_confirmed  BOOLEAN DEFAULT FALSE,
  transaction_id UUID,           -- FK to transactions table once posted
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.invoices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_imports      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_transactions ENABLE ROW LEVEL SECURITY;

-- invoices
CREATE POLICY "invoices_owner" ON public.invoices FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- invoice_items (via invoice ownership)
CREATE POLICY "invoice_items_owner" ON public.invoice_items FOR ALL
  USING (invoice_id IN (SELECT id FROM public.invoices WHERE user_id = auth.uid()))
  WITH CHECK (invoice_id IN (SELECT id FROM public.invoices WHERE user_id = auth.uid()));

-- invoice_payments (via invoice ownership)
CREATE POLICY "invoice_payments_owner" ON public.invoice_payments FOR ALL
  USING (invoice_id IN (SELECT id FROM public.invoices WHERE user_id = auth.uid()))
  WITH CHECK (invoice_id IN (SELECT id FROM public.invoices WHERE user_id = auth.uid()));

-- bank_imports
CREATE POLICY "bank_imports_owner" ON public.bank_imports FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- imported_transactions
CREATE POLICY "imported_transactions_owner" ON public.imported_transactions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER bank_imports_updated_at
  BEFORE UPDATE ON public.bank_imports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Ledgerly SaaS — Multi-Tenant Schema
-- Migration: 20260226000002
-- ============================================================

-- ─────────────────────────────────────────
-- 1. Subscription Plans (static, seeded)
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id            TEXT PRIMARY KEY,          -- 'free' | 'pro' | 'enterprise'
  name          TEXT NOT NULL,
  description   TEXT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_annual  NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'USD',
  features      JSONB NOT NULL DEFAULT '{}',
  -- Limits
  max_users                  INT NOT NULL DEFAULT 1,
  max_invoices_per_month     INT NOT NULL DEFAULT 10,   -- -1 = unlimited
  max_ai_chats_per_month     INT NOT NULL DEFAULT 20,
  max_bank_imports_per_month INT NOT NULL DEFAULT 2,
  max_businesses             INT NOT NULL DEFAULT 1,
  has_ai_assistant           BOOLEAN NOT NULL DEFAULT FALSE,
  has_advanced_reports       BOOLEAN NOT NULL DEFAULT FALSE,
  has_payroll                BOOLEAN NOT NULL DEFAULT FALSE,
  has_team_access            BOOLEAN NOT NULL DEFAULT FALSE,
  trial_days                 INT NOT NULL DEFAULT 14,
  is_active                  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Seed the three plans
INSERT INTO public.subscription_plans
  (id, name, description, price_monthly, price_annual, max_users,
   max_invoices_per_month, max_ai_chats_per_month, max_bank_imports_per_month,
   max_businesses, has_ai_assistant, has_advanced_reports, has_payroll, has_team_access, trial_days)
VALUES
  ('free', 'Free',
   'Perfect for freelancers and solopreneurs getting started.',
   0, 0, 1, 10, 20, 2, 1, FALSE, FALSE, FALSE, FALSE, 0),

  ('pro', 'Pro',
   'Unlimited invoices, full reports, AI assistant — for growing businesses.',
   29, 290, 5, -1, 200, 20, 1, TRUE, TRUE, TRUE, FALSE, 14),

  ('enterprise', 'Enterprise',
   'Multi-user, advanced analytics, priority AI — for teams.',
   79, 790, -1, -1, -1, -1, -1, TRUE, TRUE, TRUE, TRUE, 14)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────
-- 2. Organizations
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,           -- URL-safe identifier
  logo_url      TEXT,
  industry      TEXT,
  country       TEXT,
  timezone      TEXT NOT NULL DEFAULT 'UTC',
  currency      TEXT NOT NULL DEFAULT 'USD',
  tax_id        TEXT,
  address       TEXT,
  phone         TEXT,
  website       TEXT,
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- 3. Organization Members
-- ─────────────────────────────────────────

CREATE TYPE IF NOT EXISTS public.org_role AS ENUM (
  'owner', 'accountant', 'manager', 'viewer'
);

CREATE TABLE IF NOT EXISTS public.organization_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            public.org_role NOT NULL DEFAULT 'viewer',
  invited_by      UUID REFERENCES auth.users(id),
  invite_email    TEXT,
  invite_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  invite_token    TEXT UNIQUE,
  joined_at       TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- 4. Subscriptions
-- ─────────────────────────────────────────

CREATE TYPE IF NOT EXISTS public.sub_status AS ENUM (
  'trialing', 'active', 'past_due', 'canceled', 'paused'
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id           TEXT NOT NULL REFERENCES public.subscription_plans(id),
  status            public.sub_status NOT NULL DEFAULT 'trialing',
  billing_cycle     TEXT NOT NULL DEFAULT 'monthly',    -- 'monthly' | 'annual'
  trial_ends_at     TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end   TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  -- Payment provider references
  stripe_customer_id       TEXT,
  stripe_subscription_id   TEXT,
  flutterwave_customer_id  TEXT,
  paystack_customer_id     TEXT,
  payment_provider         TEXT,                         -- 'stripe' | 'flutterwave' | 'paystack'
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (organization_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- 5. Billing Events / Invoices
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.billing_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,   -- 'payment_succeeded' | 'payment_failed' | 'subscription_updated' etc.
  amount          NUMERIC(10,2),
  currency        TEXT DEFAULT 'USD',
  provider        TEXT,
  provider_event_id TEXT,
  metadata        JSONB,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- 6. AI Usage Log (for metering & billing)
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action          TEXT NOT NULL,  -- 'chat' | 'invoice_gen' | 'bank_import' | 'categorise'
  tokens_used     INT DEFAULT 0,
  month           TEXT NOT NULL,  -- 'YYYY-MM' for aggregation
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_usage_log_org_month ON public.ai_usage_log(organization_id, month);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- 7. Team Invitations
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  role            public.org_role NOT NULL DEFAULT 'viewer',
  token           TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted        BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- 8. App Data Tables (Supabase-backed, RLS)
--    These replace localStorage for production
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  description     TEXT NOT NULL,
  amount          NUMERIC(14,2) NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('income','expense')),
  category        TEXT,
  date            TEXT NOT NULL,
  payment_method  TEXT,
  reference       TEXT,
  notes           TEXT,
  is_recurring    BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transactions_org ON public.transactions(organization_id);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id),
  invoice_number   TEXT NOT NULL,
  client_name      TEXT NOT NULL,
  client_email     TEXT,
  client_address   TEXT,
  issue_date       TEXT NOT NULL,
  due_date         TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'draft',
  items            JSONB NOT NULL DEFAULT '[]',
  subtotal         NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_rate         NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount         NUMERIC(14,2) NOT NULL DEFAULT 0,
  total            NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes            TEXT,
  currency         TEXT NOT NULL DEFAULT 'USD',
  paid_at          TEXT,
  payment_method   TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (organization_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS invoices_org ON public.invoices(organization_id);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- 9. Helper Functions
-- ─────────────────────────────────────────

-- Returns the user's active organization_id (first org by created_at)
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_users
  WHERE user_id = _user_id
    AND invite_accepted = TRUE
  ORDER BY created_at
  LIMIT 1
$$;

-- Check if a user has a specific role within an org
CREATE OR REPLACE FUNCTION public.user_org_role(_user_id UUID, _org_id UUID)
RETURNS public.org_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.organization_users
  WHERE user_id = _user_id
    AND organization_id = _org_id
    AND invite_accepted = TRUE
  LIMIT 1
$$;

-- Monthly AI usage count for an org
CREATE OR REPLACE FUNCTION public.ai_usage_this_month(_org_id UUID, _action TEXT DEFAULT NULL)
RETURNS INT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INT
  FROM public.ai_usage_log
  WHERE organization_id = _org_id
    AND month = to_char(now(), 'YYYY-MM')
    AND (_action IS NULL OR action = _action)
$$;

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────
-- 10. Row-Level Security Policies
-- ─────────────────────────────────────────

-- organizations: members can see their org; only owner can update
CREATE POLICY "org_members_select"
  ON public.organizations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_id = organizations.id
        AND user_id = auth.uid()
        AND invite_accepted = TRUE
    )
  );

CREATE POLICY "org_owner_insert"
  ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "org_owner_update"
  ON public.organizations FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

-- organization_users: members can see teammates
CREATE POLICY "org_users_select"
  ON public.organization_users FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  );

CREATE POLICY "org_users_insert"
  ON public.organization_users FOR INSERT TO authenticated
  WITH CHECK (
    -- Owner/accountant can add members
    public.user_org_role(auth.uid(), organization_id) IN ('owner','accountant')
    OR user_id = auth.uid()   -- Accept own invite
  );

CREATE POLICY "org_users_update"
  ON public.organization_users FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.user_org_role(auth.uid(), organization_id) = 'owner'
  );

-- subscriptions: org members can view; only system can write
CREATE POLICY "sub_org_select"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  );

-- billing_events: org members can view
CREATE POLICY "billing_events_select"
  ON public.billing_events FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  );

-- ai_usage_log: org members can view; any member can insert their own
CREATE POLICY "ai_usage_select"
  ON public.ai_usage_log FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  );

CREATE POLICY "ai_usage_insert"
  ON public.ai_usage_log FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  );

-- team_invitations: org members can view
CREATE POLICY "invitations_select"
  ON public.team_invitations FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "invitations_insert"
  ON public.team_invitations FOR INSERT TO authenticated
  WITH CHECK (
    public.user_org_role(auth.uid(), organization_id) IN ('owner','accountant')
  );

-- transactions: org-scoped isolation
CREATE POLICY "transactions_org_isolation"
  ON public.transactions FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  );

-- invoices: org-scoped isolation
CREATE POLICY "invoices_org_isolation"
  ON public.invoices FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  );

-- ─────────────────────────────────────────
-- 11. Super Admin: bypass RLS function
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

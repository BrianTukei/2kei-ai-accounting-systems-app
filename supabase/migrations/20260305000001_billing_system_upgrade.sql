-- ============================================================
-- Migration: Production-Grade Billing System Upgrade
-- Date: 2026-03-05
-- Description: Adds user-level subscription fields, usage
--   counters, storage limits, and admin billing controls.
-- ============================================================

-- ── 1. Extend profiles table with subscription fields ─────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status   text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_name             text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS billing_cycle         text DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS stripe_customer_id    text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS trial_start_date      timestamptz,
  ADD COLUMN IF NOT EXISTS trial_end_date        timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_start  timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end    timestamptz,
  ADD COLUMN IF NOT EXISTS usage_counters        jsonb DEFAULT '{"invoices": 0, "ai_queries": 0, "team_members": 0, "storage_mb": 0, "reports": 0, "bank_imports": 0}'::jsonb,
  ADD COLUMN IF NOT EXISTS usage_limits          jsonb DEFAULT '{"invoices": 10, "ai_queries": 20, "team_members": 1, "storage_mb": 100, "reports": 3, "bank_imports": 2}'::jsonb;

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status
  ON public.profiles (subscription_status);

CREATE INDEX IF NOT EXISTS idx_profiles_plan_name
  ON public.profiles (plan_name);

-- ── 2. Extend subscriptions table ──────────────────────────
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_start_date      timestamptz,
  ADD COLUMN IF NOT EXISTS usage_counters        jsonb DEFAULT '{"invoices": 0, "ai_queries": 0, "team_members": 0, "storage_mb": 0, "reports": 0, "bank_imports": 0}'::jsonb,
  ADD COLUMN IF NOT EXISTS usage_limits          jsonb DEFAULT '{"invoices": 10, "ai_queries": 20, "team_members": 1, "storage_mb": 100, "reports": 3, "bank_imports": 2}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_usage_reset      timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS payment_method_last4  text,
  ADD COLUMN IF NOT EXISTS payment_method_brand  text;

-- ── 3. Extend subscription_plans with storage & reports ────
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS max_storage_mb   integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_reports      integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS stripe_price_monthly text,
  ADD COLUMN IF NOT EXISTS stripe_price_annual  text;

-- ── 4. Create usage_events table for metered billing ───────
CREATE TABLE IF NOT EXISTS public.usage_events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL,
  event_type       text NOT NULL,  -- 'invoice_created', 'ai_query', 'team_member_added', 'storage_upload', 'report_generated', 'bank_import'
  quantity         integer DEFAULT 1,
  metadata         jsonb DEFAULT '{}'::jsonb,
  month            text NOT NULL,  -- 'YYYY-MM' partition key
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_org_month
  ON public.usage_events (organization_id, month);

CREATE INDEX IF NOT EXISTS idx_usage_events_type
  ON public.usage_events (event_type);

-- ── 5. Create admin_billing_overrides table ────────────────
CREATE TABLE IF NOT EXISTS public.admin_billing_overrides (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  admin_user_id    uuid NOT NULL,
  action           text NOT NULL,  -- 'activate', 'cancel', 'extend_trial', 'change_plan', 'reset_usage'
  previous_state   jsonb,
  new_state        jsonb,
  reason           text,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_overrides_org
  ON public.admin_billing_overrides (organization_id);

-- ── 6. Create webhook_events table for idempotency ─────────
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider         text NOT NULL,         -- 'stripe', 'flutterwave', etc.
  event_id         text NOT NULL UNIQUE,   -- Provider's event ID
  event_type       text NOT NULL,
  processed        boolean DEFAULT false,
  payload          jsonb,
  error            text,
  created_at       timestamptz DEFAULT now(),
  processed_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_id
  ON public.webhook_events (provider, event_id);

-- ── 7. Update subscription_plans with production values ────
INSERT INTO public.subscription_plans (
  id, name, description, price_monthly, price_annual, currency,
  max_users, max_invoices_per_month, max_ai_chats_per_month,
  max_bank_imports_per_month, max_businesses,
  max_storage_mb, max_reports,
  has_ai_assistant, has_advanced_reports, has_payroll, has_team_access,
  trial_days, is_active
) VALUES
  ('free', 'Free', 'Perfect for freelancers getting started.',
   0, 0, 'USD', 1, 10, 20, 2, 1, 100, 3,
   false, false, false, false, 0, true),
  ('pro', 'Pro', 'Unlimited invoices, full reports, AI assistant.',
   29, 290, 'USD', 5, -1, 200, 20, 3, 5120, -1,
   true, true, true, false, 7, true),
  ('enterprise', 'Enterprise', 'Multi-user, advanced analytics, priority AI, custom pricing.',
   79, 790, 'USD', -1, -1, -1, -1, -1, -1, -1,
   true, true, true, true, 7, true)
ON CONFLICT (id) DO UPDATE SET
  name                     = EXCLUDED.name,
  description              = EXCLUDED.description,
  price_monthly            = EXCLUDED.price_monthly,
  price_annual             = EXCLUDED.price_annual,
  max_users                = EXCLUDED.max_users,
  max_invoices_per_month   = EXCLUDED.max_invoices_per_month,
  max_ai_chats_per_month   = EXCLUDED.max_ai_chats_per_month,
  max_bank_imports_per_month = EXCLUDED.max_bank_imports_per_month,
  max_businesses           = EXCLUDED.max_businesses,
  max_storage_mb           = EXCLUDED.max_storage_mb,
  max_reports              = EXCLUDED.max_reports,
  has_ai_assistant         = EXCLUDED.has_ai_assistant,
  has_advanced_reports     = EXCLUDED.has_advanced_reports,
  has_payroll              = EXCLUDED.has_payroll,
  has_team_access          = EXCLUDED.has_team_access,
  trial_days               = EXCLUDED.trial_days,
  is_active                = EXCLUDED.is_active;

-- ── 8. Function: Get usage counts for an org this month ────
CREATE OR REPLACE FUNCTION public.get_org_usage_counts(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_month text := to_char(now(), 'YYYY-MM');
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'invoices',     COALESCE(SUM(CASE WHEN event_type = 'invoice_created' THEN quantity ELSE 0 END), 0),
    'ai_queries',   COALESCE(SUM(CASE WHEN event_type = 'ai_query' THEN quantity ELSE 0 END), 0),
    'team_members', (SELECT COUNT(*) FROM organization_users WHERE organization_id = p_org_id AND invite_accepted = true),
    'storage_mb',   COALESCE(SUM(CASE WHEN event_type = 'storage_upload' THEN quantity ELSE 0 END), 0),
    'reports',      COALESCE(SUM(CASE WHEN event_type = 'report_generated' THEN quantity ELSE 0 END), 0),
    'bank_imports', COALESCE(SUM(CASE WHEN event_type = 'bank_import' THEN quantity ELSE 0 END), 0)
  ) INTO v_result
  FROM usage_events
  WHERE organization_id = p_org_id AND month = v_month;

  RETURN COALESCE(v_result, '{"invoices":0,"ai_queries":0,"team_members":0,"storage_mb":0,"reports":0,"bank_imports":0}'::jsonb);
END;
$$;

-- ── 9. Function: Check if org exceeds any usage limit ──────
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  p_org_id uuid,
  p_event_type text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_sub record;
  v_plan record;
  v_current integer;
  v_limit integer;
  v_month text := to_char(now(), 'YYYY-MM');
BEGIN
  -- Get subscription
  SELECT * INTO v_sub FROM subscriptions WHERE organization_id = p_org_id;
  IF NOT FOUND THEN
    -- No subscription = free plan defaults
    v_sub := ROW(NULL, p_org_id, 'free', 'active', 'monthly', NULL, NULL, NULL, false, NULL, NULL);
  END IF;

  -- Get plan limits
  SELECT * INTO v_plan FROM subscription_plans WHERE id = v_sub.plan_id;
  IF NOT FOUND THEN
    SELECT * INTO v_plan FROM subscription_plans WHERE id = 'free';
  END IF;

  -- Get current usage
  SELECT COALESCE(SUM(quantity), 0) INTO v_current
  FROM usage_events
  WHERE organization_id = p_org_id AND month = v_month AND event_type = p_event_type;

  -- Map event type to plan limit
  v_limit := CASE p_event_type
    WHEN 'invoice_created' THEN v_plan.max_invoices_per_month
    WHEN 'ai_query'        THEN v_plan.max_ai_chats_per_month
    WHEN 'bank_import'     THEN v_plan.max_bank_imports_per_month
    WHEN 'storage_upload'  THEN v_plan.max_storage_mb
    WHEN 'report_generated' THEN v_plan.max_reports
    ELSE -1
  END;

  -- -1 = unlimited
  IF v_limit = -1 THEN
    RETURN jsonb_build_object('allowed', true, 'current', v_current, 'limit', -1);
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_current < v_limit,
    'current', v_current,
    'limit', v_limit,
    'remaining', GREATEST(0, v_limit - v_current)
  );
END;
$$;

-- ── 10. Function: Reset monthly usage counters ─────────────
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE subscriptions
  SET usage_counters = '{"invoices": 0, "ai_queries": 0, "team_members": 0, "storage_mb": 0, "reports": 0, "bank_imports": 0}'::jsonb,
      last_usage_reset = now()
  WHERE last_usage_reset < date_trunc('month', now());
END;
$$;

-- ── 11. Function: Admin billing overview ───────────────────
CREATE OR REPLACE FUNCTION public.admin_billing_overview()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_orgs',      (SELECT COUNT(*) FROM organizations),
    'active_subs',     (SELECT COUNT(*) FROM subscriptions WHERE status = 'active'),
    'trialing_subs',   (SELECT COUNT(*) FROM subscriptions WHERE status = 'trialing'),
    'past_due_subs',   (SELECT COUNT(*) FROM subscriptions WHERE status = 'past_due'),
    'canceled_subs',   (SELECT COUNT(*) FROM subscriptions WHERE status = 'canceled'),
    'pro_plans',       (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'pro' AND status IN ('active', 'trialing')),
    'enterprise_plans',(SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'enterprise' AND status IN ('active', 'trialing')),
    'free_plans',      (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'free'),
    'monthly_revenue', (SELECT COALESCE(SUM(
      CASE WHEN s.billing_cycle = 'monthly' THEN p.price_monthly
           WHEN s.billing_cycle = 'annual'  THEN p.price_annual / 12.0
           ELSE 0 END
    ), 0) FROM subscriptions s LEFT JOIN subscription_plans p ON s.plan_id = p.id WHERE s.status IN ('active')),
    'total_revenue',   (SELECT COALESCE(SUM(amount), 0) FROM billing_events WHERE type = 'payment_succeeded')
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ── 12. RLS policies for new tables ────────────────────────

-- usage_events: users can read their own org's usage
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org usage"
  ON public.usage_events FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage usage"
  ON public.usage_events FOR ALL
  USING (auth.role() = 'service_role');

-- webhook_events: only service role
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages webhooks"
  ON public.webhook_events FOR ALL
  USING (auth.role() = 'service_role');

-- admin_billing_overrides: only service role + admin read
ALTER TABLE public.admin_billing_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages overrides"
  ON public.admin_billing_overrides FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view overrides"
  ON public.admin_billing_overrides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── 13. Trigger: auto-expire trials ───────────────────────
CREATE OR REPLACE FUNCTION public.auto_expire_trials()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- If trial has ended and card was not charged, downgrade to free
  IF NEW.status = 'trialing' AND NEW.trial_ends_at IS NOT NULL AND NEW.trial_ends_at < now() THEN
    NEW.status := 'canceled';
    NEW.plan_id := 'free';
    NEW.usage_limits := '{"invoices": 10, "ai_queries": 20, "team_members": 1, "storage_mb": 100, "reports": 3, "bank_imports": 2}'::jsonb;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_expire_trials ON public.subscriptions;
CREATE TRIGGER trg_auto_expire_trials
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_expire_trials();

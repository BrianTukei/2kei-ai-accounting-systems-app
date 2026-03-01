-- ═══════════════════════════════════════════════════════════════════════════
-- 2KEI AI Accounting - Developer Admin Dashboard Schema
-- Complete database schema for enterprise admin system
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────

-- Admin role types
DO $$ BEGIN
  CREATE TYPE admin_role_type AS ENUM ('super_admin', 'developer', 'support_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Feature flag status
DO $$ BEGIN
  CREATE TYPE feature_status AS ENUM ('enabled', 'disabled', 'beta', 'deprecated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notification priority
DO $$ BEGIN
  CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- System health status
DO $$ BEGIN
  CREATE TYPE health_status AS ENUM ('healthy', 'degraded', 'down', 'maintenance');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────
-- ADMIN ROLES & PERMISSIONS
-- ─────────────────────────────────────────

-- Admin users table (extends user_roles)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_role admin_role_type NOT NULL DEFAULT 'support_admin',
  department TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  last_active_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id)
);

-- Admin sessions for secure tracking
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- SYSTEM CONFIGURATION
-- ─────────────────────────────────────────

-- Feature flags for controlling system features
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  description TEXT,
  status feature_status DEFAULT 'enabled',
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  allowed_plans TEXT[] DEFAULT ARRAY['free', 'pro', 'enterprise'],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Accounting modules configuration
CREATE TABLE IF NOT EXISTS public.accounting_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT NOT NULL UNIQUE,
  module_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_enabled BOOLEAN DEFAULT true,
  required_plan TEXT DEFAULT 'free',
  display_order INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- AI USAGE & MONITORING
-- ─────────────────────────────────────────

-- AI conversation logs
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  session_id TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  total_tokens INTEGER DEFAULT 0,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  model TEXT,
  cost_usd DECIMAL(10, 6) DEFAULT 0,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- AI feature configuration
CREATE TABLE IF NOT EXISTS public.ai_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  plan_limits JSONB DEFAULT '{"free": 100, "pro": 1000, "enterprise": 10000}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- SYSTEM MONITORING
-- ─────────────────────────────────────────

-- System health checks
CREATE TABLE IF NOT EXISTS public.system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  status health_status DEFAULT 'healthy',
  latency_ms INTEGER,
  last_check_at TIMESTAMPTZ DEFAULT now(),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Error logs
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_url TEXT,
  request_method TEXT,
  request_body JSONB,
  response_status INTEGER,
  ip_address INET,
  user_agent TEXT,
  severity TEXT DEFAULT 'error',
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity logs (comprehensive audit)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_user_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────

-- System announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- info, warning, success, error
  priority notification_priority DEFAULT 'medium',
  target_audience TEXT DEFAULT 'all', -- all, admins, users, plan:pro, etc.
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_dismissible BOOLEAN DEFAULT true,
  action_url TEXT,
  action_label TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User notification reads
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  dismissed_at TIMESTAMPTZ,
  UNIQUE(announcement_id, user_id)
);

-- ─────────────────────────────────────────
-- DEVELOPER TOOLS
-- ─────────────────────────────────────────

-- API keys for external integrations
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL, -- Hashed API key
  key_prefix TEXT NOT NULL, -- First 8 chars for identification
  scopes TEXT[] DEFAULT ARRAY['read'],
  rate_limit INTEGER DEFAULT 1000, -- Requests per hour
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Webhooks configuration
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT, -- For signature verification
  events TEXT[] NOT NULL, -- Events to subscribe to
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Webhook delivery logs
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempt_count INTEGER DEFAULT 1,
  delivered_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Background jobs
CREATE TABLE IF NOT EXISTS public.background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  job_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  priority INTEGER DEFAULT 0,
  payload JSONB DEFAULT '{}'::jsonb,
  result JSONB,
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- BILLING & REFUNDS
-- ─────────────────────────────────────────

-- Refund requests
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, processed
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(admin_role);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_user ON public.admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_status ON public.feature_flags(status);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_org ON public.ai_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created ON public.ai_conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_created ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON public.error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_unresolved ON public.error_logs(is_resolved) WHERE is_resolved = false;

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_api_keys_org ON public.api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON public.api_keys(key_prefix);

CREATE INDEX IF NOT EXISTS idx_webhooks_org ON public.webhooks(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id);

CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON public.background_jobs(status, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_refund_requests_org ON public.refund_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON public.refund_requests(status);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Admin users can read all admin data
CREATE POLICY "Admins can read admin_users" ON public.admin_users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

-- Super admins can modify admin users
CREATE POLICY "Super admins can manage admin_users" ON public.admin_users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND admin_role = 'super_admin')
  );

-- Anyone can read active announcements
CREATE POLICY "Anyone can read active announcements" ON public.announcements
  FOR SELECT USING (is_active = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now()));

-- Users can read their own announcement reads
CREATE POLICY "Users can manage own announcement reads" ON public.announcement_reads
  FOR ALL USING (user_id = auth.uid());

-- Organizations can manage their own API keys
CREATE POLICY "Orgs can manage own API keys" ON public.api_keys
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()
    )
  );

-- Organizations can manage their own webhooks
CREATE POLICY "Orgs can manage own webhooks" ON public.webhooks
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────
-- FUNCTIONS
-- ─────────────────────────────────────────

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = user_uuid AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get admin role
CREATE OR REPLACE FUNCTION public.get_admin_role(user_uuid UUID DEFAULT auth.uid())
RETURNS admin_role_type AS $$
DECLARE
  role admin_role_type;
BEGIN
  SELECT admin_role INTO role
  FROM public.admin_users
  WHERE user_id = user_uuid AND is_active = true;
  RETURN role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log activity
CREATE OR REPLACE FUNCTION public.log_activity(
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM public.admin_users WHERE user_id = auth.uid();
  
  INSERT INTO public.activity_logs (
    user_id, admin_user_id, action, resource_type, resource_id,
    old_values, new_values, metadata
  ) VALUES (
    auth.uid(), admin_id, p_action, p_resource_type, p_resource_id,
    p_old_values, p_new_values, p_metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────
-- SEED DEFAULT DATA
-- ─────────────────────────────────────────

-- Default feature flags
INSERT INTO public.feature_flags (feature_key, feature_name, description, status, allowed_plans) VALUES
  ('ai_assistant', 'AI Assistant', 'AI-powered financial assistant', 'enabled', ARRAY['pro', 'enterprise']),
  ('receipt_scanning', 'Receipt Scanning', 'OCR-based receipt scanning', 'enabled', ARRAY['pro', 'enterprise']),
  ('bank_import', 'Bank Import', 'Import transactions from banks', 'enabled', ARRAY['free', 'pro', 'enterprise']),
  ('multi_currency', 'Multi-Currency', 'Support for multiple currencies', 'enabled', ARRAY['pro', 'enterprise']),
  ('team_collaboration', 'Team Collaboration', 'Invite team members', 'enabled', ARRAY['pro', 'enterprise']),
  ('api_access', 'API Access', 'External API access', 'enabled', ARRAY['enterprise']),
  ('custom_reports', 'Custom Reports', 'Build custom financial reports', 'beta', ARRAY['enterprise']),
  ('forecasting', 'Financial Forecasting', 'AI-powered forecasting', 'enabled', ARRAY['pro', 'enterprise'])
ON CONFLICT (feature_key) DO NOTHING;

-- Default accounting modules
INSERT INTO public.accounting_modules (module_key, module_name, description, icon, is_enabled, required_plan, display_order) VALUES
  ('invoicing', 'Invoicing', 'Create and manage invoices', 'FileText', true, 'free', 1),
  ('payroll', 'Payroll', 'Employee payroll management', 'Users', true, 'pro', 2),
  ('balance_sheet', 'Balance Sheet', 'View balance sheet reports', 'BarChart3', true, 'free', 3),
  ('cash_book', 'Cash Book', 'Track cash transactions', 'Wallet', true, 'free', 4),
  ('trial_balance', 'Trial Balance', 'Trial balance reports', 'Scale', true, 'pro', 5),
  ('reports_generator', 'Reports Generator', 'Generate custom reports', 'PieChart', true, 'pro', 6),
  ('tax_calculator', 'Tax Calculator', 'Calculate taxes', 'Calculator', true, 'pro', 7),
  ('expense_tracking', 'Expense Tracking', 'Track business expenses', 'Receipt', true, 'free', 8)
ON CONFLICT (module_key) DO NOTHING;

-- Default AI configuration
INSERT INTO public.ai_configuration (config_key, config_value, description, plan_limits) VALUES
  ('chat_enabled', '{"enabled": true, "model": "gpt-4o-mini"}'::jsonb, 'AI chat feature configuration', '{"free": 50, "pro": 500, "enterprise": 5000}'::jsonb),
  ('receipt_scanning', '{"enabled": true, "max_file_size_mb": 10}'::jsonb, 'Receipt scanning configuration', '{"free": 10, "pro": 100, "enterprise": 1000}'::jsonb),
  ('transaction_categorization', '{"enabled": true, "auto_categorize": true}'::jsonb, 'Auto-categorize transactions', '{"free": 100, "pro": 1000, "enterprise": 10000}'::jsonb)
ON CONFLICT (config_key) DO NOTHING;

-- Insert initial system health records
INSERT INTO public.system_health (service_name, status, latency_ms) VALUES
  ('database', 'healthy', 5),
  ('auth', 'healthy', 10),
  ('storage', 'healthy', 15),
  ('edge_functions', 'healthy', 50),
  ('ai_service', 'healthy', 200),
  ('payment_gateway', 'healthy', 100)
ON CONFLICT DO NOTHING;


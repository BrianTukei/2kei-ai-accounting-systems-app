-- ═══════════════════════════════════════════════════════════════════════════
-- 2K AI Accounting Systems - Admin Bootstrap Fix
-- Allows platform owners to self-register as admins
-- ═══════════════════════════════════════════════════════════════════════════

-- First, let's allow owner emails to insert themselves into admin_users
-- This solves the chicken-and-egg problem of creating the first admin

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Owners can self-register as admin" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view own entry" ON public.admin_users;

-- Policy: Platform owners can insert themselves as admin
-- Uses email matching for owner identification
CREATE POLICY "Owners can self-register as admin" ON public.admin_users
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND (
      -- Check if user's email is an owner email
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email IN ('briantukei1000@gmail.com', 'tukeibrian5@gmail.com')
      )
      -- OR no admins exist yet (first admin bootstrap)
      OR NOT EXISTS (SELECT 1 FROM public.admin_users WHERE is_active = true)
    )
  );

-- Policy: Users can read their own admin entry
CREATE POLICY "Admins can view own entry" ON public.admin_users
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Allow admins to update their own last_active_at
DROP POLICY IF EXISTS "Admins can update own activity" ON public.admin_users;
CREATE POLICY "Admins can update own activity" ON public.admin_users
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────
-- Function to bootstrap admin from owner email
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.bootstrap_admin_if_owner()
RETURNS BOOLEAN AS $$
DECLARE
  owner_emails TEXT[] := ARRAY['briantukei1000@gmail.com', 'tukeibrian5@gmail.com'];
  current_email TEXT;
  current_user_id UUID;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO current_user_id;
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get email
  SELECT email INTO current_email FROM auth.users WHERE id = current_user_id;
  
  -- Check if owner email
  IF NOT (current_email = ANY(owner_emails)) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if already admin
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = current_user_id) THEN
    -- Update to ensure active
    UPDATE public.admin_users 
    SET is_active = true, admin_role = 'super_admin', last_active_at = now()
    WHERE user_id = current_user_id;
    RETURN TRUE;
  END IF;
  
  -- Insert new admin entry
  INSERT INTO public.admin_users (user_id, admin_role, department, permissions, is_active)
  VALUES (current_user_id, 'super_admin', 'Platform', '["*"]'::jsonb, true)
  ON CONFLICT (user_id) DO UPDATE SET
    admin_role = 'super_admin',
    is_active = true,
    last_active_at = now();
  
  -- Also ensure user_roles entry
  INSERT INTO public.user_roles (user_id, role)
  VALUES (current_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.bootstrap_admin_if_owner() TO authenticated;

-- ─────────────────────────────────────────
-- Seed initial feature flags if empty
-- ─────────────────────────────────────────

INSERT INTO public.feature_flags (feature_key, feature_name, description, status, allowed_plans)
VALUES 
  ('ai_assistant', 'AI Financial Assistant', 'Enable AI-powered financial analysis and chat', 'enabled', ARRAY['free', 'pro', 'enterprise']),
  ('receipt_scanner', 'Receipt Scanner', 'Scan and extract data from receipts', 'enabled', ARRAY['pro', 'enterprise']),
  ('recurring_transactions', 'Recurring Transactions', 'Set up automatic recurring entries', 'enabled', ARRAY['free', 'pro', 'enterprise']),
  ('multi_currency', 'Multi-Currency Support', 'Support for multiple currencies', 'enabled', ARRAY['pro', 'enterprise']),
  ('team_collaboration', 'Team Collaboration', 'Invite team members to view/edit', 'enabled', ARRAY['pro', 'enterprise']),
  ('advanced_reports', 'Advanced Reports', 'Generate detailed financial reports', 'enabled', ARRAY['pro', 'enterprise']),
  ('api_access', 'API Access', 'Access accounting data via REST API', 'enabled', ARRAY['enterprise']),
  ('dark_mode', 'Dark Mode', 'Enable dark theme across the app', 'enabled', ARRAY['free', 'pro', 'enterprise'])
ON CONFLICT (feature_key) DO NOTHING;

-- ─────────────────────────────────────────
-- Seed initial accounting modules if empty
-- ─────────────────────────────────────────

INSERT INTO public.accounting_modules (module_key, module_name, description, icon, is_enabled, required_plan, display_order)
VALUES
  ('dashboard', 'Dashboard', 'Overview of financial health', 'LayoutDashboard', true, 'free', 1),
  ('transactions', 'Transactions', 'Track income and expenses', 'ArrowLeftRight', true, 'free', 2),
  ('invoices', 'Invoices', 'Create and manage invoices', 'FileText', true, 'free', 3),
  ('reports', 'Reports', 'Financial statements and reports', 'BarChart3', true, 'free', 4),
  ('payroll', 'Payroll', 'Employee salary management', 'Users', true, 'pro', 5),
  ('bank_import', 'Bank Import', 'Import bank statements', 'Building', true, 'pro', 6),
  ('journal', 'Journal', 'Double-entry bookkeeping', 'BookOpen', true, 'free', 7),
  ('forecast', 'Forecast', 'Financial forecasting', 'TrendingUp', true, 'pro', 8),
  ('ai_assistant', 'AI Assistant', 'AI-powered financial help', 'Bot', true, 'free', 9)
ON CONFLICT (module_key) DO NOTHING;

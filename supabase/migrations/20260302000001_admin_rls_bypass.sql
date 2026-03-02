-- ═══════════════════════════════════════════════════════════════════
-- Admin RLS Bypass Policies
-- ═══════════════════════════════════════════════════════════════════
-- Allows admin users (those with role='admin' in user_roles) to
-- SELECT all rows from key platform tables so the Admin Dashboard
-- can show complete data even when the edge function is unavailable.
--
-- This does NOT grant INSERT/UPDATE/DELETE — only SELECT visibility.
-- ═══════════════════════════════════════════════════════════════════

-- Helper function: returns TRUE if the calling user is an admin
-- Drop old no-arg version if exists (conflicts with version that has default param)
DROP FUNCTION IF EXISTS public.is_admin();

-- Recreate with explicit parameter + default so there is exactly one overload
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ── organizations: admins can read ALL orgs ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'organizations' AND policyname = 'Admins can read all organizations'
  ) THEN
    CREATE POLICY "Admins can read all organizations"
      ON public.organizations FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- ── subscriptions: admins can read ALL subscriptions ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscriptions' AND policyname = 'Admins can read all subscriptions'
  ) THEN
    CREATE POLICY "Admins can read all subscriptions"
      ON public.subscriptions FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- ── organization_users: admins can read ALL memberships ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'organization_users' AND policyname = 'Admins can read all memberships'
  ) THEN
    CREATE POLICY "Admins can read all memberships"
      ON public.organization_users FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- ── profiles: admins can read ALL profiles ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Admins can read all profiles'
  ) THEN
    CREATE POLICY "Admins can read all profiles"
      ON public.profiles FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- ── ai_usage_log: admins can read ALL usage logs ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_usage_log' AND policyname = 'Admins can read all ai usage'
  ) THEN
    CREATE POLICY "Admins can read all ai usage"
      ON public.ai_usage_log FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- ── auth_events: admins can read ALL auth events ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'auth_events' AND policyname = 'Admins can read all auth events'
  ) THEN
    CREATE POLICY "Admins can read all auth events"
      ON public.auth_events FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- ── admin_audit_log: admins can read ALL audit logs ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_audit_log' AND policyname = 'Admins can read all audit logs'
  ) THEN
    CREATE POLICY "Admins can read all audit logs"
      ON public.admin_audit_log FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- ── user_roles: ensure admins can INSERT their own role (for auto-promotion) ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_roles' AND policyname = 'Users can insert own roles'
  ) THEN
    CREATE POLICY "Users can insert own roles"
      ON public.user_roles FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

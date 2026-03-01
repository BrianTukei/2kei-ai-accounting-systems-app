-- ================================================================
-- Setup Admin Role for Platform Owner
-- ================================================================
-- This migration ensures the user_roles table exists and provides
-- a function to grant admin access. Run the INSERT at the bottom
-- with YOUR user ID to activate the admin dashboard.
--
-- IMPORTANT: Only admins can see the Admin Dashboard (/admin).
-- Regular users will NEVER see the admin link or access the page.
-- ================================================================

-- Ensure user_roles table exists (idempotent)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own role (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Users can read own roles'
  ) THEN
    CREATE POLICY "Users can read own roles"
      ON public.user_roles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Allow admins to manage all roles (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Admins can manage all roles'
  ) THEN
    CREATE POLICY "Admins can manage all roles"
      ON public.user_roles FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Bootstrap policy: allow any authenticated user to self-grant admin if NO admin exists yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Bootstrap first admin'
  ) THEN
    CREATE POLICY "Bootstrap first admin"
      ON public.user_roles FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
        AND role = 'admin'
        AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
      );
  END IF;
END $$;

-- Auto-promote owner emails via trigger (runs as table owner, bypasses RLS)
CREATE OR REPLACE FUNCTION public.auto_promote_owner_to_admin()
RETURNS TRIGGER AS $$
DECLARE
  owner_emails TEXT[] := ARRAY['briantukei1000@gmail.com', 'tukeibrian5@gmail.com'];
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
  IF user_email = ANY(owner_emails) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users after insert (when user signs up)
DROP TRIGGER IF EXISTS trigger_auto_promote_owner ON auth.users;
CREATE TRIGGER trigger_auto_promote_owner
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_promote_owner_to_admin();

-- Also auto-promote existing users if they already signed up
DO $$
DECLARE
  owner_emails TEXT[] := ARRAY['briantukei1000@gmail.com', 'tukeibrian5@gmail.com'];
  u RECORD;
BEGIN
  FOR u IN SELECT id FROM auth.users WHERE email = ANY(owner_emails) LOOP
    INSERT INTO public.user_roles (user_id, role)
    VALUES (u.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;
END $$;

-- Create admin_audit_log table if not exists (used by edge function)
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id   UUID REFERENCES auth.users(id),
  action          TEXT NOT NULL,
  target_user_id  UUID,
  details         JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_audit_log' AND policyname = 'Admins can view audit log'
  ) THEN
    CREATE POLICY "Admins can view audit log"
      ON public.admin_audit_log FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- ================================================================
-- 🔑 GRANT YOURSELF ADMIN ACCESS
-- ================================================================
-- Replace '<YOUR_USER_ID>' with your actual Supabase Auth user ID.
-- You can find your user ID in:
--   1. Supabase Dashboard → Authentication → Users → click your user
--   2. Or run: SELECT id, email FROM auth.users WHERE email = 'your@email.com';
--
-- Then run this in the Supabase SQL Editor:
--
--   INSERT INTO public.user_roles (user_id, role)
--   VALUES ('<YOUR_USER_ID>', 'admin')
--   ON CONFLICT (user_id, role) DO NOTHING;
--
-- ================================================================

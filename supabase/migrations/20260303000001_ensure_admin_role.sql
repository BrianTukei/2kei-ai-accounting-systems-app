-- ── Ensure admin role for tukeibrian5@gmail.com ──
-- This migration ensures the primary admin email has proper admin access.
-- It inserts admin roles for both platform owner emails.

DO $$
DECLARE
  owner_emails TEXT[] := ARRAY['tukeibrian5@gmail.com', 'briantukei1000@gmail.com'];
  u RECORD;
BEGIN
  -- For each owner email, create user_roles entry
  FOR u IN 
    SELECT id, email FROM auth.users 
    WHERE email = ANY(owner_emails)
  LOOP
    -- Insert admin role (skip if already exists)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (u.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Also ensure admin_users entry if the table exists
    BEGIN
      INSERT INTO public.admin_users (user_id, admin_role, department, permissions, is_active)
      VALUES (u.id, 'super_admin', 'Platform', '["*"]'::jsonb, true)
      ON CONFLICT (user_id) DO UPDATE SET 
        admin_role = 'super_admin',
        is_active = true,
        permissions = '["*"]'::jsonb;
    EXCEPTION WHEN undefined_table THEN
      -- admin_users table may not exist yet, skip
      NULL;
    END;

    -- Ensure profile exists
    BEGIN
      INSERT INTO public.profiles (id, email, full_name)
      VALUES (u.id, u.email, SPLIT_PART(u.email, '@', 1))
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    RAISE NOTICE 'Admin role ensured for %', u.email;
  END LOOP;
END $$;

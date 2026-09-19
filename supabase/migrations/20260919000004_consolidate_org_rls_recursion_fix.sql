-- Consolidated repair for the live project when older recursive policies remain.
-- Run this migration in Supabase SQL Editor after the previous RLS migrations.

CREATE OR REPLACE FUNCTION public.is_active_org_member(
  _user_id UUID,
  _organization_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE user_id = _user_id
      AND organization_id = _organization_id
      AND invite_accepted = TRUE
  )
  OR EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = _organization_id AND owner_id = _user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_org_member(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_org_member(UUID, UUID) TO authenticated;

-- Remove every known policy that can recursively read organization_users.
DROP POLICY IF EXISTS "org_users_select" ON public.organization_users;
DROP POLICY IF EXISTS "org_users_insert" ON public.organization_users;
DROP POLICY IF EXISTS "org_users_update" ON public.organization_users;
DROP POLICY IF EXISTS "Admins can read all memberships" ON public.organization_users;

-- These policies never query organization_users directly.
CREATE POLICY "org_users_select_own"
  ON public.organization_users FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "org_users_insert_safe"
  ON public.organization_users FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_active_org_member(auth.uid(), organization_id)
  );

CREATE POLICY "org_users_update_safe"
  ON public.organization_users FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_active_org_member(auth.uid(), organization_id)
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_active_org_member(auth.uid(), organization_id)
  );

DROP POLICY IF EXISTS "transactions_org_isolation" ON public.transactions;
DROP POLICY IF EXISTS "transactions_owner_isolation" ON public.transactions;
CREATE POLICY "transactions_owner_isolation"
  ON public.transactions FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    AND public.is_active_org_member(auth.uid(), organization_id)
  )
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_active_org_member(auth.uid(), organization_id)
  );

DROP POLICY IF EXISTS "invoices_org_isolation" ON public.invoices;
DROP POLICY IF EXISTS "invoices_owner_isolation" ON public.invoices;
CREATE POLICY "invoices_owner_isolation"
  ON public.invoices FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    AND public.is_active_org_member(auth.uid(), organization_id)
  )
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_active_org_member(auth.uid(), organization_id)
  );

-- Fix PostgreSQL RLS recursion caused by policies querying organization_users
-- through another policy on organization_users.

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
    SELECT 1
    FROM public.organization_users
    WHERE user_id = _user_id
      AND organization_id = _organization_id
      AND invite_accepted = TRUE
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_org_member(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_org_member(UUID, UUID) TO authenticated;

-- Do not query organization_users directly from its own policy.
DROP POLICY IF EXISTS "org_users_select" ON public.organization_users;
CREATE POLICY "org_users_select"
  ON public.organization_users FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_active_org_member(auth.uid(), organization_id)
  );

DROP POLICY IF EXISTS "transactions_owner_isolation" ON public.transactions;
DROP POLICY IF EXISTS "transactions_org_isolation" ON public.transactions;
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

DROP POLICY IF EXISTS "invoices_owner_isolation" ON public.invoices;
DROP POLICY IF EXISTS "invoices_org_isolation" ON public.invoices;
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

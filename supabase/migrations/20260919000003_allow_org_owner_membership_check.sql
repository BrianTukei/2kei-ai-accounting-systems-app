-- Allow the organization owner to pass the tenant boundary even if an older
-- onboarding flow failed to create the owner membership row.
-- This remains scoped to the authenticated user's own organization.

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
  )
  OR EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = _organization_id
      AND owner_id = _user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_org_member(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_org_member(UUID, UUID) TO authenticated;

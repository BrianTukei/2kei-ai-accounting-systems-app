-- Enforce per-user ownership for the core accounting tables.
-- Organization membership remains a second boundary so Company A cannot access
-- Company B, while a platform admin is not implicitly an accounting owner.

DROP POLICY IF EXISTS "transactions_org_isolation" ON public.transactions;
CREATE POLICY "transactions_owner_isolation"
  ON public.transactions FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  );

DROP POLICY IF EXISTS "invoices_org_isolation" ON public.invoices;
CREATE POLICY "invoices_owner_isolation"
  ON public.invoices FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  );

-- Receipts already use user_id ownership. Keep the policy explicit and
-- idempotent for environments where the table was created by another migration.
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own receipts" ON public.receipts;
CREATE POLICY "Users can view their own receipts"
  ON public.receipts FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert their own receipts" ON public.receipts;
CREATE POLICY "Users can insert their own receipts"
  ON public.receipts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update their own receipts" ON public.receipts;
CREATE POLICY "Users can update their own receipts"
  ON public.receipts FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can delete their own receipts" ON public.receipts;
CREATE POLICY "Users can delete their own receipts"
  ON public.receipts FOR DELETE TO authenticated USING (user_id = auth.uid());

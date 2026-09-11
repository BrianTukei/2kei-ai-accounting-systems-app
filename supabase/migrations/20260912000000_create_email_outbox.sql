-- Per-recipient email outbox and delivery-attempt history.
-- SMTP providers can confirm acceptance/rejection, but final mailbox delivery
-- requires provider webhooks and is not guaranteed by SMTP sendMail().

CREATE TABLE IF NOT EXISTS public.email_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('accepted', 'rejected', 'failed', 'pending')),
  provider TEXT NOT NULL DEFAULT 'gmail-smtp',
  provider_message_id TEXT,
  provider_accepted JSONB NOT NULL DEFAULT '[]'::jsonb,
  provider_rejected JSONB NOT NULL DEFAULT '[]'::jsonb,
  provider_pending JSONB NOT NULL DEFAULT '[]'::jsonb,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_outbox_created_at
  ON public.email_outbox(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_outbox_status
  ON public.email_outbox(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_outbox_recipient
  ON public.email_outbox(recipient_email, created_at DESC);

ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage email outbox" ON public.email_outbox;

CREATE POLICY "Service role can manage email outbox"
  ON public.email_outbox
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

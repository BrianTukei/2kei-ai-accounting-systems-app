-- Preserve provider evidence for every broadcast attempt. A provider acceptance
-- means the message was queued by the provider, not delivered to the mailbox.
ALTER TABLE public.email_outbox
  ADD COLUMN IF NOT EXISTS broadcast_id UUID REFERENCES public.broadcasts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS provider_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ;

ALTER TABLE public.email_outbox
  DROP CONSTRAINT IF EXISTS email_outbox_status_check;

ALTER TABLE public.email_outbox
  ADD CONSTRAINT email_outbox_status_check
  CHECK (status IN ('accepted', 'rejected', 'failed', 'pending', 'delivered', 'bounced', 'complained'));

CREATE INDEX IF NOT EXISTS idx_email_outbox_broadcast_id
  ON public.email_outbox(broadcast_id, created_at DESC);

COMMENT ON COLUMN public.email_outbox.status IS
  'Provider state: accepted means queued by provider; delivered/bounced require provider webhook confirmation.';

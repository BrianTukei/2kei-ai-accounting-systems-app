-- Broadcasts Table for Email History, Scheduling & Metrics
-- Creates a comprehensive schema for SaaS-grade broadcast emailing

CREATE TABLE IF NOT EXISTS public.broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                            -- Internal broadcast name (e.g. "Monthly Update")
  subject TEXT NOT NULL,                         -- Email subject line
  message TEXT NOT NULL,                         -- Email content (HTML/Rich Text)
  
  recipient_group TEXT NOT NULL,                 -- e.g. 'all', 'subscribers', 'active_customers', 'inactive', 'specific'
  specific_recipients JSONB DEFAULT '[]'::jsonb, -- Array of specific emails or user IDs if 'specific' is selected
  filters JSONB DEFAULT '{}'::jsonb,             -- Stored filters if used (e.g. { "unpaid_invoices": true })
  
  status TEXT NOT NULL DEFAULT 'draft',          -- draft, scheduled, processing, sent, failed
  
  scheduled_at TIMESTAMPTZ,                      -- When the broadcast should be sent
  sent_at TIMESTAMPTZ,                           -- When the broadcast was actually sent
  
  created_by UUID REFERENCES auth.users(id),     -- Admin who created the broadcast
  
  attachments JSONB DEFAULT '[]'::jsonb,         -- Array of attachment URLs/paths
  
  -- Metrics
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  unsubscribe_count INTEGER DEFAULT 0,
  
  open_rate NUMERIC(5,2) DEFAULT 0,
  click_rate NUMERIC(5,2) DEFAULT 0,
  
  -- Delivery Settings
  settings JSONB DEFAULT '{
    "track_opens": true,
    "track_clicks": true,
    "stop_on_bounce_limit": true,
    "allow_unsubscribe": true,
    "batch_size": 100
  }'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying history and scheduling jobs
CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON public.broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_broadcasts_scheduled_at ON public.broadcasts(scheduled_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_broadcasts_mod_time()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_broadcasts_mod_time
BEFORE UPDATE ON public.broadcasts
FOR EACH ROW
EXECUTE FUNCTION update_broadcasts_mod_time();

-- Add RLS Policies
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins have full access to broadcasts" ON public.broadcasts
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

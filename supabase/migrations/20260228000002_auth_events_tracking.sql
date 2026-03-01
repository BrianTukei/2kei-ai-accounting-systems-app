-- ================================================================
-- Auth Events Tracking
-- ================================================================
-- Tracks user login and logout events for admin visibility.
-- Admins can see all events; users can only see their own.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.auth_events (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN ('login', 'logout', 'token_refresh', 'signup')),
  ip_address  TEXT,
  user_agent  TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by user and time
CREATE INDEX IF NOT EXISTS idx_auth_events_user_id ON public.auth_events(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON public.auth_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_events_type ON public.auth_events(event_type);

-- Enable RLS
ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'auth_events' AND policyname = 'Users can read own auth events'
  ) THEN
    CREATE POLICY "Users can read own auth events"
      ON public.auth_events FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can insert their own events (for client-side logging)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'auth_events' AND policyname = 'Users can insert own auth events'
  ) THEN
    CREATE POLICY "Users can insert own auth events"
      ON public.auth_events FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Admins can read all events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'auth_events' AND policyname = 'Admins can read all auth events'
  ) THEN
    CREATE POLICY "Admins can read all auth events"
      ON public.auth_events FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

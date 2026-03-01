-- ═══════════════════════════════════════════════════════════════════════════
-- 2KEI AI Accounting - Enhanced Auth Events for Admin Dashboard
-- Adds additional fields for comprehensive login audit tracking
-- ═══════════════════════════════════════════════════════════════════════════

-- Add new columns to auth_events if they don't exist
DO $$ 
BEGIN
  -- Add user_email column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'auth_events' AND column_name = 'user_email') THEN
    ALTER TABLE public.auth_events ADD COLUMN user_email TEXT;
  END IF;

  -- Add device_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'auth_events' AND column_name = 'device_type') THEN
    ALTER TABLE public.auth_events ADD COLUMN device_type TEXT;
  END IF;

  -- Add browser column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'auth_events' AND column_name = 'browser') THEN
    ALTER TABLE public.auth_events ADD COLUMN browser TEXT;
  END IF;

  -- Add os column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'auth_events' AND column_name = 'os') THEN
    ALTER TABLE public.auth_events ADD COLUMN os TEXT;
  END IF;

  -- Add country column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'auth_events' AND column_name = 'country') THEN
    ALTER TABLE public.auth_events ADD COLUMN country TEXT;
  END IF;

  -- Add city column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'auth_events' AND column_name = 'city') THEN
    ALTER TABLE public.auth_events ADD COLUMN city TEXT;
  END IF;
END $$;

-- Update event_type check constraint to include more event types
DO $$
BEGIN
  ALTER TABLE public.auth_events DROP CONSTRAINT IF EXISTS auth_events_event_type_check;
  ALTER TABLE public.auth_events ADD CONSTRAINT auth_events_event_type_check 
    CHECK (event_type IN ('login', 'logout', 'token_refresh', 'signup', 'password_reset', 'failed_login'));
EXCEPTION WHEN others THEN NULL;
END $$;

-- Create index on user_email for faster searches
CREATE INDEX IF NOT EXISTS idx_auth_events_email ON public.auth_events(user_email);

-- ─────────────────────────────────────────
-- Function to log auth events
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_auth_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.auth_events (
    user_id, event_type, ip_address, user_agent, user_email, metadata
  ) VALUES (
    p_user_id, p_event_type, p_ip_address, p_user_agent, p_user_email, p_metadata
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────
-- Update RLS for admin_users table access
-- ─────────────────────────────────────────

-- Allow admins from admin_users table to read all auth events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'auth_events' AND policyname = 'Admin users can read all auth events'
  ) THEN
    CREATE POLICY "Admin users can read all auth events"
      ON public.auth_events FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.admin_users
          WHERE user_id = auth.uid() AND is_active = true
        )
      );
  END IF;
END $$;

-- ─────────────────────────────────────────
-- Add AI usage log table if not exists
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL,
  model TEXT,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10, 6) DEFAULT 0,
  duration_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user ON public.ai_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_created ON public.ai_usage_log(created_at DESC);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Users can see their own AI usage
CREATE POLICY IF NOT EXISTS "Users can view own AI usage" ON public.ai_usage_log
  FOR SELECT USING (user_id = auth.uid());

-- Admins can see all AI usage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_usage_log' AND policyname = 'Admins can view all AI usage'
  ) THEN
    CREATE POLICY "Admins can view all AI usage"
      ON public.ai_usage_log FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.admin_users
          WHERE user_id = auth.uid() AND is_active = true
        )
      );
  END IF;
END $$;

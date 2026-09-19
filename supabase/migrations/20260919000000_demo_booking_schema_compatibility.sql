-- Normalize legacy demo booking schemas before the public booking endpoint uses them.
-- This migration is additive and safe for projects created from any earlier schema.

CREATE TABLE IF NOT EXISTS public.demo_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company_name VARCHAR(200),
  phone VARCHAR(50),
  website VARCHAR(255),
  preferred_date DATE NOT NULL,
  preferred_time TIME,
  timezone VARCHAR(50) DEFAULT 'UTC',
  message TEXT,
  source VARCHAR(50) DEFAULT 'website',
  status VARCHAR(50) DEFAULT 'pending',
  meeting_platform VARCHAR(50) DEFAULT 'zoom',
  duration INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.demo_bookings
  ADD COLUMN IF NOT EXISTS preferred_time TIME,
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS website VARCHAR(255),
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS meeting_platform VARCHAR(50) DEFAULT 'zoom',
  ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Older migrations used different names. Preserve existing values when present.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'demo_bookings' AND column_name = 'business_name') THEN
    EXECUTE 'UPDATE public.demo_bookings SET company_name = COALESCE(company_name, business_name) WHERE company_name IS NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'demo_bookings' AND column_name = 'notes') THEN
    EXECUTE 'UPDATE public.demo_bookings SET message = COALESCE(message, notes) WHERE message IS NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'demo_bookings' AND column_name = 'platform') THEN
    EXECUTE 'UPDATE public.demo_bookings SET meeting_platform = COALESCE(meeting_platform, platform) WHERE meeting_platform IS NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'demo_bookings' AND column_name = 'date') THEN
    EXECUTE 'UPDATE public.demo_bookings SET preferred_date = COALESCE(preferred_date, date::date) WHERE preferred_date IS NULL';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_demo_bookings_preferred_slot
  ON public.demo_bookings(preferred_date, preferred_time, status);

ALTER TABLE public.demo_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS demo_bookings_public_insert ON public.demo_bookings;
CREATE POLICY demo_bookings_public_insert
  ON public.demo_bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
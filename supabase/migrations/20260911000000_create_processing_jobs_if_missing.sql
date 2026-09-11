-- Ensure the background receipt-processing queue exists in environments
-- where the broader production resilience migration was not applied.

DO $job_status$
BEGIN
  CREATE TYPE public.job_status AS ENUM (
    'queued',
    'processing',
    'retrying',
    'completed',
    'failed',
    'review_required'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $job_status$;

CREATE TABLE IF NOT EXISTS public.processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  status public.job_status NOT NULL DEFAULT 'queued',
  progress_percentage INT NOT NULL DEFAULT 0,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_retry_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  result_payload JSONB,
  error_payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_queue
  ON public.processing_jobs(status, next_retry_time)
  WHERE status IN ('queued', 'retrying');

CREATE OR REPLACE FUNCTION public.update_processing_jobs_modtime()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $processing_jobs_modtime$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$processing_jobs_modtime$;

DROP TRIGGER IF EXISTS update_processing_jobs_modtime ON public.processing_jobs;

CREATE TRIGGER update_processing_jobs_modtime
  BEFORE UPDATE ON public.processing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_processing_jobs_modtime();

ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage processing jobs" ON public.processing_jobs;

CREATE POLICY "Service role can manage processing jobs"
  ON public.processing_jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

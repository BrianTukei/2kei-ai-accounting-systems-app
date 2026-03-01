-- Email Verification Tokens Table
-- Stores secure tokens for email verification with expiration

CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only allow service role to manage tokens for security
CREATE POLICY "Service role can manage verification tokens"
  ON public.email_verification_tokens
  FOR ALL
  USING (false);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON public.email_verification_tokens(expires_at);

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.email_verification_tokens 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a verification token
CREATE OR REPLACE FUNCTION public.create_verification_token(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  target_user_id UUID;
  verification_token TEXT;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = user_email AND email_confirmed_at IS NULL;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found or already verified';
  END IF;
  
  -- Generate secure token
  verification_token := encode(gen_random_bytes(32), 'base64url');
  
  -- Delete any existing tokens for this user
  DELETE FROM public.email_verification_tokens WHERE user_id = target_user_id;
  
  -- Insert new token (expires in 24 hours)
  INSERT INTO public.email_verification_tokens (user_id, token, expires_at)
  VALUES (target_user_id, verification_token, NOW() + INTERVAL '24 hours');
  
  RETURN verification_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify token
CREATE OR REPLACE FUNCTION public.verify_email_token(token_value TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
  token_exists BOOLEAN := FALSE;
BEGIN
  -- Check if token exists and is valid
  SELECT user_id INTO target_user_id
  FROM public.email_verification_tokens 
  WHERE token = token_value 
    AND expires_at > NOW() 
    AND used_at IS NULL;
  
  IF target_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Mark token as used
  UPDATE public.email_verification_tokens 
  SET used_at = NOW() 
  WHERE token = token_value;
  
  -- Mark user email as confirmed in auth.users
  UPDATE auth.users 
  SET email_confirmed_at = NOW() 
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create pricing plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  monthly_price DECIMAL(10, 2) NOT NULL,
  yearly_price DECIMAL(10, 2),
  transaction_limit INT,
  features JSONB,
  display_order INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES pricing_plans(id),
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  grace_period_end DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'paused')),
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, status)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'UGX',
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('mobile_money', 'card', 'bank_transfer')),
  provider VARCHAR(50), -- 'mtn', 'airtel', 'stripe', etc.
  phone_number VARCHAR(20),
  transaction_reference VARCHAR(100) UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  metadata JSONB, -- Store provider-specific data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create monthly usage tracking table
CREATE TABLE IF NOT EXISTS monthly_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  transaction_count INT DEFAULT 0,
  ai_requests_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

-- Create AI credits table
CREATE TABLE IF NOT EXISTS ai_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_purchased DECIMAL(10, 2) DEFAULT 0,
  total_used DECIMAL(10, 2) DEFAULT 0,
  last_refilled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create AI usage history table
CREATE TABLE IF NOT EXISTS ai_usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature VARCHAR(100) NOT NULL, -- 'receipt_scanning', 'categorization', 'banking_import', etc.
  credits_used DECIMAL(10, 2) NOT NULL,
  request_data JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create transactions table (for payment processing)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  amount_after_fee DECIMAL(10, 2),
  fee DECIMAL(10, 2),
  fee_percentage DECIMAL(5, 2),
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('subscription_payment', 'credit_purchase', 'refund')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  provider_reference VARCHAR(150),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create demo bookings table
CREATE TABLE IF NOT EXISTS demo_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  business_name VARCHAR(255),
  preferred_date DATE NOT NULL,
  timezone VARCHAR(50),
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'canceled')),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create billing history table
CREATE TABLE IF NOT EXISTS billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  action VARCHAR(100) NOT NULL, -- 'upgraded', 'downgraded', 'renewed', 'canceled'
  from_plan VARCHAR(50),
  to_plan VARCHAR(50),
  amount DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_monthly_usage_user_id ON monthly_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_credits_user_id ON ai_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_demo_bookings_status ON demo_bookings(status);
CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON billing_history(user_id);

-- Insert default pricing plans
INSERT INTO pricing_plans (name, slug, description, monthly_price, yearly_price, transaction_limit, features, display_order) VALUES
('Free', 'free', 'Perfect for getting started', 0, 0, 50, '{"transactions": 50, "reports": ["basic"], "support": "community", "ai_features": false, "multi_user": 1}', 1),
('Starter', 'starter', 'For small businesses', 15000, 150000, NULL, '{"transactions": 999999, "reports": ["income", "expenses", "balance"], "support": "email", "ai_features": true, "multi_user": 1, "ai_credits": 100000}', 2),
('Business', 'business', 'For growing companies', 75000, 750000, NULL, '{"transactions": 999999, "reports": ["full"], "support": "priority", "ai_features": true, "multi_user": 5, "ai_credits": 1000000}', 3),
('Enterprise', 'enterprise', 'Custom pricing for large organizations', 0, 0, NULL, '{"transactions": 999999, "reports": ["full", "custom"], "support": "dedicated", "ai_features": true, "multi_user": 999, "ai_credits": 999999999, "crm": true}', 4);
-- Creates a basic profiles table to store user metadata and avatar URL
-- Run this in the Supabase SQL editor or via your migration tooling.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Optional: keep updated_at current on update
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql stable;

create trigger update_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

-- RLS: allow authenticated users to insert/update their own profile
alter table public.profiles enable row level security;

create policy "profiles_is_owner"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Storage note: Create a bucket named `avatars` (public) in the Supabase Storage UI.
-- You can make the bucket public or use signed URLs; the client code expects a public URL.
-- SQL to create a public bucket isn't available via SQL; create it in the Supabase dashboard:
-- Storage -> Buckets -> New bucket -> Name: avatars -> Public: true (optional)
-- Admin Messages Table for Real-Time User Communication
CREATE TABLE IF NOT EXISTS admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dismissed_at TIMESTAMP WITH TIME ZONE
);

-- Index for quick message retrieval and filtering
CREATE INDEX IF NOT EXISTS idx_admin_messages_user_id_status 
  ON admin_messages(user_id, status);

CREATE INDEX IF NOT EXISTS idx_admin_messages_created_at 
  ON admin_messages(created_at DESC);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_admin_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_messages_update_trigger
  BEFORE UPDATE ON admin_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_messages_updated_at();

-- Enable RLS
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own messages
DROP POLICY IF EXISTS admin_messages_user_select ON admin_messages; CREATE POLICY admin_messages_user_select ON admin_messages
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can dismiss their own messages
DROP POLICY IF EXISTS admin_messages_user_update ON admin_messages; CREATE POLICY admin_messages_user_update ON admin_messages
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Admins can insert messages
DROP POLICY IF EXISTS admin_messages_admin_insert ON admin_messages; CREATE POLICY admin_messages_admin_insert ON admin_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policy: Admins can view all messages
DROP POLICY IF EXISTS admin_messages_admin_select ON admin_messages; CREATE POLICY admin_messages_admin_select ON admin_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================
-- Forex Rates Historical Table for Real-Time Tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS forex_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(18, 8) NOT NULL,
  change_percent DECIMAL(6, 4),
  source VARCHAR(50) DEFAULT 'openexchangerates',
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Composite index for quick rate lookup
CREATE INDEX IF NOT EXISTS idx_forex_rates_currency_pair 
  ON forex_rates(from_currency, to_currency, fetched_at DESC);

CREATE INDEX IF NOT EXISTS idx_forex_rates_fetched_at 
  ON forex_rates(fetched_at DESC);

-- Enable RLS (public read)
ALTER TABLE forex_rates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read forex rates
DROP POLICY IF EXISTS forex_rates_public_select ON forex_rates; CREATE POLICY forex_rates_public_select ON forex_rates
  FOR SELECT USING (true);

-- RLS Policy: Service role can insert rates
DROP POLICY IF EXISTS forex_rates_service_insert ON forex_rates; CREATE POLICY forex_rates_service_insert ON forex_rates
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- Transaction Forex History Table
-- ============================================================

CREATE TABLE IF NOT EXISTS transaction_forex_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL,
  original_amount DECIMAL(18, 2) NOT NULL,
  original_currency VARCHAR(3) NOT NULL,
  converted_amount DECIMAL(18, 2) NOT NULL,
  converted_currency VARCHAR(3) NOT NULL,
  exchange_rate DECIMAL(18, 8) NOT NULL,
  rate_source VARCHAR(50),
  snapshot_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for transaction lookups
CREATE INDEX IF NOT EXISTS idx_transaction_forex_history_transaction_id 
  ON transaction_forex_history(transaction_id, snapshot_at DESC);

CREATE INDEX IF NOT EXISTS idx_transaction_forex_history_snapshot_at 
  ON transaction_forex_history(snapshot_at DESC);

-- Enable RLS
ALTER TABLE transaction_forex_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their transaction forex history
DROP POLICY IF EXISTS transaction_forex_history_select ON transaction_forex_history; CREATE POLICY transaction_forex_history_select ON transaction_forex_history
  FOR SELECT USING (true);

-- ============================================================
-- Comments for documentation
-- ============================================================

COMMENT ON TABLE admin_messages IS 'Stores messages sent by admins to users for announcements and notifications';
COMMENT ON TABLE forex_rates IS 'Stores historical exchange rates for reporting and analytics';
COMMENT ON TABLE transaction_forex_history IS 'Tracks forex rate changes for transactions over time';

COMMENT ON COLUMN admin_messages.status IS 'active, archived, deleted';
COMMENT ON COLUMN forex_rates.source IS 'openexchangerates, exchangerate-api, fixer, or historical';
COMMENT ON COLUMN transaction_forex_history.rate_source IS 'Source of the exchange rate used';
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
-- AI Assistant Database Schema
-- Stores chat conversations and messages for the AI accounting assistant

-- Chat Conversations Table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  context_type TEXT, -- 'general', 'report', 'transaction', etc.
  context_data JSONB, -- Related report data, transaction IDs, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB, -- Store additional data like report references, calculations, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Insights Table - Store AI-generated insights about user's financial data
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'expense_trend', 'cash_flow_alert', 'profitability_insight', etc.
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB, -- Supporting calculations and data
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_read BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ, -- Optional expiration for time-sensitive insights
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_conversations
CREATE POLICY "Users can manage their own conversations"
  ON public.ai_conversations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ai_messages  
CREATE POLICY "Users can view messages in their conversations"
  ON public.ai_messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON public.ai_messages
  FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for ai_insights
CREATE POLICY "Users can view their own insights"
  ON public.ai_insights
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert insights"
  ON public.ai_insights
  FOR INSERT
  WITH CHECK (true); -- Allow service role to insert

CREATE POLICY "Users can update their own insights"
  ON public.ai_insights
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated_at ON public.ai_conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON public.ai_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON public.ai_insights(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_is_read ON public.ai_insights(is_read);

-- Updated_at trigger for conversations
CREATE OR REPLACE FUNCTION public.update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_updated_at();

-- Function to create a new conversation
CREATE OR REPLACE FUNCTION public.create_ai_conversation(
  p_user_id UUID,
  p_title TEXT DEFAULT 'New Conversation',
  p_context_type TEXT DEFAULT NULL,
  p_context_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  INSERT INTO public.ai_conversations (user_id, title, context_type, context_data)
  VALUES (p_user_id, p_title, p_context_type, p_context_data)
  RETURNING id INTO conversation_id;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add message to conversation
CREATE OR REPLACE FUNCTION public.add_ai_message(
  p_conversation_id UUID,
  p_role TEXT,
  p_content TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  message_id UUID;
BEGIN
  -- Verify user owns the conversation
  IF NOT EXISTS (
    SELECT 1 FROM public.ai_conversations 
    WHERE id = p_conversation_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Conversation not found or access denied';
  END IF;
  
  INSERT INTO public.ai_messages (conversation_id, role, content, metadata)
  VALUES (p_conversation_id, p_role, p_content, p_metadata)
  RETURNING id INTO message_id;
  
  -- Update conversation timestamp
  UPDATE public.ai_conversations 
  SET updated_at = NOW() 
  WHERE id = p_conversation_id;
  
  RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversation with recent messages
CREATE OR REPLACE FUNCTION public.get_conversation_with_messages(
  p_conversation_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  conversation_id UUID,
  conversation_title TEXT,
  conversation_context_type TEXT,
  conversation_context_data JSONB,
  message_id UUID,
  message_role TEXT,
  message_content TEXT,
  message_metadata JSONB,
  message_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.context_type,
    c.context_data,
    m.id,
    m.role,
    m.content,
    m.metadata,
    m.created_at
  FROM public.ai_conversations c
  LEFT JOIN public.ai_messages m ON c.id = m.conversation_id
  WHERE c.id = p_conversation_id 
    AND c.user_id = auth.uid()
  ORDER BY m.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old insights
CREATE OR REPLACE FUNCTION public.cleanup_expired_insights()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.ai_insights 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create receipts table
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  items JSONB,
  subtotal NUMERIC,
  tax_amount NUMERIC,
  receipt_number TEXT,
  payment_method TEXT,
  confidence_score NUMERIC,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own receipts"
  ON public.receipts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own receipts"
  ON public.receipts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipts"
  ON public.receipts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipts"
  ON public.receipts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for receipt images
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload their own receipt images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own receipt images"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own receipt images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can view receipt images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'receipts');
-- Fix function search path security issue
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS set_updated_at ON public.receipts;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
-- Create role enum
DROP TYPE IF EXISTS public.app_role CASCADE; CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
-- ============================================================
-- INVOICES, INVOICE ITEMS, PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  client_name   TEXT NOT NULL,
  client_email  TEXT,
  client_address TEXT,
  issue_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date      DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  subtotal      NUMERIC NOT NULL DEFAULT 0,
  tax_rate      NUMERIC NOT NULL DEFAULT 0,
  tax_amount    NUMERIC NOT NULL DEFAULT 0,
  discount      NUMERIC NOT NULL DEFAULT 0,
  total         NUMERIC NOT NULL DEFAULT 0,
  notes         TEXT,
  currency      TEXT NOT NULL DEFAULT 'USD',
  paid_at       TIMESTAMPTZ,
  payment_method TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  quantity      NUMERIC NOT NULL DEFAULT 1,
  unit_price    NUMERIC NOT NULL DEFAULT 0,
  total         NUMERIC NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount        NUMERIC NOT NULL,
  payment_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  reference     TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BANK IMPORTS & IMPORTED TRANSACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bank_imports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,
  file_type     TEXT NOT NULL,   -- 'csv', 'excel', 'pdf'
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','processing','reviewed','posted','failed')),
  total_rows    INTEGER DEFAULT 0,
  imported_rows INTEGER DEFAULT 0,
  duplicate_rows INTEGER DEFAULT 0,
  hash          TEXT,            -- SHA-256 of file content to prevent re-import
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.imported_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id     UUID NOT NULL REFERENCES public.bank_imports(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  description   TEXT NOT NULL,
  debit         NUMERIC DEFAULT 0,
  credit        NUMERIC DEFAULT 0,
  balance       NUMERIC,
  ai_category   TEXT,
  ai_type       TEXT CHECK (ai_type IN ('income','expense')),
  account_code  TEXT,
  is_duplicate  BOOLEAN DEFAULT FALSE,
  is_confirmed  BOOLEAN DEFAULT FALSE,
  transaction_id UUID,           -- FK to transactions table once posted
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.invoices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_imports      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_transactions ENABLE ROW LEVEL SECURITY;

-- invoices
CREATE POLICY "invoices_owner" ON public.invoices FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- invoice_items (via invoice ownership)
CREATE POLICY "invoice_items_owner" ON public.invoice_items FOR ALL
  USING (invoice_id IN (SELECT id FROM public.invoices WHERE user_id = auth.uid()))
  WITH CHECK (invoice_id IN (SELECT id FROM public.invoices WHERE user_id = auth.uid()));

-- invoice_payments (via invoice ownership)
CREATE POLICY "invoice_payments_owner" ON public.invoice_payments FOR ALL
  USING (invoice_id IN (SELECT id FROM public.invoices WHERE user_id = auth.uid()))
  WITH CHECK (invoice_id IN (SELECT id FROM public.invoices WHERE user_id = auth.uid()));

-- bank_imports
CREATE POLICY "bank_imports_owner" ON public.bank_imports FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- imported_transactions
CREATE POLICY "imported_transactions_owner" ON public.imported_transactions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER bank_imports_updated_at
  BEFORE UPDATE ON public.bank_imports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- ============================================================
-- 2K AI Accounting Systems SaaS â€” Multi-Tenant Schema
-- Migration: 20260226000002
-- ============================================================

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 1. Subscription Plans (static, seeded)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id            TEXT PRIMARY KEY,          -- 'free' | 'pro' | 'enterprise'
  name          TEXT NOT NULL,
  description   TEXT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_annual  NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'USD',
  features      JSONB NOT NULL DEFAULT '{}',
  -- Limits
  max_users                  INT NOT NULL DEFAULT 1,
  max_invoices_per_month     INT NOT NULL DEFAULT 10,   -- -1 = unlimited
  max_ai_chats_per_month     INT NOT NULL DEFAULT 20,
  max_bank_imports_per_month INT NOT NULL DEFAULT 2,
  max_businesses             INT NOT NULL DEFAULT 1,
  has_ai_assistant           BOOLEAN NOT NULL DEFAULT FALSE,
  has_advanced_reports       BOOLEAN NOT NULL DEFAULT FALSE,
  has_payroll                BOOLEAN NOT NULL DEFAULT FALSE,
  has_team_access            BOOLEAN NOT NULL DEFAULT FALSE,
  trial_days                 INT NOT NULL DEFAULT 14,
  is_active                  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Seed the three plans
INSERT INTO public.subscription_plans
  (id, name, description, price_monthly, price_annual, max_users,
   max_invoices_per_month, max_ai_chats_per_month, max_bank_imports_per_month,
   max_businesses, has_ai_assistant, has_advanced_reports, has_payroll, has_team_access, trial_days)
VALUES
  ('free', 'Free',
   'Perfect for freelancers and solopreneurs getting started.',
   0, 0, 1, 10, 20, 2, 1, FALSE, FALSE, FALSE, FALSE, 0),

  ('pro', 'Pro',
   'Unlimited invoices, full reports, AI assistant â€” for growing businesses.',
   29, 290, 5, -1, 200, 20, 1, TRUE, TRUE, TRUE, FALSE, 14),

  ('enterprise', 'Enterprise',
   'Multi-user, advanced analytics, priority AI â€” for teams.',
   79, 790, -1, -1, -1, -1, -1, TRUE, TRUE, TRUE, TRUE, 14)
ON CONFLICT (id) DO NOTHING;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 2. Organizations
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS public.organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,           -- URL-safe identifier
  logo_url      TEXT,
  industry      TEXT,
  country       TEXT,
  timezone      TEXT NOT NULL DEFAULT 'UTC',
  currency      TEXT NOT NULL DEFAULT 'USD',
  tax_id        TEXT,
  address       TEXT,
  phone         TEXT,
  website       TEXT,
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 3. Organization Members
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

DROP TYPE IF EXISTS public.org_role CASCADE; CREATE TYPE public.org_role AS ENUM (
  'owner', 'accountant', 'manager', 'viewer'
);

CREATE TABLE IF NOT EXISTS public.organization_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            public.org_role NOT NULL DEFAULT 'viewer',
  invited_by      UUID REFERENCES auth.users(id),
  invite_email    TEXT,
  invite_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  invite_token    TEXT UNIQUE,
  joined_at       TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 4. Subscriptions
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

DROP TYPE IF EXISTS public.sub_status CASCADE; CREATE TYPE public.sub_status AS ENUM (
  'trialing', 'active', 'past_due', 'canceled', 'paused'
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id           TEXT NOT NULL REFERENCES public.subscription_plans(id),
  status            public.sub_status NOT NULL DEFAULT 'trialing',
  billing_cycle     TEXT NOT NULL DEFAULT 'monthly',    -- 'monthly' | 'annual'
  trial_ends_at     TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end   TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  -- Payment provider references
  stripe_customer_id       TEXT,
  stripe_subscription_id   TEXT,
  flutterwave_customer_id  TEXT,
  paystack_customer_id     TEXT,
  payment_provider         TEXT,                         -- 'stripe' | 'flutterwave' | 'paystack'
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (organization_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 5. Billing Events / Invoices
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS public.billing_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,   -- 'payment_succeeded' | 'payment_failed' | 'subscription_updated' etc.
  amount          NUMERIC(10,2),
  currency        TEXT DEFAULT 'USD',
  provider        TEXT,
  provider_event_id TEXT,
  metadata        JSONB,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 6. AI Usage Log (for metering & billing)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action          TEXT NOT NULL,  -- 'chat' | 'invoice_gen' | 'bank_import' | 'categorise'
  tokens_used     INT DEFAULT 0,
  month           TEXT NOT NULL,  -- 'YYYY-MM' for aggregation
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_usage_log_org_month ON public.ai_usage_log(organization_id, month);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 7. Team Invitations
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  role            public.org_role NOT NULL DEFAULT 'viewer',
  token           TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted        BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 8. App Data Tables (Supabase-backed, RLS)
--    These replace localStorage for production
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS public.transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  description     TEXT NOT NULL,
  amount          NUMERIC(14,2) NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('income','expense')),
  category        TEXT,
  date            TEXT NOT NULL,
  payment_method  TEXT,
  reference       TEXT,
  notes           TEXT,
  is_recurring    BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transactions_org ON public.transactions(organization_id);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id),
  invoice_number   TEXT NOT NULL,
  client_name      TEXT NOT NULL,
  client_email     TEXT,
  client_address   TEXT,
  issue_date       TEXT NOT NULL,
  due_date         TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'draft',
  items            JSONB NOT NULL DEFAULT '[]',
  subtotal         NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_rate         NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount         NUMERIC(14,2) NOT NULL DEFAULT 0,
  total            NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes            TEXT,
  currency         TEXT NOT NULL DEFAULT 'USD',
  paid_at          TEXT,
  payment_method   TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (organization_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS invoices_org ON public.invoices(organization_id);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 9. Helper Functions
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Returns the user's active organization_id (first org by created_at)
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_users
  WHERE user_id = _user_id
    AND invite_accepted = TRUE
  ORDER BY created_at
  LIMIT 1
$$;

-- Check if a user has a specific role within an org
CREATE OR REPLACE FUNCTION public.user_org_role(_user_id UUID, _org_id UUID)
RETURNS public.org_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.organization_users
  WHERE user_id = _user_id
    AND organization_id = _org_id
    AND invite_accepted = TRUE
  LIMIT 1
$$;

-- Monthly AI usage count for an org
CREATE OR REPLACE FUNCTION public.ai_usage_this_month(_org_id UUID, _action TEXT DEFAULT NULL)
RETURNS INT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INT
  FROM public.ai_usage_log
  WHERE organization_id = _org_id
    AND month = to_char(now(), 'YYYY-MM')
    AND (_action IS NULL OR action = _action)
$$;

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 10. Row-Level Security Policies
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- organizations: members can see their org; only owner can update
CREATE POLICY "org_members_select"
  ON public.organizations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE organization_id = organizations.id
        AND user_id = auth.uid()
        AND invite_accepted = TRUE
    )
  );

CREATE POLICY "org_owner_insert"
  ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "org_owner_update"
  ON public.organizations FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

-- organization_users: members can see teammates
CREATE POLICY "org_users_select"
  ON public.organization_users FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  );

CREATE POLICY "org_users_insert"
  ON public.organization_users FOR INSERT TO authenticated
  WITH CHECK (
    -- Owner/accountant can add members
    public.user_org_role(auth.uid(), organization_id) IN ('owner','accountant')
    OR user_id = auth.uid()   -- Accept own invite
  );

CREATE POLICY "org_users_update"
  ON public.organization_users FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.user_org_role(auth.uid(), organization_id) = 'owner'
  );

-- subscriptions: org members can view; only system can write
CREATE POLICY "sub_org_select"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  );

-- billing_events: org members can view
CREATE POLICY "billing_events_select"
  ON public.billing_events FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  );

-- ai_usage_log: org members can view; any member can insert their own
CREATE POLICY "ai_usage_select"
  ON public.ai_usage_log FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  );

CREATE POLICY "ai_usage_insert"
  ON public.ai_usage_log FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  );

-- team_invitations: org members can view
CREATE POLICY "invitations_select"
  ON public.team_invitations FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "invitations_insert"
  ON public.team_invitations FOR INSERT TO authenticated
  WITH CHECK (
    public.user_org_role(auth.uid(), organization_id) IN ('owner','accountant')
  );

-- transactions: org-scoped isolation
CREATE POLICY "transactions_org_isolation"
  ON public.transactions FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  );

-- invoices: org-scoped isolation
CREATE POLICY "invoices_org_isolation"
  ON public.invoices FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = TRUE
    )
  );

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 11. Super Admin: bypass RLS function
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;
-- ============================================================
-- Subscription Enhancements Migration
-- Migration: 20260226000003
-- Adds payment tracking and user-level subscription checks
-- ============================================================

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 1. Payment Transactions (for verification tracking)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id),
  plan_id           TEXT NOT NULL REFERENCES public.subscription_plans(id),
  billing_cycle     TEXT NOT NULL DEFAULT 'monthly',
  amount            NUMERIC(14,2) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'USD',
  payment_provider  TEXT,                         -- 'stripe' | 'flutterwave' | 'paystack' | 'demo'
  payment_status    TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  transaction_ref   TEXT UNIQUE,                  -- External provider reference
  checkout_session_id TEXT,                       -- Stripe/other checkout session
  webhook_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  error_message     TEXT,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at      TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS payment_transactions_org_idx ON public.payment_transactions(organization_id);
CREATE INDEX IF NOT EXISTS payment_transactions_status_idx ON public.payment_transactions(payment_status);
CREATE INDEX IF NOT EXISTS payment_transactions_ref_idx ON public.payment_transactions(transaction_ref);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 2. Add last_payment_id to subscriptions
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS last_payment_id UUID REFERENCES public.payment_transactions(id);

ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 3. RLS Policies for payment_transactions
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Users can view their organization's payments
CREATE POLICY "Users can view org payments" ON public.payment_transactions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = true
    )
  );

-- Users can insert payments for their organization
CREATE POLICY "Users can create org payments" ON public.payment_transactions
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND invite_accepted = true
    )
  );

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 4. Function to activate subscription after payment
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE OR REPLACE FUNCTION public.activate_subscription(
  p_organization_id UUID,
  p_plan_id TEXT,
  p_billing_cycle TEXT,
  p_payment_id UUID DEFAULT NULL,
  p_payment_provider TEXT DEFAULT 'demo'
)
RETURNS UUID AS $$
DECLARE
  v_subscription_id UUID;
  v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate period end
  IF p_billing_cycle = 'annual' THEN
    v_period_end := now() + INTERVAL '1 year';
  ELSE
    v_period_end := now() + INTERVAL '1 month';
  END IF;

  -- Upsert subscription
  INSERT INTO public.subscriptions (
    organization_id,
    plan_id,
    status,
    billing_cycle,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    payment_provider,
    last_payment_id,
    activated_at,
    updated_at
  ) VALUES (
    p_organization_id,
    p_plan_id,
    'active',
    p_billing_cycle,
    now(),
    v_period_end,
    false,
    p_payment_provider,
    p_payment_id,
    now(),
    now()
  )
  ON CONFLICT (organization_id)
  DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = 'active',
    billing_cycle = EXCLUDED.billing_cycle,
    current_period_start = now(),
    current_period_end = v_period_end,
    cancel_at_period_end = false,
    payment_provider = EXCLUDED.payment_provider,
    last_payment_id = EXCLUDED.last_payment_id,
    activated_at = now(),
    updated_at = now()
  RETURNING id INTO v_subscription_id;

  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 5. Function to check user subscription status
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE OR REPLACE FUNCTION public.get_user_subscription_status(p_user_id UUID)
RETURNS TABLE (
  has_active_subscription BOOLEAN,
  subscription_status TEXT,
  plan_id TEXT,
  organization_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.status IN ('active', 'trialing') AS has_active_subscription,
    s.status::TEXT AS subscription_status,
    s.plan_id,
    s.organization_id
  FROM public.subscriptions s
  JOIN public.organization_users ou ON ou.organization_id = s.organization_id
  WHERE ou.user_id = p_user_id
    AND ou.invite_accepted = true
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.activate_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_subscription_status TO authenticated;
-- ================================================================
-- Setup Admin Role for Platform Owner
-- ================================================================
-- This migration ensures the user_roles table exists and provides
-- a function to grant admin access. Run the INSERT at the bottom
-- with YOUR user ID to activate the admin dashboard.
--
-- IMPORTANT: Only admins can see the Admin Dashboard (/admin).
-- Regular users will NEVER see the admin link or access the page.
-- ================================================================

-- Ensure user_roles table exists (idempotent)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own role (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Users can read own roles'
  ) THEN
    CREATE POLICY "Users can read own roles"
      ON public.user_roles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Allow admins to manage all roles (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Admins can manage all roles'
  ) THEN
    CREATE POLICY "Admins can manage all roles"
      ON public.user_roles FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Bootstrap policy: allow any authenticated user to self-grant admin if NO admin exists yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Bootstrap first admin'
  ) THEN
    CREATE POLICY "Bootstrap first admin"
      ON public.user_roles FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
        AND role = 'admin'
        AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
      );
  END IF;
END $$;

-- Auto-promote owner emails via trigger (runs as table owner, bypasses RLS)
CREATE OR REPLACE FUNCTION public.auto_promote_owner_to_admin()
RETURNS TRIGGER AS $$
DECLARE
  owner_emails TEXT[] := ARRAY['briantukei1000@gmail.com', 'tukeibrian5@gmail.com'];
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
  IF user_email = ANY(owner_emails) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users after insert (when user signs up)
DROP TRIGGER IF EXISTS trigger_auto_promote_owner ON auth.users;
CREATE TRIGGER trigger_auto_promote_owner
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_promote_owner_to_admin();

-- Also auto-promote existing users if they already signed up
DO $$
DECLARE
  owner_emails TEXT[] := ARRAY['briantukei1000@gmail.com', 'tukeibrian5@gmail.com'];
  u RECORD;
BEGIN
  FOR u IN SELECT id FROM auth.users WHERE email = ANY(owner_emails) LOOP
    INSERT INTO public.user_roles (user_id, role)
    VALUES (u.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;
END $$;

-- Create admin_audit_log table if not exists (used by edge function)
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id   UUID REFERENCES auth.users(id),
  action          TEXT NOT NULL,
  target_user_id  UUID,
  details         JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_audit_log' AND policyname = 'Admins can view audit log'
  ) THEN
    CREATE POLICY "Admins can view audit log"
      ON public.admin_audit_log FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- ================================================================
-- ðŸ”‘ GRANT YOURSELF ADMIN ACCESS
-- ================================================================
-- Replace '<YOUR_USER_ID>' with your actual Supabase Auth user ID.
-- You can find your user ID in:
--   1. Supabase Dashboard â†’ Authentication â†’ Users â†’ click your user
--   2. Or run: SELECT id, email FROM auth.users WHERE email = 'your@email.com';
--
-- Then run this in the Supabase SQL Editor:
--
--   INSERT INTO public.user_roles (user_id, role)
--   VALUES ('<YOUR_USER_ID>', 'admin')
--   ON CONFLICT (user_id, role) DO NOTHING;
--
-- ================================================================
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
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 2K AI Accounting Systems - Developer Admin Dashboard Schema
-- Complete database schema for enterprise admin system
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- ENUMS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Admin role types
DO $$ BEGIN
  DROP TYPE IF EXISTS admin_role_type CASCADE; CREATE TYPE admin_role_type AS ENUM ('super_admin', 'developer', 'support_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Feature flag status
DO $$ BEGIN
  DROP TYPE IF EXISTS feature_status CASCADE; CREATE TYPE feature_status AS ENUM ('enabled', 'disabled', 'beta', 'deprecated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notification priority
DO $$ BEGIN
  DROP TYPE IF EXISTS notification_priority CASCADE; CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- System health status
DO $$ BEGIN
  DROP TYPE IF EXISTS health_status CASCADE; CREATE TYPE health_status AS ENUM ('healthy', 'degraded', 'down', 'maintenance');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- ADMIN ROLES & PERMISSIONS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Admin users table (extends user_roles)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_role admin_role_type NOT NULL DEFAULT 'support_admin',
  department TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  last_active_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id)
);

-- Admin sessions for secure tracking
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- SYSTEM CONFIGURATION
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Feature flags for controlling system features
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  description TEXT,
  status feature_status DEFAULT 'enabled',
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  allowed_plans TEXT[] DEFAULT ARRAY['free', 'pro', 'enterprise'],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Accounting modules configuration
CREATE TABLE IF NOT EXISTS public.accounting_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT NOT NULL UNIQUE,
  module_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_enabled BOOLEAN DEFAULT true,
  required_plan TEXT DEFAULT 'free',
  display_order INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- AI USAGE & MONITORING
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- AI conversation logs
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  session_id TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  total_tokens INTEGER DEFAULT 0,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  model TEXT,
  cost_usd DECIMAL(10, 6) DEFAULT 0,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- AI feature configuration
CREATE TABLE IF NOT EXISTS public.ai_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  plan_limits JSONB DEFAULT '{"free": 100, "pro": 1000, "enterprise": 10000}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- SYSTEM MONITORING
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- System health checks
CREATE TABLE IF NOT EXISTS public.system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  status health_status DEFAULT 'healthy',
  latency_ms INTEGER,
  last_check_at TIMESTAMPTZ DEFAULT now(),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Error logs
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_url TEXT,
  request_method TEXT,
  request_body JSONB,
  response_status INTEGER,
  ip_address INET,
  user_agent TEXT,
  severity TEXT DEFAULT 'error',
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity logs (comprehensive audit)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_user_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- NOTIFICATIONS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- System announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- info, warning, success, error
  priority notification_priority DEFAULT 'medium',
  target_audience TEXT DEFAULT 'all', -- all, admins, users, plan:pro, etc.
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_dismissible BOOLEAN DEFAULT true,
  action_url TEXT,
  action_label TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User notification reads
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  dismissed_at TIMESTAMPTZ,
  UNIQUE(announcement_id, user_id)
);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- DEVELOPER TOOLS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- API keys for external integrations
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL, -- Hashed API key
  key_prefix TEXT NOT NULL, -- First 8 chars for identification
  scopes TEXT[] DEFAULT ARRAY['read'],
  rate_limit INTEGER DEFAULT 1000, -- Requests per hour
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Webhooks configuration
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT, -- For signature verification
  events TEXT[] NOT NULL, -- Events to subscribe to
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Webhook delivery logs
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempt_count INTEGER DEFAULT 1,
  delivered_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Background jobs
CREATE TABLE IF NOT EXISTS public.background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  job_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  priority INTEGER DEFAULT 0,
  payload JSONB DEFAULT '{}'::jsonb,
  result JSONB,
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- BILLING & REFUNDS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Refund requests
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, processed
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- INDEXES
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(admin_role);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_user ON public.admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_status ON public.feature_flags(status);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_org ON public.ai_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created ON public.ai_conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_created ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON public.error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_unresolved ON public.error_logs(is_resolved) WHERE is_resolved = false;

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_api_keys_org ON public.api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON public.api_keys(key_prefix);

CREATE INDEX IF NOT EXISTS idx_webhooks_org ON public.webhooks(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id);

CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON public.background_jobs(status, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_refund_requests_org ON public.refund_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON public.refund_requests(status);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- ROW LEVEL SECURITY
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Admin users can read all admin data
CREATE POLICY "Admins can read admin_users" ON public.admin_users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

-- Super admins can modify admin users
CREATE POLICY "Super admins can manage admin_users" ON public.admin_users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND admin_role = 'super_admin')
  );

-- Anyone can read active announcements
CREATE POLICY "Anyone can read active announcements" ON public.announcements
  FOR SELECT USING (is_active = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now()));

-- Users can read their own announcement reads
CREATE POLICY "Users can manage own announcement reads" ON public.announcement_reads
  FOR ALL USING (user_id = auth.uid());

-- Organizations can manage their own API keys
CREATE POLICY "Orgs can manage own API keys" ON public.api_keys
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()
    )
  );

-- Organizations can manage their own webhooks
CREATE POLICY "Orgs can manage own webhooks" ON public.webhooks
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()
    )
  );

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- FUNCTIONS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = user_uuid AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get admin role
CREATE OR REPLACE FUNCTION public.get_admin_role(user_uuid UUID DEFAULT auth.uid())
RETURNS admin_role_type AS $$
DECLARE
  role admin_role_type;
BEGIN
  SELECT admin_role INTO role
  FROM public.admin_users
  WHERE user_id = user_uuid AND is_active = true;
  RETURN role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log activity
CREATE OR REPLACE FUNCTION public.log_activity(
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM public.admin_users WHERE user_id = auth.uid();
  
  INSERT INTO public.activity_logs (
    user_id, admin_user_id, action, resource_type, resource_id,
    old_values, new_values, metadata
  ) VALUES (
    auth.uid(), admin_id, p_action, p_resource_type, p_resource_id,
    p_old_values, p_new_values, p_metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- SEED DEFAULT DATA
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Default feature flags
INSERT INTO public.feature_flags (feature_key, feature_name, description, status, allowed_plans) VALUES
  ('ai_assistant', 'AI Assistant', 'AI-powered financial assistant', 'enabled', ARRAY['pro', 'enterprise']),
  ('receipt_scanning', 'Receipt Scanning', 'OCR-based receipt scanning', 'enabled', ARRAY['pro', 'enterprise']),
  ('bank_import', 'Bank Import', 'Import transactions from banks', 'enabled', ARRAY['free', 'pro', 'enterprise']),
  ('multi_currency', 'Multi-Currency', 'Support for multiple currencies', 'enabled', ARRAY['pro', 'enterprise']),
  ('team_collaboration', 'Team Collaboration', 'Invite team members', 'enabled', ARRAY['pro', 'enterprise']),
  ('api_access', 'API Access', 'External API access', 'enabled', ARRAY['enterprise']),
  ('custom_reports', 'Custom Reports', 'Build custom financial reports', 'beta', ARRAY['enterprise']),
  ('forecasting', 'Financial Forecasting', 'AI-powered forecasting', 'enabled', ARRAY['pro', 'enterprise'])
ON CONFLICT (feature_key) DO NOTHING;

-- Default accounting modules
INSERT INTO public.accounting_modules (module_key, module_name, description, icon, is_enabled, required_plan, display_order) VALUES
  ('invoicing', 'Invoicing', 'Create and manage invoices', 'FileText', true, 'free', 1),
  ('payroll', 'Payroll', 'Employee payroll management', 'Users', true, 'pro', 2),
  ('balance_sheet', 'Balance Sheet', 'View balance sheet reports', 'BarChart3', true, 'free', 3),
  ('cash_book', 'Cash Book', 'Track cash transactions', 'Wallet', true, 'free', 4),
  ('trial_balance', 'Trial Balance', 'Trial balance reports', 'Scale', true, 'pro', 5),
  ('reports_generator', 'Reports Generator', 'Generate custom reports', 'PieChart', true, 'pro', 6),
  ('tax_calculator', 'Tax Calculator', 'Calculate taxes', 'Calculator', true, 'pro', 7),
  ('expense_tracking', 'Expense Tracking', 'Track business expenses', 'Receipt', true, 'free', 8)
ON CONFLICT (module_key) DO NOTHING;

-- Default AI configuration
INSERT INTO public.ai_configuration (config_key, config_value, description, plan_limits) VALUES
  ('chat_enabled', '{"enabled": true, "model": "gpt-4o-mini"}'::jsonb, 'AI chat feature configuration', '{"free": 50, "pro": 500, "enterprise": 5000}'::jsonb),
  ('receipt_scanning', '{"enabled": true, "max_file_size_mb": 10}'::jsonb, 'Receipt scanning configuration', '{"free": 10, "pro": 100, "enterprise": 1000}'::jsonb),
  ('transaction_categorization', '{"enabled": true, "auto_categorize": true}'::jsonb, 'Auto-categorize transactions', '{"free": 100, "pro": 1000, "enterprise": 10000}'::jsonb)
ON CONFLICT (config_key) DO NOTHING;

-- Insert initial system health records
INSERT INTO public.system_health (service_name, status, latency_ms) VALUES
  ('database', 'healthy', 5),
  ('auth', 'healthy', 10),
  ('storage', 'healthy', 15),
  ('edge_functions', 'healthy', 50),
  ('ai_service', 'healthy', 200),
  ('payment_gateway', 'healthy', 100)
ON CONFLICT DO NOTHING;

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 2K AI Accounting Systems - Enhanced Auth Events for Admin Dashboard
-- Adds additional fields for comprehensive login audit tracking
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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

-- CREATE INDEX IF NOT EXISTS on user_email for faster searches
CREATE INDEX IF NOT EXISTS idx_auth_events_email ON public.auth_events(user_email);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Function to log auth events
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Update RLS for admin_users table access
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Add AI usage log table if not exists
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_usage_log' AND policyname = 'Users can view own AI usage'
  ) THEN
    CREATE POLICY "Users can view own AI usage" ON public.ai_usage_log
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

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
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 2K AI Accounting Systems - Admin Bootstrap Fix
-- Allows platform owners to self-register as admins
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- First, let's allow owner emails to insert themselves into admin_users
-- This solves the chicken-and-egg problem of creating the first admin

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Owners can self-register as admin" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view own entry" ON public.admin_users;

-- Policy: Platform owners can insert themselves as admin
-- Uses email matching for owner identification
CREATE POLICY "Owners can self-register as admin" ON public.admin_users
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND (
      -- Check if user's email is an owner email
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email IN ('briantukei1000@gmail.com', 'tukeibrian5@gmail.com')
      )
      -- OR no admins exist yet (first admin bootstrap)
      OR NOT EXISTS (SELECT 1 FROM public.admin_users WHERE is_active = true)
    )
  );

-- Policy: Users can read their own admin entry
CREATE POLICY "Admins can view own entry" ON public.admin_users
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Allow admins to update their own last_active_at
DROP POLICY IF EXISTS "Admins can update own activity" ON public.admin_users;
CREATE POLICY "Admins can update own activity" ON public.admin_users
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Function to bootstrap admin from owner email
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE OR REPLACE FUNCTION public.bootstrap_admin_if_owner()
RETURNS BOOLEAN AS $$
DECLARE
  owner_emails TEXT[] := ARRAY['briantukei1000@gmail.com', 'tukeibrian5@gmail.com'];
  current_email TEXT;
  current_user_id UUID;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO current_user_id;
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get email
  SELECT email INTO current_email FROM auth.users WHERE id = current_user_id;
  
  -- Check if owner email
  IF NOT (current_email = ANY(owner_emails)) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if already admin
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = current_user_id) THEN
    -- Update to ensure active
    UPDATE public.admin_users 
    SET is_active = true, admin_role = 'super_admin', last_active_at = now()
    WHERE user_id = current_user_id;
    RETURN TRUE;
  END IF;
  
  -- Insert new admin entry
  INSERT INTO public.admin_users (user_id, admin_role, department, permissions, is_active)
  VALUES (current_user_id, 'super_admin', 'Platform', '["*"]'::jsonb, true)
  ON CONFLICT (user_id) DO UPDATE SET
    admin_role = 'super_admin',
    is_active = true,
    last_active_at = now();
  
  -- Also ensure user_roles entry
  INSERT INTO public.user_roles (user_id, role)
  VALUES (current_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.bootstrap_admin_if_owner() TO authenticated;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Seed initial feature flags if empty
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

INSERT INTO public.feature_flags (feature_key, feature_name, description, status, allowed_plans)
VALUES 
  ('ai_assistant', 'AI Financial Assistant', 'Enable AI-powered financial analysis and chat', 'enabled', ARRAY['free', 'pro', 'enterprise']),
  ('receipt_scanner', 'Receipt Scanner', 'Scan and extract data from receipts', 'enabled', ARRAY['pro', 'enterprise']),
  ('recurring_transactions', 'Recurring Transactions', 'Set up automatic recurring entries', 'enabled', ARRAY['free', 'pro', 'enterprise']),
  ('multi_currency', 'Multi-Currency Support', 'Support for multiple currencies', 'enabled', ARRAY['pro', 'enterprise']),
  ('team_collaboration', 'Team Collaboration', 'Invite team members to view/edit', 'enabled', ARRAY['pro', 'enterprise']),
  ('advanced_reports', 'Advanced Reports', 'Generate detailed financial reports', 'enabled', ARRAY['pro', 'enterprise']),
  ('api_access', 'API Access', 'Access accounting data via REST API', 'enabled', ARRAY['enterprise']),
  ('dark_mode', 'Dark Mode', 'Enable dark theme across the app', 'enabled', ARRAY['free', 'pro', 'enterprise'])
ON CONFLICT (feature_key) DO NOTHING;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Seed initial accounting modules if empty
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

INSERT INTO public.accounting_modules (module_key, module_name, description, icon, is_enabled, required_plan, display_order)
VALUES
  ('dashboard', 'Dashboard', 'Overview of financial health', 'LayoutDashboard', true, 'free', 1),
  ('transactions', 'Transactions', 'Track income and expenses', 'ArrowLeftRight', true, 'free', 2),
  ('invoices', 'Invoices', 'Create and manage invoices', 'FileText', true, 'free', 3),
  ('reports', 'Reports', 'Financial statements and reports', 'BarChart3', true, 'free', 4),
  ('payroll', 'Payroll', 'Employee salary management', 'Users', true, 'pro', 5),
  ('bank_import', 'Bank Import', 'Import bank statements', 'Building', true, 'pro', 6),
  ('journal', 'Journal', 'Double-entry bookkeeping', 'BookOpen', true, 'free', 7),
  ('forecast', 'Forecast', 'Financial forecasting', 'TrendingUp', true, 'pro', 8),
  ('ai_assistant', 'AI Assistant', 'AI-powered financial help', 'Bot', true, 'free', 9)
ON CONFLICT (module_key) DO NOTHING;
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Admin RLS Bypass Policies
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- Allows admin users (those with role='admin' in user_roles) to
-- SELECT all rows from key platform tables so the Admin Dashboard
-- can show complete data even when the edge function is unavailable.
--
-- This does NOT grant INSERT/UPDATE/DELETE â€” only SELECT visibility.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Helper function: returns TRUE if the calling user is an admin
-- Drop old no-arg version if exists (conflicts with version that has default param)
DROP FUNCTION IF EXISTS public.is_admin();

-- Recreate with explicit parameter + default so there is exactly one overload
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- â”€â”€ organizations: admins can read ALL orgs â”€â”€
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'organizations' AND policyname = 'Admins can read all organizations'
  ) THEN
    CREATE POLICY "Admins can read all organizations"
      ON public.organizations FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- â”€â”€ subscriptions: admins can read ALL subscriptions â”€â”€
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscriptions' AND policyname = 'Admins can read all subscriptions'
  ) THEN
    CREATE POLICY "Admins can read all subscriptions"
      ON public.subscriptions FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- â”€â”€ organization_users: admins can read ALL memberships â”€â”€
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'organization_users' AND policyname = 'Admins can read all memberships'
  ) THEN
    CREATE POLICY "Admins can read all memberships"
      ON public.organization_users FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- â”€â”€ profiles: admins can read ALL profiles â”€â”€
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Admins can read all profiles'
  ) THEN
    CREATE POLICY "Admins can read all profiles"
      ON public.profiles FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- â”€â”€ ai_usage_log: admins can read ALL usage logs â”€â”€
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_usage_log' AND policyname = 'Admins can read all ai usage'
  ) THEN
    CREATE POLICY "Admins can read all ai usage"
      ON public.ai_usage_log FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- â”€â”€ auth_events: admins can read ALL auth events â”€â”€
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'auth_events' AND policyname = 'Admins can read all auth events'
  ) THEN
    CREATE POLICY "Admins can read all auth events"
      ON public.auth_events FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- â”€â”€ admin_audit_log: admins can read ALL audit logs â”€â”€
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_audit_log' AND policyname = 'Admins can read all audit logs'
  ) THEN
    CREATE POLICY "Admins can read all audit logs"
      ON public.admin_audit_log FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- â”€â”€ user_roles: ensure admins can INSERT their own role (for auto-promotion) â”€â”€
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_roles' AND policyname = 'Users can insert own roles'
  ) THEN
    CREATE POLICY "Users can insert own roles"
      ON public.user_roles FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
-- â”€â”€ Ensure admin role for tukeibrian5@gmail.com â”€â”€
-- This migration ensures the primary admin email has proper admin access.
-- It inserts admin roles for both platform owner emails.

DO $$
DECLARE
  owner_emails TEXT[] := ARRAY['tukeibrian5@gmail.com', 'briantukei1000@gmail.com'];
  u RECORD;
BEGIN
  -- For each owner email, create user_roles entry
  FOR u IN 
    SELECT id, email FROM auth.users 
    WHERE email = ANY(owner_emails)
  LOOP
    -- Insert admin role (skip if already exists)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (u.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Also ensure admin_users entry if the table exists
    BEGIN
      INSERT INTO public.admin_users (user_id, admin_role, department, permissions, is_active)
      VALUES (u.id, 'super_admin', 'Platform', '["*"]'::jsonb, true)
      ON CONFLICT (user_id) DO UPDATE SET 
        admin_role = 'super_admin',
        is_active = true,
        permissions = '["*"]'::jsonb;
    EXCEPTION WHEN undefined_table THEN
      -- admin_users table may not exist yet, skip
      NULL;
    END;

    -- Ensure profile exists
    BEGIN
      INSERT INTO public.profiles (id, email, full_name)
      VALUES (u.id, u.email, SPLIT_PART(u.email, '@', 1))
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    RAISE NOTICE 'Admin role ensured for %', u.email;
  END LOOP;
END $$;
-- ============================================================
-- Migration: Production-Grade Billing System Upgrade
-- Date: 2026-03-05
-- Description: Adds user-level subscription fields, usage
--   counters, storage limits, and admin billing controls.
-- ============================================================

-- â”€â”€ 1. Extend profiles table with subscription fields â”€â”€â”€â”€â”€
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status   text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_name             text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS billing_cycle         text DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS stripe_customer_id    text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS trial_start_date      timestamptz,
  ADD COLUMN IF NOT EXISTS trial_end_date        timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_start  timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end    timestamptz,
  ADD COLUMN IF NOT EXISTS usage_counters        jsonb DEFAULT '{"invoices": 0, "ai_queries": 0, "team_members": 0, "storage_mb": 0, "reports": 0, "bank_imports": 0}'::jsonb,
  ADD COLUMN IF NOT EXISTS usage_limits          jsonb DEFAULT '{"invoices": 10, "ai_queries": 20, "team_members": 1, "storage_mb": 100, "reports": 3, "bank_imports": 2}'::jsonb;

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status
  ON public.profiles (subscription_status);

CREATE INDEX IF NOT EXISTS idx_profiles_plan_name
  ON public.profiles (plan_name);

-- â”€â”€ 2. Extend subscriptions table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_start_date      timestamptz,
  ADD COLUMN IF NOT EXISTS usage_counters        jsonb DEFAULT '{"invoices": 0, "ai_queries": 0, "team_members": 0, "storage_mb": 0, "reports": 0, "bank_imports": 0}'::jsonb,
  ADD COLUMN IF NOT EXISTS usage_limits          jsonb DEFAULT '{"invoices": 10, "ai_queries": 20, "team_members": 1, "storage_mb": 100, "reports": 3, "bank_imports": 2}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_usage_reset      timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS payment_method_last4  text,
  ADD COLUMN IF NOT EXISTS payment_method_brand  text;

-- â”€â”€ 3. Extend subscription_plans with storage & reports â”€â”€â”€â”€
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS max_storage_mb   integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_reports      integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS stripe_price_monthly text,
  ADD COLUMN IF NOT EXISTS stripe_price_annual  text;

-- â”€â”€ 4. Create usage_events table for metered billing â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.usage_events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL,
  event_type       text NOT NULL,  -- 'invoice_created', 'ai_query', 'team_member_added', 'storage_upload', 'report_generated', 'bank_import'
  quantity         integer DEFAULT 1,
  metadata         jsonb DEFAULT '{}'::jsonb,
  month            text NOT NULL,  -- 'YYYY-MM' partition key
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_org_month
  ON public.usage_events (organization_id, month);

CREATE INDEX IF NOT EXISTS idx_usage_events_type
  ON public.usage_events (event_type);

-- â”€â”€ 5. Create admin_billing_overrides table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.admin_billing_overrides (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  admin_user_id    uuid NOT NULL,
  action           text NOT NULL,  -- 'activate', 'cancel', 'extend_trial', 'change_plan', 'reset_usage'
  previous_state   jsonb,
  new_state        jsonb,
  reason           text,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_overrides_org
  ON public.admin_billing_overrides (organization_id);

-- â”€â”€ 6. Create webhook_events table for idempotency â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider         text NOT NULL,         -- 'stripe', 'flutterwave', etc.
  event_id         text NOT NULL UNIQUE,   -- Provider's event ID
  event_type       text NOT NULL,
  processed        boolean DEFAULT false,
  payload          jsonb,
  error            text,
  created_at       timestamptz DEFAULT now(),
  processed_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_id
  ON public.webhook_events (provider, event_id);

-- â”€â”€ 7. Update subscription_plans with production values â”€â”€â”€â”€
INSERT INTO public.subscription_plans (
  id, name, description, price_monthly, price_annual, currency,
  max_users, max_invoices_per_month, max_ai_chats_per_month,
  max_bank_imports_per_month, max_businesses,
  max_storage_mb, max_reports,
  has_ai_assistant, has_advanced_reports, has_payroll, has_team_access,
  trial_days, is_active
) VALUES
  ('free', 'Free', 'Perfect for freelancers getting started.',
   0, 0, 'USD', 1, 10, 20, 2, 1, 100, 3,
   false, false, false, false, 0, true),
  ('pro', 'Pro', 'Unlimited invoices, full reports, AI assistant.',
   29, 290, 'USD', 5, -1, 200, 20, 3, 5120, -1,
   true, true, true, false, 7, true),
  ('enterprise', 'Enterprise', 'Multi-user, advanced analytics, priority AI, custom pricing.',
   79, 790, 'USD', -1, -1, -1, -1, -1, -1, -1,
   true, true, true, true, 7, true)
ON CONFLICT (id) DO UPDATE SET
  name                     = EXCLUDED.name,
  description              = EXCLUDED.description,
  price_monthly            = EXCLUDED.price_monthly,
  price_annual             = EXCLUDED.price_annual,
  max_users                = EXCLUDED.max_users,
  max_invoices_per_month   = EXCLUDED.max_invoices_per_month,
  max_ai_chats_per_month   = EXCLUDED.max_ai_chats_per_month,
  max_bank_imports_per_month = EXCLUDED.max_bank_imports_per_month,
  max_businesses           = EXCLUDED.max_businesses,
  max_storage_mb           = EXCLUDED.max_storage_mb,
  max_reports              = EXCLUDED.max_reports,
  has_ai_assistant         = EXCLUDED.has_ai_assistant,
  has_advanced_reports     = EXCLUDED.has_advanced_reports,
  has_payroll              = EXCLUDED.has_payroll,
  has_team_access          = EXCLUDED.has_team_access,
  trial_days               = EXCLUDED.trial_days,
  is_active                = EXCLUDED.is_active;

-- â”€â”€ 8. Function: Get usage counts for an org this month â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION public.get_org_usage_counts(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_month text := to_char(now(), 'YYYY-MM');
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'invoices',     COALESCE(SUM(CASE WHEN event_type = 'invoice_created' THEN quantity ELSE 0 END), 0),
    'ai_queries',   COALESCE(SUM(CASE WHEN event_type = 'ai_query' THEN quantity ELSE 0 END), 0),
    'team_members', (SELECT COUNT(*) FROM organization_users WHERE organization_id = p_org_id AND invite_accepted = true),
    'storage_mb',   COALESCE(SUM(CASE WHEN event_type = 'storage_upload' THEN quantity ELSE 0 END), 0),
    'reports',      COALESCE(SUM(CASE WHEN event_type = 'report_generated' THEN quantity ELSE 0 END), 0),
    'bank_imports', COALESCE(SUM(CASE WHEN event_type = 'bank_import' THEN quantity ELSE 0 END), 0)
  ) INTO v_result
  FROM usage_events
  WHERE organization_id = p_org_id AND month = v_month;

  RETURN COALESCE(v_result, '{"invoices":0,"ai_queries":0,"team_members":0,"storage_mb":0,"reports":0,"bank_imports":0}'::jsonb);
END;
$$;

-- â”€â”€ 9. Function: Check if org exceeds any usage limit â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  p_org_id uuid,
  p_event_type text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_sub record;
  v_plan record;
  v_current integer;
  v_limit integer;
  v_month text := to_char(now(), 'YYYY-MM');
BEGIN
  -- Get subscription
  SELECT * INTO v_sub FROM subscriptions WHERE organization_id = p_org_id;
  IF NOT FOUND THEN
    -- No subscription = free plan defaults
    v_sub := ROW(NULL, p_org_id, 'free', 'active', 'monthly', NULL, NULL, NULL, false, NULL, NULL);
  END IF;

  -- Get plan limits
  SELECT * INTO v_plan FROM subscription_plans WHERE id = v_sub.plan_id;
  IF NOT FOUND THEN
    SELECT * INTO v_plan FROM subscription_plans WHERE id = 'free';
  END IF;

  -- Get current usage
  SELECT COALESCE(SUM(quantity), 0) INTO v_current
  FROM usage_events
  WHERE organization_id = p_org_id AND month = v_month AND event_type = p_event_type;

  -- Map event type to plan limit
  v_limit := CASE p_event_type
    WHEN 'invoice_created' THEN v_plan.max_invoices_per_month
    WHEN 'ai_query'        THEN v_plan.max_ai_chats_per_month
    WHEN 'bank_import'     THEN v_plan.max_bank_imports_per_month
    WHEN 'storage_upload'  THEN v_plan.max_storage_mb
    WHEN 'report_generated' THEN v_plan.max_reports
    ELSE -1
  END;

  -- -1 = unlimited
  IF v_limit = -1 THEN
    RETURN jsonb_build_object('allowed', true, 'current', v_current, 'limit', -1);
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_current < v_limit,
    'current', v_current,
    'limit', v_limit,
    'remaining', GREATEST(0, v_limit - v_current)
  );
END;
$$;

-- â”€â”€ 10. Function: Reset monthly usage counters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE subscriptions
  SET usage_counters = '{"invoices": 0, "ai_queries": 0, "team_members": 0, "storage_mb": 0, "reports": 0, "bank_imports": 0}'::jsonb,
      last_usage_reset = now()
  WHERE last_usage_reset < date_trunc('month', now());
END;
$$;

-- â”€â”€ 11. Function: Admin billing overview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION public.admin_billing_overview()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_orgs',      (SELECT COUNT(*) FROM organizations),
    'active_subs',     (SELECT COUNT(*) FROM subscriptions WHERE status = 'active'),
    'trialing_subs',   (SELECT COUNT(*) FROM subscriptions WHERE status = 'trialing'),
    'past_due_subs',   (SELECT COUNT(*) FROM subscriptions WHERE status = 'past_due'),
    'canceled_subs',   (SELECT COUNT(*) FROM subscriptions WHERE status = 'canceled'),
    'pro_plans',       (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'pro' AND status IN ('active', 'trialing')),
    'enterprise_plans',(SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'enterprise' AND status IN ('active', 'trialing')),
    'free_plans',      (SELECT COUNT(*) FROM subscriptions WHERE plan_id = 'free'),
    'monthly_revenue', (SELECT COALESCE(SUM(
      CASE WHEN s.billing_cycle = 'monthly' THEN p.price_monthly
           WHEN s.billing_cycle = 'annual'  THEN p.price_annual / 12.0
           ELSE 0 END
    ), 0) FROM subscriptions s LEFT JOIN subscription_plans p ON s.plan_id = p.id WHERE s.status IN ('active')),
    'total_revenue',   (SELECT COALESCE(SUM(amount), 0) FROM billing_events WHERE type = 'payment_succeeded')
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- â”€â”€ 12. RLS policies for new tables â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- usage_events: users can read their own org's usage
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org usage"
  ON public.usage_events FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage usage"
  ON public.usage_events FOR ALL
  USING (auth.role() = 'service_role');

-- webhook_events: only service role
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages webhooks"
  ON public.webhook_events FOR ALL
  USING (auth.role() = 'service_role');

-- admin_billing_overrides: only service role + admin read
ALTER TABLE public.admin_billing_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages overrides"
  ON public.admin_billing_overrides FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view overrides"
  ON public.admin_billing_overrides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- â”€â”€ 13. Trigger: auto-expire trials â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION public.auto_expire_trials()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- If trial has ended and card was not charged, downgrade to free
  IF NEW.status = 'trialing' AND NEW.trial_ends_at IS NOT NULL AND NEW.trial_ends_at < now() THEN
    NEW.status := 'canceled';
    NEW.plan_id := 'free';
    NEW.usage_limits := '{"invoices": 10, "ai_queries": 20, "team_members": 1, "storage_mb": 100, "reports": 3, "bank_imports": 2}'::jsonb;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_expire_trials ON public.subscriptions;
CREATE TRIGGER trg_auto_expire_trials
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_expire_trials();
-- ============================================================
-- 2K AI Accounting Systems â€” Multi-Currency Engine
-- Migration: 20260310000001
-- ============================================================
-- Adds:
--   1. exchange_rates          â€” cached live forex rates
--   2. exchange_rate_history   â€” immutable audit trail
--   3. admin_rate_overrides    â€” manual admin overrides
--   4. Currency columns on transactions table
-- ============================================================

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 1. Exchange Rates (cached live rates, refreshed every 10 min)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency   TEXT NOT NULL DEFAULT 'USD',
  target_currency TEXT NOT NULL,
  rate            NUMERIC(18,8) NOT NULL,
  source          TEXT NOT NULL DEFAULT 'exchangerate-api',  -- 'exchangerate-api' | 'admin_override' | 'fallback'
  fetched_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '10 minutes'),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (base_currency, target_currency)
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair
  ON public.exchange_rates(base_currency, target_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_expires
  ON public.exchange_rates(expires_at);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 2. Exchange Rate History (immutable audit trail)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS public.exchange_rate_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency   TEXT NOT NULL DEFAULT 'USD',
  target_currency TEXT NOT NULL,
  rate            NUMERIC(18,8) NOT NULL,
  source          TEXT NOT NULL DEFAULT 'exchangerate-api',
  recorded_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_history_pair_date
  ON public.exchange_rate_history(base_currency, target_currency, recorded_at DESC);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 3. Admin Rate Overrides
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS public.admin_rate_overrides (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency   TEXT NOT NULL DEFAULT 'USD',
  target_currency TEXT NOT NULL,
  override_rate   NUMERIC(18,8) NOT NULL,
  reason          TEXT,
  set_by          UUID NOT NULL REFERENCES auth.users(id),
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  effective_from  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  effective_until TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_overrides_active
  ON public.admin_rate_overrides(base_currency, target_currency, active)
  WHERE active = TRUE;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 4. Add multi-currency columns to transactions
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS currency             TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS original_amount      NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS original_currency    TEXT,
  ADD COLUMN IF NOT EXISTS base_currency_amount NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS exchange_rate_used   NUMERIC(18,8),
  ADD COLUMN IF NOT EXISTS exchange_rate_date   TIMESTAMP WITH TIME ZONE;

-- Backfill existing transactions: original = current, rate = 1.0 (assumed USD)
UPDATE public.transactions
SET original_amount      = amount,
    original_currency    = 'USD',
    base_currency_amount = amount,
    exchange_rate_used   = 1.00000000,
    exchange_rate_date   = created_at,
    currency             = 'USD'
WHERE original_amount IS NULL;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 5. Add multi-currency columns to invoice_payments
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

ALTER TABLE public.invoice_payments
  ADD COLUMN IF NOT EXISTS currency             TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS original_amount      NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS original_currency    TEXT,
  ADD COLUMN IF NOT EXISTS base_currency_amount NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS exchange_rate_used   NUMERIC(18,8);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 6. Add multi-currency columns to imported_transactions
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

ALTER TABLE public.imported_transactions
  ADD COLUMN IF NOT EXISTS currency             TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS original_currency    TEXT,
  ADD COLUMN IF NOT EXISTS exchange_rate_used   NUMERIC(18,8);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 7. RLS Policies
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- exchange_rates: readable by all authenticated users
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exchange_rates_read" ON public.exchange_rates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role (Edge Functions) to insert/update
CREATE POLICY "exchange_rates_service_write" ON public.exchange_rates
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- exchange_rate_history: readable by authenticated
ALTER TABLE public.exchange_rate_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rate_history_read" ON public.exchange_rate_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "rate_history_service_write" ON public.exchange_rate_history
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- admin_rate_overrides: admins only
ALTER TABLE public.admin_rate_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_overrides_read" ON public.admin_rate_overrides
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_overrides_write" ON public.admin_rate_overrides
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    )
  );

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 8. Helper function: get effective exchange rate
--    (admin override > cached rate > fallback 1.0)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE OR REPLACE FUNCTION public.get_exchange_rate(
  p_base TEXT DEFAULT 'USD',
  p_target TEXT DEFAULT 'USD'
) RETURNS NUMERIC AS $$
DECLARE
  v_rate NUMERIC;
BEGIN
  -- Same currency â†’ 1.0
  IF UPPER(p_base) = UPPER(p_target) THEN
    RETURN 1.0;
  END IF;

  -- 1. Check active admin override
  SELECT override_rate INTO v_rate
  FROM public.admin_rate_overrides
  WHERE base_currency   = UPPER(p_base)
    AND target_currency = UPPER(p_target)
    AND active          = TRUE
    AND (effective_until IS NULL OR effective_until > now())
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;

  -- 2. Check cached rate (not expired)
  SELECT rate INTO v_rate
  FROM public.exchange_rates
  WHERE base_currency   = UPPER(p_base)
    AND target_currency = UPPER(p_target)
    AND expires_at > now()
  LIMIT 1;

  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;

  -- 3. Check cached rate (even if expired â€” better than nothing)
  SELECT rate INTO v_rate
  FROM public.exchange_rates
  WHERE base_currency   = UPPER(p_base)
    AND target_currency = UPPER(p_target)
  ORDER BY fetched_at DESC
  LIMIT 1;

  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;

  -- 4. Fallback
  RETURN 1.0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 9. Helper function: convert amount between currencies
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE OR REPLACE FUNCTION public.convert_currency(
  p_amount NUMERIC,
  p_from   TEXT,
  p_to     TEXT
) RETURNS NUMERIC AS $$
BEGIN
  RETURN p_amount * public.get_exchange_rate(UPPER(p_from), UPPER(p_to));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 1. Create Enums for Stricter State Management
DROP TYPE IF EXISTS job_status CASCADE; CREATE TYPE job_status AS ENUM ('queued', 'processing', 'retrying', 'completed', 'failed', 'review_required');
DROP TYPE IF EXISTS transaction_status CASCADE; CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'review_required');

-- 2. Create the System Logs Table
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    module VARCHAR(100) NOT NULL, -- e.g., 'bank_import', 'receipt_scanner'
    action VARCHAR(100) NOT NULL, -- e.g., 'parsing', 'validating'
    status VARCHAR(50) NOT NULL,  -- e.g., 'failed', 'success'
    error_message TEXT,
    stack_trace TEXT,
    file_name VARCHAR(255),
    processing_time_ms INT,
    retry_count INT DEFAULT 0
);

-- Index for querying logs quickly
CREATE INDEX IF NOT EXISTS idx_system_logs_module_status ON system_logs(module, status);
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp DESC);

-- 3. Create the Retry Queue Table (Jobs)
CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL, -- 'receipt_parse', 'bank_statement_parse'
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    status job_status DEFAULT 'queued',
    progress_percentage INT DEFAULT 0,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    next_retry_time TIMESTAMPTZ DEFAULT NOW(),
    result_payload JSONB,
    error_payload JSONB
);

-- Index to quickly find jobs that need picking up by the worker
CREATE INDEX IF NOT EXISTS idx_processing_jobs_queue ON processing_jobs(status, next_retry_time) WHERE status IN ('queued', 'retrying');

-- 4. Extend the Transactions Table (or create if it needs the strict schema)
CREATE TABLE IF NOT EXISTS aia_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'income', 'expense'
    category VARCHAR(100),
    source VARCHAR(100), -- e.g., 'receipt_scanner', 'bank_import'
    reference VARCHAR(255),
    status transaction_status DEFAULT 'pending',
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate transaction imports
    CONSTRAINT unique_transaction_hash UNIQUE (user_id, date, amount, description)
);

-- Trigger to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_processing_jobs_modtime
    BEFORE UPDATE ON processing_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aia_transactions_modtime
    BEFORE UPDATE ON aia_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
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
-- 1. FILE UPLOADS TABLE
CREATE TABLE IF NOT EXISTS uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    file_name TEXT,
    file_type VARCHAR(50),
    file_size INTEGER,
    upload_status VARCHAR(50),
    storage_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. RECEIPTS TABLE
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    upload_id UUID,
    vendor_name TEXT,
    receipt_number TEXT,
    receipt_date DATE,
    receipt_time TIME,
    currency VARCHAR(10),
    subtotal NUMERIC(12,2),
    tax NUMERIC(12,2),
    discount NUMERIC(12,2),
    total_amount NUMERIC(12,2),
    payment_method VARCHAR(50),
    cashier TEXT,
    confidence_score DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. RECEIPT ITEMS TABLE
CREATE TABLE IF NOT EXISTS receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID REFERENCES receipts(id) ON DELETE CASCADE,
    description TEXT,
    quantity NUMERIC(10,2),
    unit_price NUMERIC(10,2),
    total_price NUMERIC(10,2)
);

-- 4. PROCESSING STATUS (REAL-TIME TRACKER)
CREATE TABLE IF NOT EXISTS processing_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID,
    current_stage VARCHAR(50),
    progress_percentage INTEGER,
    message TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_receipts_user ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON aia_transactions(user_id);

-- 5. AUTO-RETRY TRIGGER (adapted to our processing_jobs table)
CREATE OR REPLACE FUNCTION retry_failed_job()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'failed' AND NEW.attempts < NEW.max_attempts THEN
        NEW.status = 'retrying';
        NEW.attempts = NEW.attempts + 1;
        NEW.next_retry_time = NOW() + INTERVAL '30 seconds';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS retry_trigger ON processing_jobs;
CREATE TRIGGER retry_trigger
    BEFORE UPDATE ON processing_jobs
    FOR EACH ROW
    EXECUTE FUNCTION retry_failed_job();

-- Migration: 20260405000001_booking_companies_schema.sql

-- 1. Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    tax_id VARCHAR(100),
    registration_number VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(255),
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(100),
    address_country VARCHAR(100) NOT NULL,
    address_postal_code VARCHAR(50),
    base_currency VARCHAR(3) DEFAULT 'USD',
    industry VARCHAR(100) DEFAULT 'other',
    business_type VARCHAR(50) DEFAULT 'sole_proprietorship',
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Companies Relationship Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_companies (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'accountant', 'viewer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, company_id)
);

-- 3. Demo Bookings Table (Relational Migration)
CREATE TABLE IF NOT EXISTS demo_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    phone VARCHAR(20),
    website VARCHAR(255),
    preferred_date DATE NOT NULL,
    preferred_time TIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    message TEXT,
    source VARCHAR(50) DEFAULT 'website',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    meeting_link VARCHAR(255),
    meeting_platform VARCHAR(50) DEFAULT 'zoom',
    duration INT DEFAULT 30,
    admin_notes TEXT,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger for auto-update updated_at for companies
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS companies_update_trigger ON companies;
CREATE TRIGGER companies_update_trigger
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();

-- Trigger for auto-update updated_at for demo_bookings
CREATE OR REPLACE FUNCTION update_demo_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS demo_bookings_update_trigger ON demo_bookings;
CREATE TRIGGER demo_bookings_update_trigger
  BEFORE UPDATE ON demo_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_demo_bookings_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON user_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_demo_bookings_email ON demo_bookings(email);
CREATE INDEX IF NOT EXISTS idx_demo_bookings_date ON demo_bookings(preferred_date);
CREATE INDEX IF NOT EXISTS idx_demo_bookings_status ON demo_bookings(status);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_bookings ENABLE ROW LEVEL SECURITY;

-- Policies for companies
DROP POLICY IF EXISTS companies_owner_select ON companies; CREATE POLICY companies_owner_select ON companies
    FOR SELECT USING (auth.uid() = owner_id OR id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS companies_owner_update ON companies; CREATE POLICY companies_owner_update ON companies
    FOR UPDATE USING (auth.uid() = owner_id OR id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid() AND role IN ('admin', 'manager')))
    WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS companies_owner_insert ON companies; CREATE POLICY companies_owner_insert ON companies
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Policies for user_companies
DROP POLICY IF EXISTS user_companies_select ON user_companies; CREATE POLICY user_companies_select ON user_companies
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_companies_insert ON user_companies; CREATE POLICY user_companies_insert ON user_companies
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policies for demo_bookings (Public can insert, only authenticated can read/update depending on roles)
DROP POLICY IF EXISTS demo_bookings_public_insert ON demo_bookings; CREATE POLICY demo_bookings_public_insert ON demo_bookings
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS demo_bookings_auth_select ON demo_bookings; CREATE POLICY demo_bookings_auth_select ON demo_bookings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Step 2 & 8: Seed Demo Data Automatically (Demo Safety)
-- Assuming admin/default user is handled separately or omitting owner_id via trigger bypass if allowed
-- For pure demo safety, insert if table is completely empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM companies LIMIT 1) THEN
        -- Need a valid owner_id (using a placeholder or finding first user)
        -- To avoid foreign key violation on auth.users, we leave owner_id out if it was nullable
        -- Ah, owner_id is NOT NULL REFERENCES auth.users(id), so we can't insert demo companies without a user.
        -- We will insert them once an admin user is created in a separate script or rely on the backend Mongoose seeding.
        RAISE NOTICE 'Skipping company inserts because owner_id requires an auth.user record.';
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS demo_bookings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES public.users(id), company_id UUID REFERENCES public.companies(id), name TEXT, email TEXT, date TIMESTAMP, status VARCHAR(20) DEFAULT 'scheduled', platform VARCHAR(20) DEFAULT 'zoom', duration INTEGER DEFAULT 30, notes TEXT, created_at TIMESTAMP DEFAULT NOW()); CREATE TABLE IF NOT EXISTS receipts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.users(id), company_id UUID REFERENCES public.companies(id), vendor TEXT, total DECIMAL(10,2), tax DECIMAL(10,2), date DATE, file_url TEXT, status VARCHAR(20) DEFAULT 'scanned', created_at TIMESTAMP DEFAULT NOW());

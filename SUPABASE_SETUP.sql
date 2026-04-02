/**
 * Setup Guide for Real-Time Features
 * Run this in your Supabase SQL Editor to create required tables
 */

// 1. Admin Messages Table
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

CREATE INDEX idx_admin_messages_user_id_status ON admin_messages(user_id, status);
CREATE INDEX idx_admin_messages_created_at ON admin_messages(created_at DESC);

-- Trigger for auto-update
CREATE OR REPLACE FUNCTION update_admin_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS admin_messages_update_trigger ON admin_messages;
CREATE TRIGGER admin_messages_update_trigger
  BEFORE UPDATE ON admin_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_messages_updated_at();

-- Enable RLS
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY admin_messages_user_select ON admin_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY admin_messages_user_update ON admin_messages
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Forex Rates Table
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

CREATE INDEX idx_forex_rates_currency_pair ON forex_rates(from_currency, to_currency, fetched_at DESC);
CREATE INDEX idx_forex_rates_fetched_at ON forex_rates(fetched_at DESC);

-- Enable RLS (public read)
ALTER TABLE forex_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY forex_rates_public_select ON forex_rates FOR SELECT USING (true);

-- 3. Transaction Forex History Table
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

CREATE INDEX idx_transaction_forex_history_transaction_id ON transaction_forex_history(transaction_id, snapshot_at DESC);
CREATE INDEX idx_transaction_forex_history_snapshot_at ON transaction_forex_history(snapshot_at DESC);

-- Enable RLS
ALTER TABLE transaction_forex_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY transaction_forex_history_select ON transaction_forex_history FOR SELECT USING (true);

-- Done! All tables are ready for real-time features

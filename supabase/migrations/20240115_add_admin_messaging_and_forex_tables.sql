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
CREATE POLICY admin_messages_user_select ON admin_messages
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can dismiss their own messages
CREATE POLICY admin_messages_user_update ON admin_messages
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Admins can insert messages
CREATE POLICY admin_messages_admin_insert ON admin_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policy: Admins can view all messages
CREATE POLICY admin_messages_admin_select ON admin_messages
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
CREATE POLICY forex_rates_public_select ON forex_rates
  FOR SELECT USING (true);

-- RLS Policy: Service role can insert rates
CREATE POLICY forex_rates_service_insert ON forex_rates
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
CREATE POLICY transaction_forex_history_select ON transaction_forex_history
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

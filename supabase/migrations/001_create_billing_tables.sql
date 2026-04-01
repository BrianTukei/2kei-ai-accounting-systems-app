-- Create pricing plans table
CREATE TABLE pricing_plans (
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
CREATE TABLE subscriptions (
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
CREATE TABLE payments (
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
CREATE TABLE monthly_usage (
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
CREATE TABLE ai_credits (
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
CREATE TABLE ai_usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature VARCHAR(100) NOT NULL, -- 'receipt_scanning', 'categorization', 'banking_import', etc.
  credits_used DECIMAL(10, 2) NOT NULL,
  request_data JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create transactions table (for payment processing)
CREATE TABLE payment_transactions (
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
CREATE TABLE demo_bookings (
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
CREATE TABLE billing_history (
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
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_monthly_usage_user_id ON monthly_usage(user_id);
CREATE INDEX idx_ai_credits_user_id ON ai_credits(user_id);
CREATE INDEX idx_ai_usage_user_id ON ai_usage_history(user_id);
CREATE INDEX idx_demo_bookings_status ON demo_bookings(status);
CREATE INDEX idx_billing_history_user_id ON billing_history(user_id);

-- Insert default pricing plans
INSERT INTO pricing_plans (name, slug, description, monthly_price, yearly_price, transaction_limit, features, display_order) VALUES
('Free', 'free', 'Perfect for getting started', 0, 0, 50, '{"transactions": 50, "reports": ["basic"], "support": "community", "ai_features": false, "multi_user": 1}', 1),
('Starter', 'starter', 'For small businesses', 15000, 150000, NULL, '{"transactions": 999999, "reports": ["income", "expenses", "balance"], "support": "email", "ai_features": true, "multi_user": 1, "ai_credits": 100000}', 2),
('Business', 'business', 'For growing companies', 75000, 750000, NULL, '{"transactions": 999999, "reports": ["full"], "support": "priority", "ai_features": true, "multi_user": 5, "ai_credits": 1000000}', 3),
('Enterprise', 'enterprise', 'Custom pricing for large organizations', 0, 0, NULL, '{"transactions": 999999, "reports": ["full", "custom"], "support": "dedicated", "ai_features": true, "multi_user": 999, "ai_credits": 999999999, "crm": true}', 4);

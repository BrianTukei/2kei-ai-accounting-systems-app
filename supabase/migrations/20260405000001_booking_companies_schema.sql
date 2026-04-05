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
CREATE INDEX idx_companies_owner_id ON companies(owner_id);
CREATE INDEX idx_user_companies_company_id ON user_companies(company_id);
CREATE INDEX idx_demo_bookings_email ON demo_bookings(email);
CREATE INDEX idx_demo_bookings_date ON demo_bookings(preferred_date);
CREATE INDEX idx_demo_bookings_status ON demo_bookings(status);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_bookings ENABLE ROW LEVEL SECURITY;

-- Policies for companies
CREATE POLICY companies_owner_select ON companies
    FOR SELECT USING (auth.uid() = owner_id OR id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY companies_owner_update ON companies
    FOR UPDATE USING (auth.uid() = owner_id OR id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid() AND role IN ('admin', 'manager')))
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY companies_owner_insert ON companies
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Policies for user_companies
CREATE POLICY user_companies_select ON user_companies
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY user_companies_insert ON user_companies
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policies for demo_bookings (Public can insert, only authenticated can read/update depending on roles)
CREATE POLICY demo_bookings_public_insert ON demo_bookings
    FOR INSERT WITH CHECK (true);

CREATE POLICY demo_bookings_auth_select ON demo_bookings
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


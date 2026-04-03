-- 1. Create Enums for Stricter State Management
CREATE TYPE job_status AS ENUM ('queued', 'processing', 'retrying', 'completed', 'failed', 'review_required');
CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'review_required');

-- 2. Create the System Logs Table
CREATE TABLE system_logs (
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
CREATE INDEX idx_system_logs_module_status ON system_logs(module, status);
CREATE INDEX idx_system_logs_timestamp ON system_logs(timestamp DESC);

-- 3. Create the Retry Queue Table (Jobs)
CREATE TABLE processing_jobs (
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
CREATE INDEX idx_processing_jobs_queue ON processing_jobs(status, next_retry_time) WHERE status IN ('queued', 'retrying');

-- 4. Extend the Transactions Table (or create if it needs the strict schema)
CREATE TABLE aia_transactions (
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

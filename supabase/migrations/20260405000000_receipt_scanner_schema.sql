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


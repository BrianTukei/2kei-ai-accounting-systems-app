-- Store the source currency so transaction amounts can be converted correctly
-- when the user's selected display currency changes.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS original_amount NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS original_currency TEXT,
  ADD COLUMN IF NOT EXISTS base_currency_amount NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS exchange_rate_used NUMERIC(20,10),
  ADD COLUMN IF NOT EXISTS exchange_rate_date TIMESTAMPTZ;

UPDATE public.transactions
SET original_amount = COALESCE(original_amount, amount),
    original_currency = COALESCE(original_currency, currency),
    base_currency_amount = COALESCE(base_currency_amount, amount),
    exchange_rate_used = COALESCE(exchange_rate_used, 1),
    exchange_rate_date = COALESCE(exchange_rate_date, created_at)
WHERE original_amount IS NULL
   OR original_currency IS NULL
   OR base_currency_amount IS NULL
   OR exchange_rate_used IS NULL
   OR exchange_rate_date IS NULL;

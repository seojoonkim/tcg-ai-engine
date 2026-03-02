-- Add precomputed columns to cards table for fast API queries (no N+1)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS sparkline_data JSONB;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS current_price NUMERIC;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS change_24h NUMERIC;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS change_7d NUMERIC;

-- Update view to use precomputed sparkline if available
-- (run scripts/precompute_sparklines.py after this migration)

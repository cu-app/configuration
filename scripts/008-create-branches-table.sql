-- Credit Union Branch Locations (from Google Places API)
-- More accurate than NCUA data

-- Add branches_fetched_at column to ncua_credit_unions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ncua_credit_unions' AND column_name = 'branches_fetched_at'
  ) THEN
    ALTER TABLE ncua_credit_unions ADD COLUMN branches_fetched_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create branches table
CREATE TABLE IF NOT EXISTS cu_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cu_number TEXT NOT NULL,
  place_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  lat DECIMAL(10, 7),
  lng DECIMAL(10, 7),
  phone TEXT,
  website TEXT,
  rating DECIMAL(2, 1),
  photo_reference TEXT,
  is_headquarters BOOLEAN DEFAULT FALSE,
  hours JSONB,
  source TEXT DEFAULT 'google_places',
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_cu_branches_cu_number ON cu_branches(cu_number);
CREATE INDEX IF NOT EXISTS idx_cu_branches_location ON cu_branches(lat, lng);
CREATE INDEX IF NOT EXISTS idx_cu_branches_state ON cu_branches(address) WHERE address IS NOT NULL;

-- RLS
ALTER TABLE cu_branches ENABLE ROW LEVEL SECURITY;

-- Allow public read access to branch locations
CREATE POLICY IF NOT EXISTS "Public can view branch locations"
  ON cu_branches FOR SELECT
  USING (true);

-- Only service role can insert/update branches
CREATE POLICY IF NOT EXISTS "Service role can manage branches"
  ON cu_branches FOR ALL
  USING (auth.role() = 'service_role');

COMMIT;

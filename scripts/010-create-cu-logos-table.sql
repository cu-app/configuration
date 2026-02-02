-- CU Logos Storage Schema
-- Stores discovered logos for all 4,300+ credit unions with quality scoring

-- Drop existing tables if any
DROP TABLE IF EXISTS cu_logos CASCADE;

-- Main logos table - stores all discovered logo variants per CU
CREATE TABLE cu_logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charter_number INTEGER NOT NULL,
  cu_name TEXT NOT NULL,
  domain TEXT,

  -- Logo URLs (quality-ranked)
  logo_url_primary TEXT,          -- Best quality logo
  logo_url_brandfetch TEXT,       -- Brandfetch CDN
  logo_url_clearbit TEXT,         -- Clearbit API
  logo_url_google TEXT,           -- Google Favicon
  logo_url_duckduckgo TEXT,       -- DuckDuckGo
  logo_url_direct TEXT,           -- Direct from website

  -- Metadata
  primary_color TEXT,             -- Brand primary color (hex)
  logo_format TEXT,               -- svg, png, ico, etc.
  logo_width INTEGER,
  logo_height INTEGER,
  quality_score DECIMAL(3,2),     -- 0.00 to 1.00

  -- Discovery tracking
  source TEXT,                    -- Which service provided best logo
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMPTZ,

  -- Processing status
  status TEXT DEFAULT 'pending',  -- pending, processing, completed, failed
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(charter_number)
);

-- Indexes for performance
CREATE INDEX idx_cu_logos_charter ON cu_logos(charter_number);
CREATE INDEX idx_cu_logos_status ON cu_logos(status);
CREATE INDEX idx_cu_logos_quality ON cu_logos(quality_score DESC);
CREATE INDEX idx_cu_logos_domain ON cu_logos(domain);

-- Enable RLS
ALTER TABLE cu_logos ENABLE ROW LEVEL SECURITY;

-- Public access policies
CREATE POLICY "Allow public read on cu_logos" ON cu_logos FOR SELECT USING (true);
CREATE POLICY "Allow service role full access on cu_logos" ON cu_logos FOR ALL USING (true) WITH CHECK (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_cu_logos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER trigger_update_cu_logos_timestamp
  BEFORE UPDATE ON cu_logos
  FOR EACH ROW
  EXECUTE FUNCTION update_cu_logos_timestamp();

-- Add logo columns to ncua_credit_unions if they don't exist
DO $$
BEGIN
  -- Add logo_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ncua_credit_unions' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE ncua_credit_unions ADD COLUMN logo_url TEXT;
  END IF;

  -- Add logo_source column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ncua_credit_unions' AND column_name = 'logo_source'
  ) THEN
    ALTER TABLE ncua_credit_unions ADD COLUMN logo_source TEXT;
  END IF;

  -- Add primary_color column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ncua_credit_unions' AND column_name = 'primary_color'
  ) THEN
    ALTER TABLE ncua_credit_unions ADD COLUMN primary_color TEXT;
  END IF;

  -- Add logo_discovered_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ncua_credit_unions' AND column_name = 'logo_discovered_at'
  ) THEN
    ALTER TABLE ncua_credit_unions ADD COLUMN logo_discovered_at TIMESTAMPTZ;
  END IF;
END $$;

-- View to get CUs with their best logos
CREATE OR REPLACE VIEW cu_with_logos AS
SELECT
  n.cu_number,
  n.charter_number,
  n.cu_name,
  n.city,
  n.state,
  n.website,
  n.total_assets,
  n.total_members,
  COALESCE(n.logo_url, l.logo_url_primary) as logo_url,
  COALESCE(n.logo_source, l.source) as logo_source,
  COALESCE(n.primary_color, l.primary_color) as primary_color,
  l.logo_url_brandfetch,
  l.logo_url_clearbit,
  l.logo_url_google,
  l.logo_url_duckduckgo,
  l.logo_url_direct,
  l.quality_score,
  l.status as logo_status
FROM ncua_credit_unions n
LEFT JOIN cu_logos l ON n.charter_number = l.charter_number
WHERE n.is_active = true;

-- Grant access to the view
GRANT SELECT ON cu_with_logos TO anon, authenticated;

COMMENT ON TABLE cu_logos IS 'Stores discovered logos for all 4,300+ credit unions with multi-source fallback';
COMMENT ON VIEW cu_with_logos IS 'Combines NCUA data with discovered logos for easy querying';

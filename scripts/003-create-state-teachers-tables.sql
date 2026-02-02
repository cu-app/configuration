-- STATE TEACHERS TABLE
-- Maps 50 US states with environment photos for CU websites
-- Photos sourced from Unsplash API in batch processing

-- State teachers table (50 rows for all US states)
CREATE TABLE IF NOT EXISTS state_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code CHAR(2) NOT NULL UNIQUE,
  state_name VARCHAR(50) NOT NULL,
  subdomain VARCHAR(50) NOT NULL, -- e.g., ALTeachers.app
  timezone VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
  region VARCHAR(20) NOT NULL, -- Northeast, Southeast, Midwest, Southwest, West
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- State background photos table
CREATE TABLE IF NOT EXISTS state_background_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code CHAR(2) NOT NULL REFERENCES state_teachers(state_code) ON DELETE CASCADE,
  photo_id VARCHAR(50) NOT NULL, -- Unsplash photo ID
  photo_url TEXT NOT NULL,
  photo_url_full TEXT,
  photo_url_regular TEXT,
  photo_url_small TEXT,
  photo_url_thumb TEXT,
  photographer_name VARCHAR(255),
  photographer_username VARCHAR(100),
  photographer_url TEXT,
  description TEXT,
  alt_description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'landscape', -- landscape, cityscape, nature, landmark
  tags JSONB DEFAULT '[]'::jsonb,
  width INTEGER,
  height INTEGER,
  color VARCHAR(10), -- Dominant color hex
  blur_hash VARCHAR(100),
  is_primary BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state_code, photo_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_state_photos_state ON state_background_photos(state_code);
CREATE INDEX IF NOT EXISTS idx_state_photos_primary ON state_background_photos(state_code, is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_state_photos_category ON state_background_photos(state_code, category);

-- Insert all 50 US states alphabetically (A-Z)
INSERT INTO state_teachers (state_code, state_name, subdomain, timezone, region) VALUES
  ('AL', 'Alabama', 'ALTeachers', 'America/Chicago', 'Southeast'),
  ('AK', 'Alaska', 'AKTeachers', 'America/Anchorage', 'West'),
  ('AZ', 'Arizona', 'AZTeachers', 'America/Phoenix', 'Southwest'),
  ('AR', 'Arkansas', 'ARTeachers', 'America/Chicago', 'Southeast'),
  ('CA', 'California', 'CATeachers', 'America/Los_Angeles', 'West'),
  ('CO', 'Colorado', 'COTeachers', 'America/Denver', 'West'),
  ('CT', 'Connecticut', 'CTTeachers', 'America/New_York', 'Northeast'),
  ('DE', 'Delaware', 'DETeachers', 'America/New_York', 'Northeast'),
  ('FL', 'Florida', 'FLTeachers', 'America/New_York', 'Southeast'),
  ('GA', 'Georgia', 'GATeachers', 'America/New_York', 'Southeast'),
  ('HI', 'Hawaii', 'HITeachers', 'Pacific/Honolulu', 'West'),
  ('ID', 'Idaho', 'IDTeachers', 'America/Boise', 'West'),
  ('IL', 'Illinois', 'ILTeachers', 'America/Chicago', 'Midwest'),
  ('IN', 'Indiana', 'INTeachers', 'America/Indiana/Indianapolis', 'Midwest'),
  ('IA', 'Iowa', 'IATeachers', 'America/Chicago', 'Midwest'),
  ('KS', 'Kansas', 'KSTeachers', 'America/Chicago', 'Midwest'),
  ('KY', 'Kentucky', 'KYTeachers', 'America/New_York', 'Southeast'),
  ('LA', 'Louisiana', 'LATeachers', 'America/Chicago', 'Southeast'),
  ('ME', 'Maine', 'METeachers', 'America/New_York', 'Northeast'),
  ('MD', 'Maryland', 'MDTeachers', 'America/New_York', 'Northeast'),
  ('MA', 'Massachusetts', 'MATeachers', 'America/New_York', 'Northeast'),
  ('MI', 'Michigan', 'MITeachers', 'America/Detroit', 'Midwest'),
  ('MN', 'Minnesota', 'MNTeachers', 'America/Chicago', 'Midwest'),
  ('MS', 'Mississippi', 'MSTeachers', 'America/Chicago', 'Southeast'),
  ('MO', 'Missouri', 'MOTeachers', 'America/Chicago', 'Midwest'),
  ('MT', 'Montana', 'MTTeachers', 'America/Denver', 'West'),
  ('NE', 'Nebraska', 'NETeachers', 'America/Chicago', 'Midwest'),
  ('NV', 'Nevada', 'NVTeachers', 'America/Los_Angeles', 'West'),
  ('NH', 'New Hampshire', 'NHTeachers', 'America/New_York', 'Northeast'),
  ('NJ', 'New Jersey', 'NJTeachers', 'America/New_York', 'Northeast'),
  ('NM', 'New Mexico', 'NMTeachers', 'America/Denver', 'Southwest'),
  ('NY', 'New York', 'NYTeachers', 'America/New_York', 'Northeast'),
  ('NC', 'North Carolina', 'NCTeachers', 'America/New_York', 'Southeast'),
  ('ND', 'North Dakota', 'NDTeachers', 'America/Chicago', 'Midwest'),
  ('OH', 'Ohio', 'OHTeachers', 'America/New_York', 'Midwest'),
  ('OK', 'Oklahoma', 'OKTeachers', 'America/Chicago', 'Southwest'),
  ('OR', 'Oregon', 'ORTeachers', 'America/Los_Angeles', 'West'),
  ('PA', 'Pennsylvania', 'PATeachers', 'America/New_York', 'Northeast'),
  ('RI', 'Rhode Island', 'RITeachers', 'America/New_York', 'Northeast'),
  ('SC', 'South Carolina', 'SCTeachers', 'America/New_York', 'Southeast'),
  ('SD', 'South Dakota', 'SDTeachers', 'America/Chicago', 'Midwest'),
  ('TN', 'Tennessee', 'TNTeachers', 'America/Chicago', 'Southeast'),
  ('TX', 'Texas', 'TXTeachers', 'America/Chicago', 'Southwest'),
  ('UT', 'Utah', 'UTTeachers', 'America/Denver', 'West'),
  ('VT', 'Vermont', 'VTTeachers', 'America/New_York', 'Northeast'),
  ('VA', 'Virginia', 'VATeachers', 'America/New_York', 'Southeast'),
  ('WA', 'Washington', 'WATeachers', 'America/Los_Angeles', 'West'),
  ('WV', 'West Virginia', 'WVTeachers', 'America/New_York', 'Southeast'),
  ('WI', 'Wisconsin', 'WITeachers', 'America/Chicago', 'Midwest'),
  ('WY', 'Wyoming', 'WYTeachers', 'America/Denver', 'West')
ON CONFLICT (state_code) DO UPDATE SET
  state_name = EXCLUDED.state_name,
  subdomain = EXCLUDED.subdomain,
  timezone = EXCLUDED.timezone,
  region = EXCLUDED.region,
  updated_at = NOW();

-- Add RLS policies
ALTER TABLE state_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_background_photos ENABLE ROW LEVEL SECURITY;

-- Public read access for state data
CREATE POLICY "Public can read state teachers"
  ON state_teachers FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can read state photos"
  ON state_background_photos FOR SELECT
  TO public
  USING (true);

-- Only service role can modify
CREATE POLICY "Service role can manage state teachers"
  ON state_teachers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage state photos"
  ON state_background_photos FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

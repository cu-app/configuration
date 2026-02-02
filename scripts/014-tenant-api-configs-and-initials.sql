-- ============================================================================
-- TENANT API CONFIGS & INITIALS GENERATOR
-- Stores backend API configuration for each tenant with auto-generated initials
-- ============================================================================

-- Create tenant_api_configs table
CREATE TABLE IF NOT EXISTS tenant_api_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE,
  tenant_initials TEXT NOT NULL, -- e.g., "NFCU", "SFCU", "BECU"
  tenant_name TEXT NOT NULL,
  
  -- API Configuration
  api_base_url TEXT NOT NULL,
  api_key TEXT, -- encrypted in production
  api_secret TEXT, -- encrypted in production
  
  -- Core Banking System
  core_provider TEXT NOT NULL DEFAULT 'symitar' 
    CHECK (core_provider IN ('symitar', 'corelation', 'fiserv', 'jack_henry', 'finastra', 'dna', 'ultradata', 'episys', 'other')),
  core_version TEXT,
  
  -- Environment
  environment TEXT NOT NULL DEFAULT 'sandbox'
    CHECK (environment IN ('sandbox', 'staging', 'production')),
  
  -- Feature Flags
  features JSONB DEFAULT '{
    "transfers": true,
    "billPay": true,
    "mobileDeposit": true,
    "p2p": true,
    "wires": true,
    "ach": true,
    "cardControls": true,
    "statements": true
  }'::jsonb,
  
  -- Rate Limits
  rate_limit_per_minute INTEGER DEFAULT 1000,
  rate_limit_per_day INTEGER DEFAULT 100000,
  
  -- Health & Status
  is_active BOOLEAN DEFAULT true,
  last_health_check TIMESTAMPTZ,
  health_status TEXT DEFAULT 'unknown'
    CHECK (health_status IN ('healthy', 'degraded', 'down', 'unknown')),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  
  -- Ensure initials are unique
  UNIQUE(tenant_initials)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenant_api_configs_tenant_id ON tenant_api_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_api_configs_initials ON tenant_api_configs(tenant_initials);
CREATE INDEX IF NOT EXISTS idx_tenant_api_configs_core_provider ON tenant_api_configs(core_provider);
CREATE INDEX IF NOT EXISTS idx_tenant_api_configs_environment ON tenant_api_configs(environment);
CREATE INDEX IF NOT EXISTS idx_tenant_api_configs_is_active ON tenant_api_configs(is_active);

-- Enable RLS
ALTER TABLE tenant_api_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role full access" ON tenant_api_configs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their tenant config" ON tenant_api_configs
  FOR SELECT USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_superadmin', true) = 'true'
  );

-- Function to auto-generate tenant initials
CREATE OR REPLACE FUNCTION generate_tenant_initials(tenant_name TEXT)
RETURNS TEXT AS $$
DECLARE
  cleaned TEXT;
  words TEXT[];
  initials TEXT;
  word TEXT;
BEGIN
  -- Clean the name
  cleaned := regexp_replace(tenant_name, '^cu[_\s]+', '', 'i');
  cleaned := regexp_replace(cleaned, '[_\s]+(credit[_\s]+union|cu)$', '', 'i');
  cleaned := regexp_replace(cleaned, '_', ' ', 'g');
  cleaned := trim(cleaned);
  
  -- Split into words
  words := string_to_array(cleaned, ' ');
  
  -- Handle single word
  IF array_length(words, 1) = 1 THEN
    word := upper(words[1]);
    IF length(word) <= 4 THEN
      IF length(word) <= 2 THEN
        RETURN word || 'CU';
      ELSE
        RETURN word;
      END IF;
    ELSE
      RETURN substring(word, 1, 4);
    END IF;
  END IF;
  
  -- Handle multiple words - take first letter of each (max 4)
  initials := '';
  FOR i IN 1..LEAST(4, array_length(words, 1)) LOOP
    initials := initials || upper(substring(words[i], 1, 1));
  END LOOP;
  
  -- Append CU if short and not ending in CU
  IF length(initials) <= 2 AND NOT initials LIKE '%CU' THEN
    RETURN initials || 'CU';
  END IF;
  
  RETURN initials;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get unique initials (handles collisions)
CREATE OR REPLACE FUNCTION get_unique_tenant_initials(tenant_name TEXT, current_tenant_id TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  base_initials TEXT;
  unique_initials TEXT;
  counter INTEGER := 1;
BEGIN
  base_initials := generate_tenant_initials(tenant_name);
  unique_initials := base_initials;
  
  -- Check for collisions
  WHILE EXISTS (
    SELECT 1 FROM tenant_api_configs 
    WHERE tenant_initials = unique_initials 
    AND (current_tenant_id IS NULL OR tenant_id != current_tenant_id)
  ) LOOP
    unique_initials := base_initials || counter::text;
    counter := counter + 1;
  END LOOP;
  
  RETURN unique_initials;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate initials on insert
CREATE OR REPLACE FUNCTION auto_generate_tenant_initials()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if not provided
  IF NEW.tenant_initials IS NULL OR NEW.tenant_initials = '' THEN
    NEW.tenant_initials := get_unique_tenant_initials(NEW.tenant_name, NEW.tenant_id);
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_tenant_initials ON tenant_api_configs;
CREATE TRIGGER trigger_auto_tenant_initials
  BEFORE INSERT OR UPDATE ON tenant_api_configs
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_tenant_initials();

-- ============================================================================
-- SEED TENANT API CONFIGS FROM EXISTING CREDIT UNIONS
-- ============================================================================

-- Function to seed tenant configs from credit_unions table
CREATE OR REPLACE FUNCTION seed_tenant_api_configs()
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER := 0;
  cu RECORD;
BEGIN
  FOR cu IN 
    SELECT 
      id,
      name,
      charter,
      COALESCE(core_provider, 'symitar') as core_provider
    FROM credit_unions
    WHERE id NOT IN (SELECT tenant_id FROM tenant_api_configs)
  LOOP
    INSERT INTO tenant_api_configs (
      tenant_id,
      tenant_name,
      tenant_initials,
      api_base_url,
      core_provider,
      environment
    ) VALUES (
      cu.id,
      cu.name,
      get_unique_tenant_initials(cu.name),
      'https://api.' || lower(regexp_replace(cu.id, '[^a-z0-9]', '', 'gi')) || '.cu.app',
      cu.core_provider,
      'sandbox'
    )
    ON CONFLICT (tenant_id) DO NOTHING;
    
    inserted_count := inserted_count + 1;
  END LOOP;
  
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE TENANT CONFIGS (Top 20 Credit Unions)
-- ============================================================================

INSERT INTO tenant_api_configs (tenant_id, tenant_name, tenant_initials, api_base_url, core_provider, environment)
VALUES
  ('cu_navy_federal', 'Navy Federal Credit Union', 'NFCU', 'https://api.navyfederal.cu.app', 'symitar', 'sandbox'),
  ('cu_state_employees', 'State Employees Credit Union', 'SECU', 'https://api.secu.cu.app', 'corelation', 'sandbox'),
  ('cu_pentagon', 'Pentagon Federal Credit Union', 'PFCU', 'https://api.penfed.cu.app', 'symitar', 'sandbox'),
  ('cu_becu', 'Boeing Employees Credit Union', 'BECU', 'https://api.becu.cu.app', 'symitar', 'sandbox'),
  ('cu_schools_first', 'Schools First Federal Credit Union', 'SFCU', 'https://api.schoolsfirst.cu.app', 'symitar', 'sandbox'),
  ('cu_golden_1', 'Golden 1 Credit Union', 'G1CU', 'https://api.golden1.cu.app', 'symitar', 'sandbox'),
  ('cu_first_tech', 'First Tech Federal Credit Union', 'FTCU', 'https://api.firsttech.cu.app', 'corelation', 'sandbox'),
  ('cu_alliant', 'Alliant Credit Union', 'ACU', 'https://api.alliant.cu.app', 'symitar', 'sandbox'),
  ('cu_america_first', 'America First Credit Union', 'AFCU', 'https://api.americafirst.cu.app', 'symitar', 'sandbox'),
  ('cu_suncoast', 'Suncoast Credit Union', 'SNCU', 'https://api.suncoast.cu.app', 'symitar', 'sandbox'),
  ('cu_star_one', 'Star One Credit Union', 'S1CU', 'https://api.starone.cu.app', 'fiserv', 'sandbox'),
  ('cu_security_service', 'Security Service Federal Credit Union', 'SSCU', 'https://api.ssfcu.cu.app', 'symitar', 'sandbox'),
  ('cu_lake_michigan', 'Lake Michigan Credit Union', 'LMCU', 'https://api.lmcu.cu.app', 'corelation', 'sandbox'),
  ('cu_mountain_america', 'Mountain America Credit Union', 'MACU', 'https://api.macu.cu.app', 'symitar', 'sandbox'),
  ('cu_desert_schools', 'Desert Schools Federal Credit Union', 'DSCU', 'https://api.desertschools.cu.app', 'symitar', 'sandbox'),
  ('cu_patelco', 'Patelco Credit Union', 'PTCU', 'https://api.patelco.cu.app', 'symitar', 'sandbox'),
  ('cu_digital', 'Digital Federal Credit Union', 'DCU', 'https://api.dcu.cu.app', 'fiserv', 'sandbox'),
  ('cu_delta_community', 'Delta Community Credit Union', 'DCCU', 'https://api.deltacommunity.cu.app', 'symitar', 'sandbox'),
  ('cu_educators', 'Educators Credit Union', 'ECU', 'https://api.educators.cu.app', 'corelation', 'sandbox'),
  ('cu_vystar', 'VyStar Credit Union', 'VSCU', 'https://api.vystar.cu.app', 'symitar', 'sandbox')
ON CONFLICT (tenant_id) DO UPDATE SET
  tenant_name = EXCLUDED.tenant_name,
  api_base_url = EXCLUDED.api_base_url,
  core_provider = EXCLUDED.core_provider,
  updated_at = NOW();

-- Grant permissions
GRANT ALL ON tenant_api_configs TO authenticated;
GRANT ALL ON tenant_api_configs TO service_role;
GRANT EXECUTE ON FUNCTION generate_tenant_initials TO authenticated;
GRANT EXECUTE ON FUNCTION get_unique_tenant_initials TO authenticated;
GRANT EXECUTE ON FUNCTION seed_tenant_api_configs TO service_role;

-- Comments
COMMENT ON TABLE tenant_api_configs IS 'Stores backend API configuration for each credit union tenant';
COMMENT ON COLUMN tenant_api_configs.tenant_initials IS 'Unique 2-4 character identifier (e.g., NFCU, BECU)';
COMMENT ON FUNCTION generate_tenant_initials IS 'Generates initial letters from tenant name (e.g., Navy Federal -> NFCU)';
COMMENT ON FUNCTION get_unique_tenant_initials IS 'Ensures unique initials by appending numbers if needed';

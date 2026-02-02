-- Tables for background automation and data enrichment

-- Enrichment logs for tracking batch processing
CREATE TABLE IF NOT EXISTS enrichment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_size INT NOT NULL,
  offset_value INT NOT NULL DEFAULT 0,
  processed INT NOT NULL DEFAULT 0,
  successful INT NOT NULL DEFAULT 0,
  failed INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add enrichment columns to credit_unions
ALTER TABLE credit_unions ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT NULL;
ALTER TABLE credit_unions ADD COLUMN IF NOT EXISTS last_enriched_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE credit_unions ADD COLUMN IF NOT EXISTS logo_source TEXT DEFAULT NULL;
ALTER TABLE credit_unions ADD COLUMN IF NOT EXISTS logo_discovered_at TIMESTAMPTZ DEFAULT NULL;

-- Social profiles for credit unions
CREATE TABLE IF NOT EXISTS cu_social_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cu_id UUID NOT NULL REFERENCES credit_unions(id) ON DELETE CASCADE,
  facebook TEXT,
  twitter TEXT,
  instagram TEXT,
  linkedin TEXT,
  youtube TEXT,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cu_id)
);

-- App store ratings
CREATE TABLE IF NOT EXISTS cu_app_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cu_id UUID NOT NULL REFERENCES credit_unions(id) ON DELETE CASCADE,
  ios_app_id TEXT,
  ios_rating DECIMAL(2,1),
  ios_review_count INT,
  android_app_id TEXT,
  android_rating DECIMAL(2,1),
  android_review_count INT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cu_id)
);

-- Products discovered from websites
CREATE TABLE IF NOT EXISTS cu_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cu_id UUID NOT NULL REFERENCES credit_unions(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL,
  product_name TEXT NOT NULL,
  rate_apy TEXT,
  source_url TEXT,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  UNIQUE(cu_id, product_type, product_name)
);

-- Enable RLS
ALTER TABLE enrichment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cu_social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cu_app_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cu_products ENABLE ROW LEVEL SECURITY;

-- RLS policies for tenant isolation
CREATE POLICY "Tenants can view their own social profiles"
  ON cu_social_profiles FOR SELECT
  USING (cu_id IN (SELECT cu_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Tenants can view their own app ratings"
  ON cu_app_ratings FOR SELECT
  USING (cu_id IN (SELECT cu_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Tenants can view their own products"
  ON cu_products FOR SELECT
  USING (cu_id IN (SELECT cu_id FROM tenant_users WHERE user_id = auth.uid()));

-- Tenant users table for mapping users to credit unions
CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cu_id UUID NOT NULL REFERENCES credit_unions(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'employee', 'marketing', 'developer', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cu_id)
);

-- Admin users table (can view all CUs)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial admin
INSERT INTO admin_users (email) VALUES ('kmkusche@gmail.com') ON CONFLICT DO NOTHING;
INSERT INTO admin_users (email) VALUES ('compliance@cu.app') ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_cu_id ON tenant_users(cu_id);
CREATE INDEX IF NOT EXISTS idx_cu_products_cu_id ON cu_products(cu_id);

-- ADD DEMO CREDIT UNION (compliance@cu.app) AND MARKETING ROLE

-- Add compliance@cu.app demo credit union
INSERT INTO ncua_credit_unions (
  charter_number,
  cu_name,
  city,
  state,
  zip_code,
  total_assets,
  total_members,
  website,
  is_active
) VALUES (
  999999,
  'CU.APP Demo Credit Union',
  'San Francisco',
  'CA',
  '94105',
  0, -- Zero assets
  1, -- One member
  'demo.cu.app',
  TRUE
) ON CONFLICT (charter_number) DO UPDATE SET
  cu_name = EXCLUDED.cu_name,
  total_assets = EXCLUDED.total_assets,
  total_members = EXCLUDED.total_members;

-- Create user roles table if not exists
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert roles including marketing
INSERT INTO user_roles (role_name, description, permissions) VALUES
  ('admin', 'Full system administrator', '{"all": true}'::jsonb),
  ('developer', 'Developer access - code and config', '{"config": true, "code": true, "preview": true}'::jsonb),
  ('marketing', 'Marketing CMS access - products, content, website', '{"products": true, "content": true, "website": true, "cms": true}'::jsonb),
  ('compliance', 'Compliance and regulatory access', '{"compliance": true, "audit": true, "reports": true}'::jsonb),
  ('support', 'Member support access', '{"members": true, "support": true, "messaging": true}'::jsonb)
ON CONFLICT (role_name) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- Create marketing content table
CREATE TABLE IF NOT EXISTS marketing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(100) NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- hero, cta, testimonial, feature, faq
  content_key VARCHAR(100) NOT NULL,
  title TEXT,
  subtitle TEXT,
  body TEXT,
  cta_text VARCHAR(100),
  cta_url TEXT,
  image_url TEXT,
  video_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  ab_variant VARCHAR(10), -- A, B, etc for A/B testing
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, content_type, content_key, ab_variant)
);

-- Marketing website pages table
CREATE TABLE IF NOT EXISTS marketing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(100) NOT NULL,
  page_slug VARCHAR(100) NOT NULL,
  page_title VARCHAR(255) NOT NULL,
  meta_description TEXT,
  og_image TEXT,
  hero_content_id UUID REFERENCES marketing_content(id),
  page_sections JSONB DEFAULT '[]'::jsonb, -- Array of content IDs in order
  custom_css TEXT,
  custom_js TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, page_slug)
);

-- Email domains for validation
CREATE TABLE IF NOT EXISTS cu_email_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(100) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, domain)
);

-- RLS
ALTER TABLE marketing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cu_email_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Marketing can manage content"
  ON marketing_content FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Marketing can manage pages"
  ON marketing_pages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role manages domains"
  ON cu_email_domains FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public read roles"
  ON user_roles FOR SELECT
  TO public
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketing_content_tenant ON marketing_content(tenant_id);
CREATE INDEX IF NOT EXISTS idx_marketing_content_type ON marketing_content(tenant_id, content_type);
CREATE INDEX IF NOT EXISTS idx_marketing_pages_tenant ON marketing_pages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_marketing_pages_slug ON marketing_pages(tenant_id, page_slug);
CREATE INDEX IF NOT EXISTS idx_cu_email_domains_domain ON cu_email_domains(domain);

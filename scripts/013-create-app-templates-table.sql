-- ============================================================================
-- APP TEMPLATES TABLE
-- Stores Flutter app templates for each tenant (credit union)
-- Supports: create, delete, rename, logo upload, theme configuration
-- ============================================================================

-- Create app_templates table
CREATE TABLE IF NOT EXISTS app_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  
  -- Logo configuration
  logo_url TEXT,
  logo_storage_path TEXT,
  
  -- Splash screen configuration
  splash_config JSONB DEFAULT '{
    "backgroundColor": "#ffffff",
    "logoSize": "large",
    "showLoadingIndicator": true,
    "tagline": "Mobile Banking",
    "animationDuration": 2500
  }'::jsonb,
  
  -- Theme configuration (controls the preview app)
  theme_config JSONB DEFAULT '{
    "mode": "dark",
    "primaryColor": "#3B82F6",
    "secondaryColor": "#10B981",
    "borderRadius": 12,
    "fontFamily": "Geist"
  }'::jsonb,
  
  -- Navigation configuration
  nav_config JSONB DEFAULT '{
    "mobileStyle": "bottom",
    "webStyle": "rail",
    "items": [
      {"id": "home", "label": "Home", "icon": "home"},
      {"id": "accounts", "label": "Accounts", "icon": "wallet"},
      {"id": "transfer", "label": "Transfer", "icon": "swap"},
      {"id": "cards", "label": "Cards", "icon": "credit_card"},
      {"id": "settings", "label": "Settings", "icon": "settings"}
    ]
  }'::jsonb,
  
  -- Feature flags
  features JSONB DEFAULT '{
    "biometricAuth": true,
    "darkMode": true,
    "pushNotifications": true,
    "checkDeposit": true,
    "billPay": true,
    "p2pTransfers": true
  }'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  
  -- Constraints
  UNIQUE(tenant_id, slug)
);

-- Create index for tenant lookups
CREATE INDEX IF NOT EXISTS idx_app_templates_tenant_id ON app_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_app_templates_slug ON app_templates(slug);
CREATE INDEX IF NOT EXISTS idx_app_templates_is_active ON app_templates(is_active);

-- Enable Row Level Security
ALTER TABLE app_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their tenant's templates
CREATE POLICY "Users can view their tenant templates"
  ON app_templates FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_superadmin', true) = 'true'
  );

-- RLS Policy: Users can insert templates for their tenant
CREATE POLICY "Users can insert templates for their tenant"
  ON app_templates FOR INSERT
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_superadmin', true) = 'true'
  );

-- RLS Policy: Users can update their tenant's templates
CREATE POLICY "Users can update their tenant templates"
  ON app_templates FOR UPDATE
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_superadmin', true) = 'true'
  );

-- RLS Policy: Users can delete their tenant's templates
CREATE POLICY "Users can delete their tenant templates"
  ON app_templates FOR DELETE
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_superadmin', true) = 'true'
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_app_templates_updated_at ON app_templates;
CREATE TRIGGER trigger_app_templates_updated_at
  BEFORE UPDATE ON app_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_app_templates_updated_at();

-- Function to ensure only one default template per tenant
CREATE OR REPLACE FUNCTION ensure_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE app_templates 
    SET is_default = false 
    WHERE tenant_id = NEW.tenant_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for single default
DROP TRIGGER IF EXISTS trigger_single_default_template ON app_templates;
CREATE TRIGGER trigger_single_default_template
  BEFORE INSERT OR UPDATE ON app_templates
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_template();

-- Create storage bucket for app logos (if not exists)
-- Note: This needs to be run via Supabase Dashboard or supabase CLI
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('app-logos', 'app-logos', true)
-- ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT ALL ON app_templates TO authenticated;
GRANT ALL ON app_templates TO service_role;

-- ============================================================================
-- SAMPLE DATA (Optional - for development)
-- ============================================================================

-- Insert a sample template for testing
-- INSERT INTO app_templates (tenant_id, name, slug, description, is_default)
-- VALUES (
--   'sample-tenant-id',
--   'Default App',
--   'default-app',
--   'The default mobile banking app template',
--   true
-- );

COMMENT ON TABLE app_templates IS 'Stores Flutter app templates for each credit union tenant';
COMMENT ON COLUMN app_templates.tenant_id IS 'Credit union identifier';
COMMENT ON COLUMN app_templates.splash_config IS 'Splash screen configuration (colors, logo, animation)';
COMMENT ON COLUMN app_templates.theme_config IS 'Theme configuration sent to Flutter preview app via postMessage';
COMMENT ON COLUMN app_templates.nav_config IS 'Navigation configuration (bottom nav items, web rail items)';
COMMENT ON COLUMN app_templates.features IS 'Feature flags for the app';

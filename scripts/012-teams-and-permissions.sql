-- Teams, Permissions, and App Store Credentials Schema
-- Enables tenant-scoped access control and team delegation

-- ============================================================================
-- TEAM MEMBERS
-- ============================================================================

DROP TABLE IF EXISTS cu_section_permissions CASCADE;
DROP TABLE IF EXISTS cu_team_members CASCADE;
DROP TABLE IF EXISTS cu_app_store_credentials CASCADE;
DROP TABLE IF EXISTS cu_deploy_history CASCADE;

-- Team members per tenant
CREATE TABLE cu_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  avatar_url TEXT,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- Indexes
CREATE INDEX idx_cu_team_members_tenant_id ON cu_team_members(tenant_id);
CREATE INDEX idx_cu_team_members_user_id ON cu_team_members(user_id);
CREATE INDEX idx_cu_team_members_email ON cu_team_members(email);

-- ============================================================================
-- SECTION-LEVEL PERMISSIONS (Delegation Matrix)
-- ============================================================================

-- All 16 configuration sections that can be delegated
CREATE TYPE config_section AS ENUM (
  'identity',      -- Identity & Brand
  'tokens',        -- Design Tokens
  'features',      -- Feature Flags
  'ivr',           -- IVR & Voice
  'products',      -- Product Configuration
  'rules',         -- Business Rules
  'fraud',         -- Fraud & Risk
  'compliance',    -- Compliance (BSA/AML, OFAC, FDX, 1033)
  'integrations',  -- Integrations
  'channels',      -- Channels
  'notifications', -- Notifications
  'content',       -- Content & Copy
  'ux',            -- UX Settings
  'ai',            -- AI Coaching
  'deploy',        -- Deployment
  'poweron'        -- PowerOn Specs
);

CREATE TABLE cu_section_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES cu_team_members(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  can_view BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_member_id, section_id)
);

CREATE INDEX idx_cu_section_permissions_team_member ON cu_section_permissions(team_member_id);
CREATE INDEX idx_cu_section_permissions_section ON cu_section_permissions(section_id);

-- ============================================================================
-- APP STORE CREDENTIALS
-- ============================================================================

CREATE TABLE cu_app_store_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE,
  
  -- iOS: App Store Connect API credentials
  apple_issuer_id TEXT,
  apple_key_id TEXT,
  apple_private_key TEXT, -- P8 key content (encrypted at rest by Supabase)
  apple_app_id TEXT,
  apple_bundle_id TEXT,
  
  -- Android: Google Play Developer API credentials
  google_service_account_json TEXT, -- Full service account JSON (encrypted)
  google_package_name TEXT,
  
  -- Metadata
  ios_connected BOOLEAN DEFAULT false,
  android_connected BOOLEAN DEFAULT false,
  last_ios_sync TIMESTAMPTZ,
  last_android_sync TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cu_app_store_credentials_tenant ON cu_app_store_credentials(tenant_id);

-- ============================================================================
-- DEPLOY HISTORY (for CI/CD self-healing)
-- ============================================================================

CREATE TABLE cu_deploy_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  
  -- Deploy info
  version INTEGER NOT NULL,
  config_snapshot JSONB NOT NULL, -- Full config at time of deploy
  commit_sha TEXT,
  commit_message TEXT,
  branch TEXT DEFAULT 'main',
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'deploying', 'success', 'failed', 'rolled_back')),
  error_message TEXT,
  
  -- Health check results
  health_check_passed BOOLEAN,
  health_check_details JSONB,
  
  -- Rollback info
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by UUID REFERENCES auth.users(id),
  rolled_back_to_version INTEGER,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cu_deploy_history_tenant ON cu_deploy_history(tenant_id);
CREATE INDEX idx_cu_deploy_history_status ON cu_deploy_history(status);
CREATE INDEX idx_cu_deploy_history_created ON cu_deploy_history(created_at DESC);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

CREATE TABLE cu_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_name TEXT,
  
  -- Action details
  action TEXT NOT NULL, -- 'config.update', 'team.invite', 'team.remove', 'permission.change', 'deploy.trigger', 'deploy.rollback'
  section_id TEXT, -- Which section was affected
  
  -- Change details
  old_value JSONB,
  new_value JSONB,
  change_summary TEXT,
  
  -- Request context
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cu_audit_log_tenant ON cu_audit_log(tenant_id);
CREATE INDEX idx_cu_audit_log_user ON cu_audit_log(user_id);
CREATE INDEX idx_cu_audit_log_action ON cu_audit_log(action);
CREATE INDEX idx_cu_audit_log_created ON cu_audit_log(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE cu_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cu_section_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cu_app_store_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE cu_deploy_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cu_audit_log ENABLE ROW LEVEL SECURITY;

-- Team members: users can only see their own tenant's team
CREATE POLICY "Team members visible to same tenant" ON cu_team_members
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM cu_team_members WHERE user_id = auth.uid()
    )
  );

-- Team members: only owner/admin can insert
CREATE POLICY "Owner/admin can invite team members" ON cu_team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cu_team_members 
      WHERE user_id = auth.uid() 
      AND tenant_id = cu_team_members.tenant_id
      AND role IN ('owner', 'admin')
    )
  );

-- Team members: only owner can delete (except self)
CREATE POLICY "Owner can remove team members" ON cu_team_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM cu_team_members 
      WHERE user_id = auth.uid() 
      AND tenant_id = cu_team_members.tenant_id
      AND role = 'owner'
    )
    OR user_id = auth.uid() -- Can remove self
  );

-- Section permissions: visible to same tenant
CREATE POLICY "Section permissions visible to same tenant" ON cu_section_permissions
  FOR SELECT USING (
    team_member_id IN (
      SELECT tm.id FROM cu_team_members tm
      WHERE tm.tenant_id IN (
        SELECT tenant_id FROM cu_team_members WHERE user_id = auth.uid()
      )
    )
  );

-- Section permissions: only owner/admin can modify
CREATE POLICY "Owner/admin can modify permissions" ON cu_section_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cu_team_members tm
      JOIN cu_team_members current_user_tm ON current_user_tm.tenant_id = tm.tenant_id
      WHERE cu_section_permissions.team_member_id = tm.id
      AND current_user_tm.user_id = auth.uid()
      AND current_user_tm.role IN ('owner', 'admin')
    )
  );

-- App store credentials: only visible to same tenant's owner/admin
CREATE POLICY "App store credentials visible to owner/admin" ON cu_app_store_credentials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cu_team_members 
      WHERE user_id = auth.uid() 
      AND tenant_id = cu_app_store_credentials.tenant_id
      AND role IN ('owner', 'admin')
    )
  );

-- Deploy history: visible to same tenant
CREATE POLICY "Deploy history visible to same tenant" ON cu_deploy_history
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM cu_team_members WHERE user_id = auth.uid()
    )
  );

-- Deploy history: only owner/admin can trigger deploys
CREATE POLICY "Owner/admin can deploy" ON cu_deploy_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cu_team_members 
      WHERE user_id = auth.uid() 
      AND tenant_id = cu_deploy_history.tenant_id
      AND role IN ('owner', 'admin')
    )
  );

-- Audit log: visible to same tenant's owner/admin
CREATE POLICY "Audit log visible to owner/admin" ON cu_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cu_team_members 
      WHERE user_id = auth.uid() 
      AND tenant_id = cu_audit_log.tenant_id
      AND role IN ('owner', 'admin')
    )
  );

-- Audit log: insert allowed for authenticated users (system logs)
CREATE POLICY "Authenticated users can create audit entries" ON cu_audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's role for a tenant
CREATE OR REPLACE FUNCTION get_user_tenant_role(p_user_id UUID, p_tenant_id TEXT)
RETURNS TEXT AS $$
  SELECT role FROM cu_team_members 
  WHERE user_id = p_user_id AND tenant_id = p_tenant_id
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Function to get user's tenants
CREATE OR REPLACE FUNCTION get_user_tenants(p_user_id UUID)
RETURNS TABLE(tenant_id TEXT, tenant_name TEXT, role TEXT) AS $$
  SELECT tm.tenant_id, cc.tenant_name, tm.role
  FROM cu_team_members tm
  LEFT JOIN cu_configs cc ON cc.tenant_id = tm.tenant_id
  WHERE tm.user_id = p_user_id
  ORDER BY tm.role = 'owner' DESC, cc.tenant_name;
$$ LANGUAGE sql STABLE;

-- Function to check if user can edit a section
CREATE OR REPLACE FUNCTION can_user_edit_section(p_user_id UUID, p_tenant_id TEXT, p_section_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_can_edit BOOLEAN;
BEGIN
  -- Get user's role
  SELECT role INTO v_role FROM cu_team_members 
  WHERE user_id = p_user_id AND tenant_id = p_tenant_id;
  
  -- Owner and admin can edit everything
  IF v_role IN ('owner', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Viewer can never edit
  IF v_role = 'viewer' THEN
    RETURN FALSE;
  END IF;
  
  -- Editor: check section-specific permissions
  SELECT sp.can_edit INTO v_can_edit
  FROM cu_section_permissions sp
  JOIN cu_team_members tm ON tm.id = sp.team_member_id
  WHERE tm.user_id = p_user_id AND tm.tenant_id = p_tenant_id AND sp.section_id = p_section_id;
  
  RETURN COALESCE(v_can_edit, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if user can view a section
CREATE OR REPLACE FUNCTION can_user_view_section(p_user_id UUID, p_tenant_id TEXT, p_section_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_can_view BOOLEAN;
BEGIN
  -- Get user's role
  SELECT role INTO v_role FROM cu_team_members 
  WHERE user_id = p_user_id AND tenant_id = p_tenant_id;
  
  -- Owner, admin, and viewer can view everything
  IF v_role IN ('owner', 'admin', 'viewer') THEN
    RETURN TRUE;
  END IF;
  
  -- Editor: check section-specific permissions
  SELECT sp.can_view INTO v_can_view
  FROM cu_section_permissions sp
  JOIN cu_team_members tm ON tm.id = sp.team_member_id
  WHERE tm.user_id = p_user_id AND tm.tenant_id = p_tenant_id AND sp.section_id = p_section_id;
  
  RETURN COALESCE(v_can_view, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- DEFAULT DATA FOR DEVELOPMENT
-- ============================================================================

-- For development: allow public access (remove in production)
CREATE POLICY "Dev: Allow public read on team_members" ON cu_team_members FOR SELECT USING (true);
CREATE POLICY "Dev: Allow public insert on team_members" ON cu_team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Dev: Allow public update on team_members" ON cu_team_members FOR UPDATE USING (true);
CREATE POLICY "Dev: Allow public delete on team_members" ON cu_team_members FOR DELETE USING (true);

CREATE POLICY "Dev: Allow public read on section_permissions" ON cu_section_permissions FOR SELECT USING (true);
CREATE POLICY "Dev: Allow public insert on section_permissions" ON cu_section_permissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Dev: Allow public update on section_permissions" ON cu_section_permissions FOR UPDATE USING (true);
CREATE POLICY "Dev: Allow public delete on section_permissions" ON cu_section_permissions FOR DELETE USING (true);

CREATE POLICY "Dev: Allow public on app_store_credentials" ON cu_app_store_credentials FOR ALL USING (true);
CREATE POLICY "Dev: Allow public on deploy_history" ON cu_deploy_history FOR ALL USING (true);
CREATE POLICY "Dev: Allow public on audit_log" ON cu_audit_log FOR ALL USING (true);

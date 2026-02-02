-- Feature packages (replaces deceptacon_packages for feature clone API)
CREATE TABLE IF NOT EXISTS feature_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id text NOT NULL UNIQUE,
  cu_id text NOT NULL,
  manifest jsonb NOT NULL,
  features text[] NOT NULL DEFAULT '{}',
  license_key text NOT NULL,
  license_type text NOT NULL DEFAULT 'production',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_feature_packages_cu_id ON feature_packages(cu_id);
CREATE INDEX IF NOT EXISTS idx_feature_packages_created_at ON feature_packages(created_at DESC);

COMMENT ON TABLE feature_packages IS 'Package manifests for feature clone API (/api/features/clone)';

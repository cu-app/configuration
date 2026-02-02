-- CU.APP Configuration Matrix Database Schema
-- Stores complete credit union configurations

-- Drop existing tables if any
DROP TABLE IF EXISTS cu_configs CASCADE;
DROP TABLE IF EXISTS cu_config_history CASCADE;

-- Main configuration table - stores the complete JSON config per CU
CREATE TABLE cu_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT UNIQUE NOT NULL, -- e.g., "cu_navyfed_001"
  tenant_name TEXT NOT NULL,
  config JSONB NOT NULL, -- Complete CreditUnionConfig object
  environment TEXT NOT NULL DEFAULT 'development',
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, archived
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

-- Configuration history for audit trail
CREATE TABLE cu_config_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cu_config_id UUID NOT NULL REFERENCES cu_configs(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  config JSONB NOT NULL,
  version INTEGER NOT NULL,
  change_summary TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by TEXT
);

-- Indexes for performance
CREATE INDEX idx_cu_configs_tenant_id ON cu_configs(tenant_id);
CREATE INDEX idx_cu_configs_status ON cu_configs(status);
CREATE INDEX idx_cu_configs_environment ON cu_configs(environment);
CREATE INDEX idx_cu_config_history_cu_config_id ON cu_config_history(cu_config_id);
CREATE INDEX idx_cu_config_history_tenant_id ON cu_config_history(tenant_id);

-- Enable RLS
ALTER TABLE cu_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cu_config_history ENABLE ROW LEVEL SECURITY;

-- Public access policies (adjust for production)
CREATE POLICY "Allow public read on cu_configs" ON cu_configs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on cu_configs" ON cu_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on cu_configs" ON cu_configs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on cu_configs" ON cu_configs FOR DELETE USING (true);

CREATE POLICY "Allow public read on cu_config_history" ON cu_config_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert on cu_config_history" ON cu_config_history FOR INSERT WITH CHECK (true);

-- Function to auto-increment version and save history
CREATE OR REPLACE FUNCTION save_config_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Save old config to history
  INSERT INTO cu_config_history (cu_config_id, tenant_id, config, version, change_summary, changed_by)
  VALUES (OLD.id, OLD.tenant_id, OLD.config, OLD.version, 'Configuration updated', NEW.updated_by);
  
  -- Increment version
  NEW.version := OLD.version + 1;
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to save history on update
CREATE TRIGGER trigger_save_config_history
  BEFORE UPDATE ON cu_configs
  FOR EACH ROW
  WHEN (OLD.config IS DISTINCT FROM NEW.config)
  EXECUTE FUNCTION save_config_history();

-- Insert sample Navy Federal configuration
INSERT INTO cu_configs (tenant_id, tenant_name, environment, status, config) VALUES (
  'cu_navyfed_001',
  'Navy Federal Credit Union',
  'production',
  'active',
  '{
    "tenant": {
      "id": "cu_navyfed_001",
      "name": "Navy Federal Credit Union",
      "charter_number": "24697",
      "domain": "navyfed.app",
      "domains": { "aliases": ["nfcu.app", "navyfederal.app"] },
      "timezone": "America/New_York",
      "locale": "en-US",
      "support": { "phone": "1-888-842-6328", "email": "support@navyfed.app" },
      "legal": { "name": "Navy Federal Credit Union", "routing": "256074974" }
    },
    "tokens": {
      "color": {
        "primary": "oklch(35% 0.15 220)",
        "secondary": "oklch(45% 0.12 220)",
        "accent": "oklch(55% 0.2 45)",
        "success": "oklch(70% 0.2 145)",
        "warning": "oklch(75% 0.2 85)",
        "error": "oklch(55% 0.25 25)",
        "surface": "oklch(98% 0.01 220)",
        "on-surface": "oklch(15% 0.02 220)"
      },
      "typography": {
        "family": { "heading": "Inter", "body": "Inter", "mono": "JetBrains Mono" },
        "scale": 1.25
      },
      "spacing": { "unit": 4 },
      "radius": { "sm": 4, "md": 8, "lg": 16, "full": 9999 },
      "shadow": {
        "elevation": {
          "1": "0 1px 2px rgba(0,0,0,0.05)",
          "2": "0 4px 6px rgba(0,0,0,0.1)",
          "3": "0 10px 15px rgba(0,0,0,0.15)"
        }
      },
      "logo": { "primary": "cdn.cu.app/navyfed/logo.svg", "mark": "cdn.cu.app/navyfed/mark.svg", "wordmark": "cdn.cu.app/navyfed/wordmark.svg" },
      "favicon": "cdn.cu.app/navyfed/favicon.ico"
    },
    "features": {
      "mobile_deposit": true,
      "bill_pay": true,
      "p2p": true,
      "wire_transfer": true,
      "ach_origination": true,
      "card_controls": true,
      "travel_notifications": true,
      "budgeting": true,
      "goals": true,
      "statements": true,
      "alerts": true,
      "secure_messaging": true,
      "co_browse": false,
      "video_banking": false,
      "voice_biometrics": false,
      "face_id": true,
      "fingerprint": true,
      "external_transfers": true,
      "loan_applications": true,
      "account_opening": true,
      "joint_access": true,
      "beneficiaries": true,
      "overdraft_protection": true,
      "skip_a_pay": false,
      "ai_coach": true,
      "ai_coach_personality": "supportive",
      "dark_mode": true,
      "accessibility": { "high_contrast": true, "screen_reader": true, "reduced_motion": true }
    },
    "products": {
      "shares": [
        {
          "id": "share_checking_001",
          "name": "Free Checking",
          "type": "CHECKING",
          "apy": 0.01,
          "min_balance": 0,
          "monthly_fee": 0,
          "fee_waiver_balance": null,
          "atm_fee_refund": true,
          "atm_fee_refund_limit": 20,
          "overdraft_limit": 500,
          "overdraft_fee": 0,
          "transfer_limit": null,
          "icon": "wallet",
          "color": "primary",
          "eligibility": { "min_age": 18 }
        }
      ],
      "loans": [
        {
          "id": "loan_auto_new",
          "name": "New Auto Loan",
          "type": "AUTO",
          "rate_min": 4.99,
          "rate_max": 18.99,
          "term_min": 12,
          "term_max": 84,
          "amount_min": 5000,
          "amount_max": 100000,
          "ltv_max": 120
        }
      ],
      "cards": [
        {
          "id": "card_visa_signature",
          "name": "Visa Signature",
          "network": "VISA",
          "type": "CREDIT",
          "rewards_rate": 1.5,
          "annual_fee": 0,
          "foreign_tx_fee": 0,
          "apr_purchase": 12.99,
          "apr_cash": 24.99
        }
      ]
    },
    "rules": {
      "transfer": {
        "internal": { "daily_limit": 50000, "per_tx_limit": 25000 },
        "external": { "daily_limit": 10000, "per_tx_limit": 5000, "hold_days": 3 },
        "p2p": { "daily_limit": 2500, "per_tx_limit": 1000, "monthly_limit": 10000 },
        "wire": { "domestic_fee": 25, "international_fee": 45 }
      },
      "bill_pay": { "daily_limit": 10000, "per_tx_limit": 5000 },
      "mobile_deposit": {
        "daily_limit": 5000,
        "monthly_limit": 25000,
        "per_check_limit": 2500,
        "hold_days": { "default": 2, "new_member": 5, "large_check": 7 },
        "large_check_threshold": 2500
      },
      "atm": { "daily_withdrawal": 500, "per_tx_withdrawal": 300 },
      "pos": { "daily_limit": 5000, "per_tx_limit": 2500 },
      "session": { "timeout_minutes": 15, "remember_device_days": 30 },
      "password": { "min_length": 12, "require_special": true, "require_number": true, "require_uppercase": true, "expiry_days": 0 },
      "mfa": { "required": true, "methods": ["sms", "email", "totp", "push"] },
      "lockout": { "attempts": 5, "duration_minutes": 30 }
    },
    "fraud": {
      "risk_threshold": { "block": 90, "review": 70, "step_up": 50 },
      "velocity": { "tx_per_hour": 10, "tx_per_day": 50, "amount_per_hour": 5000, "amount_per_day": 25000, "new_payee_per_day": 3 },
      "device": { "require_trusted": false, "max_devices": 5 },
      "geo": { "allowed_countries": ["US", "CA", "MX"], "blocked_countries": ["RU", "KP", "IR"], "domestic_only": false },
      "network": { "share_signals": true, "consume_signals": true },
      "alerts": { "email": true, "sms": true, "push": true },
      "realtime": { "enabled": true }
    },
    "compliance": {
      "kyc": { "provider": "internal", "level": "cip", "document_required": false, "selfie_required": false },
      "ctr": { "threshold": 10000 },
      "sar": { "auto_file": false },
      "ofac": { "enabled": true, "on_onboard": true, "on_transfer": true },
      "pep": { "enabled": true },
      "adverse_media": { "enabled": true },
      "fdx": { "version": "6.4", "consent_duration_days": 365, "data_clusters": ["ACCOUNT_BASIC", "TRANSACTIONS"] },
      "section_1033": { "enabled": true, "developer_portal": true },
      "audit": { "retention_years": 7, "immutable": true, "rekor_enabled": true },
      "regulation_e": { "enabled": true, "provisional_credit_days": 10 },
      "wcag": { "level": "AA" },
      "state": "VA",
      "state_licenses": ["VA", "FL", "TX", "CA"]
    },
    "integrations": {
      "core": { "provider": "symitar", "host": "tunnel://cu_navyfed_001", "environment": "production", "timeout_ms": 30000, "retry_attempts": 3 },
      "card_processor": { "provider": "fiserv", "bin": "412345", "endpoint": "https://api.fiserv.com" },
      "ach": { "provider": "federal_reserve", "routing": "256074974", "odfi_id": "12345678" },
      "rtp": { "enabled": true, "participant_id": "NAVYFEDCU" },
      "fednow": { "enabled": true, "participant_id": "256074974" },
      "shared_branching": { "enabled": true, "cu_number": "12345" },
      "atm_network": { "provider": "co-op" },
      "bill_pay": { "provider": "internal" },
      "credit_bureau": { "provider": "equifax" },
      "insurance": { "provider": "cuna_mutual" },
      "statement": { "provider": "internal" },
      "sms": { "provider": "twilio", "from_number": "+18888426328" },
      "email": { "provider": "sendgrid", "from_address": "noreply@navyfed.app" },
      "push": { "provider": "firebase" },
      "analytics": { "provider": "internal" }
    },
    "channels": {
      "mobile": {
        "ios": { "enabled": true, "app_store_id": "123456789", "min_version": "2.0.0" },
        "android": { "enabled": true, "play_store_id": "com.navyfed.app", "min_version": "2.0.0" }
      },
      "web": { "enabled": true, "url": "https://navyfed.app", "subdomain": null },
      "branch": {
        "enabled": true,
        "teller_app": true,
        "hardware": { "signature_pad": "topaz", "scanner": "canon", "cash_drawer": "apg", "receipt_printer": "epson" }
      },
      "ivr": { "enabled": true, "phone_number": "+18888426328", "voice_biometrics": false, "callback": true },
      "sms_banking": { "enabled": false },
      "chatbot": { "enabled": true, "escalation": true },
      "video": { "enabled": false }
    },
    "notifications": {
      "login": { "new_device": ["push", "email"], "failed": ["push"] },
      "transaction": { "large": ["push", "sms"], "large_threshold": 500, "international": ["push", "sms"], "declined": ["push"] },
      "balance": { "low": ["push", "email"], "low_threshold": 100, "negative": ["push", "sms", "email"] },
      "deposit": { "received": ["push"], "direct_deposit": ["push", "email"] },
      "payment": { "due": ["push", "email"], "due_days_before": 3, "posted": ["push"] },
      "statement": { "ready": ["email"] },
      "fraud": { "alert": ["push", "sms", "email"] },
      "card": { "frozen": ["push", "email"], "unfrozen": ["push"] },
      "message": { "new": ["push"] }
    },
    "content": {
      "app_name": "Navy Federal",
      "tagline": "Serving Those Who Serve",
      "member_term": "member",
      "share_term": "account",
      "welcome_message": "Welcome back, {first_name}",
      "onboarding": { "headline": "Join the Navy Federal Family", "steps": ["identity", "funding", "products"] },
      "error": {
        "generic": "Something went wrong. Please try again or contact us at 1-888-842-6328.",
        "network": "Please check your internet connection and try again.",
        "session": "Your session has expired. Please log in again."
      },
      "legal": {
        "privacy_url": "https://navyfed.app/privacy",
        "terms_url": "https://navyfed.app/terms",
        "disclosures_url": "https://navyfed.app/disclosures",
        "ada_statement": "Navy Federal Credit Union is committed to ensuring accessibility for all members."
      },
      "support": { "faq_url": "https://navyfed.app/faq", "hours": "24/7" },
      "marketing": { "promo_banner": { "enabled": false, "text": "" } }
    },
    "ucx": {
      "enabled": true,
      "consent_dialog": true,
      "error_threshold": 10,
      "auto_deploy": false,
      "approval_required": true,
      "rollback_threshold": 5,
      "feedback_collection": true,
      "sentiment_analysis": true,
      "github_repo": "cu-app/navyfed-config",
      "github_branch": "main",
      "deploy_hook": "https://api.cu.app/deploy/navyfed"
    },
    "ai": {
      "coach": {
        "enabled": true,
        "name": "Navigator",
        "personality": "supportive",
        "avatar": "cdn.cu.app/navyfed/coach.png",
        "proactive": true,
        "spending_insights": true,
        "budget_enforcement": true,
        "goal_tracking": true,
        "financial_literacy": true,
        "tone": "professional",
        "emoji_use": false
      },
      "support": { "enabled": true, "escalation_threshold": 3, "after_hours": true }
    },
    "deploy": {
      "environment": "production",
      "region": "us-east-1",
      "cdn": "cdn.cu.app",
      "api": "api.cu.app",
      "edge": "edge.cu.app",
      "database": { "host": "db.supabase.co", "pool_size": 20 },
      "cache": { "provider": "redis", "ttl_seconds": 300 },
      "logging": { "level": "info", "retention_days": 30 },
      "monitoring": { "enabled": true, "alerting": true },
      "backup": { "enabled": true, "frequency": "daily", "retention_days": 30 }
    }
  }'::jsonb
);

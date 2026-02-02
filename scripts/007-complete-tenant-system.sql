-- Complete tenant system with chat networks, fraud signals, claim flow, and subscriptions
-- Run this after previous migrations

-- 1. ADMIN USERS TABLE (for kmkusche@gmail.com)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_super_admin BOOLEAN DEFAULT false
);

INSERT INTO public.admin_users (email, is_super_admin) 
VALUES ('kmkusche@gmail.com', true)
ON CONFLICT (email) DO NOTHING;

-- 2. TENANT CLAIMS TABLE (credit union claim flow with email domain validation)
CREATE TABLE IF NOT EXISTS public.tenant_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_union_id TEXT NOT NULL,
  charter_number TEXT NOT NULL,
  claimer_email TEXT NOT NULL,
  claimer_domain TEXT NOT NULL, -- extracted from email after @
  ncua_domain TEXT, -- domain from NCUA data to validate against
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'email_sent', 'verified', 'rejected')),
  verification_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

-- 3. TENANT SUBSCRIPTIONS (one-time $50,000 purchase)
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_union_id TEXT NOT NULL UNIQUE,
  charter_number TEXT NOT NULL,
  stripe_payment_id TEXT,
  amount_cents INTEGER DEFAULT 5000000, -- $50,000
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'refunded')),
  purchased_at TIMESTAMPTZ,
  purchased_by_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TENANT CHAT NETWORKS (each tenant has their own + can opt into nationwide)
CREATE TABLE IF NOT EXISTS public.chat_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_union_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'internal' CHECK (type IN ('internal', 'nationwide')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id UUID REFERENCES public.chat_networks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  sender_id UUID,
  sender_email TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. NATIONWIDE FRAUD SIGNAL NETWORK
CREATE TABLE IF NOT EXISTS public.fraud_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporting_cu_id TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'suspicious_activity', 'identity_theft', 'account_takeover', 
    'check_fraud', 'wire_fraud', 'card_fraud', 'loan_fraud', 'other'
  )),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  indicator_hash TEXT NOT NULL, -- hashed PII for matching without exposing data
  indicator_type TEXT NOT NULL CHECK (indicator_type IN (
    'email_domain', 'phone_prefix', 'ip_range', 'device_fingerprint', 
    'address_pattern', 'ssn_pattern', 'name_pattern'
  )),
  description TEXT,
  is_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days'
);

-- Index for fast fraud lookups
CREATE INDEX IF NOT EXISTS idx_fraud_signals_hash ON public.fraud_signals(indicator_hash);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_type ON public.fraud_signals(signal_type, severity);

-- 6. NATIONWIDE NETWORK OPT-IN
CREATE TABLE IF NOT EXISTS public.nationwide_network_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_union_id TEXT NOT NULL UNIQUE,
  charter_number TEXT NOT NULL,
  opted_in_at TIMESTAMPTZ DEFAULT NOW(),
  share_fraud_signals BOOLEAN DEFAULT true,
  receive_fraud_alerts BOOLEAN DEFAULT true,
  share_product_insights BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PRODUCT SPECS (stubbed for each CU)
CREATE TABLE IF NOT EXISTS public.product_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_union_id TEXT NOT NULL,
  product_type TEXT NOT NULL,
  product_name TEXT NOT NULL,
  spec_data JSONB DEFAULT '{}',
  documentation_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. IVR MEMBER LOOKUP CONFIG
CREATE TABLE IF NOT EXISTS public.ivr_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_union_id TEXT NOT NULL UNIQUE,
  always_on_search BOOLEAN DEFAULT true,
  support_rep_role_id TEXT,
  member_lookup_enabled BOOLEAN DEFAULT true,
  account_lookup_enabled BOOLEAN DEFAULT true,
  transaction_lookup_enabled BOOLEAN DEFAULT true,
  voice_biometrics_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. BACKGROUND TASK AGENTS
CREATE TABLE IF NOT EXISTS public.task_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'logo_fetch', 'ncua_sync', 'fraud_signal_process', 
    'product_discovery', 'website_scan', 'app_store_ratings'
  )),
  status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'completed', 'failed')),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default task agents
INSERT INTO public.task_agents (name, type, next_run_at) VALUES
  ('Logo Seeder', 'logo_fetch', NOW()),
  ('NCUA Data Sync', 'ncua_sync', NOW() + INTERVAL '1 hour'),
  ('Fraud Signal Processor', 'fraud_signal_process', NOW() + INTERVAL '5 minutes'),
  ('Product Discovery Agent', 'product_discovery', NOW() + INTERVAL '2 hours'),
  ('Website Scanner', 'website_scan', NOW() + INTERVAL '6 hours'),
  ('App Store Ratings Sync', 'app_store_ratings', NOW() + INTERVAL '12 hours')
ON CONFLICT DO NOTHING;

-- 10. DEVICE MEMORY AUTH (cheap, fast auth for tenants)
CREATE TABLE IF NOT EXISTS public.device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fingerprint TEXT NOT NULL,
  credit_union_id TEXT,
  user_email TEXT,
  user_role TEXT DEFAULT 'viewer',
  is_claimed BOOLEAN DEFAULT false,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX IF NOT EXISTS idx_device_sessions_fingerprint ON public.device_sessions(device_fingerprint);

-- 11. TENANT LOGO SEEDS (batch process tracking)
CREATE TABLE IF NOT EXISTS public.logo_seed_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL,
  credit_union_id TEXT NOT NULL,
  charter_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  logo_url_found TEXT,
  fallback_used TEXT,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.tenant_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nationwide_network_members ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own tenant data
CREATE POLICY "Users can view their tenant claims" ON public.tenant_claims
  FOR SELECT USING (claimer_email = auth.email());

CREATE POLICY "Users can insert tenant claims" ON public.tenant_claims
  FOR INSERT WITH CHECK (true);

-- Service role can do everything
CREATE POLICY "Service role full access claims" ON public.tenant_claims
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access subscriptions" ON public.tenant_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

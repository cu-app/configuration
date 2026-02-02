-- CU PRODUCTS SCHEMA
-- Based on Suncoast Credit Union JSON pattern
-- Supports full product catalog with rates, marketing copy, and IVR descriptions

-- Product categories table
CREATE TABLE IF NOT EXISTS cu_product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(100) NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, category_name)
);

-- Product types within categories
CREATE TABLE IF NOT EXISTS cu_product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES cu_product_categories(id) ON DELETE CASCADE,
  product_type_name VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual products
CREATE TABLE IF NOT EXISTS cu_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type_id UUID NOT NULL REFERENCES cu_product_types(id) ON DELETE CASCADE,
  tenant_id VARCHAR(100) NOT NULL,
  
  -- Core fields from Suncoast schema
  product_id VARCHAR(50), -- External product ID
  product_name VARCHAR(255) NOT NULL,
  ivr_description TEXT, -- Description for IVR/voice
  marketing_copy TEXT,
  product_notes TEXT,
  
  -- Rate information
  annual_percentage_rate DECIMAL(10,4),
  base_rate DECIMAL(10,4),
  margin DECIMAL(10,4),
  floor_rate DECIMAL(10,4),
  ceiling_rate DECIMAL(10,4),
  rate_type_name VARCHAR(50), -- Fixed, Variable, etc.
  
  -- Terms
  minimum_term_months INTEGER,
  maximum_term_months INTEGER,
  default_term_months INTEGER,
  
  -- Limits
  minimum_amount DECIMAL(15,2),
  maximum_amount DECIMAL(15,2),
  
  -- Loan-specific fields
  ltv_maximum DECIMAL(5,2), -- Loan-to-value max percentage
  credit_type_name VARCHAR(50),
  collateral_type VARCHAR(100),
  
  -- Discounts and features
  auto_pay_applies BOOLEAN DEFAULT FALSE,
  auto_pay_discount DECIMAL(5,4),
  relationship_discount_applies BOOLEAN DEFAULT FALSE,
  relationship_discount DECIMAL(5,4),
  
  -- Deposit-specific fields
  is_share_product BOOLEAN DEFAULT FALSE,
  dividend_rate DECIMAL(10,4),
  apy DECIMAL(10,4),
  compounding_frequency VARCHAR(20), -- Daily, Monthly, Quarterly
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  effective_date DATE,
  expiration_date DATE,
  source_url TEXT, -- URL where product was scraped from
  last_scraped_at TIMESTAMPTZ,
  scrape_confidence DECIMAL(3,2), -- 0-1 confidence score
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product tiers/sub-products (e.g., different CD terms)
CREATE TABLE IF NOT EXISTS cu_product_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES cu_products(id) ON DELETE CASCADE,
  tier_name VARCHAR(100) NOT NULL,
  term_months INTEGER,
  minimum_balance DECIMAL(15,2),
  maximum_balance DECIMAL(15,2),
  apy DECIMAL(10,4),
  dividend_rate DECIMAL(10,4),
  apr DECIMAL(10,4),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product chain of thought logging (for AI scraping transparency)
CREATE TABLE IF NOT EXISTS cu_product_scrape_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES cu_products(id) ON DELETE SET NULL,
  tenant_id VARCHAR(100) NOT NULL,
  source_url TEXT NOT NULL,
  chain_of_thought TEXT, -- AI reasoning for extraction
  raw_html TEXT, -- Original HTML scraped
  extracted_json JSONB, -- Structured extraction
  confidence_scores JSONB, -- Per-field confidence
  model_used VARCHAR(100),
  tokens_used INTEGER,
  status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed, review
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cu_products_tenant ON cu_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cu_products_type ON cu_products(product_type_id);
CREATE INDEX IF NOT EXISTS idx_cu_products_active ON cu_products(tenant_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_cu_product_types_category ON cu_product_types(category_id);
CREATE INDEX IF NOT EXISTS idx_cu_product_tiers_product ON cu_product_tiers(product_id);
CREATE INDEX IF NOT EXISTS idx_cu_scrape_logs_tenant ON cu_product_scrape_logs(tenant_id);

-- RLS policies
ALTER TABLE cu_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cu_product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE cu_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cu_product_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cu_product_scrape_logs ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users to read their tenant's products
CREATE POLICY "Users can read own tenant products"
  ON cu_products FOR SELECT
  TO authenticated
  USING (true); -- Will be refined with tenant context

CREATE POLICY "Public can read active products"
  ON cu_products FOR SELECT
  TO anon
  USING (is_active = true);

-- Service role full access for batch processing
CREATE POLICY "Service role manages products"
  ON cu_products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role manages categories"
  ON cu_product_categories FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role manages types"
  ON cu_product_types FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role manages tiers"
  ON cu_product_tiers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role manages scrape logs"
  ON cu_product_scrape_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

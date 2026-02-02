// UNIFIED CONFIGURATION SCHEMA
// 8 Core Configuration Domains for Vendor-Agnostic Credit Union Platform
// This is the "Configuration as Product" schema that powers Flutter + Next.js

// ============================================
// DOMAIN 1: IDENTITY & BRAND
// ============================================
export interface IdentityConfig {
  legal_name: string
  dba_name: string
  charter_number: string
  routing_number: string
  ncua_id?: string
  tax_id?: string

  brand: {
    logo: {
      primary: string // Main logo URL
      white: string // White/inverted version
      icon: string // Square icon/mark
      favicon: string
    }
    colors: {
      primary: string // Hex or OKLCH
      secondary: string
      accent: string
      background: string
      surface: string
      error: string
      success: string
      warning: string
    }
    typography: {
      headings: string // Font family
      body: string
      monospace: string
    }
    voice: {
      tone: 'professional' | 'friendly' | 'casual' | 'formal'
      personality: string // Description for AI
      formality_level: 1 | 2 | 3 | 4 | 5 // 1=very casual, 5=very formal
    }
  }

  contact: {
    support_phone: string
    support_email: string
    fraud_phone?: string
    hours: {
      weekday: string // e.g., "8:00 AM - 6:00 PM"
      saturday: string | null
      sunday: string | null
    }
    address: {
      street: string
      city: string
      state: string
      zip: string
    }
  }
}

// ============================================
// DOMAIN 2: PRODUCTS & RATES
// ============================================
export interface ProductDefinition {
  id: string
  name: string
  description: string
  type: 'checking' | 'savings' | 'money_market' | 'certificate' | 'ira'
  apy: number
  min_balance: number
  monthly_fee: number
  fee_waiver_conditions?: string
  features: string[]
  eligibility: string[]
  is_active: boolean
}

export interface LoanProductDefinition {
  id: string
  name: string
  description: string
  type: 'auto' | 'mortgage' | 'personal' | 'heloc' | 'student' | 'credit_card'
  apr_range: { min: number; max: number }
  term_months: number[]
  min_amount: number
  max_amount: number
  collateral_required: boolean
  features: string[]
  eligibility: string[]
  is_active: boolean
}

export interface CardProductDefinition {
  id: string
  name: string
  type: 'debit' | 'credit' | 'prepaid'
  network: 'visa' | 'mastercard' | 'amex' | 'discover'
  rewards_program?: {
    type: 'cashback' | 'points' | 'miles'
    rate: number // e.g., 1.5 for 1.5%
  }
  apr?: number
  annual_fee: number
  foreign_transaction_fee: number
  features: string[]
  is_active: boolean
}

export interface ServiceDefinition {
  enabled: boolean
  provider?: string
  features: string[]
  limits?: Record<string, number>
}

export interface ProductsConfig {
  deposits: {
    checking: ProductDefinition[]
    savings: ProductDefinition[]
    money_market: ProductDefinition[]
    certificates: ProductDefinition[]
    ira: ProductDefinition[]
  }

  loans: {
    auto: LoanProductDefinition[]
    mortgage: LoanProductDefinition[]
    personal: LoanProductDefinition[]
    heloc: LoanProductDefinition[]
    student: LoanProductDefinition[]
    credit_cards: CardProductDefinition[]
  }

  services: {
    online_banking: ServiceDefinition
    mobile_banking: ServiceDefinition
    bill_pay: ServiceDefinition
    p2p_transfers: ServiceDefinition
    mobile_deposit: ServiceDefinition
    wire_transfers: ServiceDefinition
    ach_transfers: ServiceDefinition
  }
}

// ============================================
// DOMAIN 3: CHANNELS & TOUCHPOINTS
// ============================================
export interface BranchLocation {
  id: string
  name: string
  type: 'full_service' | 'limited_service' | 'atm_only'
  address: {
    street: string
    city: string
    state: string
    zip: string
    lat?: number
    lng?: number
  }
  phone?: string
  hours: {
    monday: string | null
    tuesday: string | null
    wednesday: string | null
    thursday: string | null
    friday: string | null
    saturday: string | null
    sunday: string | null
  }
  services: string[]
  is_active: boolean
}

export interface ATMConfig {
  network: string[] // e.g., ["CO-OP", "Allpoint"]
  surcharge_free: boolean
  deposit_enabled: boolean
  withdrawal_limit: number
}

export interface IVRMenu {
  key: string // DTMF key
  label: string
  action: 'submenu' | 'transfer' | 'info' | 'callback'
  destination?: string
  children?: IVRMenu[]
}

export interface VoiceConfig {
  provider: 'hume' | 'twilio' | 'genesys' | 'custom'
  voice_name: string
  language: string
  speed: number // 0.5-2.0
}

export interface ChannelsConfig {
  mobile: {
    ios: {
      app_store_id: string
      min_version: string
      features: string[]
    }
    android: {
      play_store_id: string
      min_version: string
      features: string[]
    }
    biometrics: {
      face_id: boolean
      touch_id: boolean
      voice: boolean
    }
  }

  web: {
    domain: string
    subdomains: {
      banking: string // e.g., "online.creditunion.com"
      admin: string
      marketing: string
    }
    features: string[]
  }

  ivr: {
    main_number: string
    menu_structure: IVRMenu[]
    voice_settings: VoiceConfig
    integrations: {
      provider: string
      config: Record<string, unknown>
    }
  }

  branches: {
    locations: BranchLocation[]
    services_offered: string[]
    atm_network: ATMConfig
  }

  sms_banking: {
    enabled: boolean
    short_code?: string
    commands: Array<{ keyword: string; action: string }>
  }

  chatbot: {
    enabled: boolean
    provider?: string
    escalation_path: string
  }
}

// ============================================
// DOMAIN 4: MARKETING & CONTENT
// ============================================
export interface PageDefinition {
  slug: string
  title: string
  meta_description: string
  sections: Array<{
    type: 'hero' | 'features' | 'products' | 'testimonials' | 'cta' | 'contact' | 'faq' | 'custom'
    config: Record<string, unknown>
  }>
  is_published: boolean
}

export interface NavItem {
  label: string
  href: string
  children?: NavItem[]
}

export interface FooterConfig {
  columns: Array<{
    title: string
    links: NavItem[]
  }>
  social: Record<string, string>
  legal_links: NavItem[]
}

export interface SEOConfig {
  default_title_suffix: string
  og_image: string
  twitter_handle?: string
  google_site_verification?: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  from_name: string
  from_email: string
  html_template: string
  text_template: string
  variables: string[]
}

export interface Testimonial {
  id: string
  name: string
  role?: string
  quote: string
  image?: string
  rating?: number
}

export interface FAQ {
  question: string
  answer: string
  category: string
}

export interface MarketingConfig {
  website: {
    pages: PageDefinition[]
    navigation: NavItem[]
    footer: FooterConfig
    seo: SEOConfig
  }

  content: {
    headlines: Record<string, string>
    ctas: Record<string, { text: string; action: string }>
    testimonials: Testimonial[]
    faqs: FAQ[]
  }

  campaigns: {
    email_templates: EmailTemplate[]
    sms_templates: Array<{ id: string; name: string; message: string; variables: string[] }>
    push_templates: Array<{ id: string; name: string; title: string; body: string; action?: string }>
  }

  social: {
    facebook?: string
    twitter?: string
    linkedin?: string
    instagram?: string
    youtube?: string
  }
}

// ============================================
// DOMAIN 5: SECURITY & COMPLIANCE
// ============================================
export interface LockoutConfig {
  max_attempts: number
  lockout_duration_minutes: number
  reset_after_minutes: number
}

export interface VelocityRule {
  type: 'transaction_count' | 'amount' | 'unique_recipients'
  period_hours: number
  threshold: number
  action: 'block' | 'review' | 'step_up'
}

export interface GeoRule {
  type: 'country_block' | 'country_allow' | 'distance_limit'
  countries?: string[] // ISO codes
  max_distance_miles?: number
}

export interface DeviceTrustConfig {
  require_device_registration: boolean
  max_devices: number
  session_binding: boolean
}

export interface SecurityConfig {
  authentication: {
    methods: ('password' | 'biometric' | 'mfa' | 'voice' | 'passkey')[]
    mfa_required_for: string[] // Actions requiring MFA
    session_timeout_minutes: number
    lockout_policy: LockoutConfig
    password_requirements: {
      min_length: number
      require_uppercase: boolean
      require_lowercase: boolean
      require_number: boolean
      require_special: boolean
      max_age_days: number
    }
  }

  fraud: {
    velocity_limits: VelocityRule[]
    geolocation_rules: GeoRule[]
    device_trust: DeviceTrustConfig
    risk_thresholds: {
      block_score: number // 0-100
      review_score: number
      step_up_score: number
    }
  }

  compliance: {
    kyc: {
      required_documents: string[]
      verification_levels: Array<{ level: number; requirements: string[] }>
      provider?: string
    }
    aml: {
      monitoring_rules: string[]
      reporting_thresholds: {
        ctr: number // Currency Transaction Report
        sar: number // Suspicious Activity Report
      }
    }
    privacy: {
      data_retention_days: number
      consent_management: boolean
      gdpr_compliant: boolean
      ccpa_compliant: boolean
    }
  }
}

// ============================================
// DOMAIN 6: INTEGRATIONS (Vendor-Agnostic)
// ============================================
export interface IntegrationSlot {
  enabled: boolean
  provider: string | null // e.g., "alloy", "auth0", "blueshift", "hume"
  config: Record<string, unknown> // Provider-specific config
  fallback?: string | null
}

export interface AccountTypeMapping {
  source_type: string
  target_type: string
  display_name: string
}

export interface IntegrationsConfig {
  core_banking: {
    provider: 'symitar' | 'fiserv' | 'corelation' | 'dna' | 'silverlake' | 'custom'
    connection: {
      endpoint: string
      auth_method: 'api_key' | 'oauth' | 'certificate'
    }
    mappings: AccountTypeMapping[]
  }

  payments: {
    ach: { provider: string; routing: string }
    wire: { provider: string; cutoff_times: string[] }
    rtp: { enabled: boolean; provider?: string }
    fednow: { enabled: boolean; provider?: string }
  }

  cards: {
    debit: { processor: string; network: string }
    credit: { processor: string; network: string }
  }

  // Vendor-agnostic integration slots
  identity_verification: IntegrationSlot
  fraud_detection: IntegrationSlot
  marketing_automation: IntegrationSlot
  voice_platform: IntegrationSlot
  analytics: IntegrationSlot
  document_signing: IntegrationSlot
  notifications: {
    sms: IntegrationSlot
    email: IntegrationSlot
    push: IntegrationSlot
  }
}

// ============================================
// DOMAIN 7: BUSINESS RULES
// ============================================
export interface TransferLimits {
  daily_limit: number
  per_transaction_limit: number
  monthly_limit?: number
}

export interface NotificationTrigger {
  event: string
  channels: ('email' | 'sms' | 'push' | 'in_app')[]
  template_id: string
  conditions?: Record<string, unknown>
}

export interface BusinessRulesConfig {
  transfers: {
    internal: TransferLimits
    external: TransferLimits & {
      hold_period_days: number
      verification_required: boolean
    }
    p2p: TransferLimits & {
      recipient_limits: number // Max recipients per day
    }
    wire: TransferLimits & {
      cutoff_time: string // e.g., "14:00"
    }
  }

  deposits: {
    mobile_check: {
      daily_limit: number
      hold_schedule: Array<{ day: number; available_percent: number }>
      endorsement_required: boolean
    }
    cash: {
      atm_limit: number
      branch_limit: number
    }
  }

  withdrawals: {
    atm_daily_limit: number
    pos_daily_limit: number
  }

  notifications: {
    triggers: NotificationTrigger[]
    default_channels: ('email' | 'sms' | 'push' | 'in_app')[]
    quiet_hours?: { start: string; end: string }
  }

  account_rules: {
    minimum_balance_alerts: boolean
    overdraft_protection: {
      enabled: boolean
      source_priority: string[] // Account types in priority order
      fee: number
    }
    dormant_account_days: number
  }
}

// ============================================
// DOMAIN 8: AI & PERSONALIZATION
// ============================================
export interface EscalationRule {
  trigger: string
  condition?: Record<string, unknown>
  action: 'transfer_human' | 'callback' | 'ticket'
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export interface AIConfig {
  voice_assistant: {
    enabled: boolean
    personality: {
      name: string
      tone: 'professional' | 'friendly' | 'casual'
      language: string
    }
    capabilities: string[]
    escalation_rules: EscalationRule[]
    provider: 'hume' | 'openai' | 'anthropic' | 'google' | 'custom'
  }

  insights: {
    spending_analysis: boolean
    savings_recommendations: boolean
    budget_coaching: boolean
    anomaly_detection: boolean
  }

  personalization: {
    product_recommendations: boolean
    content_targeting: boolean
    communication_preferences: boolean
    learning_mode: 'aggressive' | 'moderate' | 'conservative'
  }

  coaching: {
    enabled: boolean
    personality: 'supportive' | 'direct' | 'educational' | 'motivational'
    features: {
      spending_insights: boolean
      budget_enforcement: boolean
      goal_tracking: boolean
      bill_reminders: boolean
    }
    after_hours_support: boolean
  }
}

// ============================================
// UNIFIED CONFIGURATION (All Domains)
// ============================================
export interface UnifiedConfig {
  // Metadata
  version: string
  tenant_id: string
  environment: 'development' | 'staging' | 'production'
  last_updated: string
  updated_by?: string

  // 8 Core Domains
  identity: IdentityConfig
  products: ProductsConfig
  channels: ChannelsConfig
  marketing: MarketingConfig
  security: SecurityConfig
  integrations: IntegrationsConfig
  rules: BusinessRulesConfig
  ai: AIConfig
}

// ============================================
// DISTRIBUTION METADATA
// ============================================
export interface ConfigDistribution {
  tenant_id: string
  version: string
  distributed_at: string
  targets: {
    supabase: { success: boolean; timestamp: string }
    github?: { success: boolean; repo: string; commit: string; timestamp: string }
    cdn?: { success: boolean; url: string; timestamp: string }
    webhooks?: Array<{ url: string; success: boolean; status_code: number; timestamp: string }>
  }
}

export interface WebhookRegistration {
  id: string
  tenant_id: string
  url: string
  secret?: string
  events: string[] // e.g., ["config.updated", "config.published"]
  is_active: boolean
  created_at: string
}

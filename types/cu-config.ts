// CU.APP: ULTIMATE CONFIGURATION MATRIX
// 380+ config keys across 15 tiers + PowerOn specs - Config Over Code

import type { PowerOnConfig } from "./poweron-specs"

// ============================================
// TIER 1: IDENTITY & BRAND
// ============================================
export interface TenantConfig {
  id: string
  name: string
  charter_number: string
  domain: string
  domains: {
    aliases: string[]
  }
  timezone: string
  locale: string
  support: {
    phone: string
    email: string
  }
  legal: {
    name: string
    routing: string
  }
}

// ============================================
// TIER 2: DESIGN TOKENS
// ============================================
export interface DesignTokensConfig {
  color: {
    primary: string // OKLCH format
    secondary: string
    accent: string
    success: string
    warning: string
    error: string
    surface: string
    "on-surface": string
  }
  typography: {
    family: {
      heading: string
      body: string
      mono: string
    }
    scale: number // Type scale ratio
  }
  spacing: {
    unit: number // Base spacing in px
  }
  radius: {
    sm: number
    md: number
    lg: number
    full: number
  }
  shadow: {
    elevation: {
      1: string
      2: string
      3: string
    }
  }
  logo: {
    primary: string // URL
    mark: string
    wordmark: string
  }
  favicon: string
}

// ============================================
// TIER 3: FEATURE FLAGS
// ============================================
export interface FeaturesConfig {
  // Core Features
  mobile_deposit: boolean
  bill_pay: boolean
  p2p: boolean
  wire_transfer: boolean
  ach_origination: boolean
  card_controls: boolean
  travel_notifications: boolean
  budgeting: boolean
  goals: boolean
  statements: boolean
  alerts: boolean
  secure_messaging: boolean
  co_browse: boolean
  video_banking: boolean
  voice_biometrics: boolean
  face_id: boolean
  fingerprint: boolean
  external_transfers: boolean
  loan_applications: boolean
  account_opening: boolean
  joint_access: boolean
  beneficiaries: boolean
  overdraft_protection: boolean
  skip_a_pay: boolean
  ai_coach: boolean
  ai_coach_personality: "supportive" | "direct" | "educational" | "motivational"
  dark_mode: boolean
  accessibility: {
    high_contrast: boolean
    screen_reader: boolean
    reduced_motion: boolean
  }
  
  // Scope document / purchasable features
  business_memberships: boolean
  credit_debit_card_lock: boolean
  dispute_feature: boolean
  data_reporting_dashboards: boolean
  fiduciary_membership: boolean
  paymentus_conversion: boolean
  joint_owner_only: boolean
  memo_post_mode: boolean
  mortgages: boolean
  open_and_apply: boolean
  password_reset_front_office: boolean
  realtime_card_alerts: boolean
  realtime_interdiction: boolean
  running_balance: boolean
  statements_display: boolean
  transfer_favorites: boolean
  base_credit_card_integration: boolean
  
  // Microservice / integration features
  genesys_ivr: boolean
  alloy_gateway: boolean
  device_intelligence: boolean
  pindrop_voice: boolean
  prizeout_rewards: boolean
  mdx_integration: boolean
  fis_realtime_payments: boolean
  clutch_integration: boolean
  
  // Bulk Operations (Business Memberships)
  bulk_operations: boolean
  bulk_card_orders: boolean
  bulk_payments: boolean
  
  // Enhanced Features
  dispute_tracking: boolean
  statement_opt_in: boolean
  realtime_balance: boolean
  loan_origination: boolean
  e_signatures: boolean
  rewards: boolean
}

// ============================================
// TIER 4: IVR & VOICE
// ============================================
export type EVIVersion = "3" | "4-mini"
export type EVIVoiceProvider = "HUME_AI" | "CUSTOM"
export type EVIModelProvider = "HUME_AI" | "ANTHROPIC" | "OPENAI" | "GOOGLE"
export type IVRToolType = "builtin" | "custom"
export type IVRBuiltinTool = "web_search" | "hang_up" | "transfer_call" | "send_sms"

export interface EVIVoice {
  provider: EVIVoiceProvider
  name: string // e.g., "Serene Assistant", "Spanish Instructor", "Fastidious Robo-Butler"
  custom_voice_id?: string // For custom cloned voices
}

export interface EVILanguageModel {
  model_provider: EVIModelProvider
  model_resource: string // e.g., "claude-sonnet-4-20250514", "hume-evi-3", "gpt-4o"
}

export interface IVRTool {
  type: IVRToolType
  name: string
  description?: string
  // For custom tools
  parameters?: Record<
    string,
    {
      type: string
      description: string
      required?: boolean
    }
  >
  // Webhook URL for custom tool execution
  webhook_url?: string
}

export interface IVREventMessage {
  enabled: boolean
  message?: string
}

export interface IVRVoiceConfig {
  enabled: boolean
  evi_version: EVIVersion
  voice: EVIVoice
  language_model: EVILanguageModel
  // Quick responses from Hume's speech language model before supplemental LLM
  ellm_model: {
    allow_short_responses: boolean
  }
  // Nudges - prompts when caller is silent
  nudges: {
    enabled: boolean
    interval_secs: number // Default 6
  }
  // Timeouts
  timeouts: {
    inactivity: {
      enabled: boolean
      duration_secs: number // Default 120
    }
    max_duration: {
      enabled: boolean
      duration_secs: number // Max call duration
    }
  }
  // Voice biometrics for authentication
  voice_biometrics: {
    enabled: boolean
    enrollment_required: boolean
    confidence_threshold: number // 0-100
  }
  // Twilio integration for phone connectivity
  twilio: {
    enabled: boolean
    phone_number: string
    fallback_number: string
  }
}

export interface IVRPromptsConfig {
  // System prompt - defines personality and behavior
  system_prompt: {
    text: string
    version: number
  }
  // Event messages
  event_messages: {
    on_new_chat: IVREventMessage
    on_disconnect: IVREventMessage
    on_transfer: IVREventMessage
    on_error: IVREventMessage
  }
  // IVR Menu structure (traditional DTMF fallback)
  menu: {
    greeting: string
    main_menu: {
      option_1: { label: string; action: string }
      option_2: { label: string; action: string }
      option_3: { label: string; action: string }
      option_4: { label: string; action: string }
      option_0: { label: string; action: string } // Always "speak to representative"
    }
    after_hours_message: string
    hold_music_url: string
  }
  // Tools available to the voice agent
  builtin_tools: IVRBuiltinTool[]
  custom_tools: IVRTool[]
  // Escalation settings
  escalation: {
    enabled: boolean
    keywords: string[] // e.g., ["agent", "representative", "human", "help"]
    max_attempts: number // Escalate after N failed attempts
    transfer_number: string
  }
  // Banking-specific intents
  banking_intents: {
    balance_inquiry: boolean
    transaction_history: boolean
    transfer_funds: boolean
    bill_pay: boolean
    card_services: boolean
    loan_inquiry: boolean
    branch_hours: boolean
    atm_locator: boolean
  }
  // Compliance
  call_recording: {
    enabled: boolean
    disclosure_message: string
  }
}

export interface IVRConfig {
  voice: IVRVoiceConfig
  prompts: IVRPromptsConfig
}

// ============================================
// TIER 5: PRODUCT CONFIGURATION (was TIER 4)
// ============================================
export type AccountType = "CHECKING" | "SAVINGS" | "MONEY_MARKET" | "CD" | "IRA"
export type LoanType = "AUTO" | "MORTGAGE" | "PERSONAL" | "HELOC" | "STUDENT" | "CREDIT_CARD"
export type CardNetwork = "VISA" | "MASTERCARD" | "AMEX" | "DISCOVER"
export type CardType = "CREDIT" | "DEBIT"

export interface ProductRate {
  rate_id: number
  rate_type: "Fixed" | "Variable"
  annual_percentage_rate: number
  base_rate: number
  credit_type_id: number
  credit_type_name: string // "Preferred Plus", "Preferred", "Credit Plus", "Credit Builder", "Below Credit Builder"
  is_credit_dependent: boolean
  maximum_term_months: number
  periodic_rate: number
  auto_pay_applies: boolean
  effective_date: string
}

export interface ProductCatalogItem {
  product_id: number
  product_name: string
  product_type_name: string // "Consumer Loan Rates", etc.
  product_sub_type_id: number
  product_sub_type_name: string // "New/Used Vehicles", "Mortgage Related Products"
  product_description: string
  product_notes: string // HTML content with terms
  marketing_copy: string // HTML marketing content
  ivr_description: string // Short description for IVR/voice
  is_open_end_loan: boolean
  rates: ProductRate[]
}

export interface ProductCategory {
  category_name: string // "Consumer Loans", "New/Used Vehicles", "Share Products"
  products: ProductCatalogItem[]
}

export interface ShareProduct {
  id: string
  name: string
  type: AccountType
  apy: number
  min_balance: number
  monthly_fee: number
  fee_waiver_balance: number | null
  atm_fee_refund: boolean
  atm_fee_refund_limit: number
  overdraft_limit: number
  overdraft_fee: number
  transfer_limit: number | null // Reg D limit for savings
  icon: string
  color: string
  eligibility: {
    min_age?: number
    membership_type?: string[]
    min_deposit?: number
  }
}

export interface LoanProduct {
  id: string
  name: string
  type: LoanType
  rate_min: number
  rate_max: number
  term_min: number // months
  term_max: number
  amount_min: number
  amount_max: number
  ltv_max: number // percentage
}

export interface CardProduct {
  id: string
  name: string
  network: CardNetwork
  type: CardType
  rewards_rate: number
  annual_fee: number
  foreign_tx_fee: number
  apr_purchase: number
  apr_cash: number
}

export interface ProductsConfig {
  shares: ShareProduct[]
  loans: LoanProduct[]
  cards: CardProduct[]
  catalog: ProductCategory[]
}

// ============================================
// TIER 6: BUSINESS RULES (was TIER 5)
// ============================================
export interface RulesConfig {
  transfer: {
    internal: {
      daily_limit: number
      per_tx_limit: number
    }
    external: {
      daily_limit: number
      per_tx_limit: number
      hold_days: number
    }
    p2p: {
      daily_limit: number
      per_tx_limit: number
      monthly_limit: number
    }
    wire: {
      domestic_fee: number
      international_fee: number
    }
  }
  bill_pay: {
    daily_limit: number
    per_tx_limit: number
  }
  mobile_deposit: {
    daily_limit: number
    monthly_limit: number
    per_check_limit: number
    hold_days: {
      default: number
      new_member: number
      large_check: number
    }
    large_check_threshold: number
  }
  atm: {
    daily_withdrawal: number
    per_tx_withdrawal: number
  }
  pos: {
    daily_limit: number
    per_tx_limit: number
  }
  session: {
    timeout_minutes: number
    remember_device_days: number
  }
  password: {
    min_length: number
    require_special: boolean
    require_number: boolean
    require_uppercase: boolean
    expiry_days: number // 0 = never expires
  }
  mfa: {
    required: boolean
    methods: ("sms" | "email" | "totp" | "push")[]
  }
  lockout: {
    attempts: number
    duration_minutes: number
  }
  /** Loan extension auto-approval rules (M3/Episys parity – LOAN_EXTENSION_ACCEPTANCE_CRITERIA) */
  loan_extension: {
    /** Max extension days for auto-approve (e.g. 30) – Rule A1 */
    auto_approve_max_days: number
    /** Eligible loan type codes (comma-separated or array) – Rule A2 */
    auto_approve_loan_types: string[]
    /** Due date eligibility window in days (e.g. 30) – Rule A6 */
    eligibility_window_days: number
    /** Min payments made for auto-approve (e.g. 3) – Rule A5 */
    min_payments_made: number
    /** Max prior extensions (e.g. 3) – Rule A10 */
    max_extension_count: number
    /** Cooldown days since last extension (e.g. 365) – Rule A11 */
    last_extension_cooldown_days: number
    /** Purpose codes that disqualify (59, 84, 85) – Rule A9 */
    excluded_purpose_codes: number[]
  }
}

// ============================================
// TIER 7: FRAUD & RISK (was TIER 6)
// ============================================
export interface FraudConfig {
  risk_threshold: {
    block: number // 0-100
    review: number
    step_up: number
  }
  velocity: {
    tx_per_hour: number
    tx_per_day: number
    amount_per_hour: number
    amount_per_day: number
    new_payee_per_day: number
  }
  device: {
    require_trusted: boolean
    max_devices: number
  }
  geo: {
    allowed_countries: string[]
    blocked_countries: string[]
    domestic_only: boolean
  }
  network: {
    share_signals: boolean
    consume_signals: boolean
  }
  alerts: {
    email: boolean
    sms: boolean
    push: boolean
  }
  realtime: {
    enabled: boolean
  }
}

// ============================================
// TIER 8: COMPLIANCE (was TIER 7)
// ============================================
export type KYCProvider = "internal" | "jumio" | "onfido" | "persona"
export type KYCLevel = "basic" | "cip" | "enhanced"
export type WCAGLevel = "A" | "AA" | "AAA"

export interface ComplianceConfig {
  kyc: {
    provider: KYCProvider
    level: KYCLevel
    document_required: boolean
    selfie_required: boolean
  }
  ctr: {
    threshold: number // CTR reporting threshold
  }
  sar: {
    auto_file: boolean
  }
  ofac: {
    enabled: boolean
    on_onboard: boolean
    on_transfer: boolean
  }
  pep: {
    enabled: boolean
  }
  adverse_media: {
    enabled: boolean
  }
  fdx: {
    version: string
    consent_duration_days: number
    data_clusters: string[]
    api_url?: string
    enabled: boolean
  }
  section_1033: {
    enabled: boolean
    developer_portal: boolean
  }
  audit: {
    retention_years: number
    immutable: boolean
    rekor_enabled: boolean
  }
  regulation_e: {
    enabled: boolean
    provisional_credit_days: number
  }
  wcag: {
    level: WCAGLevel
  }
  state: string
  state_licenses: string[]
}

// ============================================
// TIER 9: INTEGRATIONS (was TIER 8)
// ============================================
export type CoreProvider = "symitar" | "corelation" | "dna" | "silverlake" | "xp2"
export type CardProcessor = "fiserv" | "fis" | "pscu" | "co-op"
export type ACHProvider = "federal_reserve" | "ach_direct" | "dwolla"
export type ATMNetwork = "co-op" | "allpoint" | "moneypass" | "culiance"
export type SMSProvider = "twilio" | "vonage" | "bandwidth"
export type EmailProvider = "sendgrid" | "ses" | "postmark"
export type PushProvider = "firebase" | "onesignal" | "apns"

export interface IntegrationsConfig {
  // ============================================
  // CORE BANKING - ALL CREDENTIALS HERE
  // ============================================
  core: {
    provider: CoreProvider
    host: string
    environment: "development" | "staging" | "production"
    timeout_ms: number
    retry_attempts: number
    // PowerOn / Symitar Credentials
    poweron: {
      mode: "mock" | "symxchange" | "direct"
      // SymXchange API (Jack Henry)
      symxchange_url?: string
      symxchange_api_key?: string
      // Direct PowerOn Connection
      poweron_host?: string
      poweron_port?: number
      institution_id?: string
      device_number?: number
      device_type?: string
      processor_user?: string
      // X509 Certificate (stored securely, reference only)
      certificate_thumbprint?: string
    }
  }
  card_processor: {
    provider: CardProcessor
    bin: string
    endpoint: string
    api_key?: string
    merchant_id?: string
  }
  ach: {
    provider: ACHProvider
    routing: string
    odfi_id: string
    api_key?: string
  }
  rtp: {
    enabled: boolean
    participant_id: string
    api_key?: string
  }
  fednow: {
    enabled: boolean
    participant_id: string
    api_key?: string
  }
  shared_branching: {
    enabled: boolean
    cu_number: string
  }
  atm_network: {
    provider: ATMNetwork
  }
  bill_pay: {
    provider: "internal" | "q2" | "fiserv"
    api_key?: string
    merchant_id?: string
  }
  credit_bureau: {
    provider: "equifax" | "experian" | "transunion"
    api_key?: string
  }
  insurance: {
    provider: string
    api_key?: string
  }
  statement: {
    provider: "internal" | "infuzion" | "doxim"
    api_key?: string
  }
  sms: {
    provider: SMSProvider
    from_number: string
    api_key?: string
    api_secret?: string
  }
  email: {
    provider: EmailProvider
    from_address: string
    api_key?: string
  }
  push: {
    provider: PushProvider
    fcm_key?: string
    apns_key?: string
    onesignal_app_id?: string
  }
  analytics: {
    provider: "internal" | "mixpanel" | "amplitude"
    mixpanel_token?: string
    amplitude_api_key?: string
  }
  transaction_enrichment: {
    enabled: boolean
    provider: "internal" | "mx" | "plaid" | "disabled"
    worker_url?: string
    api_key?: string
    mx_api_key?: string
    plaid_client_id?: string
  }
  hume: {
    enabled: boolean
    api_key?: string // Stored in config, not env var
    project_id: string
  }
  // OAuth / Identity Provider
  auth: {
    provider: "internal" | "auth0" | "okta" | "azure_ad"
    base_url?: string
    client_id?: string
    client_secret?: string
    redirect_uri?: string
  }
}

// ============================================
// TIER 10: CHANNELS (was TIER 9)
// ============================================
export interface ChannelsConfig {
  mobile: {
    ios: {
      enabled: boolean
      app_store_id: string
      min_version: string
    }
    android: {
      enabled: boolean
      play_store_id: string
      min_version: string
    }
  }
  web: {
    enabled: boolean
    url: string
    subdomain: string | null
  }
  branch: {
    enabled: boolean
    teller_app: boolean
    hardware: {
      signature_pad: "topaz" | "wacom" | "scriptel"
      scanner: "canon" | "epson" | "panini"
      cash_drawer: "apg" | "mmf"
      receipt_printer: "epson" | "star"
    }
  }
  ivr: {
    enabled: boolean
    phone_number: string // e.g., "+1813XXXXXXX" for 813 area code
    voice_biometrics: boolean
    callback: boolean
    // IVR PowerOn Specs Configuration
    poweron_specs: {
      enabled: boolean
      // All 36 IVR PowerOn specs are automatically available when enabled
      // Specs: SCU.IVR.BYID.PRO, SCU.IVR.LOOKUP.SUB, SCU.IVR.ACCOUNT.SUB, etc.
      use_all_specs: boolean // Use all 36 IVR specs from PowerOn registry
    }
    // Hume AI Voice IVR
    hume: {
      enabled: boolean
      evi_version: "3" | "4-mini"
      config_id?: string
      webhook_url?: string
    }
    // Twilio Configuration
    twilio: {
      account_sid?: string // From integrations.sms
      auth_token?: string // From integrations.sms
      phone_number?: string // Twilio phone number (813 area code)
    }
  }
  sms_banking: {
    enabled: boolean
  }
  chatbot: {
    enabled: boolean
    escalation: boolean
  }
  video: {
    enabled: boolean
  }
}

// ============================================
// TIER 11: NOTIFICATIONS (was TIER 10)
// ============================================
export type NotificationChannel = "push" | "sms" | "email"

export interface NotificationsConfig {
  login: {
    new_device: NotificationChannel[]
    failed: NotificationChannel[]
  }
  transaction: {
    large: NotificationChannel[]
    large_threshold: number
    international: NotificationChannel[]
    declined: NotificationChannel[]
  }
  balance: {
    low: NotificationChannel[]
    low_threshold: number
    negative: NotificationChannel[]
  }
  deposit: {
    received: NotificationChannel[]
    direct_deposit: NotificationChannel[]
  }
  payment: {
    due: NotificationChannel[]
    due_days_before: number
    posted: NotificationChannel[]
  }
  statement: {
    ready: NotificationChannel[]
  }
  fraud: {
    alert: NotificationChannel[]
  }
  card: {
    frozen: NotificationChannel[]
    unfrozen: NotificationChannel[]
  }
  message: {
    new: NotificationChannel[]
  }
}

// ============================================
// TIER 12: CONTENT & COPY (was TIER 11)
// ============================================

/** Per-screen overrides for MX app (titles, copy, visibility). */
export interface MxScreenContent {
  title?: string
  subtitle?: string
  enabled?: boolean
  copy?: Record<string, string>
}

export interface ContentConfig {
  app_name: string
  tagline: string
  member_term: "member" | "customer"
  share_term: "account" | "share"
  welcome_message: string // Supports {first_name} template
  onboarding: {
    headline: string
    steps: ("identity" | "funding" | "products" | "verification" | "preferences")[]
  }
  error: {
    generic: string
    network: string
    session: string
  }
  legal: {
    privacy_url: string
    terms_url: string
    disclosures_url: string
    ada_statement: string
  }
  support: {
    faq_url: string
    hours: string
  }
  marketing: {
    promo_banner: {
      enabled: boolean
      text: string
      link?: string
    }
  }
  /** MX app screen-level overrides (dashboard, accounts, transfers, etc.). */
  screens?: Record<string, MxScreenContent>
}

// ============================================
// TIER 13: UCX (USER CONTROLLED EXPERIENCE) (was TIER 12)
// ============================================
export interface UCXConfig {
  enabled: boolean
  consent_dialog: boolean
  error_threshold: number
  auto_deploy: boolean
  approval_required: boolean
  rollback_threshold: number
  feedback_collection: boolean
  sentiment_analysis: boolean
  github_repo: string
  github_branch: string
  deploy_hook: string
}

// ============================================
// TIER 14: AI COACHING (was TIER 13)
// ============================================
export type AIPersonality = "supportive" | "direct" | "educational" | "motivational"
export type AITone = "professional" | "casual" | "friendly"

export interface AIConfig {
  coach: {
    enabled: boolean
    name: string
    personality: AIPersonality
    avatar: string
    proactive: boolean
    spending_insights: boolean
    budget_enforcement: boolean
    goal_tracking: boolean
    financial_literacy: boolean
    tone: AITone
    emoji_use: boolean
  }
  support: {
    enabled: boolean
    escalation_threshold: number
    after_hours: boolean
  }
}

// ============================================
// TIER 15: DEPLOYMENT & ENVIRONMENT (was TIER 14)
// ============================================
export type LogLevel = "debug" | "info" | "warn" | "error"
export type CacheProvider = "redis" | "memcached" | "cloudflare"

export interface DeployConfig {
  environment: "development" | "staging" | "production"
  region: string
  cdn: string
  api: string
  edge: string
  database: {
    host: string
    pool_size: number
  }
  cache: {
    provider: CacheProvider
    ttl_seconds: number
  }
  logging: {
    level: LogLevel
    retention_days: number
  }
  monitoring: {
    enabled: boolean
    alerting: boolean
    pagerduty_key?: string
  }
  backup: {
    enabled: boolean
    frequency: "hourly" | "daily" | "weekly"
    retention_days: number
  }
}

// ============================================
// TIER 16: POWERON SPECS (was TIER 15)
// ============================================

// ============================================
// MASTER CONFIG TYPE
// ============================================
export interface CreditUnionConfig {
  tenant: TenantConfig
  tokens: DesignTokensConfig
  features: FeaturesConfig
  ivr_voice: IVRVoiceConfig
  ivr_prompts: IVRPromptsConfig
  products: ProductsConfig
  rules: RulesConfig
  fraud: FraudConfig
  compliance: ComplianceConfig
  integrations: IntegrationsConfig
  channels: ChannelsConfig
  notifications: NotificationsConfig
  content: ContentConfig
  // ============================================
  // TIER 17: MARKETING CMS (NEW)
  // ============================================
  marketing: {
    enabled: boolean
    site_url?: string // Auto-generated subdomain or custom domain
    homepage: {
      hero: {
        title: string
        subtitle: string
        ctaText: string
        ctaLink: string
        backgroundImage?: string
      }
      ogImage?: string
      pageTitle: string
      pageDescription: string
    }
    pages: Array<{
      id: string
      slug: string
      title: string
      meta_description?: string
      content: Record<string, unknown>
      is_published: boolean
      published_at?: string
      updated_at?: string
    }>
    media_library: Array<{
      id: string
      url: string
      filename: string
      mime_type: string
      size_bytes: number
      uploaded_at: string
    }>
  }
  ucx: UCXConfig
  ai: AIConfig
  deploy: DeployConfig
  poweron: PowerOnConfig
}

// ============================================
// CONFIG TIER METADATA
// ============================================
export const CONFIG_TIERS = [
  { id: "tenant", name: "Identity & Brand", description: "Who is this credit union?", icon: "building", keyCount: 12 },
  { id: "tokens", name: "Design Tokens", description: "How does it look?", icon: "palette", keyCount: 25 },
  { id: "features", name: "Feature Flags", description: "What's turned on?", icon: "toggle-left", keyCount: 35 },
  { id: "ivr", name: "IVR & Voice", description: "Phone banking & Hume EVI", icon: "phone", keyCount: 45 },
  { id: "products", name: "Product Configuration", description: "What products exist?", icon: "package", keyCount: 30 },
  { id: "rules", name: "Business Rules", description: "Limits and constraints", icon: "scale", keyCount: 40 },
  { id: "fraud", name: "Fraud & Risk", description: "Risk management settings", icon: "shield-alert", keyCount: 25 },
  { id: "compliance", name: "Compliance", description: "Regulatory requirements", icon: "file-check", keyCount: 30 },
  { id: "integrations", name: "Integrations", description: "Connected systems", icon: "plug", keyCount: 35 },
  { id: "channels", name: "Channels", description: "Distribution channels", icon: "smartphone", keyCount: 20 },
  { id: "notifications", name: "Notifications", description: "Alert settings", icon: "bell", keyCount: 25 },
  { id: "content", name: "Content & Copy", description: "UI text and messaging", icon: "file-text", keyCount: 20 },
  { id: "ucx", name: "UCX", description: "User-controlled experience", icon: "wand", keyCount: 12 },
  { id: "ai", name: "AI Coaching", description: "AI assistant settings", icon: "bot", keyCount: 15 },
  { id: "deploy", name: "Deployment", description: "Environment config", icon: "rocket", keyCount: 18 },
  { id: "poweron", name: "PowerOn Specs", description: "Symitar PowerOn mapping", icon: "database", keyCount: 50 },
] as const

export type ConfigTierId = (typeof CONFIG_TIERS)[number]["id"]

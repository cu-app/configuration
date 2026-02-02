import type { CreditUnionConfig } from "@/types/cu-config"
import { generatePowerOnSpecs } from "@/types/poweron-specs"

// Default configuration for a new credit union
export const DEFAULT_CU_CONFIG: CreditUnionConfig = {
  // TIER 1: Identity & Brand
  tenant: {
    id: "cu_default_001",
    name: "Community Credit Union",
    charter_number: "00000",
    domain: "community.app",
    domains: {
      aliases: [],
    },
    timezone: "America/New_York",
    locale: "en-US",
    support: {
      phone: "1-800-555-0100",
      email: "support@community.app",
    },
    legal: {
      name: "Community Credit Union",
      routing: "000000000",
    },
  },

  // TIER 2: Design Tokens
  tokens: {
    color: {
      primary: "oklch(45% 0.2 250)",
      secondary: "oklch(55% 0.15 250)",
      accent: "oklch(65% 0.25 45)",
      success: "oklch(70% 0.2 145)",
      warning: "oklch(75% 0.2 85)",
      error: "oklch(55% 0.25 25)",
      surface: "oklch(98% 0.01 250)",
      "on-surface": "oklch(15% 0.02 250)",
    },
    typography: {
      family: {
        heading: "Inter",
        body: "Inter",
        mono: "JetBrains Mono",
      },
      scale: 1.25,
    },
    spacing: {
      unit: 4,
    },
    radius: {
      sm: 4,
      md: 8,
      lg: 16,
      full: 9999,
    },
    shadow: {
      elevation: {
        1: "0 1px 2px rgba(0,0,0,0.05)",
        2: "0 4px 6px rgba(0,0,0,0.1)",
        3: "0 10px 15px rgba(0,0,0,0.15)",
      },
    },
    logo: {
      primary: "",
      mark: "",
      wordmark: "",
    },
    favicon: "",
  },

  // TIER 3: Feature Flags
  features: {
    mobile_deposit: true,
    bill_pay: true,
    p2p: true,
    wire_transfer: false,
    ach_origination: true,
    card_controls: true,
    travel_notifications: true,
    budgeting: true,
    goals: true,
    statements: true,
    alerts: true,
    secure_messaging: true,
    co_browse: false,
    video_banking: false,
    voice_biometrics: false,
    face_id: true,
    fingerprint: true,
    external_transfers: true,
    loan_applications: true,
    account_opening: true,
    joint_access: true,
    beneficiaries: true,
    overdraft_protection: true,
    skip_a_pay: false,
    ai_coach: true,
    ai_coach_personality: "supportive",
    dark_mode: true,
    accessibility: {
      high_contrast: true,
      screen_reader: true,
      reduced_motion: true,
    },
  },

  ivr_voice: {
    enabled: true,
    evi_version: "3",
    voice: {
      provider: "HUME_AI",
      name: "Serene Assistant",
    },
    language_model: {
      model_provider: "ANTHROPIC",
      model_resource: "claude-sonnet-4-20250514",
    },
    ellm_model: {
      allow_short_responses: true,
    },
    nudges: {
      enabled: true,
      interval_secs: 6,
    },
    timeouts: {
      inactivity: {
        enabled: true,
        duration_secs: 120,
      },
      max_duration: {
        enabled: true,
        duration_secs: 1800, // 30 minutes max call
      },
    },
    voice_biometrics: {
      enabled: false,
      enrollment_required: false,
      confidence_threshold: 85,
    },
    twilio: {
      enabled: true,
      phone_number: "",
      fallback_number: "",
    },
  },

  ivr_prompts: {
    system_prompt: {
      text: `You are a helpful voice assistant for {{CU_NAME}}, a member-owned credit union. Your role is to assist members with their banking needs in a friendly, professional manner.

Follow these guidelines:
- Greet members warmly: "Thank you for calling {{CU_NAME}}. How may I help you today?"
- Verify member identity before discussing account details
- Speak clearly and at a moderate pace
- Offer to transfer to a human representative if the member asks
- Never reveal account numbers or sensitive information unless the member is verified
- Be empathetic and patient with all callers

Available services:
- Account balance inquiries
- Recent transaction history
- Transfer funds between accounts
- Bill payment status
- Card services (report lost/stolen, freeze/unfreeze)
- Branch hours and locations
- Loan payment information`,
      version: 1,
    },
    event_messages: {
      on_new_chat: {
        enabled: true,
        message: "Thank you for calling. How may I assist you today?",
      },
      on_disconnect: {
        enabled: true,
        message: "Thank you for calling. Have a great day!",
      },
      on_transfer: {
        enabled: true,
        message: "I'm transferring you to a representative. Please hold.",
      },
      on_error: {
        enabled: true,
        message: "I apologize, I'm having trouble understanding. Let me transfer you to a representative.",
      },
    },
    menu: {
      greeting: "Thank you for calling {{CU_NAME}}. For quality assurance, this call may be recorded.",
      main_menu: {
        option_1: { label: "Account balances and transactions", action: "balance_inquiry" },
        option_2: { label: "Transfer funds", action: "transfer_funds" },
        option_3: { label: "Card services", action: "card_services" },
        option_4: { label: "Loan information", action: "loan_inquiry" },
        option_0: { label: "Speak with a representative", action: "transfer_agent" },
      },
      after_hours_message:
        "Our call center is currently closed. Normal business hours are Monday through Friday, 8 AM to 6 PM. Please visit our website or mobile app for 24/7 account access.",
      hold_music_url: "",
    },
    builtin_tools: ["web_search", "hang_up"],
    custom_tools: [],
    escalation: {
      enabled: true,
      keywords: ["agent", "representative", "human", "help", "transfer", "person", "operator"],
      max_attempts: 3,
      transfer_number: "",
    },
    banking_intents: {
      balance_inquiry: true,
      transaction_history: true,
      transfer_funds: true,
      bill_pay: true,
      card_services: true,
      loan_inquiry: true,
      branch_hours: true,
      atm_locator: true,
    },
    call_recording: {
      enabled: true,
      disclosure_message: "This call may be recorded for quality assurance and training purposes.",
    },
  },

  // TIER 6: Product Configuration (was TIER 4)
  products: {
    shares: [
      {
        id: "share_checking_001",
        name: "Free Checking",
        type: "CHECKING",
        apy: 0.01,
        min_balance: 0,
        monthly_fee: 0,
        fee_waiver_balance: null,
        atm_fee_refund: true,
        atm_fee_refund_limit: 20,
        overdraft_limit: 500,
        overdraft_fee: 0,
        transfer_limit: null,
        icon: "wallet",
        color: "primary",
        eligibility: { min_age: 18 },
      },
      {
        id: "share_savings_001",
        name: "Primary Savings",
        type: "SAVINGS",
        apy: 0.5,
        min_balance: 5,
        monthly_fee: 0,
        fee_waiver_balance: null,
        atm_fee_refund: false,
        atm_fee_refund_limit: 0,
        overdraft_limit: 0,
        overdraft_fee: 0,
        transfer_limit: 6,
        icon: "piggy-bank",
        color: "success",
        eligibility: { min_age: 0 },
      },
    ],
    loans: [
      {
        id: "loan_auto_new",
        name: "New Auto Loan",
        type: "AUTO",
        rate_min: 4.99,
        rate_max: 18.99,
        term_min: 12,
        term_max: 84,
        amount_min: 5000,
        amount_max: 100000,
        ltv_max: 120,
      },
      {
        id: "loan_personal",
        name: "Personal Loan",
        type: "PERSONAL",
        rate_min: 7.99,
        rate_max: 17.99,
        term_min: 12,
        term_max: 60,
        amount_min: 1000,
        amount_max: 50000,
        ltv_max: 100,
      },
    ],
    cards: [
      {
        id: "card_visa_signature",
        name: "Visa Signature",
        network: "VISA",
        type: "CREDIT",
        rewards_rate: 1.5,
        annual_fee: 0,
        foreign_tx_fee: 0,
        apr_purchase: 12.99,
        apr_cash: 24.99,
      },
      {
        id: "card_debit",
        name: "Debit Card",
        network: "VISA",
        type: "DEBIT",
        rewards_rate: 0,
        annual_fee: 0,
        foreign_tx_fee: 1.0,
        apr_purchase: 0,
        apr_cash: 0,
      },
    ],
    catalog: [],
  },

  // TIER 7: Business Rules (was TIER 5)
  rules: {
    transfer: {
      internal: {
        daily_limit: 50000,
        per_tx_limit: 25000,
      },
      external: {
        daily_limit: 10000,
        per_tx_limit: 5000,
        hold_days: 3,
      },
      p2p: {
        daily_limit: 2500,
        per_tx_limit: 1000,
        monthly_limit: 10000,
      },
      wire: {
        domestic_fee: 25,
        international_fee: 45,
      },
    },
    bill_pay: {
      daily_limit: 10000,
      per_tx_limit: 5000,
    },
    mobile_deposit: {
      daily_limit: 5000,
      monthly_limit: 25000,
      per_check_limit: 2500,
      hold_days: {
        default: 2,
        new_member: 5,
        large_check: 7,
      },
      large_check_threshold: 2500,
    },
    atm: {
      daily_withdrawal: 500,
      per_tx_withdrawal: 300,
    },
    pos: {
      daily_limit: 5000,
      per_tx_limit: 2500,
    },
    session: {
      timeout_minutes: 15,
      remember_device_days: 30,
    },
    password: {
      min_length: 12,
      require_special: true,
      require_number: true,
      require_uppercase: true,
      expiry_days: 0,
    },
    mfa: {
      required: true,
      methods: ["sms", "email", "totp", "push"],
    },
    lockout: {
      attempts: 5,
      duration_minutes: 30,
    },
    loan_extension: {
      auto_approve_max_days: 30,
      auto_approve_loan_types: [
        "0", "1", "100", "101", "200", "201", "300", "301", "400", "401",
        "500", "501", "700", "701", "804", "805", "900", "901", "1300", "1302", "1400", "1401", "1402", "1500", "1501",
      ],
      eligibility_window_days: 30,
      min_payments_made: 3,
      max_extension_count: 3,
      last_extension_cooldown_days: 365,
      excluded_purpose_codes: [59, 84, 85],
    },
  },

  // TIER 8: Fraud & Risk (was TIER 6)
  fraud: {
    risk_threshold: {
      block: 90,
      review: 70,
      step_up: 50,
    },
    velocity: {
      tx_per_hour: 10,
      tx_per_day: 50,
      amount_per_hour: 5000,
      amount_per_day: 25000,
      new_payee_per_day: 3,
    },
    device: {
      require_trusted: false,
      max_devices: 5,
    },
    geo: {
      allowed_countries: ["US", "CA", "MX"],
      blocked_countries: ["RU", "KP", "IR"],
      domestic_only: false,
    },
    network: {
      share_signals: true,
      consume_signals: true,
    },
    alerts: {
      email: true,
      sms: true,
      push: true,
    },
    realtime: {
      enabled: true,
    },
  },

  // TIER 9: Compliance (was TIER 7)
  compliance: {
    kyc: {
      provider: "internal",
      level: "cip",
      document_required: false,
      selfie_required: false,
    },
    ctr: {
      threshold: 10000,
    },
    sar: {
      auto_file: false,
    },
    ofac: {
      enabled: true,
      on_onboard: true,
      on_transfer: true,
    },
    pep: {
      enabled: true,
    },
    adverse_media: {
      enabled: true,
    },
    fdx: {
      version: "5.3.1",
      consent_duration_days: 365,
      data_clusters: ["ACCOUNT_BASIC", "TRANSACTIONS"],
      api_url: process.env.FDX_API_URL || "",
      enabled: true,
    },
    section_1033: {
      enabled: true,
      developer_portal: true,
    },
    audit: {
      retention_years: 7,
      immutable: true,
      rekor_enabled: true,
    },
    regulation_e: {
      enabled: true,
      provisional_credit_days: 10,
    },
    wcag: {
      level: "AA",
    },
    state: "FL",
    state_licenses: ["FL"],
  },

  // TIER 10: Integrations (was TIER 8)
  integrations: {
    core: {
      provider: "symitar",
      host: "tunnel://cu_default_001",
      environment: "production",
      timeout_ms: 30000,
      retry_attempts: 3,
      // PowerOn / Symitar Credentials - ENTER HERE
      poweron: {
        mode: "mock", // Change to "symxchange" or "direct" when ready
        // SymXchange API (Jack Henry) - Enter credentials from Jack Henry
        symxchange_url: "",
        symxchange_api_key: "",
        // Direct PowerOn Connection - Enter if using direct connection
        poweron_host: "",
        poweron_port: 443,
        institution_id: "",
        device_number: 0,
        device_type: "WEBAPI",
        processor_user: "",
        // X509 Certificate thumbprint (stored securely)
        certificate_thumbprint: "",
      },
    },
    card_processor: {
      provider: "fiserv",
      bin: "000000",
      endpoint: "https://api.fiserv.com",
    },
    ach: {
      provider: "federal_reserve",
      routing: "000000000",
      odfi_id: "00000000",
    },
    rtp: {
      enabled: true,
      participant_id: "",
    },
    fednow: {
      enabled: true,
      participant_id: "",
    },
    shared_branching: {
      enabled: true,
      cu_number: "",
    },
    atm_network: {
      provider: "co-op",
    },
    bill_pay: {
      provider: "internal",
    },
    credit_bureau: {
      provider: "equifax",
    },
    insurance: {
      provider: "cuna_mutual",
    },
    statement: {
      provider: "internal",
    },
    sms: {
      provider: "twilio",
      from_number: "+18005550100",
    },
    email: {
      provider: "sendgrid",
      from_address: "noreply@community.app",
    },
    push: {
      provider: "firebase",
    },
    analytics: {
      provider: "internal",
    },
    transaction_enrichment: {
      enabled: true,
      provider: "internal", // Use internal edge service by default (saves $49,940/year vs MX)
      worker_url: process.env.TRANSACTION_ENRICHMENT_URL || "",
      api_key: "", // Optional: for custom Cloudflare Worker
      mx_api_key: "", // If using MX.com instead
      plaid_client_id: "", // If using Plaid instead
    },
    hume: {
      enabled: true,
      api_key: "", // Enter Hume API key here (from Configuration → Integrations)
      project_id: "",
    },
    // OAuth / Identity Provider - ENTER CREDENTIALS HERE
    auth: {
      provider: "internal",
      base_url: "",
      client_id: "",
      client_secret: "",
      redirect_uri: "",
    },
  },

  // TIER 11: Channels (was TIER 9)
  channels: {
    mobile: {
      ios: {
        enabled: true,
        app_store_id: "",
        min_version: "2.0.0",
      },
      android: {
        enabled: true,
        play_store_id: "",
        min_version: "2.0.0",
      },
    },
    web: {
      enabled: true,
      url: "https://community.app",
      subdomain: null,
    },
    branch: {
      enabled: true,
      teller_app: true,
      hardware: {
        signature_pad: "topaz",
        scanner: "canon",
        cash_drawer: "apg",
        receipt_printer: "epson",
      },
    },
    ivr: {
      enabled: true,
      phone_number: "+1813XXXXXXX", // 813 area code - configure in Integrations → SMS
      voice_biometrics: false,
      callback: true,
      poweron_specs: {
        enabled: true,
        use_all_specs: true, // All 36 IVR PowerOn specs enabled
      },
      hume: {
        enabled: true,
        evi_version: "3",
        config_id: "", // Enter Hume EVI Config ID
        webhook_url: "", // Auto-generated: /api/ivr/hume-webhook
      },
      twilio: {
        // Credentials loaded from integrations.sms
        phone_number: "", // Twilio phone number (813 area code)
      },
    },
    sms_banking: {
      enabled: false,
    },
    chatbot: {
      enabled: true,
      escalation: true,
    },
    video: {
      enabled: false,
    },
  },

  // TIER 12: Notifications (was TIER 10)
  notifications: {
    login: {
      new_device: ["push", "email"],
      failed: ["push"],
    },
    transaction: {
      large: ["push", "sms"],
      large_threshold: 500,
      international: ["push", "sms"],
      declined: ["push"],
    },
    balance: {
      low: ["push", "email"],
      low_threshold: 100,
      negative: ["push", "sms", "email"],
    },
    deposit: {
      received: ["push"],
      direct_deposit: ["push", "email"],
    },
    payment: {
      due: ["push", "email"],
      due_days_before: 3,
      posted: ["push"],
    },
    statement: {
      ready: ["email"],
    },
    fraud: {
      alert: ["push", "sms", "email"],
    },
    card: {
      frozen: ["push", "email"],
      unfrozen: ["push"],
    },
    message: {
      new: ["push"],
    },
  },

  // TIER 13: Content & Copy (was TIER 11)
  content: {
    app_name: "Community CU",
    tagline: "Banking for Everyone",
    member_term: "member",
    share_term: "account",
    welcome_message: "Welcome back, {first_name}",
    onboarding: {
      headline: "Join Our Community",
      steps: ["identity", "funding", "products"],
    },
    error: {
      generic: "Something went wrong. Please try again.",
      network: "Please check your internet connection and try again.",
      session: "Your session has expired. Please log in again.",
    },
    legal: {
      privacy_url: "https://community.app/privacy",
      terms_url: "https://community.app/terms",
      disclosures_url: "https://community.app/disclosures",
      ada_statement: "We are committed to ensuring accessibility for all members.",
    },
    support: {
      faq_url: "https://community.app/faq",
      hours: "24/7",
    },
    marketing: {
      promo_banner: {
        enabled: false,
        text: "",
      },
    },
    screens: {
      dashboard: { title: "Overview", enabled: true },
      accounts: { title: "Accounts", enabled: true },
      account_details: { title: "Account Details", enabled: true },
      transfers: { title: "Transfers", enabled: true },
      bill_pay: { title: "Bill Pay", enabled: true },
      connect: { title: "Connect", enabled: true },
      goals: { title: "Goals", enabled: true },
      income: { title: "Income", enabled: true },
      spending: { title: "Spending", enabled: true },
      net_worth: { title: "Net Worth", enabled: true },
      locations: { title: "Locations", enabled: true },
      rdc: { title: "Mobile Deposit", enabled: true },
      settings: { title: "Settings", enabled: true },
      manage_accounts: { title: "Manage Accounts", enabled: true },
      payment_input: { title: "Payment", enabled: true },
      amount_picker: { title: "Amount", enabled: true },
      date_picker: { title: "Date", enabled: true },
      confirmation: { title: "Confirmation", enabled: true },
      frequency_picker: { title: "Frequency", enabled: true },
      empty_states: { title: "Empty States", enabled: true },
      placeholder: { title: "Details", enabled: true },
    },
  },

  // TIER 14: UCX (was TIER 12)
  ucx: {
    enabled: true,
    consent_dialog: true,
    error_threshold: 10,
    auto_deploy: false,
    approval_required: true,
    rollback_threshold: 5,
    feedback_collection: true,
    sentiment_analysis: true,
    github_repo: "",
    github_branch: "main",
    deploy_hook: "",
  },

  // TIER 15: AI Coaching (was TIER 13)
  ai: {
    coach: {
      enabled: true,
      name: "Navigator",
      personality: "supportive",
      avatar: "",
      proactive: true,
      spending_insights: true,
      budget_enforcement: true,
      goal_tracking: true,
      financial_literacy: true,
      tone: "professional",
      emoji_use: false,
    },
    support: {
      enabled: true,
      escalation_threshold: 3,
      after_hours: true,
    },
  },

  // TIER 16: Deployment (was TIER 14)
  deploy: {
    environment: "production",
    region: "us-east-1",
    cdn: "cdn.cu.app",
    api: "api.cu.app",
    edge: "edge.cu.app",
    database: {
      host: "db.supabase.co",
      pool_size: 20,
    },
    cache: {
      provider: "redis",
      ttl_seconds: 300,
    },
    logging: {
      level: "info",
      retention_days: 30,
    },
    monitoring: {
      enabled: true,
      alerting: true,
    },
    backup: {
      enabled: true,
      frequency: "daily",
      retention_days: 30,
    },
  },

  // TIER 17: PowerOn Specs
  poweron: {
    enabled: true,
    prefix: "SCU",
    basePath: "SCU",
    specs: generatePowerOnSpecs("SCU"),
    categorySettings: {
      products: { enabled: true },
      memopost: { enabled: true },
      transfers: { enabled: true },
      symxchange: { enabled: true },
      "userview-admin": { enabled: true },
      userview: { enabled: true },
      membergraph: { enabled: true },
      userservice: { enabled: true },
      accountservice: { enabled: true },
      ivr: { enabled: true },
      mobilebanking: { enabled: true },
      transactions: { enabled: true },
    },
  },

  // TIER 17: Marketing CMS (NEW)
  marketing: {
    enabled: true,
    site_url: "", // Auto-generated: {tenant_id}.cuapp.com or custom domain
    homepage: {
      hero: {
        title: "Banking Built for You",
        subtitle: "Experience the difference of member-focused financial services",
        ctaText: "Get Started Today",
        ctaLink: "/enrollment",
        backgroundImage: "",
      },
      ogImage: "",
      pageTitle: "CU.APP - Your Credit Union",
      pageDescription: "Member-focused financial services built for your success",
    },
    pages: [],
    media_library: [],
  },
}

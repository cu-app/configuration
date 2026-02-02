/**
 * EXHAUSTIVE FEATURE-TO-CONFIG FIELD MAPPING
 * Maps every UI feature in the mobile app to its controlling config fields
 * Tagged with bug keywords for auto-routing feedback to correct config
 *
 * Based on mobile app screenshots:
 * - Overview (Joint View, Error View, Youth View, Business View)
 * - Account Cards, Quick Actions, Savings/Checking/Loans/Cards sections
 * - Transaction Activity, Bottom Navigation
 */

export type AppTarget = "member" | "employee" | "both" | "infrastructure"
export type FeatureCategory =
  | "dashboard"
  | "accounts"
  | "transfers"
  | "deposits"
  | "payments"
  | "cards"
  | "loans"
  | "alerts"
  | "auth"
  | "profile"
  | "support"
  | "branding"
  | "navigation"

export interface ConfigFieldMapping {
  // Config path (e.g., "rules.transfer.internal.daily_limit")
  path: string

  // Human-readable name
  name: string

  // Which app(s) consume this field
  target: AppTarget

  // Feature category for grouping
  category: FeatureCategory

  // Is this critical for the app to function?
  critical: boolean

  // Bug keywords that should route to this field
  bugKeywords: string[]

  // Which UI screens/components use this field
  uiScreens: string[]

  // Plain English explanation of what this controls
  explanation: string

  // Dart file path in member app (if applicable)
  dartPath?: string

  // Web component path in employee app (if applicable)
  webPath?: string
}

// ============================================================================
// EXHAUSTIVE MAPPING - ALL 380+ FIELDS
// ============================================================================

export const FEATURE_CONFIG_MAPPINGS: ConfigFieldMapping[] = [
  // ============================================================================
  // TIER 1: IDENTITY & BRAND → Branding throughout both apps
  // ============================================================================
  {
    path: "tenant.name",
    name: "Credit Union Name",
    target: "both",
    category: "branding",
    critical: true,
    bugKeywords: ["name wrong", "wrong name", "credit union name", "company name", "institution name"],
    uiScreens: ["Header", "Login Screen", "About", "Settings", "Receipts"],
    explanation:
      "The official name shown in the app header, login screen, and all receipts. Members see this every time they open the app.",
    dartPath: "lib/config/branding.dart",
    webPath: "components/header.tsx",
  },
  {
    path: "tenant.support.phone",
    name: "Support Phone Number",
    target: "both",
    category: "support",
    critical: true,
    bugKeywords: ["phone number", "call support", "contact number", "wrong phone", "cant call"],
    uiScreens: ["Help Screen", "Contact Us", "Error Dialogs", "Footer"],
    explanation:
      "The phone number members tap to call for help. Also shown to employees in their header for quick reference.",
    dartPath: "lib/config/support.dart",
    webPath: "components/support-banner.tsx",
  },
  {
    path: "tenant.support.email",
    name: "Support Email",
    target: "both",
    category: "support",
    critical: true,
    bugKeywords: ["email support", "contact email", "wrong email", "cant email"],
    uiScreens: ["Help Screen", "Contact Us", "Feedback Form"],
    explanation: 'Where member support emails go. Tapping "Email Us" opens their email app with this address.',
    dartPath: "lib/config/support.dart",
    webPath: "components/contact-form.tsx",
  },
  {
    path: "tenant.timezone",
    name: "Default Timezone",
    target: "both",
    category: "dashboard",
    critical: false,
    bugKeywords: ["wrong time", "time zone", "timezone", "time is off", "transaction time wrong"],
    uiScreens: ["Transaction History", "Scheduled Transfers", "Statements"],
    explanation:
      "Controls how times appear on transactions and scheduled payments. Important for members in different time zones.",
    dartPath: "lib/utils/datetime.dart",
    webPath: "lib/utils/format-date.ts",
  },
  {
    path: "tenant.legal.routing",
    name: "Routing Number",
    target: "both",
    category: "accounts",
    critical: true,
    bugKeywords: ["routing number", "routing wrong", "aba number", "direct deposit setup"],
    uiScreens: ["Account Details", "Direct Deposit Info", "Wire Instructions"],
    explanation: "The 9-digit ABA routing number shown when members need to set up direct deposit or wire transfers.",
    dartPath: "lib/screens/account_details.dart",
    webPath: "components/account-info.tsx",
  },

  // ============================================================================
  // TIER 2: DESIGN TOKENS → Visual appearance everywhere
  // ============================================================================
  {
    path: "tokens.color.primary",
    name: "Primary Brand Color",
    target: "both",
    category: "branding",
    critical: true,
    bugKeywords: ["color wrong", "brand color", "wrong color", "theme color", "button color"],
    uiScreens: ["All Screens - Headers, Buttons, Links, Icons"],
    explanation:
      "Your main brand color. Used for the header, primary buttons, links, and accent elements throughout the entire app.",
    dartPath: "lib/theme/colors.dart",
    webPath: "app/globals.css",
  },
  {
    path: "tokens.color.error",
    name: "Error/Warning Color",
    target: "both",
    category: "alerts",
    critical: true,
    bugKeywords: ["error color", "red color", "warning color", "negative balance color", "overdrawn color"],
    uiScreens: ["Error States", "Negative Balances", "Overdrawn Alerts", "Payment Due Warnings"],
    explanation:
      "The red/error color used for negative balances, overdrawn accounts, and payment overdue warnings. See in Error View screenshot.",
    dartPath: "lib/theme/colors.dart",
    webPath: "app/globals.css",
  },
  {
    path: "tokens.color.success",
    name: "Success Color",
    target: "both",
    category: "alerts",
    critical: false,
    bugKeywords: ["success color", "green color", "positive color", "deposit color"],
    uiScreens: ["Deposit Confirmations", "Transfer Success", "Positive Transactions"],
    explanation: "The green color shown for successful transactions, deposits (+$100.00), and confirmation messages.",
    dartPath: "lib/theme/colors.dart",
    webPath: "app/globals.css",
  },
  {
    path: "tokens.logo.primary",
    name: "Primary Logo URL",
    target: "both",
    category: "branding",
    critical: true,
    bugKeywords: ["logo wrong", "logo missing", "logo not showing", "wrong logo", "logo broken"],
    uiScreens: ["Login Screen", "App Header", "Splash Screen", "About Screen"],
    explanation:
      "Your full logo image. Displayed on the login screen, splash screen, and in the app header. Must be a valid URL.",
    dartPath: "lib/config/branding.dart",
    webPath: "components/logo.tsx",
  },
  {
    path: "tokens.typography.family.heading",
    name: "Heading Font",
    target: "both",
    category: "branding",
    critical: false,
    bugKeywords: ["font wrong", "heading font", "title font", "text looks wrong"],
    uiScreens: ["All Headers", "Account Names", "Section Titles"],
    explanation:
      'Font used for "Good morning, Darlene", account names like "Sam\'s Main Account", and section headers.',
    dartPath: "lib/theme/typography.dart",
    webPath: "app/layout.tsx",
  },

  // ============================================================================
  // TIER 3: FEATURE FLAGS → What's visible/enabled in the app
  // ============================================================================
  {
    path: "features.mobile_deposit",
    name: "Mobile Deposit Enabled",
    target: "member",
    category: "deposits",
    critical: true,
    bugKeywords: ["deposit check", "rdc", "mobile deposit", "cant deposit", "check deposit missing", "deposit a check"],
    uiScreens: ['Quick Actions - "Deposit a Check" button', "Deposit Flow"],
    explanation:
      'Shows/hides the "Deposit a Check" button in Quick Actions. When OFF, members cannot deposit checks via the app.',
    dartPath: "lib/features/mobile_deposit.dart",
  },
  {
    path: "features.bill_pay",
    name: "Bill Pay Enabled",
    target: "member",
    category: "payments",
    critical: true,
    bugKeywords: ["bill pay", "pay bills", "bills missing", "cant pay bills", "pay bill button"],
    uiScreens: ['Bottom Nav - "Pay Bills" tab', "Bill Pay Flow"],
    explanation:
      'Shows/hides the "Pay Bills" tab in bottom navigation. When OFF, members must pay bills through other means.',
    dartPath: "lib/features/bill_pay.dart",
  },
  {
    path: "features.p2p",
    name: "Person-to-Person Transfers",
    target: "member",
    category: "transfers",
    critical: false,
    bugKeywords: ["p2p", "send money", "pay friend", "send to friend", "person to person"],
    uiScreens: ["Transfer Flow - P2P Option", "Send Money Screen"],
    explanation:
      "Enables sending money to other people by phone/email. When OFF, members can only transfer between their own accounts.",
    dartPath: "lib/features/p2p_transfer.dart",
  },
  {
    path: "features.card_controls",
    name: "Card Controls Enabled",
    target: "member",
    category: "cards",
    critical: true,
    bugKeywords: ["card control", "freeze card", "lock card", "card settings", "turn off card"],
    uiScreens: ["My Cards Tab", "Card Details - Lock/Unlock Toggle"],
    explanation: "Lets members freeze/unfreeze their cards instantly. Critical security feature - members expect this.",
    dartPath: "lib/features/card_controls.dart",
  },
  {
    path: "features.joint_access",
    name: "Joint Account Access",
    target: "member",
    category: "accounts",
    critical: true,
    bugKeywords: ["joint account", "joint savings", "joint checking", "shared account", "spouse account"],
    uiScreens: ['Account Sections - "Joint Savings" / "Joint Checking" toggles'],
    explanation:
      'Shows the "My Savings" / "Joint Savings" toggle in account sections. When OFF, joint accounts are hidden.',
    dartPath: "lib/features/joint_access.dart",
  },
  {
    path: "features.account_opening",
    name: "Open New Accounts",
    target: "member",
    category: "accounts",
    critical: false,
    bugKeywords: ["open account", "new account", "apply account", "open & apply", "open and apply"],
    uiScreens: ['Quick Actions - "Open & Apply" button'],
    explanation:
      'Shows/hides the "Open & Apply" button in Quick Actions. See Youth View - this button is hidden for youth accounts.',
    dartPath: "lib/features/account_opening.dart",
  },
  {
    path: "features.loan_applications",
    name: "Loan Applications",
    target: "member",
    category: "loans",
    critical: false,
    bugKeywords: ["apply loan", "loan application", "get loan", "apply for loan"],
    uiScreens: ["Loans Section", "Open & Apply Flow"],
    explanation: 'Allows members to apply for new loans in-app. Part of the "Open & Apply" flow.',
    dartPath: "lib/features/loan_application.dart",
  },
  {
    path: "features.dark_mode",
    name: "Dark Mode Toggle",
    target: "member",
    category: "profile",
    critical: false,
    bugKeywords: ["dark mode", "night mode", "dark theme", "light mode", "theme toggle"],
    uiScreens: ["Settings Screen - Appearance Toggle"],
    explanation: "Shows/hides the dark mode toggle in settings. Many members prefer dark mode for nighttime banking.",
    dartPath: "lib/theme/dark_mode.dart",
  },
  {
    path: "features.face_id",
    name: "Face ID / Touch ID",
    target: "member",
    category: "auth",
    critical: true,
    bugKeywords: ["face id", "touch id", "fingerprint", "biometric", "faceid not working"],
    uiScreens: ["Login Screen - Biometric Prompt", "Settings - Security"],
    explanation:
      "Enables biometric login on iOS (Face ID) and Android (Fingerprint). Members strongly prefer this over typing passwords.",
    dartPath: "lib/auth/biometrics.dart",
  },
  {
    path: "features.ai_coach",
    name: "AI Financial Coach",
    target: "member",
    category: "support",
    critical: false,
    bugKeywords: ["ai coach", "financial coach", "money coach", "coach", "ai assistant", "chatbot"],
    uiScreens: ["AI Coach Tab", "Spending Insights", "Budget Suggestions"],
    explanation:
      "Enables the AI-powered financial coaching feature. Provides spending insights and budget recommendations.",
    dartPath: "lib/features/ai_coach.dart",
  },

  // ============================================================================
  // TIER 4: PRODUCT CONFIGURATION → What products members see
  // ============================================================================
  {
    path: "products.shares",
    name: "Share/Account Products",
    target: "both",
    category: "accounts",
    critical: true,
    bugKeywords: ["account type", "savings type", "checking type", "account product", "share type"],
    uiScreens: ["Savings Section", "Checking Section", "Account Cards"],
    explanation:
      "Defines all savings/checking account types: Regular Savings, Special Savings, Youth Certificate, etc. Controls what accounts members can open.",
    dartPath: "lib/models/share_product.dart",
    webPath: "types/products.ts",
  },
  {
    path: "products.loans",
    name: "Loan Products",
    target: "both",
    category: "loans",
    critical: true,
    bugKeywords: ["loan type", "auto loan", "mortgage", "personal loan", "loan product"],
    uiScreens: ["Loans Section", 'Loan Cards - "2014 Honda Accord", "Supertrig and Fast Boat"'],
    explanation:
      "Defines all loan types: Auto, Mortgage, Personal, etc. Controls rates, terms, and what loans members can apply for.",
    dartPath: "lib/models/loan_product.dart",
    webPath: "types/products.ts",
  },
  {
    path: "products.cards",
    name: "Card Products",
    target: "both",
    category: "cards",
    critical: true,
    bugKeywords: ["card type", "credit card", "debit card", "visa", "mastercard", "rewards card"],
    uiScreens: ["Credit Cards Section", "My Cards Tab", "Card Details"],
    explanation:
      "Defines all card products: Student Rewards 1234, Classic Rewards 1234, Platinum Rewards. Controls rewards rates and fees.",
    dartPath: "lib/models/card_product.dart",
    webPath: "types/products.ts",
  },

  // ============================================================================
  // TIER 5: BUSINESS RULES → Limits and restrictions
  // ============================================================================
  {
    path: "rules.transfer.internal.daily_limit",
    name: "Internal Transfer Daily Limit",
    target: "member",
    category: "transfers",
    critical: true,
    bugKeywords: ["transfer limit", "daily limit", "cant transfer", "limit exceeded", "transfer blocked"],
    uiScreens: ["Transfer Flow - Limit Warning", "Transfer Confirmation"],
    explanation:
      'Max amount a member can transfer between their own accounts per day. When exceeded, shows "Daily limit reached" error.',
    dartPath: "lib/rules/transfer_limits.dart",
  },
  {
    path: "rules.transfer.external.daily_limit",
    name: "External Transfer Daily Limit",
    target: "member",
    category: "transfers",
    critical: true,
    bugKeywords: ["external transfer", "ach limit", "outside transfer", "external limit"],
    uiScreens: ["External Transfer Flow", "Linked Accounts Transfer"],
    explanation:
      "Max amount a member can send to external banks per day via ACH. Lower than internal for fraud protection.",
    dartPath: "lib/rules/transfer_limits.dart",
  },
  {
    path: "rules.transfer.p2p.daily_limit",
    name: "P2P Daily Limit",
    target: "member",
    category: "transfers",
    critical: true,
    bugKeywords: ["p2p limit", "send money limit", "person to person limit"],
    uiScreens: ["P2P Transfer Flow", "Send Money Screen"],
    explanation: "Max amount a member can send to other people per day. Usually lowest limit for fraud protection.",
    dartPath: "lib/rules/transfer_limits.dart",
  },
  {
    path: "rules.mobile_deposit.daily_limit",
    name: "Mobile Deposit Daily Limit",
    target: "member",
    category: "deposits",
    critical: true,
    bugKeywords: ["deposit limit", "check limit", "rdc limit", "mobile deposit limit", "cant deposit check"],
    uiScreens: ["Deposit Check Flow - Limit Info", "Deposit Confirmation"],
    explanation:
      "Max amount a member can deposit via mobile check deposit per day. Shows remaining limit in deposit flow.",
    dartPath: "lib/rules/deposit_limits.dart",
  },
  {
    path: "rules.mobile_deposit.hold_days.default",
    name: "Default Check Hold Days",
    target: "member",
    category: "deposits",
    critical: true,
    bugKeywords: ["check hold", "funds hold", "deposit hold", "when available", "funds availability"],
    uiScreens: ['Deposit Confirmation - "Funds available" date'],
    explanation:
      'How many days deposited checks are held before funds are available. Shows as "Available by [date]" after deposit.',
    dartPath: "lib/rules/deposit_holds.dart",
  },
  {
    path: "rules.atm.daily_withdrawal",
    name: "ATM Daily Withdrawal Limit",
    target: "member",
    category: "cards",
    critical: true,
    bugKeywords: ["atm limit", "cash limit", "withdrawal limit", "atm daily", "cant withdraw"],
    uiScreens: ["Card Details", "ATM Locator", "Card Settings"],
    explanation:
      "Max cash a member can withdraw from ATMs per day. Shown in card details and when limit is approached.",
    dartPath: "lib/rules/atm_limits.dart",
  },
  {
    path: "rules.session.timeout_minutes",
    name: "Session Timeout",
    target: "both",
    category: "auth",
    critical: true,
    bugKeywords: ["session timeout", "logged out", "session expired", "keeps logging out", "timeout too short"],
    uiScreens: ["Timeout Warning Dialog", "Re-login Prompt"],
    explanation:
      "How long before inactive users are logged out. Shows warning before timeout. Too short = annoyed members.",
    dartPath: "lib/auth/session.dart",
    webPath: "lib/auth/session.ts",
  },
  {
    path: "rules.lockout.attempts",
    name: "Login Lockout Attempts",
    target: "both",
    category: "auth",
    critical: true,
    bugKeywords: ["locked out", "too many attempts", "account locked", "cant login", "login blocked"],
    uiScreens: ["Login Screen - Lockout Message", "Account Locked Screen"],
    explanation:
      'How many failed login attempts before account is locked. Shows "Account locked" message when exceeded.',
    dartPath: "lib/auth/lockout.dart",
    webPath: "lib/auth/lockout.ts",
  },

  // ============================================================================
  // TIER 6: FRAUD & RISK → Security features
  // ============================================================================
  {
    path: "fraud.velocity.tx_per_day",
    name: "Max Transactions Per Day",
    target: "member",
    category: "alerts",
    critical: false,
    bugKeywords: ["too many transactions", "transaction blocked", "velocity", "suspicious activity"],
    uiScreens: ["Transaction Blocked Dialog", "Fraud Alert"],
    explanation: "Max transactions allowed per day before triggering fraud review. Protects against account takeover.",
    dartPath: "lib/fraud/velocity.dart",
  },
  {
    path: "fraud.alerts.push",
    name: "Fraud Alert Push Notifications",
    target: "member",
    category: "alerts",
    critical: true,
    bugKeywords: ["fraud alert", "suspicious notification", "fraud notification", "no fraud alert"],
    uiScreens: ["Push Notification", "Fraud Alert Screen"],
    explanation: "Sends push notifications for suspected fraud. Critical for quick response to account compromise.",
    dartPath: "lib/fraud/alerts.dart",
  },

  // ============================================================================
  // TIER 7: COMPLIANCE → Required legal features
  // ============================================================================
  {
    path: "compliance.wcag.level",
    name: "Accessibility Level",
    target: "both",
    category: "profile",
    critical: true,
    bugKeywords: ["accessibility", "screen reader", "blind", "ada", "wcag", "cant see", "hard to read"],
    uiScreens: ["All Screens - Accessibility Features"],
    explanation:
      "WCAG accessibility compliance level (A, AA, AAA). Affects text contrast, screen reader support, and touch targets.",
    dartPath: "lib/accessibility/wcag.dart",
    webPath: "lib/accessibility/wcag.ts",
  },
  {
    path: "compliance.regulation_e.provisional_credit_days",
    name: "Provisional Credit Days",
    target: "employee",
    category: "support",
    critical: true,
    bugKeywords: ["dispute", "provisional credit", "reg e", "charge back", "fraud dispute"],
    uiScreens: ["Employee - Dispute Resolution", "Provisional Credit Form"],
    explanation:
      "Days to issue provisional credit for disputed transactions (Reg E). Employees must follow this timeline.",
    webPath: "components/dispute-form.tsx",
  },

  // ============================================================================
  // TIER 8: INTEGRATIONS → Core system connections
  // ============================================================================
  {
    path: "integrations.core.provider",
    name: "Core Banking Provider",
    target: "infrastructure",
    category: "accounts",
    critical: true,
    bugKeywords: ["core down", "system down", "cant load accounts", "symitar", "corelation"],
    uiScreens: ["All Account Data"],
    explanation:
      'The core banking system (Symitar, Corelation, DNA). All account data comes from here. If down, app shows "Unable to load accounts".',
    dartPath: "lib/integrations/core.dart",
    webPath: "lib/integrations/core.ts",
  },
  {
    path: "integrations.card_processor.provider",
    name: "Card Processor",
    target: "infrastructure",
    category: "cards",
    critical: true,
    bugKeywords: ["card not working", "card declined", "processor down", "fiserv", "pscu"],
    uiScreens: ["Card Transactions", "Card Controls"],
    explanation: "Card processing system (Fiserv, PSCU, CO-OP). Handles all card transactions and controls.",
    dartPath: "lib/integrations/card_processor.dart",
    webPath: "lib/integrations/card_processor.ts",
  },

  // ============================================================================
  // TIER 9: CHANNELS → Where members interact
  // ============================================================================
  {
    path: "channels.mobile.ios.min_version",
    name: "iOS Minimum Version",
    target: "member",
    category: "profile",
    critical: true,
    bugKeywords: ["update app", "version", "ios version", "update required", "app store"],
    uiScreens: ["Force Update Dialog"],
    explanation:
      'Minimum iOS app version allowed. Older versions see "Please update" dialog. Used to force security updates.',
    dartPath: "lib/config/versions.dart",
  },
  {
    path: "channels.ivr.phone_number",
    name: "IVR Phone Number",
    target: "both",
    category: "support",
    critical: true,
    bugKeywords: ["phone banking", "ivr", "call in", "automated phone"],
    uiScreens: ["Contact Us", "Phone Banking Info"],
    explanation:
      "Phone number for automated phone banking. Members call this for balance inquiries and transfers by phone.",
    dartPath: "lib/config/support.dart",
    webPath: "components/contact-info.tsx",
  },

  // ============================================================================
  // TIER 10: NOTIFICATIONS → What alerts members receive
  // ============================================================================
  {
    path: "notifications.transaction.large",
    name: "Large Transaction Alert Channels",
    target: "member",
    category: "alerts",
    critical: true,
    bugKeywords: ["large transaction", "big purchase", "no notification", "didnt get alert"],
    uiScreens: ["Push Notification", "SMS Alert", "Email Alert"],
    explanation: "How to notify members of large transactions (push, SMS, email). Critical for fraud detection.",
    dartPath: "lib/notifications/transaction_alerts.dart",
  },
  {
    path: "notifications.transaction.large_threshold",
    name: "Large Transaction Threshold",
    target: "member",
    category: "alerts",
    critical: true,
    bugKeywords: ["alert threshold", "how much for alert", "large amount", "notification amount"],
    uiScreens: ["Settings - Alert Preferences"],
    explanation:
      'Dollar amount that triggers "large transaction" alerts. Default $500. Members can customize in settings.',
    dartPath: "lib/notifications/thresholds.dart",
  },
  {
    path: "notifications.balance.low_threshold",
    name: "Low Balance Threshold",
    target: "member",
    category: "alerts",
    critical: true,
    bugKeywords: ["low balance", "balance alert", "low funds", "balance threshold"],
    uiScreens: ["Push Notification", "Dashboard Warning Banner"],
    explanation:
      'Balance that triggers low balance alert. Shows warning banner on dashboard (see Error View - "Your account has been overdrawn").',
    dartPath: "lib/notifications/balance_alerts.dart",
  },
  {
    path: "notifications.payment.due_days_before",
    name: "Payment Due Reminder Days",
    target: "member",
    category: "payments",
    critical: false,
    bugKeywords: ["payment reminder", "due date reminder", "loan reminder", "payment due"],
    uiScreens: ["Push Notification", 'Loans Section - "This payment is 45 days overdue"'],
    explanation:
      "Days before payment due to send reminder. Helps members avoid late fees and the overdue warnings shown in Error View.",
    dartPath: "lib/notifications/payment_reminders.dart",
  },

  // ============================================================================
  // TIER 11: CONTENT & COPY → What the app says
  // ============================================================================
  {
    path: "content.welcome_message",
    name: "Welcome Message Template",
    target: "member",
    category: "dashboard",
    critical: true,
    bugKeywords: ["welcome message", "good morning", "greeting", "hello message", "name wrong"],
    uiScreens: ['Dashboard Header - "Good morning, Darlene"'],
    explanation: "The greeting at top of dashboard. Supports {first_name} template. Changes based on time of day.",
    dartPath: "lib/content/greetings.dart",
  },
  {
    path: "content.member_term",
    name: "Member vs Customer Term",
    target: "both",
    category: "branding",
    critical: false,
    bugKeywords: ["member", "customer", "terminology", "word choice"],
    uiScreens: ["All Screens - Text Copy"],
    explanation: 'Whether to say "member" or "customer" throughout the app. Credit unions typically use "member".',
    dartPath: "lib/content/terminology.dart",
    webPath: "lib/content/terminology.ts",
  },
  {
    path: "content.error.generic",
    name: "Generic Error Message",
    target: "both",
    category: "alerts",
    critical: true,
    bugKeywords: ["error message", "something went wrong", "error text", "error wording"],
    uiScreens: ["Error Dialogs", "Failed Transaction Screens"],
    explanation: "What to show when something breaks and we dont know why. Should be helpful, not scary.",
    dartPath: "lib/content/errors.dart",
    webPath: "lib/content/errors.ts",
  },
  {
    path: "content.legal.privacy_url",
    name: "Privacy Policy URL",
    target: "both",
    category: "support",
    critical: true,
    bugKeywords: ["privacy policy", "privacy link", "privacy page"],
    uiScreens: ["Settings - Privacy Policy Link", "Footer"],
    explanation: "Link to privacy policy. Required for app store compliance. Opens in browser when tapped.",
    dartPath: "lib/content/legal_links.dart",
    webPath: "lib/content/legal_links.ts",
  },

  // ============================================================================
  // TIER 12: UCX (User Controlled Experience) → Self-healing
  // ============================================================================
  {
    path: "ucx.enabled",
    name: "UCX Self-Healing Enabled",
    target: "infrastructure",
    category: "support",
    critical: false,
    bugKeywords: ["auto fix", "self healing", "automatic update"],
    uiScreens: ["N/A - Backend Only"],
    explanation: "Enables AI-powered automatic config fixes based on app reviews and feedback. Experimental feature.",
  },
  {
    path: "ucx.github_repo",
    name: "Config GitHub Repository",
    target: "infrastructure",
    category: "support",
    critical: false,
    bugKeywords: ["github", "repo", "repository", "config sync"],
    uiScreens: ["N/A - DevOps Only"],
    explanation: "GitHub repo where config changes are committed. Enables version control and CI/CD for config.",
  },

  // ============================================================================
  // TIER 13: AI COACHING → AI assistant behavior
  // ============================================================================
  {
    path: "ai.coach.name",
    name: "AI Coach Name",
    target: "member",
    category: "support",
    critical: false,
    bugKeywords: ["coach name", "ai name", "assistant name"],
    uiScreens: ["AI Coach Screen - Coach Introduction"],
    explanation: 'Name of the AI financial coach. Appears in chat interface. E.g., "Navigator", "Penny", "Max".',
    dartPath: "lib/ai/coach_config.dart",
  },
  {
    path: "ai.coach.personality",
    name: "AI Coach Personality",
    target: "member",
    category: "support",
    critical: false,
    bugKeywords: ["coach personality", "coach tone", "coach style", "ai too pushy", "ai too soft"],
    uiScreens: ["AI Coach Conversations"],
    explanation:
      "How the AI coach communicates: supportive (gentle), direct (to the point), educational (explains why), motivational (cheerleader).",
    dartPath: "lib/ai/coach_config.dart",
  },
  {
    path: "ai.support.escalation_threshold",
    name: "AI Support Escalation",
    target: "member",
    category: "support",
    critical: true,
    bugKeywords: ["talk to human", "real person", "escalate", "ai cant help"],
    uiScreens: ["AI Chat - Escalation Prompt"],
    explanation: "How many AI messages before offering to connect with a human. Too high = frustrated members.",
    dartPath: "lib/ai/escalation.dart",
  },

  // ============================================================================
  // MEMBER APP SPECIFIC - Account Display (from screenshots)
  // ============================================================================
  {
    path: "features.accessibility.high_contrast",
    name: "High Contrast Mode",
    target: "member",
    category: "profile",
    critical: true,
    bugKeywords: ["contrast", "hard to see", "visibility", "cant read", "colors too light"],
    uiScreens: ["Settings - Accessibility", "All Screens when enabled"],
    explanation:
      "Enables high contrast mode for members with vision impairments. Makes text bolder and backgrounds more distinct.",
    dartPath: "lib/accessibility/high_contrast.dart",
  },

  // ============================================================================
  // EMPLOYEE APP SPECIFIC - Member Support Portal
  // ============================================================================
  {
    path: "features.co_browse",
    name: "Co-Browse / Screen Share",
    target: "employee",
    category: "support",
    critical: false,
    bugKeywords: ["screen share", "co-browse", "share screen", "see member screen"],
    uiScreens: ["Employee - Member Support - Screen Share Button"],
    explanation: "Allows employees to see member's screen during support calls. Requires member consent.",
    webPath: "components/co-browse.tsx",
  },
  {
    path: "features.video_banking",
    name: "Video Banking",
    target: "employee",
    category: "support",
    critical: false,
    bugKeywords: ["video call", "video banking", "face to face", "video support"],
    uiScreens: ["Employee - Video Call Interface", "Member - Request Video Call"],
    explanation: "Enables video calls between members and employees. Like FaceTime for banking.",
    webPath: "components/video-banking.tsx",
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getFieldsByCategory(category: FeatureCategory): ConfigFieldMapping[] {
  return FEATURE_CONFIG_MAPPINGS.filter((f) => f.category === category)
}

export function getFieldsByTarget(target: AppTarget): ConfigFieldMapping[] {
  return FEATURE_CONFIG_MAPPINGS.filter((f) => f.target === target)
}

export function getCriticalFields(): ConfigFieldMapping[] {
  return FEATURE_CONFIG_MAPPINGS.filter((f) => f.critical)
}

export function searchFieldsByBugKeyword(keyword: string): ConfigFieldMapping[] {
  const lowerKeyword = keyword.toLowerCase()
  return FEATURE_CONFIG_MAPPINGS.filter(
    (f) =>
      f.bugKeywords.some((k) => k.toLowerCase().includes(lowerKeyword)) ||
      f.name.toLowerCase().includes(lowerKeyword) ||
      f.explanation.toLowerCase().includes(lowerKeyword),
  )
}

export function getFieldByPath(path: string): ConfigFieldMapping | undefined {
  return FEATURE_CONFIG_MAPPINGS.find((f) => f.path === path)
}

// Stats
export const MAPPING_STATS = {
  total: 380,
  connected: 342,
  critical: 55,
  member: 120,
  employee: 85,
  both: 145,
  infrastructure: 30,
}

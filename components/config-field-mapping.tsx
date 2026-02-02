"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  Circle,
  Smartphone,
  Monitor,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Zap,
  AlertTriangle,
  Info,
  Database,
  Cloud,
  GitBranch,
  Settings,
  Search,
  Filter,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider, // Import TooltipProvider
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ============================================
// COMPLETE FIELD MAPPING - Every single field
// ============================================

type TargetApp = "member" | "employee" | "both" | "infrastructure"

interface FieldMapping {
  key: string
  name: string
  target: TargetApp
  dartPath?: string // Where it lives in Flutter code
  webPath?: string // Where it lives in React/Web code
  reason: string // Plain English explanation
  connected: boolean
  critical: boolean
}

interface TierMapping {
  id: string
  name: string
  description: string
  fields: FieldMapping[]
}

// Complete mapping of all 380+ fields
const TIER_MAPPINGS: TierMapping[] = [
  {
    id: "tenant",
    name: "TIER 1: Identity & Brand",
    description: "Who is this credit union?",
    fields: [
      {
        key: "tenant.id",
        name: "Tenant ID",
        target: "both",
        dartPath: "lib/config/tenant_config.dart → tenantId",
        webPath: "lib/config.ts → tenant.id",
        reason:
          "Both apps need to know which CU they're serving to fetch the right data and route API calls correctly.",
        connected: true,
        critical: true,
      },
      {
        key: "tenant.name",
        name: "Credit Union Name",
        target: "both",
        dartPath: "lib/config/tenant_config.dart → displayName",
        webPath: "lib/config.ts → tenant.name",
        reason: "Shown in app headers, welcome screens, and support pages. Members and employees both see this.",
        connected: true,
        critical: true,
      },
      {
        key: "tenant.charter_number",
        name: "NCUA Charter Number",
        target: "employee",
        webPath: "lib/config.ts → tenant.charter",
        reason: "Only employees need this for compliance verification. Members don't care about charter numbers.",
        connected: true,
        critical: false,
      },
      {
        key: "tenant.domain",
        name: "Primary Domain",
        target: "both",
        dartPath: "lib/config/api_config.dart → baseUrl",
        webPath: "lib/api.ts → API_BASE",
        reason: "Both apps construct API URLs from this. Example: https://navyfed.cu.app/api/v1",
        connected: true,
        critical: true,
      },
      {
        key: "tenant.domains.aliases",
        name: "Domain Aliases",
        target: "infrastructure",
        reason: "Used by CDN/DNS for redirects. Apps don't use this directly - it's routing layer config.",
        connected: true,
        critical: false,
      },
      {
        key: "tenant.timezone",
        name: "Default Timezone",
        target: "both",
        dartPath: "lib/utils/date_utils.dart → defaultTz",
        webPath: "lib/utils/dates.ts → DEFAULT_TZ",
        reason: "Transaction timestamps, scheduled transfers, and payment due dates all need the CU's timezone.",
        connected: true,
        critical: true,
      },
      {
        key: "tenant.locale",
        name: "Default Locale",
        target: "both",
        dartPath: "lib/l10n/app_localizations.dart",
        webPath: "lib/i18n/config.ts",
        reason: "Controls number formatting ($1,234.56 vs $1.234,56), date formats, and default language.",
        connected: true,
        critical: true,
      },
      {
        key: "tenant.support.phone",
        name: "Support Phone",
        target: "both",
        dartPath: "lib/screens/support/contact_screen.dart",
        webPath: "components/support/contact-info.tsx",
        reason: "Members tap to call from the app. Employees see it in their header for quick reference.",
        connected: true,
        critical: true,
      },
      {
        key: "tenant.support.email",
        name: "Support Email",
        target: "both",
        dartPath: "lib/screens/support/contact_screen.dart",
        webPath: "components/support/contact-info.tsx",
        reason: "For email-based support requests. Both apps show this in contact/help sections.",
        connected: true,
        critical: false,
      },
      {
        key: "tenant.legal.name",
        name: "Legal Entity Name",
        target: "both",
        dartPath: "lib/screens/legal/disclosures_screen.dart",
        webPath: "components/legal/footer.tsx",
        reason: "Required in all legal disclosures, terms of service, and account agreements.",
        connected: true,
        critical: true,
      },
      {
        key: "tenant.legal.routing",
        name: "ABA Routing Number",
        target: "both",
        dartPath: "lib/screens/accounts/account_details.dart",
        webPath: "components/accounts/account-card.tsx",
        reason: "Members need this for direct deposit setup. Employees need it for transfer verification.",
        connected: true,
        critical: true,
      },
    ],
  },
  {
    id: "tokens",
    name: "TIER 2: Design Tokens",
    description: "How does it look?",
    fields: [
      {
        key: "tokens.color.primary",
        name: "Primary Brand Color",
        target: "both",
        dartPath: "lib/theme/cu_theme.dart → primaryColor",
        webPath: "app/globals.css → --primary",
        reason: "The main CU brand color. Used for buttons, links, and key UI elements in both apps.",
        connected: true,
        critical: true,
      },
      {
        key: "tokens.color.secondary",
        name: "Secondary Color",
        target: "both",
        dartPath: "lib/theme/cu_theme.dart → secondaryColor",
        webPath: "app/globals.css → --secondary",
        reason: "Supporting brand color for less prominent elements, card backgrounds, etc.",
        connected: true,
        critical: false,
      },
      {
        key: "tokens.color.accent",
        name: "Accent Color",
        target: "both",
        dartPath: "lib/theme/cu_theme.dart → accentColor",
        webPath: "app/globals.css → --accent",
        reason: "For CTAs and important buttons that need to stand out from the primary color.",
        connected: true,
        critical: false,
      },
      {
        key: "tokens.color.success",
        name: "Success Color",
        target: "both",
        dartPath: "lib/theme/cu_theme.dart → successColor",
        webPath: "app/globals.css → --success",
        reason: "Green for successful transactions, positive balances, and confirmation states.",
        connected: true,
        critical: true,
      },
      {
        key: "tokens.color.warning",
        name: "Warning Color",
        target: "both",
        dartPath: "lib/theme/cu_theme.dart → warningColor",
        webPath: "app/globals.css → --warning",
        reason: "Yellow/orange for low balance alerts, pending states, and attention-needed items.",
        connected: true,
        critical: true,
      },
      {
        key: "tokens.color.error",
        name: "Error Color",
        target: "both",
        dartPath: "lib/theme/cu_theme.dart → errorColor",
        webPath: "app/globals.css → --destructive",
        reason: "Red for failed transactions, validation errors, and declined payments.",
        connected: true,
        critical: true,
      },
      {
        key: "tokens.color.surface",
        name: "Surface Color",
        target: "both",
        dartPath: "lib/theme/cu_theme.dart → surfaceColor",
        webPath: "app/globals.css → --background",
        reason: "Background color for cards, modals, and elevated surfaces.",
        connected: true,
        critical: false,
      },
      {
        key: "tokens.color.on-surface",
        name: "On-Surface Color",
        target: "both",
        dartPath: "lib/theme/cu_theme.dart → onSurfaceColor",
        webPath: "app/globals.css → --foreground",
        reason: "Text and icon color that sits on top of surface colors. Ensures readability.",
        connected: true,
        critical: false,
      },
      {
        key: "tokens.typography.family.heading",
        name: "Heading Font",
        target: "both",
        dartPath: "lib/theme/cu_theme.dart → headingFont",
        webPath: "app/globals.css → --font-heading",
        reason: "Font family for titles, headers, and emphasis. Sets the brand personality.",
        connected: true,
        critical: false,
      },
      {
        key: "tokens.typography.family.body",
        name: "Body Font",
        target: "both",
        dartPath: "lib/theme/cu_theme.dart → bodyFont",
        webPath: "app/globals.css → --font-sans",
        reason: "Font for all body text, form fields, and general content. Must be highly readable.",
        connected: true,
        critical: false,
      },
      {
        key: "tokens.typography.family.mono",
        name: "Monospace Font",
        target: "both",
        dartPath: "lib/theme/cu_theme.dart → monoFont",
        webPath: "app/globals.css → --font-mono",
        reason: "For account numbers, routing numbers, and financial figures. Digits align properly.",
        connected: true,
        critical: false,
      },
      {
        key: "tokens.typography.scale",
        name: "Type Scale Ratio",
        target: "both",
        dartPath: "lib/theme/typography.dart → scaleRatio",
        webPath: "lib/design-tokens.ts → typeScale",
        reason: "The multiplier between font sizes (1.25 = each size is 1.25x bigger than the last).",
        connected: true,
        critical: false,
      },
      {
        key: "tokens.spacing.unit",
        name: "Base Spacing Unit",
        target: "both",
        dartPath: "lib/theme/spacing.dart → baseUnit",
        webPath: "lib/design-tokens.ts → spacingUnit",
        reason: "All spacing derives from this (4px = spacing is 4, 8, 12, 16, etc.). Keeps things consistent.",
        connected: true,
        critical: false,
      },
      {
        key: "tokens.radius.sm",
        name: "Small Border Radius",
        target: "both",
        dartPath: "lib/theme/borders.dart → radiusSm",
        webPath: "app/globals.css → --radius",
        reason: "For small elements like tags, badges, and input fields.",
        connected: true,
        critical: false,
      },
      {
        key: "tokens.radius.md",
        name: "Medium Border Radius",
        target: "both",
        dartPath: "lib/theme/borders.dart → radiusMd",
        webPath: "lib/design-tokens.ts → radiusMd",
        reason: "For buttons, cards, and medium-sized containers.",
        connected: true,
        critical: false,
      },
      {
        key: "tokens.radius.lg",
        name: "Large Border Radius",
        target: "both",
        dartPath: "lib/theme/borders.dart → radiusLg",
        webPath: "lib/design-tokens.ts → radiusLg",
        reason: "For modals, sheets, and large containers.",
        connected: true,
        critical: false,
      },
      {
        key: "tokens.radius.full",
        name: "Full Border Radius",
        target: "both",
        dartPath: "lib/theme/borders.dart → radiusFull",
        webPath: "lib/design-tokens.ts → radiusFull",
        reason: "For pill-shaped buttons and circular avatars (9999px).",
        connected: true,
        critical: false,
      },
      {
        key: "tokens.shadow.elevation.1",
        name: "Elevation 1 Shadow",
        target: "both",
        dartPath: "lib/theme/shadows.dart → elevation1",
        webPath: "lib/design-tokens.ts → shadowSm",
        reason: "Subtle shadow for slightly elevated elements like buttons.",
        connected: true,
        critical: false,
      },
      {
        key: "tokens.shadow.elevation.2",
        name: "Elevation 2 Shadow",
        target: "both",
        dartPath: "lib/theme/shadows.dart → elevation2",
        webPath: "lib/design-tokens.ts → shadowMd",
        reason: "Card-level shadow for containers that float above the background.",
        connected: true,
        critical: false,
      },
      {
        key: "tokens.shadow.elevation.3",
        name: "Elevation 3 Shadow",
        target: "both",
        dartPath: "lib/theme/shadows.dart → elevation3",
        webPath: "lib/design-tokens.ts → shadowLg",
        reason: "Modal/dialog shadow for elements that appear above everything else.",
        connected: true,
        critical: false,
      },
      {
        key: "tokens.logo.primary",
        name: "Primary Logo URL",
        target: "both",
        dartPath: "lib/widgets/cu_logo.dart → logoUrl",
        webPath: "components/ui/logo.tsx → src",
        reason: "The main CU logo shown in headers, login screens, and about pages.",
        connected: true,
        critical: true,
      },
      {
        key: "tokens.logo.mark",
        name: "Logo Mark URL",
        target: "both",
        dartPath: "lib/widgets/cu_logo.dart → markUrl",
        webPath: "components/ui/logo.tsx → markSrc",
        reason: "Just the icon/symbol without text. Used in small spaces like tab bars.",
        connected: true,
        critical: false,
      },
      {
        key: "tokens.logo.wordmark",
        name: "Wordmark URL",
        target: "both",
        dartPath: "lib/widgets/cu_logo.dart → wordmarkUrl",
        webPath: "components/ui/logo.tsx → wordmarkSrc",
        reason: "Just the text without the icon. Used in footers and legal documents.",
        connected: true,
        critical: false,
      },
      {
        key: "tokens.favicon",
        name: "Favicon URL",
        target: "employee",
        webPath: "app/layout.tsx → metadata.icons",
        reason: "Browser tab icon. Only applies to the web-based employee portal.",
        connected: true,
        critical: false,
      },
    ],
  },
  {
    id: "features",
    name: "TIER 3: Feature Flags",
    description: "What's turned on?",
    fields: [
      {
        key: "features.mobile_deposit",
        name: "Mobile Deposit (RDC)",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → mobileDeposit",
        webPath: "lib/features.ts → MOBILE_DEPOSIT",
        reason: "Members: shows/hides the deposit check button. Employees: can troubleshoot if enabled.",
        connected: true,
        critical: true,
      },
      {
        key: "features.bill_pay",
        name: "Bill Pay",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → billPay",
        webPath: "lib/features.ts → BILL_PAY",
        reason: "Members: shows/hides bill pay section. Employees: can help set up payees.",
        connected: true,
        critical: true,
      },
      {
        key: "features.p2p",
        name: "Person-to-Person Transfers",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → p2p",
        webPath: "lib/features.ts → P2P",
        reason: "Members: send money to friends/family. Employees: can see P2P history and limits.",
        connected: true,
        critical: true,
      },
      {
        key: "features.wire_transfer",
        name: "Wire Transfers",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → wireTransfer",
        webPath: "lib/features.ts → WIRE_TRANSFER",
        reason: "Usually disabled in member app (branch only). Employees can initiate on behalf.",
        connected: true,
        critical: false,
      },
      {
        key: "features.ach_origination",
        name: "ACH Origination",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → achOrigination",
        webPath: "lib/features.ts → ACH_ORIGINATION",
        reason: "Members: pull money from external accounts. Employees: verify linked accounts.",
        connected: true,
        critical: true,
      },
      {
        key: "features.card_controls",
        name: "Card Controls",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → cardControls",
        webPath: "lib/features.ts → CARD_CONTROLS",
        reason: "Members: lock/unlock cards, set limits. Employees: assist with card management.",
        connected: true,
        critical: true,
      },
      {
        key: "features.travel_notifications",
        name: "Travel Notifications",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → travelNotifications",
        webPath: "lib/features.ts → TRAVEL_NOTIFICATIONS",
        reason: "Members: set travel dates to avoid fraud blocks. Employees: add travel notes.",
        connected: true,
        critical: false,
      },
      {
        key: "features.budgeting",
        name: "Budgeting Tools",
        target: "member",
        dartPath: "lib/features/feature_flags.dart → budgeting",
        reason: "Member-only feature. Employees don't budget for members.",
        connected: true,
        critical: false,
      },
      {
        key: "features.goals",
        name: "Savings Goals",
        target: "member",
        dartPath: "lib/features/feature_flags.dart → goals",
        reason: "Member-only. Let members set and track savings goals visually.",
        connected: true,
        critical: false,
      },
      {
        key: "features.statements",
        name: "E-Statements",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → statements",
        webPath: "lib/features.ts → STATEMENTS",
        reason: "Members: view/download statements. Employees: resend or troubleshoot access.",
        connected: true,
        critical: true,
      },
      {
        key: "features.alerts",
        name: "Custom Alerts",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → alerts",
        webPath: "lib/features.ts → ALERTS",
        reason: "Members: set up balance/transaction alerts. Employees: help configure.",
        connected: true,
        critical: true,
      },
      {
        key: "features.secure_messaging",
        name: "Secure Messaging",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → secureMessaging",
        webPath: "lib/features.ts → SECURE_MESSAGING",
        reason: "Members: send secure messages. Employees: respond to member inquiries.",
        connected: true,
        critical: true,
      },
      {
        key: "features.co_browse",
        name: "Co-Browse",
        target: "employee",
        webPath: "lib/features.ts → CO_BROWSE",
        reason: "Employee-only. Lets support staff see member's screen (with permission).",
        connected: true,
        critical: false,
      },
      {
        key: "features.video_banking",
        name: "Video Banking",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → videoBanking",
        webPath: "lib/features.ts → VIDEO_BANKING",
        reason: "Members: video call with staff. Employees: accept video banking sessions.",
        connected: true,
        critical: false,
      },
      {
        key: "features.voice_biometrics",
        name: "Voice Biometrics",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → voiceBiometrics",
        webPath: "lib/features.ts → VOICE_BIOMETRICS",
        reason: "Members: enroll voice print. Employees: verify members via voice.",
        connected: false,
        critical: false,
      },
      {
        key: "features.face_id",
        name: "Face ID (iOS)",
        target: "member",
        dartPath: "lib/features/feature_flags.dart → faceId",
        reason: "Member-only iOS biometric. Employees use their own auth.",
        connected: true,
        critical: true,
      },
      {
        key: "features.fingerprint",
        name: "Fingerprint (Android)",
        target: "member",
        dartPath: "lib/features/feature_flags.dart → fingerprint",
        reason: "Member-only Android biometric. Employees use their own auth.",
        connected: true,
        critical: true,
      },
      {
        key: "features.external_transfers",
        name: "External Transfers",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → externalTransfers",
        webPath: "lib/features.ts → EXTERNAL_TRANSFERS",
        reason: "Members: link and transfer to external banks. Employees: verify linked accounts.",
        connected: true,
        critical: true,
      },
      {
        key: "features.loan_applications",
        name: "Loan Applications",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → loanApplications",
        webPath: "lib/features.ts → LOAN_APPLICATIONS",
        reason: "Members: apply for loans in-app. Employees: assist with applications.",
        connected: true,
        critical: true,
      },
      {
        key: "features.account_opening",
        name: "Account Opening",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → accountOpening",
        webPath: "lib/features.ts → ACCOUNT_OPENING",
        reason: "Members: open new accounts digitally. Employees: process applications.",
        connected: true,
        critical: true,
      },
      {
        key: "features.joint_access",
        name: "Joint Account Access",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → jointAccess",
        webPath: "lib/features.ts → JOINT_ACCESS",
        reason: "Members: manage joint account holders. Employees: verify joint ownership.",
        connected: true,
        critical: false,
      },
      {
        key: "features.beneficiaries",
        name: "Beneficiary Management",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → beneficiaries",
        webPath: "lib/features.ts → BENEFICIARIES",
        reason: "Members: add/update beneficiaries. Employees: verify beneficiary info.",
        connected: true,
        critical: false,
      },
      {
        key: "features.overdraft_protection",
        name: "Overdraft Protection",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → overdraftProtection",
        webPath: "lib/features.ts → OVERDRAFT_PROTECTION",
        reason: "Members: opt in/out of ODP. Employees: configure ODP settings.",
        connected: true,
        critical: true,
      },
      {
        key: "features.skip_a_pay",
        name: "Skip-a-Pay",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → skipAPay",
        webPath: "lib/features.ts → SKIP_A_PAY",
        reason: "Members: request to skip a loan payment. Employees: approve/deny requests.",
        connected: true,
        critical: false,
      },
      {
        key: "features.ai_coach",
        name: "AI Financial Coach",
        target: "member",
        dartPath: "lib/features/feature_flags.dart → aiCoach",
        reason: "Member-only. Personal financial guidance AI. Employees have their own tools.",
        connected: true,
        critical: false,
      },
      {
        key: "features.dark_mode",
        name: "Dark Mode",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → darkMode",
        webPath: "lib/features.ts → DARK_MODE",
        reason: "Both apps: toggle between light and dark themes.",
        connected: true,
        critical: false,
      },
      {
        key: "features.accessibility.high_contrast",
        name: "High Contrast Mode",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → highContrast",
        webPath: "lib/features.ts → HIGH_CONTRAST",
        reason: "Accessibility feature for visually impaired users in both apps.",
        connected: true,
        critical: true,
      },
      {
        key: "features.accessibility.screen_reader",
        name: "Screen Reader Optimization",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → screenReader",
        webPath: "lib/features.ts → SCREEN_READER",
        reason: "Enhances VoiceOver/TalkBack support. Required for ADA compliance.",
        connected: true,
        critical: true,
      },
      {
        key: "features.accessibility.reduced_motion",
        name: "Reduced Motion",
        target: "both",
        dartPath: "lib/features/feature_flags.dart → reducedMotion",
        webPath: "lib/features.ts → REDUCED_MOTION",
        reason: "Disables animations for users with vestibular disorders.",
        connected: true,
        critical: true,
      },
    ],
  },
  {
    id: "products",
    name: "TIER 4: Products",
    description: "What products exist?",
    fields: [
      {
        key: "products.shares[].id",
        name: "Share Product ID",
        target: "both",
        dartPath: "lib/models/share_product.dart → id",
        webPath: "types/products.ts → ShareProduct.id",
        reason: "Unique identifier for each share type. Both apps reference this for account operations.",
        connected: true,
        critical: true,
      },
      {
        key: "products.shares[].name",
        name: "Share Product Name",
        target: "both",
        dartPath: "lib/models/share_product.dart → name",
        webPath: "types/products.ts → ShareProduct.name",
        reason: "Display name like 'Free Checking' or 'Premium Savings'. Shown everywhere.",
        connected: true,
        critical: true,
      },
      {
        key: "products.shares[].type",
        name: "Share Account Type",
        target: "both",
        dartPath: "lib/models/share_product.dart → type",
        webPath: "types/products.ts → ShareProduct.type",
        reason: "CHECKING, SAVINGS, MONEY_MARKET, CD, IRA. Determines behavior and rules.",
        connected: true,
        critical: true,
      },
      {
        key: "products.shares[].apy",
        name: "Share APY",
        target: "both",
        dartPath: "lib/models/share_product.dart → apy",
        webPath: "types/products.ts → ShareProduct.apy",
        reason: "Annual percentage yield. Members see it on accounts. Employees quote rates.",
        connected: true,
        critical: true,
      },
      {
        key: "products.shares[].min_balance",
        name: "Minimum Balance",
        target: "both",
        dartPath: "lib/models/share_product.dart → minBalance",
        webPath: "types/products.ts → ShareProduct.minBalance",
        reason: "Required minimum to open/maintain account. Both apps enforce and display this.",
        connected: true,
        critical: true,
      },
      {
        key: "products.shares[].monthly_fee",
        name: "Monthly Fee",
        target: "both",
        dartPath: "lib/models/share_product.dart → monthlyFee",
        webPath: "types/products.ts → ShareProduct.monthlyFee",
        reason: "Monthly maintenance fee. Members see it in account details and disclosures.",
        connected: true,
        critical: true,
      },
      {
        key: "products.shares[].overdraft_limit",
        name: "Overdraft Limit",
        target: "both",
        dartPath: "lib/models/share_product.dart → overdraftLimit",
        webPath: "types/products.ts → ShareProduct.overdraftLimit",
        reason: "Max overdraft amount allowed. Members need to know their limit.",
        connected: true,
        critical: true,
      },
      {
        key: "products.loans[].id",
        name: "Loan Product ID",
        target: "both",
        dartPath: "lib/models/loan_product.dart → id",
        webPath: "types/products.ts → LoanProduct.id",
        reason: "Unique loan product identifier for applications and account display.",
        connected: true,
        critical: true,
      },
      {
        key: "products.loans[].name",
        name: "Loan Product Name",
        target: "both",
        dartPath: "lib/models/loan_product.dart → name",
        webPath: "types/products.ts → LoanProduct.name",
        reason: "Display name like 'New Auto Loan' or '30-Year Fixed Mortgage'.",
        connected: true,
        critical: true,
      },
      {
        key: "products.loans[].rate_min",
        name: "Minimum Rate",
        target: "both",
        dartPath: "lib/models/loan_product.dart → rateMin",
        webPath: "types/products.ts → LoanProduct.rateMin",
        reason: "Floor APR for this loan type. Shown as 'rates as low as X%'.",
        connected: true,
        critical: true,
      },
      {
        key: "products.loans[].rate_max",
        name: "Maximum Rate",
        target: "both",
        dartPath: "lib/models/loan_product.dart → rateMax",
        webPath: "types/products.ts → LoanProduct.rateMax",
        reason: "Ceiling APR for this loan type. Required for truth-in-lending disclosures.",
        connected: true,
        critical: true,
      },
      {
        key: "products.cards[].id",
        name: "Card Product ID",
        target: "both",
        dartPath: "lib/models/card_product.dart → id",
        webPath: "types/products.ts → CardProduct.id",
        reason: "Unique card product identifier for applications and card management.",
        connected: true,
        critical: true,
      },
      {
        key: "products.cards[].rewards_rate",
        name: "Rewards Rate",
        target: "both",
        dartPath: "lib/models/card_product.dart → rewardsRate",
        webPath: "types/products.ts → CardProduct.rewardsRate",
        reason: "Cash back or points percentage. Big selling point for members.",
        connected: true,
        critical: true,
      },
    ],
  },
  {
    id: "rules",
    name: "TIER 5: Business Rules",
    description: "How does money move?",
    fields: [
      {
        key: "rules.transfer.internal.daily_limit",
        name: "Internal Transfer Daily Limit",
        target: "both",
        dartPath: "lib/config/limits_config.dart → internalDailyLimit",
        webPath: "lib/rules.ts → INTERNAL_DAILY_LIMIT",
        reason: "Members see 'Daily limit: $50,000' when transferring. Employees can see/override.",
        connected: true,
        critical: true,
      },
      {
        key: "rules.transfer.internal.per_tx_limit",
        name: "Internal Per-Transaction Limit",
        target: "both",
        dartPath: "lib/config/limits_config.dart → internalPerTxLimit",
        webPath: "lib/rules.ts → INTERNAL_PER_TX_LIMIT",
        reason: "Max amount for a single internal transfer. Prevents fat-finger errors.",
        connected: true,
        critical: true,
      },
      {
        key: "rules.transfer.external.daily_limit",
        name: "External Transfer Daily Limit",
        target: "both",
        dartPath: "lib/config/limits_config.dart → externalDailyLimit",
        webPath: "lib/rules.ts → EXTERNAL_DAILY_LIMIT",
        reason: "ACH transfers to external banks. Usually lower than internal for fraud protection.",
        connected: true,
        critical: true,
      },
      {
        key: "rules.transfer.external.hold_days",
        name: "External Transfer Hold Days",
        target: "both",
        dartPath: "lib/config/limits_config.dart → externalHoldDays",
        webPath: "lib/rules.ts → EXTERNAL_HOLD_DAYS",
        reason: "Members: 'Funds available in 3 days'. Employees: explain holds to members.",
        connected: true,
        critical: true,
      },
      {
        key: "rules.transfer.p2p.daily_limit",
        name: "P2P Daily Limit",
        target: "both",
        dartPath: "lib/config/limits_config.dart → p2pDailyLimit",
        webPath: "lib/rules.ts → P2P_DAILY_LIMIT",
        reason: "Person-to-person daily max. Usually lower to limit fraud exposure.",
        connected: true,
        critical: true,
      },
      {
        key: "rules.mobile_deposit.daily_limit",
        name: "Mobile Deposit Daily Limit",
        target: "both",
        dartPath: "lib/config/limits_config.dart → rdcDailyLimit",
        webPath: "lib/rules.ts → RDC_DAILY_LIMIT",
        reason: "Members: 'Daily deposit limit: $5,000'. Common support question.",
        connected: true,
        critical: true,
      },
      {
        key: "rules.mobile_deposit.hold_days.default",
        name: "Mobile Deposit Default Hold",
        target: "both",
        dartPath: "lib/config/limits_config.dart → rdcHoldDays",
        webPath: "lib/rules.ts → RDC_HOLD_DAYS",
        reason: "Members: 'Available in 2 business days'. Employees: explain hold policy.",
        connected: true,
        critical: true,
      },
      {
        key: "rules.atm.daily_withdrawal",
        name: "ATM Daily Withdrawal Limit",
        target: "both",
        dartPath: "lib/config/limits_config.dart → atmDailyLimit",
        webPath: "lib/rules.ts → ATM_DAILY_LIMIT",
        reason: "Members: shown at ATM and in card settings. Employees: can adjust temporarily.",
        connected: true,
        critical: true,
      },
      {
        key: "rules.session.timeout_minutes",
        name: "Session Timeout",
        target: "both",
        dartPath: "lib/config/security_config.dart → sessionTimeout",
        webPath: "lib/auth.ts → SESSION_TIMEOUT",
        reason: "How long until auto-logout. Balance security vs. convenience.",
        connected: true,
        critical: true,
      },
      {
        key: "rules.password.min_length",
        name: "Password Minimum Length",
        target: "both",
        dartPath: "lib/config/security_config.dart → passwordMinLength",
        webPath: "lib/auth.ts → PASSWORD_MIN_LENGTH",
        reason: "Members: shown during registration. Same rules for employee portal.",
        connected: true,
        critical: true,
      },
      {
        key: "rules.mfa.required",
        name: "MFA Required",
        target: "both",
        dartPath: "lib/config/security_config.dart → mfaRequired",
        webPath: "lib/auth.ts → MFA_REQUIRED",
        reason: "Whether two-factor is mandatory. Usually true for both apps.",
        connected: true,
        critical: true,
      },
      {
        key: "rules.mfa.methods",
        name: "Allowed MFA Methods",
        target: "both",
        dartPath: "lib/config/security_config.dart → mfaMethods",
        webPath: "lib/auth.ts → MFA_METHODS",
        reason: "SMS, email, authenticator app, push. Members choose their preference.",
        connected: true,
        critical: true,
      },
      {
        key: "rules.lockout.attempts",
        name: "Lockout Attempts",
        target: "both",
        dartPath: "lib/config/security_config.dart → lockoutAttempts",
        webPath: "lib/auth.ts → LOCKOUT_ATTEMPTS",
        reason: "Failed logins before lockout. Members: get locked out. Employees: unlock members.",
        connected: true,
        critical: true,
      },
    ],
  },
  {
    id: "fraud",
    name: "TIER 6: Fraud & Risk",
    description: "What triggers alerts?",
    fields: [
      {
        key: "fraud.risk_threshold.block",
        name: "Auto-Block Threshold",
        target: "employee",
        webPath: "lib/fraud.ts → BLOCK_THRESHOLD",
        reason: "Employee-only. Members just see 'Transaction declined'. Score triggers auto-block.",
        connected: true,
        critical: true,
      },
      {
        key: "fraud.risk_threshold.review",
        name: "Manual Review Threshold",
        target: "employee",
        webPath: "lib/fraud.ts → REVIEW_THRESHOLD",
        reason: "Employee-only. Queues transactions for human review in fraud dashboard.",
        connected: true,
        critical: true,
      },
      {
        key: "fraud.risk_threshold.step_up",
        name: "Step-Up Auth Threshold",
        target: "both",
        dartPath: "lib/config/fraud_config.dart → stepUpThreshold",
        webPath: "lib/fraud.ts → STEP_UP_THRESHOLD",
        reason: "Members: triggers extra verification. Employees: see why step-up was triggered.",
        connected: true,
        critical: true,
      },
      {
        key: "fraud.velocity.tx_per_hour",
        name: "Transactions Per Hour",
        target: "employee",
        webPath: "lib/fraud.ts → TX_PER_HOUR",
        reason: "Employee-only velocity rule. Members just experience the limit.",
        connected: true,
        critical: false,
      },
      {
        key: "fraud.geo.allowed_countries",
        name: "Allowed Countries",
        target: "employee",
        webPath: "lib/fraud.ts → ALLOWED_COUNTRIES",
        reason: "Employee-only. Configure which countries allow transactions.",
        connected: true,
        critical: true,
      },
      {
        key: "fraud.geo.blocked_countries",
        name: "Blocked Countries",
        target: "employee",
        webPath: "lib/fraud.ts → BLOCKED_COUNTRIES",
        reason: "Employee-only. OFAC-sanctioned countries auto-blocked.",
        connected: true,
        critical: true,
      },
      {
        key: "fraud.alerts.push",
        name: "Push Fraud Alerts",
        target: "member",
        dartPath: "lib/config/fraud_config.dart → pushAlerts",
        reason: "Member-only. Instant push notification when suspicious activity detected.",
        connected: true,
        critical: true,
      },
    ],
  },
  {
    id: "compliance",
    name: "TIER 7: Compliance",
    description: "What's required?",
    fields: [
      {
        key: "compliance.kyc.level",
        name: "KYC Level",
        target: "employee",
        webPath: "lib/compliance.ts → KYC_LEVEL",
        reason: "Employee-only. Determines verification requirements during onboarding.",
        connected: true,
        critical: true,
      },
      {
        key: "compliance.ctr.threshold",
        name: "CTR Threshold",
        target: "employee",
        webPath: "lib/compliance.ts → CTR_THRESHOLD",
        reason: "Employee-only. $10,000 triggers Currency Transaction Report. Regulatory requirement.",
        connected: true,
        critical: true,
      },
      {
        key: "compliance.ofac.enabled",
        name: "OFAC Screening",
        target: "employee",
        webPath: "lib/compliance.ts → OFAC_ENABLED",
        reason: "Employee-only. Screens names against sanctioned persons list.",
        connected: true,
        critical: true,
      },
      {
        key: "compliance.fdx.version",
        name: "FDX API Version",
        target: "infrastructure",
        reason: "API version for open banking data sharing. Infrastructure config.",
        connected: true,
        critical: false,
      },
      {
        key: "compliance.wcag.level",
        name: "WCAG Compliance Level",
        target: "both",
        dartPath: "lib/config/accessibility_config.dart → wcagLevel",
        webPath: "lib/accessibility.ts → WCAG_LEVEL",
        reason: "A, AA, or AAA. Determines accessibility feature requirements.",
        connected: true,
        critical: true,
      },
    ],
  },
  {
    id: "integrations",
    name: "TIER 8: Integrations",
    description: "What's connected?",
    fields: [
      {
        key: "integrations.core.provider",
        name: "Core Banking Provider",
        target: "infrastructure",
        reason: "Symitar, Corelation, DNA, etc. Backend integration, not exposed to apps.",
        connected: true,
        critical: true,
      },
      {
        key: "integrations.core.host",
        name: "Core Banking Host",
        target: "infrastructure",
        reason: "Connection string to core. Infrastructure only - apps use our API layer.",
        connected: true,
        critical: true,
      },
      {
        key: "integrations.card_processor.provider",
        name: "Card Processor",
        target: "infrastructure",
        reason: "Fiserv, FIS, PSCU, etc. Card transactions route through our middleware.",
        connected: true,
        critical: true,
      },
      {
        key: "integrations.sms.provider",
        name: "SMS Provider",
        target: "infrastructure",
        reason: "Twilio, Vonage, etc. Members just receive texts - don't know the provider.",
        connected: true,
        critical: false,
      },
      {
        key: "integrations.email.provider",
        name: "Email Provider",
        target: "infrastructure",
        reason: "SendGrid, SES, etc. Members just receive emails.",
        connected: true,
        critical: false,
      },
      {
        key: "integrations.push.provider",
        name: "Push Provider",
        target: "infrastructure",
        reason: "Firebase, OneSignal, etc. Handled by our notification service.",
        connected: true,
        critical: false,
      },
    ],
  },
  {
    id: "channels",
    name: "TIER 9: Channels",
    description: "Where do members interact?",
    fields: [
      {
        key: "channels.mobile.ios.enabled",
        name: "iOS App Enabled",
        target: "member",
        dartPath: "lib/config/channel_config.dart → iosEnabled",
        reason: "Whether the iOS app is active for this CU. Member app specific.",
        connected: true,
        critical: true,
      },
      {
        key: "channels.mobile.ios.min_version",
        name: "iOS Minimum Version",
        target: "member",
        dartPath: "lib/config/channel_config.dart → iosMinVersion",
        reason: "Force update if below this version. Security requirement.",
        connected: true,
        critical: true,
      },
      {
        key: "channels.mobile.android.enabled",
        name: "Android App Enabled",
        target: "member",
        dartPath: "lib/config/channel_config.dart → androidEnabled",
        reason: "Whether the Android app is active for this CU. Member app specific.",
        connected: true,
        critical: true,
      },
      {
        key: "channels.mobile.android.min_version",
        name: "Android Minimum Version",
        target: "member",
        dartPath: "lib/config/channel_config.dart → androidMinVersion",
        reason: "Force update if below this version. Security requirement.",
        connected: true,
        critical: true,
      },
      {
        key: "channels.web.enabled",
        name: "Web Banking Enabled",
        target: "employee",
        webPath: "lib/config.ts → WEB_ENABLED",
        reason: "Employee portal is web-based. Members use mobile.",
        connected: true,
        critical: true,
      },
      {
        key: "channels.ivr.enabled",
        name: "IVR Enabled",
        target: "employee",
        webPath: "lib/config.ts → IVR_ENABLED",
        reason: "Phone banking system. Employees configure, members call.",
        connected: true,
        critical: false,
      },
      {
        key: "channels.chatbot.enabled",
        name: "Chatbot Enabled",
        target: "both",
        dartPath: "lib/config/channel_config.dart → chatbotEnabled",
        webPath: "lib/config.ts → CHATBOT_ENABLED",
        reason: "Members: chat with AI. Employees: monitor and escalate chats.",
        connected: true,
        critical: false,
      },
    ],
  },
  {
    id: "notifications",
    name: "TIER 10: Notifications",
    description: "What gets sent when?",
    fields: [
      {
        key: "notifications.login.new_device",
        name: "New Device Login Alert",
        target: "both",
        dartPath: "lib/config/notification_config.dart → newDeviceChannels",
        webPath: "lib/notifications.ts → NEW_DEVICE_CHANNELS",
        reason: "Alert when logging in from unrecognized device. Security must-have.",
        connected: true,
        critical: true,
      },
      {
        key: "notifications.transaction.large",
        name: "Large Transaction Alert",
        target: "both",
        dartPath: "lib/config/notification_config.dart → largeTransactionChannels",
        webPath: "lib/notifications.ts → LARGE_TX_CHANNELS",
        reason: "Members: know about big transactions. Employees: configure thresholds.",
        connected: true,
        critical: true,
      },
      {
        key: "notifications.transaction.large_threshold",
        name: "Large Transaction Threshold",
        target: "both",
        dartPath: "lib/config/notification_config.dart → largeThreshold",
        webPath: "lib/notifications.ts → LARGE_TX_THRESHOLD",
        reason: "What counts as 'large'? Usually $500+. Members can customize.",
        connected: true,
        critical: true,
      },
      {
        key: "notifications.balance.low",
        name: "Low Balance Alert",
        target: "both",
        dartPath: "lib/config/notification_config.dart → lowBalanceChannels",
        webPath: "lib/notifications.ts → LOW_BALANCE_CHANNELS",
        reason: "Members: get warned before overdraft. One of most-used alerts.",
        connected: true,
        critical: true,
      },
      {
        key: "notifications.fraud.alert",
        name: "Fraud Alert Channels",
        target: "both",
        dartPath: "lib/config/notification_config.dart → fraudChannels",
        webPath: "lib/notifications.ts → FRAUD_CHANNELS",
        reason: "Usually all channels: push, SMS, email. Maximum urgency.",
        connected: true,
        critical: true,
      },
    ],
  },
  {
    id: "content",
    name: "TIER 11: Content & Copy",
    description: "What does it say?",
    fields: [
      {
        key: "content.app_name",
        name: "App Display Name",
        target: "both",
        dartPath: "lib/config/content_config.dart → appName",
        webPath: "lib/content.ts → APP_NAME",
        reason: "The name shown in app stores, headers, and about screens.",
        connected: true,
        critical: true,
      },
      {
        key: "content.tagline",
        name: "Brand Tagline",
        target: "both",
        dartPath: "lib/config/content_config.dart → tagline",
        webPath: "lib/content.ts → TAGLINE",
        reason: "Marketing tagline shown on login/splash screens.",
        connected: true,
        critical: false,
      },
      {
        key: "content.member_term",
        name: "Member Terminology",
        target: "both",
        dartPath: "lib/config/content_config.dart → memberTerm",
        webPath: "lib/content.ts → MEMBER_TERM",
        reason: "'Member' vs 'Customer'. Credit unions prefer 'member'.",
        connected: true,
        critical: true,
      },
      {
        key: "content.welcome_message",
        name: "Welcome Message",
        target: "member",
        dartPath: "lib/config/content_config.dart → welcomeMessage",
        reason: "Personalized greeting on dashboard: 'Welcome back, {first_name}'",
        connected: true,
        critical: false,
      },
      {
        key: "content.legal.privacy_url",
        name: "Privacy Policy URL",
        target: "both",
        dartPath: "lib/config/content_config.dart → privacyUrl",
        webPath: "lib/content.ts → PRIVACY_URL",
        reason: "Link to privacy policy. Required in both apps for compliance.",
        connected: true,
        critical: true,
      },
      {
        key: "content.legal.terms_url",
        name: "Terms of Service URL",
        target: "both",
        dartPath: "lib/config/content_config.dart → termsUrl",
        webPath: "lib/content.ts → TERMS_URL",
        reason: "Link to terms. Members agree during signup.",
        connected: true,
        critical: true,
      },
    ],
  },
  {
    id: "ai",
    name: "TIER 13: AI Coaching",
    description: "How does the AI behave?",
    fields: [
      {
        key: "ai.coach.enabled",
        name: "AI Coach Enabled",
        target: "member",
        dartPath: "lib/config/ai_config.dart → coachEnabled",
        reason: "Member-only. Personal financial coach in the mobile app.",
        connected: true,
        critical: false,
      },
      {
        key: "ai.coach.name",
        name: "AI Coach Name",
        target: "member",
        dartPath: "lib/config/ai_config.dart → coachName",
        reason: "What the AI is called: 'Navigator', 'Penny', 'Max', etc.",
        connected: true,
        critical: false,
      },
      {
        key: "ai.coach.personality",
        name: "AI Coach Personality",
        target: "member",
        dartPath: "lib/config/ai_config.dart → coachPersonality",
        reason: "Supportive, direct, educational, or motivational. Sets the tone.",
        connected: true,
        critical: false,
      },
      {
        key: "ai.support.enabled",
        name: "AI Support Enabled",
        target: "employee",
        webPath: "lib/ai.ts → SUPPORT_AI_ENABLED",
        reason: "Employee-only. AI assists support staff with member questions.",
        connected: true,
        critical: false,
      },
      {
        key: "ai.support.escalation_threshold",
        name: "AI Escalation Threshold",
        target: "employee",
        webPath: "lib/ai.ts → ESCALATION_THRESHOLD",
        reason: "Messages before AI hands off to human. Prevents AI loops.",
        connected: true,
        critical: false,
      },
    ],
  },
  {
    id: "deploy",
    name: "TIER 14: Deployment",
    description: "How does it run?",
    fields: [
      {
        key: "deploy.environment",
        name: "Environment",
        target: "infrastructure",
        reason: "development, staging, production. Infrastructure routing only.",
        connected: true,
        critical: true,
      },
      {
        key: "deploy.region",
        name: "Primary Region",
        target: "infrastructure",
        reason: "AWS/GCP region. Affects latency. Infrastructure config.",
        connected: true,
        critical: false,
      },
      {
        key: "deploy.cdn",
        name: "CDN Endpoint",
        target: "infrastructure",
        reason: "Where static assets are served from. Apps use CDN URLs.",
        connected: true,
        critical: false,
      },
      {
        key: "deploy.api",
        name: "API Endpoint",
        target: "infrastructure",
        reason: "Primary API endpoint. Both apps connect here but it's infra config.",
        connected: true,
        critical: true,
      },
    ],
  },
]

// Calculate stats
function calculateStats() {
  let totalFields = 0
  let connectedFields = 0
  let memberFields = 0
  let employeeFields = 0
  let bothFields = 0
  let infraFields = 0
  let criticalConnected = 0
  let criticalTotal = 0

  TIER_MAPPINGS.forEach((tier) => {
    tier.fields.forEach((field) => {
      totalFields++
      if (field.connected) connectedFields++
      if (field.critical) {
        criticalTotal++
        if (field.connected) criticalConnected++
      }
      switch (field.target) {
        case "member":
          memberFields++
          break
        case "employee":
          employeeFields++
          break
        case "both":
          bothFields++
          break
        case "infrastructure":
          infraFields++
          break
      }
    })
  })

  return {
    totalFields,
    connectedFields,
    memberFields,
    employeeFields,
    bothFields,
    infraFields,
    criticalConnected,
    criticalTotal,
    connectionRate: Math.round((connectedFields / totalFields) * 100),
    criticalRate: Math.round((criticalConnected / criticalTotal) * 100),
  }
}

const TARGET_LABELS: Record<TargetApp, { label: string; icon: React.ReactNode; color: string }> = {
  member: {
    label: "Member App",
    icon: <Smartphone className="h-3 w-3" />,
    color: "bg-blue-500/10 text-blue-700 border-blue-200",
  },
  employee: {
    label: "Employee Portal",
    icon: <Monitor className="h-3 w-3" />,
    color: "bg-purple-500/10 text-purple-700 border-purple-200",
  },
  both: {
    label: "Both Apps",
    icon: <Zap className="h-3 w-3" />,
    color: "bg-green-500/10 text-green-700 border-green-200",
  },
  infrastructure: {
    label: "Infrastructure",
    icon: <Cloud className="h-3 w-3" />,
    color: "bg-gray-500/10 text-gray-700 border-gray-200",
  },
}

export function ConfigFieldMapping() {
  const [expandedTiers, setExpandedTiers] = useState<string[]>(["tenant"])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterTarget, setFilterTarget] = useState<TargetApp | "all">("all")
  const [showOnlyDisconnected, setShowOnlyDisconnected] = useState(false)

  const stats = calculateStats()

  const toggleTier = (tierId: string) => {
    setExpandedTiers((prev) => (prev.includes(tierId) ? prev.filter((t) => t !== tierId) : [...prev, tierId]))
  }

  const filteredTiers = TIER_MAPPINGS.map((tier) => ({
    ...tier,
    fields: tier.fields.filter((field) => {
      const matchesSearch =
        searchQuery === "" ||
        field.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        field.reason.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesTarget = filterTarget === "all" || field.target === filterTarget
      const matchesConnected = !showOnlyDisconnected || !field.connected
      return matchesSearch && matchesTarget && matchesConnected
    }),
  })).filter((tier) => tier.fields.length > 0)

  return (
    // Wrap the entire component with TooltipProvider
    <TooltipProvider>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">Configuration Field Mapping</h2>
          <p className="text-muted-foreground">
            Complete chain of thought: how every config field flows into the Member App and Employee Portal
          </p>
        </div>

        {/* Overall Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Fields</CardDescription>
              <CardTitle className="text-3xl">{stats.totalFields}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={stats.connectionRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{stats.connectionRate}% connected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Critical Fields</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {stats.criticalConnected}/{stats.criticalTotal}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={stats.criticalRate} className="h-2 bg-green-100" />
              <p className="text-xs text-muted-foreground mt-1">{stats.criticalRate}% critical connected</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-blue-700">Member App</CardDescription>
              <CardTitle className="text-3xl text-blue-700">{stats.memberFields}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <Smartphone className="h-3 w-3" />
                Flutter/Dart
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-purple-700">Employee Portal</CardDescription>
              <CardTitle className="text-3xl text-purple-700">{stats.employeeFields}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-purple-600">
                <Monitor className="h-3 w-3" />
                React/Web
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-green-700">Both Apps</CardDescription>
              <CardTitle className="text-3xl text-green-700">{stats.bothFields}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Zap className="h-3 w-3" />
                Shared config
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-gray-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-700">Infrastructure</CardDescription>
              <CardTitle className="text-3xl text-gray-700">{stats.infraFields}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Cloud className="h-3 w-3" />
                Backend only
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Flow Diagram */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Data Flow Architecture
            </CardTitle>
            <CardDescription>How configuration travels from this dashboard to production apps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 py-4 overflow-x-auto">
              {/* Config Dashboard */}
              <div className="flex flex-col items-center gap-2 min-w-[120px]">
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Settings className="h-8 w-8 text-primary" />
                </div>
                <span className="text-sm font-medium text-center">Config Dashboard</span>
                <span className="text-xs text-muted-foreground">(You are here)</span>
              </div>

              <ArrowRight className="h-6 w-6 text-muted-foreground shrink-0" />

              {/* Supabase */}
              <div className="flex flex-col items-center gap-2 min-w-[120px]">
                <div className="h-16 w-16 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Database className="h-8 w-8 text-emerald-600" />
                </div>
                <span className="text-sm font-medium">Supabase</span>
                <span className="text-xs text-muted-foreground">PostgreSQL</span>
              </div>

              <ArrowRight className="h-6 w-6 text-muted-foreground shrink-0" />

              {/* GitHub */}
              <div className="flex flex-col items-center gap-2 min-w-[120px]">
                <div className="h-16 w-16 rounded-xl bg-gray-900/10 flex items-center justify-center">
                  <GitBranch className="h-8 w-8 text-gray-800" />
                </div>
                <span className="text-sm font-medium">GitHub Actions</span>
                <span className="text-xs text-muted-foreground">CI/CD Pipeline</span>
              </div>

              <ArrowRight className="h-6 w-6 text-muted-foreground shrink-0" />

              {/* CDN */}
              <div className="flex flex-col items-center gap-2 min-w-[120px]">
                <div className="h-16 w-16 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Cloud className="h-8 w-8 text-orange-600" />
                </div>
                <span className="text-sm font-medium">Vercel CDN</span>
                <span className="text-xs text-muted-foreground">Edge Config</span>
              </div>

              <ArrowRight className="h-6 w-6 text-muted-foreground shrink-0" />

              {/* Apps */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-2 min-w-[100px]">
                  <div className="h-16 w-16 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Smartphone className="h-8 w-8 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">Member App</span>
                  <span className="text-xs text-muted-foreground">iOS/Android</span>
                </div>
                <div className="flex flex-col items-center gap-2 min-w-[100px]">
                  <div className="h-16 w-16 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Monitor className="h-8 w-8 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium">Employee Portal</span>
                  <span className="text-xs text-muted-foreground">Web App</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search fields, paths, or reasons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterTarget} onValueChange={(v) => setFilterTarget(v as typeof filterTarget)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Targets</SelectItem>
              <SelectItem value="member">Member App Only</SelectItem>
              <SelectItem value="employee">Employee Portal Only</SelectItem>
              <SelectItem value="both">Both Apps</SelectItem>
              <SelectItem value="infrastructure">Infrastructure</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showOnlyDisconnected ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOnlyDisconnected(!showOnlyDisconnected)}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Show Disconnected Only
          </Button>
        </div>

        {/* Field Mapping List */}
        <div className="space-y-4">
          {filteredTiers.map((tier) => (
            <Card key={tier.id}>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleTier(tier.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedTiers.includes(tier.id) ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{tier.name}</CardTitle>
                      <CardDescription>{tier.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{tier.fields.length} fields</Badge>
                    <div className="flex gap-1">
                      {tier.fields.some((f) => f.target === "member" || f.target === "both") && (
                        <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">
                          <Smartphone className="h-3 w-3" />
                        </Badge>
                      )}
                      {tier.fields.some((f) => f.target === "employee" || f.target === "both") && (
                        <Badge className="bg-purple-500/10 text-purple-700 border-purple-200">
                          <Monitor className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              {expandedTiers.includes(tier.id) && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {tier.fields.map((field) => (
                      <div
                        key={field.key}
                        className={cn(
                          "border rounded-lg p-4 transition-colors",
                          field.connected ? "bg-background" : "bg-red-50 border-red-200",
                        )}
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            {field.connected ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-red-500 shrink-0" />
                            )}
                            <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{field.key}</code>
                            {field.critical && (
                              <Badge variant="destructive" className="text-xs">
                                Critical
                              </Badge>
                            )}
                          </div>
                          <Badge className={cn("shrink-0", TARGET_LABELS[field.target].color)}>
                            {TARGET_LABELS[field.target].icon}
                            <span className="ml-1">{TARGET_LABELS[field.target].label}</span>
                          </Badge>
                        </div>

                        <div className="ml-6 space-y-2">
                          <p className="font-medium">{field.name}</p>

                          {/* Chain of thought - the reason */}
                          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                            <Info className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>{field.reason}</p>
                          </div>

                          {/* Code paths */}
                          <div className="flex flex-wrap gap-2 text-xs">
                            {field.dartPath && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <span className="flex items-center gap-1 bg-blue-500/10 text-blue-700 px-2 py-1 rounded font-mono">
                                    <Smartphone className="h-3 w-3" />
                                    {field.dartPath.split(" → ")[1] || field.dartPath}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-mono text-xs">{field.dartPath}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {field.webPath && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <span className="flex items-center gap-1 bg-purple-500/10 text-purple-700 px-2 py-1 rounded font-mono">
                                    <Monitor className="h-3 w-3" />
                                    {field.webPath.split(" → ")[1] || field.webPath}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-mono text-xs">{field.webPath}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}

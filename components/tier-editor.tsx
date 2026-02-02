"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import type { CreditUnionConfig, ConfigTierId } from "@/types/cu-config"
import { CONFIG_TIERS } from "@/types/cu-config"
import { POWERON_CATEGORIES, generatePowerOnSpecs, type PowerOnCategory } from "@/types/poweron-specs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Trash2,
  Database,
  Building2,
  Palette,
  ToggleLeft,
  Package,
  Scale,
  ShieldAlert,
  FileCheck,
  Plug,
  Smartphone,
  Bell,
  FileText,
  Wand2,
  Bot,
  Rocket,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Phone,
  Mic,
  Activity,
  Globe,
  Image as ImageIcon,
  PlusCircle,
  Eye,
  Save,
} from "lucide-react"
import { cn } from "@/lib/utils"

const TIER_ICONS: Record<ConfigTierId, React.ReactNode> = {
  tenant: <Building2 className="h-4 w-4" />,
  tokens: <Palette className="h-4 w-4" />,
  features: <ToggleLeft className="h-4 w-4" />,
  ivr: <Phone className="h-4 w-4" />, // Changed from ivr_voice/ivr_prompts
  products: <Package className="h-4 w-4" />,
  rules: <Scale className="h-4 w-4" />,
  fraud: <ShieldAlert className="h-4 w-4" />,
  compliance: <FileCheck className="h-4 w-4" />,
  integrations: <Plug className="h-4 w-4" />,
  channels: <Smartphone className="h-4 w-4" />,
  notifications: <Bell className="h-4 w-4" />,
  content: <FileText className="h-4 w-4" />,
  marketing: <Globe className="h-4 w-4" />,
  ucx: <Wand2 className="h-4 w-4" />,
  ai: <Bot className="h-4 w-4" />,
  deploy: <Rocket className="h-4 w-4" />,
  poweron: <Database className="h-4 w-4" />,
}

const FIELD_HELPERS: Record<string, string> = {
  // Tenant
  "tenant.id": "Unique identifier for this credit union in the system",
  "tenant.name": "Display name shown to members throughout the app",
  "tenant.charter_number": "NCUA charter number for regulatory identification",
  "tenant.domain": "Primary web domain for the credit union",
  "tenant.timezone": "Default timezone for transaction timestamps and scheduling",
  "tenant.locale": "Language and regional formatting (e.g., en-US for US English)",
  "tenant.support.phone": "Member support hotline - shown in app and IVR",
  "tenant.support.email": "Support email for member inquiries",
  "tenant.legal.name": "Official legal entity name for disclosures",
  "tenant.legal.routing": "ABA routing number for ACH and wire transfers",

  // Features
  "features.mobile_deposit": "Allow members to deposit checks by taking photos",
  "features.bill_pay": "Enable bill payment to vendors and billers",
  "features.p2p": "Person-to-person money transfers (Zelle-like)",
  "features.wire_transfer": "Domestic and international wire transfers",
  "features.ach_origination": "Allow members to initiate ACH transfers",
  "features.card_controls": "Let members lock/unlock cards, set limits, travel notices",
  "features.budgeting": "Built-in budgeting tools and spending categories",
  "features.goals": "Savings goals with progress tracking",
  "features.statements": "Electronic statement delivery and archive",
  "features.alerts": "Transaction and balance alerts via push/SMS/email",
  "features.secure_messaging": "Encrypted messaging with support team",
  "features.external_transfers": "Link and transfer to/from external accounts",
  "features.loan_applications": "Apply for loans directly in the app",
  "features.account_opening": "Open new accounts without visiting a branch",
  "features.joint_access": "Joint account holders can access shared accounts",
  "features.ai_coach": "AI-powered financial coaching and insights",
  "features.dark_mode": "Allow members to use dark theme",

  // IVR Voice Config
  "ivr_voice.enabled": "Enable Hume EVI voice interface for phone banking",
  "ivr_voice.evi_version": "Hume EVI version (3 recommended, 4-mini for speed)",
  "ivr_voice.voice.provider": "Voice provider (HUME_AI or CUSTOM cloned voice)",
  "ivr_voice.voice.name": "Voice personality name from Hume library",
  "ivr_voice.language_model.model_provider": "LLM provider for response generation",
  "ivr_voice.language_model.model_resource": "Specific model to use (e.g., claude-sonnet-4)",
  "ivr_voice.ellm_model.allow_short_responses": "Enable quick responses before full LLM response",
  "ivr_voice.nudges.enabled": "Prompt caller when silent",
  "ivr_voice.nudges.interval_secs": "Seconds before nudge prompt (default 6)",
  "ivr_voice.timeouts.inactivity.duration_secs": "Inactivity timeout in seconds",
  "ivr_voice.timeouts.max_duration.duration_secs": "Maximum call duration in seconds",
  "ivr_voice.voice_biometrics.enabled": "Enable voice print authentication",
  "ivr_voice.voice_biometrics.confidence_threshold": "Minimum confidence for voice match (0-100)",
  "ivr_voice.twilio.phone_number": "Twilio phone number for IVR",

  // IVR Prompts
  "ivr_prompts.system_prompt.text": "System prompt defining voice agent personality and behavior",
  "ivr_prompts.event_messages.on_new_chat.message": "Greeting when call connects",
  "ivr_prompts.event_messages.on_disconnect.message": "Farewell when call ends",
  "ivr_prompts.event_messages.on_transfer.message": "Message when transferring to human",
  "ivr_prompts.escalation.keywords": "Words that trigger transfer to human agent",
  "ivr_prompts.escalation.max_attempts": "Transfer after N failed understanding attempts",
  "ivr_prompts.call_recording.enabled": "Record calls for quality assurance",
  "ivr_prompts.call_recording.disclosure_message": "Recording disclosure played to caller",

  // Products
  "products.shares.regular_savings": "Standard savings account with dividends",
  "products.shares.checking": "Checking account with debit card access",
  "products.shares.money_market": "Higher-yield savings with limited transactions",
  "products.shares.certificates": "Certificate of deposit products",
  "products.loans.auto": "New and used vehicle financing",
  "products.loans.personal": "Unsecured personal/signature loans",
  "products.loans.mortgage": "Home purchase and refinance loans",
  "products.loans.credit_card": "Credit card products",

  // Rules
  "rules.limits.daily_transfer_internal": "Max amount for internal transfers per day",
  "rules.limits.daily_transfer_external": "Max amount for external transfers per day",
  "rules.limits.daily_p2p": "Max amount for P2P transfers per day",
  "rules.limits.mobile_deposit_per_check": "Max single check amount for mobile deposit",
  "rules.limits.mobile_deposit_daily": "Max total mobile deposits per day",
  "rules.session.timeout_minutes": "Inactivity timeout before auto-logout",
  "rules.session.max_attempts": "Failed login attempts before lockout",

  // Fraud
  "fraud.enabled": "Enable fraud detection engine",
  "fraud.realtime_scoring": "Score transactions in real-time for risk",
  "fraud.device_fingerprinting": "Track device characteristics for fraud signals",
  "fraud.velocity_checks": "Monitor transaction frequency for anomalies",
  "fraud.geolocation": "Check transaction location against member patterns",

  // Compliance
  "compliance.bsa_aml": "Bank Secrecy Act / Anti-Money Laundering monitoring",
  "compliance.ofac_screening": "Screen against OFAC sanctions list",
  "compliance.cip_verification": "Customer Identification Program verification",
  "compliance.reg_e": "Regulation E electronic fund transfer protections",
  "compliance.reg_d": "Regulation D savings withdrawal limits (now suspended)",

  // Channels
  "channels.mobile.ios.enabled": "Publish iOS app to App Store",
  "channels.mobile.android.enabled": "Publish Android app to Play Store",
  "channels.web.enabled": "Enable web banking portal",
  "channels.ivr.enabled": "Interactive Voice Response phone banking",
  "channels.chatbot.enabled": "AI chatbot for member support",

  // AI
  "ai.coach.enabled": "Enable AI financial coach feature",
  "ai.coach.name": "Name of the AI coach shown to members",
  "ai.coach.proactive": "Coach proactively offers tips without being asked",
  "ai.coach.spending_insights": "Analyze spending patterns and provide insights",
}

interface ToggleGroup {
  id: string
  name: string
  description: string
  fields: { path: string; label: string }[]
}

const TOGGLE_GROUPS: Record<string, ToggleGroup[]> = {
  features: [
    {
      id: "core_banking",
      name: "Core Banking",
      description: "Essential banking features used by 95% of credit unions",
      fields: [
        { path: "features.mobile_deposit", label: "Mobile Deposit" },
        { path: "features.bill_pay", label: "Bill Pay" },
        { path: "features.external_transfers", label: "External Transfers" },
        { path: "features.statements", label: "E-Statements" },
        { path: "features.alerts", label: "Alerts" },
      ],
    },
    {
      id: "digital_payments",
      name: "Digital Payments",
      description: "Modern payment options - P2P, wires, ACH",
      fields: [
        { path: "features.p2p", label: "P2P Transfers" },
        { path: "features.wire_transfer", label: "Wire Transfers" },
        { path: "features.ach_origination", label: "ACH Origination" },
      ],
    },
    {
      id: "card_services", // Changed from card_management
      name: "Card Services",
      description: "Debit and credit card management",
      fields: [
        { path: "features.card_controls", label: "Card Controls" },
        { path: "features.travel_notifications", label: "Travel Notices" },
      ],
    },
    {
      id: "financial_wellness",
      name: "Financial Wellness",
      description: "Help members achieve their financial goals", // Updated description
      fields: [
        { path: "features.budgeting", label: "Budgeting" },
        { path: "features.goals", label: "Savings Goals" },
        { path: "features.ai_coach", label: "AI Coach" },
      ],
    },
    {
      id: "self_service", // New group
      name: "Self-Service",
      description: "Let members do more without staff help",
      fields: [
        { path: "features.loan_applications", label: "Loan Applications" },
        { path: "features.account_opening", label: "Account Opening" },
        { path: "features.joint_access", label: "Joint Access" },
      ],
    },
    {
      id: "security", // Changed from security_features
      name: "Security & Auth",
      description: "Biometric and secure access options", // Updated description
      fields: [
        { path: "features.face_id", label: "Face ID" },
        { path: "features.fingerprint", label: "Fingerprint" },
        { path: "features.voice_biometrics", label: "Voice Biometrics" },
      ],
    },
  ],
  ivr: [
    {
      id: "ivr_core",
      name: "IVR Core Settings",
      description: "Essential voice interface configuration",
      fields: [
        { path: "ivr_voice.enabled", label: "Enable IVR" },
        { path: "ivr_voice.ellm_model.allow_short_responses", label: "Quick Responses" },
        { path: "ivr_voice.nudges.enabled", label: "Silence Nudges" },
      ],
    },
    {
      id: "ivr_timeouts",
      name: "Timeouts",
      description: "Inactivity and max duration settings",
      fields: [
        { path: "ivr_voice.timeouts.inactivity.enabled", label: "Inactivity Timeout" },
        { path: "ivr_voice.timeouts.max_duration.enabled", label: "Max Duration Limit" },
      ],
    },
    {
      id: "ivr_security",
      name: "Voice Security",
      description: "Voice biometrics and authentication",
      fields: [
        { path: "ivr_voice.voice_biometrics.enabled", label: "Voice Biometrics" },
        { path: "ivr_voice.voice_biometrics.enrollment_required", label: "Require Enrollment" },
      ],
    },
    {
      id: "ivr_events",
      name: "Event Messages",
      description: "Automated messages for call events",
      fields: [
        { path: "ivr_prompts.event_messages.on_new_chat.enabled", label: "Greeting Message" },
        { path: "ivr_prompts.event_messages.on_disconnect.enabled", label: "Farewell Message" },
        { path: "ivr_prompts.event_messages.on_transfer.enabled", label: "Transfer Message" },
        { path: "ivr_prompts.event_messages.on_error.enabled", label: "Error Message" },
      ],
    },
    {
      id: "ivr_banking_intents",
      name: "Banking Intents",
      description: "What members can do via voice",
      fields: [
        { path: "ivr_prompts.banking_intents.balance_inquiry", label: "Balance Inquiry" },
        { path: "ivr_prompts.banking_intents.transaction_history", label: "Transaction History" },
        { path: "ivr_prompts.banking_intents.transfer_funds", label: "Transfer Funds" },
        { path: "ivr_prompts.banking_intents.bill_pay", label: "Bill Pay" },
      ],
    },
    {
      id: "ivr_banking_intents_2",
      name: "Additional Intents",
      description: "More voice banking capabilities",
      fields: [
        { path: "ivr_prompts.banking_intents.card_services", label: "Card Services" },
        { path: "ivr_prompts.banking_intents.loan_inquiry", label: "Loan Inquiry" },
        { path: "ivr_prompts.banking_intents.branch_hours", label: "Branch Hours" },
        { path: "ivr_prompts.banking_intents.atm_locator", label: "ATM Locator" },
      ],
    },
  ],
  products: [
    // New products toggle groups
    {
      id: "shares",
      name: "Share Products",
      description: "Savings and checking accounts",
      fields: [
        { path: "products.shares.regular_savings", label: "Regular Savings" },
        { path: "products.shares.checking", label: "Checking" },
        { path: "products.shares.money_market", label: "Money Market" },
        { path: "products.shares.youth_savings", label: "Youth Savings" },
        { path: "products.shares.christmas_club", label: "Christmas Club" },
      ],
    },
    {
      id: "loans",
      name: "Loan Products",
      description: "Consumer and real estate loans",
      fields: [
        { path: "products.loans.auto", label: "Auto Loans" },
        { path: "products.loans.personal", label: "Personal Loans" },
        { path: "products.loans.mortgage", label: "Mortgages" },
        { path: "products.loans.heloc", label: "Home Equity" },
        { path: "products.loans.credit_card", label: "Credit Cards" },
      ],
    },
  ],
  fraud: [
    // Copied from original, no changes
    {
      id: "fraud_detection",
      name: "Fraud Detection Suite",
      description: "Real-time fraud monitoring and prevention",
      fields: [
        { path: "fraud.enabled", label: "Enable Fraud Detection" },
        { path: "fraud.realtime_scoring", label: "Real-time Scoring" },
        { path: "fraud.device_fingerprinting", label: "Device Fingerprinting" },
        { path: "fraud.velocity_checks", label: "Velocity Checks" },
        { path: "fraud.geolocation", label: "Geolocation Checks" },
      ],
    },
  ],
  compliance: [
    // Copied from original, no changes
    {
      id: "regulatory",
      name: "Regulatory Compliance",
      description: "Required compliance monitoring - 80% of CUs have these enabled",
      fields: [
        { path: "compliance.bsa_aml", label: "BSA/AML" },
        { path: "compliance.ofac_screening", label: "OFAC Screening" },
        { path: "compliance.cip_verification", label: "CIP Verification" },
        { path: "compliance.reg_e", label: "Reg E" },
        { path: "compliance.reg_d", label: "Reg D" },
        { path: "compliance.reg_cc", label: "Reg CC" },
      ],
    },
  ],
  channels: [
    // Modified to fit new structure
    {
      id: "mobile",
      name: "Mobile Apps",
      description: "iOS and Android applications",
      fields: [
        { path: "channels.mobile.ios.enabled", label: "iOS App" },
        { path: "channels.mobile.android.enabled", label: "Android App" },
      ],
    },
    {
      id: "digital",
      name: "Digital Channels",
      description: "Web and messaging channels",
      fields: [
        { path: "channels.web.enabled", label: "Web Banking" },
        { path: "channels.ivr.enabled", label: "Phone Banking (IVR)" },
        { path: "channels.chatbot.enabled", label: "Chatbot" },
        { path: "channels.sms_banking.enabled", label: "SMS Banking" },
      ],
    },
  ],
  notifications: [
    // Copied from original, no changes
    {
      id: "security_alerts",
      name: "Security Alerts",
      description: "Critical security notifications",
      fields: [
        { path: "notifications.login.new_device", label: "New Device Login" },
        { path: "notifications.login.failed", label: "Failed Login" },
        { path: "notifications.fraud.alert", label: "Fraud Alerts" },
      ],
    },
    {
      id: "transaction_alerts",
      name: "Transaction Alerts",
      description: "Keep members informed about money movement",
      fields: [
        { path: "notifications.transaction.large", label: "Large Transactions" },
        { path: "notifications.transaction.international", label: "International" },
        { path: "notifications.transaction.declined", label: "Declined" },
      ],
    },
    {
      id: "account_alerts",
      name: "Account Alerts",
      description: "Balance and deposit notifications",
      fields: [
        { path: "notifications.balance.low", label: "Low Balance" },
        { path: "notifications.balance.negative", label: "Negative Balance" },
        { path: "notifications.deposit.received", label: "Deposit Received" },
        { path: "notifications.deposit.direct_deposit", label: "Direct Deposit" },
      ],
    },
  ],
}

interface TierEditorProps {
  config: CreditUnionConfig
  onConfigChange: (config: CreditUnionConfig) => void
  activeTier: ConfigTierId
  onTierChange: (tier: ConfigTierId) => void
  /** From Inspector/Config bridge: scroll to this screen in Content > MX App Screens */
  selectedScreenId?: string | null
  /** Called when user clicks Inspect next to a screen — opens Screen Inspector */
  onInspectScreen?: (screenId: string) => void
}

export function TierEditor({
  config,
  onConfigChange,
  activeTier,
  onTierChange,
  selectedScreenId = null,
  onInspectScreen,
}: TierEditorProps) {
  const [localConfig, setLocalConfig] = useState<CreditUnionConfig>(config)
  const [hasChanges, setHasChanges] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({}) // Changed from Set to Record<string, boolean>
  const [poweronCategoryFilter, setPoweronCategoryFilter] = useState<PowerOnCategory | "all">("all") // Kept from original
  const [ivrSubTab, setIvrSubTab] = useState<"voice" | "prompts">("voice") // New state for IVR subtabs

  useEffect(() => {
    setLocalConfig(config)
    setHasChanges(false)
  }, [config])

  function updateField(path: string, value: unknown) {
    const parts = path.split(".")
    const newConfig = { ...localConfig } // Deep copy is no longer needed here as we are not modifying nested objects directly on update
    let current: Record<string, unknown> = newConfig as unknown as Record<string, unknown>

    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {}
      }
      current = current[parts[i]] as Record<string, unknown>
    }

    current[parts[parts.length - 1]] = value
    setLocalConfig(newConfig as CreditUnionConfig)
    setHasChanges(true)
  }

  function getFieldValue(path: string): unknown {
    const parts = path.split(".")
    let current: unknown = localConfig

    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = (current as Record<string, unknown>)[part]
      } else {
        return undefined
      }
    }

    return current
  }

  // Integrated toggleGroup and isGroupEnabled/isGroupPartial logic into renderToggleGroups
  function renderField(
    label: string,
    path: string,
    type: "text" | "number" | "boolean" | "select" | "color" | "array" | "textarea" = "text",
    options?: { value: string; label: string }[],
  ) {
    const value = getFieldValue(path)
    const helper = FIELD_HELPERS[path]

    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1">
          <Label className="text-sm">{label}</Label>
          {helper && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">{helper}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {type === "boolean" ? (
          <Switch checked={value as boolean} onCheckedChange={(checked) => updateField(path, checked)} />
        ) : type === "select" && options ? (
          <Select value={value as string} onValueChange={(v) => updateField(path, v)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "color" ? (
          <div className="flex gap-2">
            <Input
              type="color"
              value={(value as string) || "#000000"}
              onChange={(e) => updateField(path, e.target.value)}
              className="w-12 h-9 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={(value as string) || ""}
              onChange={(e) => updateField(path, e.target.value)}
              className="flex-1 h-9"
              placeholder="#000000"
            />
          </div>
        ) : type === "number" ? (
          <Input
            type="number"
            value={(value as number) || 0}
            onChange={(e) => updateField(path, Number.parseFloat(e.target.value) || 0)}
            className="h-9"
          />
        ) : type === "array" ? ( // Added array type rendering
          <div className="flex flex-wrap gap-1">
            {((value as string[]) || []).map((item, idx) => (
              <Badge key={idx} variant="secondary" className="gap-1">
                {item}
                <button
                  onClick={() => {
                    const newArr = ((value as string[]) || []).filter((_, i) => i !== idx)
                    updateField(path, newArr)
                  }}
                  className="ml-1 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs bg-transparent"
              onClick={() => {
                const newItem = prompt("Add item:")
                if (newItem) {
                  updateField(path, [...((value as string[]) || []), newItem])
                }
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div> // Default to text input
        ) : (
          <Input
            type="text"
            value={(value as string) || ""}
            onChange={(e) => updateField(path, e.target.value)}
            className="h-9"
          />
        )}
      </div>
    )
  }

  function renderToggleGroups(groups: ToggleGroup[]) {
    return (
      <div className="space-y-4">
        {groups.map((group) => {
          const isExpanded = expandedGroups[group.id] !== false // Use Record for expanded state

          // Determine master toggle state
          const allEnabled = group.fields.every((field) => getFieldValue(field.path) as boolean)
          const someEnabled = group.fields.some((field) => getFieldValue(field.path) as boolean)
          const indeterminate = someEnabled && !allEnabled

          return (
            <div key={group.id} className="border rounded-lg overflow-hidden">
              <button
                className={cn(
                  "w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors",
                  allEnabled ? "bg-primary/5" : indeterminate ? "bg-muted/20" : "bg-muted/10",
                )}
                onClick={() => setExpandedGroups({ ...expandedGroups, [group.id]: !isExpanded })}
              >
                <div className="flex items-center gap-2 text-left">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={allEnabled ? "default" : indeterminate ? "secondary" : "outline"}
                    className="text-[10px] h-5"
                  >
                    {allEnabled ? "All On" : indeterminate ? "Partial" : "Off"}
                  </Badge>
                  <Switch
                    checked={allEnabled}
                    onCheckedChange={(checked) => {
                      group.fields.forEach((field) => updateField(field.path, checked))
                    }}
                    // Stop propagation to prevent expanding/collapsing when master switch is clicked
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="p-3 grid grid-cols-2 gap-3 border-t">
                  {group.fields.map((field) => (
                    <div key={field.path} className="flex items-center justify-between">
                      <Label className="text-sm">{field.label}</Label>
                      <Switch
                        checked={getFieldValue(field.path) as boolean}
                        onCheckedChange={(checked) => updateField(field.path, checked)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  function handleSave() {
    onConfigChange(localConfig)
    setHasChanges(false)
  }

  function handleReset() {
    setLocalConfig(config)
    setHasChanges(false)
  }

  const currentTier = CONFIG_TIERS.find((t) => t.id === activeTier)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pb-4 mb-4 border-b flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{currentTier?.name}</h3>
          <p className="text-sm text-muted-foreground">{currentTier?.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!hasChanges}>
            Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
            Save
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {renderTierContent(activeTier, selectedScreenId, onInspectScreen)}
      </div>
    </div>
  )
}

// Removed TIER_ICONS export as it's no longer used directly
// export { TIER_ICONS }

function renderTierContent(
  tierId: ConfigTierId,
  selectedScreenId?: string | null,
  onInspectScreen?: (screenId: string) => void
) {
  // Moved renderTierContent outside component to be accessible by the main component
  // Define renderField, renderToggleGroups, localConfig, updateField, ivrSubTab, setIvrSubTab, poweronCategoryFilter, setPoweronCategoryFilter, togglePowerOnSpec, and filteredSpecs within the scope of renderTierContent to resolve undeclared variable errors.
  const [localConfig, setLocalConfig] = useState<CreditUnionConfig | null>(null) // Initialize with null and set in useEffect
  const screenRowRef = useRef<HTMLDivElement | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [poweronCategoryFilter, setPoweronCategoryFilter] = useState<PowerOnCategory | "all">("all")
  const [ivrSubTab, setIvrSubTab] = useState<"voice" | "prompts">("voice")

  // Mock config and onConfigChange for standalone rendering if needed, otherwise rely on props passed down.
  // In a real app, this would typically be handled by context or passed props.
  const mockConfig = {
    tenant: { id: "mock", name: "Mock CU" },
    tokens: { color: {}, typography: {}, spacing: {}, radius: {} },
    features: {},
    ivr_voice: {},
    ivr_prompts: {},
    products: { shares: [], loans: [], cards: [], catalog: [] },
    rules: {},
    fraud: {},
    compliance: {},
    integrations: {},
    channels: {},
    notifications: {},
    content: {},
    ucx: {},
    ai: {},
    deploy: {},
    poweron: { enabled: true, prefix: "MOCK", basePath: "", specs: [], categorySettings: {} },
  } as unknown as CreditUnionConfig
  const mockOnConfigChange = (config: CreditUnionConfig) => {
    console.log("Mock config change:", config)
  }

  useEffect(() => {
    // Initialize localConfig when the component mounts or config changes.
    // This is a simplified approach for demonstration. In a real scenario,
    // this state management might be handled differently.
    setLocalConfig(mockConfig)
  }, [])

  // Scroll to MX App Screens row when bridge selectedScreenId is set (e.g. from "Edit in Config")
  useEffect(() => {
    if (tierId === "content" && selectedScreenId && screenRowRef.current) {
      screenRowRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [tierId, selectedScreenId])

  if (!localConfig) {
    return <div className="p-8 text-center text-muted-foreground">Loading configuration...</div>
  }

  function updateField(path: string, value: unknown) {
    const parts = path.split(".")
    const newConfig = JSON.parse(JSON.stringify(localConfig)) // Deep copy
    let current: Record<string, unknown> = newConfig

    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {}
      }
      current = current[parts[i]] as Record<string, unknown>
    }

    current[parts[parts.length - 1]] = value
    setLocalConfig(newConfig as CreditUnionConfig)
    setHasChanges(true)
  }

  function getFieldValue(path: string): unknown {
    const parts = path.split(".")
    let current: unknown = localConfig

    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = (current as Record<string, unknown>)[part]
      } else {
        return undefined
      }
    }
    return current
  }

  function renderField(
    label: string,
    path: string,
    type: "text" | "number" | "boolean" | "select" | "color" | "array" | "textarea" = "text",
    options?: { value: string; label: string }[],
  ) {
    const value = getFieldValue(path)
    const helper = FIELD_HELPERS[path]

    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1">
          <Label className="text-sm">{label}</Label>
          {helper && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">{helper}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {type === "boolean" ? (
          <Switch checked={value as boolean} onCheckedChange={(checked) => updateField(path, checked)} />
        ) : type === "select" && options ? (
          <Select value={value as string} onValueChange={(v) => updateField(path, v)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "color" ? (
          <div className="flex gap-2">
            <Input
              type="color"
              value={(value as string) || "#000000"}
              onChange={(e) => updateField(path, e.target.value)}
              className="w-12 h-9 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={(value as string) || ""}
              onChange={(e) => updateField(path, e.target.value)}
              className="flex-1 h-9"
              placeholder="#000000"
            />
          </div>
        ) : type === "number" ? (
          <Input
            type="number"
            value={(value as number) || 0}
            onChange={(e) => updateField(path, Number.parseFloat(e.target.value) || 0)}
            className="h-9"
          />
        ) : type === "array" ? (
          <div className="flex flex-wrap gap-1">
            {((value as string[]) || []).map((item, idx) => (
              <Badge key={idx} variant="secondary" className="gap-1">
                {item}
                <button
                  onClick={() => {
                    const newArr = ((value as string[]) || []).filter((_, i) => i !== idx)
                    updateField(path, newArr)
                  }}
                  className="ml-1 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs bg-transparent"
              onClick={() => {
                const newItem = prompt("Add item:")
                if (newItem) {
                  updateField(path, [...((value as string[]) || []), newItem])
                }
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        ) : (
          <Input
            type="text"
            value={(value as string) || ""}
            onChange={(e) => updateField(path, e.target.value)}
            className="h-9"
          />
        )}
      </div>
    )
  }

  function renderToggleGroups(groups: ToggleGroup[]) {
    return (
      <div className="space-y-4">
        {groups.map((group) => {
          const isExpanded = expandedGroups[group.id] !== false

          const allEnabled = group.fields.every((field) => getFieldValue(field.path) as boolean)
          const someEnabled = group.fields.some((field) => getFieldValue(field.path) as boolean)
          const indeterminate = someEnabled && !allEnabled

          return (
            <div key={group.id} className="border rounded-lg overflow-hidden">
              <button
                className={cn(
                  "w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors",
                  allEnabled ? "bg-primary/5" : indeterminate ? "bg-muted/20" : "bg-muted/10",
                )}
                onClick={() => setExpandedGroups({ ...expandedGroups, [group.id]: !isExpanded })}
              >
                <div className="flex items-center gap-2 text-left">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={allEnabled ? "default" : indeterminate ? "secondary" : "outline"}
                    className="text-[10px] h-5"
                  >
                    {allEnabled ? "All On" : indeterminate ? "Partial" : "Off"}
                  </Badge>
                  <Switch
                    checked={allEnabled}
                    onCheckedChange={(checked) => {
                      group.fields.forEach((field) => updateField(field.path, checked))
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="p-3 grid grid-cols-2 gap-3 border-t">
                  {group.fields.map((field) => (
                    <div key={field.path} className="flex items-center justify-between">
                      <Label className="text-sm">{field.label}</Label>
                      <Switch
                        checked={getFieldValue(field.path) as boolean}
                        onCheckedChange={(checked) => updateField(field.path, checked)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  function togglePowerOnSpec(specId: string, enabled: boolean) {
    if (!localConfig) return
    const newConfig = JSON.parse(JSON.stringify(localConfig))
    const specIndex = newConfig.poweron.specs.findIndex((s: any) => s.id === specId)
    if (specIndex !== -1) {
      newConfig.poweron.specs[specIndex].enabled = enabled
      setLocalConfig(newConfig as CreditUnionConfig)
      setHasChanges(true)
    }
  }

  function updatePowerOnSpecPath(specId: string, customPath: string | undefined) {
    if (!localConfig) return
    const newConfig = JSON.parse(JSON.stringify(localConfig))
    const specIndex = newConfig.poweron.specs.findIndex((s: any) => s.id === specId)
    if (specIndex !== -1) {
      if (customPath === undefined || customPath.trim() === "") {
        delete newConfig.poweron.specs[specIndex].customPath
      } else {
        newConfig.poweron.specs[specIndex].customPath = customPath.trim()
      }
      setLocalConfig(newConfig as CreditUnionConfig)
      setHasChanges(true)
    }
  }

  function updatePowerOnCategorySetting(
    category: PowerOnCategory,
    field: "enabled" | "customPrefix",
    value: boolean | string
  ) {
    if (!localConfig?.poweron?.categorySettings) return
    const newConfig = JSON.parse(JSON.stringify(localConfig))
    const cat = newConfig.poweron.categorySettings[category]
    if (!cat) return
    if (field === "enabled") cat.enabled = value as boolean
    else cat.customPrefix = (value as string) || undefined
    setLocalConfig(newConfig as CreditUnionConfig)
    setHasChanges(true)
  }

  function setPowerOnPrefix(newPrefix: string) {
    if (!localConfig) return
    const normalized = newPrefix.toUpperCase().trim().slice(0, 5)
    const newConfig = JSON.parse(JSON.stringify(localConfig))
    const oldSpecs = newConfig.poweron.specs as Array<{ id: string; enabled: boolean; customPath?: string }>
    const freshSpecs = generatePowerOnSpecs(normalized || "SCU")
    newConfig.poweron.prefix = normalized || newConfig.poweron.prefix
    newConfig.poweron.specs = freshSpecs.map((spec, i) => {
      const old = oldSpecs[i]
      return {
        ...spec,
        enabled: old?.enabled ?? true,
        customPath: old?.customPath,
      }
    })
    setLocalConfig(newConfig as CreditUnionConfig)
    setHasChanges(true)
  }

  const filteredSpecs =
    poweronCategoryFilter === "all"
      ? localConfig.poweron.specs
      : localConfig.poweron.specs.filter((s) => s.category === poweronCategoryFilter)

  const categoryStats = Object.entries(POWERON_CATEGORIES).map(([id, cat]) => {
    const specs = localConfig.poweron.specs.filter((s) => s.category === id)
    const enabled = specs.filter((s) => s.enabled).length
    return { id, ...cat, total: specs.length, enabled }
  })

  switch (tierId) {
    case "tenant":
      return (
        <div className="space-y-6">
          <h4 className="font-medium text-sm">Credit Union Identity</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("Name", "tenant.name", "text")}
            {renderField("Charter Number", "tenant.charter_number", "text")}
            {renderField("Domain", "tenant.domain", "text")}
            {renderField("Timezone", "tenant.timezone", "select", [
              { value: "America/New_York", label: "Eastern" },
              { value: "America/Chicago", label: "Central" },
              { value: "America/Denver", label: "Mountain" },
              { value: "America/Los_Angeles", label: "Pacific" },
              { value: "America/Anchorage", label: "Alaska" },
              { value: "Pacific/Honolulu", label: "Hawaii" },
            ])}
            {renderField("Locale", "tenant.locale", "select", [
              { value: "en-US", label: "English (US)" },
              { value: "es-US", label: "Spanish (US)" },
            ])}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">Support Contact</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("Phone", "tenant.support.phone", "text")}
            {renderField("Email", "tenant.support.email", "text")}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">Legal Entity</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("Legal Name", "tenant.legal.name", "text")}
            {renderField("Routing Number", "tenant.legal.routing", "text")}
          </div>
        </div>
      )

    case "tokens":
      return (
        <div className="space-y-6">
          <h4 className="font-medium text-sm">Brand Colors</h4>
          <div className="grid grid-cols-3 gap-4">
            {renderField("Primary", "tokens.color.primary", "color")}
            {renderField("Secondary", "tokens.color.secondary", "color")}
            {renderField("Accent", "tokens.color.accent", "color")}
            {renderField("Success", "tokens.color.success", "color")}
            {renderField("Warning", "tokens.color.warning", "color")}
            {renderField("Error", "tokens.color.error", "color")}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">Typography</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("Heading Font", "tokens.typography.family.heading", "text")}
            {renderField("Body Font", "tokens.typography.family.body", "text")}
            {renderField("Mono Font", "tokens.typography.family.mono", "text")}
            {renderField("Type Scale", "tokens.typography.scale", "number")}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">Spacing & Radius</h4>
          <div className="grid grid-cols-4 gap-4">
            {renderField("Base Unit (px)", "tokens.spacing.unit", "number")}
            {renderField("Radius SM", "tokens.radius.sm", "number")}
            {renderField("Radius MD", "tokens.radius.md", "number")}
            {renderField("Radius LG", "tokens.radius.lg", "number")}
          </div>
        </div>
      )

    case "features":
      return <div className="space-y-6">{renderToggleGroups(TOGGLE_GROUPS.features)}</div>

    case "ivr":
      return (
        <div className="space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Hume EVI Integration:</strong> Configure your AI-powered voice banking agent with natural,
              emotion-aware conversations. Includes voice settings, prompts, and banking intents.
            </p>
          </div>

          <Tabs value={ivrSubTab} onValueChange={(v) => setIvrSubTab(v as "voice" | "prompts")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="voice" className="gap-2">
                <Phone className="h-3.5 w-3.5" />
                Voice Settings
              </TabsTrigger>
              <TabsTrigger value="prompts" className="gap-2">
                <Mic className="h-3.5 w-3.5" />
                Prompts & Tools
              </TabsTrigger>
            </TabsList>

            <TabsContent value="voice" className="space-y-6 mt-4">
              {renderToggleGroups(TOGGLE_GROUPS.ivr.slice(0, 3))}

              <Separator />
              <h4 className="font-medium text-sm">Voice Selection</h4>
              <div className="grid grid-cols-2 gap-4">
                {renderField("EVI Version", "ivr_voice.evi_version", "select", [
                  { value: "3", label: "EVI 3 (Recommended)" },
                  { value: "4-mini", label: "EVI 4-mini (Faster)" },
                ])}
                {renderField("Voice Provider", "ivr_voice.voice.provider", "select", [
                  { value: "HUME_AI", label: "Hume AI Library" },
                  { value: "CUSTOM", label: "Custom Cloned Voice" },
                ])}
                {renderField("Voice Name", "ivr_voice.voice.name", "select", [
                  { value: "Serene Assistant", label: "Serene Assistant" },
                  { value: "Spanish Instructor", label: "Spanish Instructor" },
                  { value: "Fastidious Robo-Butler", label: "Fastidious Robo-Butler" },
                  { value: "Confident Broadcaster", label: "Confident Broadcaster" }, // Changed from Warm Professional
                ])}
              </div>

              <Separator />
              <h4 className="font-medium text-sm">Language Model</h4>
              <div className="grid grid-cols-2 gap-4">
                {renderField("Model Provider", "ivr_voice.language_model.model_provider", "select", [
                  { value: "ANTHROPIC", label: "Anthropic" },
                  { value: "OPENAI", label: "OpenAI" },
                  { value: "HUME_AI", label: "Hume AI" },
                  { value: "GOOGLE", label: "Google" },
                ])}
                {renderField("Model Resource", "ivr_voice.language_model.model_resource", "select", [
                  { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
                  { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
                  { value: "gpt-4o", label: "GPT-4o" },
                  { value: "hume-evi-3", label: "Hume EVI 3" },
                ])}
              </div>

              <Separator />
              <h4 className="font-medium text-sm">Timing</h4>
              <div className="grid grid-cols-3 gap-4">
                {renderField("Nudge Interval (sec)", "ivr_voice.nudges.interval_secs", "number")}
                {renderField("Inactivity Timeout (sec)", "ivr_voice.timeouts.inactivity.duration_secs", "number")}
                {renderField("Max Call Duration (sec)", "ivr_voice.timeouts.max_duration.duration_secs", "number")}
              </div>

              <Separator />
              <h4 className="font-medium text-sm">Twilio Phone</h4>
              <div className="grid grid-cols-2 gap-4">
                {renderField("Twilio Enabled", "ivr_voice.twilio.enabled", "boolean")}
                {renderField("Phone Number", "ivr_voice.twilio.phone_number", "text")}
                {renderField("Fallback Number", "ivr_voice.twilio.fallback_number", "text")}
              </div>
            </TabsContent>

            <TabsContent value="prompts" className="space-y-6 mt-4">
              <h4 className="font-medium text-sm">System Prompt</h4>
              <div className="space-y-2">
                {renderField("Version", "ivr_prompts.system_prompt.version", "number")}
                <Label className="text-sm">Prompt Text</Label>
                <Textarea
                  value={localConfig.ivr_prompts?.system_prompt?.text || ""}
                  onChange={(e) => updateField("ivr_prompts.system_prompt.text", e.target.value)}
                  rows={10}
                  className="font-mono text-xs"
                  placeholder="You are a friendly and professional banking assistant for {cu_name}..." // Updated placeholder
                />
                <p className="text-[10px] text-muted-foreground">
                  Tip: Use {"{{cu_name}}"}, {"{{member_name}}"} for dynamic values
                </p>
              </div>

              <Separator />
              {renderToggleGroups(TOGGLE_GROUPS.ivr.slice(3))}

              <Separator />
              <h4 className="font-medium text-sm">Event Messages</h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Greeting Message</Label>
                  <Input
                    value={localConfig.ivr_prompts?.event_messages?.on_new_chat?.message || ""}
                    onChange={(e) => updateField("ivr_prompts.event_messages.on_new_chat.message", e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Farewell Message</Label>
                  <Input
                    value={localConfig.ivr_prompts?.event_messages?.on_disconnect?.message || ""}
                    onChange={(e) => updateField("ivr_prompts.event_messages.on_disconnect.message", e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Transfer Message</Label>
                  <Input
                    value={localConfig.ivr_prompts?.event_messages?.on_transfer?.message || ""}
                    onChange={(e) => updateField("ivr_prompts.event_messages.on_transfer.message", e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              <Separator />
              <h4 className="font-medium text-sm">Escalation Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                {renderField("Enabled", "ivr_prompts.escalation.enabled", "boolean")}
                {renderField("Max Failed Attempts", "ivr_prompts.escalation.max_attempts", "number")}
                {renderField("Transfer Number", "ivr_prompts.escalation.transfer_number", "text")}
              </div>

              <Separator />
              <h4 className="font-medium text-sm">Call Recording</h4>
              <div className="grid grid-cols-2 gap-4">
                {renderField("Recording Enabled", "ivr_prompts.call_recording.enabled", "boolean")}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Disclosure Message</Label>
                <Input
                  value={localConfig.ivr_prompts?.call_recording?.disclosure_message || ""}
                  onChange={(e) => updateField("ivr_prompts.call_recording.disclosure_message", e.target.value)}
                  className="h-9"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )

    case "products":
      return <div className="space-y-6">{renderToggleGroups(TOGGLE_GROUPS.products)}</div>

    case "rules":
      return (
        <div className="space-y-6">
          <h4 className="font-medium text-sm">Transfer Limits (Daily)</h4>
          <div className="grid grid-cols-3 gap-4">
            {renderField("Internal", "rules.transfer.internal.daily_limit", "number")}
            {renderField("External", "rules.transfer.external.daily_limit", "number")}
            {renderField("P2P", "rules.transfer.p2p.daily_limit", "number")}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">Transaction Limits</h4>
          <div className="grid grid-cols-3 gap-4">
            {renderField("Mobile Deposit", "rules.mobile_deposit.per_check_limit", "number")}
            {renderField("Daily Mobile Deposit", "rules.mobile_deposit.daily_limit", "number")}
            {renderField("ATM Withdrawal", "rules.atm.daily_withdrawal", "number")}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">Session & Security</h4>
          <div className="grid grid-cols-3 gap-4">
            {renderField("Session Timeout (min)", "rules.session.timeout_minutes", "number")}
            {renderField("Max Login Attempts", "rules.lockout.attempts", "number")}
            {renderField("Lockout Duration (min)", "rules.lockout.duration_minutes", "number")}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">Password Requirements</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("Min Length", "rules.password.min_length", "number")}
            {renderField("Require Special Char", "rules.password.require_special", "boolean")}
            {renderField("Require Number", "rules.password.require_number", "boolean")}
            {renderField("Require Uppercase", "rules.password.require_uppercase", "boolean")}
          </div>
        </div>
      )

    case "fraud":
      return (
        <div className="space-y-6">
          {renderToggleGroups(TOGGLE_GROUPS.fraud)}

          <Separator />
          <h4 className="font-medium text-sm">Risk Thresholds (0-100)</h4>
          <div className="grid grid-cols-3 gap-4">
            {renderField("Block Score", "fraud.risk_threshold.block", "number")}
            {renderField("Review Score", "fraud.risk_threshold.review", "number")}
            {renderField("Step-up Score", "fraud.risk_threshold.step_up", "number")}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">Velocity Limits</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("Transactions/Hour", "fraud.velocity.tx_per_hour", "number")}
            {renderField("Transactions/Day", "fraud.velocity.tx_per_day", "number")}
            {renderField("Amount/Hour ($)", "fraud.velocity.amount_per_hour", "number")}
            {renderField("Amount/Day ($)", "fraud.velocity.amount_per_day", "number")}
          </div>
        </div>
      )

    case "compliance":
      return (
        <div className="space-y-6">
          {renderToggleGroups(TOGGLE_GROUPS.compliance)}

          <Separator />
          <h4 className="font-medium text-sm">KYC Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("KYC Provider", "compliance.kyc.provider", "select", [
              { value: "internal", label: "Internal" },
              { value: "jumio", label: "Jumio" },
              { value: "onfido", label: "Onfido" },
              { value: "persona", label: "Persona" },
            ])}
            {renderField("KYC Level", "compliance.kyc.level", "select", [
              { value: "basic", label: "Basic" },
              { value: "cip", label: "CIP" },
              { value: "enhanced", label: "Enhanced" },
            ])}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">Audit Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("Retention (years)", "compliance.audit.retention_years", "number")}
            {renderField("CTR Threshold ($)", "compliance.ctr.threshold", "number")}
          </div>
        </div>
      )

    case "integrations":
      return (
        <div className="space-y-6">
          <h4 className="font-medium text-sm">Core Banking</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("Provider", "integrations.core.provider", "select", [
              { value: "symitar", label: "Symitar (Jack Henry)" },
              { value: "corelation", label: "Corelation KeyStone" },
              { value: "dna", label: "Fiserv DNA" },
              { value: "silverlake", label: "Jack Henry SilverLake" },
              { value: "xp2", label: "Fiserv XP2" },
            ])}
            {renderField("Host", "integrations.core.host", "text")}
            {renderField("Environment", "integrations.core.environment", "select", [
              { value: "development", label: "Development" },
              { value: "staging", label: "Staging" },
              { value: "production", label: "Production" },
            ])}
            {renderField("Timeout (ms)", "integrations.core.timeout_ms", "number")}
            {renderField("Retry Attempts", "integrations.core.retry_attempts", "number")}
          </div>
          
          {/* PowerOn Credentials Section */}
          <Separator className="my-4" />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">PowerOn / Symitar Credentials</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Enter credentials here to connect to your core banking system. All channels (IVR, Mobile, Web, Chat) use these credentials automatically.
            </p>
            
            {renderField("Connection Mode", "integrations.core.poweron.mode", "select", [
              { value: "mock", label: "Mock (Test Data)" },
              { value: "symxchange", label: "SymXchange API (Jack Henry)" },
              { value: "direct", label: "Direct PowerOn Connection" },
            ])}
            
            {/* SymXchange Fields */}
            {getFieldValue("integrations.core.poweron.mode") === "symxchange" && (
              <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                <Label className="text-sm font-medium text-primary">SymXchange API (Jack Henry)</Label>
                {renderField("SymXchange URL", "integrations.core.poweron.symxchange_url", "text")}
                {renderField("SymXchange API Key", "integrations.core.poweron.symxchange_api_key", "text")}
                {renderField("Institution ID", "integrations.core.poweron.institution_id", "text")}
              </div>
            )}
            
            {/* Direct Connection Fields */}
            {getFieldValue("integrations.core.poweron.mode") === "direct" && (
              <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                <Label className="text-sm font-medium text-primary">Direct PowerOn Connection</Label>
                {renderField("PowerOn Host", "integrations.core.poweron.poweron_host", "text")}
                {renderField("PowerOn Port", "integrations.core.poweron.poweron_port", "number")}
                {renderField("Institution ID", "integrations.core.poweron.institution_id", "text")}
                {renderField("Device Number", "integrations.core.poweron.device_number", "number")}
                {renderField("Device Type", "integrations.core.poweron.device_type", "text")}
                {renderField("Processor User", "integrations.core.poweron.processor_user", "text")}
                {renderField("Certificate Thumbprint", "integrations.core.poweron.certificate_thumbprint", "text")}
              </div>
            )}
            
            {/* Test Connection Button */}
            {(getFieldValue("integrations.core.poweron.mode") === "symxchange" || 
              getFieldValue("integrations.core.poweron.mode") === "direct") && (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    // Test connection logic would go here
                    alert("Connection test feature coming soon. This will validate your credentials before saving.")
                  }}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
              </div>
            )}
          </div>
          
          <Separator />
          <h4 className="font-medium text-sm">Card Processor</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("Provider", "integrations.card_processor.provider", "select", [
              { value: "fiserv", label: "Fiserv" },
              { value: "fis", label: "FIS" },
              { value: "pscu", label: "PSCU" },
              { value: "co-op", label: "CO-OP" },
            ])}
            {renderField("BIN", "integrations.card_processor.bin", "text")}
            {renderField("Endpoint", "integrations.card_processor.endpoint", "text")}
            {renderField("API Key", "integrations.card_processor.api_key", "text")}
            {renderField("Merchant ID", "integrations.card_processor.merchant_id", "text")}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">Payment Networks</h4>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            {renderField("RTP Enabled", "integrations.rtp.enabled", "boolean")}
            {renderField("FedNow Enabled", "integrations.fednow.enabled", "boolean")}
            {renderField("Shared Branching", "integrations.shared_branching.enabled", "boolean")}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">Hume AI (Voice IVR)</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("Enabled", "integrations.hume.enabled", "boolean")}
            {renderField("Project ID", "integrations.hume.project_id", "text")}
            {renderField("Hume API Key", "integrations.hume.api_key", "text")}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">Messaging</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("SMS Provider", "integrations.sms.provider", "select", [
              { value: "twilio", label: "Twilio" },
              { value: "vonage", label: "Vonage" },
              { value: "bandwidth", label: "Bandwidth" },
            ])}
            {renderField("SMS From Number", "integrations.sms.from_number", "text")}
            {renderField("SMS API Key", "integrations.sms.api_key", "text")}
            {renderField("SMS API Secret", "integrations.sms.api_secret", "text")}
            {renderField("Email Provider", "integrations.email.provider", "select", [
              { value: "sendgrid", label: "SendGrid" },
              { value: "ses", label: "Amazon SES" },
              { value: "postmark", label: "Postmark" },
            ])}
            {renderField("Email From Address", "integrations.email.from_address", "text")}
            {renderField("Email API Key", "integrations.email.api_key", "text")}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">Authentication (OAuth/Identity)</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("Provider", "integrations.auth.provider", "select", [
              { value: "internal", label: "Internal" },
              { value: "auth0", label: "Auth0" },
              { value: "okta", label: "Okta" },
              { value: "azure_ad", label: "Azure AD" },
            ])}
            {renderField("Base URL", "integrations.auth.base_url", "text")}
            {renderField("Client ID", "integrations.auth.client_id", "text")}
            {renderField("Client Secret", "integrations.auth.client_secret", "text")}
            {renderField("Redirect URI", "integrations.auth.redirect_uri", "text")}
          </div>
          
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">Transaction Enrichment (MX Replacement)</h4>
              <Badge variant="secondary" className="ml-2">Save $49,940/year</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Automatically enrich all transactions with cleaned descriptions, merchant names, categories, and subscription detection. Replaces MX.com's $50K/year service with our $5/month edge computing solution.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {renderField("Enabled", "integrations.transaction_enrichment.enabled", "boolean")}
              {renderField("Provider", "integrations.transaction_enrichment.provider", "select", [
                { value: "internal", label: "Internal (CU.APP Edge - $5/month)" },
                { value: "mx", label: "MX.com ($50K/year)" },
                { value: "plaid", label: "Plaid" },
                { value: "disabled", label: "Disabled" },
              ])}
            </div>
            
            {getFieldValue("integrations.transaction_enrichment.provider") === "internal" && (
              <div className="space-y-3 pl-4 border-l-2 border-primary/20 mt-3">
                <Label className="text-sm font-medium text-primary">CU.APP Edge Service</Label>
                {renderField("Worker URL", "integrations.transaction_enrichment.worker_url", "text")}
                {renderField("API Key", "integrations.transaction_enrichment.api_key", "text")}
                <p className="text-xs text-muted-foreground mt-2">
                  Uses Cloudflare Workers edge computing. &lt;50ms latency, $5/month for 10M requests. Saves $49,940/year vs MX.
                </p>
              </div>
            )}
            
            {getFieldValue("integrations.transaction_enrichment.provider") === "mx" && (
              <div className="space-y-3 pl-4 border-l-2 border-primary/20 mt-3">
                <Label className="text-sm font-medium text-primary">MX.com Integration</Label>
                {renderField("MX API Key", "integrations.transaction_enrichment.mx_api_key", "text")}
                <p className="text-xs text-muted-foreground mt-2">
                  Using MX.com service. Cost: $50,000/year.
                </p>
              </div>
            )}
            
            {getFieldValue("integrations.transaction_enrichment.provider") === "plaid" && (
              <div className="space-y-3 pl-4 border-l-2 border-primary/20 mt-3">
                <Label className="text-sm font-medium text-primary">Plaid Integration</Label>
                {renderField("Plaid Client ID", "integrations.transaction_enrichment.plaid_client_id", "text")}
              </div>
            )}
          </div>
        </div>
      )

    case "channels":
      return (
        <div className="space-y-6">
          {renderToggleGroups(TOGGLE_GROUPS.channels)}

          <Separator />
          <h4 className="font-medium text-sm">Mobile App Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("iOS App Store ID", "channels.mobile.ios.app_store_id", "text")}
            {renderField("iOS Min Version", "channels.mobile.ios.min_version", "text")}
            {renderField("Android Play Store ID", "channels.mobile.android.play_store_id", "text")}
            {renderField("Android Min Version", "channels.mobile.android.min_version", "text")}
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">IVR Settings</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {renderField("IVR Phone Number", "channels.ivr.phone_number", "text")}
              {renderField("Voice Biometrics", "channels.ivr.voice_biometrics", "boolean")}
              {renderField("Callback Option", "channels.ivr.callback", "boolean")}
            </div>
            
            <Separator />
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium text-primary">PowerOn Specs (139 total; 36 IVR)</Label>
              </div>
              {renderField("Enable PowerOn Specs", "channels.ivr.poweron_specs.enabled", "boolean")}
              {getFieldValue("channels.ivr.poweron_specs.enabled") && (
                <>
                  {renderField("Use All IVR PowerOn Specs", "channels.ivr.poweron_specs.use_all_specs", "boolean")}
                  <p className="text-xs text-muted-foreground">
                    Full PowerOn set (139) is configured in the PowerOn tier; IVR uses 36 (e.g. SCU.IVR.BYID.PRO, SCU.IVR.LOOKUP.SUB).
                  </p>
                </>
              )}
            </div>
            
            <Separator />
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium text-primary">Hume AI Voice IVR</Label>
              </div>
              {renderField("Hume Enabled", "channels.ivr.hume.enabled", "boolean")}
              {getFieldValue("channels.ivr.hume.enabled") && (
                <>
                  {renderField("EVI Version", "channels.ivr.hume.evi_version", "select", [
                    { value: "3", label: "EVI 3 (Recommended)" },
                    { value: "4-mini", label: "EVI 4-mini (Faster)" },
                  ])}
                  {renderField("Hume Config ID", "channels.ivr.hume.config_id", "text")}
                  {renderField("Webhook URL", "channels.ivr.hume.webhook_url", "text")}
                  <p className="text-xs text-muted-foreground">
                    Webhook URL: /api/ivr/hume-webhook (auto-configured when Hume credentials are set in Integrations)
                  </p>
                </>
              )}
            </div>
            
            <Separator />
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium text-primary">Twilio Configuration</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Twilio credentials are loaded from Integrations → SMS. Configure your 813 area code number there.
              </p>
              {renderField("Twilio Phone Number", "channels.ivr.twilio.phone_number", "text")}
              <p className="text-xs text-muted-foreground">
                Enter your Twilio phone number (e.g., +1813XXXXXXX). Credentials from Integrations → SMS are used automatically.
              </p>
            </div>
          </div>
        </div>
      )

    case "notifications":
      return (
        <div className="space-y-6">
          {renderToggleGroups(TOGGLE_GROUPS.notifications)}
          <Separator />
          <h4 className="font-medium text-sm">Thresholds</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("Large Transaction ($)", "notifications.transaction.large_threshold", "number")}
            {renderField("Low Balance ($)", "notifications.balance.low_threshold", "number")}
            {renderField("Payment Due (days before)", "notifications.payment.due_days_before", "number")}
          </div>
        </div>
      )

    case "marketing":
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-medium text-sm">Marketing Website CMS</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Edit your credit union's marketing website content. Changes are published instantly.
              </p>
            </div>
            {renderField("Enabled", "marketing.enabled", "boolean")}
          </div>
          
          {getFieldValue("marketing.enabled") && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-sm">Homepage Content</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {renderField("Hero Title", "marketing.homepage.hero.title", "text")}
                  {renderField("Hero Subtitle", "marketing.homepage.hero.subtitle", "textarea")}
                  {renderField("CTA Button Text", "marketing.homepage.hero.ctaText", "text")}
                  {renderField("CTA Button Link", "marketing.homepage.hero.ctaLink", "text")}
                  {renderField("Background Image URL", "marketing.homepage.hero.backgroundImage", "text")}
                </div>
                
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <h4 className="font-medium text-sm">SEO & Meta Tags</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {renderField("Page Title", "marketing.homepage.pageTitle", "text")}
                    {renderField("Meta Description", "marketing.homepage.pageDescription", "textarea")}
                    {renderField("OG Image URL", "marketing.homepage.ogImage", "text")}
                  </div>
                </div>
                
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <h4 className="font-medium text-sm">Media Library</h4>
                    </div>
                    <Button type="button" variant="outline" size="sm">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Upload Media
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload images, videos, and documents for use in your marketing pages.
                  </p>
                </div>
                
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <h4 className="font-medium text-sm">Pages</h4>
                    </div>
                    <Button type="button" variant="outline" size="sm">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      New Page
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Create and manage additional marketing pages (About, Products, Contact, etc.)
                  </p>
                </div>
                
                <Separator />
                  <Separator />
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <h4 className="font-medium text-sm">Site URL</h4>
                    </div>
                    {renderField("Marketing Site URL", "marketing.site_url", "text")}
                    <p className="text-xs text-muted-foreground mt-2">
                      Your marketing site will be available at this URL. Leave empty for auto-generated subdomain (e.g., {`{tenant_id}.cuapp.com`}).
                    </p>
                    <div className="mt-3 p-2 bg-background rounded border border-primary/20">
                      <p className="text-xs font-medium text-primary mb-1">💡 Tip</p>
                      <p className="text-xs text-muted-foreground">
                        Preview your site in real-time: Click "Marketing Site" in the left menu.
                      </p>
                    </div>
                  </div>
              </div>
            </>
          )}
        </div>
      )

    case "content":
      return (
        <div className="space-y-6">
          <h4 className="font-medium text-sm">Branding</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("App Name", "content.app_name", "text")}
            {renderField("Tagline", "content.tagline", "text")}
            {renderField("Member Term", "content.member_term", "select", [
              { value: "member", label: "Member" },
              { value: "customer", label: "Customer" },
            ])}
            {renderField("Share Term", "content.share_term", "select", [
              { value: "account", label: "Account" },
              { value: "share", label: "Share" },
            ])}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">Messages</h4>
          {renderField("Welcome Message", "content.welcome_message", "textarea")}
          {renderField("Onboarding Headline", "content.onboarding.headline", "text")}
          <Separator />
          <h4 className="font-medium text-sm">Error Messages</h4>
          <div className="space-y-4">
            {renderField("Generic Error", "content.error.generic", "textarea")}
            {renderField("Network Error", "content.error.network", "textarea")}
            {renderField("Session Error", "content.error.session", "textarea")}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">MX App Screens</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Override title, subtitle, and visibility for each MX app screen.
          </p>
          <div className="space-y-4">
            {[
              "dashboard",
              "accounts",
              "transfers",
              "bill_pay",
              "connect",
              "goals",
              "income",
              "spending",
              "net_worth",
              "locations",
              "rdc",
              "settings",
              "account_details",
              "manage_accounts",
              "payment_input",
              "amount_picker",
              "date_picker",
              "confirmation",
              "frequency_picker",
              "empty_states",
              "placeholder",
            ].map((screenId) => (
              <div
                key={screenId}
                ref={selectedScreenId === screenId ? screenRowRef : undefined}
                className="grid grid-cols-2 gap-4 rounded-lg border p-3"
              >
                <span className="col-span-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{screenId}</span>
                  {onInspectScreen && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onInspectScreen(screenId)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Inspect
                    </Button>
                  )}
                </span>
                {renderField("Title", `content.screens.${screenId}.title`, "text")}
                {renderField("Subtitle", `content.screens.${screenId}.subtitle`, "text")}
                {renderField("Enabled", `content.screens.${screenId}.enabled`, "boolean")}
              </div>
            ))}
          </div>
        </div>
      )

    case "ucx":
      return (
        <div className="space-y-6">
          <h4 className="font-medium text-sm">UCX Settings</h4>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            {renderField("Enabled", "ucx.enabled", "boolean")}
            {renderField("Consent Dialog", "ucx.consent_dialog", "boolean")}
            {renderField("Auto Deploy", "ucx.auto_deploy", "boolean")}
            {renderField("Approval Required", "ucx.approval_required", "boolean")}
            {renderField("Feedback Collection", "ucx.feedback_collection", "boolean")}
            {renderField("Sentiment Analysis", "ucx.sentiment_analysis", "boolean")}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">Thresholds</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("Error Threshold", "ucx.error_threshold", "number")}
            {renderField("Rollback Threshold", "ucx.rollback_threshold", "number")}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">GitHub</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("Repository", "ucx.github_repo", "text")}
            {renderField("Branch", "ucx.github_branch", "text")}
            {renderField("Deploy Hook", "ucx.deploy_hook", "text")}
          </div>
        </div>
      )

    case "ai":
      return (
        <div className="space-y-6">
          <h4 className="font-medium text-sm">AI Coach</h4>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            {renderField("Enabled", "ai.coach.enabled", "boolean")}
            {renderField("Proactive", "ai.coach.proactive", "boolean")}
            {renderField("Spending Insights", "ai.coach.spending_insights", "boolean")}
            {renderField("Budget Enforcement", "ai.coach.budget_enforcement", "boolean")}
            {renderField("Goal Tracking", "ai.coach.goal_tracking", "boolean")}
            {renderField("Financial Literacy", "ai.coach.financial_literacy", "boolean")}
            {renderField("Use Emojis", "ai.coach.emoji_use", "boolean")}
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            {renderField("Coach Name", "ai.coach.name", "text")}
            {renderField("Personality", "ai.coach.personality", "select", [
              { value: "supportive", label: "Supportive" },
              { value: "direct", label: "Direct" },
              { value: "educational", label: "Educational" },
              { value: "motivational", label: "Motivational" },
            ])}
            {renderField("Tone", "ai.coach.tone", "select", [
              { value: "professional", label: "Professional" },
              { value: "casual", label: "Casual" },
              { value: "friendly", label: "Friendly" },
            ])}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">AI Support</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("Enabled", "ai.support.enabled", "boolean")}
            {renderField("After Hours", "ai.support.after_hours", "boolean")}
            {renderField("Escalation Threshold", "ai.support.escalation_threshold", "number")}
          </div>
        </div>
      )

    case "deploy":
      return (
        <div className="space-y-6">
          <h4 className="font-medium text-sm">Environment</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("Environment", "deploy.environment", "select", [
              { value: "development", label: "Development" },
              { value: "staging", label: "Staging" },
              { value: "production", label: "Production" },
            ])}
            {renderField("Region", "deploy.region", "text")}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">Endpoints</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("CDN", "deploy.cdn", "text")}
            {renderField("API", "deploy.api", "text")}
            {renderField("Edge", "deploy.edge", "text")}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">Database</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("Host", "deploy.database.host", "text")}
            {renderField("Pool Size", "deploy.database.pool_size", "number")}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">Cache</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("Provider", "deploy.cache.provider", "select", [
              { value: "redis", label: "Redis" },
              { value: "memcached", label: "Memcached" },
              { value: "cloudflare", label: "Cloudflare" },
            ])}
            {renderField("TTL (seconds)", "deploy.cache.ttl_seconds", "number")}
          </div>
          <Separator />
          <h4 className="font-medium text-sm">Logging</h4>
          <div className="grid grid-cols-2 gap-4">
            {renderField("Level", "deploy.logging.level", "select", [
              { value: "debug", label: "Debug" },
              { value: "info", label: "Info" },
              { value: "warn", label: "Warn" },
              { value: "error", label: "Error" },
            ])}
            {renderField("Retention (days)", "deploy.logging.retention_days", "number")}
          </div>
        </div>
      )

    case "poweron": {
      const poweronSpecs = localConfig.poweron.specs ?? []
      const poweronCategorySettings = localConfig.poweron.categorySettings ?? ({} as Record<PowerOnCategory, { enabled: boolean; customPrefix?: string }>)
      return (
        <div className="space-y-6">
          <div className="bg-muted/30 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium">PowerOn Spec Prefix</span>
              <Input
                value={localConfig.poweron.prefix}
                onChange={(e) => setPowerOnPrefix(e.target.value)}
                className="h-8 w-24 font-mono text-xs"
                maxLength={5}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium">Base Path</span>
              <Input
                value={localConfig.poweron.basePath ?? ""}
                onChange={(e) => updateField("poweron.basePath", e.target.value)}
                className="h-8 flex-1 font-mono text-xs"
                placeholder="e.g. SCU"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              3-5 letter prefix for all PowerOn specfiles (e.g., &quot;NFCU&quot; for Navy Federal). Changing prefix regenerates all 139 specs.
            </p>
          </div>

          {/* Category settings: enable/disable and optional customPrefix per category */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Category Settings</h4>
            <p className="text-xs text-muted-foreground">Enable or disable entire categories and set an optional custom prefix per category.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2 bg-muted/20">
              {(Object.entries(POWERON_CATEGORIES) as [PowerOnCategory, { name: string; specCount: number }][]).map(([catId, meta]) => {
                const setting = poweronCategorySettings[catId] ?? { enabled: true }
                return (
                  <div key={catId} className="flex items-center gap-2 flex-wrap">
                    <Switch
                      checked={setting.enabled}
                      onCheckedChange={(checked) => updatePowerOnCategorySetting(catId, "enabled", checked)}
                    />
                    <span className="text-xs font-medium flex-1">{meta.name}</span>
                    <Input
                      placeholder="Prefix"
                      className="h-7 w-20 font-mono text-[10px]"
                      value={setting.customPrefix ?? ""}
                      onChange={(e) => updatePowerOnCategorySetting(catId, "customPrefix", e.target.value)}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button
              size="sm"
              variant={poweronCategoryFilter === "all" ? "default" : "outline"}
              onClick={() => setPoweronCategoryFilter("all")}
              className="whitespace-nowrap bg-transparent"
            >
              All ({poweronSpecs.filter((s) => s.enabled).length}/{poweronSpecs.length})
            </Button>
            {categoryStats.map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={poweronCategoryFilter === cat.id ? "default" : "outline"}
                onClick={() => setPoweronCategoryFilter(cat.id as PowerOnCategory | "all")}
                className="whitespace-nowrap bg-transparent"
              >
                {cat.name} ({cat.enabled}/{cat.total})
              </Button>
            ))}
          </div>

          {poweronSpecs.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              <p className="text-sm mb-2">No PowerOn specs loaded. Generate all 139 specs from the prefix above.</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPowerOnPrefix(localConfig.poweron.prefix || "SCU")}
              >
                Generate 139 specs from prefix
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredSpecs.map((spec) => (
                <div
                  key={spec.id}
                  className={cn(
                    "flex flex-col gap-1 p-2 rounded border",
                    spec.enabled ? "bg-primary/5 border-primary/20" : "bg-muted/30",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{spec.name}</code>
                        <Badge variant="outline" className="text-[10px]">
                          {spec.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {spec.customPath ?? spec.path}
                      </p>
                    </div>
                    <Switch checked={spec.enabled} onCheckedChange={(checked) => togglePowerOnSpec(spec.id, checked)} />
                  </div>
                  <div className="pl-1">
                    <Input
                      placeholder="Custom path override (optional)"
                      className="h-7 text-xs font-mono"
                      value={spec.customPath ?? ""}
                      onChange={(e) => updatePowerOnSpecPath(spec.id, e.target.value || undefined)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    default:
      return (
        <div className="p-8 text-center text-muted-foreground">
          <p>Select a configuration tier to edit</p>
        </div>
      )
  }
}

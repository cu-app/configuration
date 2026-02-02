"use client"

import { useState } from "react"
import { CheckCircle2, Circle, Smartphone, Monitor, Server, Search, HelpCircle, ArrowUpDown } from "lucide-react"
import { Card, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { CreditUnionData } from "@/lib/credit-union-data"

interface FieldMapping {
  field: string
  name: string
  target: "member" | "employee" | "both" | "infra"
  connected: boolean
  critical: boolean
  helper: string
  dartPath?: string
  webPath?: string
}

// Complete field mappings organized by tier (tab)
const FIELD_MAPPINGS: Record<string, FieldMapping[]> = {
  Identity: [
    {
      field: "tenant.id",
      name: "Tenant ID",
      target: "both",
      connected: true,
      critical: true,
      helper: "Unique identifier for this CU. Used by both apps to fetch correct data and route API calls.",
      dartPath: "lib/config/tenant.dart",
      webPath: "lib/config.ts",
    },
    {
      field: "tenant.name",
      name: "CU Name",
      target: "both",
      connected: true,
      critical: true,
      helper:
        "Official name shown in app headers, welcome screens, and receipts. Members see this every time they open the app.",
      dartPath: "lib/config/tenant.dart",
      webPath: "components/header.tsx",
    },
    {
      field: "tenant.charter",
      name: "Charter #",
      target: "employee",
      connected: true,
      critical: false,
      helper: "NCUA charter number for regulatory compliance. Only employees need this for verification.",
      webPath: "lib/config.ts",
    },
    {
      field: "tenant.domain",
      name: "Domain",
      target: "both",
      connected: true,
      critical: true,
      helper: "Primary domain used to construct API URLs. Example: navyfederal.org → api.navyfederal.org",
      dartPath: "lib/config/api.dart",
      webPath: "lib/api.ts",
    },
    {
      field: "tenant.timezone",
      name: "Timezone",
      target: "both",
      connected: true,
      critical: true,
      helper: "All transaction timestamps use this. Critical for scheduled transfers and payment due dates.",
      dartPath: "lib/utils/dates.dart",
      webPath: "lib/utils/dates.ts",
    },
    {
      field: "tenant.support.phone",
      name: "Support Phone",
      target: "both",
      connected: true,
      critical: true,
      helper: "Members tap to call from the app. Employees see it for quick reference. Must be dialable.",
      dartPath: "lib/screens/support.dart",
      webPath: "components/support.tsx",
    },
    {
      field: "tenant.support.email",
      name: "Support Email",
      target: "both",
      connected: true,
      critical: false,
      helper: "Email address for member support requests. Opens email app when tapped.",
      dartPath: "lib/screens/support.dart",
      webPath: "components/contact.tsx",
    },
    {
      field: "tenant.legal.routing",
      name: "Routing #",
      target: "both",
      connected: true,
      critical: true,
      helper: "9-digit ABA routing number. Members need this for direct deposit setup.",
      dartPath: "lib/screens/accounts.dart",
      webPath: "components/account-info.tsx",
    },
  ],
  Design: [
    {
      field: "tokens.color.primary",
      name: "Primary Color",
      target: "both",
      connected: true,
      critical: true,
      helper: "Main brand color for buttons, links, and headers. Used everywhere in both apps.",
      dartPath: "lib/theme/colors.dart",
      webPath: "app/globals.css",
    },
    {
      field: "tokens.color.secondary",
      name: "Secondary Color",
      target: "both",
      connected: true,
      critical: false,
      helper: "Supporting color for less prominent elements and card backgrounds.",
      dartPath: "lib/theme/colors.dart",
      webPath: "app/globals.css",
    },
    {
      field: "tokens.color.success",
      name: "Success Color",
      target: "both",
      connected: true,
      critical: true,
      helper: "Green for successful transactions, deposits (+$100), confirmations.",
      dartPath: "lib/theme/colors.dart",
      webPath: "app/globals.css",
    },
    {
      field: "tokens.color.error",
      name: "Error Color",
      target: "both",
      connected: true,
      critical: true,
      helper: "Red for negative balances, declined transactions, overdrawn alerts.",
      dartPath: "lib/theme/colors.dart",
      webPath: "app/globals.css",
    },
    {
      field: "tokens.logo.primary",
      name: "Logo URL",
      target: "both",
      connected: true,
      critical: true,
      helper: "Full logo image URL. Shows on login, splash screen, and header.",
      dartPath: "lib/config/branding.dart",
      webPath: "components/logo.tsx",
    },
    {
      field: "tokens.typography.heading",
      name: "Heading Font",
      target: "both",
      connected: true,
      critical: false,
      helper: "Font for titles like 'Good morning, Darlene' and account names.",
      dartPath: "lib/theme/typography.dart",
      webPath: "app/layout.tsx",
    },
    {
      field: "tokens.typography.body",
      name: "Body Font",
      target: "both",
      connected: true,
      critical: false,
      helper: "Font for all body text. Must be highly readable.",
      dartPath: "lib/theme/typography.dart",
      webPath: "app/layout.tsx",
    },
    {
      field: "tokens.radius.md",
      name: "Border Radius",
      target: "both",
      connected: true,
      critical: false,
      helper: "Corner rounding for buttons and cards. Higher = more rounded.",
      dartPath: "lib/theme/borders.dart",
      webPath: "app/globals.css",
    },
  ],
  Features: [
    {
      field: "features.mobile_deposit",
      name: "Mobile Deposit",
      target: "member",
      connected: true,
      critical: true,
      helper: "Shows/hides 'Deposit a Check' button. When OFF, members can't deposit checks via app.",
      dartPath: "lib/features/rdc.dart",
    },
    {
      field: "features.bill_pay",
      name: "Bill Pay",
      target: "member",
      connected: true,
      critical: true,
      helper: "Shows/hides 'Pay Bills' tab in bottom nav. Affects navigation structure.",
      dartPath: "lib/features/billpay.dart",
    },
    {
      field: "features.p2p",
      name: "P2P Transfers",
      target: "member",
      connected: true,
      critical: false,
      helper: "Enables sending money to other people by phone/email.",
      dartPath: "lib/features/p2p.dart",
    },
    {
      field: "features.card_controls",
      name: "Card Controls",
      target: "member",
      connected: true,
      critical: true,
      helper: "Lets members freeze/unfreeze cards instantly. Critical security feature.",
      dartPath: "lib/features/cards.dart",
    },
    {
      field: "features.joint_access",
      name: "Joint Accounts",
      target: "member",
      connected: true,
      critical: true,
      helper: "Shows 'My Savings' / 'Joint Savings' toggle in account sections.",
      dartPath: "lib/features/joint.dart",
    },
    {
      field: "features.account_opening",
      name: "Open & Apply",
      target: "member",
      connected: true,
      critical: false,
      helper: "Shows 'Open & Apply' quick action. Hidden for youth accounts.",
      dartPath: "lib/features/opening.dart",
    },
    {
      field: "features.face_id",
      name: "Face ID",
      target: "member",
      connected: true,
      critical: true,
      helper: "Enables biometric login on iOS. Members strongly prefer this.",
      dartPath: "lib/auth/biometrics.dart",
    },
    {
      field: "features.dark_mode",
      name: "Dark Mode",
      target: "member",
      connected: true,
      critical: false,
      helper: "Shows dark mode toggle in settings. Popular for nighttime banking.",
      dartPath: "lib/theme/mode.dart",
    },
  ],
  Limits: [
    {
      field: "rules.transfer.internal.daily",
      name: "Internal Daily",
      target: "member",
      connected: true,
      critical: true,
      helper: "Max amount member can transfer between own accounts per day.",
      dartPath: "lib/rules/transfer.dart",
    },
    {
      field: "rules.transfer.external.daily",
      name: "External Daily",
      target: "member",
      connected: true,
      critical: true,
      helper: "Max amount to external banks per day. Lower for fraud protection.",
      dartPath: "lib/rules/transfer.dart",
    },
    {
      field: "rules.transfer.p2p.daily",
      name: "P2P Daily",
      target: "member",
      connected: true,
      critical: true,
      helper: "Max P2P sends per day. Usually lowest limit.",
      dartPath: "lib/rules/transfer.dart",
    },
    {
      field: "rules.deposit.daily",
      name: "Mobile Deposit Daily",
      target: "member",
      connected: true,
      critical: true,
      helper: "Max check deposit amount per day via mobile.",
      dartPath: "lib/rules/deposit.dart",
    },
    {
      field: "rules.deposit.hold_days",
      name: "Check Hold Days",
      target: "member",
      connected: true,
      critical: true,
      helper: "Days before deposited check funds are available.",
      dartPath: "lib/rules/deposit.dart",
    },
    {
      field: "rules.atm.daily",
      name: "ATM Daily",
      target: "member",
      connected: true,
      critical: true,
      helper: "Max cash withdrawal from ATMs per day.",
      dartPath: "lib/rules/atm.dart",
    },
    {
      field: "rules.session.timeout",
      name: "Session Timeout",
      target: "both",
      connected: true,
      critical: true,
      helper: "Minutes of inactivity before logout. Too short = annoyed members.",
      dartPath: "lib/auth/session.dart",
      webPath: "lib/auth/session.ts",
    },
    {
      field: "rules.lockout.attempts",
      name: "Login Attempts",
      target: "both",
      connected: true,
      critical: true,
      helper: "Failed attempts before account lockout.",
      dartPath: "lib/auth/lockout.dart",
      webPath: "lib/auth/lockout.ts",
    },
  ],
  Integrations: [
    {
      field: "integrations.core.provider",
      name: "Core Banking",
      target: "infra",
      connected: true,
      critical: true,
      helper: "Symitar, Corelation, Fiserv DNA, etc. Determines PowerOn specs needed.",
    },
    {
      field: "integrations.core.host",
      name: "Core API Host",
      target: "infra",
      connected: true,
      critical: true,
      helper: "Endpoint URL for core banking API calls.",
    },
    {
      field: "integrations.card.provider",
      name: "Card Processor",
      target: "infra",
      connected: true,
      critical: true,
      helper: "PSCU, Fiserv, FIS, etc. For card transactions and controls.",
    },
    {
      field: "integrations.ach.provider",
      name: "ACH Provider",
      target: "infra",
      connected: true,
      critical: true,
      helper: "Federal Reserve, ACH Direct, etc. For external transfers.",
    },
    {
      field: "integrations.sms.provider",
      name: "SMS Provider",
      target: "infra",
      connected: true,
      critical: false,
      helper: "Twilio, Vonage, etc. For MFA codes and alerts.",
    },
    {
      field: "integrations.email.provider",
      name: "Email Provider",
      target: "infra",
      connected: true,
      critical: false,
      helper: "SendGrid, SES, etc. For notifications and statements.",
    },
    {
      field: "integrations.analytics",
      name: "Analytics",
      target: "infra",
      connected: false,
      critical: false,
      helper: "Mixpanel, Amplitude, etc. For usage tracking.",
    },
  ],
  Channels: [
    {
      field: "channels.mobile.ios.enabled",
      name: "iOS Enabled",
      target: "infra",
      connected: true,
      critical: true,
      helper: "Whether iOS app is active for this CU.",
    },
    {
      field: "channels.mobile.ios.app_store_id",
      name: "App Store ID",
      target: "infra",
      connected: true,
      critical: false,
      helper: "Apple App Store ID for deep linking and reviews.",
    },
    {
      field: "channels.mobile.android.enabled",
      name: "Android Enabled",
      target: "infra",
      connected: true,
      critical: true,
      helper: "Whether Android app is active for this CU.",
    },
    {
      field: "channels.mobile.android.play_store_id",
      name: "Play Store ID",
      target: "infra",
      connected: true,
      critical: false,
      helper: "Google Play Store ID for deep linking and reviews.",
    },
    {
      field: "channels.web.url",
      name: "Web URL",
      target: "infra",
      connected: true,
      critical: true,
      helper: "Public website URL for the CU.",
    },
    {
      field: "channels.ivr.enabled",
      name: "IVR Enabled",
      target: "infra",
      connected: false,
      critical: false,
      helper: "Phone banking system integration.",
    },
  ],
}

const TARGET_ICONS = {
  member: <Smartphone className="h-3.5 w-3.5" />,
  employee: <Monitor className="h-3.5 w-3.5" />,
  both: (
    <>
      <Smartphone className="h-3 w-3" />
      <Monitor className="h-3 w-3" />
    </>
  ),
  infra: <Server className="h-3.5 w-3.5" />,
}

const TARGET_LABELS = {
  member: "Member App",
  employee: "Employee Portal",
  both: "Both Apps",
  infra: "Infrastructure",
}

interface FieldMappingTableProps {
  cu: CreditUnionData
}

export function FieldMappingTable({ cu }: FieldMappingTableProps) {
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<"field" | "name" | "target">("field")
  const [sortAsc, setSortAsc] = useState(true)

  const tabs = Object.keys(FIELD_MAPPINGS)
  const totalFields = Object.values(FIELD_MAPPINGS).flat().length
  const connectedFields = Object.values(FIELD_MAPPINGS)
    .flat()
    .filter((f) => f.connected).length
  const criticalFields = Object.values(FIELD_MAPPINGS)
    .flat()
    .filter((f) => f.critical).length

  function filterAndSort(fields: FieldMapping[]) {
    let result = fields
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(
        (f) =>
          f.field.toLowerCase().includes(s) || f.name.toLowerCase().includes(s) || f.helper.toLowerCase().includes(s),
      )
    }
    result = [...result].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      const cmp = String(aVal).localeCompare(String(bVal))
      return sortAsc ? cmp : -cmp
    })
    return result
  }

  function toggleSort(field: "field" | "name" | "target") {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Field Mapping</h2>
          <p className="text-sm text-muted-foreground">
            {connectedFields} of {totalFields} fields connected • {criticalFields} critical
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8"
          />
        </div>
      </div>

      {/* Tabbed Table */}
      <Card>
        <TooltipProvider>
          <Tabs defaultValue="Identity">
            <CardHeader className="pb-0 border-b">
              <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    {tab}
                    <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                      {FIELD_MAPPINGS[tab].length}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </CardHeader>

            {tabs.map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 font-medium"
                          onClick={() => toggleSort("field")}
                        >
                          Field Path
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 font-medium"
                          onClick={() => toggleSort("name")}
                        >
                          Name
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 font-medium"
                          onClick={() => toggleSort("target")}
                        >
                          Target
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>Code Paths</TableHead>
                      <TableHead className="w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterAndSort(FIELD_MAPPINGS[tab]).map((field) => (
                      <TableRow key={field.field}>
                        <TableCell>
                          {field.connected ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {field.field}
                          {field.critical && (
                            <Badge variant="destructive" className="ml-2 h-4 px-1 text-[9px]">
                              CRITICAL
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{field.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {TARGET_ICONS[field.target]}
                            {TARGET_LABELS[field.target]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {field.dartPath && <div>Dart: {field.dartPath}</div>}
                          {field.webPath && <div>Web: {field.webPath}</div>}
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <p className="text-sm">{field.helper}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </TooltipProvider>
      </Card>
    </div>
  )
}

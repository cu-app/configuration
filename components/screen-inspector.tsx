"use client"

import { useState, useEffect } from "react"
import { 
  Database,
  Settings2,
  Layers,
  Link2,
  Code2,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Server,
  Webhook,
  Key,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  Copy,
  ExternalLink,
  Search,
  Settings,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { useInspectorConfigBridge } from "@/lib/inspector-config-bridge"

// Data source types
type DataSourceType = 
  | "symitar" 
  | "visa_dps" 
  | "alloy" 
  | "mx" 
  | "payrailz" 
  | "paymentus" 
  | "cunexus" 
  | "prizeout"
  | "genesys"
  | "twilio"
  | "onbase"
  | "usps"
  | "local"

interface DataSourceConfig {
  type: DataSourceType
  endpoint?: string
  method?: string
  fields?: string[]
  mapping?: Record<string, string>
  authentication?: string
  timeout?: number
  retry?: number
  realtime?: boolean
  webhook?: string
}

interface ScreenElement {
  id: string
  name: string
  component: string
  type: "display" | "input" | "action" | "container" | "navigation"
  dataSources: DataSourceConfig[]
  configOptions: ConfigOption[]
  children?: ScreenElement[]
}

interface ConfigOption {
  key: string
  label: string
  type: "text" | "number" | "boolean" | "select" | "color"
  value: any
  options?: { label: string; value: any }[]
  description?: string
}

interface Screen {
  id: string
  name: string
  route: string
  category: string
  elements: ScreenElement[]
}

// Screen definitions based on Suncoast architecture
const SCREENS: Screen[] = [
  {
    id: "login",
    name: "Login",
    route: "/auth/login",
    category: "Authentication",
    elements: [
      {
        id: "username_input",
        name: "Username Input",
        component: "TextInput",
        type: "input",
        dataSources: [
          {
            type: "symitar",
            endpoint: "/authentication/validate-username",
            method: "POST",
            fields: ["username"],
          }
        ],
        configOptions: [
          { key: "placeholder", label: "Placeholder", type: "text", value: "Enter username" },
          { key: "maxLength", label: "Max Length", type: "number", value: 32 },
          { key: "showIcon", label: "Show Icon", type: "boolean", value: true },
        ]
      },
      {
        id: "pin_input",
        name: "PIN Input",
        component: "PINInput",
        type: "input",
        dataSources: [
          {
            type: "symitar",
            endpoint: "/authentication/validate-pin",
            method: "POST",
            fields: ["pin"],
            authentication: "none"
          }
        ],
        configOptions: [
          { key: "length", label: "PIN Length", type: "number", value: 4 },
          { key: "masked", label: "Masked Input", type: "boolean", value: true },
          { key: "showStrength", label: "Show Strength", type: "boolean", value: false },
        ]
      },
      {
        id: "remember_device",
        name: "Remember Device",
        component: "Checkbox",
        type: "input",
        dataSources: [
          {
            type: "local",
            fields: ["deviceFingerprint", "trustDuration"]
          }
        ],
        configOptions: [
          { key: "defaultChecked", label: "Default Checked", type: "boolean", value: false },
          { key: "trustDays", label: "Trust Duration (days)", type: "number", value: 30 },
        ]
      },
      {
        id: "login_button",
        name: "Login Button",
        component: "Button",
        type: "action",
        dataSources: [
          {
            type: "symitar",
            endpoint: "/authentication/login",
            method: "POST",
            fields: ["username", "pin", "deviceFingerprint"],
            timeout: 30000,
            retry: 3
          }
        ],
        configOptions: [
          { key: "label", label: "Button Label", type: "text", value: "Sign In" },
          { key: "variant", label: "Variant", type: "select", value: "primary", options: [
            { label: "Primary", value: "primary" },
            { label: "Secondary", value: "secondary" },
            { label: "Outline", value: "outline" },
          ]},
        ]
      },
      {
        id: "forgot_pin_link",
        name: "Forgot PIN Link",
        component: "Link",
        type: "navigation",
        dataSources: [],
        configOptions: [
          { key: "text", label: "Link Text", type: "text", value: "Forgot PIN?" },
          { key: "route", label: "Route", type: "text", value: "/auth/forgot-pin" },
        ]
      }
    ]
  },
  {
    id: "dashboard",
    name: "Dashboard",
    route: "/dashboard",
    category: "Home",
    elements: [
      {
        id: "account_summary_card",
        name: "Account Summary Card",
        component: "AccountSummaryCard",
        type: "display",
        dataSources: [
          {
            type: "symitar",
            endpoint: "/shares",
            method: "GET",
            fields: ["shareId", "shareType", "description", "balance", "availableBalance"],
            mapping: {
              "accountId": "shareId",
              "balance": "balance / 100"
            },
            realtime: false
          },
          {
            type: "symitar",
            endpoint: "/loans",
            method: "GET",
            fields: ["loanId", "loanType", "description", "balance", "paymentDue"],
          }
        ],
        configOptions: [
          { key: "showAvailable", label: "Show Available Balance", type: "boolean", value: true },
          { key: "groupBy", label: "Group By", type: "select", value: "type", options: [
            { label: "Account Type", value: "type" },
            { label: "Status", value: "status" },
            { label: "None", value: "none" },
          ]},
          { key: "showClosed", label: "Show Closed Accounts", type: "boolean", value: false },
        ]
      },
      {
        id: "quick_actions",
        name: "Quick Actions Grid",
        component: "QuickActionGrid",
        type: "navigation",
        dataSources: [
          {
            type: "local",
            fields: ["enabledActions"]
          }
        ],
        configOptions: [
          { key: "columns", label: "Columns", type: "number", value: 4 },
          { key: "showLabels", label: "Show Labels", type: "boolean", value: true },
          { key: "iconSize", label: "Icon Size", type: "select", value: "medium", options: [
            { label: "Small", value: "small" },
            { label: "Medium", value: "medium" },
            { label: "Large", value: "large" },
          ]},
        ]
      },
      {
        id: "transfers_tile",
        name: "Transfers Tile",
        component: "TransfersTile",
        type: "display",
        dataSources: [
          {
            type: "symitar",
            endpoint: "/transfers/recent",
            method: "GET",
            fields: ["transferId", "amount", "date", "status"],
          }
        ],
        configOptions: [
          { key: "recentCount", label: "Recent Count", type: "number", value: 3 },
          { key: "showQuickTransfer", label: "Show Quick Transfer CTA", type: "boolean", value: true },
        ]
      },
      {
        id: "bill_pay_tile",
        name: "Bill Pay Tile",
        component: "BillPayTile",
        type: "navigation",
        dataSources: [
          {
            type: "payrailz",
            endpoint: "/payments/upcoming",
            method: "GET",
          },
          {
            type: "paymentus",
            endpoint: "/bills/due",
            method: "GET",
          }
        ],
        configOptions: [
          { key: "provider", label: "Provider", type: "select", value: "payrailz", options: [
            { label: "PayRailz", value: "payrailz" },
            { label: "Paymentus", value: "paymentus" },
          ]},
          { key: "showUpcoming", label: "Show Upcoming", type: "boolean", value: true },
        ]
      },
      {
        id: "cards_tile",
        name: "Cards Tile",
        component: "CardsTile",
        type: "display",
        dataSources: [
          {
            type: "symitar",
            endpoint: "/debitcards",
            method: "GET",
          },
          {
            type: "symitar",
            endpoint: "/creditcards",
            method: "GET",
          },
          {
            type: "visa_dps",
            endpoint: "/cards/status",
            method: "GET",
            realtime: true
          }
        ],
        configOptions: [
          { key: "showCredit", label: "Show Credit Cards", type: "boolean", value: true },
          { key: "showDebit", label: "Show Debit Cards", type: "boolean", value: true },
          { key: "showLockStatus", label: "Show Lock Status", type: "boolean", value: true },
        ]
      },
      {
        id: "inbox_badge",
        name: "Messages Badge",
        component: "InboxBadge",
        type: "display",
        dataSources: [
          {
            type: "symitar",
            endpoint: "/securemessaging/unread",
            method: "GET",
            fields: ["count"],
            realtime: true,
            webhook: "/webhooks/messages"
          }
        ],
        configOptions: [
          { key: "maxDisplay", label: "Max Display", type: "number", value: 99 },
          { key: "showZero", label: "Show Zero", type: "boolean", value: false },
        ]
      },
      {
        id: "budget_tile",
        name: "Budget Tile",
        component: "BudgetTile",
        type: "display",
        dataSources: [
          {
            type: "mx",
            endpoint: "/budgets/summary",
            method: "GET",
            authentication: "JWT SSO"
          }
        ],
        configOptions: [
          { key: "enabled", label: "Enabled", type: "boolean", value: true },
          { key: "showProgress", label: "Show Progress", type: "boolean", value: true },
        ]
      }
    ]
  },
  {
    id: "accounts",
    name: "Accounts",
    route: "/accounts",
    category: "Accounts",
    elements: [
      {
        id: "account_list",
        name: "Account List",
        component: "AccountList",
        type: "container",
        dataSources: [
          {
            type: "symitar",
            endpoint: "/shares",
            method: "GET",
            fields: ["shareId", "shareType", "description", "balance", "availableBalance", "dividendRate", "maturityDate"],
            mapping: {
              "accountId": "shareId",
              "accountType": "shareType",
              "name": "description",
              "balance": "balance / 100",
              "available": "availableBalance / 100",
              "apy": "dividendRate"
            }
          }
        ],
        configOptions: [
          { key: "groupBy", label: "Group By", type: "select", value: "type", options: [
            { label: "Account Type", value: "type" },
            { label: "Status", value: "status" },
            { label: "None", value: "none" },
          ]},
        ],
        children: [
          {
            id: "account_row",
            name: "Account Row",
            component: "AccountListItem",
            type: "display",
            dataSources: [
              {
                type: "symitar",
                endpoint: "/shares/{shareId}",
                method: "GET",
              }
            ],
            configOptions: [
              { key: "showAccountNumber", label: "Show Account Number", type: "boolean", value: true },
              { key: "accountNumberMask", label: "Account Number Mask", type: "select", value: "last4", options: [
                { label: "Last 4", value: "last4" },
                { label: "Full", value: "full" },
                { label: "Hidden", value: "hidden" },
              ]},
            ]
          },
          {
            id: "balance_display",
            name: "Balance Display",
            component: "BalanceDisplay",
            type: "display",
            dataSources: [
              {
                type: "symitar",
                endpoint: "/shares/{shareId}",
                method: "GET",
                fields: ["balance"]
              }
            ],
            configOptions: [
              { key: "format", label: "Format", type: "select", value: "currency", options: [
                { label: "Currency ($1,234.56)", value: "currency" },
                { label: "Compact ($1.2K)", value: "compact" },
                { label: "No Cents ($1,234)", value: "noCents" },
              ]},
              { key: "showSign", label: "Show Sign", type: "boolean", value: false },
              { key: "negativeColor", label: "Negative Color", type: "color", value: "#ef4444" },
            ]
          },
          {
            id: "available_balance",
            name: "Available Balance",
            component: "AvailableBalance",
            type: "display",
            dataSources: [
              {
                type: "symitar",
                endpoint: "/shares/{shareId}",
                method: "GET",
                fields: ["availableBalance"]
              }
            ],
            configOptions: [
              { key: "show", label: "Show", type: "boolean", value: true },
              { key: "label", label: "Label", type: "text", value: "Available" },
            ]
          }
        ]
      }
    ]
  },
  {
    id: "cards",
    name: "Cards",
    route: "/cards",
    category: "Cards",
    elements: [
      {
        id: "card_overview",
        name: "Card Overview",
        component: "CardOverview",
        type: "container",
        dataSources: [
          {
            type: "symitar",
            endpoint: "/creditcards",
            method: "GET",
          },
          {
            type: "symitar",
            endpoint: "/debitcards",
            method: "GET",
          },
          {
            type: "visa_dps",
            endpoint: "/cards",
            method: "GET",
            realtime: true
          }
        ],
        configOptions: [],
        children: [
          {
            id: "credit_card_section",
            name: "Credit Cards Section",
            component: "CreditCardList",
            type: "container",
            dataSources: [
              {
                type: "symitar",
                endpoint: "/creditcards",
                method: "GET",
                fields: ["cardId", "cardNumber", "cardType", "balance", "statementBalance", "minDue", "dueDate", "creditLimit", "availableCredit"]
              }
            ],
            configOptions: [
              { key: "showClosed", label: "Show Closed", type: "boolean", value: false },
            ]
          },
          {
            id: "debit_card_section",
            name: "Debit Cards Section",
            component: "DebitCardList",
            type: "container",
            dataSources: [
              {
                type: "symitar",
                endpoint: "/debitcards",
                method: "GET",
                fields: ["cardId", "cardNumber", "cardType", "status", "expirationDate"]
              },
              {
                type: "visa_dps",
                endpoint: "/cards/{cardId}/status",
                method: "GET",
                fields: ["lockStatus", "lastTransaction"]
              }
            ],
            configOptions: [
              { key: "showClosed", label: "Show Closed", type: "boolean", value: false },
            ]
          },
          {
            id: "card_lock_toggle",
            name: "Card Lock Toggle",
            component: "CardLockToggle",
            type: "action",
            dataSources: [
              {
                type: "visa_dps",
                endpoint: "/cards/{cardId}/lock",
                method: "PUT",
                fields: ["lockStatus"],
                realtime: true
              },
              {
                type: "symitar",
                endpoint: "/debitcards/{cardId}/lock",
                method: "PUT",
                fields: ["lockStatus"]
              }
            ],
            configOptions: [
              { key: "syncWithSymitar", label: "Sync with Symitar", type: "boolean", value: true },
              { key: "confirmationRequired", label: "Require Confirmation", type: "boolean", value: true },
              { key: "confirmationText", label: "Confirmation Text", type: "text", value: "Are you sure you want to lock/unlock this card?" },
            ]
          }
        ]
      }
    ]
  }
]

// Data source icons and colors
const DATA_SOURCE_META: Record<DataSourceType, { icon: typeof Database; color: string; label: string }> = {
  symitar: { icon: Database, color: "bg-blue-500", label: "Symitar Core" },
  visa_dps: { icon: Server, color: "bg-purple-500", label: "Visa DPS" },
  alloy: { icon: Key, color: "bg-orange-500", label: "Alloy KYC" },
  mx: { icon: Layers, color: "bg-green-500", label: "MX Insights" },
  payrailz: { icon: Link2, color: "bg-cyan-500", label: "PayRailz" },
  paymentus: { icon: Link2, color: "bg-teal-500", label: "Paymentus" },
  cunexus: { icon: Webhook, color: "bg-pink-500", label: "CUNexus" },
  prizeout: { icon: Webhook, color: "bg-yellow-500", label: "PrizeOut" },
  genesys: { icon: Server, color: "bg-indigo-500", label: "Genesys IVR" },
  twilio: { icon: Server, color: "bg-red-500", label: "Twilio" },
  onbase: { icon: Database, color: "bg-slate-500", label: "OnBase ECM" },
  usps: { icon: Server, color: "bg-blue-400", label: "USPS" },
  local: { icon: Code2, color: "bg-gray-500", label: "Local State" },
}

interface ScreenInspectorProps {
  tenantId?: string
}

export function ScreenInspector({ tenantId }: ScreenInspectorProps) {
  const [selectedScreen, setSelectedScreen] = useState<Screen | null>(SCREENS[0])
  const [selectedElement, setSelectedElement] = useState<ScreenElement | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showDataSources, setShowDataSources] = useState(true)
  const { setSelectedScreenId, navigateToView } = useInspectorConfigBridge()
  
  // Filter screens by search
  const filteredScreens = SCREENS.filter(screen => 
    screen.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    screen.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
    screen.category.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Group screens by category
  const screensByCategory = filteredScreens.reduce((acc, screen) => {
    if (!acc[screen.category]) acc[screen.category] = []
    acc[screen.category].push(screen)
    return acc
  }, {} as Record<string, Screen[]>)

  return (
    <div className="h-full flex bg-background">
      {/* Left Panel - Screen Tree */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold mb-3">Screen Architecture</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search screens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            {Object.entries(screensByCategory).map(([category, screens]) => (
              <Accordion key={category} type="single" collapsible defaultValue={category}>
                <AccordionItem value={category} className="border-none">
                  <AccordionTrigger className="py-2 px-2 hover:bg-muted/50 rounded-md">
                    <span className="text-sm font-medium">{category}</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 pl-2">
                      {screens.map(screen => (
                        <button
                          key={screen.id}
                          onClick={() => {
                            setSelectedScreen(screen)
                            setSelectedElement(null)
                            setSelectedScreenId(screen.id)
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                            selectedScreen?.id === screen.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                        >
                          <div className="font-medium">{screen.name}</div>
                          <div className="text-xs opacity-70">{screen.route}</div>
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Center Panel - Element Tree */}
      <div className="w-96 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">
              {selectedScreen?.name || "Select a screen"}
            </h2>
            {selectedScreen && (
              <>
                <Badge variant="outline" className="text-xs">
                  {selectedScreen.elements.length} elements
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => navigateToView("config", selectedScreen.id, "content")}
                >
                  <Settings className="h-3.5 w-3.5 mr-1.5" />
                  Edit in Config
                </Button>
              </>
            )}
          </div>
          {selectedScreen && (
            <p className="text-xs text-muted-foreground mt-1">{selectedScreen.route}</p>
          )}
        </div>

        <ScrollArea className="flex-1">
          {selectedScreen && (
            <div className="p-2">
              <ElementTree
                elements={selectedScreen.elements}
                selectedElement={selectedElement}
                onSelectElement={setSelectedElement}
                depth={0}
              />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel - Configuration */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              {selectedElement?.name || "Select an element"}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDataSources(!showDataSources)}
              >
                {showDataSources ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {selectedElement && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{selectedElement.component}</Badge>
              <Badge variant="outline">{selectedElement.type}</Badge>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          {selectedElement ? (
            <div className="p-4 space-y-6">
              {/* Data Sources */}
              {showDataSources && selectedElement.dataSources.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Data Sources
                  </h3>
                  <div className="space-y-3">
                    {selectedElement.dataSources.map((ds, idx) => (
                      <DataSourceCard key={idx} dataSource={ds} />
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Configuration Options */}
              {selectedElement.configOptions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Configuration
                  </h3>
                  <div className="space-y-4">
                    {selectedElement.configOptions.map((option) => (
                      <ConfigOptionEditor key={option.key} option={option} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Layers className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Select an element to view its configuration</p>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

// Element Tree Component
function ElementTree({
  elements,
  selectedElement,
  onSelectElement,
  depth
}: {
  elements: ScreenElement[]
  selectedElement: ScreenElement | null
  onSelectElement: (el: ScreenElement) => void
  depth: number
}) {
  return (
    <div className="space-y-1">
      {elements.map(element => (
        <div key={element.id}>
          <button
            onClick={() => onSelectElement(element)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
              selectedElement?.id === element.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
          >
            <ElementTypeIcon type={element.type} />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{element.name}</div>
              <div className="text-xs opacity-70 truncate">{element.component}</div>
            </div>
            {element.dataSources.length > 0 && (
              <div className="flex -space-x-1">
                {element.dataSources.slice(0, 3).map((ds, idx) => {
                  const meta = DATA_SOURCE_META[ds.type]
                  return (
                    <div
                      key={idx}
                      className={cn("w-4 h-4 rounded-full flex items-center justify-center text-white", meta.color)}
                      title={meta.label}
                    >
                      <meta.icon className="h-2.5 w-2.5" />
                    </div>
                  )
                })}
              </div>
            )}
          </button>
          {element.children && (
            <ElementTree
              elements={element.children}
              selectedElement={selectedElement}
              onSelectElement={onSelectElement}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function ElementTypeIcon({ type }: { type: ScreenElement["type"] }) {
  switch (type) {
    case "display": return <Eye className="h-4 w-4 text-blue-500" />
    case "input": return <Code2 className="h-4 w-4 text-green-500" />
    case "action": return <Webhook className="h-4 w-4 text-orange-500" />
    case "container": return <Layers className="h-4 w-4 text-purple-500" />
    case "navigation": return <Link2 className="h-4 w-4 text-cyan-500" />
    default: return <Info className="h-4 w-4" />
  }
}

// Data Source Card Component
function DataSourceCard({ dataSource }: { dataSource: DataSourceConfig }) {
  const meta = DATA_SOURCE_META[dataSource.type]
  const [expanded, setExpanded] = useState(true)
  
  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full"
      >
        <CardHeader className="py-3 px-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", meta.color)}>
              <meta.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 text-left">
              <CardTitle className="text-sm">{meta.label}</CardTitle>
              {dataSource.endpoint && (
                <CardDescription className="text-xs font-mono">
                  {dataSource.method || "GET"} {dataSource.endpoint}
                </CardDescription>
              )}
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
          </div>
        </CardHeader>
      </button>
      
      {expanded && (
        <CardContent className="pt-0 px-4 pb-4">
          <div className="space-y-3 text-sm">
            {dataSource.fields && (
              <div>
                <Label className="text-xs text-muted-foreground">Fields</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {dataSource.fields.map(field => (
                    <Badge key={field} variant="secondary" className="text-xs font-mono">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {dataSource.mapping && (
              <div>
                <Label className="text-xs text-muted-foreground">Mapping</Label>
                <div className="mt-1 space-y-1">
                  {Object.entries(dataSource.mapping).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-muted-foreground">{key}</span>
                      <ChevronRight className="h-3 w-3" />
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              {dataSource.realtime && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Realtime
                </Badge>
              )}
              {dataSource.timeout && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {dataSource.timeout}ms
                </Badge>
              )}
              {dataSource.retry && (
                <Badge variant="outline" className="text-xs">
                  Retry: {dataSource.retry}x
                </Badge>
              )}
            </div>
            
            {dataSource.webhook && (
              <div>
                <Label className="text-xs text-muted-foreground">Webhook</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-muted px-2 py-1 rounded">{dataSource.webhook}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Config Option Editor Component
function ConfigOptionEditor({ option }: { option: ConfigOption }) {
  const [value, setValue] = useState(option.value)
  
  return (
    <div className="space-y-2">
      <Label className="text-sm">{option.label}</Label>
      
      {option.type === "text" && (
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      )}
      
      {option.type === "number" && (
        <Input
          type="number"
          value={value}
          onChange={(e) => setValue(parseInt(e.target.value))}
        />
      )}
      
      {option.type === "boolean" && (
        <div className="flex items-center gap-2">
          <Switch
            checked={value}
            onCheckedChange={setValue}
          />
          <span className="text-sm text-muted-foreground">
            {value ? "Enabled" : "Disabled"}
          </span>
        </div>
      )}
      
      {option.type === "select" && option.options && (
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {option.options.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {option.type === "color" && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-10 h-10 rounded border cursor-pointer"
          />
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1"
          />
        </div>
      )}
      
      {option.description && (
        <p className="text-xs text-muted-foreground">{option.description}</p>
      )}
    </div>
  )
}

export default ScreenInspector

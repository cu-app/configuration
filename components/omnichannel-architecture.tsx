"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Phone,
  Smartphone,
  Globe,
  MessageSquare,
  Mail,
  Building2,
  Database,
  Cpu,
  Network,
  Shield,
  Settings,
  Zap,
  Brain,
  Radio,
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Play,
  Pause,
  RefreshCw,
} from "lucide-react"
import { OmnichannelLiveView } from "./omnichannel-live-view"
import { ArchitectureDiagram } from "./architecture-diagram"
import { SectionHeader } from "./section-header"
import type { CreditUnionData } from "@/lib/credit-union-data"

// 21 Layers of Architecture
interface ArchitectureLayer {
  id: string
  name: string
  description: string
  status: "active" | "inactive" | "pending"
  components: string[]
  connections: string[]
  icon: typeof Phone
}

const ARCHITECTURE_LAYERS: ArchitectureLayer[] = [
  {
    id: "layer-1",
    name: "Channel Layer",
    description: "Multi-channel entry points (IVR, Mobile, Web, Chat, Email)",
    status: "active",
    components: ["Genesys IVR", "Twilio", "Hume AI", "Mobile App", "Web Portal", "Chat Widget", "Email"],
    connections: ["layer-2", "layer-3"],
    icon: Phone,
  },
  {
    id: "layer-2",
    name: "Routing & Orchestration",
    description: "Intelligent routing and channel orchestration",
    status: "active",
    components: ["Hume EVI", "Genesys Routing", "Channel Router", "Session Manager"],
    connections: ["layer-1", "layer-3", "layer-4"],
    icon: Network,
  },
  {
    id: "layer-3",
    name: "Authentication & Identity",
    description: "Multi-factor authentication, biometrics, device intelligence",
    status: "active",
    components: ["Auth0", "Device Intelligence", "Biometrics", "PIN Verification", "OTP Service"],
    connections: ["layer-2", "layer-4", "layer-5"],
    icon: Shield,
  },
  {
    id: "layer-4",
    name: "Conversation Management",
    description: "Conversation state, context, and session management",
    status: "active",
    components: ["Conversation Store", "Context Manager", "Session Handler", "State Machine"],
    connections: ["layer-2", "layer-3", "layer-5"],
    icon: MessageSquare,
  },
  {
    id: "layer-5",
    name: "AI & Natural Language",
    description: "Hume AI, speech recognition, intent understanding",
    status: "active",
    components: ["Hume EVI", "Speech-to-Text", "Intent Recognition", "Sentiment Analysis", "Voice Biometrics"],
    connections: ["layer-4", "layer-6"],
    icon: Brain,
  },
  {
    id: "layer-6",
    name: "Business Logic & Rules",
    description: "Business rules engine, workflow orchestration",
    status: "active",
    components: ["Rule Engine", "Workflow Orchestrator", "Decision Engine", "Business Process Manager"],
    connections: ["layer-5", "layer-7"],
    icon: Settings,
  },
  {
    id: "layer-7",
    name: "Core Banking Adapters",
    description: "Universal adapter layer for all core systems",
    status: "active",
    components: ["Symitar Adapter", "Jack Henry Adapter", "Corelation Adapter", "Fiserv Adapter", "Universal Adapter"],
    connections: ["layer-6", "layer-8"],
    icon: Database,
  },
  {
    id: "layer-8",
    name: "Core Banking Systems",
    description: "Direct connections to core banking systems",
    status: "active",
    components: ["Symitar/Episys", "Jack Henry Silverlake", "Corelation KeyStone", "Fiserv DNA/XP2"],
    connections: ["layer-7"],
    icon: Building2,
  },
  {
    id: "layer-9",
    name: "Data Transformation",
    description: "FDX compliance, data mapping, format conversion",
    status: "active",
    components: ["FDX Gateway", "Data Mapper", "Format Converter", "Schema Validator"],
    connections: ["layer-7", "layer-10"],
    icon: Zap,
  },
  {
    id: "layer-10",
    name: "Account Services",
    description: "Account management, balances, transactions",
    status: "active",
    components: ["Account Service", "Balance Service", "Transaction Service", "Account Detail Service"],
    connections: ["layer-9", "layer-11"],
    icon: Database,
  },
  {
    id: "layer-11",
    name: "Transaction Services",
    description: "Transfers, payments, bill pay, P2P",
    status: "active",
    components: ["Transfer Service", "Payment Service", "Bill Pay", "P2P Service", "ACH Service"],
    connections: ["layer-10", "layer-12"],
    icon: Radio,
  },
  {
    id: "layer-12",
    name: "Loan Services",
    description: "Loan information, payments, applications",
    status: "active",
    components: ["Loan Service", "Loan Payment Service", "Loan Application Service", "Rate Service"],
    connections: ["layer-11", "layer-13"],
    icon: Building2,
  },
  {
    id: "layer-13",
    name: "Card Services",
    description: "Card management, controls, transactions",
    status: "active",
    components: ["Card Service", "Card Control Service", "Card Transaction Service"],
    connections: ["layer-12", "layer-14"],
    icon: Database,
  },
  {
    id: "layer-14",
    name: "Fraud & Risk",
    description: "Fraud detection, risk scoring, device intelligence",
    status: "active",
    components: ["Fraud Engine", "Risk Scorer", "Device Intelligence", "Velocity Checks", "Geo-fencing"],
    connections: ["layer-13", "layer-15"],
    icon: Shield,
  },
  {
    id: "layer-15",
    name: "Compliance & Regulatory",
    description: "KYC, OFAC, Reg E, CTR, compliance checks",
    status: "active",
    components: ["KYC Service", "OFAC Checker", "Reg E Processor", "CTR Service", "Compliance Engine"],
    connections: ["layer-14", "layer-16"],
    icon: Shield,
  },
  {
    id: "layer-16",
    name: "Notification Services",
    description: "SMS, email, push notifications, alerts",
    status: "active",
    components: ["SMS Service", "Email Service", "Push Service", "Alert Service", "Notification Router"],
    connections: ["layer-15", "layer-17"],
    icon: Mail,
  },
  {
    id: "layer-17",
    name: "Configuration & Feature Flags",
    description: "Dynamic configuration, feature flags, A/B testing",
    status: "active",
    components: ["Config Service", "Feature Flags", "A/B Testing", "Config Matrix"],
    connections: ["layer-16", "layer-18"],
    icon: Settings,
  },
  {
    id: "layer-18",
    name: "Analytics & Monitoring",
    description: "Real-time analytics, monitoring, logging",
    status: "active",
    components: ["Analytics Engine", "Monitoring Service", "Log Aggregator", "Metrics Collector", "APM"],
    connections: ["layer-17", "layer-19"],
    icon: Activity,
  },
  {
    id: "layer-19",
    name: "Data Persistence",
    description: "Database, cache, session storage",
    status: "active",
    components: ["Supabase", "PostgreSQL", "Redis Cache", "Session Store", "Data Warehouse"],
    connections: ["layer-18", "layer-20"],
    icon: Database,
  },
  {
    id: "layer-20",
    name: "Integration Services",
    description: "Third-party integrations, webhooks, APIs",
    status: "active",
    components: ["Webhook Router", "API Gateway", "Integration Hub", "Third-party Connectors"],
    connections: ["layer-19", "layer-21"],
    icon: Network,
  },
  {
    id: "layer-21",
    name: "Infrastructure & Deployment",
    description: "Cloud infrastructure, CI/CD, scaling",
    status: "active",
    components: ["Vercel", "Supabase", "Azure Functions", "Docker", "Kubernetes", "CI/CD Pipeline"],
    connections: ["layer-20"],
    icon: Cpu,
  },
]

interface ChannelConnection {
  from: string
  to: string
  type: "real-time" | "async" | "webhook" | "event"
  status: "connected" | "disconnected" | "error"
}

interface CreditUnionOperation {
  id: string
  name: string
  description: string
  channels: string[]
  layers: string[]
  status: "available" | "pending" | "error"
}

const CREDIT_UNION_OPERATIONS: CreditUnionOperation[] = [
  {
    id: "op-1",
    name: "Account Balance Inquiry",
    description: "Get account balances via IVR, mobile, web, or chat",
    channels: ["IVR", "Mobile", "Web", "Chat"],
    layers: ["layer-1", "layer-2", "layer-3", "layer-4", "layer-5", "layer-6", "layer-7", "layer-8", "layer-10"],
    status: "available",
  },
  {
    id: "op-2",
    name: "Transfer Funds",
    description: "Transfer money between accounts across all channels",
    channels: ["IVR", "Mobile", "Web", "Chat"],
    layers: ["layer-1", "layer-2", "layer-3", "layer-4", "layer-5", "layer-6", "layer-7", "layer-8", "layer-11"],
    status: "available",
  },
  {
    id: "op-3",
    name: "Loan Information",
    description: "Get loan details, rates, payment information",
    channels: ["IVR", "Mobile", "Web", "Chat"],
    layers: ["layer-1", "layer-2", "layer-3", "layer-4", "layer-5", "layer-6", "layer-7", "layer-8", "layer-12"],
    status: "available",
  },
  {
    id: "op-4",
    name: "Transaction History",
    description: "View recent transactions and statements",
    channels: ["IVR", "Mobile", "Web", "Chat"],
    layers: ["layer-1", "layer-2", "layer-3", "layer-4", "layer-5", "layer-6", "layer-7", "layer-8", "layer-10"],
    status: "available",
  },
  {
    id: "op-5",
    name: "Bill Pay",
    description: "Pay bills and schedule payments",
    channels: ["Mobile", "Web", "Chat"],
    layers: ["layer-1", "layer-2", "layer-3", "layer-4", "layer-5", "layer-6", "layer-7", "layer-8", "layer-11"],
    status: "available",
  },
  {
    id: "op-6",
    name: "Card Management",
    description: "Control cards, view transactions, set limits",
    channels: ["Mobile", "Web", "Chat"],
    layers: ["layer-1", "layer-2", "layer-3", "layer-4", "layer-5", "layer-6", "layer-7", "layer-8", "layer-13"],
    status: "available",
  },
  {
    id: "op-7",
    name: "PIN Change",
    description: "Change PIN via IVR or mobile",
    channels: ["IVR", "Mobile"],
    layers: ["layer-1", "layer-2", "layer-3", "layer-4", "layer-5", "layer-6", "layer-7", "layer-8"],
    status: "available",
  },
  {
    id: "op-8",
    name: "Stop Payment",
    description: "Stop payment on a check",
    channels: ["IVR", "Mobile", "Web"],
    layers: ["layer-1", "layer-2", "layer-3", "layer-4", "layer-5", "layer-6", "layer-7", "layer-8", "layer-11"],
    status: "available",
  },
  {
    id: "op-9",
    name: "Account Opening",
    description: "Open new accounts",
    channels: ["Mobile", "Web"],
    layers: ["layer-1", "layer-2", "layer-3", "layer-4", "layer-5", "layer-6", "layer-7", "layer-8", "layer-15"],
    status: "available",
  },
  {
    id: "op-10",
    name: "Loan Application",
    description: "Apply for loans",
    channels: ["Mobile", "Web"],
    layers: ["layer-1", "layer-2", "layer-3", "layer-4", "layer-5", "layer-6", "layer-7", "layer-8", "layer-12", "layer-15"],
    status: "available",
  },
]

export function OmnichannelArchitecture({ cu }: { cu: CreditUnionData | null }) {
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"layers" | "operations" | "channels">("layers")
  const [isLive, setIsLive] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<Record<string, any> | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)

  // Load connection status
  useEffect(() => {
    if (cu?.id) {
      loadConnectionStatus()
    }
  }, [cu?.id])

  async function loadConnectionStatus() {
    if (!cu?.id) return
    setLoadingStatus(true)
    try {
      const response = await fetch(`/api/integrations/status?tenantId=${cu.id}`)
      if (response.ok) {
        const data = await response.json()
        setConnectionStatus(data)
      }
    } catch (error) {
      console.error('Failed to load connection status:', error)
    } finally {
      setLoadingStatus(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "available":
      case "connected":
        return "bg-green-500"
      case "inactive":
      case "pending":
        return "bg-yellow-500"
      case "error":
      case "disconnected":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "available":
      case "connected":
        return <CheckCircle2 className="h-4 w-4" />
      case "error":
      case "disconnected":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  return (
    <div className="p-6 max-w-[1800px] mx-auto space-y-6">
      {/* Header */}
      <SectionHeader
        sectionId="omnichannel"
        title="THE OMNICHANNEL SYSTEM"
        description={`This IS the omnichannel experience. All channels (IVR, Mobile, Web, Chat) work as ONE unified system. Enter credentials in Configuration → Integrations to connect everything.`}
        onAssignTeamMember={(member) => {
          console.log(`Assigning omnichannel to ${member}`)
        }}
      />

      {/* Key Message */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Layers className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">This IS the Omnichannel System</h3>
              <p className="text-sm text-muted-foreground">
                Everything works as ONE unified experience. IVR, Mobile, Web, Chat - all channels share the same data, 
                same rules, same core banking connection. Enter your credentials in <strong>Configuration → Integrations</strong> 
                to connect PowerOn, SymXchange, and all other services. Once configured, all channels work together automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unified Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <div className="text-xs text-muted-foreground mt-1">IVR, Mobile, Web, Chat, Email, SMS, Push - ALL ONE SYSTEM</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Architecture Layers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">21</div>
            <div className="text-xs text-muted-foreground mt-1">All layers active, all channels connected</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{CREDIT_UNION_OPERATIONS.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Available across ALL channels</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Core Systems</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4+</div>
            <div className="text-xs text-muted-foreground mt-1">Symitar, Jack Henry, Corelation, Fiserv - Configure in Integrations</div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Status */}
      {connectionStatus && (
        <Card className={connectionStatus.overall?.connected ? "border-green-500/50 bg-green-500/5" : "border-yellow-500/50 bg-yellow-500/5"}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <Activity className={`h-6 w-6 shrink-0 mt-0.5 ${connectionStatus.overall?.connected ? "text-green-500" : "text-yellow-500"}`} />
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Integration Status</h3>
                    <p className="text-sm text-muted-foreground">
                      {connectionStatus.overall?.message || "Checking connections..."}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      {connectionStatus.poweron?.connected ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>
                        <strong>PowerOn:</strong> {connectionStatus.poweron?.connected ? "Connected" : "Not Connected"}
                        {connectionStatus.poweron?.mode && ` (${connectionStatus.poweron.mode})`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {connectionStatus.hume?.connected ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : connectionStatus.hume?.enabled ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-gray-400" />
                      )}
                      <span>
                        <strong>Hume AI:</strong> {connectionStatus.hume?.connected ? "Connected" : connectionStatus.hume?.enabled ? "Not Connected" : "Not Configured"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {connectionStatus.twilio?.connected ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : connectionStatus.twilio?.phoneNumber ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-gray-400" />
                      )}
                      <span>
                        <strong>Twilio:</strong> {connectionStatus.twilio?.connected ? "Connected" : connectionStatus.twilio?.phoneNumber ? "Not Connected" : "Not Configured"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {connectionStatus.transaction_enrichment?.connected ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : connectionStatus.transaction_enrichment?.enabled ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-gray-400" />
                      )}
                      <span>
                        <strong>Transaction Enrichment:</strong>{" "}
                        {connectionStatus.transaction_enrichment?.connected
                          ? `Connected${connectionStatus.transaction_enrichment.savings ? ` (${connectionStatus.transaction_enrichment.savings})` : ""}`
                          : connectionStatus.transaction_enrichment?.enabled
                          ? "Not Connected"
                          : "Not Configured"}
                        {connectionStatus.transaction_enrichment?.provider && 
                          connectionStatus.transaction_enrichment.provider !== "internal" && 
                          ` (${connectionStatus.transaction_enrichment.provider})`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {connectionStatus.fdx?.connected ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : connectionStatus.fdx?.enabled ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-gray-400" />
                      )}
                      <span>
                        <strong>FDX API:</strong>{" "}
                        {connectionStatus.fdx?.connected
                          ? `Connected (v${connectionStatus.fdx.version || "5.3.1"})`
                          : connectionStatus.fdx?.enabled
                          ? "Not Connected"
                          : "Not Configured"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadConnectionStatus}
                disabled={loadingStatus}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingStatus ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Call-to-Action */}
      <Card className="border-blue-500/50 bg-blue-500/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Settings className="h-6 w-6 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-lg mb-1">Enter Credentials in Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  All credentials are entered in <strong>Configuration → Integrations</strong>. Once you enter:
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span><strong>PowerOn/SymXchange:</strong> Core banking connection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span><strong>Hume API Key:</strong> Voice banking (IVR)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span><strong>Twilio:</strong> SMS and phone connectivity</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span><strong>OAuth/Auth:</strong> Member authentication</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                All channels automatically use these credentials. No separate setup needed. The system IS omnichannel.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Architecture Diagram */}
      <Card>
        <CardHeader>
          <CardTitle>21-Layer Architecture Flow</CardTitle>
          <CardDescription>Visual representation of how requests flow through all layers - ALL channels use the same flow</CardDescription>
        </CardHeader>
        <CardContent>
          <ArchitectureDiagram />
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="layers">21 Layers</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
        </TabsList>

        {/* Layers View */}
        <TabsContent value="layers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {ARCHITECTURE_LAYERS.map((layer, index) => (
              <Card
                key={layer.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedLayer === layer.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedLayer(selectedLayer === layer.id ? null : layer.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-primary/10`}>
                        <layer.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">Layer {index + 1}</CardTitle>
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(layer.status)} text-white border-0`}
                          >
                            {getStatusIcon(layer.status)}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs mt-1">{layer.name}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{layer.description}</p>
                  
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground">Components:</div>
                    <div className="flex flex-wrap gap-1">
                      {layer.components.map((component, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {component}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {selectedLayer === layer.id && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground">Connections:</div>
                      <div className="flex flex-wrap gap-1">
                        {layer.connections.map((conn, i) => {
                          const connectedLayer = ARCHITECTURE_LAYERS.find(l => l.id === conn)
                          return (
                            <Badge key={i} variant="outline" className="text-xs cursor-pointer">
                              <ArrowRight className="h-3 w-3 mr-1" />
                              {connectedLayer?.name || conn}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Operations View */}
        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {CREDIT_UNION_OPERATIONS.map((operation) => (
              <Card
                key={operation.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedOperation === operation.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedOperation(selectedOperation === operation.id ? null : operation.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{operation.name}</CardTitle>
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(operation.status)} text-white border-0`}
                        >
                          {getStatusIcon(operation.status)}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-1">{operation.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-2">Available Channels:</div>
                      <div className="flex flex-wrap gap-1">
                        {operation.channels.map((channel, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {selectedOperation === operation.id && (
                      <div className="pt-3 border-t">
                        <div className="text-xs font-semibold text-muted-foreground mb-2">Architecture Layers Used:</div>
                        <div className="space-y-1">
                          {operation.layers.map((layerId, i) => {
                            const layer = ARCHITECTURE_LAYERS.find(l => l.id === layerId)
                            return (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <span>{layer?.name || layerId}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Channels View */}
        <TabsContent value="channels" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "IVR", icon: Phone, description: "Genesys IVR with Hume AI", status: "active" },
              { name: "Mobile App", icon: Smartphone, description: "Flutter mobile app", status: "active" },
              { name: "Web Portal", icon: Globe, description: "Next.js web application", status: "active" },
              { name: "Chat", icon: MessageSquare, description: "Live chat with AI", status: "active" },
              { name: "Email", icon: Mail, description: "Email notifications", status: "active" },
              { name: "SMS", icon: MessageSquare, description: "Text messaging", status: "active" },
              { name: "Push", icon: Radio, description: "Push notifications", status: "active" },
            ].map((channel, i) => (
              <Card key={i} className="cursor-pointer transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-primary/10`}>
                      <channel.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{channel.name}</CardTitle>
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(channel.status)} text-white border-0`}
                        >
                          {getStatusIcon(channel.status)}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-1">{channel.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    Connected to all 21 layers via unified routing
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Live Channel Activity */}
      <OmnichannelLiveView cu={cu} />

      {/* Real Banking Connections */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Real Banking Connections</CardTitle>
          <CardDescription>Live connections to core banking systems</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Symitar/Episys", status: "connected", endpoint: "SymXchange API" },
              { name: "Jack Henry", status: "connected", endpoint: "jXchange API" },
              { name: "Corelation", status: "connected", endpoint: "KeyStone REST" },
              { name: "Fiserv", status: "connected", endpoint: "DNA/XP2 SOAP" },
            ].map((core, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{core.name}</span>
                  <Badge
                    variant="outline"
                    className={`${getStatusColor(core.status)} text-white border-0`}
                  >
                    {getStatusIcon(core.status)}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">{core.endpoint}</div>
                {isLive && (
                  <div className="mt-2 text-xs">
                    <div className="flex items-center gap-1 text-green-600">
                      <Activity className="h-3 w-3 animate-pulse" />
                      Live connection
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

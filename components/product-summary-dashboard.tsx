"use client"

import { useState, useEffect } from "react"
import {
  Database,
  Zap,
  Shield,
  Star,
  GitBranch,
  Users,
  Settings,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Loader2,
  DollarSign,
  FileCode,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useAuth, type ConfigSection } from "@/lib/auth-context"
import type { CreditUnionData } from "@/lib/credit-union-data"

// ============================================================================
// TYPES
// ============================================================================

interface FeatureCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  status: "active" | "configured" | "pending" | "error"
  statusText: string
  stats?: string
  savings?: string
  configSection?: ConfigSection
  badge?: string
}

interface ProductSummaryDashboardProps {
  cu: CreditUnionData | null
  onConfigureSection?: (section: ConfigSection) => void
}

// ============================================================================
// FEATURE CARDS DATA
// ============================================================================

function getFeatureCards(cu: CreditUnionData | null): FeatureCard[] {
  return [
    {
      id: "poweron",
      title: "PowerOn Specs",
      description: "139 Symitar stored procedures for core banking integration",
      icon: <FileCode className="h-5 w-5" />,
      status: "active",
      statusText: "139 specs registered",
      stats: "12 categories",
      configSection: "poweron",
      badge: "Core",
    },
    {
      id: "enrichment",
      title: "Transaction Enrichment",
      description: "AI-powered merchant matching, categorization, and insights",
      icon: <Zap className="h-5 w-5" />,
      status: "active",
      statusText: "Edge workers deployed",
      savings: "$49,940/year vs MX",
      configSection: "integrations",
      badge: "Savings",
    },
    {
      id: "fdx",
      title: "FDX v5.3.1 API",
      description: "CFPB 1033 compliant financial data exchange",
      icon: <Shield className="h-5 w-5" />,
      status: "active",
      statusText: "1033 compliant",
      stats: "OAuth2 consent flow ready",
      configSection: "compliance",
      badge: "Compliance",
    },
    {
      id: "reviews",
      title: "App Store Reviews",
      description: "Real-time iOS and Android review monitoring with sentiment",
      icon: <Star className="h-5 w-5" />,
      status: "pending",
      statusText: "Connect app stores",
      stats: "Sentiment analysis included",
      configSection: undefined, // Special handling
    },
    {
      id: "cicd",
      title: "CI/CD Pipeline",
      description: "Self-healing deploys with auto-rollback on failures",
      icon: <GitBranch className="h-5 w-5" />,
      status: "pending",
      statusText: "Configure GitHub",
      stats: "Auto-rollback enabled",
      configSection: "deploy",
    },
    {
      id: "team",
      title: "Team & Delegation",
      description: "Invite team members and delegate config sections",
      icon: <Users className="h-5 w-5" />,
      status: "configured",
      statusText: "1 owner",
      stats: "16 sections available",
      configSection: undefined, // Special handling
    },
    {
      id: "fraud-network",
      title: "Fraud Network",
      description: "Private federated fraud intelligence across 4,300+ CUs",
      icon: <Shield className="h-5 w-5" />,
      status: "active",
      statusText: "Network active",
      stats: "Daisy chain signals",
      configSection: "fraud",
      badge: "Private",
    },
    {
      id: "ivr",
      title: "IVR & Voice Banking",
      description: "Hume EVI voice AI with Genesys/NICE integration",
      icon: <Phone className="h-5 w-5" />,
      status: "active",
      statusText: "Voice AI ready",
      stats: "35 IVR specs",
      configSection: "ivr",
    },
    {
      id: "omnichannel",
      title: "Omnichannel System",
      description: "21-layer architecture unifying all channels",
      icon: <Database className="h-5 w-5" />,
      status: "active",
      statusText: "Fully integrated",
      stats: "Mobile, Web, IVR, Chat",
      configSection: "channels",
    },
  ]
}

// ============================================================================
// STATUS BADGE
// ============================================================================

function StatusBadge({ status, text }: { status: FeatureCard["status"]; text: string }) {
  const variants = {
    active: { variant: "default" as const, icon: <CheckCircle2 className="h-3 w-3" />, className: "bg-green-500/10 text-green-600 border-green-500/20" },
    configured: { variant: "secondary" as const, icon: <CheckCircle2 className="h-3 w-3" />, className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    pending: { variant: "outline" as const, icon: <Clock className="h-3 w-3" />, className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
    error: { variant: "destructive" as const, icon: <AlertCircle className="h-3 w-3" />, className: "" },
  }

  const config = variants[status]

  return (
    <Badge variant={config.variant} className={cn("gap-1 font-normal", config.className)}>
      {config.icon}
      {text}
    </Badge>
  )
}

// ============================================================================
// FEATURE CARD COMPONENT
// ============================================================================

interface FeatureCardProps {
  feature: FeatureCard
  onConfigure: () => void
  canEdit: boolean
}

function FeatureCardComponent({ feature, onConfigure, canEdit }: FeatureCardProps) {
  return (
    <Card className="group hover:shadow-md transition-all duration-200 hover:border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              feature.status === "active" && "bg-green-500/10 text-green-600",
              feature.status === "configured" && "bg-blue-500/10 text-blue-600",
              feature.status === "pending" && "bg-yellow-500/10 text-yellow-600",
              feature.status === "error" && "bg-red-500/10 text-red-600"
            )}>
              {feature.icon}
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {feature.title}
                {feature.badge && (
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {feature.badge}
                  </Badge>
                )}
              </CardTitle>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription className="text-sm">
          {feature.description}
        </CardDescription>

        <div className="flex items-center justify-between">
          <StatusBadge status={feature.status} text={feature.statusText} />
        </div>

        {(feature.stats || feature.savings) && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {feature.stats && <span>{feature.stats}</span>}
            {feature.savings && (
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <DollarSign className="h-3 w-3" />
                {feature.savings}
              </span>
            )}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          onClick={onConfigure}
          disabled={!canEdit && feature.status !== "pending"}
        >
          <Settings className="h-3.5 w-3.5 mr-2" />
          Configure
          <ChevronRight className="h-3.5 w-3.5 ml-auto" />
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// CONFIG SHEETS
// ============================================================================

interface ConfigSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature: FeatureCard | null
  cu: CreditUnionData | null
}

function PowerOnConfigSheet({ open, onOpenChange, cu }: Omit<ConfigSheetProps, "feature">) {
  const [loading, setLoading] = useState(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            PowerOn Specs Configuration
          </SheetTitle>
          <SheetDescription>
            139 Symitar stored procedures organized by category
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "Products", count: 1 },
              { name: "Memopost", count: 1 },
              { name: "Transfers", count: 4 },
              { name: "SymXchange", count: 1 },
              { name: "UserView Admin", count: 6 },
              { name: "UserView", count: 19 },
              { name: "MemberGraph", count: 35 },
              { name: "UserService", count: 18 },
              { name: "AccountService", count: 10 },
              { name: "IVR", count: 35 },
              { name: "Mobile Banking", count: 5 },
              { name: "Transactions", count: 4 },
            ].map((cat) => (
              <div key={cat.name} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <span className="text-sm font-medium">{cat.name}</span>
                <Badge variant="secondary">{cat.count}</Badge>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-lg border bg-green-500/5 border-green-500/20">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">All 139 specs registered</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Tenant prefix: {cu?.charter || "SCU"}
            </p>
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button>
            View Full Registry
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function EnrichmentConfigSheet({ open, onOpenChange }: Omit<ConfigSheetProps, "feature" | "cu">) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Transaction Enrichment
          </SheetTitle>
          <SheetDescription>
            AI-powered transaction categorization and merchant matching
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Annual Savings vs MX</span>
                <span className="text-2xl font-bold text-green-600">$49,940</span>
              </div>
              <div className="text-xs text-muted-foreground">
                MX: $50,000/year → CU.APP Edge: $60/year (99.88% reduction)
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Features Included</h4>
            <div className="grid gap-2">
              {[
                "Description cleaning",
                "Merchant matching",
                "ML-powered categorization",
                "Subscription detection",
                "Recurring payment identification",
                "Location matching",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">API Latency</span>
              <Badge variant="secondary">&lt;50ms</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              vs MX 200-500ms (4-10x faster)
            </div>
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Active
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function FDXConfigSheet({ open, onOpenChange }: Omit<ConfigSheetProps, "feature" | "cu">) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            FDX v5.3.1 API
          </SheetTitle>
          <SheetDescription>
            CFPB 1033 compliant financial data exchange
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Version</div>
                <div className="text-lg font-semibold">FDX 5.3.1</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Consent Duration</div>
                <div className="text-lg font-semibold">365 days</div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Compliance Status</h4>
            <div className="grid gap-2">
              {[
                { name: "CFPB 1033", status: "compliant" },
                { name: "OAuth2 Consent Flow", status: "ready" },
                { name: "Data Clusters", status: "ACCOUNT_BASIC, TRANSACTIONS" },
                { name: "Developer Portal", status: "enabled" },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm">{item.name}</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600">
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg border bg-blue-500/5 border-blue-500/20">
            <h4 className="text-sm font-medium mb-2">Endpoints Available</h4>
            <div className="text-xs text-muted-foreground space-y-1 font-mono">
              <div>GET /fdx/v5/accounts</div>
              <div>GET /fdx/v5/accounts/:id/transactions</div>
              <div>POST /fdx/v5/consent</div>
              <div>GET /health</div>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button>
            View API Docs
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProductSummaryDashboard({ cu, onConfigureSection }: ProductSummaryDashboardProps) {
  const auth = useAuth()
  const [features, setFeatures] = useState<FeatureCard[]>([])
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)

  // Sheet states
  const [powerOnOpen, setPowerOnOpen] = useState(false)
  const [enrichmentOpen, setEnrichmentOpen] = useState(false)
  const [fdxOpen, setFdxOpen] = useState(false)
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [cicdOpen, setCicdOpen] = useState(false)
  const [teamOpen, setTeamOpen] = useState(false)

  useEffect(() => {
    setFeatures(getFeatureCards(cu))
  }, [cu])

  const handleConfigure = (featureId: string) => {
    setSelectedFeature(featureId)
    
    switch (featureId) {
      case "poweron":
        setPowerOnOpen(true)
        break
      case "enrichment":
        setEnrichmentOpen(true)
        break
      case "fdx":
        setFdxOpen(true)
        break
      case "reviews":
        setReviewsOpen(true)
        break
      case "cicd":
        setCicdOpen(true)
        break
      case "team":
        setTeamOpen(true)
        break
      default:
        // Navigate to full config section
        const feature = features.find(f => f.id === featureId)
        if (feature?.configSection && onConfigureSection) {
          onConfigureSection(feature.configSection)
        }
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {cu?.displayName || "Credit Union"} Platform
        </h1>
        <p className="text-muted-foreground mt-1">
          All features integrated and configurable in one place
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">139</div>
            <div className="text-sm text-muted-foreground">PowerOn Specs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">$49,940</div>
            <div className="text-sm text-muted-foreground">Annual Savings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">v5.3.1</div>
            <div className="text-sm text-muted-foreground">FDX API</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">1033</div>
            <div className="text-sm text-muted-foreground">CFPB Compliant</div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {features.map((feature) => (
          <FeatureCardComponent
            key={feature.id}
            feature={feature}
            onConfigure={() => handleConfigure(feature.id)}
            canEdit={feature.configSection ? auth.canEdit(feature.configSection) : true}
          />
        ))}
      </div>

      {/* Config Sheets */}
      <PowerOnConfigSheet open={powerOnOpen} onOpenChange={setPowerOnOpen} cu={cu} />
      <EnrichmentConfigSheet open={enrichmentOpen} onOpenChange={setEnrichmentOpen} />
      <FDXConfigSheet open={fdxOpen} onOpenChange={setFdxOpen} />

      {/* Reviews and CI/CD sheets will use dedicated components */}
      <Sheet open={reviewsOpen} onOpenChange={setReviewsOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>App Store Reviews</SheetTitle>
            <SheetDescription>Connect your app stores to monitor reviews</SheetDescription>
          </SheetHeader>
          <div className="mt-6 text-center py-12">
            <Star className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">App Store integration coming up</p>
            <p className="text-sm text-muted-foreground mt-2">Configure credentials to enable</p>
          </div>
          <SheetFooter>
            <Button onClick={() => setReviewsOpen(false)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={cicdOpen} onOpenChange={setCicdOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>CI/CD Pipeline</SheetTitle>
            <SheetDescription>Self-healing deployment configuration</SheetDescription>
          </SheetHeader>
          <div className="mt-6 text-center py-12">
            <GitBranch className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">GitHub Actions workflow ready</p>
            <p className="text-sm text-muted-foreground mt-2">Connect repository to enable</p>
          </div>
          <SheetFooter>
            <Button onClick={() => setCicdOpen(false)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={teamOpen} onOpenChange={setTeamOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>Team & Delegation</SheetTitle>
            <SheetDescription>Manage team members and permissions</SheetDescription>
          </SheetHeader>
          <div className="mt-6 text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Team management</p>
            <p className="text-sm text-muted-foreground mt-2">Invite members and delegate sections</p>
          </div>
          <SheetFooter>
            <Button onClick={() => setTeamOpen(false)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default ProductSummaryDashboard

"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  Users,
  Shield,
  Settings,
  Workflow,
  GitBranch,
  ChevronDown,
  LogOut,
  Bell,
  Search,
  Moon,
  Sun,
  Star,
  Database,
  Activity,
  CheckCircle2,
  Smartphone,
  Table2,
  Menu,
  Sparkles,
  Globe2,
  Building2,
  Play,
  ExternalLink,
  Loader2,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft,
  Info,
  TestTube,
  Layers,
  Code,
  Rocket,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CUConfigDashboard } from "./cu-config-dashboard"
import { GitHubConnectDialog } from "./github-connect-dialog"
import { FieldMappingTable } from "./field-mapping-table"
import { ConfigStudio } from "./config-studio"
import { AIAssistant } from "./ai-assistant"
import { DiscoveryDashboard } from "./discovery-dashboard"
import { SourcesView } from "./sources-view"
import { CUNetworkFeed } from "./cu-network-feed"
import { CUProfileCard } from "./cu-profile-card"
import { TenantProfileSidebar } from "./tenant-profile-sidebar"
import { CuUIDesignTokens } from "./cu-ui-design-tokens"
import { UATView } from "./uat-view"
import { OmnichannelArchitecture } from "./omnichannel-architecture"
import { CodebaseOverview } from "./codebase-overview"
import { MarketingSitePreview } from "./marketing-site-preview"
import { FeatureCatalog } from "./feature-catalog"
import { BusinessLaunchChecklist } from "./business-launch-checklist"
import { ProductSummaryDashboard } from "./product-summary-dashboard"
import { FraudNetworkDashboard } from "./fraud-network-dashboard"
import { CUPublicProfile } from "./cu-public-profile"
import { DATA_SOURCES, getCoreProviderColor, type CreditUnionData } from "@/lib/credit-union-data"
import { useCreditUnions } from "@/hooks/use-credit-unions"
import { FlutterPreview } from "./flutter-preview-simple"
import { AppBuilderStudio } from "./app-builder-studio"
import { DualFlutterStudioShell } from "./dual-flutter-studio-shell"
import { ScreenInspector } from "./screen-inspector"
import { CuWordmarkBadge } from "./cu-wordmark-badge"
import { PilotEnrollmentForm } from "./pilot-enrollment-form"
import { AuthProvider, useAuth, type ConfigSection } from "@/lib/auth-context"
import { InspectorConfigBridgeProvider } from "@/lib/inspector-config-bridge"
import Link from "next/link"

interface BackgroundJob {
  id: string
  name: string
  status: "idle" | "running" | "completed" | "failed"
  lastRun?: string
  itemsProcessed?: number
}

function useBackgroundJobs(charter: string) {
  const [jobs, setJobs] = useState<BackgroundJob[]>([
    { id: "enrichment", name: "CU Enrichment", status: "idle" },
    { id: "branches", name: "Branch Discovery", status: "idle" },
    { id: "logos", name: "Logo Discovery", status: "idle" },
    { id: "products", name: "Product Scraper", status: "idle" },
    { id: "social", name: "Social Profiles", status: "idle" },
    { id: "reviews", name: "App Reviews", status: "idle" },
  ])

  useEffect(() => {
    if (!charter) return
    const fetchJobStatus = async () => {
      try {
        const res = await fetch(`/api/discovery/status?charter=${charter}`)
        if (res.ok) {
          const data = await res.json()
          if (data.jobs) setJobs(data.jobs)
        }
      } catch {}
    }
    const timeout = setTimeout(fetchJobStatus, 1000)
    return () => clearTimeout(timeout)
  }, [charter])

  return jobs
}

function CULogo({ cu, size = "md" }: { cu: CreditUnionData; size?: "sm" | "md" | "lg" }) {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0)
  const [allFailed, setAllFailed] = useState(false)

  const sizes = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-12 w-12" }
  const textSizes = { sm: "text-[10px]", md: "text-xs", lg: "text-base" }

  const domain = cu.website?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]

  const logoUrls = [
    domain ? `https://logo.clearbit.com/${domain}` : null,
    domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null,
    cu.logoUrls?.clearbit,
    cu.logoUrl,
    cu.logoUrls?.direct,
    cu.logoUrls?.google,
    cu.logoUrls?.brandfetch,
  ].filter((url): url is string => Boolean(url))

  useEffect(() => {
    setCurrentUrlIndex(0)
    setAllFailed(false)
  }, [cu.id])

  const currentLogoUrl = logoUrls[currentUrlIndex]

  const handleError = () => {
    if (currentUrlIndex < logoUrls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1)
    } else {
      setAllFailed(true)
    }
  }

  if (allFailed || logoUrls.length === 0) {
    return (
      <div
        className={cn("rounded-lg flex items-center justify-center font-bold text-white shrink-0", sizes[size])}
        style={{ backgroundColor: cu.primaryColor || cu.logoFallbackColor || "#6366f1" }}
      >
        <span className={textSizes[size]}>{(cu.displayName || cu.name || "CU").substring(0, 2).toUpperCase()}</span>
      </div>
    )
  }

  return (
    <div className={cn("relative shrink-0 rounded-lg overflow-hidden bg-white border", sizes[size])}>
      <img
        src={currentLogoUrl}
        alt={cu.displayName || cu.name}
        className="w-full h-full object-contain p-0.5"
        loading="lazy"
        onError={handleError}
      />
    </div>
  )
}

type UserRole = "admin" | "employee" | "developer"

const ROLES = [
  { id: "admin" as const, name: "CU Administrator", icon: <Shield className="h-4 w-4" />, color: "bg-red-600" },
  { id: "employee" as const, name: "Member Advocate", icon: <Users className="h-4 w-4" />, color: "bg-blue-600" },
  { id: "developer" as const, name: "Developer", icon: <GitBranch className="h-4 w-4" />, color: "bg-emerald-600" },
]

interface NavItem {
  id: string
  name: string
  icon: React.ReactNode
  route?: string
  href?: string
  badge?: string
  description: string
}

const NAV_ITEMS: NavItem[] = [
  { id: "summary", name: "Product Summary", icon: <Layers className="h-4 w-4" />, route: "/?view=summary", badge: "NEW", description: "All features at a glance with Configure buttons - PowerOn, Enrichment, FDX, Reviews, CI/CD, Team" },
  { id: "config", name: "Configuration", icon: <Settings className="h-4 w-4" />, route: "/?view=config", description: "Exhaustive 16-tier config editor (Identity, Design Tokens, Features, IVR, Products, Rules, Fraud, Compliance, Integrations, Channels, Notifications, Content, UX, AI, Deployment, PowerOn)" },
  { id: "dual-studio", name: "Dual Studio", icon: <Layers className="h-4 w-4" />, route: "/?view=dual-studio", badge: "cu_ui", description: "Two Flutter apps side by side — Design System + Live Preview (top nav visible on load)" },
  { id: "design-system", name: "Design System", icon: <Sparkles className="h-4 w-4" />, route: "/?view=design-system", badge: "cu_ui", description: "Complete Flutter UI design system - 50+ components, screens, tokens, light/dark themes" },
  { id: "preview", name: "App Preview", icon: <Smartphone className="h-4 w-4" />, route: "/?view=preview", description: "Live Flutter mobile preview with cu_ui components" },
  { id: "gallery", name: "CU Gallery", icon: <Building2 className="h-4 w-4" />, href: "/gallery", route: "/gallery", badge: "4,300+", description: "All 4,300+ credit unions" },
  { id: "status", name: "Status", icon: <Activity className="h-4 w-4" />, route: "/?view=status", description: "Overview dashboard with stats" },
  { id: "profile", name: "CU Profile", icon: <Building2 className="h-4 w-4" />, route: "/?view=profile", description: "Credit union profile and branding" },
  { id: "fraud", name: "Fraud Network", icon: <Shield className="h-4 w-4" />, badge: "Private", route: "/?view=fraud", description: "Private federated fraud intelligence - daisy chain signals across 4,300+ CUs" },
  { id: "enrichment", name: "Data Discovery", icon: <Sparkles className="h-4 w-4" />, route: "/?view=enrichment", description: "AI-powered data discovery" },
  { id: "mapping", name: "Field Mapping", icon: <Table2 className="h-4 w-4" />, route: "/?view=mapping", description: "Map PowerOn fields to app config" },
  { id: "tokens", name: "Design Tokens", icon: <Sparkles className="h-4 w-4" />, route: "/?view=tokens", badge: "CU UI", description: "cu_ui design system tokens" },
  { id: "apps", name: "App Reviews", icon: <Star className="h-4 w-4" />, route: "/?view=apps", description: "App Store reviews" },
  { id: "support", name: "Member Support", icon: <Users className="h-4 w-4" />, badge: "3", route: "/?view=support", description: "Support queue and IVR logs" },
  { id: "github", name: "GitHub CI/CD", icon: <GitBranch className="h-4 w-4" />, route: "/?view=github", description: "GitHub sync and deployment" },
  { id: "launch", name: "Business Launch", icon: <Rocket className="h-4 w-4" />, route: "/?view=launch", badge: "7", description: "Complete launch checklist - Infrastructure, databases, integrations, mobile build, testing, go-live" },
  { id: "rules", name: "Rule Builder", icon: <Workflow className="h-4 w-4" />, href: "/rules", route: "/rules", description: "Visual business rules builder" },
  { id: "sources", name: "Data Sources", icon: <Database className="h-4 w-4" />, route: "/?view=sources", description: "Connected integrations" },
  { id: "uat", name: "UAT Testing", icon: <TestTube className="h-4 w-4" />, route: "/?view=uat", badge: "31", description: "User Acceptance Testing - Test suites and results" },
  { id: "omnichannel", name: "Omnichannel", icon: <Layers className="h-4 w-4" />, route: "/?view=omnichannel", badge: "ALL", description: "THE OMNICHANNEL SYSTEM - All channels unified: IVR, Mobile, Web, Chat working as ONE experience" },
  { id: "marketing", name: "Marketing Site", icon: <Globe2 className="h-4 w-4" />, route: "/?view=marketing", badge: "CMS", description: "Edit and preview your credit union's marketing website - Full CMS with pages, media library, and instant publishing" },
  { id: "features", name: "Feature Catalog", icon: <Package className="h-4 w-4" />, route: "/?view=features", description: "Feature catalog and package cloning" },
  { id: "codebase", name: "Codebase", icon: <Code className="h-4 w-4" />, route: "/?view=codebase", badge: "432K", description: "Source code navigation - 15,289 files, all sections mapped" },
  { id: "screen-inspector", name: "Screen Inspector", icon: <Layers className="h-4 w-4" />, route: "/?view=screen-inspector", badge: "209+", description: "Click any element to see its data source - Symitar, Visa DPS, MX, Alloy mapped per screen" },
]

export function UnifiedPlatform() {
  const [mounted, setMounted] = useState(false)
  const [role, setRole] = useState<UserRole>("admin")
  const [cuConfig, setCuConfig] = useState<any>(null)
  // Get initial view from URL params - default to summary (product overview)
  const [nav, setNav] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('view') || "summary"
    }
    return "summary"
  })
  
  // Update URL when nav changes
  useEffect(() => {
    if (typeof window !== 'undefined' && nav) {
      const url = new URL(window.location.href)
      url.searchParams.set('view', nav)
      window.history.replaceState({}, '', url.toString())
    }
  }, [nav])
  
  // Listen for URL changes (e.g., browser back/forward)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const view = params.get('view') || "config"
      if (view !== nav) {
        setNav(view)
      }
    }
    
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [nav])
  const [dark, setDark] = useState(false)
  const [githubOpen, setGithubOpen] = useState(false)
  const [cu, setCU] = useState<CreditUnionData | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cuSearchOpen, setCuSearchOpen] = useState(false)
  
  // Auth context - for tenant-scoped view
  // In production: CU admins only see their CU, superadmins see the picker
  // For now, we use a simple state that can be toggled
  const [showCuPicker, setShowCuPicker] = useState(true) // true = superadmin view, false = tenant view
  const [cuSearchQuery, setCuSearchQuery] = useState("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarHoverExpanded, setSidebarHoverExpanded] = useState(false)
  const [pilotSheetOpen, setPilotSheetOpen] = useState(false)
  const sidebarExpanded = !sidebarCollapsed || sidebarHoverExpanded

  const { creditUnions, isLoading: cuLoading, totalCount, hasMore, loadMore } = useCreditUnions({
    search: cuSearchQuery,
    limit: 100,
    sortBy: "total_assets",
    sortOrder: "desc",
  })

  const { isPilotEnrolled, refreshPilotStatus, user: authUser, signOut: authSignOut } = useAuth()
  const userEmail = authUser?.email ?? ""
  const userDisplayName = authUser?.user_metadata?.name ?? userEmail.split("@")[0] ?? "User"
  const userInitials = userDisplayName.slice(0, 2).toUpperCase()

  useEffect(() => {
    if (creditUnions.length > 0 && !cu) setCU(creditUnions[0])
  }, [creditUnions, cu])

  // Load CU config for branding replacement
  useEffect(() => {
    if (!cu?.id) return
    
    async function loadConfig() {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data } = await supabase
          .from('cu_configs')
          .select('config')
          .eq('tenant_id', cu.id)
          .single()
        
        if (data?.config) {
          setCuConfig(data.config)
        }
      } catch (error) {
        console.warn('Could not load CU config:', error)
      }
    }
    
    loadConfig()
  }, [cu?.id])

  const backgroundJobs = useBackgroundJobs(cu?.charter || "")
  const currentRole = ROLES.find((r) => r.id === role)!
  const connected = DATA_SOURCES.filter((s) => s.status === "connected").length

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (cuSearchOpen && !target.closest('[data-cu-selector]')) {
        setCuSearchOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [cuSearchOpen])

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")
  }, [dark])

  const handleBridgeNavigate = useCallback(
    (view: "config" | "screen-inspector" | "dual-studio", _screenId?: string | null, _tierId?: string | null) => {
      setNav(view)
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        url.searchParams.set("view", view)
        window.history.replaceState({}, "", url.toString())
      }
    },
    []
  )

  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
      </div>
    )
  }

  const SidebarContent = ({ onNavClick, collapsed = false }: { onNavClick?: () => void; collapsed?: boolean }) => (
    <>
      {/* Collapse/Expand toggle at top (desktop only) */}
      {!collapsed && (
        <div className="p-2 border-b hidden md:flex">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-8" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <PanelLeftClose className="h-4 w-4" />
            <span className="text-sm">Collapse</span>
          </Button>
        </div>
      )}
      {/* CU Selector - Only shown for superadmin (showCuPicker=true) */}
      {/* For CU admins (tenant-scoped), they see only their CU info, no picker */}
      {!collapsed && showCuPicker && (
        <div className="p-3 border-b" data-cu-selector>
          <div className="relative">
            <Button
              variant="ghost"
              className="w-full h-auto py-2 px-3 justify-between rounded-full hover:bg-muted/50"
              onClick={() => setCuSearchOpen(!cuSearchOpen)}
            >
              {cu ? (
                <div className="flex items-center gap-2 min-w-0">
                  <CULogo cu={cu} size="sm" />
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium leading-none truncate">{cu.displayName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">#{cu.charter} • {cu.state}</p>
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">Select Credit Union...</span>
              )}
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", cuSearchOpen && "rotate-180")} />
            </Button>

            {cuSearchOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search 4,300+ credit unions..." value={cuSearchQuery} onChange={(e) => setCuSearchQuery(e.target.value)} className="pl-8 h-9" autoFocus />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 px-1">{totalCount.toLocaleString()} credit unions</p>
                </div>
                <ScrollArea className="h-[300px]">
                  {cuLoading && creditUnions.length === 0 ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : creditUnions.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">No credit unions found</div>
                  ) : (
                    <div className="p-1">
                      {creditUnions.map((c) => (
                        <button
                          key={c.id}
                          className={cn("w-full flex items-center gap-2 p-2 rounded-md text-left hover:bg-muted/50 transition-colors", cu?.id === c.id && "bg-muted")}
                          onClick={() => { setCU(c); setCuSearchOpen(false); setCuSearchQuery("") }}
                        >
                          <CULogo cu={c} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{c.displayName}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{c.assetsFormatted} • {c.membersFormatted} members • {c.state}</p>
                          </div>
                          {cu?.id === c.id && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                        </button>
                      ))}
                      {hasMore && (
                        <Button variant="ghost" size="sm" className="w-full mt-2" onClick={loadMore} disabled={cuLoading}>
                          {cuLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Load more...
                        </Button>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tenant-only view - Shows current CU without picker (for CU admins) */}
      {!collapsed && !showCuPicker && cu && (
        <div className="p-3 border-b">
          <div className="flex items-center gap-2">
            <CULogo cu={cu} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-none truncate">{cu.displayName}</p>
              <p className="text-[10px] text-muted-foreground truncate">#{cu.charter} • {cu.state}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-auto">
        <TooltipProvider delayDuration={200}>
          {NAV_ITEMS.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                {item.href ? (
                  <Link href={item.href}>
                    <Button
                      variant={nav === item.id ? "secondary" : "ghost"}
                      size="sm"
                      className={cn("w-full h-10 md:h-8 group", collapsed ? "justify-center px-2" : "justify-start gap-2")}
                      onClick={() => { setNav(item.id); onNavClick?.() }}
                    >
                      {item.icon}
                      {!collapsed && <span className="text-sm flex-1 text-left">{item.name}</span>}
                      {!collapsed && item.badge && <Badge variant={item.badge === "Live" ? "default" : "destructive"} className="ml-auto h-4 px-1 text-[10px]">{item.badge}</Badge>}
                      {!collapsed && <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant={nav === item.id ? "secondary" : "ghost"}
                    size="sm"
                    className={cn("w-full h-10 md:h-8", collapsed ? "justify-center px-2" : "justify-start gap-2")}
                    onClick={() => { setNav(item.id); onNavClick?.() }}
                  >
                    {item.icon}
                    {!collapsed && <span className="text-sm flex-1 text-left">{item.name}</span>}
                    {!collapsed && item.badge && <Badge variant={item.badge === "Live" ? "default" : "destructive"} className="ml-auto h-4 px-1 text-[10px]">{item.badge}</Badge>}
                  </Button>
                )}
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[250px]">
                <div className="space-y-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>

      {/* Background Jobs */}
      {!collapsed && (
        <div className="px-3 border-t py-6 hidden md:block">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Background Jobs</p>
          <div className="space-y-1">
            {backgroundJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full", job.status === "running" ? "bg-blue-500 animate-pulse" : job.status === "completed" ? "bg-green-500" : job.status === "failed" ? "bg-red-500" : "bg-gray-400")} />
                  <span className="text-muted-foreground">{job.name}</span>
                </div>
                <span className={cn("text-[10px]", job.status === "running" ? "text-blue-500" : job.status === "failed" ? "text-red-500" : "text-muted-foreground")}>
                  {job.status === "running" ? "Running" : job.status === "completed" ? job.itemsProcessed ? `${job.itemsProcessed} found` : "Done" : job.status === "failed" ? "Failed" : "Idle"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dark Mode */}
      <div className="p-2 border-t">
        <Button variant="ghost" size="sm" className={cn("w-full h-10 md:h-8", collapsed ? "justify-center px-2" : "justify-start gap-2")} onClick={() => setDark(!dark)}>
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span className="text-sm">{dark ? "Light" : "Dark"}</span>}
        </Button>
      </div>

      {/* Enroll in pilot (unlocks app download links) */}
      {!isPilotEnrolled && (
        <div className="p-2 border-t">
          <Sheet open={pilotSheetOpen} onOpenChange={setPilotSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className={cn("w-full h-10 md:h-8", collapsed ? "justify-center px-2" : "justify-start gap-2")}>
                <Rocket className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-sm">Enroll in pilot</span>}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <div className="space-y-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Enroll in the pilot</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Unlock app download links (App Store / Google Play) for your credit union.
                  </p>
                </div>
                <PilotEnrollmentForm
                  user={authUser}
                  embedded
                  onSuccess={() => {
                    refreshPilotStatus()
                    setPilotSheetOpen(false)
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* User Menu (shown when expanded; optional when no auth) */}
      {!collapsed && (
        <div className="p-2 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-2 px-2">
                <div className="relative h-7 w-7 shrink-0">
                  {cu ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CULogo cu={cu} size="sm" />
                    </div>
                  ) : (
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs bg-muted">{userInitials}</AvatarFallback>
                    </Avatar>
                  )}
                  <span className="absolute bottom-0 right-0 rounded bg-primary px-0.5 leading-none text-primary-foreground">
                    <CuWordmarkBadge className="text-[10px]" />
                  </span>
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none truncate">{userDisplayName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{userEmail || currentRole.name}</p>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="text-xs">Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2">
                  <div className={cn("h-4 w-4 rounded flex items-center justify-center text-white", currentRole.color)}>{currentRole.icon}</div>
                  <span>Switch Role</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {ROLES.map((r) => (
                      <DropdownMenuItem key={r.id} onClick={() => setRole(r.id)} className="gap-2">
                        <div className={cn("h-4 w-4 rounded flex items-center justify-center text-white", r.color)}>{r.icon}</div>
                        <span>{r.name}</span>
                        {role === r.id && <CheckCircle2 className="h-3 w-3 ml-auto text-green-500" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-destructive" onClick={() => authSignOut()}>
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

    </>
  )

  return (
    <TooltipProvider>
      <InspectorConfigBridgeProvider onNavigateToView={handleBridgeNavigate}>
      <div className={cn("h-screen flex flex-col md:flex-row overflow-hidden", dark ? "dark" : "")}>
        {/* Mobile Header */}
        <header className="md:hidden h-14 border-b flex items-center justify-between px-4 bg-card shrink-0">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex flex-col h-full">
                <SidebarContent onNavClick={() => setMobileMenuOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            {cu ? (
              <>
                <CULogo cu={cu} size="sm" />
                <span className="font-semibold text-sm">{cu.displayName}</span>
              </>
            ) : (
              <span className="text-muted-foreground text-sm">Loading...</span>
            )}
          </div>
          <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
        </header>

        {/* Desktop Sidebar - hover when collapsed expands it temporarily */}
        <aside
          className={cn(
            "hidden md:flex border-r bg-card flex-col shrink-0 transition-all duration-300 z-20",
            sidebarExpanded ? "w-56 lg:w-60" : "w-16"
          )}
          onMouseEnter={() => sidebarCollapsed && setSidebarHoverExpanded(true)}
          onMouseLeave={() => setSidebarHoverExpanded(false)}
        >
          {sidebarExpanded ? (
            <SidebarContent collapsed={false} />
          ) : (
            <>
              {/* Collapsed: icon strip only; hover expands via parent onMouseEnter */}
              <div className="p-2 border-b flex flex-col items-center gap-2">
                {cu ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="relative rounded-lg overflow-hidden shrink-0 focus:outline-none focus:ring-2 focus:ring-primary"
                        onClick={() => setSidebarCollapsed(false)}
                        aria-label="Expand sidebar"
                      >
                        <CULogo cu={cu} size="sm" />
                        <span className="absolute bottom-0 right-0 rounded bg-primary px-0.5 leading-none text-primary-foreground">
                          <CuWordmarkBadge className="text-[10px]" />
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{cu.displayName}</TooltipContent>
                  </Tooltip>
                ) : (
                  <div className="h-6 w-6 rounded-lg bg-muted shrink-0" />
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarCollapsed(false)}>
                      <PanelLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Expand sidebar (or hover)</TooltipContent>
                </Tooltip>
              </div>
              <SidebarContent collapsed={true} />
            </>
          )}
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Desktop Header */}
          <header className="hidden md:flex h-12 border-b items-center justify-between px-4 bg-card shrink-0">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search config, fields, keywords..." className="h-8 shadow-none border-0 bg-muted/50" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {connected}/{DATA_SOURCES.length}
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                    <Bell className="h-4 w-4" />
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 bg-transparent" onClick={() => setGithubOpen(true)}>
                <GitBranch className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">GitHub</span>
              </Button>
            </div>
          </header>

          {/* Content - everything unlocked (no login gate) */}
          <div className="flex-1 overflow-auto">
            {!cu ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading credit unions...</p>
                  <p className="text-xs text-muted-foreground mt-2">Fetching {totalCount.toLocaleString()} records</p>
                </div>
              </div>
            ) : (
              <>
                {/* PRODUCT SUMMARY - GitHub-style cards with Configure buttons (NEW DEFAULT) */}
                {nav === "summary" && (
                  <ProductSummaryDashboard 
                    cu={cu} 
                    onConfigureSection={(section) => setNav("config")} 
                  />
                )}

                {nav === "status" && <StatusView cu={cu} onNavigate={setNav} />}
                {nav === "profile" && (
                  <div className="flex gap-6 p-6 max-w-7xl mx-auto">
                    <div className="flex-1 min-w-0">
                      <CUPublicProfile tenantId={cu.id} cu={cu} editable={true} />
                    </div>
                    <aside className="hidden lg:block w-80 shrink-0"><TenantProfileSidebar cu={cu} /></aside>
                  </div>
                )}
                {nav === "fraud" && (
                  <FraudNetworkDashboard 
                    tenantId={cu.id} 
                    tenantName={cu.displayName}
                    charterNumber={cu.charter}
                  />
                )}
                {nav === "enrichment" && <DiscoveryDashboard cu={cu} />}

                {/* CONFIGURATION - Exhaustive 16-tier editor (default home) */}
                {nav === "config" && <CUConfigDashboard selectedCU={cu} />}

                {/* DUAL STUDIO - Two Flutter apps side by side, top nav visible on first load */}
                {nav === "dual-studio" && <DualFlutterStudioShell cu={cu} />}
                {/* DESIGN SYSTEM - Full cu_ui Flutter design system showcase */}
                {nav === "design-system" && <DesignSystemView cu={cu} />}

                {/* APP PREVIEW - Pure Flutter preview with cu_ui (no config editing) */}
                {nav === "preview" && <AppPreviewView cu={cu} />}

                {nav === "mapping" && <FieldMappingTable cu={cu} />}
                {nav === "tokens" && (
                  <div className="p-6 max-w-6xl mx-auto"><CuUIDesignTokens cu={cu} /></div>
                )}
                {nav === "apps" && <AppsView cu={cu} />}
                {nav === "support" && <SupportView />}
                {nav === "github" && <GitHubView cu={cu} onConnectGitHub={() => setGithubOpen(true)} />}
                {nav === "launch" && <BusinessLaunchChecklist cu={cu} />}
                {nav === "sources" && <SourcesView />}
                {nav === "uat" && <UATView cu={cu} />}
                {nav === "omnichannel" && <OmnichannelArchitecture cu={cu} />}
                {nav === "marketing" && <MarketingSitePreview cu={cu} />}
                {nav === "features" && (
                  <FeatureCatalog
                    cuId={cu.id}
                    cuName={cu.displayName}
                    cuPrefix={cuConfig?.poweron?.prefix}
                  />
                )}
                {nav === "codebase" && <CodebaseOverview />}
                {nav === "screen-inspector" && <ScreenInspector tenantId={cu.id} />}
              </>
            )}
          </div>
        </main>

        <GitHubConnectDialog open={githubOpen} onOpenChange={setGithubOpen} cuConfig={null} />
        <AIAssistant />
      </div>
      </InspectorConfigBridgeProvider>
    </TooltipProvider>
  )
}

function AppsView({ cu }: { cu: CreditUnionData }) {
  const [reviews, setReviews] = useState<Array<{ platform: string; rating: number; review: string; sentiment: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true)
      try {
        const res = await fetch(`/api/app-store/reviews?creditUnionId=${cu.id}`)
        if (res.ok) {
          const data = await res.json()
          setReviews(data.reviews || [])
        }
      } catch {}
      finally {
        setLoading(false)
      }
    }
    fetchReviews()
  }, [cu.id])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">App Reviews for {cu.displayName}</h2>
      {loading ? (
        <Card><CardContent className="py-12 text-center"><div className="h-8 w-8 mx-auto mb-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" /><p className="text-muted-foreground">Loading reviews...</p></CardContent></Card>
      ) : reviews.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" /><h3 className="font-medium mb-2">No Reviews Found</h3><p className="text-sm text-muted-foreground mb-4">App store reviews will appear here once connected.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((r, i) => (
            <Card key={i}><CardContent className="p-4"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2 mb-1"><Badge variant="outline">{r.platform}</Badge><div className="flex items-center">{Array.from({ length: 5 }).map((_, j) => (<Star key={j} className={cn("h-3 w-3", j < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />))}</div></div><p className="text-sm">{r.review}</p></div><Badge variant={r.sentiment === "positive" ? "default" : r.sentiment === "negative" ? "destructive" : "secondary"}>{r.sentiment}</Badge></div></CardContent></Card>
          ))}
        </div>
      )}
    </div>
  )
}

function SupportView() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">Member Support Queue</h2>
      <Card><CardContent className="py-12 text-center"><Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" /><h3 className="font-medium mb-2">No Support System Connected</h3><p className="text-sm text-muted-foreground">Connect your support system to view tickets here.</p></CardContent></Card>
    </div>
  )
}

function GitHubView({ cu, onConnectGitHub }: { cu: CreditUnionData; onConnectGitHub: () => void }) {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">GitHub CI/CD</h1><p className="text-sm text-muted-foreground">Connect your GitHub repository</p></div>
      </div>
      <Card><CardContent className="py-12 text-center"><GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" /><h3 className="font-medium mb-2">No GitHub Repository Connected</h3><p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">Connect a GitHub repository for {cu.displayName}.</p><Button onClick={onConnectGitHub}><GitBranch className="h-4 w-4 mr-2" />Connect GitHub Repository</Button></CardContent></Card>
    </div>
  )
}

function AppPreviewView({ cu }: { cu: CreditUnionData }) {
  // Use the new dual-phone App Builder Studio in preview mode
  return <AppBuilderStudio cu={cu} mode="preview" />
}

function DesignSystemView({ cu }: { cu: CreditUnionData }) {
  // Use the new dual-phone App Builder Studio in full mode (both phones)
  return <AppBuilderStudio cu={cu} mode="full" />
}

function StatusView({ cu, onNavigate }: { cu: CreditUnionData; onNavigate: (nav: string) => void }) {
  const connected = DATA_SOURCES.filter((s) => s.status === "connected").length
  const mappingStats = cu.mappingStats ?? { critical: 0, total: 1, mapped: 0 }
  const coverage = mappingStats.total > 0 ? Math.round((mappingStats.critical / mappingStats.total) * 100) : 0

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-6xl mx-auto">
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="h-16 w-16 rounded-xl flex items-center justify-center text-white text-xl font-bold shrink-0" style={{ backgroundColor: cu.primaryColor }}>{cu.displayName.substring(0, 2).toUpperCase()}</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{cu.displayName}</h2>
              <p className="text-muted-foreground text-sm">Charter #{cu.charter} • {cu.city}, {cu.state}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge>{cu.membersFormatted} members</Badge>
                <Badge variant="outline">{cu.assetsFormatted} assets</Badge>
                <Badge variant="secondary" className="gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: getCoreProviderColor(cu.coreBanking?.provider || "") }} />{cu.coreBanking?.provider || "Unknown"}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1 bg-transparent" onClick={() => cu.website && window.open(cu.website, '_blank')}><ExternalLink className="h-3 w-3" />Website</Button>
              <Button size="sm" className="gap-1" onClick={() => onNavigate("preview")}><Play className="h-3 w-3" />Preview App</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card><CardContent><p className="text-2xl font-bold">{mappingStats.mapped}</p><p className="text-xs text-muted-foreground">of {mappingStats.total} fields mapped</p></CardContent></Card>
        <Card><CardContent><p className="text-2xl font-bold">{connected}</p><p className="text-xs text-muted-foreground">sources connected</p></CardContent></Card>
        <Card><CardContent><p className="text-2xl font-bold">—</p><p className="text-xs text-muted-foreground">No config saved</p></CardContent></Card>
        <Card><CardContent><p className="text-2xl font-bold">{coverage}%</p><p className="text-xs text-muted-foreground">data complete</p></CardContent></Card>
      </div>

      <Card><CardContent className="py-8 text-center"><Activity className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-50" /><p className="text-sm text-muted-foreground">No recent activity.</p></CardContent></Card>
    </div>
  )
}

// ============================================================================
// WRAPPED EXPORT WITH AUTH PROVIDER
// ============================================================================

/**
 * UnifiedPlatform wrapped with AuthProvider for production use.
 * In production, CU admins will only see their own credit union.
 * Superadmins (cu.app/cuos.com emails) see the CU picker.
 */
export function UnifiedPlatformWithAuth() {
  return (
    <AuthProvider>
      <UnifiedPlatform />
    </AuthProvider>
  )
}

export default UnifiedPlatform

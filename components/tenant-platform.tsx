"use client"

// Tenant-isolated view - credit unions only see their own data
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  Settings,
  Activity,
  Smartphone,
  Star,
  Users,
  Database,
  Moon,
  Sun,
  Bell,
  LogOut,
  MapPin,
  FileText,
  CreditCard,
  Phone,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CUConfigDashboard } from "./cu-config-dashboard"
import { FlutterPreview } from "./flutter-preview"
import { AIAssistant } from "./ai-assistant"
import type { CreditUnionData } from "@/lib/credit-union-data"

interface TenantPlatformProps {
  tenant: CreditUnionData
  userEmail: string
  userName: string
  userRole: "admin" | "employee" | "marketing" | "developer"
}

const NAV_ITEMS = [
  { id: "overview", name: "Overview", icon: <Activity className="h-4 w-4" /> },
  { id: "config", name: "Configuration", icon: <Settings className="h-4 w-4" /> },
  { id: "preview", name: "App Preview", icon: <Smartphone className="h-4 w-4" /> },
  { id: "branches", name: "Branches", icon: <MapPin className="h-4 w-4" /> },
  { id: "products", name: "Products", icon: <CreditCard className="h-4 w-4" /> },
  { id: "ivr", name: "IVR & Voice", icon: <Phone className="h-4 w-4" /> },
  { id: "reviews", name: "App Reviews", icon: <Star className="h-4 w-4" /> },
  { id: "support", name: "Member Support", icon: <Users className="h-4 w-4" />, badge: "3" },
  { id: "data", name: "Data & Analytics", icon: <Database className="h-4 w-4" /> },
  { id: "docs", name: "Documentation", icon: <FileText className="h-4 w-4" /> },
]

function TenantLogo({ tenant, size = "md" }: { tenant: CreditUnionData; size?: "sm" | "md" | "lg" }) {
  const [logoSrc, setLogoSrc] = useState<string>("")
  const [fallbackIndex, setFallbackIndex] = useState(0)

  const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14" }
  const textSizes = { sm: "text-xs", md: "text-sm", lg: "text-lg" }

  const fallbackChain = [
    tenant.logoUrls?.direct,
    tenant.logoUrls?.brandfetch,
    tenant.logoUrls?.clearbit,
    tenant.logoUrls?.google,
  ].filter(Boolean) as string[]

  useEffect(() => {
    setFallbackIndex(0)
    setLogoSrc(fallbackChain[0] || "")
  }, [tenant.id])

  function handleError() {
    if (fallbackIndex < fallbackChain.length - 1) {
      setFallbackIndex(fallbackIndex + 1)
      setLogoSrc(fallbackChain[fallbackIndex + 1])
    } else {
      setLogoSrc("")
    }
  }

  if (!logoSrc) {
    return (
      <div
        className={cn("rounded-xl flex items-center justify-center font-bold text-white shrink-0", sizes[size])}
        style={{ backgroundColor: tenant.primaryColor }}
      >
        <span className={textSizes[size]}>{tenant.displayName.substring(0, 2).toUpperCase()}</span>
      </div>
    )
  }

  return (
    <div className={cn("relative shrink-0 rounded-xl overflow-hidden bg-white border", sizes[size])}>
      <img
        src={logoSrc || "/placeholder.svg"}
        alt={tenant.displayName}
        className="w-full h-full object-contain p-1"
        onError={handleError}
      />
    </div>
  )
}

export function TenantPlatform({ tenant, userEmail, userName, userRole }: TenantPlatformProps) {
  const [nav, setNav] = useState("overview")
  const [dark, setDark] = useState(false)

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [dark])

  return (
    <TooltipProvider>
      <div className={cn("min-h-screen flex", dark ? "dark" : "")}>
        {/* Sidebar - Fixed, no CU selector since tenant is locked */}
        <aside className="w-64 border-r bg-card flex flex-col shrink-0">
          {/* Tenant Header - Locked to single CU */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <TenantLogo tenant={tenant} size="md" />
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm truncate">{tenant.displayName}</h2>
                <p className="text-xs text-muted-foreground">Charter #{tenant.charter}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {tenant.state}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {tenant.membersFormatted} members
              </Badge>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-0.5 overflow-auto">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.id}
                variant={nav === item.id ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start gap-2 h-9"
                onClick={() => setNav(item.id)}
              >
                {item.icon}
                <span className="text-sm">{item.name}</span>
                {item.badge && (
                  <Badge variant="destructive" className="ml-auto h-4 px-1 text-[10px]">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            ))}
          </nav>

          {/* Help button */}
          <div className="p-2 border-t">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-9">
              <HelpCircle className="h-4 w-4" />
              <span className="text-sm">Help & Support</span>
            </Button>
          </div>

          {/* Dark mode toggle */}
          <div className="p-2 border-t">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-9" onClick={() => setDark(!dark)}>
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="text-sm">{dark ? "Light Mode" : "Dark Mode"}</span>
            </Button>
          </div>

          {/* User profile */}
          <div className="p-2 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-muted">
                      {userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">{userName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{userRole}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem className="text-xs text-muted-foreground">{userEmail}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-14 border-b flex items-center justify-between px-4 bg-card shrink-0">
            <div>
              <h1 className="font-semibold">{NAV_ITEMS.find((i) => i.id === nav)?.name || "Overview"}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* Content area */}
          <div className="flex-1 overflow-auto">
            {nav === "overview" && <TenantOverview tenant={tenant} />}
            {nav === "config" && <CUConfigDashboard selectedCU={tenant} />}
            {nav === "preview" && <FlutterPreview cu={tenant} />}
            {nav === "branches" && <BranchesPlaceholder tenant={tenant} />}
            {nav === "products" && <ProductsPlaceholder tenant={tenant} />}
            {nav === "ivr" && <IVRPlaceholder tenant={tenant} />}
            {nav === "reviews" && <ReviewsPlaceholder tenant={tenant} />}
            {nav === "support" && <SupportPlaceholder />}
            {nav === "data" && <DataPlaceholder />}
            {nav === "docs" && <DocsPlaceholder />}
          </div>
        </main>

        {/* AI Assistant */}
        <AIAssistant tenantName={tenant.displayName} />
      </div>
    </TooltipProvider>
  )
}

// Overview component
function TenantOverview({ tenant }: { tenant: CreditUnionData }) {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total Members</p>
          <p className="text-2xl font-bold">{tenant.membersFormatted}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total Assets</p>
          <p className="text-2xl font-bold">{tenant.assetsFormatted}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">App Downloads</p>
          <p className="text-2xl font-bold">--</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">App Rating</p>
          <p className="text-2xl font-bold">--</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Getting Started</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
            </div>
            <div>
              <p className="font-medium text-sm">Credit union claimed</p>
              <p className="text-xs text-muted-foreground">Your account is verified</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <span className="text-yellow-600 dark:text-yellow-400 text-sm">2</span>
            </div>
            <div>
              <p className="font-medium text-sm">Configure your branding</p>
              <p className="text-xs text-muted-foreground">Upload logo, set colors</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">3</span>
            </div>
            <div>
              <p className="font-medium text-sm">Verify branch locations</p>
              <p className="text-xs text-muted-foreground">Review discovered branches</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">4</span>
            </div>
            <div>
              <p className="font-medium text-sm">Preview your mobile app</p>
              <p className="text-xs text-muted-foreground">See your app in action</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Placeholder components for each section
function BranchesPlaceholder({ tenant }: { tenant: CreditUnionData }) {
  return (
    <div className="p-6">
      <div className="bg-card border rounded-xl p-8 text-center">
        <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">Branch Locations</h3>
        <p className="text-muted-foreground mb-4">
          Discover and verify your branch locations. We'll automatically find branches via Google Places.
        </p>
        <Button>Discover Branches</Button>
      </div>
    </div>
  )
}

function ProductsPlaceholder({ tenant }: { tenant: CreditUnionData }) {
  return (
    <div className="p-6">
      <div className="bg-card border rounded-xl p-8 text-center">
        <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">Product Catalog</h3>
        <p className="text-muted-foreground mb-4">
          Manage your loan and savings products. We can scan your website to pre-fill product data.
        </p>
        <Button>Scan Website for Products</Button>
      </div>
    </div>
  )
}

function IVRPlaceholder({ tenant }: { tenant: CreditUnionData }) {
  return (
    <div className="p-6">
      <div className="bg-card border rounded-xl p-8 text-center">
        <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">IVR & Voice Configuration</h3>
        <p className="text-muted-foreground mb-4">
          Configure your interactive voice response system, including voice settings, prompts, and call routing.
        </p>
        <Button>Configure IVR</Button>
      </div>
    </div>
  )
}

function ReviewsPlaceholder({ tenant }: { tenant: CreditUnionData }) {
  return (
    <div className="p-6">
      <div className="bg-card border rounded-xl p-8 text-center">
        <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">App Store Reviews</h3>
        <p className="text-muted-foreground mb-4">
          Monitor and respond to reviews from the iOS App Store and Google Play Store.
        </p>
        <Button>Fetch Reviews</Button>
      </div>
    </div>
  )
}

function SupportPlaceholder() {
  return (
    <div className="p-6">
      <div className="bg-card border rounded-xl p-8 text-center">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">Member Support</h3>
        <p className="text-muted-foreground">Support ticket management coming soon.</p>
      </div>
    </div>
  )
}

function DataPlaceholder() {
  return (
    <div className="p-6">
      <div className="bg-card border rounded-xl p-8 text-center">
        <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">Data & Analytics</h3>
        <p className="text-muted-foreground">Analytics dashboard coming soon.</p>
      </div>
    </div>
  )
}

function DocsPlaceholder() {
  return (
    <div className="p-6">
      <div className="bg-card border rounded-xl p-8 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">Documentation</h3>
        <p className="text-muted-foreground">API docs and integration guides coming soon.</p>
      </div>
    </div>
  )
}

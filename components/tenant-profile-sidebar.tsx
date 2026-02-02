"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Star,
  Eye,
  GitFork,
  Activity,
  Settings,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Phone,
  Database,
  CreditCard,
  Shield,
  MessageSquare,
  Smartphone,
  Globe,
  Zap,
  ChevronDown,
  ChevronUp,
  Loader2,
  Rocket,
  Github,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { CreditUnionData } from "@/lib/credit-union-data"

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: "core" | "voice" | "payments" | "security" | "messaging" | "mobile"
  status: "configured" | "available" | "coming_soon"
  configUrl?: string
  docsUrl?: string
}

const INTEGRATIONS: Integration[] = [
  {
    id: "poweron",
    name: "PowerOn",
    description: "Connect your Symitar PowerOn core for real-time account data",
    icon: <Database className="h-5 w-5" />,
    category: "core",
    status: "available",
    docsUrl: "https://docs.cu.app/integrations/poweron",
  },
  {
    id: "dna",
    name: "Fiserv DNA",
    description: "Integrate with DNA core banking platform",
    icon: <Database className="h-5 w-5" />,
    category: "core",
    status: "available",
    docsUrl: "https://docs.cu.app/integrations/dna",
  },
  {
    id: "corelation",
    name: "Corelation KeyStone",
    description: "Connect to KeyStone core for member data",
    icon: <Database className="h-5 w-5" />,
    category: "core",
    status: "available",
    docsUrl: "https://docs.cu.app/integrations/keystone",
  },
  {
    id: "twilio",
    name: "Twilio",
    description: "Power your IVR with Twilio voice and SMS",
    icon: <Phone className="h-5 w-5" />,
    category: "voice",
    status: "available",
    docsUrl: "https://docs.cu.app/integrations/twilio",
  },
  {
    id: "hume",
    name: "Hume AI",
    description: "Empathic voice AI for natural IVR conversations",
    icon: <MessageSquare className="h-5 w-5" />,
    category: "voice",
    status: "available",
    docsUrl: "https://docs.cu.app/integrations/hume",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Process payments and manage subscriptions",
    icon: <CreditCard className="h-5 w-5" />,
    category: "payments",
    status: "configured",
    configUrl: "/settings/integrations/stripe",
  },
  {
    id: "plaid",
    name: "Plaid",
    description: "Account verification and balance checks",
    icon: <Shield className="h-5 w-5" />,
    category: "security",
    status: "available",
    docsUrl: "https://docs.cu.app/integrations/plaid",
  },
  {
    id: "alloy",
    name: "Alloy",
    description: "Identity verification and fraud prevention",
    icon: <Shield className="h-5 w-5" />,
    category: "security",
    status: "available",
    docsUrl: "https://docs.cu.app/integrations/alloy",
  },
  {
    id: "firebase",
    name: "Firebase",
    description: "Push notifications for mobile app",
    icon: <Smartphone className="h-5 w-5" />,
    category: "mobile",
    status: "available",
    docsUrl: "https://docs.cu.app/integrations/firebase",
  },
  {
    id: "apns",
    name: "Apple Push",
    description: "iOS push notifications via APNs",
    icon: <Smartphone className="h-5 w-5" />,
    category: "mobile",
    status: "coming_soon",
  },
]

const CATEGORY_LABELS: Record<string, string> = {
  core: "Core Banking",
  voice: "Voice & IVR",
  payments: "Payments",
  security: "Security & Identity",
  messaging: "Messaging",
  mobile: "Mobile",
}

interface TenantProfileSidebarProps {
  cu: CreditUnionData
  showIntegrationsOnly?: boolean
}

export function TenantProfileSidebar({ cu, showIntegrationsOnly = false }: TenantProfileSidebarProps) {
  const [showAllIntegrations, setShowAllIntegrations] = useState(false)
  const [deployments, setDeployments] = useState<any[]>([])
  const [stats, setStats] = useState({
    configuredFields: 0,
    totalFields: 380,
    branchesVerified: 0,
    branchesTotal: 0,
    lastActivity: null as Date | null,
  })

  // Create App state
  const [isCreatingApp, setIsCreatingApp] = useState(false)
  const [createdRepo, setCreatedRepo] = useState<{
    url: string
    name: string
    cloneUrl: string
    files: number
  } | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCreateApp = async () => {
    setIsCreatingApp(true)
    setCreateError(null)
    setCreatedRepo(null)

    try {
      const res = await fetch('/api/create-cu-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charterId: cu.charter }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create app')
      }

      setCreatedRepo({
        url: data.repo.url,
        name: data.repo.name,
        cloneUrl: data.repo.cloneUrl,
        files: data.files,
      })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsCreatingApp(false)
    }
  }

  const handleCopyClone = async () => {
    if (createdRepo?.cloneUrl) {
      await navigator.clipboard.writeText(`git clone ${createdRepo.cloneUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const supabase = createClient()

  useEffect(() => {
    async function fetchTenantData() {
      // Fetch credit union UUID first
      const { data: cuData } = await supabase.from("credit_unions").select("id").eq("charter", cu.charter).single()

      if (!cuData) return

      // Fetch discovery stats
      const { data: discoveredItems } = await supabase
        .from("discovered_items")
        .select("id, verification_status")
        .eq("credit_union_id", cuData.id)
        .eq("item_type", "branch")

      if (discoveredItems) {
        setStats((prev) => ({
          ...prev,
          branchesTotal: discoveredItems.length,
          branchesVerified: discoveredItems.filter((i) => i.verification_status === "verified").length,
        }))
      }
    }

    fetchTenantData()
  }, [cu.charter, supabase])

  const configProgress = Math.round((stats.configuredFields / stats.totalFields) * 100)

  const visibleIntegrations = showAllIntegrations ? INTEGRATIONS : INTEGRATIONS.slice(0, 4)

  // Group integrations by category
  const groupedIntegrations = INTEGRATIONS.reduce(
    (acc, integration) => {
      if (!acc[integration.category]) {
        acc[integration.category] = []
      }
      acc[integration.category].push(integration)
      return acc
    },
    {} as Record<string, Integration[]>,
  )

  // If showIntegrationsOnly, render just the integrations card
  if (showIntegrationsOnly) {
    return (
      <div className="w-full space-y-4 text-sm">
        {/* Create App Section */}
        <div className="rounded-lg border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Generate Flutter App</h3>
          </div>

          {createdRepo ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">App created successfully!</span>
              </div>
              <div className="bg-background rounded-md p-2 space-y-2">
                <a
                  href={createdRepo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Github className="h-4 w-4" />
                  <span className="truncate">{createdRepo.name}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                <p className="text-xs text-muted-foreground">{createdRepo.files} files generated</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 bg-transparent"
                onClick={handleCopyClone}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy clone command"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setCreatedRepo(null)}
              >
                Create another
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Generate a complete Flutter mobile banking app for {cu.displayName} with all config, themes, and screens.
              </p>
              {createError && (
                <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 rounded p-2">
                  {createError}
                </div>
              )}
              <Button
                size="sm"
                className="w-full gap-2"
                onClick={handleCreateApp}
                disabled={isCreatingApp}
              >
                {isCreatingApp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating repo...
                  </>
                ) : (
                  <>
                    <Github className="h-4 w-4" />
                    Create App Repository
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Suggested Integrations Only View */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-foreground">Suggested integrations</h3>
            <p className="text-xs text-muted-foreground">Based on your tech stack</p>
          </div>

          <div className="space-y-2">
            {visibleIntegrations.map((integration) => (
              <div key={integration.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">{integration.icon}</div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{integration.name}</p>
                      {integration.status === "configured" && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 text-green-600 border-green-300">
                          Configured
                        </Badge>
                      )}
                    </div>
                  </div>
                  {integration.status === "coming_soon" ? (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Soon
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs bg-transparent"
                      onClick={() => {
                        const url = integration.configUrl || integration.docsUrl
                        if (url) {
                          window.open(url, '_blank')
                        }
                      }}
                    >
                      {integration.configUrl ? "Configure" : "Learn More"}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{integration.description}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowAllIntegrations(!showAllIntegrations)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              {showAllIntegrations ? (
                <>
                  Show less <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  More integrations <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
            <button className="text-xs text-muted-foreground hover:text-foreground">Dismiss suggestions</button>
          </div>
        </div>

        {/* Configuration Progress */}
        <div className="border-t border-border pt-4">
          <h3 className="font-semibold text-foreground mb-2">Configuration</h3>
          <div className="space-y-2">
            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
              <div className="bg-primary transition-all" style={{ width: `${configProgress}%` }} />
              <div className="bg-amber-500 transition-all" style={{ width: `${Math.min(20, 100 - configProgress)}%` }} />
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">Complete {configProgress}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">Pending</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="border-t border-border pt-4 space-y-2">
          <h3 className="font-semibold text-foreground">Resources</h3>
          <div className="space-y-1">
            {cu.website && (
              <a href={cu.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary">
                <Globe className="h-3.5 w-3.5" />
                <span className="truncate">{cu.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}</span>
                <ExternalLink className="h-3 w-3 ml-auto shrink-0" />
              </a>
            )}
            <a href="https://docs.cu.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary">
              <Zap className="h-3.5 w-3.5" />
              <span>API Documentation</span>
              <ExternalLink className="h-3 w-3 ml-auto shrink-0" />
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 text-sm">
      {/* About Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">About</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {cu.displayName} mobile banking configuration for {(cu.members || 0).toLocaleString()} members
        </p>

        <div className="space-y-2 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span>{stats.configuredFields} fields configured</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>{stats.branchesVerified} branches verified</span>
          </div>
          <div className="flex items-center gap-2">
            <GitFork className="h-4 w-4" />
            <span>Charter #{cu.charter}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Releases Section */}
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground">Releases</h3>
        <p className="text-muted-foreground text-xs">No releases published</p>
        <button
          onClick={() => window.alert('Connect GitHub to create releases')}
          className="text-xs text-primary hover:underline text-left"
        >
          Create a new release
        </button>
      </div>

      <div className="border-t border-border" />

      {/* Deployments Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">Deployments</h3>
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            2
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">Production – Flutter App</p>
              <p className="text-xs text-muted-foreground">last week</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">Production – IVR System</p>
              <p className="text-xs text-muted-foreground">needs configuration</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Configuration Progress */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Configuration</h3>
        <div className="space-y-2">
          <div className="flex h-2 overflow-hidden rounded-full bg-muted">
            <div className="bg-primary transition-all" style={{ width: `${configProgress}%` }} />
            <div className="bg-amber-500 transition-all" style={{ width: `${Math.min(20, 100 - configProgress)}%` }} />
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Complete {configProgress}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Pending</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Suggested Integrations - GitHub Action Cards Style */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-foreground">Suggested integrations</h3>
          <p className="text-xs text-muted-foreground">Based on your tech stack</p>
        </div>

        <div className="space-y-2">
          {visibleIntegrations.map((integration) => (
            <div key={integration.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">{integration.icon}</div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{integration.name}</p>
                    {integration.status === "configured" && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 text-green-600 border-green-300">
                        Configured
                      </Badge>
                    )}
                  </div>
                </div>
                {integration.status === "coming_soon" ? (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Soon
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs bg-transparent"
                    onClick={() => {
                      const url = integration.configUrl || integration.docsUrl
                      if (url) {
                        window.open(url, '_blank')
                      }
                    }}
                  >
                    {integration.configUrl ? "Configure" : "Learn More"}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{integration.description}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowAllIntegrations(!showAllIntegrations)}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            {showAllIntegrations ? (
              <>
                Show less <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                More integrations <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
          <button className="text-xs text-muted-foreground hover:text-foreground">Dismiss suggestions</button>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Quick Links */}
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground">Resources</h3>
        <div className="space-y-1">
          {cu.website && (
            <a href={cu.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary">
              <Globe className="h-3.5 w-3.5" />
              <span className="truncate">{cu.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}</span>
              <ExternalLink className="h-3 w-3 ml-auto shrink-0" />
            </a>
          )}
          <a href="https://docs.cu.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary">
            <Zap className="h-3.5 w-3.5" />
            <span>API Documentation</span>
            <ExternalLink className="h-3 w-3 ml-auto shrink-0" />
          </a>
        </div>
      </div>
    </div>
  )
}

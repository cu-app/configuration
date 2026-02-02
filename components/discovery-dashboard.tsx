"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  Search,
  MapPin,
  Building2,
  Globe,
  Phone,
  ImageIcon,
  Star,
  CheckCircle2,
  XCircle,
  Edit2,
  Play,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  RefreshCw,
  Zap,
} from "lucide-react"
import type { CreditUnionData } from "@/lib/credit-union-data"
import { OutreachEmailGenerator } from "@/components/outreach-email-generator"

interface DiscoverySession {
  id: string
  credit_union_id: string
  discovery_type: string
  status: "pending" | "running" | "completed" | "failed"
  sources_queried: string[]
  items_found: number
  items_verified: number
  items_rejected: number
  started_at?: string
  completed_at?: string
  error_message?: string
}

interface DiscoveredItem {
  id: string
  session_id: string
  credit_union_id: string
  item_type: "branch" | "logo" | "contact" | "social_profile" | "product" | "review" | "app"
  data: Record<string, unknown>
  source: string
  source_url?: string
  confidence_score: number
  confidence_reasoning: string
  verification_status: "pending" | "verified" | "rejected" | "edited"
  version: number
  created_at: string
}

interface DiscoveryDashboardProps {
  cu: CreditUnionData
}

const SOURCE_ICONS: Record<string, string> = {
  google_places: "🗺️",
  google_maps: "📍",
  yelp: "⭐",
  ncua: "🏛️",
  clearbit: "🎨",
  brandfetch: "🖼️",
  website_scrape: "🌐",
  facebook: "📘",
  linkedin: "💼",
  apple_maps: "🍎",
  foursquare: "📌",
  app_store: "📱",
  play_store: "🤖",
  manual_edit: "✏️",
}

const TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  branch: { label: "Branches", icon: <MapPin className="w-4 h-4" /> },
  logo: { label: "Logos", icon: <ImageIcon className="w-4 h-4" /> },
  contact: { label: "Contacts", icon: <Phone className="w-4 h-4" /> },
  social_profile: { label: "Social", icon: <Globe className="w-4 h-4" /> },
  product: { label: "Products", icon: <Building2 className="w-4 h-4" /> },
  review: { label: "Reviews", icon: <Star className="w-4 h-4" /> },
  app: { label: "Apps", icon: <Globe className="w-4 h-4" /> },
}

export function DiscoveryDashboard({ cu }: DiscoveryDashboardProps) {
  const [items, setItems] = useState<DiscoveredItem[]>([])
  const [stats, setStats] = useState<{
    bySources: Record<string, number>
    byType: Record<string, number>
    total: number
    verified: number
    pending: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [discovering, setDiscovering] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [progress, setProgress] = useState(0)

  // Fetch existing discovered items
  const fetchDiscoveredItems = useCallback(async () => {
    if (!cu?.id) return

    setLoading(true)
    try {
      const res = await fetch(`/api/discovery/items?creditUnionId=${cu.id}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error("Failed to fetch items:", error)
    } finally {
      setLoading(false)
    }
  }, [cu?.id])

  useEffect(() => {
    fetchDiscoveredItems()
  }, [fetchDiscoveredItems])

  const startDiscovery = async (type: "branches" | "logos" | "all") => {
    setDiscovering(type)
    setProgress(0)

    try {
      if (type === "branches" || type === "all") {
        // Start nationwide branch discovery
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 2, 95))
        }, 1000)

        const res = await fetch("/api/branches/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creditUnionId: cu.id,
            creditUnionName: cu.displayName || cu.name,
            searchMode: "nationwide",
            city: cu.city,
            state: cu.state,
          }),
        })

        clearInterval(progressInterval)
        setProgress(100)

        if (res.ok) {
          const data = await res.json()
          console.log(`Discovered ${data.total} branches across ${data.statesSearched} states`)
        }
      }

      // Refresh items after discovery
      await fetchDiscoveredItems()
    } catch (error) {
      console.error("Discovery failed:", error)
    } finally {
      setDiscovering(null)
      setProgress(0)
    }
  }

  const verifyItem = async (itemId: string, action: "verify" | "reject") => {
    try {
      const res = await fetch(`/api/discovery/items/${itemId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        await fetchDiscoveredItems()
      }
    } catch (error) {
      console.error("Failed to verify item:", error)
    }
  }

  const filteredItems = items.filter((item) => {
    if (filter !== "all" && item.item_type !== filter) return false
    if (searchQuery) {
      const dataStr = JSON.stringify(item.data).toLowerCase()
      if (!dataStr.includes(searchQuery.toLowerCase())) return false
    }
    return true
  })

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Data Discovery</h2>
          <p className="text-muted-foreground">
            YEXT-level discovery across 13+ sources for {cu?.displayName || cu?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => startDiscovery("branches")} disabled={discovering !== null}>
            {discovering === "branches" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Discovering...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" /> Find All Branches
              </>
            )}
          </Button>
          <Button onClick={() => startDiscovery("all")} disabled={discovering !== null}>
            {discovering === "all" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" /> Full Discovery
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {discovering && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {discovering === "branches" ? "Searching all 50 states..." : "Full discovery in progress..."}
                  </span>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Items Found</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
              <div className="text-sm text-muted-foreground">Verified</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending Review</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{Object.keys(stats.bySources).length}</div>
              <div className="text-sm text-muted-foreground">Sources</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.byType?.branch || 0}</div>
              <div className="text-sm text-muted-foreground">Branches</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search discovered items..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={fetchDiscoveredItems} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              {Object.entries(TYPE_LABELS).map(([key, { label, icon }]) => (
                <TabsTrigger key={key} value={key} className="gap-1">
                  {icon}
                  <span className="hidden md:inline">{label}</span>
                  {stats?.byType?.[key] && (
                    <Badge variant="secondary" className="ml-1 text-xs h-5">
                      {stats.byType[key]}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Outreach + Discovered Items */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <OutreachEmailGenerator cu={cu} />
        </div>
        <div className="lg:col-span-3 space-y-3">
        {loading && items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading discovered items...</p>
            </CardContent>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No items discovered yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Click "Full Discovery" to search 13+ sources for {cu?.displayName} data
              </p>
              <Button onClick={() => startDiscovery("all")} disabled={discovering !== null}>
                <Play className="w-4 h-4 mr-2" /> Start Discovery
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item) => <DiscoveredItemCard key={item.id} item={item} onVerify={verifyItem} />)
        )}
        </div>
      </div>
    </div>
  )
}

function DiscoveredItemCard({
  item,
  onVerify,
}: {
  item: DiscoveredItem
  onVerify: (id: string, action: "verify" | "reject") => void
}) {
  const [expanded, setExpanded] = useState(false)

  const getConfidenceColor = (score: number) => {
    const pct = score * 100
    if (pct >= 80) return "bg-green-100 text-green-800 border-green-200"
    if (pct >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    if (pct >= 40) return "bg-orange-100 text-orange-800 border-orange-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  const getStatusBadge = () => {
    switch (item.verification_status) {
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-800 border-0">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-0">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        )
      case "edited":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-0">
            <Edit2 className="w-3 h-3 mr-1" /> Edited
          </Badge>
        )
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  const renderItemContent = () => {
    const data = item.data as Record<string, unknown>

    switch (item.item_type) {
      case "branch":
        return (
          <div className="flex items-start gap-4">
            {data.photos && Array.isArray(data.photos) && data.photos[0] && (
              <div className="w-20 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                <img
                  src={`/api/branches/photo?ref=${(data.photos[0] as { reference: string }).reference}&maxwidth=100`}
                  alt="Branch"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/classic-bank-exterior.png"
                  }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{data.name as string}</h4>
              <p className="text-sm text-muted-foreground truncate">{data.address as string}</p>
              <div className="flex items-center gap-2 mt-1">
                {data.rating ? (
                  <Badge variant="secondary" className="text-xs">
                    ★ {String(data.rating)}
                  </Badge>
                ) : null}
                {data.state ? (
                  <Badge variant="outline" className="text-xs">
                    {String(data.state)}
                  </Badge>
                ) : null}
                {data.business_status === "OPERATIONAL" && (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                    Open
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )

      case "logo":
        return (
          <div className="flex items-center gap-4">
            <img
              src={(data.url as string) || "/placeholder.svg"}
              alt="Logo"
              className="w-16 h-16 rounded-lg object-contain bg-gray-50 p-2"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = "/abstract-logo.png"
              }}
            />
            <div>
              <h4 className="font-medium">Logo Discovered</h4>
              <p className="text-sm text-muted-foreground">
                Format: {data.format as string} | Size: {(data.size as string) || "Unknown"}
              </p>
            </div>
          </div>
        )

      default:
        return (
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">{JSON.stringify(data, null, 2)}</pre>
        )
    }
  }

  return (
    <Card className={item.verification_status === "pending" ? "border-yellow-200" : ""}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">{renderItemContent()}</div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Confidence Score */}
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium border ${getConfidenceColor(item.confidence_score)}`}
            >
              {Math.round(item.confidence_score * 100)}% confidence
            </div>

            {/* Status Badge */}
            {getStatusBadge()}

            {/* Source */}
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              {SOURCE_ICONS[item.source] || "📍"} {item.source}
              {item.source_url && (
                <a href={item.source_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Confidence Reasoning */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground mt-3 hover:text-foreground"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Why this confidence score?
        </button>

        {expanded && (
          <div className="mt-2 p-3 bg-muted rounded-lg text-xs">
            <p className="font-medium mb-1">Confidence Reasoning:</p>
            <p className="text-muted-foreground">{item.confidence_reasoning}</p>
          </div>
        )}

        {/* Action Buttons */}
        {item.verification_status === "pending" && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <span className="text-sm font-medium mr-2">Does this look right?</span>
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 border-green-200 hover:bg-green-50 bg-transparent"
              onClick={() => onVerify(item.id, "verify")}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" /> Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
              onClick={() => onVerify(item.id, "reject")}
            >
              <XCircle className="w-4 h-4 mr-1" /> Wrong
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

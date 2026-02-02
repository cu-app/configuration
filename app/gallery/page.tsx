"use client"

import { useState, useEffect } from "react"
import { useExportAllowed } from "@/hooks/use-export-allowed"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Search,
  Download,
  ExternalLink,
  Smartphone,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Zap,
  Globe,
  Building2,
  Users,
  DollarSign,
} from "lucide-react"
import Link from "next/link"

interface CUConfig {
  charter: number
  name: string
  state: string
  assets: string
  members: string
  primaryColor: string
  logoUrl: string | null
  website: string | null
  configUrl: string
  appReady: boolean
}

interface BatchResponse {
  success: boolean
  count: number
  totalAvailable: number
  duration_ms: number
  message: string
  proof: {
    avgTimePerConfig: number
    estimatedTimeFor4300: string
    scalable: boolean
  }
  configs: CUConfig[]
}

interface StatsResponse {
  totalCreditUnions: number
  totalAssets: string
  withLogos: number
  bySize: Record<string, number>
}

export default function GalleryPage() {
  const [configs, setConfigs] = useState<CUConfig[]>([])
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [proof, setProof] = useState<BatchResponse["proof"] | null>(null)
  const { allowed: exportAllowed, reason: exportLockedReason } = useExportAllowed(null)

  // Fetch initial batch
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // Fetch stats
        const statsRes = await fetch("/api/batch-generate")
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }

        // Fetch top 50 CUs
        const batchRes = await fetch("/api/batch-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 50 }),
        })

        if (batchRes.ok) {
          const data: BatchResponse = await batchRes.json()
          setConfigs(data.configs)
          setProof(data.proof)
        }
      } catch (error) {
        console.error("Failed to fetch:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Search filter
  const filteredConfigs = configs.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.charter.toString().includes(search)
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center gap-2 text-emerald-400 mb-4">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">PROOF OF CONCEPT</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            4,300+ Credit Union Apps
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mb-8">
            Every federally insured credit union can have a fully-configured mobile banking app.
            One config system. Infinite customization.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <Building2 className="h-4 w-4" />
                <span className="text-xs">CUs with Logos</span>
              </div>
              <p className="text-2xl font-bold">
                {stats?.withLogos?.toLocaleString() || stats?.totalCreditUnions?.toLocaleString() || "3,800+"}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Total Assets</span>
              </div>
              <p className="text-2xl font-bold">{stats?.totalAssets || "$263B"}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <Zap className="h-4 w-4" />
                <span className="text-xs">Avg Gen Time</span>
              </div>
              <p className="text-2xl font-bold">{proof?.avgTimePerConfig || "<1"}ms</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <Smartphone className="h-4 w-4" />
                <span className="text-xs">App Ready</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">100%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Size Distribution */}
      {stats?.bySize && (
        <div className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <h2 className="text-lg font-semibold mb-4">By Asset Size</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.bySize).map(([size, count]) => (
                <Badge key={size} variant="outline" className="text-white border-white/20 py-2 px-4">
                  {size}: <span className="font-bold ml-1">{count.toLocaleString()}</span>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search & Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <Input
              placeholder="Search by name or charter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <Badge variant="secondary" className="py-2">
            {filteredConfigs.length} CUs shown
          </Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredConfigs.map((cu) => (
              <Card
                key={cu.charter}
                className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors group"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {/* Logo */}
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ backgroundColor: cu.primaryColor }}
                    >
                      {cu.logoUrl ? (
                        <img
                          src={cu.logoUrl}
                          alt={cu.name}
                          className="w-8 h-8 object-contain"
                          style={{ filter: "brightness(0) invert(1)" }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {cu.name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{cu.name}</h3>
                      <p className="text-xs text-white/50">
                        #{cu.charter} • {cu.state}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-white/50 mb-3">
                    <span>{cu.assets}</span>
                    <span>•</span>
                    <span>{cu.members} members</span>
                  </div>

                  {/* Color Preview */}
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: cu.primaryColor }}
                    />
                    <code className="text-xs text-white/50">{cu.primaryColor}</code>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link href={`/?charter=${cu.charter}`} className="flex-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 gap-1"
                      >
                        <Smartphone className="h-3 w-3" />
                        Preview
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white/50 hover:text-white"
                      onClick={() => {
                        window.open(cu.configUrl, "_blank")
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {cu.website && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white/50 hover:text-white"
                        onClick={() => window.open(cu.website!, "_blank")}
                      >
                        <Globe className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Proof Banner */}
        {proof && (
          <div className="mt-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              <h2 className="text-xl font-bold text-emerald-400">Scalability Proven</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-white/50 text-sm">Average time per config</p>
                <p className="text-2xl font-bold text-white">{proof.avgTimePerConfig}ms</p>
              </div>
              <div>
                <p className="text-white/50 text-sm">Time to generate all 4,300</p>
                <p className="text-2xl font-bold text-white">{proof.estimatedTimeFor4300}</p>
              </div>
              <div>
                <p className="text-white/50 text-sm">Scalable architecture</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {proof.scalable ? "Yes" : "No"}
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <Link href="/">
                <Button className="gap-2">
                  Try the Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                className="bg-transparent border-white/20 text-white"
                disabled={!exportAllowed}
                title={!exportAllowed ? exportLockedReason ?? undefined : undefined}
                onClick={() => {
                  // Download all configs as JSON
                  const blob = new Blob([JSON.stringify(configs, null, 2)], {
                    type: "application/json",
                  })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = "cu-configs-batch.json"
                  a.click()
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

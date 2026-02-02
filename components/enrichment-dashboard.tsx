"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VerificationCard } from "./verification-card"
import {
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Phone,
  MapPin,
  Smartphone,
  Twitter,
  Play,
  Pause,
  ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { CreditUnionData } from "@/lib/credit-union-data"

interface EnrichmentDashboardProps {
  cu: CreditUnionData
}

interface EnrichmentTask {
  id: string
  name: string
  status: "pending" | "running" | "complete" | "failed"
  progress: number
  startedAt?: Date
  completedAt?: Date
  error?: string
  itemsFound?: number
}

interface DiscoveredData {
  id: string
  type: "logo" | "branch" | "contact" | "social" | "app" | "product" | "executive" | "news"
  title: string
  value: string | React.ReactNode
  source: string
  sourceUrl?: string
  confidence: number
  chainOfThought: string[]
  discoveredAt: Date
  verified: boolean
  rejected: boolean
  imageUrl?: string
}

export function EnrichmentDashboard({ cu }: EnrichmentDashboardProps) {
  const [tasks, setTasks] = useState<EnrichmentTask[]>([
    { id: "logo", name: "Logo Discovery", status: "complete", progress: 100, itemsFound: 3 },
    { id: "branches", name: "Branch Locations", status: "running", progress: 65, itemsFound: 12 },
    { id: "contact", name: "Contact Information", status: "complete", progress: 100, itemsFound: 5 },
    { id: "social", name: "Social Media Profiles", status: "pending", progress: 0 },
    { id: "apps", name: "Mobile App Detection", status: "pending", progress: 0 },
    { id: "products", name: "Product & Rate Scraping", status: "pending", progress: 0 },
    { id: "executives", name: "Executive Team", status: "pending", progress: 0 },
    { id: "news", name: "News & Press Mentions", status: "pending", progress: 0 },
  ])

  const [discoveries, setDiscoveries] = useState<DiscoveredData[]>([
    {
      id: "logo-1",
      type: "logo",
      title: "Primary Logo",
      value: "",
      source: "Brandfetch API",
      sourceUrl: "https://brandfetch.com",
      confidence: 95,
      chainOfThought: [
        "Searched Brandfetch API for domain navyfederal.org",
        "Found 3 logo variants (primary, icon, wordmark)",
        "Selected primary logo based on resolution and format",
        "Verified domain ownership matches NCUA records",
      ],
      discoveredAt: new Date(Date.now() - 3600000),
      verified: false,
      rejected: false,
      imageUrl: "https://logo.clearbit.com/navyfederal.org",
    },
    {
      id: "hq-1",
      type: "branch",
      title: "Headquarters",
      value: "820 Follin Lane, Vienna, VA 22180",
      source: "Google Places API",
      sourceUrl: "https://maps.google.com",
      confidence: 98,
      chainOfThought: [
        "Queried Google Places for 'Navy Federal Credit Union headquarters'",
        "Cross-referenced with NCUA registered address",
        "Verified business is marked as 'operational'",
        "Address matches SEC/NCUA filings",
      ],
      discoveredAt: new Date(Date.now() - 7200000),
      verified: false,
      rejected: false,
    },
    {
      id: "phone-1",
      type: "contact",
      title: "Main Phone",
      value: "1-888-842-6328",
      source: "Website Scrape",
      sourceUrl: cu.website,
      confidence: 92,
      chainOfThought: [
        "Scraped contact page at navyfederal.org/contact",
        "Found phone number in structured data (schema.org)",
        "Verified format matches US toll-free pattern",
        "Cross-referenced with Google Business listing",
      ],
      discoveredAt: new Date(Date.now() - 1800000),
      verified: false,
      rejected: false,
    },
    {
      id: "email-1",
      type: "contact",
      title: "Support Email",
      value: "support@navyfederal.org",
      source: "Website Scrape",
      confidence: 78,
      chainOfThought: [
        "Scraped contact page for email addresses",
        "Found mailto: link in footer",
        "Lower confidence: email may be for general inquiries only",
      ],
      discoveredAt: new Date(Date.now() - 1800000),
      verified: false,
      rejected: false,
    },
    {
      id: "branch-1",
      type: "branch",
      title: "Branch Location",
      value: "1150 Connecticut Ave NW, Washington, DC 20036",
      source: "Google Places API",
      confidence: 94,
      chainOfThought: [
        "Searched Google Places within 50mi of headquarters",
        "Found 47 locations matching 'Navy Federal Credit Union'",
        "Verified each has correct business category",
        "This is branch #1 of 47 discovered",
      ],
      discoveredAt: new Date(Date.now() - 600000),
      verified: false,
      rejected: false,
      imageUrl:
        "https://maps.googleapis.com/maps/api/streetview?size=400x200&location=1150+Connecticut+Ave+NW+Washington+DC",
    },
    {
      id: "twitter-1",
      type: "social",
      title: "Twitter/X Profile",
      value: "@NavyFederal",
      source: "Social Search",
      sourceUrl: "https://twitter.com/NavyFederal",
      confidence: 88,
      chainOfThought: [
        "Searched Twitter for 'Navy Federal Credit Union'",
        "Found verified account @NavyFederal",
        "Bio mentions 'Official account'",
        "Website link in profile matches NCUA records",
      ],
      discoveredAt: new Date(Date.now() - 300000),
      verified: false,
      rejected: false,
    },
    {
      id: "app-ios-1",
      type: "app",
      title: "iOS App",
      value: "Navy Federal Credit Union",
      source: "App Store Search API",
      sourceUrl: "https://apps.apple.com/app/navy-federal-credit-union",
      confidence: 96,
      chainOfThought: [
        "Searched App Store for 'Navy Federal Credit Union'",
        "Found app with matching developer name",
        "Rating: 4.8 stars (2.1M reviews)",
        "Last updated: 2 weeks ago",
      ],
      discoveredAt: new Date(Date.now() - 120000),
      verified: false,
      rejected: false,
    },
  ])

  const [activeTab, setActiveTab] = useState("all")
  const [isRunning, setIsRunning] = useState(true)

  // Simulate real-time progress updates
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.status === "running" && task.progress < 100) {
            const newProgress = Math.min(task.progress + Math.random() * 5, 100)
            return {
              ...task,
              progress: newProgress,
              status: newProgress >= 100 ? "complete" : "running",
              completedAt: newProgress >= 100 ? new Date() : undefined,
              itemsFound: task.itemsFound ? task.itemsFound + (Math.random() > 0.7 ? 1 : 0) : undefined,
            }
          }
          if (task.status === "pending") {
            // Start next pending task if previous is complete
            const runningTasks = prev.filter((t) => t.status === "running")
            if (runningTasks.length === 0) {
              const completeTasks = prev.filter((t) => t.status === "complete")
              const pendingIndex = prev.findIndex((t) => t.status === "pending")
              if (prev.indexOf(task) === pendingIndex) {
                return {
                  ...task,
                  status: "running",
                  progress: 5,
                  startedAt: new Date(),
                }
              }
            }
          }
          return task
        }),
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  const completedTasks = tasks.filter((t) => t.status === "complete").length
  const totalProgress = Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length)

  const verifiedCount = discoveries.filter((d) => d.verified).length
  const pendingCount = discoveries.filter((d) => !d.verified && !d.rejected).length

  function handleVerify(id: string) {
    setDiscoveries((prev) => prev.map((d) => (d.id === id ? { ...d, verified: true } : d)))
  }

  function handleReject(id: string) {
    setDiscoveries((prev) => prev.map((d) => (d.id === id ? { ...d, rejected: true } : d)))
  }

  const filteredDiscoveries = activeTab === "all" ? discoveries : discoveries.filter((d) => d.type === activeTab)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Data Enrichment</h1>
          <p className="text-sm text-muted-foreground">
            Automatically discovering and verifying information for {cu.displayName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsRunning(!isRunning)} className="gap-2">
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isRunning ? "Pause" : "Resume"}
          </Button>
          <Button variant="default" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Run All Tasks
          </Button>
        </div>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Enrichment Progress</span>
              <Badge variant="secondary">
                {completedTasks}/{tasks.length} tasks
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground">{totalProgress}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {verifiedCount} verified
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                {pendingCount} pending review
              </span>
            </div>
            <span>{discoveries.length} items discovered</span>
          </div>
        </CardContent>
      </Card>

      {/* Task Status Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tasks.map((task) => (
          <Card key={task.id} className={cn("transition-all", task.status === "running" && "ring-2 ring-blue-500/50")}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium truncate">{task.name}</span>
                {task.status === "complete" && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                {task.status === "running" && <RefreshCw className="h-3.5 w-3.5 text-blue-500 animate-spin" />}
                {task.status === "pending" && <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                {task.status === "failed" && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
              </div>
              <Progress value={task.progress} className="h-1.5" />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-muted-foreground">{Math.round(task.progress)}%</span>
                {task.itemsFound !== undefined && (
                  <span className="text-[10px] text-muted-foreground">{task.itemsFound} found</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Discoveries */}
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all" className="text-xs">
                All ({discoveries.length})
              </TabsTrigger>
              <TabsTrigger value="logo" className="text-xs">
                <ImageIcon className="h-3 w-3 mr-1" /> Logos
              </TabsTrigger>
              <TabsTrigger value="branch" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" /> Branches
              </TabsTrigger>
              <TabsTrigger value="contact" className="text-xs">
                <Phone className="h-3 w-3 mr-1" /> Contact
              </TabsTrigger>
              <TabsTrigger value="social" className="text-xs">
                <Twitter className="h-3 w-3 mr-1" /> Social
              </TabsTrigger>
              <TabsTrigger value="app" className="text-xs">
                <Smartphone className="h-3 w-3 mr-1" /> Apps
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {filteredDiscoveries.map((discovery) => (
              <VerificationCard
                key={discovery.id}
                title={discovery.title}
                value={
                  discovery.imageUrl ? (
                    <div className="space-y-2">
                      <img
                        src={discovery.imageUrl || "/placeholder.svg"}
                        alt={discovery.title}
                        className="h-16 w-auto object-contain rounded border bg-white"
                      />
                      {discovery.value && <span className="text-sm">{discovery.value}</span>}
                    </div>
                  ) : (
                    discovery.value
                  )
                }
                source={discovery.source}
                sourceUrl={discovery.sourceUrl}
                confidence={discovery.confidence}
                lastUpdated={discovery.discoveredAt}
                chainOfThought={discovery.chainOfThought}
                verified={discovery.verified}
                rejected={discovery.rejected}
                onVerify={() => handleVerify(discovery.id)}
                onReject={() => handleReject(discovery.id)}
                onEdit={() => {}}
              />
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  )
}

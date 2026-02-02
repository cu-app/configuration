"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MessageSquare,
  Heart,
  Share2,
  AlertTriangle,
  Shield,
  FileText,
  Lightbulb,
  Bell,
  Send,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  ExternalLink,
  Loader2,
  RefreshCw,
  Plus,
} from "lucide-react"

interface NetworkPost {
  id: string
  credit_union_id: string
  credit_union?: { name: string; logo_url: string; city: string; state_id: string }
  author_name: string
  author_avatar: string | null
  post_type: string
  title: string | null
  content: string
  attachments: any[]
  tags: string[]
  visibility: string
  is_anonymous: boolean
  is_pinned: boolean
  likes_count: number
  comments_count: number
  created_at: string
}

interface FraudSignal {
  id: string
  reporting_cu_id: string
  credit_union?: { name: string }
  signal_type: string
  severity: string
  title: string
  description: string
  indicators: string[]
  geographic_scope: string
  confirmations_count: number
  resolved: boolean
  created_at: string
}

const POST_TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  update: { icon: MessageSquare, color: "bg-blue-500", label: "Update" },
  question: { icon: Lightbulb, color: "bg-purple-500", label: "Question" },
  resource: { icon: FileText, color: "bg-green-500", label: "Resource" },
  alert: { icon: AlertTriangle, color: "bg-red-500", label: "Alert" },
  best_practice: { icon: CheckCircle2, color: "bg-emerald-500", label: "Best Practice" },
  compliance: { icon: Shield, color: "bg-indigo-500", label: "Compliance" },
  event: { icon: Bell, color: "bg-orange-500", label: "Event" },
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  low: { color: "text-yellow-600", bg: "bg-yellow-100" },
  medium: { color: "text-orange-600", bg: "bg-orange-100" },
  high: { color: "text-red-600", bg: "bg-red-100" },
  critical: { color: "text-red-800", bg: "bg-red-200" },
}

export function CUNetworkFeed({ creditUnionId }: { creditUnionId?: string }) {
  const [posts, setPosts] = useState<NetworkPost[]>([])
  const [fraudSignals, setFraudSignals] = useState<FraudSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("feed")
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostType, setNewPostType] = useState("update")
  const [isPosting, setIsPosting] = useState(false)
  const [showNewPostForm, setShowNewPostForm] = useState(false)
  const [liveIndicator, setLiveIndicator] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchPosts()
    fetchFraudSignals()

    // Subscribe to realtime updates
    const postsChannel = supabase
      .channel("network-posts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cu_network_posts" }, (payload) => {
        setPosts((prev) => [payload.new as NetworkPost, ...prev])
        setLiveIndicator(true)
        setTimeout(() => setLiveIndicator(false), 2000)
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "cu_network_posts" }, (payload) => {
        setPosts((prev) => prev.map((p) => (p.id === payload.new.id ? (payload.new as NetworkPost) : p)))
      })
      .subscribe()

    const fraudChannel = supabase
      .channel("fraud-signals")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cu_fraud_signals" }, (payload) => {
        setFraudSignals((prev) => [payload.new as FraudSignal, ...prev])
        setLiveIndicator(true)
        setTimeout(() => setLiveIndicator(false), 2000)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(postsChannel)
      supabase.removeChannel(fraudChannel)
    }
  }, [])

  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from("cu_network_posts")
        .select(`
          *,
          credit_union:credit_unions(name, logo_url, city, state_id)
        `)
        .order("created_at", { ascending: false })
        .limit(50)

      if (!error && data) {
        setPosts(data)
      }
    } catch (err) {
      console.error("Error fetching posts:", err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchFraudSignals() {
    try {
      const { data, error } = await supabase
        .from("cu_fraud_signals")
        .select(`
          *,
          credit_union:credit_unions(name)
        `)
        .order("created_at", { ascending: false })
        .limit(20)

      if (!error && data) {
        setFraudSignals(data)
      }
    } catch (err) {
      console.error("Error fetching fraud signals:", err)
    }
  }

  async function handlePost() {
    if (!newPostContent.trim()) return
    setIsPosting(true)

    try {
      const { error } = await supabase.from("cu_network_posts").insert({
        credit_union_id: creditUnionId,
        author_name: "You",
        post_type: newPostType,
        title: newPostTitle || null,
        content: newPostContent,
        tags: [],
        visibility: "network",
      })

      if (!error) {
        setNewPostContent("")
        setNewPostTitle("")
        setShowNewPostForm(false)
        fetchPosts()
      }
    } catch (err) {
      console.error("Error posting:", err)
    } finally {
      setIsPosting(false)
    }
  }

  async function handleLike(postId: string) {
    const post = posts.find((p) => p.id === postId)
    if (!post) return

    await supabase
      .from("cu_network_posts")
      .update({ likes_count: post.likes_count + 1 })
      .eq("id", postId)

    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p)))
  }

  async function confirmFraudSignal(signalId: string) {
    const signal = fraudSignals.find((s) => s.id === signalId)
    if (!signal) return

    await supabase
      .from("cu_fraud_signals")
      .update({ confirmations_count: signal.confirmations_count + 1 })
      .eq("id", signalId)

    setFraudSignals((prev) =>
      prev.map((s) => (s.id === signalId ? { ...s, confirmations_count: s.confirmations_count + 1 } : s)),
    )
  }

  function formatTimeAgo(date: string) {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return then.toLocaleDateString()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">CU Network</h2>
            <p className="text-xs text-muted-foreground">4,331 credit unions connected</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {liveIndicator && (
            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
              Live
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchPosts()
              fetchFraudSignals()
            }}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => setShowNewPostForm(!showNewPostForm)}>
            <Plus className="w-4 h-4 mr-1" />
            Post
          </Button>
        </div>
      </div>

      {/* New Post Form */}
      {showNewPostForm && (
        <div className="p-4 border-b bg-muted/30">
          <div className="space-y-3">
            <div className="flex gap-2">
              {Object.entries(POST_TYPE_CONFIG).map(([type, config]) => (
                <Button
                  key={type}
                  variant={newPostType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewPostType(type)}
                  className="text-xs"
                >
                  <config.icon className="w-3 h-3 mr-1" />
                  {config.label}
                </Button>
              ))}
            </div>
            <Input
              placeholder="Title (optional)"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
            />
            <Textarea
              placeholder="Share something with the CU network..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowNewPostForm(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handlePost} disabled={isPosting || !newPostContent.trim()}>
                {isPosting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                Post to Network
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4 grid grid-cols-3">
          <TabsTrigger value="feed">
            <MessageSquare className="w-4 h-4 mr-1" />
            Feed
          </TabsTrigger>
          <TabsTrigger value="fraud">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Fraud Alerts
            {fraudSignals.filter((s) => s.severity === "high" || s.severity === "critical").length > 0 && (
              <Badge variant="destructive" className="ml-1 px-1 py-0 text-xs">
                {fraudSignals.filter((s) => s.severity === "high" || s.severity === "critical").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resources">
            <FileText className="w-4 h-4 mr-1" />
            Resources
          </TabsTrigger>
        </TabsList>

        {/* Feed Tab */}
        <TabsContent value="feed" className="flex-1 overflow-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No posts yet. Be the first to share!</p>
            </div>
          ) : (
            posts.map((post) => {
              const typeConfig = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG.update
              const TypeIcon = typeConfig.icon
              return (
                <Card key={post.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={post.credit_union?.logo_url || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                          {(post.credit_union?.name || "CU").substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {post.is_anonymous ? "Anonymous CU" : post.credit_union?.name || "Credit Union"}
                          </span>
                          <Badge variant="outline" className={`${typeConfig.color} text-white text-xs px-1.5 py-0`}>
                            <TypeIcon className="w-3 h-3 mr-1" />
                            {typeConfig.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{post.author_name}</span>
                          <span>•</span>
                          {post.credit_union?.city && (
                            <>
                              <MapPin className="w-3 h-3" />
                              <span>
                                {post.credit_union.city}, {post.credit_union.state_id}
                              </span>
                              <span>•</span>
                            </>
                          )}
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(post.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {post.title && <h3 className="font-semibold mb-2">{post.title}</h3>}
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {post.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                      <Button variant="ghost" size="sm" onClick={() => handleLike(post.id)}>
                        <Heart className="w-4 h-4 mr-1" />
                        {post.likes_count || 0}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {post.comments_count || 0}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* Fraud Alerts Tab */}
        <TabsContent value="fraud" className="flex-1 overflow-auto p-4 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
              <Shield className="w-5 h-5" />
              Cross-CU Fraud Intelligence Network
            </div>
            <p className="text-sm text-red-700">
              Anonymized fraud patterns shared across the network. Confirm signals you&apos;ve seen to strengthen alerts
              for all credit unions.
            </p>
          </div>

          {fraudSignals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active fraud signals</p>
            </div>
          ) : (
            fraudSignals.map((signal) => {
              const severityConfig = SEVERITY_CONFIG[signal.severity] || SEVERITY_CONFIG.medium
              return (
                <Card
                  key={signal.id}
                  className={`border-l-4 ${signal.severity === "critical" ? "border-l-red-600" : signal.severity === "high" ? "border-l-red-500" : signal.severity === "medium" ? "border-l-orange-500" : "border-l-yellow-500"}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-5 h-5 ${severityConfig.color}`} />
                        <Badge className={`${severityConfig.bg} ${severityConfig.color} border-0`}>
                          {signal.severity.toUpperCase()}
                        </Badge>
                        {signal.geographic_scope && (
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            {signal.geographic_scope}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(signal.created_at)}</span>
                    </div>
                    <h3 className="font-semibold mt-2">{signal.title}</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{signal.description}</p>

                    {signal.indicators && signal.indicators.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium mb-2">Indicators:</p>
                        <div className="flex flex-wrap gap-1">
                          {signal.indicators.map((indicator, i) => (
                            <Badge key={i} variant="outline" className="text-xs font-mono">
                              {indicator}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="w-4 h-4" />
                        <span>{signal.confirmations_count} CUs confirmed</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => confirmFraudSignal(signal.id)}>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          We&apos;ve seen this
                        </Button>
                        <Button variant="ghost" size="sm">
                          <XCircle className="w-4 h-4 mr-1" />
                          Not relevant
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="flex-1 overflow-auto p-4">
          <div className="grid gap-4">
            <Card className="border-dashed border-2 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="font-medium">Share a Resource</p>
                <p className="text-sm text-muted-foreground">Templates, policies, vendor reviews</p>
              </CardContent>
            </Card>

            {/* Sample resources */}
            {[
              { title: "BSA/AML Policy Template 2026", type: "policy", category: "compliance", downloads: 234 },
              { title: "Mobile App Security Checklist", type: "template", category: "security", downloads: 189 },
              { title: "Core Vendor Comparison Matrix", type: "document", category: "technology", downloads: 156 },
              { title: "Member Onboarding Best Practices", type: "template", category: "operations", downloads: 142 },
            ].map((resource, i) => (
              <Card key={i} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{resource.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {resource.category}
                      </Badge>
                      <span>{resource.downloads} downloads</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

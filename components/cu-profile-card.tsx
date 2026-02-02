"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Building2,
  MapPin,
  Globe,
  Star,
  Users,
  DollarSign,
  Smartphone,
  Apple,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Loader2,
  Download,
} from "lucide-react"

interface CreditUnionProfile {
  id: string
  name: string
  charter: string
  city: string
  state_id: string
  website: string
  logo_url: string
  primary_color: string
  total_members: number
  total_assets: number
}

interface LogoVariant {
  id: string
  format: string
  variant: string
  url: string
  size_width: number
  size_height: number
  source: string
  quality_score: number
  verified: boolean
}

interface AppReview {
  id: string
  platform: string
  author: string
  rating: number
  title: string
  body: string
  review_date: string
  sentiment: string
}

interface AppListing {
  platform: string
  app_name: string
  rating_average: number
  rating_count: number
  icon_url: string
  store_url: string
}

export function CUProfileCard({ creditUnionId, charter }: { creditUnionId?: string; charter?: string }) {
  const [profile, setProfile] = useState<CreditUnionProfile | null>(null)
  const [logos, setLogos] = useState<LogoVariant[]>([])
  const [reviews, setReviews] = useState<AppReview[]>([])
  const [appListings, setAppListings] = useState<AppListing[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [fetchingLogos, setFetchingLogos] = useState(false)
  const [fetchingReviews, setFetchingReviews] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchProfile()
  }, [creditUnionId, charter])

  async function fetchProfile() {
    setLoading(true)
    try {
      let query = supabase.from("credit_unions").select("*")

      if (creditUnionId) {
        query = query.eq("id", creditUnionId)
      } else if (charter) {
        query = query.eq("charter", charter)
      }

      const { data, error } = await query.single()

      if (!error && data) {
        setProfile(data)
        fetchLogos(data.id)
        fetchReviews(data.id)
      }
    } catch (err) {
      console.error("Error fetching profile:", err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchLogos(cuId: string) {
    const { data } = await supabase
      .from("cu_logos")
      .select("*")
      .eq("credit_union_id", cuId)
      .order("quality_score", { ascending: false })

    if (data) setLogos(data)
  }

  async function fetchReviews(cuId: string) {
    const { data } = await supabase
      .from("cu_app_reviews")
      .select("*")
      .eq("credit_union_id", cuId)
      .order("review_date", { ascending: false })
      .limit(20)

    if (data) setReviews(data)
  }

  async function discoverLogos() {
    if (!profile) return
    setFetchingLogos(true)

    try {
      const response = await fetch("/api/logos/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creditUnionId: profile.id,
          website: profile.website,
          name: profile.name,
        }),
      })

      if (response.ok) {
        await fetchLogos(profile.id)
      }
    } catch (err) {
      console.error("Error discovering logos:", err)
    } finally {
      setFetchingLogos(false)
    }
  }

  async function discoverReviews() {
    if (!profile) return
    setFetchingReviews(true)

    try {
      const response = await fetch("/api/app-store/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creditUnionId: profile.id,
          name: profile.name,
        }),
      })

      if (response.ok) {
        await fetchReviews(profile.id)
      }
    } catch (err) {
      console.error("Error discovering reviews:", err)
    } finally {
      setFetchingReviews(false)
    }
  }

  function formatNumber(num: number): string {
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Credit union not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: profile.primary_color || "#3B82F6" }}
            >
              {profile.logo_url ? (
                <img
                  src={profile.logo_url || "/placeholder.svg"}
                  alt={profile.name}
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                    e.currentTarget.nextElementSibling?.classList.remove("hidden")
                  }}
                />
              ) : null}
              <span className={`text-white text-2xl font-bold ${profile.logo_url ? "hidden" : ""}`}>
                {profile.name.substring(0, 2).toUpperCase()}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <Badge variant="outline">#{profile.charter}</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profile.city}, {profile.state_id}
                </span>
                {profile.website && (
                  <a
                    href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Globe className="w-4 h-4" />
                    {profile.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6">
                <div>
                  <div className="text-2xl font-bold">{formatNumber(profile.total_members || 0)}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Members
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{formatNumber(profile.total_assets || 0)}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Assets
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logos">
            <ImageIcon className="w-4 h-4 mr-1" />
            Logos ({logos.length})
          </TabsTrigger>
          <TabsTrigger value="reviews">
            <Star className="w-4 h-4 mr-1" />
            Reviews ({reviews.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Profile Completeness</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "Basic Info", complete: true, score: 100 },
                  { label: "Logo Assets", complete: logos.length > 0, score: logos.length > 0 ? 100 : 0 },
                  { label: "Branch Locations", complete: false, score: 0 },
                  { label: "App Store Presence", complete: reviews.length > 0, score: reviews.length > 0 ? 100 : 0 },
                  { label: "Product Catalog", complete: false, score: 0 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    {item.complete ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.label}</span>
                        <span className="text-muted-foreground">{item.score}%</span>
                      </div>
                      <Progress value={item.score} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logos Tab */}
        <TabsContent value="logos" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">All logo formats discovered for {profile.name}</p>
            <Button size="sm" onClick={discoverLogos} disabled={fetchingLogos}>
              {fetchingLogos ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              Discover Logos
            </Button>
          </div>

          {logos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">No logos discovered yet</p>
                <Button onClick={discoverLogos} disabled={fetchingLogos}>
                  {fetchingLogos ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  )}
                  Start Logo Discovery
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {logos.map((logo) => (
                <Card key={logo.id} className="overflow-hidden">
                  <div className="aspect-square bg-muted flex items-center justify-center p-4">
                    <img
                      src={logo.url || "/placeholder.svg"}
                      alt={`${logo.variant} ${logo.format}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {logo.format.toUpperCase()}
                      </Badge>
                      {logo.verified && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{logo.variant}</p>
                    {logo.size_width && logo.size_height && (
                      <p className="text-xs text-muted-foreground">
                        {logo.size_width}x{logo.size_height}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{logo.source}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">App store reviews for {profile.name}</p>
            <Button size="sm" onClick={discoverReviews} disabled={fetchingReviews}>
              {fetchingReviews ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              Fetch Reviews
            </Button>
          </div>

          {/* App Store Summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center">
                  <Apple className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium">iOS App</p>
                  <p className="text-xs text-muted-foreground">Not connected</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium">Android App</p>
                  <p className="text-xs text-muted-foreground">Not connected</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">No reviews fetched yet</p>
                <Button onClick={discoverReviews} disabled={fetchingReviews}>
                  {fetchingReviews ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  )}
                  Fetch App Store Reviews
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={review.platform === "ios" ? "default" : "secondary"}>
                          {review.platform === "ios" ? (
                            <Apple className="w-3 h-3 mr-1" />
                          ) : (
                            <Smartphone className="w-3 h-3 mr-1" />
                          )}
                          {review.platform.toUpperCase()}
                        </Badge>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
                            />
                          ))}
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            review.sentiment === "positive"
                              ? "bg-green-50 text-green-600 border-green-200"
                              : review.sentiment === "negative"
                                ? "bg-red-50 text-red-600 border-red-200"
                                : "bg-gray-50 text-gray-600 border-gray-200"
                          }
                        >
                          {review.sentiment}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.review_date).toLocaleDateString()}
                      </span>
                    </div>
                    {review.title && <p className="font-medium mb-1">{review.title}</p>}
                    <p className="text-sm text-muted-foreground">{review.body}</p>
                    <p className="text-xs text-muted-foreground mt-2">— {review.author}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import {
  Building2,
  Globe,
  MapPin,
  Users,
  Shield,
  Eye,
  EyeOff,
  Edit2,
  Save,
  CheckCircle2,
  Link2,
  Star,
  TrendingUp,
  Activity,
  Loader2,
  ExternalLink,
  Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { CreditUnionData } from "@/lib/credit-union-data"

// ============================================================================
// TYPES
// ============================================================================

interface NetworkMembership {
  credit_union_id: string
  charter_number: string
  share_fraud_signals: boolean
  receive_fraud_alerts: boolean
  share_product_insights: boolean
  opted_in_at: string
}

interface PublicProfileData {
  // From cu_configs or credit_unions
  displayName: string
  tagline?: string
  description?: string
  website?: string
  logoUrl?: string
  
  // Location
  city?: string
  state?: string
  
  // Stats
  memberCount?: number
  assets?: number
  branches?: number
  
  // Network participation
  fraudNetworkMember: boolean
  fraudSignalsContributed: number
  fraudSignalsReceived: number
  networkReputation: number // 0-100
  
  // Visibility settings
  isPublic: boolean
  showStats: boolean
  showBranches: boolean
}

interface CUPublicProfileProps {
  tenantId: string
  cu: CreditUnionData | null
  editable?: boolean
}

// ============================================================================
// REPUTATION BADGE
// ============================================================================

function ReputationBadge({ score }: { score: number }) {
  const getLevel = () => {
    if (score >= 90) return { label: "Champion", color: "bg-purple-500", icon: Award }
    if (score >= 70) return { label: "Guardian", color: "bg-blue-500", icon: Shield }
    if (score >= 50) return { label: "Contributor", color: "bg-green-500", icon: CheckCircle2 }
    if (score >= 20) return { label: "Member", color: "bg-yellow-500", icon: Users }
    return { label: "New", color: "bg-gray-500", icon: Star }
  }

  const level = getLevel()
  const Icon = level.icon

  return (
    <Badge className={cn(level.color, "text-white gap-1")}>
      <Icon className="h-3 w-3" />
      {level.label}
    </Badge>
  )
}

// ============================================================================
// STATS CARD
// ============================================================================

function StatCard({ label, value, icon: Icon, trend }: { 
  label: string
  value: string | number
  icon: React.ElementType
  trend?: number
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <div className="p-2 rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      {trend !== undefined && (
        <div className={cn(
          "ml-auto flex items-center gap-1 text-xs",
          trend >= 0 ? "text-green-600" : "text-red-600"
        )}>
          <TrendingUp className={cn("h-3 w-3", trend < 0 && "rotate-180")} />
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CUPublicProfile({ tenantId, cu, editable = true }: CUPublicProfileProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  
  const [membership, setMembership] = useState<NetworkMembership | null>(null)
  const [profile, setProfile] = useState<PublicProfileData>({
    displayName: cu?.displayName || "",
    tagline: "",
    description: "",
    website: cu?.website || "",
    logoUrl: cu?.logoUrl || "",
    city: cu?.city || "",
    state: cu?.state || "",
    memberCount: cu?.memberCount || 0,
    assets: cu?.assets || 0,
    branches: 0,
    fraudNetworkMember: false,
    fraudSignalsContributed: 0,
    fraudSignalsReceived: 0,
    networkReputation: 0,
    isPublic: true,
    showStats: true,
    showBranches: true,
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Load profile data
  useEffect(() => {
    loadProfile()
  }, [tenantId])

  const loadProfile = async () => {
    setLoading(true)
    try {
      // Load network membership
      const { data: memberData } = await supabase
        .from("nationwide_network_members")
        .select("*")
        .eq("credit_union_id", tenantId)
        .single()

      if (memberData) {
        setMembership(memberData)
      }

      // Count fraud signals contributed
      const { count: contributedCount } = await supabase
        .from("fraud_signals")
        .select("*", { count: "exact", head: true })
        .eq("reporting_cu_id", tenantId)

      // Calculate reputation
      const reputation = Math.min(100, (contributedCount || 0) * 5 + (memberData ? 20 : 0))

      setProfile((prev) => ({
        ...prev,
        displayName: cu?.displayName || prev.displayName,
        website: cu?.website || prev.website,
        logoUrl: cu?.logoUrl || prev.logoUrl,
        city: cu?.city || prev.city,
        state: cu?.state || prev.state,
        memberCount: cu?.memberCount || prev.memberCount,
        assets: cu?.assets || prev.assets,
        fraudNetworkMember: !!memberData,
        fraudSignalsContributed: contributedCount || 0,
        networkReputation: reputation,
      }))
    } catch (error) {
      console.error("Failed to load profile:", error)
    } finally {
      setLoading(false)
    }
  }

  // Save profile settings
  const handleSave = async () => {
    setSaving(true)
    try {
      // Update network membership settings if member
      if (membership) {
        await supabase
          .from("nationwide_network_members")
          .update({
            share_fraud_signals: membership.share_fraud_signals,
            receive_fraud_alerts: membership.receive_fraud_alerts,
            share_product_insights: membership.share_product_insights,
          })
          .eq("credit_union_id", tenantId)
      }

      toast({ title: "Saved", description: "Profile settings updated" })
      setEditing(false)
    } catch (error) {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  // Join network
  const handleJoinNetwork = async () => {
    try {
      const { data, error } = await supabase
        .from("nationwide_network_members")
        .insert({
          credit_union_id: tenantId,
          charter_number: cu?.charter || tenantId,
          share_fraud_signals: true,
          receive_fraud_alerts: true,
          share_product_insights: false,
        })
        .select()
        .single()

      if (error) throw error

      setMembership(data)
      setProfile((prev) => ({ ...prev, fraudNetworkMember: true, networkReputation: prev.networkReputation + 20 }))
      toast({ title: "Welcome!", description: "You've joined the fraud network" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to join network", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24 rounded-xl">
              <AvatarImage src={profile.logoUrl} />
              <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                {profile.displayName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{profile.displayName}</h1>
                  {profile.tagline && (
                    <p className="text-muted-foreground">{profile.tagline}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {profile.city}, {profile.state}
                    {profile.website && (
                      <>
                        <span className="mx-2">•</span>
                        <Globe className="h-4 w-4" />
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {profile.website.replace(/^https?:\/\//, "").split("/")[0]}
                        </a>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ReputationBadge score={profile.networkReputation} />
                  {profile.fraudNetworkMember && (
                    <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-600">
                      <Shield className="h-3 w-3" />
                      Fraud Network
                    </Badge>
                  )}
                </div>
              </div>

              {profile.description && (
                <p className="mt-4 text-sm text-muted-foreground">{profile.description}</p>
              )}
            </div>

            {editable && (
              <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
                <Edit2 className="h-4 w-4 mr-2" />
                {editing ? "Cancel" : "Edit"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {profile.showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Members"
            value={profile.memberCount?.toLocaleString() || "—"}
            icon={Users}
          />
          <StatCard
            label="Assets"
            value={profile.assets ? `$${(profile.assets / 1_000_000).toFixed(0)}M` : "—"}
            icon={Building2}
          />
          <StatCard
            label="Signals Shared"
            value={profile.fraudSignalsContributed}
            icon={Shield}
          />
          <StatCard
            label="Network Score"
            value={profile.networkReputation}
            icon={Activity}
          />
        </div>
      )}

      {/* Network Settings (if editing) */}
      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>Network Settings</CardTitle>
            <CardDescription>Control your participation in the federated network</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!profile.fraudNetworkMember ? (
              <div className="p-4 rounded-lg border-2 border-dashed text-center">
                <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium mb-2">Not a member yet</p>
                <Button onClick={handleJoinNetwork}>
                  <Shield className="h-4 w-4 mr-2" />
                  Join Fraud Network
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Share Fraud Signals</p>
                      <p className="text-sm text-muted-foreground">
                        Contribute anonymized fraud indicators to the network
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={membership?.share_fraud_signals}
                    onCheckedChange={(v) => setMembership((m) => m ? { ...m, share_fraud_signals: v } : m)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Receive Fraud Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when other CUs report fraud patterns
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={membership?.receive_fraud_alerts}
                    onCheckedChange={(v) => setMembership((m) => m ? { ...m, receive_fraud_alerts: v } : m)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Link2 className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">Share Product Insights</p>
                      <p className="text-sm text-muted-foreground">
                        Share anonymized product performance data
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={membership?.share_product_insights}
                    onCheckedChange={(v) => setMembership((m) => m ? { ...m, share_product_insights: v } : m)}
                  />
                </div>
              </>
            )}

            <div className="pt-4 border-t flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visibility Settings (if editing) */}
      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>Visibility</CardTitle>
            <CardDescription>Control what other CUs can see about you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                {profile.isPublic ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                <div>
                  <p className="font-medium">Public Profile</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.isPublic 
                      ? "Other CUs can see your profile"
                      : "Your profile is hidden from others"}
                  </p>
                </div>
              </div>
              <Switch
                checked={profile.isPublic}
                onCheckedChange={(v) => setProfile((p) => ({ ...p, isPublic: v }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5" />
                <div>
                  <p className="font-medium">Show Stats</p>
                  <p className="text-sm text-muted-foreground">
                    Display member count and asset size
                  </p>
                </div>
              </div>
              <Switch
                checked={profile.showStats}
                onCheckedChange={(v) => setProfile((p) => ({ ...p, showStats: v }))}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CUPublicProfile

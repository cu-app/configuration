"use client"

import { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import {
  Shield,
  AlertTriangle,
  Link2,
  Eye,
  EyeOff,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Loader2,
  Hash,
  Activity,
  Zap,
  Lock,
  Globe,
  ChevronRight,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

interface ChainedSignal {
  id: string
  indicator_hash: string
  indicator_type: string
  signal_type: string
  severity: string
  description: string | null
  chain_count: number
  threat_score: number
  first_seen: string
  last_seen: string
  is_confirmed: boolean
}

interface NetworkStats {
  totalSignals: number
  uniqueThreats: number
  criticalThreats: number
  highThreats: number
  avgChainLength: string
  topThreatScore: number
}

interface NetworkMembership {
  credit_union_id: string
  share_fraud_signals: boolean
  receive_fraud_alerts: boolean
  share_product_insights: boolean
  opted_in_at: string
}

interface FraudNetworkDashboardProps {
  tenantId: string
  tenantName: string
  charterNumber?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIGNAL_TYPES = [
  { value: "suspicious_activity", label: "Suspicious Activity" },
  { value: "identity_theft", label: "Identity Theft" },
  { value: "account_takeover", label: "Account Takeover" },
  { value: "check_fraud", label: "Check Fraud" },
  { value: "wire_fraud", label: "Wire Fraud" },
  { value: "card_fraud", label: "Card Fraud" },
  { value: "loan_fraud", label: "Loan Fraud" },
  { value: "other", label: "Other" },
]

const INDICATOR_TYPES = [
  { value: "email_domain", label: "Email Domain" },
  { value: "phone_prefix", label: "Phone Prefix" },
  { value: "ip_range", label: "IP Range" },
  { value: "device_fingerprint", label: "Device Fingerprint" },
  { value: "address_pattern", label: "Address Pattern" },
  { value: "ssn_pattern", label: "SSN Pattern (last 4)" },
  { value: "name_pattern", label: "Name Pattern" },
]

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  low: { color: "text-yellow-600", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  medium: { color: "text-orange-600", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  high: { color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/30" },
  critical: { color: "text-red-800", bg: "bg-red-500/20", border: "border-red-500/50" },
}

// ============================================================================
// THREAT SCORE VISUALIZATION
// ============================================================================

function ThreatScoreBar({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return "bg-red-500"
    if (score >= 60) return "bg-orange-500"
    if (score >= 40) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <div className="flex items-center gap-2">
      <Progress value={score} className={cn("h-2 flex-1", getColor())} />
      <span className="text-sm font-mono font-bold w-8">{score}</span>
    </div>
  )
}

// ============================================================================
// CHAIN VISUALIZATION
// ============================================================================

function ChainIndicator({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-2 h-2 rounded-full",
            i < count ? "bg-blue-500" : "bg-muted"
          )}
        />
      ))}
      {count > 5 && (
        <span className="text-xs text-muted-foreground ml-1">+{count - 5}</span>
      )}
      <Link2 className="h-3 w-3 text-blue-500 ml-1" />
    </div>
  )
}

// ============================================================================
// SIGNAL CARD
// ============================================================================

interface SignalCardProps {
  signal: ChainedSignal
  onConfirm: () => void
}

function SignalCard({ signal, onConfirm }: SignalCardProps) {
  const severity = SEVERITY_CONFIG[signal.severity] || SEVERITY_CONFIG.medium

  return (
    <Card className={cn("border-l-4", severity.border)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn("h-5 w-5", severity.color)} />
            <Badge className={cn(severity.bg, severity.color, "border-0")}>
              {signal.severity.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              {signal.signal_type.replace("_", " ")}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {signal.chain_count} CU{signal.chain_count !== 1 ? "s" : ""} reporting
            </span>
            <ChainIndicator count={signal.chain_count} />
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Hash className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{signal.indicator_type}</span>
          </div>
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
            {signal.indicator_hash.slice(0, 16)}...
          </code>
        </div>

        {signal.description && (
          <p className="text-sm text-muted-foreground mb-3">{signal.description}</p>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              First: {new Date(signal.first_seen).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Last: {new Date(signal.last_seen).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">Threat:</span>
            <ThreatScoreBar score={signal.threat_score} />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={onConfirm}>
            <CheckCircle2 className="h-4 w-4 mr-1" />
            We've seen this
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// REPORT SIGNAL DIALOG
// ============================================================================

interface ReportSignalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  onReport: (data: any) => Promise<void>
}

function ReportSignalDialog({ open, onOpenChange, tenantId, onReport }: ReportSignalDialogProps) {
  const [loading, setLoading] = useState(false)
  const [signalType, setSignalType] = useState("suspicious_activity")
  const [indicatorType, setIndicatorType] = useState("email_domain")
  const [indicatorValue, setIndicatorValue] = useState("")
  const [severity, setSeverity] = useState("medium")
  const [description, setDescription] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(true)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!indicatorValue.trim()) {
      toast({ title: "Error", description: "Indicator value is required", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      await onReport({
        tenantId,
        signalType,
        indicatorType,
        indicatorValue: indicatorValue.trim(),
        severity,
        description: description.trim() || undefined,
        isAnonymous,
      })
      onOpenChange(false)
      setIndicatorValue("")
      setDescription("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Report Fraud Signal
          </DialogTitle>
          <DialogDescription>
            Share an anonymized fraud indicator with the network. Raw data is hashed - only patterns are shared.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Signal Type</Label>
              <Select value={signalType} onValueChange={setSignalType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIGNAL_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Indicator Type</Label>
            <Select value={indicatorType} onValueChange={setIndicatorType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDICATOR_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Indicator Value</Label>
            <Input
              placeholder="e.g., suspiciousdomain.com, 555-123-XXXX, etc."
              value={indicatorValue}
              onChange={(e) => setIndicatorValue(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              <Lock className="h-3 w-3 inline mr-1" />
              This value will be hashed before sharing - raw data never leaves your CU.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              placeholder="Additional context about this fraud pattern..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-2">
              {isAnonymous ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {isAnonymous ? "Anonymous Posting" : "Public Posting"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isAnonymous
                    ? "Your CU identity will not be shared"
                    : "Other CUs will see this is from you"}
                </p>
              </div>
            </div>
            <Switch checked={!isAnonymous} onCheckedChange={(v) => setIsAnonymous(!v)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Report to Network
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FraudNetworkDashboard({ tenantId, tenantName, charterNumber }: FraudNetworkDashboardProps) {
  const { toast } = useToast()
  const [signals, setSignals] = useState<ChainedSignal[]>([])
  const [stats, setStats] = useState<NetworkStats | null>(null)
  const [membership, setMembership] = useState<NetworkMembership | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportOpen, setReportOpen] = useState(false)
  const [searchHash, setSearchHash] = useState("")
  const [searchResult, setSearchResult] = useState<any>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Check membership
      const { data: memberData } = await supabase
        .from("nationwide_network_members")
        .select("*")
        .eq("credit_union_id", tenantId)
        .single()

      setMembership(memberData)

      // Load signals
      const response = await fetch(`/api/fraud-network?tenantId=${tenantId}`)
      const data = await response.json()

      if (data.signals) {
        setSignals(data.signals)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to load fraud network data:", error)
    } finally {
      setLoading(false)
    }
  }, [tenantId, supabase])

  useEffect(() => {
    loadData()

    // Realtime subscription
    const channel = supabase
      .channel("fraud-signals-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "fraud_signals" }, () => {
        loadData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadData, supabase])

  // Join network
  const handleJoinNetwork = async () => {
    try {
      const response = await fetch("/api/fraud-network", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          tenantId,
          charterNumber,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setMembership(data.membership)
        toast({ title: "Welcome!", description: "You've joined the fraud network" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to join network", variant: "destructive" })
    }
  }

  // Report signal
  const handleReportSignal = async (signalData: any) => {
    try {
      const response = await fetch("/api/fraud-network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signalData),
      })

      const data = await response.json()
      if (data.success) {
        toast({ title: "Signal Reported", description: data.message })
        loadData()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
      throw error
    }
  }

  // Search hash
  const handleSearchHash = async () => {
    if (!searchHash.trim()) return

    try {
      const response = await fetch(`/api/fraud-network?tenantId=${tenantId}&hash=${searchHash}`)
      const data = await response.json()
      setSearchResult(data)
    } catch (error) {
      toast({ title: "Error", description: "Search failed", variant: "destructive" })
    }
  }

  // Confirm signal
  const handleConfirmSignal = async (signalId: string) => {
    try {
      await fetch("/api/fraud-network", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", tenantId, signalId }),
      })
      toast({ title: "Confirmed", description: "Your confirmation strengthens the signal" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to confirm", variant: "destructive" })
    }
  }

  // Not a member - show join screen
  if (!loading && !membership) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-blue-500" />
            <h2 className="text-2xl font-bold mb-2">Private Fraud Network</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Join 4,300+ credit unions sharing anonymized fraud signals. 
              When one CU detects fraud, all CUs benefit.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8 text-left max-w-lg mx-auto">
              <div className="p-3 rounded-lg bg-muted/50">
                <Lock className="h-5 w-5 mb-2 text-green-500" />
                <p className="text-sm font-medium">Privacy First</p>
                <p className="text-xs text-muted-foreground">Only hashes shared</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <Link2 className="h-5 w-5 mb-2 text-blue-500" />
                <p className="text-sm font-medium">Daisy Chain</p>
                <p className="text-xs text-muted-foreground">More reports = stronger</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <EyeOff className="h-5 w-5 mb-2 text-purple-500" />
                <p className="text-sm font-medium">Anonymous</p>
                <p className="text-xs text-muted-foreground">Post anonymously</p>
              </div>
            </div>

            <Button size="lg" onClick={handleJoinNetwork}>
              <Shield className="h-5 w-5 mr-2" />
              Join Fraud Network
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Fraud Network</h1>
            <p className="text-muted-foreground">Private federated fraud intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setReportOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Report Signal
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.uniqueThreats}</div>
              <div className="text-sm text-muted-foreground">Active Threats</div>
            </CardContent>
          </Card>
          <Card className="border-red-500/20">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">
                {stats.criticalThreats + stats.highThreats}
              </div>
              <div className="text-sm text-muted-foreground">High/Critical</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.avgChainLength}</div>
              <div className="text-sm text-muted-foreground">Avg Chain Length</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.totalSignals}</div>
              <div className="text-sm text-muted-foreground">Total Reports</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hash Search */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex gap-2">
                <Input
                  placeholder="Search hash or check indicator..."
                  value={searchHash}
                  onChange={(e) => setSearchHash(e.target.value)}
                  className="font-mono"
                />
                <Button onClick={handleSearchHash}>
                  <Search className="h-4 w-4 mr-2" />
                  Check
                </Button>
              </div>
            </div>
            {searchResult && (
              <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-muted">
                {searchResult.found ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">Match Found</p>
                      <p className="text-xs text-muted-foreground">
                        {searchResult.chainCount} CUs, Score: {searchResult.threatScore}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <p className="text-sm font-medium">No matches</p>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Signals List */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Signals</TabsTrigger>
          <TabsTrigger value="critical" className="text-red-600">
            Critical/High
          </TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {signals.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No active fraud signals</p>
                  </CardContent>
                </Card>
              ) : (
                signals.map((signal) => (
                  <SignalCard
                    key={signal.id}
                    signal={signal}
                    onConfirm={() => handleConfirmSignal(signal.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="critical" className="mt-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {signals
                .filter((s) => s.severity === "critical" || s.severity === "high")
                .map((signal) => (
                  <SignalCard
                    key={signal.id}
                    signal={signal}
                    onConfirm={() => handleConfirmSignal(signal.id)}
                  />
                ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="recent" className="mt-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {signals.slice(0, 10).map((signal) => (
                <SignalCard
                  key={signal.id}
                  signal={signal}
                  onConfirm={() => handleConfirmSignal(signal.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Report Dialog */}
      <ReportSignalDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        tenantId={tenantId}
        onReport={handleReportSignal}
      />
    </div>
  )
}

export default FraudNetworkDashboard

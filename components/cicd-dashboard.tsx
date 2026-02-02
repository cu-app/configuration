"use client"

import { useState, useEffect } from "react"
import {
  GitBranch,
  Rocket,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Play,
  Loader2,
  ChevronDown,
  ExternalLink,
  Activity,
  Shield,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

interface DeployEntry {
  id: string
  tenant_id: string
  version: number
  config_snapshot: Record<string, unknown>
  commit_sha?: string
  commit_message?: string
  branch: string
  status: "pending" | "deploying" | "success" | "failed" | "rolled_back"
  error_message?: string
  health_check_passed?: boolean
  health_check_details?: Record<string, unknown>
  rolled_back_at?: string
  rolled_back_to_version?: number
  started_at: string
  completed_at?: string
  created_at: string
}

interface DeployStats {
  total: number
  successful: number
  failed: number
  rolledBack: number
  lastDeploy: DeployEntry | null
}

interface CICDDashboardProps {
  tenantId: string
  tenantName: string
}

// ============================================================================
// STATUS HELPERS
// ============================================================================

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
  },
  deploying: {
    label: "Deploying",
    icon: Loader2,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    animate: true,
  },
  success: {
    label: "Success",
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  rolled_back: {
    label: "Rolled Back",
    icon: RotateCcw,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
}

function StatusBadge({ status }: { status: DeployEntry["status"] }) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn("gap-1", config.bgColor, config.borderColor, config.color)}
    >
      <Icon className={cn("h-3 w-3", config.animate && "animate-spin")} />
      {config.label}
    </Badge>
  )
}

// ============================================================================
// DEPLOY CARD
// ============================================================================

interface DeployCardProps {
  deploy: DeployEntry
  isLatest: boolean
  onRollback: (version: number) => void
}

function DeployCard({ deploy, isLatest, onRollback }: DeployCardProps) {
  const config = STATUS_CONFIG[deploy.status]

  return (
    <Card className={cn("transition-all", isLatest && "ring-2 ring-primary/20")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "p-2 rounded-lg",
                config.bgColor
              )}
            >
              <config.icon
                className={cn(
                  "h-5 w-5",
                  config.color,
                  config.animate && "animate-spin"
                )}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Version {deploy.version}</span>
                {isLatest && (
                  <Badge variant="secondary" className="text-xs">
                    Latest
                  </Badge>
                )}
                <StatusBadge status={deploy.status} />
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {deploy.commit_sha && (
                  <span className="font-mono">{deploy.commit_sha.slice(0, 7)}</span>
                )}
                {deploy.branch && (
                  <span className="ml-2">
                    <GitBranch className="h-3 w-3 inline mr-1" />
                    {deploy.branch}
                  </span>
                )}
              </div>
              {deploy.error_message && (
                <p className="text-sm text-red-500 mt-2">{deploy.error_message}</p>
              )}
              {deploy.rolled_back_to_version && (
                <p className="text-sm text-orange-500 mt-2">
                  Rolled back to version {deploy.rolled_back_to_version}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Health check status */}
            {deploy.health_check_passed !== undefined && (
              <Badge
                variant="outline"
                className={cn(
                  "gap-1",
                  deploy.health_check_passed
                    ? "bg-green-500/10 text-green-600"
                    : "bg-red-500/10 text-red-600"
                )}
              >
                <Shield className="h-3 w-3" />
                Health {deploy.health_check_passed ? "OK" : "Failed"}
              </Badge>
            )}

            {/* Rollback button for successful deploys */}
            {deploy.status === "success" && !isLatest && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRollback(deploy.version)}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Rollback to this
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span>
            Started: {new Date(deploy.started_at).toLocaleString()}
          </span>
          {deploy.completed_at && (
            <span>
              Completed: {new Date(deploy.completed_at).toLocaleString()}
            </span>
          )}
          {deploy.started_at && deploy.completed_at && (
            <span>
              Duration:{" "}
              {Math.round(
                (new Date(deploy.completed_at).getTime() -
                  new Date(deploy.started_at).getTime()) /
                  1000
              )}
              s
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CICDDashboard({ tenantId, tenantName }: CICDDashboardProps) {
  const { toast } = useToast()

  const [deploys, setDeploys] = useState<DeployEntry[]>([])
  const [stats, setStats] = useState<DeployStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [rollbackVersion, setRollbackVersion] = useState<number | null>(null)

  // Load deploy history
  useEffect(() => {
    loadDeploys()
  }, [tenantId])

  const loadDeploys = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/deploy/webhook?tenantId=${tenantId}`)
      const data = await response.json()

      if (data.deploys) {
        setDeploys(data.deploys)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to load deploys:", error)
      toast({
        title: "Error",
        description: "Failed to load deploy history",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeploy = async () => {
    setDeploying(true)
    try {
      const response = await fetch("/api/deploy/webhook", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          action: "deploy",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Deploy triggered",
          description: "Check GitHub Actions for progress",
        })
        // Refresh after a short delay
        setTimeout(loadDeploys, 3000)
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Deploy failed",
        description: error.message || "Failed to trigger deploy",
        variant: "destructive",
      })
    } finally {
      setDeploying(false)
    }
  }

  const handleRollback = async (version: number) => {
    try {
      const response = await fetch("/api/deploy/webhook", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          action: "rollback",
          version,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Rollback triggered",
          description: `Rolling back to version ${version}`,
        })
        setTimeout(loadDeploys, 3000)
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Rollback failed",
        description: error.message || "Failed to trigger rollback",
        variant: "destructive",
      })
    }
    setRollbackVersion(null)
  }

  // Calculate success rate
  const successRate = stats
    ? Math.round((stats.successful / Math.max(stats.total, 1)) * 100)
    : 0

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
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="h-6 w-6" />
            CI/CD Pipeline
          </h1>
          <p className="text-muted-foreground">{tenantName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadDeploys}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleDeploy} disabled={deploying}>
            {deploying ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4 mr-2" />
            )}
            Deploy Now
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <div className="text-sm text-muted-foreground">Total Deploys</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {stats?.successful || 0}
            </div>
            <div className="text-sm text-muted-foreground">Successful</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">
              {stats?.failed || 0}
            </div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">
              {stats?.rolledBack || 0}
            </div>
            <div className="text-sm text-muted-foreground">Rolled Back</div>
          </CardContent>
        </Card>
      </div>

      {/* Success Rate */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Deploy Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={successRate} className="flex-1" />
            <span className="text-2xl font-bold">{successRate}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Self-Healing Status */}
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Self-Healing Enabled</h3>
              <p className="text-sm text-muted-foreground">
                Automatic rollback on health check or test failure
              </p>
            </div>
            <Badge variant="outline" className="ml-auto bg-green-500/10 text-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Deploy History */}
      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Deploy History
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          {deploys.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-medium mb-2">No Deploys Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Deploy your configuration to start tracking history.
                </p>
                <Button onClick={handleDeploy} disabled={deploying}>
                  <Rocket className="h-4 w-4 mr-2" />
                  Deploy Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {deploys.map((deploy, idx) => (
                  <DeployCard
                    key={deploy.id}
                    deploy={deploy}
                    isLatest={idx === 0}
                    onRollback={(version) => setRollbackVersion(version)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Activity feed coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rollback Confirmation Dialog */}
      <AlertDialog
        open={rollbackVersion !== null}
        onOpenChange={() => setRollbackVersion(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Rollback</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to rollback to version {rollbackVersion}? This
              will trigger a new deploy with the previous configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rollbackVersion && handleRollback(rollbackVersion)}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Rollback
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default CICDDashboard

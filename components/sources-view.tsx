"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Database,
  Cloud,
  Server,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react"
import { DATA_SOURCES } from "@/lib/credit-union-data"
import { cn } from "@/lib/utils"

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  core: <Server className="h-5 w-5" />,
  api: <Cloud className="h-5 w-5" />,
  database: <Database className="h-5 w-5" />,
  default: <Wifi className="h-5 w-5" />,
}

export function SourcesView() {
  const [sources, setSources] = useState(DATA_SOURCES)
  const [syncing, setSyncing] = useState<string | null>(null)

  const connected = sources.filter((s) => s.status === "connected").length
  const total = sources.length

  async function handleSync(sourceId: string) {
    setSyncing(sourceId)
    // Simulate sync
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setSyncing(null)
  }

  function handleToggle(sourceId: string, enabled: boolean) {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, status: enabled ? "connected" : "disconnected" } : s)),
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Data Sources</h1>
          <p className="text-sm text-muted-foreground">
            {connected} of {total} sources connected
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <RefreshCw className="h-4 w-4" />
          Sync All
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{connected}</p>
                <p className="text-xs text-muted-foreground">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sources.filter((s) => s.status === "pending").length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sources.filter((s) => s.status === "disconnected").length}</p>
                <p className="text-xs text-muted-foreground">Disconnected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sources List */}
      <div className="space-y-3">
        {sources.map((source) => (
          <Card key={source.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    "h-12 w-12 rounded-lg flex items-center justify-center",
                    source.status === "connected"
                      ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                      : source.status === "pending"
                        ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {source.status === "connected" ? (
                    <Wifi className="h-5 w-5" />
                  ) : source.status === "disconnected" ? (
                    <WifiOff className="h-5 w-5" />
                  ) : (
                    SOURCE_ICONS.default
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{source.name}</h3>
                    <Badge
                      variant={
                        source.status === "connected"
                          ? "default"
                          : source.status === "pending"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {source.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {source.description}
                  </p>
                  {source.lastSync && (
                    <p className="text-xs text-muted-foreground mt-1">Last synced: {source.lastSync}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleSync(source.id)}
                    disabled={syncing === source.id || source.status === "disconnected"}
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", syncing === source.id && "animate-spin")} />
                    {syncing === source.id ? "Syncing..." : "Sync"}
                  </Button>
                  <Switch
                    checked={source.status === "connected"}
                    onCheckedChange={(checked) => handleToggle(source.id, checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Source */}
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Database className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <h3 className="font-medium mb-1">Connect a New Data Source</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Integrate with your core banking system, third-party APIs, or custom data sources.
          </p>
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Browse Integrations
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Phone, Smartphone, Globe, MessageSquare, Activity, ArrowRight, Play, Pause } from "lucide-react"
import type { CreditUnionData } from "@/lib/credit-union-data"

interface LiveChannelActivity {
  channel: string
  operation: string
  memberId: string
  status: "processing" | "completed" | "error"
  layers: string[]
  timestamp: string
}

export function OmnichannelLiveView({ cu }: { cu: CreditUnionData | null }) {
  const [isLive, setIsLive] = useState(false)
  const [activities, setActivities] = useState<LiveChannelActivity[]>([])

  useEffect(() => {
    if (!isLive) return

    // Simulate live channel activity
    const interval = setInterval(() => {
      const channels = ["ivr", "mobile", "web", "chat"]
      const operations = ["account-balance", "transfer", "loan-info", "transaction-history"]
      const statuses: Array<"processing" | "completed" | "error"> = ["processing", "completed", "error"]

      const newActivity: LiveChannelActivity = {
        channel: channels[Math.floor(Math.random() * channels.length)],
        operation: operations[Math.floor(Math.random() * operations.length)],
        memberId: `M${Math.floor(Math.random() * 1000000)}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        layers: ["layer-1", "layer-2", "layer-3", "layer-7", "layer-8"],
        timestamp: new Date().toISOString(),
      }

      setActivities((prev) => [newActivity, ...prev].slice(0, 20))
    }, 2000)

    return () => clearInterval(interval)
  }, [isLive])

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "ivr":
        return Phone
      case "mobile":
        return Smartphone
      case "web":
        return Globe
      case "chat":
        return MessageSquare
      default:
        return Activity
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "processing":
        return "bg-blue-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live Channel Activity</CardTitle>
            <CardDescription>Real-time requests across all channels</CardDescription>
          </div>
          <Button
            variant={isLive ? "default" : "outline"}
            size="sm"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Live
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isLive ? "Waiting for activity..." : "Click 'Start Live' to see real-time activity"}
            </div>
          ) : (
            activities.map((activity, index) => {
              const Icon = getChannelIcon(activity.channel)
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg bg-primary/10`}>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{activity.operation}</span>
                      <Badge variant="outline" className="text-xs">
                        {activity.channel}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(activity.status)} text-white border-0 text-xs`}
                      >
                        {activity.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Member: {activity.memberId} • {new Date(activity.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-muted-foreground">Layers:</span>
                      {activity.layers.map((layer, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {layer}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}

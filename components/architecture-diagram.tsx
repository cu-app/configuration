"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Phone,
  Smartphone,
  Globe,
  MessageSquare,
  Mail,
  Building2,
  Database,
  Cpu,
  Network,
  Shield,
  Settings,
  Zap,
  Brain,
  Radio,
  Layers,
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpDown,
} from "lucide-react"

interface LayerNode {
  id: string
  name: string
  icon: typeof Phone
  position: { x: number; y: number }
  connections: string[]
}

export function ArchitectureDiagram() {
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)

  const layers: LayerNode[] = [
    {
      id: "layer-1",
      name: "Channels",
      icon: Phone,
      position: { x: 50, y: 10 },
      connections: ["layer-2"],
    },
    {
      id: "layer-2",
      name: "Routing",
      icon: Network,
      position: { x: 50, y: 20 },
      connections: ["layer-3", "layer-4"],
    },
    {
      id: "layer-3",
      name: "Auth",
      icon: Shield,
      position: { x: 30, y: 30 },
      connections: ["layer-4"],
    },
    {
      id: "layer-4",
      name: "Conversation",
      icon: MessageSquare,
      position: { x: 50, y: 30 },
      connections: ["layer-5"],
    },
    {
      id: "layer-5",
      name: "AI (Hume)",
      icon: Brain,
      position: { x: 50, y: 40 },
      connections: ["layer-6"],
    },
    {
      id: "layer-6",
      name: "Business Rules",
      icon: Settings,
      position: { x: 50, y: 50 },
      connections: ["layer-7"],
    },
    {
      id: "layer-7",
      name: "Adapters",
      icon: Database,
      position: { x: 50, y: 60 },
      connections: ["layer-8"],
    },
    {
      id: "layer-8",
      name: "Core Banking",
      icon: Building2,
      position: { x: 50, y: 70 },
      connections: [],
    },
  ]

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="relative w-full h-[600px] border rounded-lg bg-gradient-to-b from-background to-muted/20">
          {/* SVG for connections */}
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
            {layers.map((layer) =>
              layer.connections.map((connId) => {
                const targetLayer = layers.find((l) => l.id === connId)
                if (!targetLayer) return null

                const x1 = (layer.position.x / 100) * 1000
                const y1 = (layer.position.y / 100) * 600
                const x2 = (targetLayer.position.x / 100) * 1000
                const y2 = (targetLayer.position.y / 100) * 600

                return (
                  <line
                    key={`${layer.id}-${connId}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-primary/30"
                    markerEnd="url(#arrowhead)"
                  />
                )
              })
            )}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="currentColor" className="text-primary/30" />
              </marker>
            </defs>
          </svg>

          {/* Layer nodes */}
          {layers.map((layer) => {
            const Icon = layer.icon
            const isSelected = selectedLayer === layer.id
            const x = (layer.position.x / 100) * 1000 - 60
            const y = (layer.position.y / 100) * 600 - 30

            return (
              <div
                key={layer.id}
                className="absolute cursor-pointer transition-all"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: isSelected ? "scale(1.1)" : "scale(1)",
                }}
                onClick={() => setSelectedLayer(isSelected ? null : layer.id)}
              >
                <Card
                  className={`w-[120px] transition-all ${
                    isSelected ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
                  }`}
                >
                  <CardContent className="p-3 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className={`p-2 rounded-lg ${isSelected ? "bg-primary" : "bg-primary/10"}`}>
                        <Icon
                          className={`h-5 w-5 ${isSelected ? "text-primary-foreground" : "text-primary"}`}
                        />
                      </div>
                      <div className="text-xs font-medium">{layer.name}</div>
                      <Badge variant="outline" className="text-xs">
                        {layer.id}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

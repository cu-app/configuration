"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  XCircle,
  Edit2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
  Database,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface VerificationCardProps {
  title: string
  value: string | React.ReactNode
  source: string
  sourceUrl?: string
  confidence: number // 0-100
  lastUpdated?: Date | string | null
  onVerify?: () => void
  onReject?: () => void
  onEdit?: () => void
  verified?: boolean
  rejected?: boolean
  chainOfThought?: string[]
  children?: React.ReactNode
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return "text-green-600 bg-green-100 dark:bg-green-900/30"
  if (confidence >= 70) return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30"
  if (confidence >= 50) return "text-orange-600 bg-orange-100 dark:bg-orange-900/30"
  return "text-red-600 bg-red-100 dark:bg-red-900/30"
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 90) return "High Confidence"
  if (confidence >= 70) return "Medium Confidence"
  if (confidence >= 50) return "Low Confidence"
  return "Needs Review"
}

function formatTimeAgo(date: Date | string | null | undefined): string {
  if (!date) return "Never"
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function VerificationCard({
  title,
  value,
  source,
  sourceUrl,
  confidence,
  lastUpdated,
  onVerify,
  onReject,
  onEdit,
  verified = false,
  rejected = false,
  chainOfThought,
  children,
}: VerificationCardProps) {
  const [showChainOfThought, setShowChainOfThought] = useState(false)

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all",
        verified && "ring-2 ring-green-500/50",
        rejected && "ring-2 ring-red-500/50 opacity-60",
      )}
    >
      {/* Confidence indicator bar */}
      <div
        className="absolute top-0 left-0 h-1 transition-all"
        style={{
          width: `${confidence}%`,
          backgroundColor:
            confidence >= 90 ? "#22c55e" : confidence >= 70 ? "#eab308" : confidence >= 50 ? "#f97316" : "#ef4444",
        }}
      />

      <CardHeader className="pb-2 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            {verified && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            {rejected && <XCircle className="h-4 w-4 text-red-500" />}
          </div>
          <Badge variant="secondary" className={cn("text-[10px] gap-1", getConfidenceColor(confidence))}>
            <Sparkles className="h-3 w-3" />
            {confidence}% - {getConfidenceLabel(confidence)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Value */}
        <div className="text-lg font-semibold">{value}</div>

        {/* Children content */}
        {children}

        {/* Source and timestamp */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Database className="h-3 w-3" />
            <span>Source: {source}</span>
            {sourceUrl && (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatTimeAgo(lastUpdated)}</span>
            </div>
          )}
        </div>

        {/* Chain of thought */}
        {chainOfThought && chainOfThought.length > 0 && (
          <div className="border-t pt-2">
            <button
              onClick={() => setShowChainOfThought(!showChainOfThought)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="h-3 w-3" />
              <span>How we found this</span>
              {showChainOfThought ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showChainOfThought && (
              <ol className="mt-2 space-y-1 text-xs text-muted-foreground pl-4 list-decimal">
                {chainOfThought.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            )}
          </div>
        )}

        {/* Action buttons */}
        {!verified && !rejected && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 h-8 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800"
              onClick={onVerify}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Looks Right
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-8 bg-transparent" onClick={onEdit}>
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 hover:bg-red-50 hover:text-red-700 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 bg-transparent"
              onClick={onReject}
            >
              <XCircle className="h-3.5 w-3.5" />
              Wrong
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

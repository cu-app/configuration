"use client"

import type { CreditUnionConfig } from "@/types/cu-config"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Download, FileJson, FileText, Check } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: CreditUnionConfig | null
  /** When false, export is locked until user confirms email at verified CU domain */
  exportAllowed?: boolean
  /** Reason shown when export is locked */
  exportLockedReason?: string | null
}

export function ExportDialog({
  open,
  onOpenChange,
  config,
  exportAllowed = true,
  exportLockedReason = null,
}: ExportDialogProps) {
  const [format, setFormat] = useState<"json" | "csv">("json")
  const locked = !exportAllowed

  function exportAsJson() {
    if (!config) return
    const data = JSON.stringify(config, null, 2)
    downloadFile(data, `${config.tenant.id}-config.json`, "application/json")
  }

  function exportAsCsv() {
    if (!config) return
    const rows: string[] = []
    rows.push("tier,key,value,type")

    function flattenObject(obj: Record<string, unknown>, prefix: string, tier: string) {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (value && typeof value === "object" && !Array.isArray(value)) {
          flattenObject(value as Record<string, unknown>, fullKey, tier)
        } else {
          const valueStr = JSON.stringify(value).replace(/"/g, '""')
          const typeStr = Array.isArray(value) ? "array" : typeof value
          rows.push(`"${tier}","${fullKey}","${valueStr}","${typeStr}"`)
        }
      }
    }

    const tiers = [
      "tenant",
      "tokens",
      "features",
      "products",
      "rules",
      "fraud",
      "compliance",
      "integrations",
      "channels",
      "notifications",
      "content",
      "ucx",
      "ai",
      "deploy",
      "poweron",
    ]

    for (const tier of tiers) {
      const tierData = config[tier as keyof CreditUnionConfig]
      if (tierData) {
        flattenObject(tierData as unknown as Record<string, unknown>, tier, tier)
      }
    }

    downloadFile(rows.join("\n"), `${config.tenant.id}-config.csv`, "text/csv")
  }

  function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`Exported configuration as ${format.toUpperCase()}`)
    onOpenChange(false)
  }

  function handleExport() {
    if (format === "json") {
      exportAsJson()
    } else {
      exportAsCsv()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Export Configuration</DialogTitle>
          <DialogDescription>
            {locked
              ? "Export is locked until you confirm your email and use an email at your credit union's verified domain."
              : "Export the complete credit union configuration to a file."}
          </DialogDescription>
        </DialogHeader>

        {locked && exportLockedReason && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
            {exportLockedReason}
          </div>
        )}

        <div className="py-4">
          <Label className="text-sm font-medium mb-3 block">Export Format</Label>
          <div className="space-y-3">
            <button
              type="button"
              disabled={locked}
              onClick={() => setFormat("json")}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                format === "json" ? "border-primary bg-primary/5" : "hover:bg-muted/50",
              )}
            >
              <div
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                  format === "json" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground",
                )}
              >
                {format === "json" && <Check className="h-3 w-3" />}
              </div>
              <FileJson className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <span className="font-medium block">JSON</span>
                <span className="text-sm text-muted-foreground">Complete structured config file</span>
              </div>
            </button>
            <button
              type="button"
              disabled={locked}
              onClick={() => setFormat("csv")}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                format === "csv" ? "border-primary bg-primary/5" : "hover:bg-muted/50",
              )}
            >
              <div
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                  format === "csv" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground",
                )}
              >
                {format === "csv" && <Check className="h-3 w-3" />}
              </div>
              <FileText className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <span className="font-medium block">CSV</span>
                <span className="text-sm text-muted-foreground">Flattened key-value pairs</span>
              </div>
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={!config || locked}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

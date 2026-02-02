"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { CreditUnionConfig, ConfigTierId } from "@/types/cu-config"
import { CONFIG_TIERS } from "@/types/cu-config"
import { DEFAULT_CU_CONFIG } from "@/lib/cu-config-defaults"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Building2,
  Palette,
  ToggleLeft,
  Package,
  Scale,
  ShieldAlert,
  FileCheck,
  Plug,
  Smartphone,
  Bell,
  FileText,
  Wand2,
  Bot,
  Rocket,
  Download,
  RefreshCw,
  Database,
  RotateCcw,
  Save,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { ExportDialog } from "./export-dialog"
import { TierEditor } from "./tier-editor"
import { useExportAllowed } from "@/hooks/use-export-allowed"
import { useInspectorConfigBridge } from "@/lib/inspector-config-bridge"
import type { CreditUnionData } from "@/lib/credit-union-data"

interface CUConfigDashboardProps {
  selectedCU: CreditUnionData
}

interface CUConfigRecord {
  id: string
  tenant_id: string
  tenant_name: string
  config: CreditUnionConfig
  environment: string
  status: string
  version: number
  created_at: string
  updated_at: string
}

const TIER_ICONS: Record<string, React.ReactNode> = {
  tenant: <Building2 className="h-3.5 w-3.5" />,
  tokens: <Palette className="h-3.5 w-3.5" />,
  features: <ToggleLeft className="h-3.5 w-3.5" />,
  products: <Package className="h-3.5 w-3.5" />,
  rules: <Scale className="h-3.5 w-3.5" />,
  fraud: <ShieldAlert className="h-3.5 w-3.5" />,
  compliance: <FileCheck className="h-3.5 w-3.5" />,
  integrations: <Plug className="h-3.5 w-3.5" />,
  channels: <Smartphone className="h-3.5 w-3.5" />,
  notifications: <Bell className="h-3.5 w-3.5" />,
  content: <FileText className="h-3.5 w-3.5" />,
  ucx: <Wand2 className="h-3.5 w-3.5" />,
  ai: <Bot className="h-3.5 w-3.5" />,
  deploy: <Rocket className="h-3.5 w-3.5" />,
  poweron: <Database className="h-3.5 w-3.5" />,
}

function createConfigFromCU(cu: CreditUnionData): CUConfigRecord {
  const config: CreditUnionConfig = {
    ...DEFAULT_CU_CONFIG,
    tenant: {
      ...DEFAULT_CU_CONFIG.tenant,
      id: cu.id,
      name: cu.displayName,
      charter_number: cu.charter,
      domain: cu.logoDomain,
      legal: {
        ...DEFAULT_CU_CONFIG.tenant.legal,
        name: cu.displayName,
        routing: cu.routing,
      },
    },
    tokens: {
      ...DEFAULT_CU_CONFIG.tokens,
      color: {
        ...DEFAULT_CU_CONFIG.tokens.color,
        primary: cu.primaryColor,
      },
      logo: {
        ...DEFAULT_CU_CONFIG.tokens.logo,
        primary: cu.logoUrl,
      },
    },
    channels: {
      ...DEFAULT_CU_CONFIG.channels,
      mobile: {
        ...DEFAULT_CU_CONFIG.channels.mobile,
        ios: {
          ...DEFAULT_CU_CONFIG.channels.mobile.ios,
          app_store_id: cu.appStoreId || "",
        },
        android: {
          ...DEFAULT_CU_CONFIG.channels.mobile.android,
          play_store_id: cu.playStoreId || "",
        },
      },
      web: {
        ...DEFAULT_CU_CONFIG.channels.web,
        url: cu.website,
      },
    },
  }

  return {
    id: cu.id,
    tenant_id: cu.id,
    tenant_name: cu.displayName,
    config,
    environment: "production",
    status: "active",
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export function CUConfigDashboard({ selectedCU }: CUConfigDashboardProps) {
  const [configRecord, setConfigRecord] = useState<CUConfigRecord | null>(null)
  const [originalConfig, setOriginalConfig] = useState<CreditUnionConfig | null>(null)
  const [selectedTier, setSelectedTier] = useState<ConfigTierId>("tenant")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [tierSheetOpen, setTierSheetOpen] = useState(false)
  const supabase = createClient()
  const { allowed: exportAllowed, reason: exportLockedReason } = useExportAllowed(selectedCU?.id ?? null)
  const bridge = useInspectorConfigBridge()

  // Sync tier from bridge when opening Config from Screen Inspector (e.g. "Edit in Config")
  useEffect(() => {
    if (bridge.selectedTierId && bridge.selectedTierId !== selectedTier) {
      setSelectedTier(bridge.selectedTierId as ConfigTierId)
    }
  }, [bridge.selectedTierId])

  useEffect(() => {
    loadConfig()
  }, [selectedCU.id])

  async function loadConfig() {
    setLoading(true)
    setHasChanges(false)

    try {
      const { data, error } = await supabase.from("cu_configs").select("*").eq("tenant_id", selectedCU.id).single()

      if (error || !data) {
        const newRecord = createConfigFromCU(selectedCU)
        setConfigRecord(newRecord)
        setOriginalConfig(JSON.parse(JSON.stringify(newRecord.config)))
      } else {
        setConfigRecord(data)
        setOriginalConfig(JSON.parse(JSON.stringify(data.config)))
      }
    } catch {
      const newRecord = createConfigFromCU(selectedCU)
      setConfigRecord(newRecord)
      setOriginalConfig(JSON.parse(JSON.stringify(newRecord.config)))
    }

    setLoading(false)
  }

  async function saveConfig() {
    if (!configRecord) return
    setSaving(true)

    try {
      const { data: existing } = await supabase
        .from("cu_configs")
        .select("id")
        .eq("tenant_id", configRecord.tenant_id)
        .single()

      if (existing) {
        const { error } = await supabase
          .from("cu_configs")
          .update({
            config: configRecord.config,
            tenant_name: configRecord.tenant_name,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("cu_configs").insert({
          tenant_id: configRecord.tenant_id,
          tenant_name: configRecord.tenant_name,
          config: configRecord.config,
          environment: configRecord.environment,
          status: configRecord.status,
        })

        if (error) throw error
      }

      toast.success("Configuration saved to database")
      setOriginalConfig(JSON.parse(JSON.stringify(configRecord.config)))
      setHasChanges(false)
    } catch (err) {
      console.error("Save error:", err)
      toast.error("Failed to save configuration")
    }

    setSaving(false)
  }

  async function saveAndPublish() {
    if (!configRecord) return
    setSaving(true)

    try {
      // Step 1: Save to Supabase first
      const { data: existing } = await supabase
        .from("cu_configs")
        .select("id")
        .eq("tenant_id", configRecord.tenant_id)
        .single()

      if (existing) {
        const { error } = await supabase
          .from("cu_configs")
          .update({
            config: configRecord.config,
            tenant_name: configRecord.tenant_name,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("cu_configs").insert({
          tenant_id: configRecord.tenant_id,
          tenant_name: configRecord.tenant_name,
          config: configRecord.config,
          environment: configRecord.environment,
          status: configRecord.status,
        })

        if (error) throw error
      }

      toast.success("Configuration saved to database")
      setOriginalConfig(JSON.parse(JSON.stringify(configRecord.config)))
      setHasChanges(false)

      // Step 2: Publish to GitHub, CDN, and Webhooks
      toast.info("Publishing to GitHub, CDN, and webhooks...")

      const publishResponse = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: configRecord.tenant_id,
          version: configRecord.version,
        }),
      })

      if (!publishResponse.ok) {
        const error = await publishResponse.json()
        throw new Error(error.error || "Publish failed")
      }

      const publishResult = await publishResponse.json()

      if (publishResult.success) {
        toast.success(`Published to: ${publishResult.published_to.join(", ")}`)
      } else if (publishResult.errors && publishResult.errors.length > 0) {
        toast.warning(`Published with errors: ${publishResult.errors.join(", ")}`)
      }
    } catch (err) {
      console.error("Save & Publish error:", err)
      toast.error(err instanceof Error ? err.message : "Failed to save and publish")
    }

    setSaving(false)
  }

  function handleConfigChange(updatedConfig: CreditUnionConfig) {
    if (!configRecord) return
    setConfigRecord({
      ...configRecord,
      config: updatedConfig,
      tenant_name: updatedConfig.tenant.name,
      updated_at: new Date().toISOString(),
    })
    const hasActualChanges = JSON.stringify(updatedConfig) !== JSON.stringify(originalConfig)
    setHasChanges(hasActualChanges)
  }

  function resetConfig() {
    if (originalConfig) {
      setConfigRecord((prev) =>
        prev
          ? {
              ...prev,
              config: JSON.parse(JSON.stringify(originalConfig)),
            }
          : prev,
      )
      setHasChanges(false)
      toast.info("Reset to last saved state")
    }
  }

  const TierNavContent = ({ onSelect }: { onSelect?: () => void }) => (
    <>
      <div className="p-3 border-b">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tiers</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {CONFIG_TIERS.map((tier, i) => (
            <button
              key={tier.id}
              onClick={() => {
                setSelectedTier(tier.id)
                onSelect?.()
              }}
              className={`w-full text-left px-3 py-2.5 md:py-2 rounded-md transition-colors flex items-center gap-2 ${
                selectedTier === tier.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 text-[10px] font-medium rounded ${
                  selectedTier === tier.id ? "bg-primary-foreground/20" : "bg-muted"
                }`}
              >
                {i + 1}
              </span>
              {TIER_ICONS[tier.id]}
              <span className="text-sm font-medium truncate">{tier.name}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </>
  )

  if (loading) {
    return (
      <div className="flex h-full">
        <div className="hidden md:block w-48 border-r p-3 space-y-1">
          {Array.from({ length: 15 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        <div className="flex-1 p-4 md:p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (!configRecord) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">Failed to load configuration</p>
          <Button onClick={loadConfig} className="h-11">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const currentTier = CONFIG_TIERS.find((t) => t.id === selectedTier)

  return (
    <div className="flex h-full">
      <div className="hidden md:flex w-48 border-r flex-col bg-card">
        <TierNavContent />
      </div>

      {/* Editor Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-auto md:h-14 border-b px-4 md:px-6 py-3 md:py-0 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card">
          <div className="flex items-center gap-3 min-w-0">
            <Sheet open={tierSheetOpen} onOpenChange={setTierSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden h-10 gap-2 bg-transparent">
                  {TIER_ICONS[selectedTier]}
                  <span className="truncate">{currentTier?.name}</span>
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 flex flex-col">
                <TierNavContent onSelect={() => setTierSheetOpen(false)} />
              </SheetContent>
            </Sheet>

            <h2 className="text-sm md:text-base font-semibold truncate hidden md:block">{configRecord.tenant_name}</h2>
            <Badge variant={hasChanges ? "destructive" : "secondary"} className="text-xs shrink-0">
              {hasChanges ? "Unsaved" : `v${configRecord.version}`}
            </Badge>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={resetConfig} disabled={!hasChanges} className="h-10 md:h-8">
              <RotateCcw className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline">Reset</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportOpen(true)}
              disabled={!exportAllowed}
              title={!exportAllowed ? exportLockedReason ?? undefined : undefined}
              className="h-10 md:h-8 bg-transparent"
            >
              <Download className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline">Export</span>
            </Button>
            <Button variant="outline" size="sm" onClick={saveConfig} disabled={!hasChanges || saving} className="h-10 md:h-8 bg-transparent">
              <Save className="h-4 w-4 md:mr-1.5" />
              <span className="hidden sm:inline">{saving ? "Saving..." : "Save"}</span>
            </Button>
            <Button size="sm" onClick={saveAndPublish} disabled={!hasChanges || saving} className="h-10 md:h-8 gap-1.5">
              <Rocket className="h-4 w-4" />
              <span className="hidden sm:inline">{saving ? "Publishing..." : "Publish"}</span>
            </Button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <TierEditor
            activeTier={selectedTier}
            config={configRecord.config}
            onConfigChange={handleConfigChange}
            onTierChange={setSelectedTier}
            selectedScreenId={bridge.selectedScreenId}
            onInspectScreen={(screenId) => bridge.navigateToView("screen-inspector", screenId)}
          />
        </div>
      </div>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        config={configRecord.config}
        exportAllowed={exportAllowed}
        exportLockedReason={exportLockedReason}
      />
    </div>
  )
}

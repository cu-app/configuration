"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Smartphone,
  RotateCcw,
  Loader2,
  Sparkles,
  Save,
  Download,
  Palette,
  Type,
  Settings2,
  Check,
  Copy,
  RefreshCw,
  Building2,
  CreditCard,
  Shield,
  Bell,
  Moon,
  Sun,
  Play,
  Home,
  User,
  Wallet,
  ChevronRight,
  Zap,
  Eye,
  Code,
  FileJson,
} from "lucide-react"
import type { CreditUnionData } from "@/lib/credit-union-data"
import { useExportAllowed } from "@/hooks/use-export-allowed"

interface FlutterPreviewConfiguratorProps {
  cu: CreditUnionData
  onSave?: (config: TenantConfig) => Promise<void>
}

interface TenantConfig {
  name: string
  displayName: string
  charter: string
  primaryColor: string
  secondaryColor: string
  logoUrl: string
  darkMode: boolean
  biometrics: boolean
  mobileDeposit: boolean
  billPay: boolean
  p2p: boolean
  cardControls: boolean
  cornerRadius: number
  fontScale: number
}

type DeviceType = "iphone" | "iphone-mini" | "android"
type ScreenType = "splash" | "login" | "dashboard" | "cards" | "settings"

interface DeviceConfig {
  name: string
  width: number
  height: number
  bezelRadius: number
  notchType: "dynamic-island" | "notch" | "none" | "punch-hole"
  icon: React.ReactNode
}

const DEVICES: Record<DeviceType, DeviceConfig> = {
  "iphone": {
    name: "iPhone 15 Pro",
    width: 393,
    height: 852,
    bezelRadius: 55,
    notchType: "dynamic-island",
    icon: <Smartphone className="h-4 w-4" />,
  },
  "iphone-mini": {
    name: "iPhone SE",
    width: 375,
    height: 667,
    bezelRadius: 40,
    notchType: "none",
    icon: <Smartphone className="h-3 w-3" />,
  },
  "android": {
    name: "Pixel 8",
    width: 412,
    height: 915,
    bezelRadius: 45,
    notchType: "punch-hole",
    icon: <Smartphone className="h-4 w-4" />,
  },
}

const SCREENS: { id: ScreenType; label: string; icon: React.ReactNode }[] = [
  { id: "splash", label: "Splash", icon: <Zap className="h-3 w-3" /> },
  { id: "login", label: "Login", icon: <User className="h-3 w-3" /> },
  { id: "dashboard", label: "Home", icon: <Home className="h-3 w-3" /> },
  { id: "cards", label: "Cards", icon: <CreditCard className="h-3 w-3" /> },
  { id: "settings", label: "Settings", icon: <Settings2 className="h-3 w-3" /> },
]

const COLOR_PRESETS = [
  { name: "Navy", color: "#1e3a5f" },
  { name: "Forest", color: "#1d4d3e" },
  { name: "Royal", color: "#2e4a7d" },
  { name: "Burgundy", color: "#6b2d3a" },
  { name: "Teal", color: "#0d7377" },
  { name: "Slate", color: "#475569" },
  { name: "Purple", color: "#5b21b6" },
  { name: "Orange", color: "#c2410c" },
]

export function FlutterPreviewConfigurator({ cu, onSave }: FlutterPreviewConfiguratorProps) {
  const [device, setDevice] = useState<DeviceType>("iphone")
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("splash")
  const [iframeKey, setIframeKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [flutterReady, setFlutterReady] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const { allowed: exportAllowed, reason: exportLockedReason } = useExportAllowed(cu?.id ?? null)

  // Configuration state
  const [config, setConfig] = useState<TenantConfig>(() => ({
    name: cu.name || '',
    displayName: cu.displayName || cu.name || '',
    charter: cu.charter || '',
    primaryColor: cu.primaryColor || '#1e3a5f',
    secondaryColor: adjustColor(cu.primaryColor || '#1e3a5f', 20),
    logoUrl: cu.logoUrl || cu.logoUrls?.clearbit || '',
    darkMode: true,
    biometrics: true,
    mobileDeposit: true,
    billPay: true,
    p2p: true,
    cardControls: true,
    cornerRadius: 12,
    fontScale: 100,
  }))

  const deviceConfig = DEVICES[device]
  const scale = 0.55

  // Calculate config completeness
  const completeness = useMemo(() => {
    let score = 0
    const total = 12
    if (config.displayName) score++
    if (config.primaryColor && config.primaryColor !== '#1e3a5f') score++
    if (config.logoUrl) score++
    if (config.charter) score++
    // Features count
    score += [config.biometrics, config.mobileDeposit, config.billPay, config.p2p, config.cardControls].filter(Boolean).length > 0 ? 1 : 0
    // UI customization
    if (config.cornerRadius !== 12) score++
    if (config.fontScale !== 100) score++
    return Math.round((score / total) * 100)
  }, [config])

  // Listen for messages from Flutter iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.source === 'flutter_preview') {
        if (event.data.type === 'ready') {
          setFlutterReady(true)
          setLoading(false)
          // Send initial config
          sendConfigToFlutter()
        } else if (event.data.type === 'screen_change') {
          setCurrentScreen(event.data.screen)
        } else if (event.data.type === 'config_applied') {
          // Config was applied successfully
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Send config to Flutter via postMessage
  const sendConfigToFlutter = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'config_update',
        config: {
          ...config,
          assets: cu.assetsFormatted,
          members: cu.membersFormatted,
        }
      }, '*')
    }
  }, [config, cu.assetsFormatted, cu.membersFormatted])

  // Send config updates to Flutter in real-time
  useEffect(() => {
    if (flutterReady) {
      sendConfigToFlutter()
    }
  }, [config, flutterReady, sendConfigToFlutter])

  // Navigate Flutter to specific screen
  const navigateToScreen = useCallback((screen: ScreenType) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'navigate',
        screen
      }, '*')
    }
    setCurrentScreen(screen)
  }, [])

  // Reset Flutter preview
  const handleRestart = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'reset' }, '*')
    }
    setCurrentScreen("splash")
  }, [])

  // Update config when CU changes
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      name: cu.name || prev.name,
      displayName: cu.displayName || cu.name || prev.displayName,
      charter: cu.charter || prev.charter,
      primaryColor: cu.primaryColor || prev.primaryColor,
      logoUrl: cu.logoUrl || cu.logoUrls?.clearbit || prev.logoUrl,
    }))
    setIframeKey(prev => prev + 1)
    setFlutterReady(false)
    setLoading(true)
  }, [cu.id])

  // Build Flutter preview URL (initial load only)
  const flutterAppUrl = useMemo(() => {
    const params = new URLSearchParams()
    params.set('name', config.displayName || config.name || 'Credit Union')
    params.set('color', config.primaryColor.replace('#', ''))
    if (config.logoUrl) params.set('logo', config.logoUrl)
    if (config.charter) params.set('charter', config.charter)
    if (cu.assetsFormatted) params.set('assets', cu.assetsFormatted)
    if (cu.membersFormatted) params.set('members', cu.membersFormatted)
    params.set('darkMode', String(config.darkMode))
    params.set('cornerRadius', String(config.cornerRadius))
    params.set('fontScale', String(config.fontScale))
    params.set('biometrics', String(config.biometrics))
    params.set('mobileDeposit', String(config.mobileDeposit))
    params.set('billPay', String(config.billPay))
    params.set('p2p', String(config.p2p))
    params.set('cardControls', String(config.cardControls))
    return `/flutter-preview/index.html?${params.toString()}`
  }, [iframeKey]) // Only rebuild URL on full reload

  const updateConfig = useCallback(<K extends keyof TenantConfig>(key: K, value: TenantConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }, [])

  const handleSave = async () => {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave(config)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleExport = (format: 'json' | 'dart' | 'ts') => {
    let content: string
    let filename: string
    let mimeType: string

    const exportData = {
      _meta: {
        version: '1.0.0',
        generated: new Date().toISOString(),
        generator: 'CU.APP Configuration Matrix',
      },
      identity: {
        name: config.displayName,
        legalName: config.name,
        charter: config.charter,
      },
      branding: {
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        logoUrl: config.logoUrl,
      },
      features: {
        darkMode: config.darkMode,
        biometrics: config.biometrics,
        mobileDeposit: config.mobileDeposit,
        billPay: config.billPay,
        p2p: config.p2p,
        cardControls: config.cardControls,
      },
      ui: {
        cornerRadius: config.cornerRadius,
        fontScale: config.fontScale,
      },
    }

    if (format === 'json') {
      content = JSON.stringify(exportData, null, 2)
      filename = `${config.charter || 'cu'}-config.json`
      mimeType = 'application/json'
    } else if (format === 'dart') {
      content = `// ${config.displayName} Configuration
// Generated by CU.APP Configuration Matrix

import 'package:flutter/material.dart';

class TenantConfig {
  static const String name = '${config.displayName}';
  static const String charter = '${config.charter}';
  static const Color primaryColor = Color(0xFF${config.primaryColor.replace('#', '')});
  static const String logoUrl = '${config.logoUrl}';

  static const bool darkMode = ${config.darkMode};
  static const bool biometrics = ${config.biometrics};
  static const bool mobileDeposit = ${config.mobileDeposit};
  static const bool billPay = ${config.billPay};
  static const bool p2p = ${config.p2p};
  static const bool cardControls = ${config.cardControls};

  static const double cornerRadius = ${config.cornerRadius};
  static const double fontScale = ${config.fontScale / 100};
}
`
      filename = `${config.charter || 'cu'}_config.dart`
      mimeType = 'text/plain'
    } else {
      content = `// ${config.displayName} Configuration
// Generated by CU.APP Configuration Matrix

export const tenantConfig = {
  name: '${config.displayName}',
  charter: '${config.charter}',
  primaryColor: '${config.primaryColor}',
  logoUrl: '${config.logoUrl}',

  features: {
    darkMode: ${config.darkMode},
    biometrics: ${config.biometrics},
    mobileDeposit: ${config.mobileDeposit},
    billPay: ${config.billPay},
    p2p: ${config.p2p},
    cardControls: ${config.cardControls},
  },

  ui: {
    cornerRadius: ${config.cornerRadius},
    fontScale: ${config.fontScale / 100},
  },
} as const;
`
      filename = `${config.charter || 'cu'}-config.ts`
      mimeType = 'text/typescript'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyConfig = async () => {
    const configJson = JSON.stringify(config, null, 2)
    await navigator.clipboard.writeText(configJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex h-full bg-background">
      {/* Configuration Panel */}
      <div className="w-96 border-r flex flex-col bg-card">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg">App Configuration</h2>
            <Badge variant="outline" className="text-xs font-mono">
              {cu.charter}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={completeness} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground w-10">{completeness}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {flutterReady ? (
              <span className="text-emerald-500 flex items-center gap-1">
                <Zap className="h-3 w-3" /> Live updates enabled
              </span>
            ) : (
              "Loading preview..."
            )}
          </p>
        </div>

        <ScrollArea className="flex-1">
          <Tabs defaultValue="branding" className="p-4">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="branding" className="text-xs gap-1">
                <Palette className="h-3 w-3" />
                Brand
              </TabsTrigger>
              <TabsTrigger value="features" className="text-xs gap-1">
                <Settings2 className="h-3 w-3" />
                Features
              </TabsTrigger>
              <TabsTrigger value="ui" className="text-xs gap-1">
                <Type className="h-3 w-3" />
                UI
              </TabsTrigger>
            </TabsList>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Display Name</Label>
                <Input
                  value={config.displayName}
                  onChange={(e) => updateConfig('displayName', e.target.value)}
                  placeholder="Navy Federal Credit Union"
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Primary Color</Label>
                <div className="flex gap-2">
                  <div
                    className="w-9 h-9 rounded-md border cursor-pointer shrink-0 shadow-sm"
                    style={{ backgroundColor: config.primaryColor }}
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'color'
                      input.value = config.primaryColor
                      input.onchange = (e) => updateConfig('primaryColor', (e.target as HTMLInputElement).value)
                      input.click()
                    }}
                  />
                  <Input
                    value={config.primaryColor}
                    onChange={(e) => updateConfig('primaryColor', e.target.value)}
                    placeholder="#1e3a5f"
                    className="h-9 font-mono text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      className={cn(
                        "w-6 h-6 rounded-md border-2 transition-all shadow-sm",
                        config.primaryColor === preset.color
                          ? "border-foreground scale-110"
                          : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: preset.color }}
                      onClick={() => updateConfig('primaryColor', preset.color)}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Logo URL</Label>
                <div className="flex gap-2">
                  {config.logoUrl && (
                    <div className="w-9 h-9 rounded-md border bg-white flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={config.logoUrl}
                        alt="Logo"
                        className="w-7 h-7 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  <Input
                    value={config.logoUrl}
                    onChange={(e) => updateConfig('logoUrl', e.target.value)}
                    placeholder="https://logo.clearbit.com/..."
                    className="h-9 text-xs"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-8"
                  onClick={() => {
                    const domain = cu.website?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
                    if (domain) {
                      updateConfig('logoUrl', `https://logo.clearbit.com/${domain}`)
                    }
                  }}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Auto-detect from website
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  {config.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <div>
                    <Label className="text-xs font-medium">Theme Mode</Label>
                    <p className="text-[10px] text-muted-foreground">{config.darkMode ? 'Dark' : 'Light'} mode</p>
                  </div>
                </div>
                <Switch
                  checked={config.darkMode}
                  onCheckedChange={(checked) => updateConfig('darkMode', checked)}
                />
              </div>
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="space-y-2 mt-0">
              <p className="text-xs text-muted-foreground mb-3">
                Enable or disable features in the mobile app
              </p>
              <FeatureToggle
                icon={<Shield className="h-4 w-4" />}
                label="Biometric Login"
                description="Face ID & Touch ID"
                checked={config.biometrics}
                onChange={(v) => updateConfig('biometrics', v)}
              />
              <FeatureToggle
                icon={<CreditCard className="h-4 w-4" />}
                label="Mobile Deposit"
                description="Deposit checks via camera"
                checked={config.mobileDeposit}
                onChange={(v) => updateConfig('mobileDeposit', v)}
              />
              <FeatureToggle
                icon={<Building2 className="h-4 w-4" />}
                label="Bill Pay"
                description="Pay bills online"
                checked={config.billPay}
                onChange={(v) => updateConfig('billPay', v)}
              />
              <FeatureToggle
                icon={<Wallet className="h-4 w-4" />}
                label="P2P Transfers"
                description="Send money to anyone"
                checked={config.p2p}
                onChange={(v) => updateConfig('p2p', v)}
              />
              <FeatureToggle
                icon={<Settings2 className="h-4 w-4" />}
                label="Card Controls"
                description="Lock/unlock cards, limits"
                checked={config.cardControls}
                onChange={(v) => updateConfig('cardControls', v)}
              />
            </TabsContent>

            {/* UI Tab */}
            <TabsContent value="ui" className="space-y-4 mt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Corner Radius</Label>
                  <span className="text-xs text-muted-foreground font-mono">{config.cornerRadius}px</span>
                </div>
                <Slider
                  value={[config.cornerRadius]}
                  onValueChange={([v]) => updateConfig('cornerRadius', v)}
                  min={0}
                  max={24}
                  step={2}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Sharp</span>
                  <span>Rounded</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Font Scale</Label>
                  <span className="text-xs text-muted-foreground font-mono">{config.fontScale}%</span>
                </div>
                <Slider
                  value={[config.fontScale]}
                  onValueChange={([v]) => updateConfig('fontScale', v)}
                  min={80}
                  max={120}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Smaller</span>
                  <span>Larger</span>
                </div>
              </div>

              <Card className="mt-4">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-2">Button Preview</p>
                  <div
                    className="h-10 flex items-center justify-center text-white text-sm font-medium transition-all"
                    style={{
                      backgroundColor: config.primaryColor,
                      borderRadius: config.cornerRadius,
                      fontSize: `${config.fontScale}%`,
                    }}
                  >
                    Sign In
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="p-4 border-t space-y-3">
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={saving || !onSave}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : saved ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saved ? 'Saved!' : 'Save to Database'}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={!exportAllowed}
              title={!exportAllowed ? exportLockedReason ?? undefined : undefined}
              onClick={() => handleExport('json')}
            >
              <FileJson className="h-3 w-3 mr-1" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={!exportAllowed}
              title={!exportAllowed ? exportLockedReason ?? undefined : undefined}
              onClick={() => handleExport('dart')}
            >
              <Code className="h-3 w-3 mr-1" />
              Dart
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={!exportAllowed}
              title={!exportAllowed ? exportLockedReason ?? undefined : undefined}
              onClick={() => handleExport('ts')}
            >
              <Code className="h-3 w-3 mr-1" />
              TS
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyConfig}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Preview Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5 text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
              <Sparkles className="h-3 w-3" />
              cu_ui Design System
            </Badge>
            <Badge variant="outline" className="text-white/70 border-white/20">
              {flutterReady ? 'Live' : 'Loading...'}
            </Badge>
          </div>

          {/* Device & Controls */}
          <div className="flex items-center gap-2">
            {(Object.entries(DEVICES) as [DeviceType, DeviceConfig][]).map(([key, dev]) => (
              <Button
                key={key}
                variant={device === key ? "default" : "ghost"}
                size="sm"
                onClick={() => setDevice(key)}
                className={cn(
                  "gap-1 text-xs",
                  device === key ? "bg-white text-black" : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                {dev.icon}
                <span className="hidden md:inline">{dev.name}</span>
              </Button>
            ))}
            <div className="w-px h-6 bg-white/20 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRestart}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Screen Navigation */}
        <div className="flex items-center justify-center gap-1 py-3 border-b border-white/10">
          {SCREENS.map((screen) => (
            <Button
              key={screen.id}
              variant="ghost"
              size="sm"
              onClick={() => navigateToScreen(screen.id)}
              className={cn(
                "gap-1.5 text-xs px-3",
                currentScreen === screen.id
                  ? "bg-white/20 text-white"
                  : "text-white/50 hover:text-white hover:bg-white/10"
              )}
            >
              {screen.icon}
              {screen.label}
            </Button>
          ))}
        </div>

        {/* Device Preview */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
          <div
            className="relative bg-black shadow-2xl"
            style={{
              width: deviceConfig.width * scale + 24,
              height: deviceConfig.height * scale + 24,
              borderRadius: deviceConfig.bezelRadius * scale,
              padding: 12,
              boxShadow: "0 50px 100px -20px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.1)",
            }}
          >
            {/* Side Buttons (iPhone) */}
            {device.startsWith("iphone") && (
              <>
                <div className="absolute -left-[3px] top-[20%] w-[3px] h-[8%] bg-[#2a2a2a] rounded-l-sm" />
                <div className="absolute -left-[3px] top-[32%] w-[3px] h-[12%] bg-[#2a2a2a] rounded-l-sm" />
                <div className="absolute -left-[3px] top-[46%] w-[3px] h-[12%] bg-[#2a2a2a] rounded-l-sm" />
                <div className="absolute -right-[3px] top-[30%] w-[3px] h-[15%] bg-[#2a2a2a] rounded-r-sm" />
              </>
            )}

            {/* Screen */}
            <div
              className="relative w-full h-full overflow-hidden bg-black"
              style={{ borderRadius: (deviceConfig.bezelRadius - 8) * scale }}
            >
              {/* Loading Overlay */}
              {loading && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black">
                  <Loader2 className="h-8 w-8 text-white/50 animate-spin mb-4" />
                  <p className="text-white/50 text-sm">Loading preview...</p>
                </div>
              )}

              {/* Dynamic Island / Notch Overlay */}
              {deviceConfig.notchType === "dynamic-island" && (
                <div
                  className="absolute top-3 left-1/2 -translate-x-1/2 bg-black rounded-full z-50"
                  style={{ width: 120 * scale, height: 35 * scale }}
                />
              )}
              {deviceConfig.notchType === "punch-hole" && (
                <div
                  className="absolute top-3 left-1/2 -translate-x-1/2 bg-black rounded-full z-50"
                  style={{ width: 12 * scale, height: 12 * scale }}
                />
              )}

              {/* Flutter App Iframe */}
              <iframe
                ref={iframeRef}
                key={iframeKey}
                src={flutterAppUrl}
                className="w-full h-full border-0"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  width: `${100 / scale}%`,
                  height: `${100 / scale}%`,
                }}
                onLoad={() => {
                  // Flutter will send 'ready' message when it's loaded
                  setTimeout(() => {
                    if (!flutterReady) setLoading(false)
                  }, 3000)
                }}
                title={`${config.displayName} App Preview`}
              />

              {/* Home Indicator */}
              <div
                className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/30 rounded-full z-50"
                style={{ width: 120 * scale, height: 5 * scale }}
              />
            </div>
          </div>
        </div>

        {/* CU Info Footer */}
        <div className="flex items-center justify-center gap-4 py-4 border-t border-white/10">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: config.primaryColor }}
          >
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="" className="w-6 h-6 object-contain" />
            ) : (
              <span className="text-white text-xs font-bold">
                {config.displayName.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="text-center">
            <p className="text-white font-medium text-sm">{config.displayName}</p>
            <p className="text-white/50 text-xs">Charter #{config.charter}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureToggle({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

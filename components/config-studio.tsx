"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import {
  Smartphone,
  Monitor,
  Mail,
  Phone,
  RotateCcw,
  Loader2,
  Sparkles,
  Save,
  Palette,
  Type,
  Settings2,
  Check,
  Copy,
  RefreshCw,
  Building2,
  CreditCard,
  Shield,
  Moon,
  Sun,
  Home,
  User,
  Wallet,
  Zap,
  Code,
  FileJson,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Layers,
  ArrowRight,
  LayoutGrid,
  Eye,
  Package,
  Wand2,
  GitCompare,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Percent,
  Clock,
  MapPin,
} from "lucide-react"
import type { CreditUnionData } from "@/lib/credit-union-data"
import { useExportAllowed } from "@/hooks/use-export-allowed"

// ============================================================================
// TYPES
// ============================================================================

interface ConfigStudioProps {
  cu: CreditUnionData
  onSave?: (config: TenantConfig) => Promise<void>
}

interface TenantConfig {
  // Identity
  name: string
  displayName: string
  charter: string
  tagline: string

  // Branding
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl: string
  darkMode: boolean

  // Features
  biometrics: boolean
  mobileDeposit: boolean
  billPay: boolean
  p2p: boolean
  cardControls: boolean
  wireTransfer: boolean
  videoBanking: boolean

  // UI
  cornerRadius: number
  fontScale: number

  // Security
  mfaRequired: boolean
  sessionTimeout: number

  // Products (simplified)
  products: {
    checking: { enabled: boolean; apy: number }
    savings: { enabled: boolean; apy: number }
    moneyMarket: { enabled: boolean; apy: number; minBalance: number }
    autoLoan: { enabled: boolean; rateMin: number; rateMax: number }
  }

  // Limits
  limits: {
    internalTransfer: number
    externalTransfer: number
    p2pDaily: number
    mobileDeposit: number
  }
}

interface ValidationResult {
  id: string
  severity: 'error' | 'warning' | 'info'
  category: 'compliance' | 'security' | 'accessibility' | 'ux'
  message: string
  path: string
  autoFix?: () => Partial<TenantConfig>
}

interface ConfigPreset {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  size: 'small' | 'medium' | 'large'
  config: Partial<TenantConfig>
}

type PreviewChannel = 'mobile' | 'web' | 'email' | 'ivr'
type ScreenType = 'splash' | 'login' | 'dashboard' | 'cards' | 'settings'

// ============================================================================
// CONSTANTS
// ============================================================================

const COLOR_PRESETS = [
  { name: "Navy", color: "#1e3a5f" },
  { name: "Forest", color: "#1d4d3e" },
  { name: "Royal", color: "#2563eb" },
  { name: "Burgundy", color: "#881337" },
  { name: "Teal", color: "#0d9488" },
  { name: "Slate", color: "#475569" },
  { name: "Purple", color: "#7c3aed" },
  { name: "Emerald", color: "#059669" },
]

const CONFIG_PRESETS: ConfigPreset[] = [
  {
    id: 'community-starter',
    name: 'Community Starter',
    description: 'Essential features for CUs under $100M',
    icon: <Building2 className="h-5 w-5" />,
    size: 'small',
    config: {
      biometrics: true,
      mobileDeposit: true,
      billPay: true,
      p2p: false,
      cardControls: false,
      wireTransfer: false,
      videoBanking: false,
      mfaRequired: true,
      sessionTimeout: 15,
      limits: {
        internalTransfer: 25000,
        externalTransfer: 5000,
        p2pDaily: 500,
        mobileDeposit: 5000,
      },
    },
  },
  {
    id: 'regional-standard',
    name: 'Regional Standard',
    description: 'Full features for CUs $100M-$1B',
    icon: <Layers className="h-5 w-5" />,
    size: 'medium',
    config: {
      biometrics: true,
      mobileDeposit: true,
      billPay: true,
      p2p: true,
      cardControls: true,
      wireTransfer: false,
      videoBanking: false,
      mfaRequired: true,
      sessionTimeout: 15,
      limits: {
        internalTransfer: 50000,
        externalTransfer: 10000,
        p2pDaily: 2500,
        mobileDeposit: 10000,
      },
    },
  },
  {
    id: 'enterprise-full',
    name: 'Enterprise Suite',
    description: 'All features for CUs over $1B',
    icon: <Sparkles className="h-5 w-5" />,
    size: 'large',
    config: {
      biometrics: true,
      mobileDeposit: true,
      billPay: true,
      p2p: true,
      cardControls: true,
      wireTransfer: true,
      videoBanking: true,
      mfaRequired: true,
      sessionTimeout: 10,
      limits: {
        internalTransfer: 100000,
        externalTransfer: 25000,
        p2pDaily: 5000,
        mobileDeposit: 25000,
      },
    },
  },
]

const SCREENS: { id: ScreenType; label: string }[] = [
  { id: "splash", label: "Splash" },
  { id: "login", label: "Login" },
  { id: "dashboard", label: "Home" },
  { id: "cards", label: "Cards" },
  { id: "settings", label: "Settings" },
]

// ============================================================================
// VALIDATION
// ============================================================================

function validateConfig(config: TenantConfig): ValidationResult[] {
  const results: ValidationResult[] = []

  // WCAG Color Contrast
  const contrast = calculateContrastRatio(config.primaryColor, config.darkMode ? '#0a0a0a' : '#ffffff')
  if (contrast < 4.5) {
    results.push({
      id: 'wcag-contrast',
      severity: 'error',
      category: 'accessibility',
      message: `Color contrast ${contrast.toFixed(1)}:1 fails WCAG AA (requires 4.5:1)`,
      path: 'primaryColor',
      autoFix: () => ({ primaryColor: adjustColorForContrast(config.primaryColor, config.darkMode) }),
    })
  }

  // Session Timeout
  if (config.sessionTimeout > 15) {
    results.push({
      id: 'session-timeout',
      severity: 'warning',
      category: 'compliance',
      message: `${config.sessionTimeout} minute timeout exceeds FFIEC recommendation of 15 minutes`,
      path: 'sessionTimeout',
      autoFix: () => ({ sessionTimeout: 15 }),
    })
  }

  // MFA Requirement
  if (!config.mfaRequired) {
    results.push({
      id: 'mfa-required',
      severity: 'warning',
      category: 'security',
      message: 'MFA is strongly recommended for all banking applications',
      path: 'mfaRequired',
      autoFix: () => ({ mfaRequired: true }),
    })
  }

  // P2P Limits
  if (config.p2p && config.limits.p2pDaily > 2500) {
    results.push({
      id: 'p2p-limit',
      severity: 'info',
      category: 'compliance',
      message: `$${config.limits.p2pDaily.toLocaleString()} P2P limit exceeds industry median of $2,500`,
      path: 'limits.p2pDaily',
    })
  }

  // Logo URL
  if (!config.logoUrl) {
    results.push({
      id: 'logo-missing',
      severity: 'warning',
      category: 'ux',
      message: 'No logo URL configured - using initials fallback',
      path: 'logoUrl',
    })
  }

  // Savings APY
  if (config.products.savings.enabled && config.products.savings.apy < 0.5) {
    results.push({
      id: 'low-savings-apy',
      severity: 'info',
      category: 'ux',
      message: `Savings APY of ${config.products.savings.apy}% is below market average`,
      path: 'products.savings.apy',
    })
  }

  return results
}

function calculateContrastRatio(color1: string, color2: string): number {
  const getLuminance = (hex: string) => {
    const rgb = parseInt(hex.replace('#', ''), 16)
    const r = ((rgb >> 16) & 0xff) / 255
    const g = ((rgb >> 8) & 0xff) / 255
    const b = (rgb & 0xff) / 255
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  }
  const l1 = getLuminance(color1)
  const l2 = getLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function adjustColorForContrast(hex: string, isDark: boolean): string {
  // Darken or lighten to meet contrast
  const num = parseInt(hex.replace('#', ''), 16)
  const adjustment = isDark ? 40 : -40
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + adjustment))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + adjustment))
  const b = Math.min(255, Math.max(0, (num & 0xff) + adjustment))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConfigStudio({ cu, onSave }: ConfigStudioProps) {
  const [activeChannel, setActiveChannel] = useState<PreviewChannel>('mobile')
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard')
  const [iframeKey, setIframeKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [flutterReady, setFlutterReady] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [configTab, setConfigTab] = useState('brand')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Original config for diff comparison
  const [originalConfig, setOriginalConfig] = useState<TenantConfig | null>(null)

  const { allowed: exportAllowed, reason: exportLockedReason } = useExportAllowed(cu?.id ?? null)

  // Configuration state
  const [config, setConfig] = useState<TenantConfig>(() => createDefaultConfig(cu))

  // Validation results
  const validationResults = useMemo(() => validateConfig(config), [config])
  const errorCount = validationResults.filter(r => r.severity === 'error').length
  const warningCount = validationResults.filter(r => r.severity === 'warning').length

  // Calculate config completeness
  const completeness = useMemo(() => {
    let score = 0
    const checks = [
      config.displayName,
      config.primaryColor !== '#1e3a5f',
      config.logoUrl,
      config.tagline,
      config.products.checking.enabled || config.products.savings.enabled,
      config.biometrics || config.mobileDeposit,
      config.mfaRequired,
      errorCount === 0,
    ]
    score = checks.filter(Boolean).length
    return Math.round((score / checks.length) * 100)
  }, [config, errorCount])

  // Changes from original
  const hasChanges = useMemo(() => {
    if (!originalConfig) return false
    return JSON.stringify(config) !== JSON.stringify(originalConfig)
  }, [config, originalConfig])

  // Listen for messages from Flutter iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.source === 'flutter_preview') {
        if (event.data.type === 'ready') {
          setFlutterReady(true)
          setLoading(false)
          sendConfigToFlutter()
        } else if (event.data.type === 'screen_change') {
          setCurrentScreen(event.data.screen)
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
      iframeRef.current.contentWindow.postMessage({ type: 'navigate', screen }, '*')
    }
    setCurrentScreen(screen)
  }, [])

  // Update config when CU changes
  useEffect(() => {
    const newConfig = createDefaultConfig(cu)
    setConfig(newConfig)
    setOriginalConfig(newConfig)
    setIframeKey(prev => prev + 1)
    setFlutterReady(false)
    setLoading(true)
  }, [cu.id])

  // Build Flutter preview URL
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
  }, [iframeKey])

  const updateConfig = useCallback(<K extends keyof TenantConfig>(key: K, value: TenantConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }, [])

  const applyPreset = useCallback((preset: ConfigPreset) => {
    setConfig(prev => ({ ...prev, ...preset.config }))
    setShowPresets(false)
    setSaved(false)
  }, [])

  const handleSave = async () => {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave(config)
      setOriginalConfig(config)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const applyAutoFix = (fix: () => Partial<TenantConfig>) => {
    const updates = fix()
    setConfig(prev => ({ ...prev, ...updates }))
  }

  return (
    <div className="flex h-full bg-background">
      {/* Left Panel - Configuration */}
      <div className="w-[420px] border-r flex flex-col bg-card">
        {/* Header */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg">Configuration Studio</h2>
              <p className="text-xs text-muted-foreground">{cu.displayName || cu.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPresets(true)}>
                <Wand2 className="h-3 w-3 mr-1" />
                Presets
              </Button>
              {hasChanges && (
                <Button variant="outline" size="sm" onClick={() => setShowDiff(true)}>
                  <GitCompare className="h-3 w-3 mr-1" />
                  Diff
                </Button>
              )}
            </div>
          </div>

          {/* Progress & Validation Summary */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Completeness</span>
                <span className="font-medium">{completeness}%</span>
              </div>
              <Progress value={completeness} className="h-1.5" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              {errorCount > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5">
                  <XCircle className="h-3 w-3 mr-0.5" />
                  {errorCount}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="outline" className="h-5 px-1.5 border-yellow-500 text-yellow-600">
                  <AlertTriangle className="h-3 w-3 mr-0.5" />
                  {warningCount}
                </Badge>
              )}
              {errorCount === 0 && warningCount === 0 && (
                <Badge variant="outline" className="h-5 px-1.5 border-green-500 text-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-0.5" />
                  Valid
                </Badge>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <Tabs value={configTab} onValueChange={setConfigTab} className="p-4">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="brand" className="text-xs">
                <Palette className="h-3 w-3 mr-1" />
                Brand
              </TabsTrigger>
              <TabsTrigger value="features" className="text-xs">
                <Settings2 className="h-3 w-3 mr-1" />
                Features
              </TabsTrigger>
              <TabsTrigger value="products" className="text-xs">
                <Package className="h-3 w-3 mr-1" />
                Products
              </TabsTrigger>
              <TabsTrigger value="security" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Security
              </TabsTrigger>
            </TabsList>

            {/* Brand Tab */}
            <TabsContent value="brand" className="space-y-4 mt-0">
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
                <Label className="text-xs font-medium">Tagline</Label>
                <Input
                  value={config.tagline}
                  onChange={(e) => updateConfig('tagline', e.target.value)}
                  placeholder="Banking that puts you first"
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Primary Color</Label>
                <div className="flex gap-2">
                  <div
                    className="w-9 h-9 rounded-md border cursor-pointer shrink-0 shadow-sm transition-transform hover:scale-105"
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
                      <img src={config.logoUrl} alt="Logo" className="w-7 h-7 object-contain" />
                    </div>
                  )}
                  <Input
                    value={config.logoUrl}
                    onChange={(e) => updateConfig('logoUrl', e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-8"
                  onClick={() => {
                    const domain = cu.website?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
                    if (domain) updateConfig('logoUrl', `https://logo.clearbit.com/${domain}`)
                  }}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Auto-detect from website
                </Button>
              </div>

              <Separator />

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
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  {config.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <Label className="text-xs font-medium">{config.darkMode ? 'Dark' : 'Light'} Mode</Label>
                </div>
                <Switch
                  checked={config.darkMode}
                  onCheckedChange={(checked) => updateConfig('darkMode', checked)}
                />
              </div>
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="space-y-2 mt-0">
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
                description="Lock/unlock, set limits"
                checked={config.cardControls}
                onChange={(v) => updateConfig('cardControls', v)}
              />
              <FeatureToggle
                icon={<DollarSign className="h-4 w-4" />}
                label="Wire Transfers"
                description="Domestic & international"
                checked={config.wireTransfer}
                onChange={(v) => updateConfig('wireTransfer', v)}
              />
              <FeatureToggle
                icon={<User className="h-4 w-4" />}
                label="Video Banking"
                description="Live video with staff"
                checked={config.videoBanking}
                onChange={(v) => updateConfig('videoBanking', v)}
              />

              <Separator className="my-3" />

              <div className="space-y-3">
                <Label className="text-xs font-medium">Transfer Limits</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Internal Daily</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        type="number"
                        value={config.limits.internalTransfer}
                        onChange={(e) => updateConfig('limits', { ...config.limits, internalTransfer: Number(e.target.value) })}
                        className="h-8 pl-6 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">External Daily</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        type="number"
                        value={config.limits.externalTransfer}
                        onChange={(e) => updateConfig('limits', { ...config.limits, externalTransfer: Number(e.target.value) })}
                        className="h-8 pl-6 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">P2P Daily</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        type="number"
                        value={config.limits.p2pDaily}
                        onChange={(e) => updateConfig('limits', { ...config.limits, p2pDaily: Number(e.target.value) })}
                        className="h-8 pl-6 text-xs"
                        disabled={!config.p2p}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Mobile Deposit</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        type="number"
                        value={config.limits.mobileDeposit}
                        onChange={(e) => updateConfig('limits', { ...config.limits, mobileDeposit: Number(e.target.value) })}
                        className="h-8 pl-6 text-xs"
                        disabled={!config.mobileDeposit}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-3 mt-0">
              <ProductCard
                title="Checking"
                enabled={config.products.checking.enabled}
                onToggle={(v) => updateConfig('products', { ...config.products, checking: { ...config.products.checking, enabled: v } })}
              >
                <div className="flex items-center gap-2">
                  <Label className="text-xs">APY</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.products.checking.apy}
                    onChange={(e) => updateConfig('products', { ...config.products, checking: { ...config.products.checking, apy: Number(e.target.value) } })}
                    className="h-7 w-20 text-xs"
                  />
                  <Percent className="h-3 w-3 text-muted-foreground" />
                </div>
              </ProductCard>

              <ProductCard
                title="Savings"
                enabled={config.products.savings.enabled}
                onToggle={(v) => updateConfig('products', { ...config.products, savings: { ...config.products.savings, enabled: v } })}
              >
                <div className="flex items-center gap-2">
                  <Label className="text-xs">APY</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.products.savings.apy}
                    onChange={(e) => updateConfig('products', { ...config.products, savings: { ...config.products.savings, apy: Number(e.target.value) } })}
                    className="h-7 w-20 text-xs"
                  />
                  <Percent className="h-3 w-3 text-muted-foreground" />
                </div>
              </ProductCard>

              <ProductCard
                title="Money Market"
                enabled={config.products.moneyMarket.enabled}
                onToggle={(v) => updateConfig('products', { ...config.products, moneyMarket: { ...config.products.moneyMarket, enabled: v } })}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">APY</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={config.products.moneyMarket.apy}
                      onChange={(e) => updateConfig('products', { ...config.products, moneyMarket: { ...config.products.moneyMarket, apy: Number(e.target.value) } })}
                      className="h-7 w-16 text-xs"
                    />
                    <Percent className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Min Bal</Label>
                    <Input
                      type="number"
                      value={config.products.moneyMarket.minBalance}
                      onChange={(e) => updateConfig('products', { ...config.products, moneyMarket: { ...config.products.moneyMarket, minBalance: Number(e.target.value) } })}
                      className="h-7 w-20 text-xs"
                    />
                  </div>
                </div>
              </ProductCard>

              <ProductCard
                title="Auto Loans"
                enabled={config.products.autoLoan.enabled}
                onToggle={(v) => updateConfig('products', { ...config.products, autoLoan: { ...config.products.autoLoan, enabled: v } })}
              >
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Rate Range</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={config.products.autoLoan.rateMin}
                    onChange={(e) => updateConfig('products', { ...config.products, autoLoan: { ...config.products.autoLoan, rateMin: Number(e.target.value) } })}
                    className="h-7 w-16 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input
                    type="number"
                    step="0.25"
                    value={config.products.autoLoan.rateMax}
                    onChange={(e) => updateConfig('products', { ...config.products, autoLoan: { ...config.products.autoLoan, rateMax: Number(e.target.value) } })}
                    className="h-7 w-16 text-xs"
                  />
                  <Percent className="h-3 w-3 text-muted-foreground" />
                </div>
              </ProductCard>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4 mt-0">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Require MFA</p>
                    <p className="text-xs text-muted-foreground">Multi-factor authentication</p>
                  </div>
                </div>
                <Switch
                  checked={config.mfaRequired}
                  onCheckedChange={(v) => updateConfig('mfaRequired', v)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Session Timeout
                  </Label>
                  <span className="text-xs text-muted-foreground font-mono">{config.sessionTimeout} min</span>
                </div>
                <Slider
                  value={[config.sessionTimeout]}
                  onValueChange={([v]) => updateConfig('sessionTimeout', v)}
                  min={5}
                  max={30}
                  step={5}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>5 min (Strict)</span>
                  <span className="text-yellow-600">15 min (FFIEC)</span>
                  <span>30 min</span>
                </div>
              </div>

              {/* Validation Results */}
              {validationResults.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Validation Issues</Label>
                    {validationResults.map((result) => (
                      <Alert
                        key={result.id}
                        className={cn(
                          "py-2",
                          result.severity === 'error' && "border-red-500 bg-red-500/5",
                          result.severity === 'warning' && "border-yellow-500 bg-yellow-500/5",
                          result.severity === 'info' && "border-blue-500 bg-blue-500/5"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            {result.severity === 'error' && <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
                            {result.severity === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />}
                            {result.severity === 'info' && <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />}
                            <AlertDescription className="text-xs">
                              {result.message}
                            </AlertDescription>
                          </div>
                          {result.autoFix && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs shrink-0"
                              onClick={() => applyAutoFix(result.autoFix!)}
                            >
                              Fix
                            </Button>
                          )}
                        </div>
                      </Alert>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="p-4 border-t space-y-3">
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saving || !onSave || errorCount > 0}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saved ? 'Saved!' : errorCount > 0 ? `Fix ${errorCount} Error${errorCount > 1 ? 's' : ''} to Save` : 'Save Configuration'}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              disabled={!exportAllowed}
              title={!exportAllowed ? exportLockedReason ?? undefined : undefined}
              onClick={() => exportConfig(config, 'json')}
            >
              <FileJson className="h-3 w-3 mr-1" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              disabled={!exportAllowed}
              title={!exportAllowed ? exportLockedReason ?? undefined : undefined}
              onClick={() => exportConfig(config, 'dart')}
            >
              <Code className="h-3 w-3 mr-1" />
              Dart
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              disabled={!exportAllowed}
              title={!exportAllowed ? exportLockedReason ?? undefined : undefined}
              onClick={() => exportConfig(config, 'ts')}
            >
              <Code className="h-3 w-3 mr-1" />
              TS
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Channel Tabs */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
          <div className="flex items-center gap-1">
            {[
              { id: 'mobile' as PreviewChannel, label: 'Mobile', icon: <Smartphone className="h-4 w-4" /> },
              { id: 'web' as PreviewChannel, label: 'Web', icon: <Monitor className="h-4 w-4" /> },
              { id: 'email' as PreviewChannel, label: 'Email', icon: <Mail className="h-4 w-4" /> },
            ].map((channel) => (
              <Button
                key={channel.id}
                variant="ghost"
                size="sm"
                onClick={() => setActiveChannel(channel.id)}
                className={cn(
                  "gap-2 text-xs",
                  activeChannel === channel.id
                    ? "bg-white/20 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                {channel.icon}
                {channel.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 gap-1">
              <Zap className="h-3 w-3" />
              {flutterReady ? 'Live' : 'Loading...'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setIframeKey(k => k + 1); setLoading(true); setFlutterReady(false) }}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Screen Navigation (Mobile only) */}
        {activeChannel === 'mobile' && (
          <div className="flex items-center justify-center gap-1 py-2 border-b border-white/10">
            {SCREENS.map((screen) => (
              <Button
                key={screen.id}
                variant="ghost"
                size="sm"
                onClick={() => navigateToScreen(screen.id)}
                className={cn(
                  "text-xs px-3 h-7",
                  currentScreen === screen.id
                    ? "bg-white/20 text-white"
                    : "text-white/50 hover:text-white hover:bg-white/10"
                )}
              >
                {screen.label}
              </Button>
            ))}
          </div>
        )}

        {/* Preview Content */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
          {activeChannel === 'mobile' && (
            <MobilePreview
              config={config}
              cu={cu}
              loading={loading}
              flutterAppUrl={flutterAppUrl}
              iframeRef={iframeRef}
              iframeKey={iframeKey}
              onLoad={() => {
                setTimeout(() => { if (!flutterReady) setLoading(false) }, 3000)
              }}
            />
          )}
          {activeChannel === 'web' && (
            <WebPreview config={config} cu={cu} />
          )}
          {activeChannel === 'email' && (
            <EmailPreview config={config} cu={cu} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 py-3 border-t border-white/10 bg-black/20">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: config.primaryColor }}
          >
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="" className="w-5 h-5 object-contain" />
            ) : (
              <span className="text-white text-[10px] font-bold">
                {config.displayName.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="text-center">
            <p className="text-white font-medium text-sm">{config.displayName}</p>
            <p className="text-white/50 text-xs">{config.tagline || `Charter #${config.charter}`}</p>
          </div>
        </div>
      </div>

      {/* Presets Dialog */}
      <Dialog open={showPresets} onOpenChange={setShowPresets}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Start from a Preset</DialogTitle>
            <DialogDescription>
              Choose a configuration template based on your credit union size
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {CONFIG_PRESETS.map((preset) => (
              <Card
                key={preset.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => applyPreset(preset)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    {preset.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{preset.name}</p>
                    <p className="text-sm text-muted-foreground">{preset.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diff Dialog */}
      <Dialog open={showDiff} onOpenChange={setShowDiff}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Configuration Changes</DialogTitle>
            <DialogDescription>
              Review changes before saving
            </DialogDescription>
          </DialogHeader>
          <DiffView original={originalConfig} current={config} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfig(originalConfig!); setShowDiff(false) }}>
              Discard Changes
            </Button>
            <Button onClick={() => { handleSave(); setShowDiff(false) }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

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
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
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

function ProductCard({
  title,
  enabled,
  onToggle,
  children,
}: {
  title: string
  enabled: boolean
  onToggle: (enabled: boolean) => void
  children: React.ReactNode
}) {
  return (
    <Card className={cn(!enabled && "opacity-60")}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">{title}</p>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
        {enabled && children}
      </CardContent>
    </Card>
  )
}

function MobilePreview({
  config,
  cu,
  loading,
  flutterAppUrl,
  iframeRef,
  iframeKey,
  onLoad,
}: {
  config: TenantConfig
  cu: CreditUnionData
  loading: boolean
  flutterAppUrl: string
  iframeRef: React.RefObject<HTMLIFrameElement>
  iframeKey: number
  onLoad: () => void
}) {
  const scale = 0.55
  const width = 393
  const height = 852
  const bezelRadius = 55

  return (
    <div
      className="relative bg-black shadow-2xl"
      style={{
        width: width * scale + 24,
        height: height * scale + 24,
        borderRadius: bezelRadius * scale,
        padding: 12,
        boxShadow: "0 50px 100px -20px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.1)",
      }}
    >
      {/* Side Buttons */}
      <div className="absolute -left-[3px] top-[20%] w-[3px] h-[8%] bg-[#2a2a2a] rounded-l-sm" />
      <div className="absolute -left-[3px] top-[32%] w-[3px] h-[12%] bg-[#2a2a2a] rounded-l-sm" />
      <div className="absolute -left-[3px] top-[46%] w-[3px] h-[12%] bg-[#2a2a2a] rounded-l-sm" />
      <div className="absolute -right-[3px] top-[30%] w-[3px] h-[15%] bg-[#2a2a2a] rounded-r-sm" />

      {/* Screen */}
      <div
        className="relative w-full h-full overflow-hidden bg-black"
        style={{ borderRadius: (bezelRadius - 8) * scale }}
      >
        {loading && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black">
            <Loader2 className="h-8 w-8 text-white/50 animate-spin mb-4" />
            <p className="text-white/50 text-sm">Loading preview...</p>
          </div>
        )}

        {/* Dynamic Island */}
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 bg-black rounded-full z-50"
          style={{ width: 120 * scale, height: 35 * scale }}
        />

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
          onLoad={onLoad}
          title="Mobile Preview"
        />

        {/* Home Indicator */}
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/30 rounded-full z-50"
          style={{ width: 120 * scale, height: 5 * scale }}
        />
      </div>
    </div>
  )
}

function WebPreview({ config, cu }: { config: TenantConfig; cu: CreditUnionData }) {
  return (
    <div className="w-full max-w-4xl">
      <div className="rounded-lg overflow-hidden shadow-2xl border border-white/10">
        {/* Browser Chrome */}
        <div className="bg-[#2a2a2a] px-4 py-2 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 bg-[#1a1a1a] rounded-md px-3 py-1 text-white/60 text-xs">
            banking.{cu.website?.replace(/^https?:\/\//, '').replace(/^www\./, '') || 'example.com'}
          </div>
        </div>

        {/* Web App Content */}
        <div className={cn("h-[500px]", config.darkMode ? "bg-[#0a0a0a]" : "bg-white")}>
          {/* Header */}
          <div className="h-14 px-6 flex items-center justify-between border-b" style={{ borderColor: config.darkMode ? '#222' : '#eee' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
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
              <span className={cn("font-semibold", config.darkMode ? "text-white" : "text-gray-900")}>
                {config.displayName}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className={cn("text-sm", config.darkMode ? "text-white/70" : "text-gray-600")}>Accounts</span>
              <span className={cn("text-sm", config.darkMode ? "text-white/70" : "text-gray-600")}>Transfers</span>
              <span className={cn("text-sm", config.darkMode ? "text-white/70" : "text-gray-600")}>Payments</span>
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 grid grid-cols-3 gap-6">
            {/* Balance Card */}
            <div className="col-span-2">
              <div
                className="rounded-xl p-6"
                style={{
                  backgroundColor: config.primaryColor,
                  borderRadius: config.cornerRadius + 4,
                }}
              >
                <p className="text-white/80 text-sm">Total Balance</p>
                <p className="text-white text-4xl font-bold mt-1">$24,832.50</p>
                <div className="flex gap-3 mt-6">
                  <button
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
                    style={{ borderRadius: config.cornerRadius }}
                  >
                    Transfer
                  </button>
                  {config.billPay && (
                    <button
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
                      style={{ borderRadius: config.cornerRadius }}
                    >
                      Pay Bills
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <p className={cn("text-sm font-medium", config.darkMode ? "text-white" : "text-gray-900")}>Quick Actions</p>
              {[
                { label: "Transfer", enabled: true },
                { label: "Deposit", enabled: config.mobileDeposit },
                { label: "Pay", enabled: config.billPay },
                { label: "Send", enabled: config.p2p },
              ].filter(a => a.enabled).map((action) => (
                <div
                  key={action.label}
                  className={cn(
                    "p-3 border flex items-center gap-3 cursor-pointer hover:bg-muted/50",
                    config.darkMode ? "bg-[#111] border-white/10" : "bg-gray-50 border-gray-200"
                  )}
                  style={{ borderRadius: config.cornerRadius }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${config.primaryColor}20` }}>
                    <ArrowRight className="h-4 w-4" style={{ color: config.primaryColor }} />
                  </div>
                  <span className={cn("text-sm", config.darkMode ? "text-white" : "text-gray-900")}>{action.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmailPreview({ config, cu }: { config: TenantConfig; cu: CreditUnionData }) {
  return (
    <div className="w-full max-w-2xl">
      <div className="rounded-lg overflow-hidden shadow-2xl bg-white">
        {/* Email Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: config.primaryColor }}
            >
              {config.logoUrl ? (
                <img src={config.logoUrl} alt="" className="w-8 h-8 object-contain" />
              ) : (
                <span className="text-white text-sm font-bold">
                  {config.displayName.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{config.displayName}</p>
              <p className="text-sm text-gray-500">noreply@{cu.website?.replace(/^https?:\/\//, '').replace(/^www\./, '') || 'example.com'}</p>
            </div>
          </div>
          <p className="text-lg font-medium text-gray-900">Welcome to {config.displayName}!</p>
        </div>

        {/* Email Body */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Hi <span className="font-medium">John</span>,
          </p>
          <p className="text-gray-700 mb-4">
            Thank you for joining {config.displayName}. We're excited to have you as a member of our credit union family.
          </p>

          <div
            className="p-4 my-6"
            style={{
              backgroundColor: `${config.primaryColor}10`,
              borderRadius: config.cornerRadius,
              borderLeft: `4px solid ${config.primaryColor}`,
            }}
          >
            <p className="font-medium text-gray-900 mb-2">Your Account Summary</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-gray-600">Member Number:</p>
              <p className="font-medium text-gray-900">****4532</p>
              <p className="text-gray-600">Checking Account:</p>
              <p className="font-medium text-gray-900">****7891</p>
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            {config.tagline || "We're here to help you achieve your financial goals."}
          </p>

          <button
            className="px-6 py-3 text-white font-medium w-full"
            style={{
              backgroundColor: config.primaryColor,
              borderRadius: config.cornerRadius,
            }}
          >
            Log In to Online Banking
          </button>
        </div>

        {/* Email Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t text-center">
          <p className="text-xs text-gray-500">
            {config.displayName} | Charter #{config.charter}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            This is an automated message. Please do not reply directly to this email.
          </p>
        </div>
      </div>
    </div>
  )
}

function DiffView({ original, current }: { original: TenantConfig | null; current: TenantConfig }) {
  if (!original) return null

  const changes: { path: string; oldVal: any; newVal: any }[] = []

  const compare = (obj1: any, obj2: any, path = '') => {
    for (const key of Object.keys(obj2)) {
      const fullPath = path ? `${path}.${key}` : key
      if (typeof obj2[key] === 'object' && obj2[key] !== null && !Array.isArray(obj2[key])) {
        compare(obj1?.[key] || {}, obj2[key], fullPath)
      } else if (JSON.stringify(obj1?.[key]) !== JSON.stringify(obj2[key])) {
        changes.push({ path: fullPath, oldVal: obj1?.[key], newVal: obj2[key] })
      }
    }
  }

  compare(original, current)

  if (changes.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No changes to save</p>
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{changes.length} field{changes.length !== 1 ? 's' : ''} changed</p>
      {changes.map((change) => (
        <div key={change.path} className="p-3 rounded-lg border bg-muted/30">
          <p className="text-xs font-mono text-muted-foreground mb-1">{change.path}</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-red-500 line-through">{formatValue(change.oldVal)}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-green-500 font-medium">{formatValue(change.newVal)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function createDefaultConfig(cu: CreditUnionData): TenantConfig {
  return {
    name: cu.name || '',
    displayName: cu.displayName || cu.name || '',
    charter: cu.charter || '',
    tagline: '',
    primaryColor: cu.primaryColor || '#1e3a5f',
    secondaryColor: adjustColorForContrast(cu.primaryColor || '#1e3a5f', true),
    accentColor: '#10b981',
    logoUrl: cu.logoUrl || cu.logoUrls?.clearbit || '',
    darkMode: true,
    biometrics: true,
    mobileDeposit: true,
    billPay: true,
    p2p: true,
    cardControls: true,
    wireTransfer: false,
    videoBanking: false,
    cornerRadius: 12,
    fontScale: 100,
    mfaRequired: true,
    sessionTimeout: 15,
    products: {
      checking: { enabled: true, apy: 0.01 },
      savings: { enabled: true, apy: 4.25 },
      moneyMarket: { enabled: true, apy: 4.75, minBalance: 2500 },
      autoLoan: { enabled: true, rateMin: 6.49, rateMax: 12.99 },
    },
    limits: {
      internalTransfer: 50000,
      externalTransfer: 10000,
      p2pDaily: 2500,
      mobileDeposit: 10000,
    },
  }
}

function formatValue(val: any): string {
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (typeof val === 'number') return val.toLocaleString()
  if (typeof val === 'string') return val || '(empty)'
  return JSON.stringify(val)
}

function exportConfig(config: TenantConfig, format: 'json' | 'dart' | 'ts') {
  let content: string
  let filename: string

  if (format === 'json') {
    content = JSON.stringify(config, null, 2)
    filename = `${config.charter || 'cu'}-config.json`
  } else if (format === 'dart') {
    content = `// ${config.displayName} Configuration
// Generated by CU.APP Configuration Studio

import 'package:flutter/material.dart';

class TenantConfig {
  static const String name = '${config.displayName}';
  static const String charter = '${config.charter}';
  static const Color primaryColor = Color(0xFF${config.primaryColor.replace('#', '')});
  static const String logoUrl = '${config.logoUrl}';
  static const bool darkMode = ${config.darkMode};
  static const double cornerRadius = ${config.cornerRadius};

  // Features
  static const bool biometrics = ${config.biometrics};
  static const bool mobileDeposit = ${config.mobileDeposit};
  static const bool billPay = ${config.billPay};
  static const bool p2p = ${config.p2p};
  static const bool cardControls = ${config.cardControls};

  // Security
  static const bool mfaRequired = ${config.mfaRequired};
  static const int sessionTimeout = ${config.sessionTimeout};
}
`
    filename = `${config.charter || 'cu'}_config.dart`
  } else {
    content = `// ${config.displayName} Configuration
// Generated by CU.APP Configuration Studio

export const tenantConfig = ${JSON.stringify(config, null, 2)} as const;
`
    filename = `${config.charter || 'cu'}-config.ts`
  }

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

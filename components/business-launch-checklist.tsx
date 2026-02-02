"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"
import {
  Server,
  Database,
  Cloud,
  Lock,
  Smartphone,
  GitBranch,
  Shield,
  Rocket,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Settings,
  ExternalLink,
} from "lucide-react"
import type { CreditUnionData } from "@/lib/credit-union-data"

interface LaunchChecklistProps {
  cu: CreditUnionData
}

interface ChecklistSection {
  id: string
  title: string
  icon: React.ReactNode
  items: ChecklistItem[]
}

interface ChecklistItem {
  id: string
  label: string
  required: boolean
  notes?: string
}

const CHECKLIST_DATA: ChecklistSection[] = [
  {
    id: "infrastructure",
    title: "Phase 1: Infrastructure Setup",
    icon: <Cloud className="h-5 w-5" />,
    items: [
      { id: "service-fabric", label: "Provision Azure Service Fabric clusters", required: true },
      { id: "keyvault", label: "Configure Azure KeyVault with all secrets", required: true },
      { id: "app-config", label: "Set up Azure App Configuration", required: true },
      { id: "cosmosdb", label: "Provision CosmosDB instances", required: true },
      { id: "storage", label: "Configure Azure Storage accounts", required: true },
      { id: "app-insights", label: "Set up Application Insights", required: true },
      { id: "service-bus", label: "Configure Azure Service Bus", required: true },
    ],
  },
  {
    id: "databases",
    title: "Phase 2: Database Setup",
    icon: <Database className="h-5 w-5" />,
    items: [
      { id: "duende-schema", label: "Deploy DuendeDB schema (run migrations)", required: true },
      { id: "identity-schema", label: "Deploy AspNetIdentityDb schema", required: true },
      { id: "symitar-verify", label: "Verify Symitar/SymXchange connectivity", required: true, notes: "Test PowerOn endpoint" },
      { id: "oauth-seed", label: "Seed OAuth clients and scopes", required: true },
      { id: "signing-keys", label: "Configure identity signing keys", required: true },
    ],
  },
  {
    id: "backend",
    title: "Phase 3: Backend Services Deployment",
    icon: <Server className="h-5 w-5" />,
    items: [
      { id: "identity-api", label: "Deploy IdentityManagement.API", required: true },
      { id: "bff-api", label: "Deploy OnlineBanking.BFF.API", required: true },
      { id: "m3-services", label: "Deploy M3 services (Loans, CardManagement, etc.)", required: true },
      { id: "userview", label: "Deploy UserView service", required: true },
      { id: "messaging", label: "Deploy Messaging service", required: true },
      { id: "push-notif", label: "Deploy PushNotifications service", required: true },
      { id: "mx-integration", label: "Deploy MX integration service", required: true },
    ],
  },
  {
    id: "integrations",
    title: "Phase 4: External Integrations",
    icon: <ExternalLink className="h-5 w-5" />,
    items: [
      { id: "mx-keys", label: "Configure MX API keys and endpoints", required: true },
      { id: "visa-gateway", label: "Configure VISA Gateway credentials", required: true },
      { id: "alloy", label: "Configure Alloy integration", required: true },
      { id: "firebase", label: "Set up Firebase projects (iOS/Android)", required: true },
      { id: "cloudflare", label: "Configure Cloudflare Access", required: true },
    ],
  },
  {
    id: "mobile",
    title: "Phase 5: Mobile App Build",
    icon: <Smartphone className="h-5 w-5" />,
    items: [
      { id: "flutter-build", label: "Build Flutter app with prod config", required: true },
      { id: "android-sign", label: "Sign Android APK with production keystore", required: true },
      { id: "ios-sign", label: "Sign iOS app with production certificates", required: true },
      { id: "app-store", label: "Submit to App Store Connect", required: true },
      { id: "play-store", label: "Submit to Google Play Console", required: true },
    ],
  },
  {
    id: "testing",
    title: "Phase 6: Testing & Validation",
    icon: <Shield className="h-5 w-5" />,
    items: [
      { id: "integration-tests", label: "Run integration tests against staging", required: true },
      { id: "security-scan", label: "Perform security scan (NowSecure)", required: true },
      { id: "load-test", label: "Load testing on production infrastructure", required: true },
      { id: "uat", label: "UAT with test accounts", required: true },
      { id: "smoke-test", label: "Smoke test all critical flows", required: true },
    ],
  },
  {
    id: "golive",
    title: "Phase 7: Go-Live",
    icon: <Rocket className="h-5 w-5" />,
    items: [
      { id: "dns-routing", label: "Enable production DNS/Cloudflare routing", required: true },
      { id: "api-switch", label: "Switch mobile apps to production API", required: true },
      { id: "monitor-insights", label: "Monitor Application Insights", required: true },
      { id: "newrelic", label: "Activate New Relic monitoring", required: true },
      { id: "alerts", label: "Enable production alerts", required: true },
    ],
  },
]

const INFRASTRUCTURE_FIELDS = [
  {
    section: "Core Banking Host (Symitar)",
    fields: [
      { id: "symitar-training-host", label: "Training Host URL", placeholder: "symtrain.ssfcu.inet" },
      { id: "symitar-training-port", label: "Training Port", placeholder: "8086" },
      { id: "symitar-prod-host", label: "Production Host URL", placeholder: "symitar.ssfcu.inet" },
      { id: "symitar-prod-port", label: "Production Port", placeholder: "8086" },
      { id: "symitar-device-number", label: "Device Number", placeholder: "1" },
      { id: "symitar-timeout", label: "Timeout Seconds", placeholder: "300" },
    ],
  },
  {
    section: "Identity Management (Duende)",
    fields: [
      { id: "duende-issuer-uri", label: "Issuer URI (Production)", placeholder: "https://..." },
      { id: "duende-db-server", label: "DuendeDb Server", placeholder: "xxx.database.windows.net,1433" },
      { id: "duende-db-catalog", label: "DuendeDb Catalog", placeholder: "idm-config-sql" },
      { id: "identity-db-catalog", label: "AspNetIdentityDb Catalog", placeholder: "idm-users-sql" },
      { id: "max-failed-attempts", label: "Max Failed Access Attempts", placeholder: "5" },
    ],
  },
  {
    section: "Production API Gateway",
    fields: [
      { id: "api-prod-url", label: "Production API URL", placeholder: "https://api-prod.suncoastcreditunion.com/banking" },
      { id: "cloudflare-access-id", label: "Cloudflare Access ID", placeholder: "Environment variable" },
      { id: "cloudflare-access-secret", label: "Cloudflare Access Secret", placeholder: "Environment variable" },
    ],
  },
  {
    section: "MX Integration",
    fields: [
      { id: "mx-hmac-key", label: "MX HMAC Key (KeyVault)", placeholder: "KeyVault reference" },
      { id: "mx-api-key", label: "MX Global API Key (KeyVault)", placeholder: "KeyVault reference" },
      { id: "mx-sso-url", label: "MX SSO Base URL", placeholder: "https://..." },
      { id: "mx-nexus-url", label: "MX Nexus Base URL", placeholder: "https://..." },
      { id: "mx-realtime-url", label: "MX Realtime Base URL", placeholder: "https://..." },
    ],
  },
  {
    section: "Push Notifications",
    fields: [
      { id: "ios-newrelic-token", label: "iOS New Relic Token", placeholder: "AAfc71e486..." },
      { id: "android-newrelic-token", label: "Android New Relic Token", placeholder: "AA397c38d1..." },
      { id: "firebase-ios-config", label: "Firebase iOS Config (google-services.json)", placeholder: "Path or content" },
      { id: "firebase-android-config", label: "Firebase Android Config", placeholder: "Path or content" },
      { id: "azure-notification-hub", label: "Azure Notification Hub Connection String", placeholder: "Endpoint=sb://..." },
    ],
  },
  {
    section: "Azure Infrastructure",
    fields: [
      { id: "app-insights-prod-key", label: "Application Insights Key (Production)", placeholder: "0e2ff6eb-074c-4dc8..." },
      { id: "app-insights-dev-key", label: "Application Insights Key (Development)", placeholder: "b922ad52-d3a4-4e4c..." },
      { id: "azure-keyvault-name", label: "Azure KeyVault Name", placeholder: "scu-prod-keyvault" },
      { id: "azure-app-config-conn", label: "Azure App Config Connection String", placeholder: "Endpoint=https://..." },
      { id: "service-fabric-cluster", label: "Service Fabric Cluster Name", placeholder: "scu-prod-sf-cluster" },
    ],
  },
]

export function BusinessLaunchChecklist({ cu }: LaunchChecklistProps) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState<Record<string, string>>({})

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem(`launch-checklist-${cu.charter}`)
    if (saved) {
      const data = JSON.parse(saved)
      setCompletedItems(new Set(data.completed || []))
      setFormData(data.form || {})
    }
  }, [cu.charter])

  const saveProgress = (completed: Set<string>, form: Record<string, string>) => {
    localStorage.setItem(
      `launch-checklist-${cu.charter}`,
      JSON.stringify({ completed: Array.from(completed), form })
    )
  }

  const toggleItem = (itemId: string) => {
    const newCompleted = new Set(completedItems)
    if (newCompleted.has(itemId)) {
      newCompleted.delete(itemId)
    } else {
      newCompleted.add(itemId)
    }
    setCompletedItems(newCompleted)
    saveProgress(newCompleted, formData)
  }

  const updateField = (fieldId: string, value: string) => {
    const newForm = { ...formData, [fieldId]: value }
    setFormData(newForm)
    saveProgress(completedItems, newForm)
  }

  const totalItems = CHECKLIST_DATA.reduce((acc, section) => acc + section.items.length, 0)
  const completedCount = completedItems.size
  const progressPercent = Math.round((completedCount / totalItems) * 100)

  const getSectionProgress = (section: ChecklistSection) => {
    const sectionCompleted = section.items.filter((item) => completedItems.has(item.id)).length
    return Math.round((sectionCompleted / section.items.length) * 100)
  }

  return (
    <div className="h-full flex flex-col p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">Business Launch Checklist</h1>
            <p className="text-sm text-muted-foreground">
              {cu.displayName} - Charter #{cu.charter}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{progressPercent}%</div>
            <p className="text-xs text-muted-foreground">
              {completedCount} of {totalItems} completed
            </p>
          </div>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
        {/* Left Column: Infrastructure Configuration */}
        <div className="space-y-4 overflow-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Infrastructure Configuration
              </CardTitle>
              <CardDescription>Required credentials and endpoints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {INFRASTRUCTURE_FIELDS.map((section) => (
                <div key={section.section} className="space-y-3">
                  <h3 className="font-semibold text-sm">{section.section}</h3>
                  <div className="space-y-2">
                    {section.fields.map((field) => (
                      <div key={field.id} className="space-y-1">
                        <Label className="text-xs">{field.label}</Label>
                        <Input
                          value={formData[field.id] || ""}
                          onChange={(e) => updateField(field.id, e.target.value)}
                          placeholder={field.placeholder}
                          className="h-8 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                  <Separator />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Launch Checklist */}
        <div className="space-y-4 overflow-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Launch Phases
              </CardTitle>
              <CardDescription>7-phase deployment checklist</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {CHECKLIST_DATA.map((section) => {
                  const progress = getSectionProgress(section)
                  const allCompleted = progress === 100

                  return (
                    <AccordionItem key={section.id} value={section.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 w-full">
                          {section.icon}
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{section.title}</span>
                              {allCompleted && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={progress} className="h-1 w-32" />
                              <span className="text-xs text-muted-foreground">
                                {progress}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-2">
                          {section.items.map((item) => {
                            const isCompleted = completedItems.has(item.id)
                            return (
                              <div
                                key={item.id}
                                className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50"
                              >
                                <Checkbox
                                  checked={isCompleted}
                                  onCheckedChange={() => toggleItem(item.id)}
                                  className="mt-0.5"
                                />
                                <div className="flex-1">
                                  <label
                                    htmlFor={item.id}
                                    className="text-sm cursor-pointer select-none"
                                  >
                                    {item.label}
                                    {item.required && (
                                      <Badge
                                        variant="destructive"
                                        className="ml-2 text-[10px] h-4"
                                      >
                                        REQUIRED
                                      </Badge>
                                    )}
                                  </label>
                                  {item.notes && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {item.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </CardContent>
          </Card>

          {/* Critical Requirements Alert */}
          <Card className="border-orange-500/50 bg-orange-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-5 w-5" />
                Critical Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">Cannot launch without:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Symitar/SymXchange production connectivity</li>
                <li>• Duende IdentityServer with production credentials</li>
                <li>• Azure KeyVault access with all secrets</li>
                <li>• Production API Gateway URL and Cloudflare Access</li>
                <li>• Mobile app signing certificates (iOS & Android)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

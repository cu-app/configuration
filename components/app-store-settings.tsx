"use client"

import { useState, useEffect } from "react"
import {
  Apple,
  Play,
  Key,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Upload,
  Loader2,
  ExternalLink,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

// ============================================================================
// TYPES
// ============================================================================

interface AppStoreCredentials {
  id?: string
  tenant_id: string
  // iOS
  apple_issuer_id: string
  apple_key_id: string
  apple_private_key: string
  apple_app_id: string
  apple_bundle_id: string
  // Android
  google_service_account_json: string
  google_package_name: string
  // Status
  ios_connected: boolean
  android_connected: boolean
  last_ios_sync?: string
  last_android_sync?: string
}

interface AppStoreSettingsProps {
  tenantId: string
  tenantName: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AppStoreSettings({ tenantId, tenantName }: AppStoreSettingsProps) {
  const { toast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<"ios" | "android" | null>(null)

  // Form state
  const [credentials, setCredentials] = useState<Partial<AppStoreCredentials>>({
    tenant_id: tenantId,
    apple_issuer_id: "",
    apple_key_id: "",
    apple_private_key: "",
    apple_app_id: "",
    apple_bundle_id: "",
    google_service_account_json: "",
    google_package_name: "",
    ios_connected: false,
    android_connected: false,
  })

  // Visibility toggles
  const [showAppleKey, setShowAppleKey] = useState(false)
  const [showGoogleJson, setShowGoogleJson] = useState(false)

  // Load existing credentials
  useEffect(() => {
    loadCredentials()
  }, [tenantId])

  const loadCredentials = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("cu_app_store_credentials")
        .select("*")
        .eq("tenant_id", tenantId)
        .single()

      if (data) {
        setCredentials(data)
      }
    } catch (error) {
      // No existing credentials - that's fine
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from("cu_app_store_credentials")
        .upsert({
          ...credentials,
          tenant_id: tenantId,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      toast({ title: "Saved", description: "App store credentials saved successfully" })
    } catch (error) {
      console.error("Save error:", error)
      toast({ title: "Error", description: "Failed to save credentials", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async (platform: "ios" | "android") => {
    setTesting(platform)
    try {
      // First save the current credentials
      await handleSave()

      // Then try to fetch reviews to test the connection
      const response = await fetch(`/api/app-store/reviews?tenantId=${tenantId}&platform=${platform}`)
      const data = await response.json()

      if (response.ok) {
        // Update connected status
        const updateField = platform === "ios" ? "ios_connected" : "android_connected"
        const syncField = platform === "ios" ? "last_ios_sync" : "last_android_sync"

        await supabase
          .from("cu_app_store_credentials")
          .update({
            [updateField]: true,
            [syncField]: new Date().toISOString(),
          })
          .eq("tenant_id", tenantId)

        setCredentials((prev) => ({
          ...prev,
          [updateField]: true,
          [syncField]: new Date().toISOString(),
        }))

        toast({
          title: "Connection successful",
          description: `Found ${data.reviews?.length || 0} reviews from ${platform === "ios" ? "App Store" : "Play Store"}`,
        })
      } else {
        throw new Error(data.error || "Connection failed")
      }
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message || "Could not connect to the app store",
        variant: "destructive",
      })
    } finally {
      setTesting(null)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      
      // Check if it's a P8 key (Apple) or JSON (Google)
      if (file.name.endsWith(".p8")) {
        setCredentials((prev) => ({ ...prev, apple_private_key: content }))
        toast({ title: "Key loaded", description: "Apple private key loaded from file" })
      } else if (file.name.endsWith(".json")) {
        setCredentials((prev) => ({ ...prev, google_service_account_json: content }))
        toast({ title: "Credentials loaded", description: "Google service account loaded from file" })
      } else {
        toast({ title: "Invalid file", description: "Please upload a .p8 or .json file", variant: "destructive" })
      }
    }
    reader.readAsText(file)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">App Store Settings</h2>
        <p className="text-muted-foreground">
          Connect your app stores to monitor reviews for {tenantName}
        </p>
      </div>

      <Tabs defaultValue="ios">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ios" className="gap-2">
            <Apple className="h-4 w-4" />
            iOS / App Store
            {credentials.ios_connected && (
              <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="android" className="gap-2">
            <Play className="h-4 w-4" />
            Android / Play Store
            {credentials.android_connected && (
              <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* iOS Tab */}
        <TabsContent value="ios" className="space-y-4">
          <Alert>
            <Apple className="h-4 w-4" />
            <AlertTitle>App Store Connect API</AlertTitle>
            <AlertDescription>
              You'll need to create an API key in{" "}
              <a
                href="https://appstoreconnect.apple.com/access/api"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                App Store Connect
              </a>
              {" "}with "Customer Reviews" access.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">API Credentials</CardTitle>
              <CardDescription>
                Enter your App Store Connect API credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apple_issuer_id">Issuer ID</Label>
                  <Input
                    id="apple_issuer_id"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={credentials.apple_issuer_id || ""}
                    onChange={(e) =>
                      setCredentials((prev) => ({ ...prev, apple_issuer_id: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apple_key_id">Key ID</Label>
                  <Input
                    id="apple_key_id"
                    placeholder="XXXXXXXXXX"
                    value={credentials.apple_key_id || ""}
                    onChange={(e) =>
                      setCredentials((prev) => ({ ...prev, apple_key_id: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apple_private_key">Private Key (.p8)</Label>
                <div className="relative">
                  <Textarea
                    id="apple_private_key"
                    placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                    className="font-mono text-xs min-h-[120px]"
                    value={showAppleKey ? credentials.apple_private_key || "" : credentials.apple_private_key ? "••••••••••••" : ""}
                    onChange={(e) =>
                      setCredentials((prev) => ({ ...prev, apple_private_key: e.target.value }))
                    }
                    readOnly={!showAppleKey && !!credentials.apple_private_key}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setShowAppleKey(!showAppleKey)}
                  >
                    {showAppleKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="apple_key_upload"
                    className="cursor-pointer text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Upload className="h-3 w-3" />
                    Upload .p8 file
                  </Label>
                  <input
                    id="apple_key_upload"
                    type="file"
                    accept=".p8"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apple_app_id">App ID</Label>
                  <Input
                    id="apple_app_id"
                    placeholder="123456789"
                    value={credentials.apple_app_id || ""}
                    onChange={(e) =>
                      setCredentials((prev) => ({ ...prev, apple_app_id: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apple_bundle_id">Bundle ID</Label>
                  <Input
                    id="apple_bundle_id"
                    placeholder="com.creditunion.app"
                    value={credentials.apple_bundle_id || ""}
                    onChange={(e) =>
                      setCredentials((prev) => ({ ...prev, apple_bundle_id: e.target.value }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            {credentials.last_ios_sync && (
              <p className="text-sm text-muted-foreground">
                Last synced: {new Date(credentials.last_ios_sync).toLocaleString()}
              </p>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={() => handleTestConnection("ios")}
                disabled={testing === "ios" || !credentials.apple_issuer_id}
              >
                {testing === "ios" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Android Tab */}
        <TabsContent value="android" className="space-y-4">
          <Alert>
            <Play className="h-4 w-4" />
            <AlertTitle>Google Play Developer API</AlertTitle>
            <AlertDescription>
              Create a service account in{" "}
              <a
                href="https://play.google.com/console"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Google Play Console
              </a>
              {" "}and grant it "Reply to reviews" permission.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Service Account</CardTitle>
              <CardDescription>
                Upload your Google Play service account JSON file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="google_service_account_json">Service Account JSON</Label>
                <div className="relative">
                  <Textarea
                    id="google_service_account_json"
                    placeholder='{"type": "service_account", ...}'
                    className="font-mono text-xs min-h-[120px]"
                    value={
                      showGoogleJson
                        ? credentials.google_service_account_json || ""
                        : credentials.google_service_account_json
                          ? "••••••••••••"
                          : ""
                    }
                    onChange={(e) =>
                      setCredentials((prev) => ({
                        ...prev,
                        google_service_account_json: e.target.value,
                      }))
                    }
                    readOnly={!showGoogleJson && !!credentials.google_service_account_json}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setShowGoogleJson(!showGoogleJson)}
                  >
                    {showGoogleJson ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="google_json_upload"
                    className="cursor-pointer text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Upload className="h-3 w-3" />
                    Upload .json file
                  </Label>
                  <input
                    id="google_json_upload"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="google_package_name">Package Name</Label>
                <Input
                  id="google_package_name"
                  placeholder="com.creditunion.app"
                  value={credentials.google_package_name || ""}
                  onChange={(e) =>
                    setCredentials((prev) => ({ ...prev, google_package_name: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            {credentials.last_android_sync && (
              <p className="text-sm text-muted-foreground">
                Last synced: {new Date(credentials.last_android_sync).toLocaleString()}
              </p>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={() => handleTestConnection("android")}
                disabled={testing === "android" || !credentials.google_service_account_json}
              >
                {testing === "android" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Credentials
        </Button>
      </div>
    </div>
  )
}

export default AppStoreSettings

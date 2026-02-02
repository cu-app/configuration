"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Upload, 
  MoreVertical, 
  Check, 
  X, 
  Loader2,
  Image as ImageIcon,
  Smartphone,
  Palette,
  Settings2,
  Copy,
  Star,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import type { CreditUnionData } from "@/lib/credit-union-data"

interface AppTemplate {
  id: string
  tenant_id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  logo_storage_path: string | null
  splash_config: SplashConfig
  theme_config: ThemeConfig
  nav_config: NavConfig
  features: FeatureFlags
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

interface SplashConfig {
  backgroundColor: string
  logoSize: "small" | "medium" | "large"
  showLoadingIndicator: boolean
  tagline: string
  animationDuration: number
}

interface ThemeConfig {
  mode: "light" | "dark"
  primaryColor: string
  secondaryColor: string
  borderRadius: number
  fontFamily: string
}

interface NavConfig {
  mobileStyle: "bottom" | "drawer"
  webStyle: "rail" | "sidebar"
  items: NavItem[]
}

interface NavItem {
  id: string
  label: string
  icon: string
}

interface FeatureFlags {
  biometricAuth: boolean
  darkMode: boolean
  pushNotifications: boolean
  checkDeposit: boolean
  billPay: boolean
  p2pTransfers: boolean
}

interface AppTemplateManagerProps {
  cu: CreditUnionData
  onSelectTemplate?: (template: AppTemplate) => void
}

export function AppTemplateManager({ cu, onSelectTemplate }: AppTemplateManagerProps) {
  const [templates, setTemplates] = useState<AppTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<AppTemplate | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<AppTemplate | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<AppTemplate | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateDescription, setNewTemplateDescription] = useState("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Fetch templates
  useEffect(() => {
    fetchTemplates()
  }, [cu.id])

  async function fetchTemplates() {
    try {
      setLoading(true)
      const res = await fetch(`/api/app-templates?tenantId=${cu.id}`)
      const data = await res.json()
      
      if (data.templates) {
        setTemplates(data.templates)
        // Select default template if exists
        const defaultTemplate = data.templates.find((t: AppTemplate) => t.is_default)
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate)
          onSelectTemplate?.(defaultTemplate)
        }
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    } finally {
      setLoading(false)
    }
  }

  async function createTemplate() {
    if (!newTemplateName.trim()) return

    try {
      setCreating(true)
      const res = await fetch("/api/app-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: cu.id,
          name: newTemplateName,
          description: newTemplateDescription || null,
          isDefault: templates.length === 0,
        }),
      })

      const data = await res.json()
      
      if (data.template) {
        setTemplates([data.template, ...templates])
        setCreateDialogOpen(false)
        setNewTemplateName("")
        setNewTemplateDescription("")
        setSelectedTemplate(data.template)
        onSelectTemplate?.(data.template)
      }
    } catch (error) {
      console.error("Error creating template:", error)
    } finally {
      setCreating(false)
    }
  }

  async function updateTemplate(id: string, updates: Partial<AppTemplate>) {
    try {
      const res = await fetch(`/api/app-templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      const data = await res.json()
      
      if (data.template) {
        setTemplates(templates.map(t => t.id === id ? data.template : t))
        if (selectedTemplate?.id === id) {
          setSelectedTemplate(data.template)
          onSelectTemplate?.(data.template)
        }
        setEditingTemplate(null)
      }
    } catch (error) {
      console.error("Error updating template:", error)
    }
  }

  async function deleteTemplate(template: AppTemplate) {
    try {
      const res = await fetch(`/api/app-templates/${template.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setTemplates(templates.filter(t => t.id !== template.id))
        if (selectedTemplate?.id === template.id) {
          setSelectedTemplate(null)
        }
      }
    } catch (error) {
      console.error("Error deleting template:", error)
    } finally {
      setDeleteDialogOpen(false)
      setTemplateToDelete(null)
    }
  }

  async function uploadLogo(templateId: string, file: File) {
    try {
      setUploadingLogo(true)
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`/api/app-templates/${templateId}/logo`, {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      
      if (data.template) {
        setTemplates(templates.map(t => t.id === templateId ? data.template : t))
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(data.template)
          onSelectTemplate?.(data.template)
        }
      }
    } catch (error) {
      console.error("Error uploading logo:", error)
    } finally {
      setUploadingLogo(false)
    }
  }

  async function setAsDefault(template: AppTemplate) {
    await updateTemplate(template.id, { is_default: true })
  }

  async function duplicateTemplate(template: AppTemplate) {
    try {
      setCreating(true)
      const res = await fetch("/api/app-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: cu.id,
          name: `${template.name} (Copy)`,
          description: template.description,
        }),
      })

      const data = await res.json()
      
      if (data.template) {
        // Copy configurations
        await updateTemplate(data.template.id, {
          splash_config: template.splash_config,
          theme_config: template.theme_config,
          nav_config: template.nav_config,
          features: template.features,
        })
        
        await fetchTemplates()
      }
    } catch (error) {
      console.error("Error duplicating template:", error)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">App Templates</h2>
          <p className="text-sm text-muted-foreground">
            Manage mobile app configurations for {cu.displayName}
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Create a new app template for {cu.displayName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Main App, Beta Version"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe this template..."
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createTemplate} disabled={creating || !newTemplateName.trim()}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Smartphone className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-2">No Templates Yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Create your first app template to get started
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card 
              key={template.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selectedTemplate?.id === template.id && "ring-2 ring-primary"
              )}
              onClick={() => {
                setSelectedTemplate(template)
                onSelectTemplate?.(template)
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Logo */}
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-bold shrink-0 overflow-hidden"
                      style={{ backgroundColor: template.theme_config?.primaryColor || cu.primaryColor }}
                    >
                      {template.logo_url ? (
                        <img 
                          src={template.logo_url} 
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        template.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        {template.is_default && (
                          <Badge variant="secondary" className="text-[10px]">Default</Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs line-clamp-1">
                        {template.description || `Created ${new Date(template.created_at).toLocaleDateString()}`}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        setEditingTemplate(template)
                      }}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        duplicateTemplate(template)
                      }}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      {!template.is_default && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          setAsDefault(template)
                        }}>
                          <Star className="h-4 w-4 mr-2" />
                          Set as Default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setTemplateToDelete(template)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: template.theme_config?.primaryColor || "#3B82F6" }}
                  />
                  <span>{template.theme_config?.mode || "dark"} theme</span>
                  <span>•</span>
                  <span>{template.features?.biometricAuth ? "Biometric" : "PIN"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Template Dialog */}
      {editingTemplate && (
        <TemplateEditor
          template={editingTemplate}
          cu={cu}
          onSave={(updates) => updateTemplate(editingTemplate.id, updates)}
          onClose={() => setEditingTemplate(null)}
          onUploadLogo={(file) => uploadLogo(editingTemplate.id, file)}
          uploadingLogo={uploadingLogo}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => templateToDelete && deleteTemplate(templateToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Template Editor Component
interface TemplateEditorProps {
  template: AppTemplate
  cu: CreditUnionData
  onSave: (updates: Partial<AppTemplate>) => void
  onClose: () => void
  onUploadLogo: (file: File) => void
  uploadingLogo: boolean
}

function TemplateEditor({ template, cu, onSave, onClose, onUploadLogo, uploadingLogo }: TemplateEditorProps) {
  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description || "")
  const [themeConfig, setThemeConfig] = useState(template.theme_config)
  const [splashConfig, setSplashConfig] = useState(template.splash_config)
  const [features, setFeatures] = useState(template.features)
  const [saving, setSaving] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSave() {
    setSaving(true)
    await onSave({
      name,
      description: description || null,
      theme_config: themeConfig,
      splash_config: splashConfig,
      features,
    })
    setSaving(false)
    onClose()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onUploadLogo(file)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
          <DialogDescription>
            Configure {template.name} for {cu.displayName}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="splash">Splash</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this template..."
              />
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-xl font-bold overflow-hidden border"
                  style={{ backgroundColor: themeConfig.primaryColor }}
                >
                  {template.logo_url ? (
                    <img 
                      src={template.logo_url} 
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="w-full"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPEG, SVG, or WebP. Max 5MB.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Theme Tab */}
          <TabsContent value="theme" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Theme Mode</Label>
              <div className="flex gap-2">
                <Button
                  variant={themeConfig.mode === "light" ? "default" : "outline"}
                  onClick={() => setThemeConfig({ ...themeConfig, mode: "light" })}
                  className="flex-1"
                >
                  Light
                </Button>
                <Button
                  variant={themeConfig.mode === "dark" ? "default" : "outline"}
                  onClick={() => setThemeConfig({ ...themeConfig, mode: "dark" })}
                  className="flex-1"
                >
                  Dark
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={themeConfig.primaryColor}
                  onChange={(e) => setThemeConfig({ ...themeConfig, primaryColor: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={themeConfig.primaryColor}
                  onChange={(e) => setThemeConfig({ ...themeConfig, primaryColor: e.target.value })}
                  placeholder="#3B82F6"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={themeConfig.secondaryColor}
                  onChange={(e) => setThemeConfig({ ...themeConfig, secondaryColor: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={themeConfig.secondaryColor}
                  onChange={(e) => setThemeConfig({ ...themeConfig, secondaryColor: e.target.value })}
                  placeholder="#10B981"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Border Radius: {themeConfig.borderRadius}px</Label>
              <Slider
                value={[themeConfig.borderRadius]}
                onValueChange={([value]) => setThemeConfig({ ...themeConfig, borderRadius: value })}
                min={0}
                max={24}
                step={2}
              />
            </div>
          </TabsContent>

          {/* Splash Tab */}
          <TabsContent value="splash" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Background Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={splashConfig.backgroundColor}
                  onChange={(e) => setSplashConfig({ ...splashConfig, backgroundColor: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={splashConfig.backgroundColor}
                  onChange={(e) => setSplashConfig({ ...splashConfig, backgroundColor: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input
                value={splashConfig.tagline}
                onChange={(e) => setSplashConfig({ ...splashConfig, tagline: e.target.value })}
                placeholder="Mobile Banking"
              />
            </div>
            <div className="space-y-2">
              <Label>Animation Duration: {splashConfig.animationDuration}ms</Label>
              <Slider
                value={[splashConfig.animationDuration]}
                onValueChange={([value]) => setSplashConfig({ ...splashConfig, animationDuration: value })}
                min={1000}
                max={5000}
                step={250}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Loading Indicator</Label>
              <Switch
                checked={splashConfig.showLoadingIndicator}
                onCheckedChange={(checked) => setSplashConfig({ ...splashConfig, showLoadingIndicator: checked })}
              />
            </div>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-4 mt-4">
            <div className="space-y-3">
              {[
                { key: "biometricAuth", label: "Biometric Authentication", description: "Face ID / Touch ID support" },
                { key: "darkMode", label: "Dark Mode", description: "Allow users to switch themes" },
                { key: "pushNotifications", label: "Push Notifications", description: "Transaction alerts and updates" },
                { key: "checkDeposit", label: "Mobile Check Deposit", description: "Deposit checks via camera" },
                { key: "billPay", label: "Bill Pay", description: "Pay bills directly from the app" },
                { key: "p2pTransfers", label: "P2P Transfers", description: "Send money to other members" },
              ].map((feature) => (
                <div key={feature.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-sm">{feature.label}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                  <Switch
                    checked={features[feature.key as keyof FeatureFlags]}
                    onCheckedChange={(checked) => setFeatures({ ...features, [feature.key]: checked })}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AppTemplateManager

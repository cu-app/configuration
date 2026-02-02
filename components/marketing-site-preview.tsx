"use client"

import { useState, useEffect, useId } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Globe2, ExternalLink, Edit, Eye, Loader2, RefreshCw, Settings } from "lucide-react"
import type { CreditUnionData } from "@/lib/credit-union-data"
import { createClient } from "@/lib/supabase/client"

interface MarketingSitePreviewProps {
  cu: CreditUnionData
}

export function MarketingSitePreview({ cu }: MarketingSitePreviewProps) {
  const heroTitleId = useId()
  const heroSubtitleId = useId()
  const [marketingConfig, setMarketingConfig] = useState<{
    enabled?: boolean
    site_url?: string
    homepage?: {
      hero?: {
        title?: string
        subtitle?: string
        ctaText?: string
        ctaLink?: string
        backgroundImage?: string
      }
      ogImage?: string
      pageTitle?: string
      pageDescription?: string
    }
    pages?: unknown[]
    media_library?: unknown[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [siteUrl, setSiteUrl] = useState<string>("")
  const [iframeKey, setIframeKey] = useState(0)

  useEffect(() => {
    async function loadMarketingConfig() {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('cu_configs')
          .select('config')
          .eq('tenant_id', cu.id)
          .single()

        if (data?.config?.marketing) {
          setMarketingConfig(data.config.marketing)
          // Generate site URL
          const url = data.config.marketing.site_url || 
                     `https://${cu.id}.cuapp.com` ||
                     `https://${cu.id.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.marketing.cuapp.com`
          setSiteUrl(url)
        } else {
          // Default marketing config
          setMarketingConfig({
            enabled: true,
            site_url: `https://${cu.id}.cuapp.com`,
            homepage: {
              hero: {
                title: `Welcome to ${cu.displayName}`,
                subtitle: "Member-focused financial services built for your success",
                ctaText: "Get Started Today",
                ctaLink: "/enrollment",
                backgroundImage: "",
              },
              pageTitle: `${cu.displayName} - Your Credit Union`,
              pageDescription: `Experience exceptional financial solutions with ${cu.displayName}`,
            },
            pages: [],
            media_library: [],
          })
          setSiteUrl(`https://${cu.id}.cuapp.com`)
        }
      } catch (error) {
        console.warn('Could not load marketing config:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMarketingConfig()
  }, [cu.id, cu.displayName])

  // Determine marketing site URL with proper fallback
  const marketingSiteUrl = siteUrl || 
                           process.env.NEXT_PUBLIC_MARKETING_BASE_URL || 
                           `https://${cu.id}.cuapp.com` ||
                           "http://localhost:3001"

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-muted/30 to-background">
      <div className="border-b bg-card p-4 shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Marketing Website</h2>
              <Badge variant="secondary" className="ml-2">CMS</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Edit and preview your credit union's marketing website. Changes publish instantly.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Navigate to Configuration → Marketing tier
                window.location.href = '/?view=config&tier=marketing'
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit Content
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIframeKey(prev => prev + 1)
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {siteUrl && (
              <Button
                variant="default"
                size="sm"
                onClick={() => window.open(siteUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Site
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="preview" className="h-full flex flex-col">
          <div className="border-b px-4 shrink-0">
            <TabsList>
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="h-4 w-4" />
                Live Preview
              </TabsTrigger>
              <TabsTrigger value="editor" className="gap-2">
                <Edit className="h-4 w-4" />
                Content Editor
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="preview" className="flex-1 m-0 p-0 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading marketing site...</p>
                </div>
              </div>
            ) : (
              <div className="h-full relative">
                <iframe
                  key={iframeKey}
                  src={`${marketingSiteUrl}?tenantId=${encodeURIComponent(cu.id)}&preview=true&cuName=${encodeURIComponent(cu.displayName)}`}
                  className="w-full h-full border-0"
                  title={`${cu.displayName} Marketing Site Preview`}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                  allow="clipboard-read; clipboard-write"
                />
                <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border rounded-lg p-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>Live Preview</span>
                  </div>
                  <div className="text-muted-foreground mt-1">
                    {siteUrl || marketingSiteUrl}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="editor" className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Edit</CardTitle>
                  <CardDescription>
                    Edit your marketing site content. Changes are saved automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {marketingConfig && (
                    <>
                      <div className="space-y-2">
                        <label htmlFor={heroTitleId} className="text-sm font-medium">Hero Title</label>
                        <input
                          id={heroTitleId}
                          type="text"
                          value={marketingConfig.homepage?.hero?.title || ""}
                          onChange={(e) => {
                            setMarketingConfig({
                              ...marketingConfig,
                              homepage: {
                                ...marketingConfig.homepage,
                                hero: {
                                  ...marketingConfig.homepage?.hero,
                                  title: e.target.value,
                                },
                              },
                            })
                          }}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor={heroSubtitleId} className="text-sm font-medium">Hero Subtitle</label>
                        <textarea
                          id={heroSubtitleId}
                          value={marketingConfig.homepage?.hero?.subtitle || ""}
                          onChange={(e) => {
                            setMarketingConfig({
                              ...marketingConfig,
                              homepage: {
                                ...marketingConfig.homepage,
                                hero: {
                                  ...marketingConfig.homepage?.hero,
                                  subtitle: e.target.value,
                                },
                              },
                            })
                          }}
                          rows={3}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={async () => {
                            // Save to config
                            try {
                              const supabase = createClient()
                              const { data: existing } = await supabase
                                .from('cu_configs')
                                .select('config')
                                .eq('tenant_id', cu.id)
                                .single()

                              const updatedConfig = {
                                ...existing?.config,
                                marketing: marketingConfig,
                              }

                              await supabase
                                .from('cu_configs')
                                .update({ config: updatedConfig })
                                .eq('tenant_id', cu.id)

                              // Also save to marketing CMS
                              try {
                                await fetch('/api/marketing/homepage', {
                                  method: 'PUT',
                                  headers: { 
                                    'Content-Type': 'application/json',
                                    'X-Tenant-ID': cu.id,
                                  },
                                  body: JSON.stringify({
                                    ...marketingConfig.homepage,
                                    tenantId: cu.id,
                                  }),
                                })
                              } catch (error) {
                                console.warn('Could not sync to marketing CMS:', error)
                                // Continue - config is saved
                              }

                              setIframeKey(prev => prev + 1) // Refresh preview
                              
                              // Show success message
                              alert('Marketing content saved successfully!')
                            } catch (error) {
                              console.error('Failed to save:', error)
                            }
                          }}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Site Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Site URL:</span>
                    <span className="font-mono">{siteUrl || marketingSiteUrl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="secondary">Published</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pages:</span>
                    <span>{marketingConfig?.pages?.length || 0} pages</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Media Library:</span>
                    <span>{marketingConfig?.media_library?.length || 0} items</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AppBuilderStudio } from "@/components/app-builder-studio"
import { AppTemplateManager } from "@/components/app-template-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CreditUnionData } from "@/lib/credit-union-data"

export default function AppStudioPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const tenantId = params.tenantId as string
  
  const [cu, setCu] = useState<CreditUnionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Get mode from URL (full, preview, design-system, templates)
  const mode = searchParams.get("mode") || "full"
  
  // Load credit union data
  useEffect(() => {
    async function loadCreditUnion() {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch CU data from API or Supabase
        const response = await fetch(`/api/credit-unions/${tenantId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Credit union "${tenantId}" not found`)
          }
          throw new Error("Failed to load credit union data")
        }
        
        const data = await response.json()
        setCu(data)
      } catch (err) {
        console.error("Error loading CU:", err)
        
        // Fallback: Create minimal CU data for demo
        const fallbackCu: CreditUnionData = {
          id: tenantId,
          charter: tenantId,
          displayName: formatTenantName(tenantId),
          city: "Unknown",
          state: "FL",
          status: "active",
          primaryColor: "#003366",
          secondaryColor: "#0066CC",
          tier: 1,
          segment: "Community",
          coreProvider: "Symitar",
        }
        setCu(fallbackCu)
      } finally {
        setLoading(false)
      }
    }
    
    if (tenantId) {
      loadCreditUnion()
    }
  }, [tenantId])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
          <p className="text-white/70">Loading App Studio...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !cu) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a] p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "Unable to load credit union data"}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Render based on mode
  if (mode === "preview") {
    return <AppBuilderStudio cu={cu} mode="preview" />
  }

  if (mode === "design-system") {
    return <AppBuilderStudio cu={cu} mode="design-system" />
  }

  if (mode === "templates") {
    return (
      <div className="min-h-screen bg-background p-6">
        <AppTemplateManager cu={cu} />
      </div>
    )
  }

  // Full mode - tabbed interface with all features
  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      {/* Header with tabs */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-4">
          <Tabs defaultValue="studio" className="w-full">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: cu.primaryColor }}
                >
                  {cu.displayName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-white font-semibold text-sm">{cu.displayName}</h1>
                  <p className="text-white/50 text-xs">App Builder Studio</p>
                </div>
              </div>
              
              <TabsList className="bg-white/5">
                <TabsTrigger value="studio" className="text-xs">
                  Live Studio
                </TabsTrigger>
                <TabsTrigger value="templates" className="text-xs">
                  Templates
                </TabsTrigger>
              </TabsList>
            </div>
          
            <TabsContent value="studio" className="mt-0 -mx-4">
              <div className="h-[calc(100vh-60px)]">
                <AppBuilderStudio cu={cu} mode="full" />
              </div>
            </TabsContent>

            <TabsContent value="templates" className="mt-0 -mx-4">
              <div className="h-[calc(100vh-60px)] overflow-auto bg-background">
                <div className="max-w-screen-xl mx-auto p-6">
                  <AppTemplateManager cu={cu} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// Helper function to format tenant ID into display name
function formatTenantName(tenantId: string): string {
  return tenantId
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

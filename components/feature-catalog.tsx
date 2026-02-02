"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  FEATURE_CATALOG,
  FEATURE_BUNDLES,
  getFeaturesByCategory,
  getTotalLinesOfCode,
} from "@/lib/feature-catalog"
import { Package, Download, Code } from "lucide-react"

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  core: Package,
  payments: Package,
  cards: Package,
  loans: Package,
  membership: Package,
  security: Package,
  analytics: Package,
  compliance: Package,
  integrations: Package,
}

interface FeatureCatalogProps {
  cuId: string
  cuName?: string
  cuPrefix?: string
}

export function FeatureCatalog({ cuId, cuName, cuPrefix }: FeatureCatalogProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set())
  const [selectedBundles, setSelectedBundles] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const toggleFeature = (featureId: string) => {
    const next = new Set(selectedFeatures)
    if (next.has(featureId)) next.delete(featureId)
    else next.add(featureId)
    setSelectedFeatures(next)
  }

  const toggleBundle = (bundleId: string) => {
    const bundle = FEATURE_BUNDLES.find((b) => b.id === bundleId)
    if (!bundle) return
    const nextBundles = new Set(selectedBundles)
    const nextFeatures = new Set(selectedFeatures)
    if (nextBundles.has(bundleId)) {
      nextBundles.delete(bundleId)
      bundle.features.forEach((fid) => nextFeatures.delete(fid))
    } else {
      nextBundles.add(bundleId)
      bundle.features.forEach((fid) => nextFeatures.add(fid))
    }
    setSelectedBundles(nextBundles)
    setSelectedFeatures(nextFeatures)
  }

  const handleClone = async () => {
    if (selectedFeatures.size === 0) {
      alert("Select at least one feature.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/features/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cuId,
          features: Array.from(selectedFeatures),
          bundles: Array.from(selectedBundles),
          licenseType: "production",
        }),
      })
      const data = await res.json()
      if (data.success) {
        const blob = new Blob([data.cloneScript], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `feature-clone-${cuId}.sh`
        a.click()
        URL.revokeObjectURL(url)
        alert(`Package prepared. Package ID: ${data.manifest.packageId}\n\nClone script downloaded.`)
      } else {
        alert(data.error ?? "Failed to create package")
      }
    } catch (e) {
      console.error(e)
      alert("Failed to create clone package")
    } finally {
      setLoading(false)
    }
  }

  const byCategory = getFeaturesByCategory()
  const totalLOC = getTotalLinesOfCode(Array.from(selectedFeatures))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feature Catalog</h2>
          <p className="text-muted-foreground">
            Select features and generate a package with clone script and config.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Selected</div>
            <div className="text-2xl font-bold">{selectedFeatures.size} features</div>
            <div className="text-xs text-muted-foreground">{totalLOC.toLocaleString()} LOC</div>
          </div>
          <Button onClick={handleClone} disabled={loading || selectedFeatures.size === 0} size="lg">
            <Download className="h-4 w-4 mr-2" />
            {loading ? "Preparing…" : "Clone selected"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="features" className="space-y-4">
        <TabsList>
          <TabsTrigger value="features">Features ({FEATURE_CATALOG.length})</TabsTrigger>
          <TabsTrigger value="bundles">Bundles ({FEATURE_BUNDLES.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-4">
          {FEATURE_CATALOG.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No features in catalog. Add entries to <code className="text-xs">lib/feature-catalog.ts</code>.
              </CardContent>
            </Card>
          ) : (
            Object.entries(byCategory).map(([category, features]) => {
              const Icon = CATEGORY_ICONS[category] ?? Package
              return (
                <Card key={category}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <CardTitle className="capitalize">{category}</CardTitle>
                      <Badge variant="secondary">{features.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {features.map((feature) => (
                      <button
                        key={feature.id}
                        type="button"
                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 w-full text-left cursor-pointer"
                        onClick={() => toggleFeature(feature.id)}
                      >
                        <Checkbox
                          checked={selectedFeatures.has(feature.id)}
                          onCheckedChange={() => toggleFeature(feature.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{feature.name}</h4>
                            <Badge variant="secondary">{feature.complexity}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>
                              <Code className="h-3 w-3 inline mr-1" />
                              {feature.estimatedLinesOfCode.toLocaleString()} LOC
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="bundles" className="space-y-4">
          {FEATURE_BUNDLES.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No bundles defined.
              </CardContent>
            </Card>
          ) : (
            FEATURE_BUNDLES.map((bundle) => (
              <Card key={bundle.id}>
                <CardHeader>
                  <CardTitle>{bundle.name}</CardTitle>
                  <CardDescription>{bundle.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedBundles.has(bundle.id)}
                      onCheckedChange={() => toggleBundle(bundle.id)}
                    />
                    <span className="font-medium">Select bundle</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Includes {bundle.features.length} features.
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Feature Catalog
 *
 * Generic catalog of purchasable features. No proprietary data.
 * Features are keyed by id and map to config keys and optional code paths.
 */

export interface CatalogFeature {
  id: string
  name: string
  description: string
  category: "core" | "payments" | "cards" | "loans" | "membership" | "security" | "analytics" | "compliance" | "integrations"
  configKeys: string[]
  codePaths: {
    backend?: string[]
    frontend?: string[]
    mobile?: string[]
    database?: string[]
    infrastructure?: string[]
  }
  estimatedLinesOfCode: number
  complexity: "simple" | "medium" | "complex" | "enterprise"
  status: "available" | "beta" | "coming-soon" | "deprecated"
}

/** Catalog entries – add non‑proprietary features here. */
export const FEATURE_CATALOG: CatalogFeature[] = []

export function getFeatureById(id: string): CatalogFeature | undefined {
  return FEATURE_CATALOG.find((f) => f.id === id)
}

export function getFeaturesByCategory(): Record<string, CatalogFeature[]> {
  const byCategory: Record<string, CatalogFeature[]> = {}
  for (const f of FEATURE_CATALOG) {
    if (!byCategory[f.category]) byCategory[f.category] = []
    byCategory[f.category].push(f)
  }
  return byCategory
}

export function getTotalLinesOfCode(featureIds: string[]): number {
  return featureIds.reduce((sum, id) => {
    const f = getFeatureById(id)
    return sum + (f?.estimatedLinesOfCode ?? 0)
  }, 0)
}

export interface FeatureBundle {
  id: string
  name: string
  description: string
  features: string[]
}

export const FEATURE_BUNDLES: FeatureBundle[] = []

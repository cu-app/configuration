/**
 * Feature Packaging
 *
 * Builds package manifests and clone scripts for selected features.
 * Source path comes from env FEATURE_SOURCE_PATH when generating scripts.
 */

import { getFeatureById, type CatalogFeature } from "./feature-catalog"
import type { BrandingReplacement } from "./branding-replacer"
import { generateBrandingReplaceScript, generateReplacementReport } from "./branding-replacer"

export interface PackageManifest {
  packageId: string
  cuId: string
  packageName: string
  features: string[]
  bundles: string[]
  totalLinesOfCode: number
  totalSizeBytes: number
  createdAt: string
  expiresAt?: string
  licenseKey: string
  downloadUrl?: string
  gitRepositoryUrl?: string
  accessToken?: string
}

export interface CloneRequest {
  cuId: string
  features: string[]
  bundles?: string[]
  targetRepository?: string
  licenseType: "trial" | "production" | "development"
  cuConfig?: {
    tenant?: { name: string; domain?: string }
    poweron?: { prefix: string }
  }
}

export function generatePackageManifest(request: CloneRequest): PackageManifest {
  const packageId = `pkg_${request.cuId}_${Date.now()}`
  const licenseKey = generateLicenseKey(request.cuId, request.features)
  const totalLinesOfCode = request.features.reduce((total, id) => {
    const f = getFeatureById(id)
    return total + (f?.estimatedLinesOfCode ?? 0)
  }, 0)
  const totalSizeBytes = totalLinesOfCode * 50

  return {
    packageId,
    cuId: request.cuId,
    packageName: `Feature package for ${request.cuId}`,
    features: request.features,
    bundles: request.bundles ?? [],
    totalLinesOfCode,
    totalSizeBytes,
    createdAt: new Date().toISOString(),
    expiresAt:
      request.licenseType === "trial"
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
    licenseKey,
  }
}

function generateLicenseKey(cuId: string, features: string[]): string {
  const featureHash = features.sort().join(",").substring(0, 8)
  const cuHash = cuId.substring(0, 8)
  return `PKG-${cuHash}-${featureHash}-${Date.now().toString(36).toUpperCase()}`
}

export function getCodePathsForFeatures(featureIds: string[]): {
  backend: string[]
  frontend: string[]
  mobile: string[]
  database: string[]
  infrastructure: string[]
} {
  const paths = {
    backend: [] as string[],
    frontend: [] as string[],
    mobile: [] as string[],
    database: [] as string[],
    infrastructure: [] as string[],
  }
  featureIds.forEach((id) => {
    const f = getFeatureById(id)
    if (!f?.codePaths) return
    if (f.codePaths.backend) paths.backend.push(...f.codePaths.backend)
    if (f.codePaths.frontend) paths.frontend.push(...f.codePaths.frontend)
    if (f.codePaths.mobile) paths.mobile.push(...f.codePaths.mobile)
    if (f.codePaths.database) paths.database.push(...f.codePaths.database)
    if (f.codePaths.infrastructure) paths.infrastructure.push(...f.codePaths.infrastructure)
  })
  Object.keys(paths).forEach((k) => {
    const key = k as keyof typeof paths
    paths[key] = [...new Set(paths[key])]
  })
  return paths
}

/**
 * Generate clone script for selected features.
 * Uses FEATURE_SOURCE_PATH env for backend source root when set.
 */
export function generateCloneScript(
  manifest: PackageManifest,
  sourcePath: string = "",
  brandingReplacement?: BrandingReplacement
): string {
  const codePaths = getCodePathsForFeatures(manifest.features)
  const src = sourcePath || "${FEATURE_SOURCE_PATH:-.}"

  let script = `#!/bin/bash
# Feature package clone
# Package ID: ${manifest.packageId}
# License: ${manifest.licenseKey}
# Generated: ${manifest.createdAt}

set -e
DEST_DIR="./feature-clone-${manifest.cuId}"
SRC="${src}"
mkdir -p "$DEST_DIR"
cd "$DEST_DIR"

echo "Package: ${manifest.packageName}"
echo "Features: ${manifest.features.length}"
echo "LOC: ${manifest.totalLinesOfCode}"
echo ""
`

  if (codePaths.backend.length) {
    script += `echo "Backend paths:"\n`
    codePaths.backend.forEach((p) => {
      script += `mkdir -p "backend/${p}"\n`
      script += `cp -r "$SRC/${p}"/* "backend/${p}/" 2>/dev/null || echo "Path not found: ${p}"\n`
    })
  }
  if (codePaths.frontend.length) {
    script += `echo "Frontend paths:"\n`
    codePaths.frontend.forEach((p) => {
      script += `mkdir -p "frontend/${p}"\n`
      script += `cp -r "../${p}"/* "frontend/${p}/" 2>/dev/null || true\n`
    })
  }
  if (codePaths.mobile.length) {
    script += `echo "Mobile paths:"\n`
    codePaths.mobile.forEach((p) => {
      script += `mkdir -p "mobile/${p}"\n`
      script += `cp -r "../${p}"/* "mobile/${p}/" 2>/dev/null || true\n`
    })
  }

  script += `
cat > config.json <<EOF
${JSON.stringify(
  {
    packageId: manifest.packageId,
    licenseKey: manifest.licenseKey,
    features: manifest.features,
    totalLinesOfCode: manifest.totalLinesOfCode,
    createdAt: manifest.createdAt,
  },
  null,
  2
)}
EOF
echo "Done. Config: $DEST_DIR/config.json"
`

  if (brandingReplacement) {
    const brandingScript = generateBrandingReplaceScript(brandingReplacement, "$DEST_DIR")
    script += `
# Branding replacement
cat > "$DEST_DIR/replace-branding.sh" <<'BRANDING_EOF'
${brandingScript}
BRANDING_EOF
chmod +x "$DEST_DIR/replace-branding.sh"
"$DEST_DIR/replace-branding.sh"
`
  }
  return script
}

export async function createGitHubRepository(
  cuId: string,
  packageName: string,
  _features: string[]
): Promise<{ repositoryUrl: string; accessToken: string }> {
  const repoName = `feature-pkg-${cuId}-${Date.now()}`
  return {
    repositoryUrl: `https://github.com/cuapp/${repoName}.git`,
    accessToken: `ghp_${Math.random().toString(36).substring(2, 15)}`,
  }
}

export async function generateDownloadPackage(manifest: PackageManifest): Promise<{
  downloadUrl: string
  expiresAt: string
}> {
  return {
    downloadUrl: `/api/packages/${manifest.packageId}/download`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

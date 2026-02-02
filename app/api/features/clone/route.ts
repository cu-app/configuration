/**
 * Feature clone API
 *
 * Creates a package manifest and clone script for selected features.
 * Persists to feature_packages (create table if needed).
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  generatePackageManifest,
  generateCloneScript,
  getCodePathsForFeatures,
  createGitHubRepository,
  generateDownloadPackage,
} from "@/lib/feature-packaging"
import { getFeatureById } from "@/lib/feature-catalog"
import { generateBrandingReplacement } from "@/lib/branding-replacer"

const PACKAGES_TABLE = "feature_packages"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cuId, features, bundles = [], targetRepository, licenseType = "production" } = body

    if (!cuId || !features || !Array.isArray(features) || features.length === 0) {
      return NextResponse.json({ error: "cuId and non-empty features array required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: cuConfig, error: cuError } = await supabase
      .from("cu_configs")
      .select("tenant_id, config")
      .eq("tenant_id", cuId)
      .single()

    if (cuError || !cuConfig) {
      return NextResponse.json({ error: "Credit union not found" }, { status: 404 })
    }

    const brandingReplacement = cuConfig.config
      ? generateBrandingReplacement(cuConfig.config)
      : undefined

    const manifest = generatePackageManifest({
      cuId,
      features,
      bundles,
      targetRepository,
      licenseType,
      cuConfig: cuConfig.config,
    })

    const sourcePath = process.env.FEATURE_SOURCE_PATH ?? ""
    const cloneScript = generateCloneScript(manifest, sourcePath, brandingReplacement ?? undefined)
    const codePaths = getCodePathsForFeatures(features)

    let repositoryInfo: { repositoryUrl: string; accessToken: string } | null = null
    if (targetRepository) {
      try {
        repositoryInfo = await createGitHubRepository(cuId, manifest.packageName, features)
        manifest.gitRepositoryUrl = repositoryInfo.repositoryUrl
        manifest.accessToken = repositoryInfo.accessToken
      } catch (e) {
        console.warn("GitHub repo creation failed:", e)
      }
    }

    const downloadInfo = await generateDownloadPackage(manifest)
    manifest.downloadUrl = downloadInfo.downloadUrl

    const { error: saveError } = await supabase.from(PACKAGES_TABLE).insert({
      package_id: manifest.packageId,
      cu_id: cuId,
      manifest,
      features,
      license_key: manifest.licenseKey,
      license_type: licenseType,
      created_at: manifest.createdAt,
      expires_at: manifest.expiresAt ?? null,
    })

    if (saveError) {
      console.warn("Could not save package:", saveError)
    }

    const updatedConfig = {
      ...cuConfig.config,
      features: {
        ...cuConfig.config?.features,
        ...features.reduce(
          (acc: Record<string, unknown>, featureId: string) => {
            const feature = getFeatureById(featureId)
            feature?.configKeys?.forEach((key) => {
              const keys = key.split(".")
              let current = acc
              for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {}
                current = current[keys[i]] as Record<string, unknown>
              }
              current[keys[keys.length - 1]] = true
            })
            return acc
          },
          {}
        ),
      },
      feature_packages: {
        packages: [
          ...(cuConfig.config?.feature_packages?.packages ?? []),
          {
            packageId: manifest.packageId,
            licenseKey: manifest.licenseKey,
            features,
            purchasedAt: manifest.createdAt,
          },
        ],
      },
    }

    await supabase.from("cu_configs").update({ config: updatedConfig }).eq("tenant_id", cuId)

    return NextResponse.json({
      success: true,
      manifest,
      cloneScript,
      codePaths,
      repositoryInfo,
      downloadInfo,
      brandingReplacement: brandingReplacement
        ? { source: brandingReplacement.source, target: brandingReplacement.target }
        : undefined,
      message: `Package prepared with ${features.length} feature(s) (${manifest.totalLinesOfCode.toLocaleString()} LOC).`,
    })
  } catch (error) {
    console.error("[Feature Clone] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cuId = searchParams.get("cuId")
    const packageId = searchParams.get("packageId")
    const supabase = await createClient()

    if (packageId) {
      const { data, error } = await supabase
        .from(PACKAGES_TABLE)
        .select("*")
        .eq("package_id", packageId)
        .single()
      if (error || !data) {
        return NextResponse.json({ error: "Package not found" }, { status: 404 })
      }
      return NextResponse.json({ package: data })
    }

    if (cuId) {
      const { data, error } = await supabase
        .from(PACKAGES_TABLE)
        .select("*")
        .eq("cu_id", cuId)
        .order("created_at", { ascending: false })
      if (error) {
        return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 })
      }
      return NextResponse.json({ packages: data ?? [] })
    }

    return NextResponse.json({ error: "cuId or packageId required" }, { status: 400 })
  } catch (error) {
    console.error("[Feature Clone GET] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

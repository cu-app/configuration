// Discovers ALL logo formats from multiple sources with comprehensive fallback chain
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "edge"

interface LogoVariant {
  url: string
  format: string
  variant: string
  source: string
  width?: number
  height?: number
  quality_score: number
}

async function checkUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" })
    return response.ok
  } catch {
    return false
  }
}

async function detectImageFormat(url: string): Promise<string> {
  if (url.includes(".svg")) return "svg"
  if (url.includes(".png")) return "png"
  if (url.includes(".ico")) return "ico"
  if (url.includes(".jpg") || url.includes(".jpeg")) return "jpg"
  if (url.includes(".webp")) return "webp"
  return "png" // Default
}

export async function POST(request: Request) {
  const body = await request.json()
  const { creditUnionId, charter, name, website } = body

  if (!charter || !name) {
    return NextResponse.json({ error: "Missing charter or name" }, { status: 400 })
  }

  const supabase = await createClient()
  const discoveredLogos: LogoVariant[] = []

  // Extract domain from website
  let domain: string | null = null
  if (website) {
    try {
      domain = new URL(website.startsWith("http") ? website : `https://${website}`).hostname
    } catch {}
  }

  // Get CU ID if not provided
  let cuId = creditUnionId
  if (!cuId) {
    const { data: cu } = await supabase.from("credit_unions").select("id").eq("charter", charter).single()
    cuId = cu?.id
  }

  if (!cuId) {
    return NextResponse.json({ error: "Credit union not found" }, { status: 404 })
  }

  // 1. Brandfetch - Multiple formats
  if (domain) {
    const brandfetchFormats = [
      { suffix: "?format=svg", format: "svg", variant: "primary", quality: 0.95 },
      { suffix: "?format=png", format: "png", variant: "primary", quality: 0.9 },
      { suffix: "/w/400/h/400", format: "png", variant: "square", quality: 0.85 },
      { suffix: "/w/200/h/200", format: "png", variant: "icon", quality: 0.8 },
      { suffix: "/icon", format: "png", variant: "favicon", quality: 0.75 },
    ]

    for (const bf of brandfetchFormats) {
      const url = `https://cdn.brandfetch.io/${domain}${bf.suffix}`
      if (await checkUrl(url)) {
        discoveredLogos.push({
          url,
          format: bf.format,
          variant: bf.variant,
          source: "brandfetch",
          quality_score: bf.quality,
        })
      }
    }
  }

  // 2. Clearbit - High quality logo API
  if (domain) {
    const clearbitUrl = `https://logo.clearbit.com/${domain}`
    if (await checkUrl(clearbitUrl)) {
      discoveredLogos.push({
        url: clearbitUrl,
        format: "png",
        variant: "primary",
        source: "clearbit",
        quality_score: 0.88,
      })
    }

    // Clearbit also has size variants
    const sizes = [64, 128, 256, 512]
    for (const size of sizes) {
      const sizedUrl = `https://logo.clearbit.com/${domain}?size=${size}`
      if (await checkUrl(sizedUrl)) {
        discoveredLogos.push({
          url: sizedUrl,
          format: "png",
          variant: `${size}x${size}`,
          source: "clearbit",
          width: size,
          height: size,
          quality_score: 0.85 + size / 1000,
        })
      }
    }
  }

  // 3. Direct website favicon/logo discovery
  if (domain) {
    const directUrls = [
      { path: "/favicon.ico", format: "ico", variant: "favicon", quality: 0.5 },
      { path: "/favicon.png", format: "png", variant: "favicon", quality: 0.55 },
      { path: "/apple-touch-icon.png", format: "png", variant: "apple_touch", quality: 0.7 },
      { path: "/apple-touch-icon-precomposed.png", format: "png", variant: "apple_touch", quality: 0.7 },
      { path: "/logo.png", format: "png", variant: "primary", quality: 0.8 },
      { path: "/logo.svg", format: "svg", variant: "primary", quality: 0.9 },
      { path: "/images/logo.png", format: "png", variant: "primary", quality: 0.78 },
      { path: "/images/logo.svg", format: "svg", variant: "primary", quality: 0.88 },
      { path: "/assets/logo.png", format: "png", variant: "primary", quality: 0.78 },
      { path: "/assets/images/logo.png", format: "png", variant: "primary", quality: 0.78 },
      { path: "/img/logo.png", format: "png", variant: "primary", quality: 0.78 },
      { path: "/static/logo.png", format: "png", variant: "primary", quality: 0.78 },
    ]

    for (const du of directUrls) {
      const url = `https://${domain}${du.path}`
      if (await checkUrl(url)) {
        discoveredLogos.push({
          url,
          format: du.format,
          variant: du.variant,
          source: "website",
          quality_score: du.quality,
        })
      }
    }
  }

  // 4. Google Favicon service - Multiple sizes
  if (domain) {
    const googleSizes = [16, 32, 64, 128, 256]
    for (const size of googleSizes) {
      const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`
      discoveredLogos.push({
        url,
        format: "png",
        variant: `google_${size}`,
        source: "google",
        width: size,
        height: size,
        quality_score: 0.4 + size / 500,
      })
    }
  }

  // 5. DuckDuckGo favicon service
  if (domain) {
    const ddgUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`
    if (await checkUrl(ddgUrl)) {
      discoveredLogos.push({
        url: ddgUrl,
        format: "ico",
        variant: "favicon",
        source: "duckduckgo",
        quality_score: 0.45,
      })
    }
  }

  // Store all discovered logos in cu_logos table
  if (discoveredLogos.length > 0) {
    // First, remove old discoveries for this CU
    await supabase.from("cu_logos").delete().eq("credit_union_id", cuId)

    // Insert all new discoveries
    const logoRecords = discoveredLogos.map((logo, index) => ({
      credit_union_id: cuId,
      format: logo.format,
      variant: logo.variant,
      url: logo.url,
      source: logo.source,
      size_width: logo.width || null,
      size_height: logo.height || null,
      quality_score: logo.quality_score,
      is_primary: index === 0, // Best quality is primary
      verified: false,
    }))

    await supabase.from("cu_logos").insert(logoRecords)

    // Update main credit_unions table with best logo
    const bestLogo = discoveredLogos.sort((a, b) => b.quality_score - a.quality_score)[0]
    await supabase
      .from("credit_unions")
      .update({
        logo_url: bestLogo.url,
        logo_source: bestLogo.source,
        logo_discovered_at: new Date().toISOString(),
      })
      .eq("id", cuId)
  }

  return NextResponse.json({
    credit_union_id: cuId,
    logos_found: discoveredLogos.length,
    logos: discoveredLogos.sort((a, b) => b.quality_score - a.quality_score),
    best_logo: discoveredLogos.sort((a, b) => b.quality_score - a.quality_score)[0] || null,
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const charter = searchParams.get("charter")
  const name = searchParams.get("name")
  const website = searchParams.get("website")

  if (!charter || !name) {
    return NextResponse.json({ error: "Missing charter or name" }, { status: 400 })
  }

  // Redirect to POST for comprehensive discovery
  return POST(
    new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ charter, name, website }),
    }),
  )
}

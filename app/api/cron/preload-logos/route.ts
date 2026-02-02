// BATCH PRELOAD LOGOS FOR ALL 4,300+ CREDIT UNIONS
// Discovers and stores logos from multiple sources with quality scoring
// Run via: GET /api/cron/preload-logos?offset=0&limit=100

import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const BATCH_SIZE = 50 // Process 50 CUs per batch to avoid timeouts

// Logo sources with quality scores
const LOGO_SOURCES = {
  brandfetch: { quality: 0.95, name: "Brandfetch" },
  clearbit: { quality: 0.88, name: "Clearbit" },
  google: { quality: 0.65, name: "Google Favicon" },
  duckduckgo: { quality: 0.45, name: "DuckDuckGo" },
  direct: { quality: 0.80, name: "Direct Website" },
}

interface LogoResult {
  charter_number: number
  cu_name: string
  domain: string | null
  logo_url_primary: string | null
  logo_url_brandfetch: string | null
  logo_url_clearbit: string | null
  logo_url_google: string | null
  logo_url_duckduckgo: string | null
  logo_url_direct: string | null
  primary_color: string | null
  source: string | null
  quality_score: number
  status: "completed" | "failed"
  error_message: string | null
}

export async function GET(request: Request) {
  // Verify cron secret (allow bypass in development)
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get URL params for pagination
  const url = new URL(request.url)
  const offset = Number.parseInt(url.searchParams.get("offset") || "0")
  const limit = Number.parseInt(url.searchParams.get("limit") || String(BATCH_SIZE))
  const forceRefresh = url.searchParams.get("force") === "true"

  // Count total CUs that need logo processing
  const { count: totalCount } = await supabase
    .from("ncua_credit_unions")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  // Fetch batch of credit unions
  // If not force refresh, only get CUs without logos
  let query = supabase
    .from("ncua_credit_unions")
    .select("charter_number, cu_name, website, state, city")
    .eq("is_active", true)
    .order("total_assets", { ascending: false }) // Prioritize largest CUs
    .range(offset, offset + limit - 1)

  if (!forceRefresh) {
    query = query.is("logo_url", null)
  }

  const { data: creditUnions, error: fetchError } = await query

  if (fetchError || !creditUnions) {
    return NextResponse.json(
      { error: "Failed to fetch credit unions", details: fetchError },
      { status: 500 }
    )
  }

  // Process each credit union in parallel (with concurrency limit)
  const results: LogoResult[] = []
  const concurrencyLimit = 10

  for (let i = 0; i < creditUnions.length; i += concurrencyLimit) {
    const batch = creditUnions.slice(i, i + concurrencyLimit)
    const batchResults = await Promise.all(
      batch.map((cu) => discoverLogosForCU(cu))
    )
    results.push(...batchResults)
  }

  // Upsert results to cu_logos table
  const successfulResults = results.filter((r) => r.status === "completed")

  if (successfulResults.length > 0) {
    const { error: upsertError } = await supabase
      .from("cu_logos")
      .upsert(
        successfulResults.map((r) => ({
          charter_number: r.charter_number,
          cu_name: r.cu_name,
          domain: r.domain,
          logo_url_primary: r.logo_url_primary,
          logo_url_brandfetch: r.logo_url_brandfetch,
          logo_url_clearbit: r.logo_url_clearbit,
          logo_url_google: r.logo_url_google,
          logo_url_duckduckgo: r.logo_url_duckduckgo,
          logo_url_direct: r.logo_url_direct,
          primary_color: r.primary_color,
          source: r.source,
          quality_score: r.quality_score,
          status: r.status,
          error_message: r.error_message,
          discovered_at: new Date().toISOString(),
        })),
        { onConflict: "charter_number" }
      )

    if (upsertError) {
      console.error("Error upserting logos:", upsertError)
    }

    // Also update the main ncua_credit_unions table with best logo
    for (const result of successfulResults) {
      if (result.logo_url_primary) {
        await supabase
          .from("ncua_credit_unions")
          .update({
            logo_url: result.logo_url_primary,
            logo_source: result.source,
            primary_color: result.primary_color,
            logo_discovered_at: new Date().toISOString(),
          })
          .eq("charter_number", result.charter_number)
      }
    }
  }

  const completed = results.filter((r) => r.status === "completed").length
  const failed = results.filter((r) => r.status === "failed").length
  const hasMore = offset + limit < (totalCount || 0)

  return NextResponse.json({
    success: true,
    batch: {
      offset,
      limit,
      processed: creditUnions.length,
      completed,
      failed,
      with_logos: results.filter((r) => r.logo_url_primary).length,
    },
    total: totalCount,
    has_more: hasMore,
    next_offset: hasMore ? offset + limit : null,
    next_url: hasMore
      ? `/api/cron/preload-logos?offset=${offset + limit}&limit=${limit}${forceRefresh ? "&force=true" : ""}`
      : null,
    results: results.slice(0, 10), // Only return first 10 results
    timestamp: new Date().toISOString(),
  })
}

async function discoverLogosForCU(cu: {
  charter_number: number
  cu_name: string
  website: string | null
  state: string | null
  city: string | null
}): Promise<LogoResult> {
  const result: LogoResult = {
    charter_number: cu.charter_number,
    cu_name: cu.cu_name,
    domain: null,
    logo_url_primary: null,
    logo_url_brandfetch: null,
    logo_url_clearbit: null,
    logo_url_google: null,
    logo_url_duckduckgo: null,
    logo_url_direct: null,
    primary_color: null,
    source: null,
    quality_score: 0,
    status: "completed",
    error_message: null,
  }

  try {
    // Extract domain from website
    if (cu.website) {
      try {
        const websiteUrl = cu.website.startsWith("http")
          ? cu.website
          : `https://${cu.website}`
        const urlObj = new URL(websiteUrl)
        result.domain = urlObj.hostname.replace(/^www\./, "")
      } catch {
        // Try direct extraction
        result.domain = cu.website
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "")
          .split("/")[0]
      }
    }

    if (!result.domain) {
      result.status = "failed"
      result.error_message = "No valid domain found"
      return result
    }

    // Try all logo sources in parallel
    const [brandfetch, clearbit, google, duckduckgo] = await Promise.all([
      tryBrandfetch(result.domain),
      tryClearbit(result.domain),
      tryGoogleFavicon(result.domain),
      tryDuckDuckGo(result.domain),
    ])

    result.logo_url_brandfetch = brandfetch.url
    result.logo_url_clearbit = clearbit.url
    result.logo_url_google = google.url
    result.logo_url_duckduckgo = duckduckgo.url

    // Determine best logo by quality
    const logos = [
      { url: brandfetch.url, source: "brandfetch", quality: brandfetch.url ? LOGO_SOURCES.brandfetch.quality : 0 },
      { url: clearbit.url, source: "clearbit", quality: clearbit.url ? LOGO_SOURCES.clearbit.quality : 0 },
      { url: google.url, source: "google", quality: google.url ? LOGO_SOURCES.google.quality : 0 },
      { url: duckduckgo.url, source: "duckduckgo", quality: duckduckgo.url ? LOGO_SOURCES.duckduckgo.quality : 0 },
    ].filter((l) => l.url)

    if (logos.length > 0) {
      const best = logos.sort((a, b) => b.quality - a.quality)[0]
      result.logo_url_primary = best.url
      result.source = best.source
      result.quality_score = best.quality
    }

    // Generate a primary color based on CU name (fallback)
    if (!result.primary_color) {
      result.primary_color = generateColorFromName(cu.cu_name)
    }

  } catch (err) {
    result.status = "failed"
    result.error_message = err instanceof Error ? err.message : String(err)
  }

  return result
}

async function tryBrandfetch(domain: string): Promise<{ url: string | null }> {
  try {
    // Brandfetch CDN URL pattern
    const url = `https://cdn.brandfetch.io/${domain}/w/400/h/400`
    const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) })
    if (response.ok) {
      return { url }
    }
    // Try without size params
    const fallbackUrl = `https://cdn.brandfetch.io/${domain}`
    const fallbackResponse = await fetch(fallbackUrl, { method: "HEAD", signal: AbortSignal.timeout(5000) })
    return { url: fallbackResponse.ok ? fallbackUrl : null }
  } catch {
    return { url: null }
  }
}

async function tryClearbit(domain: string): Promise<{ url: string | null }> {
  try {
    const url = `https://logo.clearbit.com/${domain}?size=256`
    const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) })
    return { url: response.ok ? url : null }
  } catch {
    return { url: null }
  }
}

async function tryGoogleFavicon(domain: string): Promise<{ url: string | null }> {
  // Google Favicon API is generally reliable
  return { url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128` }
}

async function tryDuckDuckGo(domain: string): Promise<{ url: string | null }> {
  return { url: `https://icons.duckduckgo.com/ip3/${domain}.ico` }
}

function generateColorFromName(name: string): string {
  // Generate a consistent color based on the CU name
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Generate a professional-looking color (avoid too bright or too dark)
  const h = Math.abs(hash % 360)
  const s = 50 + (Math.abs(hash >> 8) % 30) // 50-80% saturation
  const l = 35 + (Math.abs(hash >> 16) % 20) // 35-55% lightness

  // Convert HSL to hex
  const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100
    l /= 100
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => {
      const k = (n + h / 30) % 12
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0")
    }
    return `#${f(0)}${f(8)}${f(4)}`
  }

  return hslToHex(h, s, l)
}

// POST endpoint to trigger batch processing for specific charters
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const body = await request.json()
    const { charter_numbers } = body as { charter_numbers: number[] }

    if (!charter_numbers || !Array.isArray(charter_numbers)) {
      return NextResponse.json(
        { error: "charter_numbers array required" },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch the specific credit unions
    const { data: creditUnions, error: fetchError } = await supabase
      .from("ncua_credit_unions")
      .select("charter_number, cu_name, website, state, city")
      .in("charter_number", charter_numbers)

    if (fetchError || !creditUnions) {
      return NextResponse.json(
        { error: "Failed to fetch credit unions", details: fetchError },
        { status: 500 }
      )
    }

    // Process each CU
    const results = await Promise.all(
      creditUnions.map((cu) => discoverLogosForCU(cu))
    )

    // Upsert to cu_logos
    const successfulResults = results.filter((r) => r.status === "completed")
    if (successfulResults.length > 0) {
      await supabase.from("cu_logos").upsert(
        successfulResults.map((r) => ({
          charter_number: r.charter_number,
          cu_name: r.cu_name,
          domain: r.domain,
          logo_url_primary: r.logo_url_primary,
          logo_url_brandfetch: r.logo_url_brandfetch,
          logo_url_clearbit: r.logo_url_clearbit,
          logo_url_google: r.logo_url_google,
          logo_url_duckduckgo: r.logo_url_duckduckgo,
          logo_url_direct: r.logo_url_direct,
          primary_color: r.primary_color,
          source: r.source,
          quality_score: r.quality_score,
          status: r.status,
          discovered_at: new Date().toISOString(),
        })),
        { onConflict: "charter_number" }
      )

      // Update main table
      for (const result of successfulResults) {
        if (result.logo_url_primary) {
          await supabase
            .from("ncua_credit_unions")
            .update({
              logo_url: result.logo_url_primary,
              logo_source: result.source,
              primary_color: result.primary_color,
              logo_discovered_at: new Date().toISOString(),
            })
            .eq("charter_number", result.charter_number)
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      completed: successfulResults.length,
      results,
    })
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to process request", details: String(err) },
      { status: 500 }
    )
  }
}

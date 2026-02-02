import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { creditUnionId, discoveryType } = await request.json()

  if (!creditUnionId) {
    return NextResponse.json({ error: "Credit union ID required" }, { status: 400 })
  }

  // Create discovery session
  const { data: session, error: sessionError } = await supabase
    .from("discovery_sessions")
    .insert({
      credit_union_id: creditUnionId,
      discovery_type: discoveryType || "all",
      status: "running",
      started_at: new Date().toISOString(),
      sources_queried: [],
    })
    .select()
    .single()

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 })
  }

  // Get credit union details
  const { data: cu } = await supabase.from("credit_unions").select("*").eq("id", creditUnionId).single()

  if (!cu) {
    return NextResponse.json({ error: "Credit union not found" }, { status: 404 })
  }

  // Start discovery in background (non-blocking)
  // In production, this would be a queue job
  startDiscoveryProcess(session.id, cu, discoveryType || "all")

  return NextResponse.json({
    sessionId: session.id,
    status: "running",
    message: `Discovery started for ${cu.name}`,
  })
}

async function startDiscoveryProcess(
  sessionId: string,
  cu: { id: string; name: string; website?: string; city?: string; state_id?: number },
  discoveryType: string,
) {
  const supabase = await createClient()
  const sourcesQueried: string[] = []
  let totalFound = 0

  try {
    // 1. Google Places API - Primary source for branches
    if (discoveryType === "all" || discoveryType === "branches") {
      const googleResults = await discoverFromGooglePlaces(cu)
      sourcesQueried.push("google_places")

      for (const branch of googleResults) {
        await supabase.from("discovered_items").insert({
          session_id: sessionId,
          credit_union_id: cu.id,
          item_type: "branch",
          data: branch.data,
          source: "google_places",
          source_url: branch.sourceUrl,
          confidence_score: branch.confidenceScore,
          confidence_reasoning: branch.confidenceReasoning,
        })
        totalFound++
      }

      // Update session progress
      await supabase
        .from("discovery_sessions")
        .update({
          sources_queried: sourcesQueried,
          items_found: totalFound,
        })
        .eq("id", sessionId)
    }

    // 2. Website scrape for branch locator
    if (discoveryType === "all" || discoveryType === "branches") {
      const websiteResults = await scrapeWebsiteBranchLocator(cu)
      sourcesQueried.push("website_scrape")

      for (const branch of websiteResults) {
        await supabase.from("discovered_items").insert({
          session_id: sessionId,
          credit_union_id: cu.id,
          item_type: "branch",
          data: branch.data,
          source: "website_scrape",
          source_url: branch.sourceUrl,
          confidence_score: branch.confidenceScore,
          confidence_reasoning: branch.confidenceReasoning,
        })
        totalFound++
      }

      await supabase
        .from("discovery_sessions")
        .update({
          sources_queried: sourcesQueried,
          items_found: totalFound,
        })
        .eq("id", sessionId)
    }

    // 3. Logo discovery
    if (discoveryType === "all" || discoveryType === "logos") {
      const logoResults = await discoverLogos(cu)
      sourcesQueried.push("clearbit", "brandfetch", "google_favicon")

      for (const logo of logoResults) {
        await supabase.from("discovered_items").insert({
          session_id: sessionId,
          credit_union_id: cu.id,
          item_type: "logo",
          data: logo.data,
          source: logo.source,
          source_url: logo.sourceUrl,
          confidence_score: logo.confidenceScore,
          confidence_reasoning: logo.confidenceReasoning,
        })
        totalFound++
      }
    }

    // Mark session complete
    await supabase
      .from("discovery_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        sources_queried: sourcesQueried,
        items_found: totalFound,
      })
      .eq("id", sessionId)
  } catch (error) {
    await supabase
      .from("discovery_sessions")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
  }
}

async function discoverFromGooglePlaces(cu: { name: string; city?: string }) {
  // In production, this would use actual Google Places API
  // For now, we simulate the discovery process
  const results: Array<{ data: unknown; source: string; sourceUrl: string; confidenceScore: number; confidenceReasoning: string }> = []

  // Google Places Text Search would find all "{CU Name}" locations
  // Navy Federal has 350+ branches - this would find them all
  const searchQuery = `${cu.name} credit union`

  // Simulated - in production this calls Google Places API
  console.log(`[Discovery] Searching Google Places for: ${searchQuery}`)

  return results
}

async function scrapeWebsiteBranchLocator(cu: { name: string; website?: string }) {
  const results: Array<{ data: unknown; source: string; sourceUrl: string; confidenceScore: number; confidenceReasoning: string }> = []

  if (!cu.website) return results

  // In production, this would:
  // 1. Find the branch locator page (/locations, /branches, /atm-locator)
  // 2. Parse the embedded JSON/API calls
  // 3. Extract all branch data

  console.log(`[Discovery] Scraping branch locator: ${cu.website}`)

  return results
}

async function discoverLogos(cu: { name: string; website?: string }) {
  const results: Array<{ data: unknown; source: string; sourceUrl: string; confidenceScore: number; confidenceReasoning: string }> = []
  const domain = cu.website?.replace(/^https?:\/\//, "").replace(/\/$/, "")

  if (domain) {
    // Clearbit Logo API
    results.push({
      data: { url: `https://logo.clearbit.com/${domain}`, format: "png", size: "medium" },
      source: "clearbit",
      sourceUrl: `https://clearbit.com/logo?domain=${domain}`,
      confidenceScore: 85,
      confidenceReasoning: "Clearbit logo API - high reliability for corporate logos",
    })

    // Brandfetch
    results.push({
      data: { url: `https://api.brandfetch.io/v2/brands/${domain}`, format: "svg" },
      source: "brandfetch",
      sourceUrl: `https://brandfetch.com/brand/${domain}`,
      confidenceScore: 82,
      confidenceReasoning: "Brandfetch API - curated brand assets",
    })

    // Google Favicon
    results.push({
      data: { url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`, format: "ico", size: "small" },
      source: "google_favicon",
      sourceUrl: domain,
      confidenceScore: 60,
      confidenceReasoning: "Google Favicon API - fallback option, may be low resolution",
    })
  }

  return results
}

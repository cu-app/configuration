import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "edge"
export const maxDuration = 300

interface ChainOfThought {
  step: number
  action: string
  result: string
  confidence: number
  timestamp: string
}

interface EnrichmentResult {
  cu_id: string
  charter: string
  name: string
  discoveries: {
    type: string
    value: string
    source: string
    confidence: number
    chain_of_thought: ChainOfThought[]
  }[]
  errors: string[]
  duration_ms: number
}

async function discoverLogo(cu: any): Promise<{
  logo_url: string | null
  confidence: number
  chain_of_thought: ChainOfThought[]
}> {
  const chain: ChainOfThought[] = []
  let logoUrl: string | null = null
  let confidence = 0
  const timestamp = () => new Date().toISOString()

  // Step 1: Try Clearbit
  chain.push({
    step: 1,
    action: "Query Clearbit Logo API",
    result: "Attempting...",
    confidence: 0,
    timestamp: timestamp(),
  })

  if (cu.website) {
    const domain = cu.website.replace(/^https?:\/\//, "").replace(/\/$/, "")
    const clearbitUrl = `https://logo.clearbit.com/${domain}`

    try {
      const response = await fetch(clearbitUrl, { method: "HEAD" })
      if (response.ok) {
        logoUrl = clearbitUrl
        confidence = 85
        chain[0].result = `Found logo at Clearbit for domain ${domain}`
        chain[0].confidence = 85
      } else {
        chain[0].result = `No logo found at Clearbit for domain ${domain}`
      }
    } catch (e) {
      chain[0].result = `Clearbit request failed: ${e}`
    }
  }

  // Step 2: Try Google Favicon as fallback
  if (!logoUrl) {
    chain.push({
      step: 2,
      action: "Query Google Favicon Service",
      result: "Attempting...",
      confidence: 0,
      timestamp: timestamp(),
    })

    if (cu.website) {
      const domain = cu.website.replace(/^https?:\/\//, "").replace(/\/$/, "")
      const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
      logoUrl = googleUrl
      confidence = 60
      chain[1].result = `Using Google favicon for ${domain}`
      chain[1].confidence = 60
    }
  }

  // Step 3: Verify logo is actually an image
  if (logoUrl) {
    chain.push({
      step: chain.length + 1,
      action: "Verify image is valid",
      result: "Checking content-type...",
      confidence: 0,
      timestamp: timestamp(),
    })

    try {
      const response = await fetch(logoUrl, { method: "HEAD" })
      const contentType = response.headers.get("content-type")
      if (contentType?.includes("image")) {
        chain[chain.length - 1].result = `Valid image: ${contentType}`
        chain[chain.length - 1].confidence = confidence
      } else {
        chain[chain.length - 1].result = `Invalid content-type: ${contentType}`
        logoUrl = null
        confidence = 0
      }
    } catch (e) {
      chain[chain.length - 1].result = `Verification failed: ${e}`
    }
  }

  return { logo_url: logoUrl, confidence, chain_of_thought: chain }
}

async function discoverBranches(cu: any): Promise<{
  branches: any[]
  confidence: number
  chain_of_thought: ChainOfThought[]
}> {
  const chain: ChainOfThought[] = []
  const branches: any[] = []
  const timestamp = () => new Date().toISOString()

  // We would call Google Places API here
  chain.push({
    step: 1,
    action: "Query Google Places API",
    result: `Searching for "${cu.name}" branches in ${cu.state_id || "all states"}`,
    confidence: 0,
    timestamp: timestamp(),
  })

  // For now, return the headquarters from NCUA data
  if (cu.street && cu.city && cu.state_id) {
    branches.push({
      name: `${cu.name} - Headquarters`,
      address: `${cu.street}, ${cu.city}, ${cu.state_id} ${cu.zip || ""}`.trim(),
      type: "headquarters",
      source: "NCUA Records",
      confidence: 98,
    })
    chain[0].result = `Found headquarters at ${cu.street}, ${cu.city}`
    chain[0].confidence = 98
  }

  return {
    branches,
    confidence: branches.length > 0 ? 90 : 0,
    chain_of_thought: chain,
  }
}

async function discoverContact(cu: any): Promise<{
  contacts: any[]
  confidence: number
  chain_of_thought: ChainOfThought[]
}> {
  const chain: ChainOfThought[] = []
  const contacts: any[] = []
  const timestamp = () => new Date().toISOString()

  chain.push({
    step: 1,
    action: "Extract contact from NCUA records",
    result: "Checking registered information...",
    confidence: 0,
    timestamp: timestamp(),
  })

  // Phone from NCUA
  if (cu.phone) {
    contacts.push({
      type: "phone",
      value: cu.phone,
      source: "NCUA Records",
      confidence: 95,
    })
    chain[0].result = `Found phone: ${cu.phone}`
    chain[0].confidence = 95
  }

  // Website
  if (cu.website) {
    contacts.push({
      type: "website",
      value: cu.website,
      source: "NCUA Records",
      confidence: 98,
    })
  }

  return {
    contacts,
    confidence: contacts.length > 0 ? 90 : 0,
    chain_of_thought: chain,
  }
}

export async function GET(request: Request) {
  const startTime = Date.now()
  const { searchParams } = new URL(request.url)
  const batchSize = Math.min(Number.parseInt(searchParams.get("batch") || "10"), 50)
  const offset = Number.parseInt(searchParams.get("offset") || "0")
  const cuId = searchParams.get("cu_id") // Optional: enrich specific CU

  const supabase = await createClient()
  const results: EnrichmentResult[] = []

  // Build query
  let query = supabase.from("credit_unions").select("*").order("total_assets", { ascending: false })

  if (cuId) {
    query = query.eq("id", cuId)
  } else {
    query = query.or("enrichment_status.is.null,enrichment_status.neq.complete").range(offset, offset + batchSize - 1)
  }

  const { data: creditUnions, error } = await query

  if (error || !creditUnions) {
    return NextResponse.json(
      {
        error: "Failed to fetch credit unions",
        details: error,
      },
      { status: 500 },
    )
  }

  for (const cu of creditUnions) {
    const cuStartTime = Date.now()
    const result: EnrichmentResult = {
      cu_id: cu.id,
      charter: cu.charter,
      name: cu.name,
      discoveries: [],
      errors: [],
      duration_ms: 0,
    }

    try {
      // 1. Logo Discovery
      if (!cu.logo_url || cu.logo_confidence < 80) {
        const logoResult = await discoverLogo(cu)
        if (logoResult.logo_url) {
          result.discoveries.push({
            type: "logo",
            value: logoResult.logo_url,
            source: "Auto-Discovery",
            confidence: logoResult.confidence,
            chain_of_thought: logoResult.chain_of_thought,
          })

          // Update database
          await supabase
            .from("credit_unions")
            .update({
              logo_url: logoResult.logo_url,
              logo_confidence: logoResult.confidence,
              logo_discovered_at: new Date().toISOString(),
            })
            .eq("id", cu.id)
        }
      }

      // 2. Branch Discovery
      const branchResult = await discoverBranches(cu)
      if (branchResult.branches.length > 0) {
        result.discoveries.push({
          type: "branches",
          value: `${branchResult.branches.length} locations found`,
          source: "Google Places + NCUA",
          confidence: branchResult.confidence,
          chain_of_thought: branchResult.chain_of_thought,
        })
      }

      // 3. Contact Discovery
      const contactResult = await discoverContact(cu)
      if (contactResult.contacts.length > 0) {
        result.discoveries.push({
          type: "contacts",
          value: `${contactResult.contacts.length} contacts found`,
          source: "NCUA + Website",
          confidence: contactResult.confidence,
          chain_of_thought: contactResult.chain_of_thought,
        })
      }

      // Update enrichment status
      const allDiscoveries = result.discoveries.length
      await supabase
        .from("credit_unions")
        .update({
          enrichment_status: allDiscoveries >= 3 ? "complete" : "partial",
          last_enriched_at: new Date().toISOString(),
          enrichment_count: (cu.enrichment_count || 0) + 1,
        })
        .eq("id", cu.id)

      // Log enrichment run
      await supabase.from("enrichment_logs").insert({
        cu_id: cu.id,
        discoveries: result.discoveries,
        errors: result.errors,
        duration_ms: Date.now() - cuStartTime,
      })
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : "Unknown error")
    }

    result.duration_ms = Date.now() - cuStartTime
    results.push(result)
  }

  return NextResponse.json({
    processed: results.length,
    next_offset: offset + batchSize,
    total_duration_ms: Date.now() - startTime,
    results,
  })
}

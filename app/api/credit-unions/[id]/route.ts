import { NextRequest, NextResponse } from "next/server"
import { TOP_20_CREDIT_UNIONS, type CreditUnionData } from "@/lib/credit-union-data"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/credit-unions/[id] - Get a specific credit union
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "Credit union ID is required" },
        { status: 400 }
      )
    }

    // First, try to find in our static data
    let creditUnion = TOP_20_CREDIT_UNIONS.find(
      cu => cu.id === id || cu.charter === id || cu.id.includes(id.toLowerCase())
    )

    // If not found in static data, try Supabase
    if (!creditUnion) {
      try {
        const { createClient } = await import("@/lib/supabase/server")
        const supabase = await createClient()

        const { data } = await supabase
          .from("credit_unions")
          .select("*")
          .or(`id.eq.${id},charter.eq.${id},slug.eq.${id}`)
          .single()

        if (data) {
          creditUnion = mapDatabaseCU(data)
        }
      } catch (dbError) {
        // Database not available, continue with null
        console.warn("Could not fetch from database:", dbError)
      }
    }

    if (!creditUnion) {
      return NextResponse.json(
        { error: `Credit union "${id}" not found` },
        { status: 404 }
      )
    }

    return NextResponse.json(creditUnion)
  } catch (error) {
    console.error("Error fetching credit union:", error)
    return NextResponse.json(
      { error: "Failed to fetch credit union" },
      { status: 500 }
    )
  }
}

// Helper to map database record to CreditUnionData type
function mapDatabaseCU(data: any): CreditUnionData {
  return {
    id: data.id,
    rank: data.rank || 0,
    name: data.name,
    displayName: data.display_name || data.name,
    charter: data.charter,
    routing: data.routing || "",
    assets: data.assets || 0,
    assetsFormatted: formatCurrency(data.assets || 0),
    members: data.members || 0,
    membersFormatted: formatNumber(data.members || 0),
    headquarters: data.headquarters || `${data.city}, ${data.state}`,
    city: data.city || "",
    state: data.state || "",
    website: data.website || "",
    logoUrl: data.logo_url || "",
    logoUrls: {
      direct: data.logo_url,
      clearbit: `https://logo.clearbit.com/${data.website?.replace(/^https?:\/\//, "")}`,
      google: `https://www.google.com/s2/favicons?domain=${data.website?.replace(/^https?:\/\//, "")}&sz=128`,
      duckduckgo: `https://icons.duckduckgo.com/ip3/${data.website?.replace(/^https?:\/\//, "")}.ico`,
    },
    logoDomain: data.website?.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] || "",
    logoFallbackColor: data.primary_color || "#003366",
    appStoreId: data.app_store_id || null,
    playStoreId: data.play_store_id || null,
    primaryColor: data.primary_color || "#003366",
    secondaryColor: data.secondary_color || "#0066CC",
    founded: data.founded || 1900,
    ceo: data.ceo || "",
    source: "ncua",
    lastUpdated: data.updated_at || new Date().toISOString(),
    coreBanking: {
      provider: data.core_provider || "Unknown",
      platform: data.core_platform || "",
      confidence: data.core_confidence || 0,
      source: "",
      lastVerified: "",
    },
    tier: data.tier || 1,
    segment: data.segment || "Community",
    status: data.status || "active",
    coreProvider: data.core_provider || "Unknown",
  }
}

function formatCurrency(cents: number): string {
  if (cents >= 1e12) return `$${(cents / 1e12).toFixed(1)}T`
  if (cents >= 1e9) return `$${(cents / 1e9).toFixed(1)}B`
  if (cents >= 1e6) return `$${(cents / 1e6).toFixed(1)}M`
  return `$${(cents / 1000).toFixed(0)}K`
}

function formatNumber(num: number): string {
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`
  return num.toString()
}

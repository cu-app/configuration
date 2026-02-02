import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Batch load all credit unions with logos
 * 
 * Strategy:
 * 1. Load in batches of 100-500 (configurable)
 * 2. Filter for CUs with logos first (faster)
 * 3. Use cursor-based pagination for efficiency
 * 4. Return metadata for client-side pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const batchSize = parseInt(searchParams.get("batchSize") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")
    const withLogosOnly = searchParams.get("withLogos") === "true"

    const supabase = await createClient()

    // Build query
    let query = supabase
      .from("ncua_credit_unions")
      .select(
        `
        cu_number,
        charter_number,
        cu_name,
        city,
        state,
        total_assets,
        total_members,
        logo_url,
        primary_color,
        website
      `,
        { count: "exact" }
      )
      .eq("is_active", true)

    // Filter for logos if requested
    if (withLogosOnly) {
      query = query.not("logo_url", "is", null)
    }

    // Apply pagination
    query = query
      .range(offset, offset + batchSize - 1)
      .order("cu_name", { ascending: true })

    const { data: creditUnions, error, count } = await query

    if (error) {
      console.error("[Batch Load] Error:", error)
      return NextResponse.json(
        { error: "Failed to load credit unions", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      creditUnions: creditUnions || [],
      pagination: {
        total: count || 0,
        batchSize,
        offset,
        hasMore: (count || 0) > offset + batchSize,
        nextOffset: offset + batchSize,
      },
      metadata: {
        withLogosOnly,
        loadedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[Batch Load] Exception:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * Get statistics about credit unions in database
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from("ncua_credit_unions")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    // Get count with logos
    const { count: withLogosCount, error: logosError } = await supabase
      .from("ncua_credit_unions")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .not("logo_url", "is", null)

    // Get count by state (sample)
    const { data: stateData, error: stateError } = await supabase
      .from("ncua_credit_unions")
      .select("state")
      .eq("is_active", true)

    const stateCounts: Record<string, number> = {}
    stateData?.forEach((cu) => {
      if (cu.state) {
        stateCounts[cu.state] = (stateCounts[cu.state] || 0) + 1
      }
    })

    return NextResponse.json({
      statistics: {
        total: totalCount || 0,
        withLogos: withLogosCount || 0,
        withoutLogos: (totalCount || 0) - (withLogosCount || 0),
        logoCoverage: totalCount
          ? ((withLogosCount || 0) / totalCount) * 100
          : 0,
        byState: stateCounts,
      },
      recommendations: {
        batchSize: 100, // Optimal for most cases
        largeBatchSize: 500, // For initial load
        estimatedBatches: totalCount ? Math.ceil(totalCount / 100) : 0,
        estimatedBatchesWithLogos: withLogosCount
          ? Math.ceil(withLogosCount / 100)
          : 0,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

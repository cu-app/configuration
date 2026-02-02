import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Search credit unions from Supabase
 * Supports batch loading with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    const supabase = await createClient()

    // Build search query
    let dbQuery = supabase
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

    // Apply search filter
    if (query.trim()) {
      // Try to parse as charter number first
      const charterNum = parseInt(query)
      if (!isNaN(charterNum)) {
        dbQuery = dbQuery.eq("charter_number", charterNum)
      } else {
        // Text search across name, city, state
        dbQuery = dbQuery.or(
          `cu_name.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%`
        )
      }
    }

    // Apply pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1).order("cu_name", { ascending: true })

    const { data: creditUnions, error, count } = await dbQuery

    if (error) {
      console.error("[CU Search] Error:", error)
      return NextResponse.json(
        { error: "Failed to search credit unions", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      creditUnions: creditUnions || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit,
    })
  } catch (error) {
    console.error("[CU Search] Exception:", error)
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
 * Batch load all credit unions with logos
 * Used for preloading/initial data load
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const batchSize = body.batchSize || 100
    const offset = body.offset || 0

    const supabase = await createClient()

    const { data: creditUnions, error } = await supabase
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
      `
      )
      .eq("is_active", true)
      .not("logo_url", "is", null) // Only get CUs with logos
      .range(offset, offset + batchSize - 1)
      .order("cu_name", { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: "Failed to load credit unions", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      creditUnions: creditUnions || [],
      batchSize,
      offset,
      hasMore: (creditUnions?.length || 0) === batchSize,
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

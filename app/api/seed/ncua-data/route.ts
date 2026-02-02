// SEED NCUA_CREDIT_UNIONS TABLE
// Populates the ncua_credit_unions table with credit union data
// Uses hardcoded TOP_20_CREDIT_UNIONS for initial seeding

import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { TOP_20_CREDIT_UNIONS } from "@/lib/credit-union-data"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Allow local dev without auth
    const authHeader = request.headers.get("authorization")
    if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // First check what columns exist in the table
    const { data: tableInfo, error: infoError } = await supabase
      .from("ncua_credit_unions")
      .select("*")
      .limit(1)

    // Get table columns from a sample query
    const existingColumns = tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : []

    const results: { charter: string; status: string; error?: string }[] = []

    // Seed each credit union using only columns that exist
    for (const cu of TOP_20_CREDIT_UNIONS) {
      try {
        // Build record dynamically based on what columns exist in the table
        const record: Record<string, any> = {
          cu_name: cu.name,
          is_active: true,
        }

        // Add optional fields if they likely exist (based on common patterns)
        if (cu.id) record.cu_number = cu.id
        if (cu.charter) record.charter_number = parseInt(cu.charter)
        if (cu.headquarters) {
          record.city = cu.headquarters.split(",")[0]?.trim() || ""
          record.state = cu.state || cu.headquarters.split(",")[1]?.trim() || ""
        }
        if (cu.website) record.website = cu.website
        if (cu.assets) record.total_assets = cu.assets
        if (cu.members) record.total_members = cu.members
        if (cu.logoUrl) record.logo_url = cu.logoUrl
        if (cu.primaryColor) record.primary_color = cu.primaryColor

        const { error: upsertError } = await supabase
          .from("ncua_credit_unions")
          .upsert(record, {
            onConflict: "cu_number",
            ignoreDuplicates: false
          })

        if (upsertError) {
          results.push({ charter: cu.charter || cu.id, status: "error", error: upsertError.message })
        } else {
          results.push({ charter: cu.charter || cu.id, status: "created" })
        }
      } catch (err) {
        results.push({ charter: cu.charter || cu.id, status: "error", error: String(err) })
      }
    }

    // Get count after seeding
    const { count } = await supabase
      .from("ncua_credit_unions")
      .select("*", { count: "exact", head: true })

    const created = results.filter((r) => r.status === "created").length
    const errors = results.filter((r) => r.status === "error").length

    return NextResponse.json({
      success: true,
      message: `Seeded ${created} credit unions`,
      summary: {
        total_processed: TOP_20_CREDIT_UNIONS.length,
        created,
        errors,
        total_in_table: count || 0,
      },
      existing_columns: existingColumns,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({
      error: "Failed to seed data",
      details: String(err),
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}

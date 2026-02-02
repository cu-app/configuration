// Check existing Supabase tables
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  // Try to use service role key first, fall back to anon key
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      error: "Supabase credentials not configured",
      env: {
        hasUrl: !!process.env.SUPABASE_URL || !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Check for key tables
    const tables = [
      "ncua_credit_unions",
      "cu_configs",
      "cu_logos",
      "cu_branches",
      "state_background_photos",
    ]

    const results: Record<string, { exists: boolean; count?: number; sample?: any; error?: string }> = {}

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select("*", { count: "exact", head: false })
          .limit(1)

        if (error) {
          results[table] = { exists: false, error: error.message }
        } else {
          results[table] = {
            exists: true,
            count: count || 0,
            sample: data?.[0] ? Object.keys(data[0]) : [],
          }
        }
      } catch (err) {
        results[table] = { exists: false, error: String(err) }
      }
    }

    // Check for logo-related columns in ncua_credit_unions
    let logoColumns: string[] = []
    if (results.ncua_credit_unions?.exists) {
      const { data } = await supabase
        .from("ncua_credit_unions")
        .select("logo_url, logo_source, primary_color, logo_discovered_at")
        .limit(1)

      if (data && data[0]) {
        logoColumns = Object.keys(data[0])
      }
    }

    return NextResponse.json({
      success: true,
      supabaseUrl: supabaseUrl.substring(0, 30) + "...",
      tables: results,
      logoColumnsInNcua: logoColumns,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({
      error: "Failed to check tables",
      details: String(err),
    }, { status: 500 })
  }
}

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET /api/ncua/search?q=navy - Search NCUA credit unions
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("ncua_credit_unions")
      .select("cu_number, cu_name, city, state, website, total_assets")
      .ilike("cu_name", `%${query}%`)
      .order("total_assets", { ascending: false })
      .limit(20)

    if (error) throw error

    return NextResponse.json({ results: data || [] })
  } catch (error) {
    console.error("NCUA search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}

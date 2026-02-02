import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || ""
  const limit = Number.parseInt(searchParams.get("limit") || "20")

  const supabase = await createClient()

  // Search credit unions by name
  const { data: creditUnions, error } = await supabase
    .from("credit_unions")
    .select("id, name, charter, city, state_id, website, logo_url, primary_color, total_members, total_assets, claimed")
    .ilike("name", `%${query}%`)
    .order("total_assets", { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(creditUnions)
}

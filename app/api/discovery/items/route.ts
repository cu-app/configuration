import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const creditUnionId = searchParams.get("creditUnionId")
  const charter = searchParams.get("charter")

  if (!creditUnionId && !charter) {
    return NextResponse.json({ error: "Credit union ID or charter required" }, { status: 400 })
  }

  // Look up the actual UUID from credit_unions table if we have a string ID or charter
  let actualUuid = creditUnionId

  // If creditUnionId looks like a string ID (e.g., "cu_navy_federal"), look up by name pattern
  if (creditUnionId && !creditUnionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    // Extract name from ID like "cu_navy_federal" -> "navy federal"
    const namePart = creditUnionId.replace(/^cu_/, '').replace(/_/g, ' ')
    const { data: cuRecord } = await supabase
      .from("credit_unions")
      .select("id")
      .ilike("name", `%${namePart}%`)
      .limit(1)

    if (cuRecord && cuRecord.length > 0) {
      actualUuid = cuRecord[0].id
    } else {
      // No matching CU found, return empty results
      return NextResponse.json({ items: [], stats: { bySources: {}, byType: {}, total: 0, verified: 0, pending: 0 } })
    }
  }

  // If charter provided, look up by charter
  if (charter) {
    const { data: cuRecord } = await supabase
      .from("credit_unions")
      .select("id")
      .eq("charter", charter)
      .limit(1)

    if (cuRecord && cuRecord.length > 0) {
      actualUuid = cuRecord[0].id
    } else {
      return NextResponse.json({ items: [], stats: { bySources: {}, byType: {}, total: 0, verified: 0, pending: 0 } })
    }
  }

  // Get all discovered items for this credit union
  const { data: items, error } = await supabase
    .from("discovered_items")
    .select("*")
    .eq("credit_union_id", actualUuid)
    .order("confidence_score", { ascending: false })

  if (error) {
    console.error("Error fetching items:", error)
    return NextResponse.json({ items: [], stats: null })
  }

  // Calculate stats
  const sourceStats: Record<string, number> = {}
  const typeStats: Record<string, number> = {}

  for (const item of items || []) {
    sourceStats[item.source] = (sourceStats[item.source] || 0) + 1
    typeStats[item.item_type] = (typeStats[item.item_type] || 0) + 1
  }

  return NextResponse.json({
    items: items || [],
    stats: {
      bySources: sourceStats,
      byType: typeStats,
      total: items?.length || 0,
      verified: items?.filter((i) => i.verification_status === "verified").length || 0,
      pending: items?.filter((i) => i.verification_status === "pending").length || 0,
    },
  })
}

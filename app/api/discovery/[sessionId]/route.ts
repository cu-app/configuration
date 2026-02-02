import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const supabase = await createClient()

  // Get session with items
  const { data: session, error: sessionError } = await supabase
    .from("discovery_sessions")
    .select("*")
    .eq("id", sessionId)
    .single()

  if (sessionError) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  const { data: items } = await supabase
    .from("discovered_items")
    .select("*")
    .eq("session_id", sessionId)
    .order("confidence_score", { ascending: false })

  // Get source stats
  const sourceStats: Record<string, number> = {}
  const typeStats: Record<string, number> = {}

  for (const item of items || []) {
    sourceStats[item.source] = (sourceStats[item.source] || 0) + 1
    typeStats[item.item_type] = (typeStats[item.item_type] || 0) + 1
  }

  return NextResponse.json({
    session,
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

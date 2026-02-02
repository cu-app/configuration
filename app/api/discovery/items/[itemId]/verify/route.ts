import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params
  const supabase = await createClient()
  const { action, editedData } = await request.json()

  if (!["verify", "reject", "edit"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  // Get current item
  const { data: currentItem } = await supabase.from("discovered_items").select("*").eq("id", itemId).single()

  if (!currentItem) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 })
  }

  if (action === "edit" && editedData) {
    // Create new version with edits
    const { data: newVersion, error } = await supabase
      .from("discovered_items")
      .insert({
        session_id: currentItem.session_id,
        credit_union_id: currentItem.credit_union_id,
        item_type: currentItem.item_type,
        data: editedData,
        source: "manual_edit",
        source_url: currentItem.source_url,
        confidence_score: 100, // Human verified
        confidence_reasoning: "Manually edited and verified by user",
        verification_status: "verified",
        verified_at: new Date().toISOString(),
        version: currentItem.version + 1,
        previous_version_id: currentItem.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Mark old version as superseded
    await supabase.from("discovered_items").update({ verification_status: "edited" }).eq("id", itemId)

    return NextResponse.json({ item: newVersion, action: "edited" })
  }

  // Simple verify or reject
  const { data: updatedItem, error } = await supabase
    .from("discovered_items")
    .update({
      verification_status: action === "verify" ? "verified" : "rejected",
      verified_at: new Date().toISOString(),
      confidence_score: action === "verify" ? 100 : currentItem.confidence_score,
    })
    .eq("id", itemId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update session stats
  const { data: sessionItems } = await supabase
    .from("discovered_items")
    .select("verification_status")
    .eq("session_id", currentItem.session_id)

  const verified = sessionItems?.filter((i) => i.verification_status === "verified").length || 0
  const rejected = sessionItems?.filter((i) => i.verification_status === "rejected").length || 0

  await supabase
    .from("discovery_sessions")
    .update({ items_verified: verified, items_rejected: rejected })
    .eq("id", currentItem.session_id)

  return NextResponse.json({ item: updatedItem, action })
}

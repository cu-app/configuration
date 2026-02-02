import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// POST /api/tenant/verify - Verify email token
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Verification token required" }, { status: 400 })
    }

    // Find and verify claim
    const { data: claim, error } = await supabase
      .from("tenant_claims")
      .update({
        status: "verified",
        verified_at: new Date().toISOString(),
      })
      .eq("verification_token", token)
      .eq("status", "email_sent")
      .gt("expires_at", new Date().toISOString())
      .select()
      .single()

    if (error || !claim) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    // Create device session for the verified user
    const { data: session } = await supabase
      .from("device_sessions")
      .insert({
        credit_union_id: claim.credit_union_id,
        user_email: claim.claimer_email,
        user_role: "admin",
        is_claimed: true,
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      creditUnionId: claim.credit_union_id,
      sessionId: session?.id,
    })
  } catch (error) {
    console.error("Verify error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/pilot/me
 * Returns current user's pilot enrollment status (requires sign-in).
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ enrolled: false, application: null }, { status: 200 })
  }

  const { data: application, error } = await supabase
    .from("pilot_applications")
    .select("id, status, cu_name, charter_number, submitted_at, approved_at")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { enrolled: false, application: null, error: error.message },
      { status: 200 }
    )
  }

  const enrolled =
    application != null &&
    application.status !== "rejected"

  return NextResponse.json({
    enrolled,
    application: application
      ? {
          id: application.id,
          status: application.status,
          cuName: application.cu_name,
          charterNumber: application.charter_number,
          submittedAt: application.submitted_at,
          approvedAt: application.approved_at,
        }
      : null,
  })
}

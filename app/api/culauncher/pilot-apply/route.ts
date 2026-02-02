import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Submit pilot program application (requires sign-in).
 * Links application to auth.users via user_id.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sign in required to enroll in the pilot." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      cuName,
      charterNumber,
      contactName,
      contactEmail,
      contactTitle,
      developerCount,
    } = body

    if (!cuName || !charterNumber || !contactName || !contactEmail) {
      return NextResponse.json(
        { error: "Missing required fields: cuName, charterNumber, contactName, contactEmail." },
        { status: 400 }
      )
    }

    const charterNum = String(charterNumber).trim()
    const devCount = developerCount != null ? parseInt(developerCount, 10) : null

    // Verify CU exists (ncua_credit_unions or credit_unions)
    const { data: existingCU } = await supabase
      .from("credit_unions")
      .select("charter, name")
      .eq("charter", charterNum)
      .maybeSingle()

    if (!existingCU) {
      const { data: ncuaCU } = await supabase
        .from("ncua_credit_unions")
        .select("charter_number, cu_name")
        .eq("charter_number", parseInt(charterNum, 10) || charterNum)
        .maybeSingle()
      if (!ncuaCU) {
        return NextResponse.json(
          { error: "Credit union not found. Please verify charter number." },
          { status: 404 }
        )
      }
    }

    // Check if user already applied
    const { data: existing } = await supabase
      .from("pilot_applications")
      .select("id, status, submitted_at")
      .eq("user_id", user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "You have already applied. We'll contact you soon.",
        application: {
          id: existing.id,
          status: existing.status,
          submittedAt: existing.submitted_at,
        },
      })
    }

    const application = {
      user_id: user.id,
      email: (contactEmail || user.email || "").trim(),
      cu_name: String(cuName).trim(),
      charter_number: charterNum,
      contact_name: String(contactName).trim(),
      contact_title: contactTitle ? String(contactTitle).trim() : null,
      developer_count: Number.isNaN(devCount) ? null : devCount,
      status: "pending",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: app, error: insertError } = await supabase
      .from("pilot_applications")
      .insert(application)
      .select()
      .single()

    if (insertError) {
      console.error("[Pilot Application] Insert error:", insertError)
      return NextResponse.json(
        { error: "Failed to save application. Please try again or contact support." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully. We'll contact you soon.",
      application: {
        id: app.id,
        cuName: app.cu_name,
        charterNumber: app.charter_number,
        status: app.status,
        submittedAt: app.submitted_at,
      },
    })
  } catch (error) {
    console.error("[Pilot Application] Exception:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

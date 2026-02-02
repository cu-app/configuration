import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Claim a credit union for pilot program
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { charterNumber, cuName, contactEmail, contactName, contactTitle } = body

    if (!charterNumber || !cuName) {
      return NextResponse.json(
        { error: "charterNumber and cuName are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if CU exists
    const { data: existingCU, error: lookupError } = await supabase
      .from("ncua_credit_unions")
      .select("charter_number, cu_name")
      .eq("charter_number", charterNumber)
      .single()

    if (lookupError || !existingCU) {
      return NextResponse.json(
        { error: "Credit union not found in database" },
        { status: 404 }
      )
    }

    // Check if already claimed
    const { data: existingClaim, error: claimCheckError } = await supabase
      .from("cu_claims")
      .select("id, status")
      .eq("charter_number", charterNumber)
      .single()

    if (existingClaim) {
      return NextResponse.json(
        {
          error: "Credit union already claimed",
          status: existingClaim.status,
          message: "This credit union has already been claimed.",
        },
        { status: 409 }
      )
    }

    // Create claim record
    const { data: claim, error: insertError } = await supabase
      .from("cu_claims")
      .insert({
        charter_number: charterNumber,
        cu_name: cuName,
        contact_email: contactEmail,
        contact_name: contactName,
        contact_title: contactTitle,
        status: "pending",
        claimed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      // If table doesn't exist, create it first (for development)
      if (insertError.code === "42P01") {
        console.warn("[CU Claim] cu_claims table doesn't exist, creating...")
        // In production, this would be handled by migrations
        return NextResponse.json(
          {
            error: "Claims system not initialized",
            message: "Please contact support to set up the claims system.",
          },
          { status: 503 }
        )
      }

      return NextResponse.json(
        { error: "Failed to create claim", details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      claim: {
        id: claim.id,
        charterNumber: claim.charter_number,
        cuName: claim.cu_name,
        status: claim.status,
        claimedAt: claim.claimed_at,
      },
      message: "Claim submitted successfully. We'll contact you soon.",
    })
  } catch (error) {
    console.error("[CU Claim] Exception:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

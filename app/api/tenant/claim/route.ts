import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// POST /api/tenant/claim - Start claim process for a credit union
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { email, charterNumber, creditUnionId } = await request.json()

    if (!email || !charterNumber) {
      return NextResponse.json({ error: "Email and charter number required" }, { status: 400 })
    }

    // Extract domain from email
    const emailDomain = email.split("@")[1]?.toLowerCase()
    if (!emailDomain) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Get credit union from NCUA data to validate domain
    const { data: ncuaData, error: ncuaError } = await supabase
      .from("ncua_credit_unions")
      .select("cu_number, cu_name, website")
      .eq("cu_number", charterNumber)
      .single()

    if (ncuaError || !ncuaData) {
      return NextResponse.json({ error: "Credit union not found in NCUA database" }, { status: 404 })
    }

    // Extract expected domain from NCUA website
    let ncuaDomain = ""
    if (ncuaData.website) {
      try {
        const url = new URL(ncuaData.website.startsWith("http") ? ncuaData.website : `https://${ncuaData.website}`)
        ncuaDomain = url.hostname.replace("www.", "").toLowerCase()
      } catch {
        ncuaDomain = ncuaData.website
          .replace(/^(https?:\/\/)?(www\.)?/, "")
          .split("/")[0]
          .toLowerCase()
      }
    }

    // Create claim record
    const { data: claim, error: claimError } = await supabase
      .from("tenant_claims")
      .insert({
        credit_union_id: creditUnionId || `cu_${charterNumber}`,
        charter_number: charterNumber,
        claimer_email: email.toLowerCase(),
        claimer_domain: emailDomain,
        ncua_domain: ncuaDomain,
        status: "pending",
      })
      .select()
      .single()

    if (claimError) {
      // Check if already claimed
      if (claimError.code === "23505") {
        return NextResponse.json({ error: "This credit union has already been claimed" }, { status: 409 })
      }
      throw claimError
    }

    // Check domain match
    const domainMatches =
      ncuaDomain &&
      (emailDomain === ncuaDomain || emailDomain.endsWith(`.${ncuaDomain}`) || ncuaDomain.endsWith(`.${emailDomain}`))

    // TODO: Send verification email via your email provider
    // For now, auto-verify if domain matches
    if (domainMatches) {
      await supabase.from("tenant_claims").update({ status: "email_sent" }).eq("id", claim.id)
    }

    return NextResponse.json({
      success: true,
      claimId: claim.id,
      domainMatches,
      message: domainMatches
        ? "Verification email sent. Please check your inbox."
        : "Domain does not match NCUA records. Manual verification required.",
      verificationToken: claim.verification_token,
    })
  } catch (error) {
    console.error("Claim error:", error)
    return NextResponse.json({ error: "Failed to process claim" }, { status: 500 })
  }
}

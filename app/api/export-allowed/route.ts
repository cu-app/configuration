import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

/**
 * GET /api/export-allowed?tenantId=...
 * Returns whether the current user is allowed to export config for this tenant.
 * Export is allowed only when:
 * 1. User is signed in and their email is confirmed (Supabase email_confirmed_at).
 * 2. For this tenant, either:
 *    - tenant_claims has a verified claim for this user's email (status = 'verified'), or
 *    - cu_email_domains has a verified domain for this tenant and the user's email domain matches.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const tenantId = req.nextUrl.searchParams.get("tenantId")
    if (!tenantId) {
      return NextResponse.json({ allowed: false, reason: "Tenant is required." }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { allowed: false, reason: "Sign in required to export." },
        { status: 200 }
      )
    }

    const email = user.email?.toLowerCase().trim()
    if (!email) {
      return NextResponse.json(
        { allowed: false, reason: "Confirm your email to export." },
        { status: 200 }
      )
    }

    // Require Supabase email confirmation (email_confirmed_at is set after verification)
    const emailConfirmedAt = (user as { email_confirmed_at?: string | null }).email_confirmed_at
    if (!emailConfirmedAt) {
      return NextResponse.json(
        { allowed: false, reason: "Confirm your email to export." },
        { status: 200 }
      )
    }

    const charter = tenantId.replace(/^cu_/, "")
    const admin = createAdminClient()

    // 1. Check tenant_claims: verified claim for this email + tenant
    const { data: claim } = await admin
      .from("tenant_claims")
      .select("id, status")
      .eq("charter_number", charter)
      .eq("claimer_email", email)
      .eq("status", "verified")
      .maybeSingle()

    if (claim) {
      return NextResponse.json({ allowed: true }, { status: 200 })
    }

    // 2. Check cu_email_domains: tenant has verified domain matching user's email domain
    const userDomain = email.includes("@") ? (email.split("@")[1] ?? "").toLowerCase() : ""
    if (!userDomain) {
      return NextResponse.json(
        { allowed: false, reason: "Use an email at your credit union's verified domain to export." },
        { status: 200 }
      )
    }

    const { data: domains } = await admin
      .from("cu_email_domains")
      .select("domain")
      .or(`tenant_id.eq.${tenantId},tenant_id.eq.${charter}`)
      .eq("is_verified", true)

    const verifiedDomains = (domains ?? []).map((d) => (d.domain || "").toLowerCase().trim())
    if (verifiedDomains.includes(userDomain)) {
      return NextResponse.json({ allowed: true }, { status: 200 })
    }

    return NextResponse.json(
      {
        allowed: false,
        reason:
          "Use an email at your credit union's verified domain and confirm it to export.",
      },
      { status: 200 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[export-allowed]", message)
    return NextResponse.json(
      { allowed: false, reason: "Could not check export permission." },
      { status: 500 }
    )
  }
}

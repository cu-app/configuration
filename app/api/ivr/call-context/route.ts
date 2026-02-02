/**
 * IVR Call Context API
 *
 * Returns phone call data for a UCID (Unique Call ID).
 * Maps to ivr_sessions table.
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { PhoneCallData } from "@/types/member"

export async function GET(request: NextRequest) {
  try {
    const ucid = request.nextUrl.searchParams.get("ucid")
    const tenantId = request.nextUrl.searchParams.get("tenantId")

    if (!ucid) {
      return NextResponse.json(
        { error: "ucid is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    let query = supabase
      .from("ivr_sessions")
      .select("id, ucid, ani, account_number, member_id, verified, started_at, answered_at, ended_at, status")
      .eq("ucid", ucid)
      .limit(1)

    if (tenantId) {
      query = query.eq("tenant_id", tenantId)
    }

    const { data: row, error } = await query.maybeSingle()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!row) {
      return NextResponse.json(
        { result: null, data: null },
        { status: 200 }
      )
    }

    const result: PhoneCallData = {
      phoneNumber: row.ani ?? "",
      individuals: [],
      isIdentified: !!row.member_id || !!row.account_number,
      isAuthorized: !!row.verified,
      seekingServiceOnMembership: row.account_number ?? "",
      beginTime: row.started_at ?? "",
      transferTime: row.answered_at ?? "",
      endTime: row.ended_at ?? "",
    }

    return NextResponse.json({
      success: true,
      result,
      data: result,
    })
  } catch (err) {
    console.error("[ivr/call-context]", err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

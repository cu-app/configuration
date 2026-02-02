/**
 * Member Lookup API
 *
 * ANI-based and member/account number lookup.
 * Maps to members table + PowerOn via Supabase ANI service.
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { performANIDIP } from "@/lib/services/ani-lookup-service"
import type { Individual } from "@/types/member"

export interface MemberLookupRequestBody {
  phoneNumber?: string
  memberNumber?: string
  accountNumber?: string
  tenantId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: MemberLookupRequestBody = await request.json()
    const { phoneNumber, memberNumber, accountNumber, tenantId } = body

    if (!phoneNumber && !memberNumber && !accountNumber) {
      return NextResponse.json(
        { success: false, error: "phoneNumber, memberNumber, or accountNumber required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    if (phoneNumber) {
      const result = await performANIDIP(supabase, phoneNumber, { tenantId })
      if (!result.success) {
        return NextResponse.json(result, { status: 200 })
      }
      const individuals: Individual[] = (result.matches ?? []).map((m) => ({
        ssn: "",
        title: "",
        firstName: "",
        middleName: "",
        lastName: `Member ${m.member_number}`,
        suffix: "",
      }))
      return NextResponse.json({
        ...result,
        individuals,
        is_identified: (result.member_numbers?.length ?? 0) > 0,
        is_authorized: false,
        seeking_service_on_membership:
          (result.member_numbers?.length ?? 0) === 1 ? result.member_numbers?.[0] : undefined,
      })
    }

    if (memberNumber || accountNumber) {
      const { loadCredentialsFromConfig, getPowerOnConfig } = await import("@/lib/config-credentials")
      let credentials = null
      if (tenantId) {
        try {
          credentials = await loadCredentialsFromConfig(tenantId, supabase)
        } catch {
          // ignore
        }
      }
      const powerOnConfig = getPowerOnConfig(credentials, undefined, tenantId)
      const { PowerOnService } = await import("@/lib/poweron-service")
      const powerOn = new PowerOnService(powerOnConfig)
      await powerOn.connect()

      const memberResult = accountNumber
        ? await powerOn.getMemberByAccountNumber(accountNumber)
        : await powerOn.getMemberByMemberNumber(memberNumber ?? "")

      if (!memberResult.success || !memberResult.data) {
        return NextResponse.json(
          {
            success: false,
            error: memberResult.error ?? "Member not found",
            member_numbers: [],
            member_ids: [],
            matches: [],
          },
          { status: 200 }
        )
      }

      const m = memberResult.data
      const individuals: Individual[] = [
        {
          ssn: "",
          title: "",
          firstName: m.firstName ?? "",
          middleName: "",
          lastName: m.lastName ?? "",
          suffix: "",
        },
      ]
      return NextResponse.json({
        success: true,
        member_numbers: [m.memberNumber],
        member_ids: [],
        matches: [
          {
            id: "",
            phone_number: m.phone ?? "",
            normalized_phone: (m.phone ?? "").replace(/\D/g, ""),
            member_number: m.memberNumber,
            is_primary: true,
          },
        ],
        individuals,
        is_identified: true,
        is_authorized: false,
        seeking_service_on_membership: m.memberNumber,
      })
    }

    return NextResponse.json(
      { success: false, error: "No identifier provided" },
      { status: 400 }
    )
  } catch (err) {
    console.error("[members/lookup]", err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

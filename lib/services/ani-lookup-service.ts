/**
 * ANI (Automatic Number Identification) Lookup Service
 *
 * Performs ANI DIP lookup via Supabase (RPC or table query).
 * Maps to channels.ivr config + members / ani_mappings tables.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { ANIMapping, MemberLookupResult } from "@/types/member"

const RPC_NAME = "ani_dip_lookup"

export interface ANILookupServiceOptions {
  tenantId?: string
}

/**
 * Normalize phone number to digits only.
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "")
}

/**
 * Perform ANI DIP lookup using Supabase RPC ani_dip_lookup.
 * Falls back to direct query on ani_mappings if RPC is not available.
 */
export async function performANIDIP(
  supabase: SupabaseClient,
  phoneNumber: string,
  _options?: ANILookupServiceOptions
): Promise<MemberLookupResult> {
  const startTime = Date.now()
  const normalized = normalizePhone(phoneNumber)

  if (!normalized || normalized.length < 10) {
    return {
      success: false,
      phone_number: phoneNumber,
      matches: [],
      member_ids: [],
      member_numbers: [],
      error: "Invalid phone number format",
      lookup_duration_ms: Date.now() - startTime,
    }
  }

  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc(RPC_NAME, {
      p_phone_number: phoneNumber,
    })

    if (!rpcError && Array.isArray(rpcData) && rpcData.length >= 0) {
      const matches: ANIMapping[] = (rpcData as Array<{
        member_id?: string | null
        member_number?: string
        phone_number?: string
        is_primary?: boolean
        tax_id?: string | null
      }>).map((row) => ({
        id: "",
        phone_number: row.phone_number ?? phoneNumber,
        normalized_phone: normalized,
        member_number: row.member_number ?? "",
        tax_id: row.tax_id ?? undefined,
        member_id: row.member_id ?? undefined,
        is_primary: row.is_primary ?? false,
        is_active: true,
        source_system: "core",
        export_date: new Date().toISOString().slice(0, 10),
      }))

      const member_ids = [...new Set(matches.map((m) => m.member_id).filter(Boolean) as string[])]
      const member_numbers = [...new Set(matches.map((m) => m.member_number).filter(Boolean))]

      return {
        success: true,
        phone_number: phoneNumber,
        matches,
        member_ids,
        member_numbers,
        lookup_duration_ms: Date.now() - startTime,
      }
    }

    if (rpcError?.code === "42883" || rpcError?.message?.includes("function")) {
      return await queryAniMappingsTable(supabase, phoneNumber, normalized, startTime)
    }

    return {
      success: false,
      phone_number: phoneNumber,
      matches: [],
      member_ids: [],
      member_numbers: [],
      error: rpcError?.message ?? "ANI lookup failed",
      lookup_duration_ms: Date.now() - startTime,
    }
  } catch (err) {
    return {
      success: false,
      phone_number: phoneNumber,
      matches: [],
      member_ids: [],
      member_numbers: [],
      error: err instanceof Error ? err.message : "Unknown error",
      lookup_duration_ms: Date.now() - startTime,
    }
  }
}

/**
 * Fallback: query ani_mappings table directly when RPC is not present.
 */
async function queryAniMappingsTable(
  supabase: SupabaseClient,
  phoneNumber: string,
  normalized: string,
  startTime: number
): Promise<MemberLookupResult> {
  const { data, error } = await supabase
    .from("ani_mappings")
    .select("id, phone_number, normalized_phone, member_number, member_id, is_primary, is_active, source_system, export_date")
    .eq("normalized_phone", normalized)
    .eq("is_active", true)
    .order("is_primary", { ascending: false })
    .limit(10)

  if (error) {
    return {
      success: false,
      phone_number: phoneNumber,
      matches: [],
      member_ids: [],
      member_numbers: [],
      error: error.message,
      lookup_duration_ms: Date.now() - startTime,
    }
  }

  const matches: ANIMapping[] = (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ""),
    phone_number: String(row.phone_number ?? phoneNumber),
    normalized_phone: String(row.normalized_phone ?? normalized),
    member_number: String(row.member_number ?? ""),
    member_id: row.member_id != null ? String(row.member_id) : undefined,
    is_primary: Boolean(row.is_primary),
    is_active: row.is_active != null ? Boolean(row.is_active) : true,
    source_system: String(row.source_system ?? "core"),
    export_date: row.export_date != null ? String(row.export_date) : undefined,
  }))

  const member_ids = [...new Set(matches.map((m) => m.member_id).filter(Boolean) as string[])]
  const member_numbers = [...new Set(matches.map((m) => m.member_number).filter(Boolean))]

  return {
    success: true,
    phone_number: phoneNumber,
    matches,
    member_ids,
    member_numbers,
    lookup_duration_ms: Date.now() - startTime,
  }
}

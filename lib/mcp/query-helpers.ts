/**
 * MCP-style query helpers for ANI, members, IVR sessions.
 * Use Supabase client (server or client) to query tables.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { performANIDIP } from "@/lib/services/ani-lookup-service"
import type { MemberLookupResult } from "@/types/member"

export interface QueryANIByPhoneResult extends MemberLookupResult {}

/**
 * Query ANI by phone number (uses ANI DIP or ani_mappings table).
 */
export async function queryANIByPhone(
  supabase: SupabaseClient,
  phoneNumber: string,
  tenantId?: string
): Promise<QueryANIByPhoneResult> {
  return performANIDIP(supabase, phoneNumber, { tenantId })
}

export interface MemberRow {
  id: string
  member_number?: string
  account_number?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
}

/**
 * Query member by member number (from members table).
 */
export async function queryMemberByNumber(
  supabase: SupabaseClient,
  memberNumber: string,
  tenantId?: string
): Promise<MemberRow | null> {
  let query = supabase
    .from("members")
    .select("id, member_number, account_number, first_name, last_name, email, phone")
    .eq("member_number", memberNumber)
    .limit(1)
  if (tenantId) {
    query = query.eq("tenant_id", tenantId)
  }
  const { data, error } = await query.maybeSingle()
  if (error || !data) return null
  return data as MemberRow
}

export interface IVRSessionRow {
  id: string
  ucid: string
  ani?: string
  account_number?: string
  member_id?: string
  verified?: boolean
  started_at?: string
  ended_at?: string
  status?: string
}

/**
 * Query IVR session by UCID.
 */
export async function queryIVRSession(
  supabase: SupabaseClient,
  ucid: string,
  tenantId?: string
): Promise<IVRSessionRow | null> {
  let query = supabase
    .from("ivr_sessions")
    .select("id, ucid, ani, account_number, member_id, verified, started_at, ended_at, status")
    .eq("ucid", ucid)
    .limit(1)
  if (tenantId) {
    query = query.eq("tenant_id", tenantId)
  }
  const { data, error } = await query.maybeSingle()
  if (error || !data) return null
  return data as IVRSessionRow
}

export interface MemberPhoneRow {
  id: string
  member_id: string
  phone_number: string
  normalized_phone: string
  is_primary?: boolean
}

/**
 * Query member phones by member ID.
 */
export async function queryMemberPhones(
  supabase: SupabaseClient,
  memberId: string
): Promise<MemberPhoneRow[]> {
  const { data, error } = await supabase
    .from("member_phones")
    .select("id, member_id, phone_number, normalized_phone, is_primary")
    .eq("member_id", memberId)
  if (error) return []
  return (data ?? []) as MemberPhoneRow[]
}

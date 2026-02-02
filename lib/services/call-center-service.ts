/**
 * Call Center Service (TypeScript)
 *
 * Converts Angular CallCenterService: gets phone call data for a UCID.
 * Maps to ivr_sessions table and backend CallCenter/GetDataForPhoneCall.
 */

import type { PhoneCallData } from "@/types/member"

export interface CallCenterServiceOptions {
  baseUrl?: string
  getHeaders?: () => Record<string, string>
}

export interface StatusResponse<T> {
  Result?: T
  Success?: boolean
  Error?: string
}

/**
 * Resolve UCID from URL search params or provided value.
 * In Next.js, callers pass ucid via searchParams; this helper returns the value to use.
 */
export function resolveUCID(
  ucidFromUrl: string | null | undefined,
  ucidFromSession?: string | null
): string | null {
  return ucidFromUrl ?? ucidFromSession ?? null
}

/**
 * Fetch phone call data for a given UCID.
 * Calls backend GET /CallCenter/GetDataForPhoneCall?ucid=...
 * Or uses Supabase ivr_sessions when backend is not available.
 */
export async function getPhoneCallData(
  ucid: string,
  options?: CallCenterServiceOptions
): Promise<StatusResponse<PhoneCallData>> {
  const baseUrl = options?.baseUrl ?? (typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL ?? "")
  const url = `${baseUrl}/api/ivr/call-context?ucid=${encodeURIComponent(ucid)}`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options?.getHeaders?.(),
  }

  try {
    const res = await fetch(url, { headers })
    if (!res.ok) {
      return {
        Success: false,
        Error: `HTTP ${res.status}: ${res.statusText}`,
      }
    }
    const json = await res.json()
    return {
      Result: json.result ?? json.data ?? json,
      Success: true,
    }
  } catch (err) {
    return {
      Success: false,
      Error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

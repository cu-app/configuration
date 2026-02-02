/**
 * M3 API Service (TypeScript)
 *
 * Thin wrapper for backend API: GET/POST with optional CU-style headers.
 * Used by lobby and member flows. Headers use tenant prefix (e.g. X-{PREFIX}-*).
 * Pass tenantPrefix from tenant context for white labeling; default is source prefix.
 */

export interface M3ApiServiceOptions {
  baseUrl?: string
  tenantPrefix?: string
  ucid?: string | null
}

/** Source/default prefix; replace with tenant prefix via getTenantContext() for white labeling */
const DEFAULT_PREFIX = "SCU"

function generateNewGuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getSCUHeaders(options?: {
  memberId?: number
  tellerId?: number
  branchId?: number
  membershipType?: string
  applicationIdentifier?: string
  ucid?: string | null
  tenantPrefix?: string
}): Record<string, string> {
  const prefix = options?.tenantPrefix ?? DEFAULT_PREFIX
  return {
    [`X-${prefix}-MemberID`]: `${options?.memberId ?? 0}`,
    [`X-${prefix}-TellerID`]: `${options?.tellerId ?? 0}`,
    [`X-${prefix}-BranchID`]: `${options?.branchId ?? 0}`,
    [`X-${prefix}-MembershipType`]: options?.membershipType ?? "",
    [`X-${prefix}-NewMembershipApplicationIdentifier`]: options?.applicationIdentifier ?? generateNewGuid(),
    [`X-${prefix}-UCID`]: options?.ucid ?? "",
  }
}

export async function m3Get<T>(
  endpoint: string,
  options?: M3ApiServiceOptions & { headers?: Record<string, string> }
): Promise<T> {
  const baseUrl = options?.baseUrl ?? (typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL ?? "")
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`
  const headers: Record<string, string> = {
    Accept: "*/*",
    ...getSCUHeaders({
      ucid: options?.ucid,
      tenantPrefix: options?.tenantPrefix,
    }),
    ...options?.headers,
  }
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return res.json() as Promise<T>
}

export async function m3Post<T>(
  endpoint: string,
  body: unknown,
  options?: M3ApiServiceOptions & { headers?: Record<string, string> }
): Promise<T> {
  const baseUrl = options?.baseUrl ?? (typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL ?? "")
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`
  const headers: Record<string, string> = {
    Accept: "*/*",
    "Content-Type": "application/json; charset=utf-8",
    ...getSCUHeaders({
      ucid: options?.ucid,
      tenantPrefix: options?.tenantPrefix,
    }),
    ...options?.headers,
  }
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return res.json() as Promise<T>
}

"use client"

import { useState, useEffect, useCallback } from "react"

export interface ExportAllowedState {
  allowed: boolean
  reason: string | null
  loading: boolean
  refetch: () => void
}

/**
 * Returns whether export is allowed for the given tenant.
 * Export is allowed only when the user has confirmed their email and
 * their email is at the tenant's verified credit union domain (or they have a verified claim).
 */
export function useExportAllowed(tenantId: string | null): ExportAllowedState {
  const [allowed, setAllowed] = useState(false)
  const [reason, setReason] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAllowed = useCallback(async () => {
    if (!tenantId) {
      setAllowed(false)
      setReason("Confirm your email at your credit union's verified domain to export.")
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/export-allowed?tenantId=${encodeURIComponent(tenantId)}`)
      const data = await res.json().catch(() => ({}))
      setAllowed(data.allowed === true)
      setReason(data.reason ?? null)
    } catch {
      setAllowed(false)
      setReason("Could not check export permission.")
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchAllowed()
  }, [fetchAllowed])

  return { allowed, reason, loading, refetch: fetchAllowed }
}

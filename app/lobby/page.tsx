"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { PhoneCallData, MemberLookupResult } from "@/types/member"
import { LobbySidebar } from "@/components/lobby/lobby-sidebar"
import { CallBanner } from "@/components/lobby/call-banner"
import { MemberSearch } from "@/components/lobby/member-search"

function LobbyPageContent() {
  const searchParams = useSearchParams()
  const ucid = searchParams.get("ucid") ?? undefined
  const ani = searchParams.get("ani") ?? searchParams.get("phone") ?? undefined
  const tenantId = searchParams.get("tenantId") ?? searchParams.get("tenant") ?? undefined

  const [callData, setCallData] = useState<PhoneCallData | null>(null)
  const [lookupResult, setLookupResult] = useState<MemberLookupResult | null>(null)
  const [selectedMemberNumber, setSelectedMemberNumber] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCallContext = useCallback(async () => {
    if (!ucid) return null
    try {
      const res = await fetch(`/api/ivr/call-context?ucid=${encodeURIComponent(ucid)}${tenantId ? `&tenantId=${encodeURIComponent(tenantId)}` : ""}`)
      if (!res.ok) return null
      const json = await res.json()
      return json.result ?? json.data ?? null
    } catch {
      return null
    }
  }, [ucid, tenantId])

  const fetchMemberLookup = useCallback(async () => {
    if (!ani) return null
    try {
      const res = await fetch("/api/members/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: ani,
          tenantId,
        }),
      })
      if (!res.ok) return null
      const json = await res.json()
      return json
    } catch {
      return null
    }
  }, [ani, tenantId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const load = async () => {
      const [ctx, lookup] = await Promise.all([
        fetchCallContext(),
        fetchMemberLookup(),
      ])
      if (cancelled) return
      if (ctx) setCallData(ctx)
      if (lookup) setLookupResult(lookup)
      if (lookup?.seeking_service_on_membership) {
        setSelectedMemberNumber(lookup.seeking_service_on_membership)
      } else if (lookup?.member_numbers?.length === 1) {
        setSelectedMemberNumber(lookup.member_numbers[0])
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [fetchCallContext, fetchMemberLookup])

  const phoneCallData = callData ?? (lookupResult && {
    phoneNumber: lookupResult.phone_number ?? ani ?? "",
    individuals: lookupResult.individuals ?? [],
    isIdentified: lookupResult.is_identified ?? false,
    isAuthorized: lookupResult.is_authorized ?? false,
    seekingServiceOnMembership: lookupResult.seeking_service_on_membership ?? selectedMemberNumber ?? "",
    beginTime: "",
    transferTime: "",
    endTime: "",
  } as PhoneCallData)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading lobby...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="text-center text-destructive">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-80 border-r bg-muted/20 flex flex-col shrink-0">
        <LobbySidebar
          phoneCallData={phoneCallData}
          lookupResult={lookupResult}
          selectedMemberNumber={selectedMemberNumber}
          onSelectMember={setSelectedMemberNumber}
        />
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        {ucid && (
          <CallBanner
            ani={phoneCallData?.phoneNumber ?? ani}
            start={phoneCallData?.beginTime}
            end={phoneCallData?.endTime}
            isVerified={!!phoneCallData?.isAuthorized}
            isIdentified={!!phoneCallData?.isIdentified}
          />
        )}
        <div className="flex-1 p-6 overflow-auto">
          {selectedMemberNumber ? (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-2">Member selected</h2>
              <p className="text-muted-foreground">
                Serving member: <strong>{selectedMemberNumber}</strong>. Proceed to member dashboard or verification as needed.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-6 space-y-6">
              <h2 className="text-lg font-semibold">Lobby</h2>
              <p className="text-muted-foreground">
                Select a member from the sidebar or use member search to identify the caller.
              </p>
              <MemberSearch
                tenantId={tenantId ?? undefined}
                onSelectMember={setSelectedMemberNumber}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function LobbyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/30">
          <div className="text-center">
            <div className="h-8 w-8 mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading lobby...</p>
          </div>
        </div>
      }
    >
      <LobbyPageContent />
    </Suspense>
  )
}

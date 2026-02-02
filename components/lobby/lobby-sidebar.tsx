"use client"

import type { PhoneCallData, MemberLookupResult } from "@/types/member"
import { getCallerConfidence, CallerConfidence } from "./caller-confidence"
import { MemberSelectList } from "./member-select-list"

export interface LobbySidebarProps {
  phoneCallData: PhoneCallData | null
  lookupResult: MemberLookupResult | null
  selectedMemberNumber: string | null
  onSelectMember: (memberNumber: string | null) => void
}

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "")
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  if (d.length === 11 && d[0] === "1") return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  return phone
}

export function LobbySidebar({
  phoneCallData,
  lookupResult,
  selectedMemberNumber,
  onSelectMember,
}: LobbySidebarProps) {
  const individuals = phoneCallData?.individuals ?? lookupResult?.individuals ?? []
  const memberNumbers = lookupResult?.member_numbers ?? []
  const seekingServiceOnMembership = phoneCallData?.seekingServiceOnMembership ?? lookupResult?.seeking_service_on_membership ?? ""
  const callerConfidence = getCallerConfidence(phoneCallData ?? (lookupResult ? {
    isAuthorized: lookupResult.is_authorized,
    isIdentified: lookupResult.is_identified,
    seekingServiceOnMembership: lookupResult.seeking_service_on_membership,
  } : null))

  const phoneNumber = phoneCallData?.phoneNumber ?? lookupResult?.phone_number ?? ""

  return (
    <div className="p-4 space-y-4 flex flex-col">
      {phoneNumber && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">account_circle</span>
            <span className="text-sm font-medium">{formatPhone(phoneNumber)}</span>
          </div>
          <div className="h-px bg-border" />
        </>
      )}
      <CallerConfidence state={callerConfidence} />
      {seekingServiceOnMembership && seekingServiceOnMembership !== "0" && (
        <div className="rounded-lg border bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Seeking Service on Membership:</p>
          <button
            type="button"
            onClick={() => onSelectMember(seekingServiceOnMembership)}
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            {seekingServiceOnMembership.length > 1 ? seekingServiceOnMembership : "None"}
          </button>
        </div>
      )}
      <div className="h-px bg-border" />
      <MemberSelectList
        individuals={individuals}
        memberNumbers={memberNumbers}
        selectedMemberNumber={selectedMemberNumber}
        onSelectMember={onSelectMember}
      />
    </div>
  )
}

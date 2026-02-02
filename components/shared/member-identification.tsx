"use client"

import type { Individual } from "@/types/member"

export interface MemberIdentificationProps {
  individual?: Individual | null
  memberNumber?: string
  className?: string
}

export function MemberIdentification({
  individual,
  memberNumber,
  className,
}: MemberIdentificationProps) {
  if (!individual && !memberNumber) return null
  const name = individual
    ? [individual.firstName, individual.middleName, individual.lastName].filter(Boolean).join(" ") + (individual.suffix ? ` ${individual.suffix}` : "")
    : `Member ${memberNumber}`

  return (
    <div className={className}>
      <span className="font-medium">{name}</span>
      {memberNumber && (
        <span className="text-muted-foreground text-sm ml-2">#{memberNumber}</span>
      )}
      {individual?.ssn && (
        <span className="text-muted-foreground text-xs block">Tax ID: ***{individual.ssn.slice(-4)}</span>
      )}
    </div>
  )
}

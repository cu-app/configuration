"use client"

import type { Individual } from "@/types/member"

export interface MemberSelectListProps {
  individuals: Individual[]
  memberNumbers: string[]
  selectedMemberNumber: string | null
  onSelectMember: (memberNumber: string | null) => void
}

export function MemberSelectList({
  individuals,
  memberNumbers,
  selectedMemberNumber,
  onSelectMember,
}: MemberSelectListProps) {
  const hasMembers = memberNumbers.length > 0 || individuals.length > 0

  if (!hasMembers) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Phone Number Matches</h3>
        <p className="text-sm text-muted-foreground">No members found. Use search or wait for ANI lookup.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <span>how_to_reg</span>
        Phone Number Matches
      </h3>
      <ul className="space-y-1">
        {memberNumbers.map((num) => (
          <li key={num}>
            <button
              type="button"
              onClick={() => onSelectMember(selectedMemberNumber === num ? null : num)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 ${
                selectedMemberNumber === num
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <span className="shrink-0 w-8 h-8 rounded-full bg-background/20 flex items-center justify-center text-xs font-medium">
                {num.slice(-2)}
              </span>
              <span>Member {num}</span>
            </button>
          </li>
        ))}
        {memberNumbers.length === 0 &&
          individuals.map((ind, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => onSelectMember(`individual-${i}`)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 ${
                  selectedMemberNumber === `individual-${i}`
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <span className="shrink-0 w-8 h-8 rounded-full bg-background/20 flex items-center justify-center text-xs font-medium">
                  {(ind.firstName?.[0] ?? "") + (ind.lastName?.[0] ?? "")}
                </span>
                <span>
                  {ind.firstName} {ind.lastName}
                </span>
                {ind.ssn && (
                  <span className="text-muted-foreground ml-auto text-xs">
                    Tax ID: ***{ind.ssn.slice(-4)}
                  </span>
                )}
              </button>
            </li>
          ))}
      </ul>
    </div>
  )
}

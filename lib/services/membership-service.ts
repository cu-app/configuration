/**
 * Membership Service (TypeScript)
 *
 * Minimal helpers for membership data normalization.
 * Full Angular MembershipService maps enums and builds internal IDs; this provides types and a normalize helper.
 */

import type { MembershipInformation } from "@/types/membership"

export function normalizeMembershipType(value: string): string {
  const v = (value ?? "").toString().toLowerCase()
  if (v.includes("primary") || v === "1") return "Primary"
  if (v.includes("joint") || v === "2") return "Joint"
  if (v.includes("beneficiary") || v === "3") return "Beneficiary"
  return value || "Primary"
}

/**
 * Normalize membership payload from API into MembershipInformation shape.
 */
export function setMembership(membershipInformation: MembershipInformation): MembershipInformation {
  if (!membershipInformation.primaryMember) {
    return membershipInformation
  }
  const normalized: MembershipInformation = {
    ...membershipInformation,
    membershipType: normalizeMembershipType(membershipInformation.membershipType ?? ""),
    primaryMember: {
      ...membershipInformation.primaryMember,
      addressRecords: membershipInformation.primaryMember.addressRecords ?? [],
    },
  }
  if (normalized.primaryMember.addressRecords.length === 0) {
    normalized.primaryMember.addressRecords.push({
      id: 1,
      memberNumber: normalized.memberNumber,
      addressMemberNumber: normalized.memberNumber,
    })
  }
  return normalized
}

/**
 * Membership types for lobby and member flows.
 * Mapped from Angular M3 MembershipInformation and related models.
 */

export interface AddressRecord {
  id: number
  memberNumber: string
  addressMemberNumber: string
  addressType?: string
  memberType?: string
  removeAddress?: boolean
}

export interface MemberInformation {
  memberNumber: string
  firstName?: string
  lastName?: string
  addressRecords?: AddressRecord[]
}

export interface MembershipInformation {
  memberNumber: string
  membershipType?: string
  primaryMember: MemberInformation
  shareAccounts?: unknown[]
  loanAccounts?: unknown[]
  creditCardAccounts?: unknown[]
}

/**
 * Member and call center types for lobby / ANI / IVR flows.
 * Mapped from Angular M3 PhoneCallData, Individual, and related models.
 */

export interface Individual {
  ssn: string
  title: string
  firstName: string
  middleName: string
  lastName: string
  suffix: string
}

export interface PhoneCallData {
  phoneNumber: string
  individuals: Individual[]
  isIdentified: boolean
  isAuthorized: boolean
  seekingServiceOnMembership: string
  beginTime: string
  transferTime: string
  endTime: string
}

export interface CallContextResponse {
  success: boolean
  result?: PhoneCallData
  error?: string
}

export interface ANIMapping {
  id: string
  phone_number: string
  normalized_phone: string
  member_number: string
  tax_id?: string
  member_id?: string
  is_primary: boolean
  is_active?: boolean
  source_system?: string
  export_date?: string
}

export interface MemberLookupResult {
  success: boolean
  phone_number?: string
  matches?: ANIMapping[]
  member_ids?: string[]
  member_numbers?: string[]
  individuals?: Individual[]
  is_identified?: boolean
  is_authorized?: boolean
  seeking_service_on_membership?: string
  error?: string
  lookup_duration_ms?: number
}

export type LobbyRoute = 'lobby' | 'member-identification' | 'member-dashboard'

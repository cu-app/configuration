/**
 * FIS Realtime Payments Adapter
 * 
 * Maps Flutter app payment requests to FIS Realtime Payments service:
 * - P2P payments (Zelle integration)
 * - External transfers (ACH)
 * - Bill payments
 * - Wire transfers
 * 
 * FIS integration requires:
 * - FIS_API_BASE_URL: FIS gateway URL
 * - FIS_CLIENT_ID: Client identifier
 * - FIS_CLIENT_SECRET: API secret
 * - FIS_INSTITUTION_ID: Institution routing number
 */

// Environment configuration
const FIS_API_BASE = process.env.FIS_API_BASE_URL || 'https://api.fisglobal.com'
const FIS_CLIENT_ID = process.env.FIS_CLIENT_ID || ''
const FIS_CLIENT_SECRET = process.env.FIS_CLIENT_SECRET || ''
const FIS_INSTITUTION_ID = process.env.FIS_INSTITUTION_ID || ''

// Types matching FIS API contracts
export interface FISPaymentRequest {
  paymentType: 'P2P' | 'ACH' | 'BILLPAY' | 'WIRE'
  sourceAccount: FISAccountReference
  destinationAccount?: FISAccountReference
  recipient?: FISRecipient
  biller?: FISBiller
  amount: number
  currency: string
  memo?: string
  scheduledDate?: string
  expedited?: boolean
}

export interface FISAccountReference {
  accountId: string
  accountNumber: string
  routingNumber: string
  accountType: 'CHECKING' | 'SAVINGS'
}

export interface FISRecipient {
  recipientId?: string
  name: string
  email?: string
  phone?: string
  accountNumber?: string
  routingNumber?: string
}

export interface FISBiller {
  billerId: string
  name: string
  accountNumber: string
  address?: FISAddress
}

export interface FISAddress {
  street1: string
  street2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface FISPaymentResponse {
  paymentId: string
  confirmationNumber: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  estimatedDeliveryDate: string
  fees?: number
  errors?: FISError[]
}

export interface FISError {
  code: string
  message: string
  field?: string
}

export interface FISBillerSearchResult {
  billerId: string
  name: string
  category: string
  logoUrl?: string
  requiresAccountNumber: boolean
  fields: FISBillerField[]
}

export interface FISBillerField {
  name: string
  label: string
  type: 'text' | 'number' | 'date'
  required: boolean
  maxLength?: number
  pattern?: string
}

export interface FISPaymentHistory {
  payments: FISHistoricalPayment[]
  totalCount: number
  pageSize: number
  pageNumber: number
}

export interface FISHistoricalPayment {
  paymentId: string
  paymentType: string
  amount: number
  recipient: string
  status: string
  createdDate: string
  completedDate?: string
}

// OAuth token management
interface FISToken {
  accessToken: string
  tokenType: string
  expiresAt: number
}

let cachedToken: FISToken | null = null

// API client class
export class FISAdapter {
  private baseUrl: string
  private clientId: string
  private clientSecret: string
  private institutionId: string

  constructor(
    baseUrl?: string,
    clientId?: string,
    clientSecret?: string,
    institutionId?: string
  ) {
    this.baseUrl = baseUrl || FIS_API_BASE
    this.clientId = clientId || FIS_CLIENT_ID
    this.clientSecret = clientSecret || FIS_CLIENT_SECRET
    this.institutionId = institutionId || FIS_INSTITUTION_ID
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
      return cachedToken.accessToken
    }

    // Request new token
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'payments.write payments.read billers.read',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to obtain FIS access token')
    }

    const data = await response.json()
    
    cachedToken = {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresAt: Date.now() + (data.expires_in * 1000) - 60000, // Expire 1 min early
    }

    return cachedToken.accessToken
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const accessToken = await this.getAccessToken()
    const url = `${this.baseUrl}${endpoint}`
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-Institution-Id': this.institutionId,
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`FIS API Error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // ============================================
  // P2P Payments (Zelle)
  // ============================================

  async sendP2PPayment(
    sourceAccount: FISAccountReference,
    recipient: FISRecipient,
    amount: number,
    memo?: string
  ): Promise<FISPaymentResponse> {
    return this.request<FISPaymentResponse>('/v1/payments/p2p', {
      method: 'POST',
      body: JSON.stringify({
        paymentType: 'P2P',
        sourceAccount,
        recipient,
        amount,
        currency: 'USD',
        memo,
      }),
    })
  }

  async lookupP2PRecipient(
    identifier: string,
    identifierType: 'email' | 'phone'
  ): Promise<FISRecipient | null> {
    try {
      return await this.request<FISRecipient>('/v1/payments/p2p/lookup', {
        method: 'POST',
        body: JSON.stringify({ identifier, identifierType }),
      })
    } catch {
      return null
    }
  }

  async getP2PContacts(memberId: string): Promise<FISRecipient[]> {
    return this.request<FISRecipient[]>(`/v1/payments/p2p/contacts/${memberId}`)
  }

  // ============================================
  // ACH Transfers
  // ============================================

  async initiateACHTransfer(
    sourceAccount: FISAccountReference,
    destinationAccount: FISAccountReference,
    amount: number,
    memo?: string,
    scheduledDate?: string
  ): Promise<FISPaymentResponse> {
    return this.request<FISPaymentResponse>('/v1/payments/ach', {
      method: 'POST',
      body: JSON.stringify({
        paymentType: 'ACH',
        sourceAccount,
        destinationAccount,
        amount,
        currency: 'USD',
        memo,
        scheduledDate,
      }),
    })
  }

  async getACHLimits(memberId: string): Promise<{
    dailyLimit: number
    monthlyLimit: number
    remainingDaily: number
    remainingMonthly: number
  }> {
    return this.request(`/v1/payments/ach/limits/${memberId}`)
  }

  // ============================================
  // Bill Pay
  // ============================================

  async searchBillers(query: string, category?: string): Promise<FISBillerSearchResult[]> {
    const params = new URLSearchParams({ q: query })
    if (category) params.set('category', category)
    
    return this.request<FISBillerSearchResult[]>(`/v1/billers/search?${params}`)
  }

  async getBillerDetails(billerId: string): Promise<FISBillerSearchResult> {
    return this.request<FISBillerSearchResult>(`/v1/billers/${billerId}`)
  }

  async submitBillPayment(
    sourceAccount: FISAccountReference,
    biller: FISBiller,
    amount: number,
    scheduledDate?: string
  ): Promise<FISPaymentResponse> {
    return this.request<FISPaymentResponse>('/v1/payments/billpay', {
      method: 'POST',
      body: JSON.stringify({
        paymentType: 'BILLPAY',
        sourceAccount,
        biller,
        amount,
        currency: 'USD',
        scheduledDate,
      }),
    })
  }

  async getMemberBillers(memberId: string): Promise<FISBiller[]> {
    return this.request<FISBiller[]>(`/v1/billers/member/${memberId}`)
  }

  async addMemberBiller(memberId: string, biller: FISBiller): Promise<FISBiller> {
    return this.request<FISBiller>(`/v1/billers/member/${memberId}`, {
      method: 'POST',
      body: JSON.stringify(biller),
    })
  }

  async removeMemberBiller(memberId: string, billerId: string): Promise<boolean> {
    await this.request(`/v1/billers/member/${memberId}/${billerId}`, {
      method: 'DELETE',
    })
    return true
  }

  // ============================================
  // Wire Transfers
  // ============================================

  async initiateWireTransfer(
    sourceAccount: FISAccountReference,
    recipient: FISRecipient & { bankName: string; swiftCode?: string },
    amount: number,
    purpose: string,
    expedited?: boolean
  ): Promise<FISPaymentResponse> {
    return this.request<FISPaymentResponse>('/v1/payments/wire', {
      method: 'POST',
      body: JSON.stringify({
        paymentType: 'WIRE',
        sourceAccount,
        recipient,
        amount,
        currency: 'USD',
        memo: purpose,
        expedited,
      }),
    })
  }

  async getWireFees(amount: number, domestic: boolean): Promise<{ fee: number }> {
    return this.request<{ fee: number }>('/v1/payments/wire/fees', {
      method: 'POST',
      body: JSON.stringify({ amount, domestic }),
    })
  }

  // ============================================
  // Payment History & Management
  // ============================================

  async getPaymentHistory(
    memberId: string,
    options?: {
      paymentType?: string
      startDate?: string
      endDate?: string
      status?: string
      pageSize?: number
      pageNumber?: number
    }
  ): Promise<FISPaymentHistory> {
    const params = new URLSearchParams()
    if (options?.paymentType) params.set('paymentType', options.paymentType)
    if (options?.startDate) params.set('startDate', options.startDate)
    if (options?.endDate) params.set('endDate', options.endDate)
    if (options?.status) params.set('status', options.status)
    if (options?.pageSize) params.set('pageSize', options.pageSize.toString())
    if (options?.pageNumber) params.set('pageNumber', options.pageNumber.toString())

    return this.request<FISPaymentHistory>(`/v1/payments/history/${memberId}?${params}`)
  }

  async getPaymentStatus(paymentId: string): Promise<FISPaymentResponse> {
    return this.request<FISPaymentResponse>(`/v1/payments/${paymentId}`)
  }

  async cancelPayment(paymentId: string): Promise<FISPaymentResponse> {
    return this.request<FISPaymentResponse>(`/v1/payments/${paymentId}/cancel`, {
      method: 'POST',
    })
  }

  async getScheduledPayments(memberId: string): Promise<FISHistoricalPayment[]> {
    return this.request<FISHistoricalPayment[]>(`/v1/payments/scheduled/${memberId}`)
  }
}

// Singleton instance
let fisAdapterInstance: FISAdapter | null = null

export function getFISAdapter(): FISAdapter {
  if (!fisAdapterInstance) {
    fisAdapterInstance = new FISAdapter()
  }
  return fisAdapterInstance
}

// Helper to calculate estimated delivery date
export function calculateDeliveryDate(
  paymentType: FISPaymentRequest['paymentType'],
  expedited?: boolean
): Date {
  const now = new Date()
  
  switch (paymentType) {
    case 'P2P':
      // Instant for Zelle
      return now
    case 'ACH':
      // 1-3 business days
      now.setDate(now.getDate() + (expedited ? 1 : 3))
      return now
    case 'BILLPAY':
      // 2-5 business days
      now.setDate(now.getDate() + (expedited ? 2 : 5))
      return now
    case 'WIRE':
      // Same day if expedited, next day otherwise
      if (!expedited) now.setDate(now.getDate() + 1)
      return now
    default:
      now.setDate(now.getDate() + 3)
      return now
  }
}

// Payment type display names
export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  P2P: 'Person to Person',
  ACH: 'Bank Transfer',
  BILLPAY: 'Bill Payment',
  WIRE: 'Wire Transfer',
}

export default FISAdapter

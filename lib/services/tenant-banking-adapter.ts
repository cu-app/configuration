/**
 * Tenant Banking Service Adapter
 * 
 * Generic adapter for multi-tenant credit union backend services.
 * Each tenant has their own configuration and API endpoints.
 * 
 * Maps Flutter app requests to tenant-specific backend services:
 * - IdentityManagement API for user/member operations
 * - TransferRequest API for transfers
 * - OnlineBanking BFF for app configuration
 * - Products API for product catalog
 * 
 * Configuration per tenant stored in Supabase `tenant_api_configs` table
 */

// Tenant configuration interface
export interface TenantApiConfig {
  tenantId: string
  tenantInitials: string // e.g., "NFCU", "SFCU", "BECU"
  tenantName: string
  apiBaseUrl: string
  apiKey: string
  coreProvider: "symitar" | "corelation" | "fiserv" | "jack_henry" | "finastra" | "other"
  environment: "sandbox" | "staging" | "production"
  features: {
    transfers: boolean
    billPay: boolean
    mobileDeposit: boolean
    p2p: boolean
    wires: boolean
  }
}

// In-memory cache for tenant configs
const tenantConfigCache = new Map<string, TenantApiConfig>()

/**
 * Generate tenant initials from tenant ID or name
 * Creates a unique 2-4 character identifier for each credit union
 * 
 * Examples:
 * - "cu_navy_federal" -> "NFCU"
 * - "cu_suncoast" -> "SFCU"
 * - "becu" -> "BECU"
 * - "cu_alliant" -> "ACU"
 * - "cu_state_employees" -> "SECU"
 * - "cu_pentagon_federal" -> "PFCU"
 * - "cu_golden_1" -> "G1CU"
 */
export function generateTenantInitials(tenantIdOrName: string): string {
  const cleaned = tenantIdOrName
    .replace(/^cu_/, '')
    .replace(/_credit_union$/i, '')
    .replace(/_cu$/i, '')
    .replace(/credit_union$/i, '')
    .replace(/_/g, ' ')
    .trim()

  const words = cleaned.split(/\s+/)
  
  if (words.length === 1) {
    // Single word - take first 4 chars uppercase or whole word if shorter
    const word = words[0].toUpperCase()
    if (word.length <= 4) {
      return word.length <= 2 ? word + 'CU' : word
    }
    return word.substring(0, 4)
  }
  
  // Multiple words - take first letter of each, max 4
  const initials = words
    .slice(0, 4)
    .map(w => w[0]?.toUpperCase() || '')
    .join('')
  
  // Append "CU" if not already there and room permits
  if (!initials.endsWith('CU') && initials.length <= 2) {
    return initials + 'CU'
  }
  
  return initials
}

/**
 * Generate exhaustive tenant initials for all seeded tenants
 * Used during database seeding to populate tenant_initials column
 */
export function generateAllTenantInitials(tenants: { id: string; name: string }[]): Map<string, string> {
  const initialsMap = new Map<string, string>()
  const usedInitials = new Set<string>()
  
  for (const tenant of tenants) {
    let initials = generateTenantInitials(tenant.name || tenant.id)
    
    // Handle collisions by appending numbers
    let counter = 1
    let uniqueInitials = initials
    while (usedInitials.has(uniqueInitials)) {
      uniqueInitials = `${initials}${counter}`
      counter++
    }
    
    usedInitials.add(uniqueInitials)
    initialsMap.set(tenant.id, uniqueInitials)
  }
  
  return initialsMap
}

// Helper to get tenant config from cache or database
export async function getTenantConfig(tenantId: string): Promise<TenantApiConfig> {
  // Check cache first
  if (tenantConfigCache.has(tenantId)) {
    return tenantConfigCache.get(tenantId)!
  }

  // Try to fetch from Supabase
  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    
    const { data } = await supabase
      .from("tenant_api_configs")
      .select("*")
      .eq("tenant_id", tenantId)
      .single()
    
    if (data) {
      const config: TenantApiConfig = {
        tenantId: data.tenant_id,
        tenantInitials: data.tenant_initials || generateTenantInitials(tenantId),
        tenantName: data.tenant_name,
        apiBaseUrl: data.api_base_url,
        apiKey: data.api_key,
        coreProvider: data.core_provider,
        environment: data.environment,
        features: data.features || {
          transfers: true,
          billPay: true,
          mobileDeposit: true,
          p2p: true,
          wires: true,
        },
      }
      tenantConfigCache.set(tenantId, config)
      return config
    }
  } catch (error) {
    console.warn("Could not fetch tenant config from database:", error)
  }

  // Fallback: use environment variables
  const config: TenantApiConfig = {
    tenantId,
    tenantInitials: generateTenantInitials(tenantId),
    tenantName: tenantId.replace(/_/g, ' ').replace(/^cu /i, ''),
    apiBaseUrl: process.env[`${tenantId.toUpperCase().replace(/-/g, '_')}_API_BASE_URL`] || 
                process.env.TENANT_API_BASE_URL || 
                'https://api.tenant.example.com',
    apiKey: process.env[`${tenantId.toUpperCase().replace(/-/g, '_')}_API_KEY`] || 
            process.env.TENANT_API_KEY || '',
    coreProvider: 'symitar',
    environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'),
    features: {
      transfers: true,
      billPay: true,
      mobileDeposit: true,
      p2p: true,
      wires: true,
    },
  }

  tenantConfigCache.set(tenantId, config)
  return config
}

// Clear tenant config cache (useful for testing or config updates)
export function clearTenantConfigCache(tenantId?: string): void {
  if (tenantId) {
    tenantConfigCache.delete(tenantId)
  } else {
    tenantConfigCache.clear()
  }
}

// Types matching Tenant Banking API contracts
export interface TenantAccount {
  accountId: string
  accountNumber: string
  accountType: 'SHARE' | 'LOAN' | 'CERTIFICATE' | 'CREDIT_CARD'
  accountSubType: string
  description: string
  balance: number
  availableBalance: number
  interestRate?: number
  maturityDate?: string
  status: 'ACTIVE' | 'CLOSED' | 'FROZEN'
}

export interface TenantMember {
  memberId: string
  memberNumber: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: string
  memberSince: string
  accounts: TenantAccount[]
  settings: TenantUserSettings
}

export interface TenantUserSettings {
  prefersDarkMode: boolean
  biometricEnabled: boolean
  pushNotificationsEnabled: boolean
  paperlessEnabled: boolean
  language: string
}

export interface TenantTransferRequest {
  fromAccountId: string
  toAccountId: string
  amount: number
  memo?: string
  scheduleDate?: string
  frequency?: 'ONCE' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
}

export interface TenantTransferResponse {
  transferId: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  errors?: string[]
  fromAccount: string
  toAccount: string
  amount: number
  createdAt: string
  completedAt?: string
}

export interface TenantTransaction {
  transactionId: string
  accountId: string
  type: 'DEBIT' | 'CREDIT'
  category: string
  description: string
  amount: number
  runningBalance: number
  postedDate: string
  effectiveDate: string
  status: 'POSTED' | 'PENDING' | 'CLEARED'
}

export interface TenantProduct {
  productId: string
  productType: 'SHARE' | 'LOAN' | 'CERTIFICATE' | 'CREDIT_CARD'
  name: string
  description: string
  interestRate: number
  minimumBalance?: number
  maximumBalance?: number
  term?: number
  features: string[]
}

/**
 * Multi-tenant Banking Service Adapter
 * 
 * Each instance is configured for a specific tenant.
 * Use getTenantAdapter() to get a cached instance for a tenant.
 */
export class TenantBankingAdapter {
  private tenantId: string
  private config: TenantApiConfig | null = null

  constructor(tenantId: string) {
    this.tenantId = tenantId
  }

  private async getConfig(): Promise<TenantApiConfig> {
    if (!this.config) {
      this.config = await getTenantConfig(this.tenantId)
    }
    return this.config
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const config = await this.getConfig()
    const url = `${config.apiBaseUrl}${endpoint}`
    
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey,
      'X-Tenant-ID': config.tenantId,
      'X-Tenant-Initials': config.tenantInitials,
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`[${config.tenantInitials}] API Error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Get tenant initials
  async getTenantInitials(): Promise<string> {
    const config = await this.getConfig()
    return config.tenantInitials
  }

  // ============================================
  // Member Operations (IdentityManagement API)
  // ============================================

  async getMember(memberId: string): Promise<TenantMember> {
    return this.request<TenantMember>(`/identitymanagement/member/${memberId}`)
  }

  async getMemberAccounts(memberId: string): Promise<TenantAccount[]> {
    return this.request<TenantAccount[]>(`/identitymanagement/member/${memberId}/accounts`)
  }

  async updateMemberSettings(
    memberId: string,
    settings: Partial<TenantUserSettings>
  ): Promise<boolean> {
    return this.request<boolean>('/memberaccount/UpdateUserSettings', {
      method: 'POST',
      body: JSON.stringify({ memberId, ...settings }),
    })
  }

  // ============================================
  // Account Operations
  // ============================================

  async getAccountDetails(accountId: string): Promise<TenantAccount> {
    return this.request<TenantAccount>(`/accounts/${accountId}`)
  }

  async getAccountTransactions(
    accountId: string,
    options?: {
      startDate?: string
      endDate?: string
      limit?: number
      offset?: number
    }
  ): Promise<TenantTransaction[]> {
    const params = new URLSearchParams()
    if (options?.startDate) params.set('startDate', options.startDate)
    if (options?.endDate) params.set('endDate', options.endDate)
    if (options?.limit) params.set('limit', options.limit.toString())
    if (options?.offset) params.set('offset', options.offset.toString())

    const queryString = params.toString()
    const endpoint = `/accounts/${accountId}/transactions${queryString ? `?${queryString}` : ''}`
    
    return this.request<TenantTransaction[]>(endpoint)
  }

  // ============================================
  // Transfer Operations (TransferRequest API)
  // ============================================

  async requestTransfer(transfer: TenantTransferRequest): Promise<TenantTransferResponse> {
    return this.request<TenantTransferResponse>('/transferrequest/requesttransfer', {
      method: 'POST',
      body: JSON.stringify(transfer),
    })
  }

  async getTransferStatus(transferId: string): Promise<TenantTransferResponse> {
    return this.request<TenantTransferResponse>(`/transferrequest/${transferId}`)
  }

  async cancelTransfer(transferId: string): Promise<boolean> {
    return this.request<boolean>(`/transferrequest/${transferId}/cancel`, {
      method: 'POST',
    })
  }

  async getScheduledTransfers(memberId: string): Promise<TenantTransferResponse[]> {
    return this.request<TenantTransferResponse[]>(`/transferrequest/scheduled/${memberId}`)
  }

  // ============================================
  // Product Operations (Products API)
  // ============================================

  async getProducts(productType?: string): Promise<TenantProduct[]> {
    const endpoint = productType
      ? `/products?type=${productType}`
      : '/products'
    return this.request<TenantProduct[]>(endpoint)
  }

  async getProductDetails(productId: string): Promise<TenantProduct> {
    return this.request<TenantProduct>(`/products/${productId}`)
  }

  async getProductRates(): Promise<{ productId: string; rate: number }[]> {
    return this.request<{ productId: string; rate: number }[]>('/rates')
  }

  // ============================================
  // App Configuration (OnlineBanking BFF)
  // ============================================

  async getAppConfig(): Promise<{
    version: string
    minimumVersion: string
    features: Record<string, boolean>
    maintenanceMode: boolean
    maintenanceMessage?: string
  }> {
    return this.request('/onlinebanking/config')
  }
}

// Cache for tenant adapter instances
const tenantAdapterCache = new Map<string, TenantBankingAdapter>()

/**
 * Get a cached adapter instance for a tenant
 */
export function getTenantAdapter(tenantId: string): TenantBankingAdapter {
  if (!tenantAdapterCache.has(tenantId)) {
    tenantAdapterCache.set(tenantId, new TenantBankingAdapter(tenantId))
  }
  return tenantAdapterCache.get(tenantId)!
}

// Helper function to map account types to Flutter app types
export function mapAccountType(accountType: TenantAccount['accountType']): string {
  const typeMap: Record<string, string> = {
    SHARE: 'savings',
    LOAN: 'loan',
    CERTIFICATE: 'certificate',
    CREDIT_CARD: 'credit_card',
  }
  return typeMap[accountType] || 'other'
}

// Helper function to format currency from cents
export function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

export default TenantBankingAdapter

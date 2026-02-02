/**
 * CU Mobile BFF Contract
 *
 * Any credit union backend (SunBlock, custom BFF, Supabase Edge) that wants to
 * power the cu_mx_app (Flutter) must implement this contract. The mobile app
 * calls a single base URL per tenant and uses these operation names and shapes.
 *
 * See PRODUCTION_SPEC_CU_MOBILE.md for full API catalog and multi-tenant model.
 */

// ---------------------------------------------------------------------------
// Config & session
// ---------------------------------------------------------------------------

export interface CuMobileConfigResponse {
  tenant_id: string
  tenant_name: string
  version: string
  updated_at: string
  config: Record<string, unknown>
}

export interface CuMobileSession {
  token: string
  expires_at?: string
  member_id?: string
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface LoginParams {
  username: string
  password: string
  device_id?: string
}

export interface LoginResponse {
  success: boolean
  session?: CuMobileSession
  requires_mfa?: boolean
  mfa_type?: 'sms' | 'email' | 'totp' | 'push'
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export interface AccountSummary {
  id: string
  name: string
  type: string
  balance: number
  available_balance?: number
  masked_number?: string
  currency?: string
}

export interface AccountListResponse {
  accounts: AccountSummary[]
}

export interface TransactionItem {
  id: string
  date: string
  description: string
  amount: number
  balance_after?: number
  type?: 'credit' | 'debit'
}

export interface AccountTransactionListParams {
  account_id: string
  from_date?: string
  to_date?: string
  page?: number
  page_size?: number
}

export interface AccountTransactionListResponse {
  transactions: TransactionItem[]
  has_more: boolean
}

// ---------------------------------------------------------------------------
// Transfers
// ---------------------------------------------------------------------------

export interface TransferExecuteParams {
  from_account_id: string
  to_account_id: string
  amount: number
  memo?: string
}

export interface TransferExecuteResponse {
  success: boolean
  transaction_id?: string
  error_code?: string
  message?: string
}

export interface TransferFavorite {
  id: string
  nickname: string
  to_account_id: string
  to_member_id?: string
}

export interface TransferFavoritesResponse {
  favorites: TransferFavorite[]
}

// ---------------------------------------------------------------------------
// Bill pay
// ---------------------------------------------------------------------------

export interface BillPayHoliday {
  date: string
  description: string
}

export interface BillPayHolidaysResponse {
  holidays: BillPayHoliday[]
}

// ---------------------------------------------------------------------------
// Remote deposit (RDC)
// ---------------------------------------------------------------------------

export interface RemoteDepositInfo {
  enabled: boolean
  daily_limit: number
  monthly_limit?: number
}

export interface RemoteDepositInfoResponse {
  info: RemoteDepositInfo
}

// ---------------------------------------------------------------------------
// Locations (branches / ATMs)
// ---------------------------------------------------------------------------

export interface LocationInfo {
  id: string
  name: string
  type: 'branch' | 'atm'
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
  lat?: number
  lng?: number
  phone?: string
  hours?: Record<string, string>
}

export interface LocationsResponse {
  locations: LocationInfo[]
}

// ---------------------------------------------------------------------------
// BFF client interface (implement per backend)
// ---------------------------------------------------------------------------

export interface CuMobileBffContract {
  /** Base URL for config (e.g. configuration-matrix-build origin). */
  getConfigBaseUrl(): string

  /** Fetch tenant config. */
  getConfig(tenantId: string): Promise<CuMobileConfigResponse>

  /** Base URL for API (from config or env). */
  getApiBaseUrl(tenantId: string): Promise<string>

  /** Current session token (if any). */
  getSession(): CuMobileSession | null

  /** Login. */
  login(tenantId: string, params: LoginParams): Promise<LoginResponse>

  /** Logout. */
  logout(): Promise<void>

  /** Refresh session. */
  refreshSession(): Promise<CuMobileSession | null>

  // --- Accounts ---
  accountList(): Promise<AccountListResponse>
  accountTransactionList(params: AccountTransactionListParams): Promise<AccountTransactionListResponse>

  // --- Transfers ---
  transferExecute(params: TransferExecuteParams): Promise<TransferExecuteResponse>
  getTransferFavorites(): Promise<TransferFavoritesResponse>
  setTransferFavorites(favorites: TransferFavorite[]): Promise<{ success: boolean }>

  // --- Bill pay ---
  billPayGetHolidays(): Promise<BillPayHolidaysResponse>

  // --- Remote deposit ---
  getRemoteDepositInfo(): Promise<RemoteDepositInfoResponse>

  // --- Locations ---
  getLocations(params?: { lat?: number; lng?: number; radius_miles?: number }): Promise<LocationsResponse>
}

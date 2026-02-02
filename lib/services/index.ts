/**
 * Service Adapters Index
 * 
 * Centralized exports for all backend service adapters.
 * These adapters map Flutter app API calls to the underlying
 * backend services per tenant.
 */

// Tenant Banking Services (Generic Multi-Tenant Adapter)
export {
  TenantBankingAdapter,
  getTenantAdapter,
  getTenantConfig,
  clearTenantConfigCache,
  generateTenantInitials,
  generateAllTenantInitials,
  mapAccountType,
  formatCurrency,
  type TenantApiConfig,
  type TenantAccount,
  type TenantMember,
  type TenantUserSettings,
  type TenantTransferRequest,
  type TenantTransferResponse,
  type TenantTransaction,
  type TenantProduct,
} from "./tenant-banking-adapter"

// FIS Realtime Payments Services
export {
  FISAdapter,
  getFISAdapter,
  calculateDeliveryDate,
  PAYMENT_TYPE_LABELS,
  type FISPaymentRequest,
  type FISAccountReference,
  type FISRecipient,
  type FISBiller,
  type FISAddress,
  type FISPaymentResponse,
  type FISError,
  type FISBillerSearchResult,
  type FISBillerField,
  type FISPaymentHistory,
  type FISHistoricalPayment,
} from "./fis-adapter"

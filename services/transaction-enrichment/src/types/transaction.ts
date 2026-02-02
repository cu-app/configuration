/**
 * MX-Compatible Transaction Structure
 * Reverse engineered from Suncoast's MxTransactionDetail.cs
 */

export interface RawTransaction {
  guid: string;
  account_guid: string;
  amount: number;
  description: string; // Raw from bank
  date: string; // ISO date
  type?: 'CREDIT' | 'DEBIT';
  status?: 'POSTED' | 'PENDING';
  mcc_code?: string; // MCC from card network
  latitude?: number;
  longitude?: number;
}

export interface EnrichedTransaction extends RawTransaction {
  // Enriched fields (replaces MX)
  cleaned_description: string;
  merchant_guid?: string;
  merchant_name?: string;
  merchant_logo_url?: string;
  merchant_website_url?: string;
  merchant_location_guid?: string;
  merchant_confidence?: number; // 0-1

  category_guid: string;
  category_name: string;
  category_parent_guid?: string;
  category_parent_name?: string;
  category_confidence: number; // 0-1

  // Smart detection
  is_subscription: boolean;
  is_recurring: boolean;
  is_bill_pay: boolean;
  is_direct_deposit?: boolean;
  is_overdraft_fee?: boolean;
  is_fee?: boolean;
  is_international?: boolean;

  // Pattern data
  recurring_pattern?: import('../enrichment/pattern-detector').RecurringPattern;

  // Processing metadata
  enriched_at: string; // ISO timestamp
  enriched_by: 'CUAPP' | 'USER' | 'SYSTEM';
  processing_time_ms: number;
}

// API Request/Response types
export interface EnrichmentRequest {
  transaction: RawTransaction;
  account_guid?: string;
  history?: import('../enrichment/pattern-detector').TransactionHistory[];
}

export interface EnrichmentResponse {
  transaction: EnrichedTransaction;
  processing_time_ms: number;
}

export interface BatchEnrichmentRequest {
  transactions: RawTransaction[];
  account_guid?: string;
  history?: import('../enrichment/pattern-detector').TransactionHistory[];
}

export interface BatchEnrichmentResponse {
  transactions: EnrichedTransaction[];
  processing_time_ms: number;
  count: number;
}

export interface Merchant {
  guid: string;
  name: string;
  logo_url?: string;
  website_url?: string;
  default_category_guid: string;
  mcc_codes: number[]; // Associated MCC codes
  aliases: string[]; // Known variations in descriptions
  location_count: number;
}

export interface MerchantLocation {
  guid: string;
  merchant_guid: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  country: string;
}

export interface Category {
  guid: string;
  name: string;
  parent_guid?: string;
  level: number; // 0 = top level, 1 = subcategory
  keywords: string[]; // For text matching
  mcc_codes: number[]; // Associated MCC codes
}

export interface RecurringPattern {
  merchant_guid: string;
  amount: number;
  frequency_days: number; // e.g., 30 for monthly
  last_seen: string;
  count: number; // How many times seen
  confidence: number;
}

export interface EnrichmentResult {
  transaction: EnrichedTransaction;
  alternatives?: Array<{
    category: string;
    confidence: number;
  }>;
  user_corrections_count?: number; // If user has corrected this merchant before
}

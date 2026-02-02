/**
 * Transaction Enrichment Helper
 * 
 * Integrates transaction-enrichment service into omnichannel system
 * Automatically enriches transactions when fetched
 * 
 * Replaces MX.com's $50K/year service with $5/month edge computing
 */

import type { CreditUnionConfig } from "@/types/cu-config"

export interface RawTransaction {
  guid: string
  account_guid: string
  amount: number
  description: string
  date: string
  mcc_code?: string
  latitude?: number
  longitude?: number
}

export interface EnrichedTransaction extends RawTransaction {
  cleaned_description: string
  merchant_guid?: string
  merchant_name?: string
  merchant_logo_url?: string
  merchant_confidence?: number
  category_guid?: string
  category_name?: string
  category_parent_name?: string
  category_confidence?: number
  is_subscription?: boolean
  is_recurring?: boolean
  is_bill_pay?: boolean
  enriched_by: "CUAPP" | "MX" | "PLAID"
  enriched_at: string
  processing_time_ms: number
}

/**
 * Enrich a single transaction using configured provider
 */
export async function enrichTransaction(
  transaction: RawTransaction,
  config: CreditUnionConfig,
  history?: RawTransaction[]
): Promise<EnrichedTransaction> {
  const enrichmentConfig = config.integrations.transaction_enrichment

  // If disabled, return transaction as-is
  if (!enrichmentConfig.enabled || enrichmentConfig.provider === "disabled") {
    return {
      ...transaction,
      cleaned_description: transaction.description,
      enriched_by: "CUAPP",
      enriched_at: new Date().toISOString(),
      processing_time_ms: 0,
    }
  }

  // Use internal edge service
  if (enrichmentConfig.provider === "internal") {
    const workerUrl = enrichmentConfig.worker_url || 
                     process.env.TRANSACTION_ENRICHMENT_URL ||
                     "https://cuapp-transaction-enrichment.YOUR_SUBDOMAIN.workers.dev"

    try {
      const response = await fetch(`${workerUrl}/enrich`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(enrichmentConfig.api_key && {
            "Authorization": `Bearer ${enrichmentConfig.api_key}`,
          }),
        },
        body: JSON.stringify({
          transaction,
          account_guid: transaction.account_guid,
          history: history || [],
        }),
      })

      if (!response.ok) {
        throw new Error(`Enrichment failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.transaction as EnrichedTransaction
    } catch (error) {
      console.warn("[enrichTransaction] Edge service failed, returning unenriched:", error)
      // Fallback: return transaction with basic cleaning
      return {
        ...transaction,
        cleaned_description: cleanDescriptionBasic(transaction.description),
        enriched_by: "CUAPP",
        enriched_at: new Date().toISOString(),
        processing_time_ms: 0,
      }
    }
  }

  // Use MX.com (if configured)
  if (enrichmentConfig.provider === "mx") {
    // TODO: Implement MX API call
    console.warn("[enrichTransaction] MX provider not yet implemented")
    return {
      ...transaction,
      cleaned_description: cleanDescriptionBasic(transaction.description),
      enriched_by: "MX",
      enriched_at: new Date().toISOString(),
      processing_time_ms: 0,
    }
  }

  // Use Plaid (if configured)
  if (enrichmentConfig.provider === "plaid") {
    // TODO: Implement Plaid enrichment
    console.warn("[enrichTransaction] Plaid provider not yet implemented")
    return {
      ...transaction,
      cleaned_description: cleanDescriptionBasic(transaction.description),
      enriched_by: "PLAID",
      enriched_at: new Date().toISOString(),
      processing_time_ms: 0,
    }
  }

  // Fallback
  return {
    ...transaction,
    cleaned_description: transaction.description,
    enriched_by: "CUAPP",
    enriched_at: new Date().toISOString(),
    processing_time_ms: 0,
  }
}

/**
 * Enrich multiple transactions in batch
 */
export async function enrichTransactionsBatch(
  transactions: RawTransaction[],
  config: CreditUnionConfig,
  accountGuid: string,
  history?: RawTransaction[]
): Promise<EnrichedTransaction[]> {
  const enrichmentConfig = config.integrations.transaction_enrichment

  if (!enrichmentConfig.enabled || enrichmentConfig.provider === "disabled") {
    return transactions.map(txn => ({
      ...txn,
      cleaned_description: txn.description,
      enriched_by: "CUAPP",
      enriched_at: new Date().toISOString(),
      processing_time_ms: 0,
    }))
  }

  if (enrichmentConfig.provider === "internal") {
    const workerUrl = enrichmentConfig.worker_url || 
                     process.env.TRANSACTION_ENRICHMENT_URL ||
                     "https://cuapp-transaction-enrichment.YOUR_SUBDOMAIN.workers.dev"

    try {
      const response = await fetch(`${workerUrl}/enrich/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(enrichmentConfig.api_key && {
            "Authorization": `Bearer ${enrichmentConfig.api_key}`,
          }),
        },
        body: JSON.stringify({
          account_guid: accountGuid,
          transactions,
          history: history || [],
        }),
      })

      if (!response.ok) {
        throw new Error(`Batch enrichment failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.transactions as EnrichedTransaction[]
    } catch (error) {
      console.warn("[enrichTransactionsBatch] Edge service failed, enriching individually:", error)
      // Fallback: enrich one by one
      return Promise.all(
        transactions.map(txn => enrichTransaction(txn, config, history))
      )
    }
  }

  // Fallback: enrich individually
  return Promise.all(
    transactions.map(txn => enrichTransaction(txn, config, history))
  )
}

/**
 * Basic description cleaning (fallback)
 */
function cleanDescriptionBasic(description: string): string {
  return description
    .replace(/\d{10,}/g, "") // Remove long numbers
    .replace(/\*\d{4}/g, "") // Remove masked card numbers
    .replace(/\s+/g, " ") // Normalize spaces
    .trim()
}

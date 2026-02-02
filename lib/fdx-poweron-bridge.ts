/**
 * FDX-PowerOn Bridge
 * 
 * Maps PowerOn spec responses to FDX format
 * Integrates transaction enrichment into FDX responses
 */

import type { CreditUnionConfig } from "@/types/cu-config"
import { PowerOnService } from "@/lib/poweron-service"
import { getPowerOnConfig } from "@/lib/config-credentials"
import { enrichTransactionsBatch } from "@/lib/transaction-enrichment"
import type { FDXAccount, FDXTransaction } from "./fdx-integration"

export interface PowerOnAccount {
  accountId: string
  accountType: "share" | "loan"
  accountNumber: string
  name: string
  balance: number
  availableBalance?: number
}

export interface PowerOnTransaction {
  id: string
  accountId: string
  amount: number
  date: string
  description: string
  memo?: string
  mccCode?: string
}

/**
 * Get accounts from PowerOn and transform to FDX format
 */
export async function getAccountsFromPowerOn(
  memberId: string,
  _config: CreditUnionConfig,
  credentials: Awaited<ReturnType<typeof import("@/lib/config-credentials").loadCredentialsFromConfig>> | null
): Promise<FDXAccount[]> {
  try {
    // Initialize PowerOn service
    const powerOnConfig = getPowerOnConfig(credentials, undefined, memberId)
    const powerOn = new PowerOnService(powerOnConfig)
    await powerOn.connect()
    
    // Get member data (includes accounts)
    const memberResult = await powerOn.getMemberByAccountNumber(memberId)
    
    if (!memberResult.success || !memberResult.data) {
      return []
    }
    
    const member = memberResult.data
    
    // Transform PowerOn accounts to FDX format
    const fdxAccounts: FDXAccount[] = []
    
    // Shares
    if (member.shares) {
      for (const share of member.shares) {
        fdxAccounts.push({
          accountId: share.accountNumber || share.id,
          accountType: "deposit",
          accountNumber: share.accountNumber || share.id,
          name: share.name || share.description || "Share Account",
          balance: share.balance || 0,
          currency: "USD",
        })
      }
    }
    
    // Loans
    if (member.loans) {
      for (const loan of member.loans) {
        fdxAccounts.push({
          accountId: loan.accountNumber || loan.id,
          accountType: "loan",
          accountNumber: loan.accountNumber || loan.id,
          name: loan.name || loan.description || "Loan Account",
          balance: loan.balance || loan.principalBalance || 0,
          currency: "USD",
        })
      }
    }
    
    return fdxAccounts
  } catch (error) {
    console.error("[getAccountsFromPowerOn] Error:", error)
    return []
  }
}

/**
 * Get transactions from PowerOn, enrich them, and transform to FDX format
 */
export async function getTransactionsFromPowerOn(
  accountId: string,
  config: CreditUnionConfig,
  credentials: Awaited<ReturnType<typeof import("@/lib/config-credentials").loadCredentialsFromConfig>> | null,
  _startDate?: string,
  _endDate?: string
): Promise<FDXTransaction[]> {
  try {
    // Initialize PowerOn service
    const powerOnConfig = getPowerOnConfig(credentials, undefined, accountId)
    const powerOn = new PowerOnService(powerOnConfig)
    await powerOn.connect()
    
    // Get transactions from PowerOn
    const result = await powerOn.getTransactionHistory({
      accountId,
      accountType: "share",
      limit: 100,
    })
    
    if (!result.success || !result.data) {
      return []
    }
    
    const rawTransactions = result.data
    
    // Map to RawTransaction format for enrichment
    const rawTxnArray = rawTransactions.map((txn: Record<string, unknown>) => ({
      guid: txn.id || txn.guid || `TXN-${Date.now()}-${Math.random()}`,
      account_guid: accountId,
      amount: txn.amount || 0,
      description: txn.description || txn.memo || "",
      date: txn.date || txn.postDate || new Date().toISOString(),
      mcc_code: txn.mccCode || txn.mcc,
      latitude: txn.latitude,
      longitude: txn.longitude,
    }))
    
    // Enrich transactions if enabled
    let enrichedTransactions = rawTxnArray
    if (config.integrations.transaction_enrichment?.enabled) {
      try {
        enrichedTransactions = await enrichTransactionsBatch(
          rawTxnArray,
          config,
          accountId,
          rawTxnArray.slice(0, 90) // History for patterns
        )
      } catch (error) {
        console.warn("[getTransactionsFromPowerOn] Enrichment failed:", error)
        // Continue with unenriched transactions
      }
    }
    
    // Transform to FDX format
    const fdxTransactions: FDXTransaction[] = enrichedTransactions.map((txn) => ({
      transactionId: txn.guid,
      accountId,
      amount: txn.amount,
      date: txn.date,
      description: txn.cleaned_description || txn.description,
      category: txn.category_name,
      merchantName: txn.merchant_name,
    }))
    
    // Filter by date range if provided
    if (startDate || endDate) {
      return fdxTransactions.filter(txn => {
        const txnDate = new Date(txn.date)
        if (startDate && txnDate < new Date(startDate)) return false
        if (endDate && txnDate > new Date(endDate)) return false
        return true
      })
    }
    
    return fdxTransactions
  } catch (error) {
    console.error("[getTransactionsFromPowerOn] Error:", error)
    return []
  }
}

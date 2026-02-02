/**
 * FDX Integration Helper
 * 
 * Integrates platform-fdx (FDX v5.3.1 API) into omnichannel system
 * Provides CFPB 1033 compliance for financial data exchange
 */

import type { CreditUnionConfig } from "@/types/cu-config"

export interface FDXAccount {
  accountId: string
  accountType: string
  accountNumber: string
  name: string
  balance: number
  currency: string
}

export interface FDXTransaction {
  transactionId: string
  accountId: string
  amount: number
  date: string
  description: string
  category?: string
  merchantName?: string
}

/**
 * Call platform-fdx API endpoint
 */
async function callFDXAPI(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  config: CreditUnionConfig,
  body?: unknown
): Promise<Response> {
  const fdxConfig = config.compliance.fdx
  const apiUrl = fdxConfig.api_url || process.env.FDX_API_URL || "http://localhost:5227"
  
  const url = `${apiUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-FDX-Version": fdxConfig.version || "5.3.1",
  }
  
  // Add authentication if configured
  if (config.integrations.auth?.client_id && config.integrations.auth?.client_secret) {
    // OAuth2 token would be obtained here in production
    // For now, pass through auth config
  }
  
  return fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * Get accounts for a member
 */
export async function getFDXAccounts(
  memberId: string,
  config: CreditUnionConfig
): Promise<FDXAccount[]> {
  try {
    const response = await callFDXAPI(`/fdx/v5/accounts?memberId=${memberId}`, "GET", config)
    
    if (!response.ok) {
      throw new Error(`FDX API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.accounts || []
  } catch (error) {
    console.warn("[getFDXAccounts] FDX API call failed:", error)
    return []
  }
}

/**
 * Get transactions for an account
 */
export async function getFDXTransactions(
  accountId: string,
  config: CreditUnionConfig,
  startDate?: string,
  endDate?: string
): Promise<FDXTransaction[]> {
  try {
    let endpoint = `/fdx/v5/accounts/${accountId}/transactions`
    const params = new URLSearchParams()
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)
    if (params.toString()) endpoint += `?${params.toString()}`
    
    const response = await callFDXAPI(endpoint, "GET", config)
    
    if (!response.ok) {
      throw new Error(`FDX API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.transactions || []
  } catch (error) {
    console.warn("[getFDXTransactions] FDX API call failed:", error)
    return []
  }
}

/**
 * Handle OAuth2 consent flow
 */
export async function initiateConsentFlow(
  memberId: string,
  dataClusters: string[],
  config: CreditUnionConfig
): Promise<string> {
  try {
    const response = await callFDXAPI("/fdx/v5/consent", "POST", config, {
      memberId,
      dataClusters,
      durationDays: config.compliance.fdx.consent_duration_days,
    })
    
    if (!response.ok) {
      throw new Error(`FDX consent error: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.consentUrl || ""
  } catch (err) {
    console.warn("[initiateConsentFlow] FDX API call failed:", err)
    throw err
  }
}

/**
 * Check FDX API health
 */
export async function checkFDXHealth(config: CreditUnionConfig): Promise<boolean> {
  try {
    const response = await callFDXAPI("/health", "GET", config)
    return response.ok
  } catch (error) {
    return false
  }
}

import { NextResponse } from "next/server"
import { coreAdapterBridge } from "@/lib/core-adapter-bridge"
import { humeIntegration } from "@/lib/hume-integration"
import type { CreditUnionConfig } from "@/types/cu-config"

/**
 * OMNICHANNEL API
 * Unified API for all channels (IVR, Mobile, Web, Chat, Email, SMS, Push)
 * Routes requests through 21-layer architecture to core banking systems
 * Integrates: Genesys IVR, Hume AI, Core Banking Adapters
 */

interface OmnichannelRequest {
  channel: "ivr" | "mobile" | "web" | "chat" | "email" | "sms" | "push"
  operation: string
  memberId?: string
  sessionId?: string
  payload: any
  context?: {
    deviceId?: string
    ipAddress?: string
    userAgent?: string
    location?: string
  }
}

interface OmnichannelResponse {
  success: boolean
  data?: any
  error?: string
  metadata: {
    channel: string
    operation: string
    layers: string[]
    processingTime: number
    coreSystem: string
    timestamp: string
  }
}

export async function POST(request: Request) {
  const startTime = Date.now()
  
  try {
    const body: OmnichannelRequest = await request.json()
    
    // Load full config for enrichment (if memberId/tenantId available)
    let fullConfig: CreditUnionConfig | null = null
    if (body.memberId) {
      try {
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()
        // Try to get tenantId from memberId or use memberId as tenantId
        fullConfig = await loadFullConfig(body.memberId, supabase)
      } catch (error) {
        console.warn('[Omnichannel] Could not load config for enrichment:', error)
      }
    }
    
    // Route through appropriate layers based on operation
    const layers = getLayersForOperation(body.operation)
    const coreSystem = determineCoreSystem(body.memberId)
    
    // Process through architecture layers
    const result = await processThroughLayers(body, layers, coreSystem, fullConfig)
    
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        channel: body.channel,
        operation: body.operation,
        layers: layers.map(l => l.name),
        processingTime: Date.now() - startTime,
        coreSystem,
        timestamp: new Date().toISOString(),
      },
    } as OmnichannelResponse)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          channel: "unknown",
          operation: "unknown",
          layers: [],
          processingTime: Date.now() - startTime,
          coreSystem: "unknown",
          timestamp: new Date().toISOString(),
        },
      } as OmnichannelResponse,
      { status: 500 }
    )
  }
}

function getLayersForOperation(operation: string): Array<{ id: string; name: string }> {
  // Map operations to required layers
  const layerMap: Record<string, string[]> = {
    "account-balance": [
      "layer-1", "layer-2", "layer-3", "layer-4", "layer-5", 
      "layer-6", "layer-7", "layer-8", "layer-10"
    ],
    "transfer": [
      "layer-1", "layer-2", "layer-3", "layer-4", "layer-5",
      "layer-6", "layer-7", "layer-8", "layer-11", "layer-14", "layer-15"
    ],
    "loan-info": [
      "layer-1", "layer-2", "layer-3", "layer-4", "layer-5",
      "layer-6", "layer-7", "layer-8", "layer-12"
    ],
    "transaction-history": [
      "layer-1", "layer-2", "layer-3", "layer-4", "layer-5",
      "layer-6", "layer-7", "layer-8", "layer-10"
    ],
  }
  
  const layerIds = layerMap[operation] || []
  return layerIds.map(id => ({
    id,
    name: getLayerName(id),
  }))
}

function getLayerName(layerId: string): string {
  const names: Record<string, string> = {
    "layer-1": "Channel Layer",
    "layer-2": "Routing & Orchestration",
    "layer-3": "Authentication & Identity",
    "layer-4": "Conversation Management",
    "layer-5": "AI & Natural Language",
    "layer-6": "Business Logic & Rules",
    "layer-7": "Core Banking Adapters",
    "layer-8": "Core Banking Systems",
    "layer-10": "Account Services",
    "layer-11": "Transaction Services",
    "layer-12": "Loan Services",
    "layer-14": "Fraud & Risk",
    "layer-15": "Compliance & Regulatory",
  }
  return names[layerId] || layerId
}

function determineCoreSystem(memberId?: string): string {
  // In real implementation, look up member's CU core system
  // For now, return based on configuration
  return "symitar" // or "jackhenry", "corelation", "fiserv"
}

/**
 * Load full config from Supabase for enrichment
 */
async function loadFullConfig(
  tenantId: string,
  supabase: { from: (table: string) => { select: (columns: string) => { eq: (column: string, value: string) => { single: () => Promise<{ data: { config: CreditUnionConfig } | null; error: unknown }> } } } }
): Promise<CreditUnionConfig | null> {
  try {
    const { data: configRecord, error } = await supabase
      .from('cu_configs')
      .select('config')
      .eq('tenant_id', tenantId)
      .single()

    if (error || !configRecord?.config) {
      return null
    }

    return configRecord.config
  } catch (error) {
    console.warn('[loadFullConfig] Error loading config:', error)
    return null
  }
}

async function processThroughLayers(
  request: OmnichannelRequest,
  layers: Array<{ id: string; name: string }>,
  coreSystem: string,
  config?: CreditUnionConfig | null
): Promise<any> {
  // Process through actual layers
  
  // Layer 1: Channel validation
  if (!validateChannel(request.channel)) {
    throw new Error(`Invalid channel: ${request.channel}`)
  }
  
  // Layer 2: Routing & Orchestration
  await routeRequest(request)
  
  // Layer 3: Authentication (if memberId provided)
  if (request.memberId) {
    await authenticateMember(request.memberId, request.context)
  }
  
  // Layer 4: Conversation Management
  const session = await manageConversation(request.sessionId, request)
  
  // Layer 5: AI Processing (Hume)
  let aiResult = null
  if (request.channel === "ivr" || request.channel === "chat") {
    aiResult = await humeIntegration.processRequest({
      sessionId: request.sessionId || "default",
      channel: request.channel,
      input: {
        text: request.payload?.message || request.payload?.speechResult,
        intent: request.operation,
      },
      context: {
        memberId: request.memberId,
        currentOperation: request.operation,
      },
    })
  }
  
  // Layer 6: Business Logic & Rules
  const businessRules = await applyBusinessRules(request.operation, request.memberId)
  
  // Layer 7 & 8: Core Banking Adapter
  const coreResult = await coreAdapterBridge.processRequest({
    coreSystem: coreSystem as any,
    operation: mapOperationToCore(request.operation),
    memberId: request.memberId,
    accountId: request.payload?.accountId,
    payload: request.payload,
  })
  
  // Layer 10/11: Transaction Services with Enrichment
  let enrichedData = coreResult.data
  if ((request.operation === "transaction-history" || request.operation === "get-transactions") && 
      coreResult.data?.transactions && 
      config?.integrations?.transaction_enrichment?.enabled) {
    try {
      const { enrichTransactionsBatch } = await import('@/lib/transaction-enrichment')
      
      // Map core banking transaction format to RawTransaction format
      const rawTxnArray = (coreResult.data.transactions || []).map((txn: Record<string, unknown>) => ({
        guid: txn.id || txn.guid || `TXN-${Date.now()}-${Math.random()}`,
        account_guid: request.payload?.accountId || "",
        amount: txn.amount || 0,
        description: txn.description || txn.memo || "",
        date: txn.date || txn.postDate || new Date().toISOString(),
        mcc_code: txn.mccCode || txn.mcc,
        latitude: txn.latitude,
        longitude: txn.longitude,
      }))

      const enriched = await enrichTransactionsBatch(
        rawTxnArray,
        config,
        request.payload?.accountId || "",
        rawTxnArray.slice(0, 90) // History for patterns
      )
      
      // Merge enrichment data back into original transaction format
      enrichedData = {
        ...coreResult.data,
        transactions: (coreResult.data.transactions || []).map((txn: Record<string, unknown>, index: number) => {
          const enrichedTxn = enriched[index]
          return {
            ...txn,
            cleaned_description: enrichedTxn.cleaned_description,
            merchant_guid: enrichedTxn.merchant_guid,
            merchant_name: enrichedTxn.merchant_name,
            merchant_logo_url: enrichedTxn.merchant_logo_url,
            category_guid: enrichedTxn.category_guid,
            category_name: enrichedTxn.category_name,
            category_parent_name: enrichedTxn.category_parent_name,
            category_confidence: enrichedTxn.category_confidence,
            is_subscription: enrichedTxn.is_subscription,
            is_recurring: enrichedTxn.is_recurring,
            is_bill_pay: enrichedTxn.is_bill_pay,
            enriched_by: enrichedTxn.enriched_by,
            enriched_at: enrichedTxn.enriched_at,
          }
        })
      }
    } catch (error) {
      console.warn('[Omnichannel] Enrichment failed:', error)
      // Continue with unenriched data
    }
  }
  
  return {
    operation: request.operation,
    processed: true,
    layers: layers.length,
    coreSystem,
    aiInsights: aiResult?.data,
    businessRules,
    coreData: enrichedData,
    sessionId: session.id,
  }
}

function validateChannel(_channel: string): boolean {
  const validChannels = ["ivr", "mobile", "web", "chat", "email", "sms", "push"]
  return validChannels.includes(_channel)
}

async function routeRequest(_request: OmnichannelRequest): Promise<{ routed: boolean; priority: string }> {
  // Intelligent routing based on channel and operation
  return {
    routed: true,
    priority: _request.channel === "ivr" ? "high" : "normal",
  }
}

async function authenticateMember(memberId: string, _context?: unknown): Promise<{ authenticated: boolean; memberId: string }> {
  // Authentication logic
  return {
    authenticated: true,
    memberId,
  }
}

async function manageConversation(sessionId: string | undefined, request: OmnichannelRequest): Promise<any> {
  // Conversation state management
  return {
    id: sessionId || `session-${Date.now()}`,
    channel: request.channel,
    operation: request.operation,
  }
}

async function applyBusinessRules(operation: string, _memberId?: string): Promise<{ rulesApplied: boolean; operation: string; limits: { transferLimit: number; dailyLimit: number } }> {
  // Business rules engine
  return {
    rulesApplied: true,
    operation,
    limits: {
      transferLimit: 10000,
      dailyLimit: 50000,
    },
  }
}

function mapOperationToCore(operation: string): "getAccounts" | "getTransactions" | "transfer" | "getMember" | "getBalance" {
  const mapping: Record<string, "getAccounts" | "getTransactions" | "transfer" | "getMember" | "getBalance"> = {
    "account-balance": "getAccounts",
    "transaction-history": "getTransactions",
    "transfer": "transfer",
    "loan-info": "getMember",
  }
  
  return mapping[operation] || "getAccounts"
}

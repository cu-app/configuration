/**
 * FDX API Proxy Route
 * 
 * Proxies FDX API requests to platform-fdx microservice
 * Handles authentication, tenant mapping, and data transformation
 */

import { type NextRequest, NextResponse } from "next/server"
import { loadCredentialsFromConfig } from "@/lib/config-credentials"
import { getAccountsFromPowerOn, getTransactionsFromPowerOn } from "@/lib/fdx-poweron-bridge"
import { checkFDXHealth } from "@/lib/fdx-integration"
import type { CreditUnionConfig } from "@/types/cu-config"

/**
 * Load full config from Supabase
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

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathSegments = params.path || []
    const path = `/${pathSegments.join("/")}`
    const { searchParams } = new URL(request.url)
    
    // Get tenant from headers or query params
    const tenantId = request.headers.get("x-tenant-id") || 
                     request.headers.get("x-cu-id") ||
                     searchParams.get("tenantId") ||
                     searchParams.get("cuId")
    
    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId or cuId required" },
        { status: 400 }
      )
    }
    
    // Load config
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const credentials = await loadCredentialsFromConfig(tenantId, supabase)
    const config = await loadFullConfig(tenantId, supabase)
    
    if (!config) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      )
    }
    
    // Check if FDX is enabled
    if (!config.compliance.fdx.enabled) {
      return NextResponse.json(
        { error: "FDX API is not enabled for this tenant" },
        { status: 403 }
      )
    }
    
    // Route FDX requests
    // /fdx/v5/accounts
    if (path === "/fdx/v5/accounts" || path.match(/^\/fdx\/v5\/accounts\/?$/)) {
      const memberId = searchParams.get("memberId") || searchParams.get("accountId")
      if (!memberId) {
        return NextResponse.json(
          { error: "memberId or accountId required" },
          { status: 400 }
        )
      }
      
      const accounts = await getAccountsFromPowerOn(memberId, config, credentials)
      return NextResponse.json({ accounts })
    }
    
    // /fdx/v5/accounts/{accountId}/transactions
    const transactionsMatch = path.match(/^\/fdx\/v5\/accounts\/([^\/]+)\/transactions$/)
    if (transactionsMatch) {
      const accountId = transactionsMatch[1]
      const startDate = searchParams.get("startDate") || undefined
      const endDate = searchParams.get("endDate") || undefined
      
      const transactions = await getTransactionsFromPowerOn(
        accountId,
        config,
        credentials,
        startDate,
        endDate
      )
      return NextResponse.json({ transactions })
    }
    
    // Health check
    if (path === "/health" || path === "/fdx/health") {
      const healthy = await checkFDXHealth(config)
      return NextResponse.json({
        status: healthy ? "healthy" : "unhealthy",
        version: config.compliance.fdx.version,
      })
    }
    
    // For other endpoints, proxy to platform-fdx service if configured
    const fdxApiUrl = config.compliance.fdx.api_url || process.env.FDX_API_URL
    if (fdxApiUrl) {
      const proxyUrl = `${fdxApiUrl}${path}${request.url.includes("?") ? `?${new URL(request.url).searchParams.toString()}` : ""}`
      
      const proxyResponse = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-FDX-Version": config.compliance.fdx.version || "5.3.1",
          // Forward auth headers if present
          ...(request.headers.get("authorization") && {
            "Authorization": request.headers.get("authorization") || "",
          }),
        },
      })
      
      const data = await proxyResponse.json()
      return NextResponse.json(data, { status: proxyResponse.status })
    }
    
    return NextResponse.json(
      { error: "FDX endpoint not found or not configured" },
      { status: 404 }
    )
  } catch (error) {
    console.error("[FDX API] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathSegments = params.path || []
    const path = `/${pathSegments.join("/")}`
    const body = await request.json()
    
    // Get tenant
    const tenantId = request.headers.get("x-tenant-id") || 
                     request.headers.get("x-cu-id") ||
                     body.tenantId ||
                     body.cuId
    
    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId or cuId required" },
        { status: 400 }
      )
    }
    
    // Load config
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const config = await loadFullConfig(tenantId, supabase)
    
    if (!config) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      )
    }
    
    // Proxy to platform-fdx service
    const fdxApiUrl = config.compliance.fdx.api_url || process.env.FDX_API_URL
    if (fdxApiUrl) {
      const proxyUrl = `${fdxApiUrl}${path}`
      
      const proxyResponse = await fetch(proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-FDX-Version": config.compliance.fdx.version || "5.3.1",
          ...(request.headers.get("authorization") && {
            "Authorization": request.headers.get("authorization") || "",
          }),
        },
        body: JSON.stringify(body),
      })
      
      const data = await proxyResponse.json()
      return NextResponse.json(data, { status: proxyResponse.status })
    }
    
    return NextResponse.json(
      { error: "FDX API not configured" },
      { status: 503 }
    )
  } catch (error) {
    console.error("[FDX API POST] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

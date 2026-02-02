/**
 * Integration Status API
 * 
 * Checks connection status for all integrations configured in Configuration → Integrations
 * Used by the UI to show which integrations are connected and working
 */

import { NextResponse } from "next/server"
import { loadCredentialsFromConfig, getPowerOnConfig, getHumeCredentials, getTwilioCredentials } from "@/lib/config-credentials"
import { PowerOnService } from "@/lib/poweron-service"
import type { CreditUnionConfig } from "@/types/cu-config"

/**
 * Load full config from Supabase for enrichment status
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || searchParams.get('cuId') || searchParams.get('tenant_prefix')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId, cuId, or tenant_prefix required' },
        { status: 400 }
      )
    }

    // Load credentials and full config from config
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const credentials = await loadCredentialsFromConfig(tenantId, supabase)
    const fullConfig = await loadFullConfig(tenantId, supabase)

    const status: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      tenantId,
    }

    // Check PowerOn/Symitar connection
    try {
      const powerOnConfig = getPowerOnConfig(credentials, undefined, tenantId)
      const powerOn = new PowerOnService(powerOnConfig)
      await powerOn.connect()
      
      // Connection successful (we don't need to test with actual member number)
      status.poweron = {
        connected: true,
        mode: powerOnConfig.mode || 'mock',
        responseTime: Date.now(),
        message: powerOnConfig.mode === 'mock' 
          ? 'Using mock data (no real connection)' 
          : 'Connected to core banking',
      }
    } catch (error) {
      status.poweron = {
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed',
        responseTime: Date.now(),
      }
    }

    // Check Hume AI connection
    try {
      const hume = getHumeCredentials(credentials)
      if (hume.enabled && hume.apiKey) {
        // Test Hume API connection
        const testResponse = await fetch('https://api.hume.ai/v0/evi/configs', {
          headers: {
            'X-Hume-Api-Key': hume.apiKey,
          },
        })

        status.hume = {
          connected: testResponse.ok,
          enabled: hume.enabled,
          projectId: hume.projectId,
          responseTime: Date.now(),
          message: testResponse.ok ? 'Connected to Hume AI' : 'Hume API error',
        }
      } else {
        status.hume = {
          connected: false,
          enabled: false,
          message: 'Hume not configured',
        }
      }
    } catch (error) {
      status.hume = {
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed',
        responseTime: Date.now(),
      }
    }

    // Check Twilio connection
    try {
      const twilio = getTwilioCredentials(credentials)
      if (twilio.accountSid && twilio.authToken) {
        // Test Twilio API connection
        const auth = Buffer.from(`${twilio.accountSid}:${twilio.authToken}`).toString('base64')
        const testResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilio.accountSid}.json`, {
          headers: {
            'Authorization': `Basic ${auth}`,
          },
        })

        status.twilio = {
          connected: testResponse.ok,
          phoneNumber: twilio.phoneNumber,
          responseTime: Date.now(),
          message: testResponse.ok ? 'Connected to Twilio' : 'Twilio API error',
        }
      } else {
        status.twilio = {
          connected: false,
          message: 'Twilio not configured',
        }
      }
    } catch (error) {
      status.twilio = {
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed',
        responseTime: Date.now(),
      }
    }

    // Check Transaction Enrichment connection
    try {
      const enrichment = fullConfig?.integrations?.transaction_enrichment
      if (enrichment?.enabled && enrichment?.provider === "internal") {
        const workerUrl = enrichment.worker_url || process.env.TRANSACTION_ENRICHMENT_URL
        if (workerUrl) {
          const testResponse = await fetch(`${workerUrl}/health`, {
            method: "GET",
            headers: enrichment.api_key ? {
              "Authorization": `Bearer ${enrichment.api_key}`,
            } : {},
          })

          status.transaction_enrichment = {
            connected: testResponse.ok,
            provider: "internal",
            worker_url: workerUrl,
            responseTime: Date.now(),
            message: testResponse.ok 
              ? "Connected to CU.APP Edge Service" 
              : "Connection failed",
            savings: "$49,940/year vs MX",
          }
        } else {
          status.transaction_enrichment = {
            connected: false,
            message: "Worker URL not configured",
          }
        }
      } else if (enrichment?.provider === "mx") {
        status.transaction_enrichment = {
          connected: false,
          provider: "mx",
          message: "Using MX.com ($50K/year)",
          cost: "$50,000/year",
        }
      } else if (enrichment?.provider === "plaid") {
        status.transaction_enrichment = {
          connected: false,
          provider: "plaid",
          message: "Using Plaid",
        }
      } else {
        status.transaction_enrichment = {
          connected: false,
          enabled: false,
          message: "Transaction enrichment disabled",
        }
      }
    } catch (error) {
      status.transaction_enrichment = {
        connected: false,
        error: error instanceof Error ? error.message : "Connection failed",
      }
    }

    // Check FDX API connection
    try {
      if (fullConfig?.compliance?.fdx?.enabled) {
        const { checkFDXHealth } = await import('@/lib/fdx-integration')
        const fdxHealthy = await checkFDXHealth(fullConfig)
        
        status.fdx = {
          connected: fdxHealthy,
          version: fullConfig.compliance.fdx.version || "5.3.1",
          api_url: fullConfig.compliance.fdx.api_url || "Not configured",
          responseTime: Date.now(),
          message: fdxHealthy 
            ? `FDX v${fullConfig.compliance.fdx.version} connected` 
            : "FDX API not responding",
        }
      } else {
        status.fdx = {
          connected: false,
          enabled: false,
          message: "FDX not enabled",
        }
      }
    } catch (error) {
      status.fdx = {
        connected: false,
        error: error instanceof Error ? error.message : "Connection failed",
      }
    }

    // Overall status
    const allConnected = status.poweron?.connected && 
                        (status.hume?.connected || !status.hume?.enabled) &&
                        (status.twilio?.connected || !status.twilio?.phoneNumber) &&
                        (status.transaction_enrichment?.connected || !status.transaction_enrichment?.enabled) &&
                        (status.fdx?.connected || !status.fdx?.enabled)

    return NextResponse.json({
      ...status,
      overall: {
        connected: allConnected,
        message: allConnected 
          ? 'All configured integrations connected' 
          : 'Some integrations need configuration',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

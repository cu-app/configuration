/**
 * Config Credentials Helper
 * 
 * Centralized helper to load credentials from Configuration → Integrations
 * Used by all API routes (GraphQL, IVR, Auth, Omnichannel) to get credentials
 * 
 * Flow:
 * 1. Try to load from Supabase config (Configuration → Integrations)
 * 2. Fall back to environment variables if config not found
 * 3. Return credentials in format expected by services
 */

import type { CreditUnionConfig } from "@/types/cu-config"
import type { PowerOnConfig } from "@/lib/poweron-service"

export interface LoadedCredentials {
  poweron: Partial<PowerOnConfig>
  hume?: {
    apiKey?: string
    projectId?: string
    enabled: boolean
  }
  twilio?: {
    accountSid?: string
    authToken?: string
    phoneNumber?: string
  }
  auth?: {
    provider: string
    baseUrl?: string
    clientId?: string
    clientSecret?: string
    redirectUri?: string
  }
}

/**
 * Load credentials from Supabase config for a tenant
 */
export async function loadCredentialsFromConfig(
  tenantId: string,
  supabase: { from: (table: string) => { select: (columns: string) => { eq: (column: string, value: string) => { single: () => Promise<{ data: { config: CreditUnionConfig } | null; error: unknown }> } } } }
): Promise<LoadedCredentials | null> {
  try {
    const { data: configRecord, error } = await supabase
      .from('cu_configs')
      .select('config')
      .eq('tenant_id', tenantId)
      .single()

    if (error || !configRecord?.config) {
      return null
    }

    const config: CreditUnionConfig = configRecord.config
    const integrations = config.integrations

    const credentials: LoadedCredentials = {
      poweron: {},
      hume: {
        enabled: integrations.hume?.enabled || false,
        apiKey: integrations.hume?.api_key,
        projectId: integrations.hume?.project_id,
      },
      twilio: {
        accountSid: integrations.sms?.api_key, // Map SMS API key to Twilio account SID
        authToken: integrations.sms?.api_secret,
        phoneNumber: integrations.sms?.from_number,
      },
      auth: {
        provider: integrations.auth?.provider || 'internal',
        baseUrl: integrations.auth?.base_url,
        clientId: integrations.auth?.client_id,
        clientSecret: integrations.auth?.client_secret,
        redirectUri: integrations.auth?.redirect_uri,
      },
    }

    // Load PowerOn credentials
    if (integrations.core?.poweron) {
      const poweron = integrations.core.poweron
      credentials.poweron = {
        mode: poweron.mode || 'mock',
        symxchangeUrl: poweron.symxchange_url,
        symxchangeApiKey: poweron.symxchange_api_key,
        hostAddress: poweron.poweron_host,
        hostPort: poweron.poweron_port,
        institutionId: poweron.institution_id,
        deviceNumber: poweron.device_number,
        deviceType: poweron.device_type,
        processorUser: poweron.processor_user,
      }
    }

    return credentials
  } catch (error) {
    console.warn('[loadCredentialsFromConfig] Error loading config:', error)
    return null
  }
}

/**
 * Load PowerOn config from credentials or environment
 */
export function getPowerOnConfig(
  credentials: LoadedCredentials | null,
  tenantPrefix?: string,
  cuId?: string
): Partial<PowerOnConfig> {
  const config: Partial<PowerOnConfig> = {
    tenantPrefix,
    cuId,
  }

  if (credentials?.poweron) {
    // Use credentials from config
    Object.assign(config, credentials.poweron)
  } else {
    // Fall back to environment variables
    config.mode = (process.env.POWERON_MODE as 'mock' | 'symxchange' | 'direct') || 'mock'
    config.symxchangeUrl = process.env.SYMXCHANGE_URL
    config.symxchangeApiKey = process.env.SYMXCHANGE_API_KEY
    config.hostAddress = process.env.POWERON_HOST
    config.hostPort = parseInt(process.env.POWERON_PORT || '443')
    config.institutionId = process.env.INSTITUTION_ID
  }

  return config
}

/**
 * Get Hume credentials from config or environment
 */
export function getHumeCredentials(credentials: LoadedCredentials | null): {
  apiKey?: string
  projectId?: string
  enabled: boolean
} {
  if (credentials?.hume) {
    return credentials.hume
  }

  // Fall back to environment
  return {
    apiKey: process.env.HUME_API_KEY,
    projectId: process.env.HUME_PROJECT_ID,
    enabled: !!process.env.HUME_API_KEY,
  }
}

/**
 * Get Twilio credentials from config or environment
 */
export function getTwilioCredentials(credentials: LoadedCredentials | null): {
  accountSid?: string
  authToken?: string
  phoneNumber?: string
} {
  if (credentials?.twilio) {
    return credentials.twilio
  }

  // Fall back to environment
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  }
}

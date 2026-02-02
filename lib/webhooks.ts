// Webhooks: Notify subscribed endpoints when configuration changes
// Part of the distribution pipeline: Dashboard → Supabase → GitHub → CDN → Apps (webhooks)

import * as crypto from 'crypto'

export interface WebhookPayload {
  event: 'config.updated' | 'config.published' | 'config.deleted'
  tenant_id: string
  version: string
  timestamp: string
  changed_fields?: string[]
  config_url?: string
  metadata?: Record<string, unknown>
}

export interface WebhookResult {
  url: string
  success: boolean
  status_code?: number
  error?: string
  duration_ms: number
}

export interface WebhookTarget {
  url: string
  secret?: string
  events?: string[]
}

/**
 * Fire webhooks to all registered endpoints
 */
export async function fireWebhooks(
  targets: WebhookTarget[],
  payload: WebhookPayload
): Promise<WebhookResult[]> {
  const results = await Promise.all(
    targets.map(target => fireWebhook(target, payload))
  )
  return results
}

/**
 * Fire a single webhook
 */
export async function fireWebhook(
  target: WebhookTarget,
  payload: WebhookPayload
): Promise<WebhookResult> {
  const startTime = Date.now()

  try {
    const body = JSON.stringify(payload)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': payload.event,
      'X-Webhook-Timestamp': payload.timestamp,
      'X-Webhook-Delivery': crypto.randomUUID(),
    }

    // Add signature if secret is configured
    if (target.secret) {
      const signature = generateSignature(body, target.secret)
      headers['X-Webhook-Signature'] = signature
      headers['X-Webhook-Signature-256'] = `sha256=${signature}`
    }

    const response = await fetch(target.url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    return {
      url: target.url,
      success: response.ok,
      status_code: response.status,
      duration_ms: Date.now() - startTime,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      url: target.url,
      success: false,
      error: message,
      duration_ms: Date.now() - startTime,
    }
  }
}

/**
 * Generate HMAC signature for webhook verification
 */
function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex')
}

/**
 * Verify an incoming webhook signature
 * Use this on the receiving end to verify authenticity
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret)

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

/**
 * Create a webhook payload for config update events
 */
export function createConfigUpdatePayload(
  tenantId: string,
  version: string,
  changedFields?: string[],
  configUrl?: string
): WebhookPayload {
  return {
    event: 'config.updated',
    tenant_id: tenantId,
    version,
    timestamp: new Date().toISOString(),
    changed_fields: changedFields,
    config_url: configUrl,
  }
}

/**
 * Create a webhook payload for config publish events
 */
export function createConfigPublishPayload(
  tenantId: string,
  version: string,
  configUrl: string,
  metadata?: Record<string, unknown>
): WebhookPayload {
  return {
    event: 'config.published',
    tenant_id: tenantId,
    version,
    timestamp: new Date().toISOString(),
    config_url: configUrl,
    metadata,
  }
}

/**
 * Retry a failed webhook with exponential backoff
 */
export async function retryWebhook(
  target: WebhookTarget,
  payload: WebhookPayload,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<WebhookResult> {
  let lastResult: WebhookResult | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 1s, 2s, 4s, 8s, etc.
      const delay = initialDelayMs * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    const result = await fireWebhook(target, payload)
    lastResult = result

    if (result.success) {
      return result
    }

    // Don't retry on client errors (4xx)
    if (result.status_code && result.status_code >= 400 && result.status_code < 500) {
      return result
    }
  }

  return lastResult || {
    url: target.url,
    success: false,
    error: 'Max retries exceeded',
    duration_ms: 0,
  }
}

/**
 * Get webhook targets from database for a tenant
 * In production, this would query Supabase for registered webhooks
 */
export async function getWebhookTargets(
  _tenantId: string,
  _event?: string
): Promise<WebhookTarget[]> {
  // TODO: Query Supabase for registered webhooks
  // For now, check environment variables for default webhooks

  const targets: WebhookTarget[] = []

  // Check for default webhook URL in environment
  const defaultWebhookUrl = process.env.DEFAULT_WEBHOOK_URL
  const defaultWebhookSecret = process.env.DEFAULT_WEBHOOK_SECRET

  if (defaultWebhookUrl) {
    targets.push({
      url: defaultWebhookUrl,
      secret: defaultWebhookSecret,
    })
  }

  return targets
}

/**
 * Log webhook delivery for audit trail
 */
export interface WebhookLog {
  id: string
  tenant_id: string
  event: string
  target_url: string
  payload: WebhookPayload
  result: WebhookResult
  created_at: string
}

export function createWebhookLog(
  tenantId: string,
  payload: WebhookPayload,
  result: WebhookResult
): WebhookLog {
  return {
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    event: payload.event,
    target_url: result.url,
    payload,
    result,
    created_at: new Date().toISOString(),
  }
}

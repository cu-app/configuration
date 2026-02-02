import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncToGitHub } from '@/lib/github-sync'
import { uploadTocdn, getConfigURL } from '@/lib/cdn-upload'
import {
  fireWebhooks,
  getWebhookTargets,
  createConfigPublishPayload,
  createWebhookLog,
} from '@/lib/webhooks'
import type { ConfigDistribution } from '@/types/unified-config'

export interface PublishRequest {
  tenantId: string
  version?: string
  targets?: ('github' | 'cdn' | 'webhooks')[]
}

export interface PublishResponse {
  success: boolean
  published_to: string[]
  distribution: ConfigDistribution
  errors?: string[]
}

/**
 * POST /api/publish
 * Orchestrates distribution of configuration after save
 *
 * Flow:
 * 1. Fetch config from Supabase (already saved)
 * 2. Push to GitHub (if enabled)
 * 3. Upload to CDN (if enabled)
 * 4. Fire webhooks (if enabled)
 * 5. Return distribution status
 */
export async function POST(req: NextRequest): Promise<NextResponse<PublishResponse | { error: string }>> {
  try {
    const body: PublishRequest = await req.json()
    const { tenantId, targets = ['github', 'cdn', 'webhooks'] } = body

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    // Initialize Supabase client
    const supabase = await createClient()

    // 1. Fetch the current config from Supabase
    const { data: configRecord, error: fetchError } = await supabase
      .from('cu_configs')
      .select('*')
      .eq('charter_number', tenantId)
      .single()

    if (fetchError || !configRecord) {
      return NextResponse.json(
        { error: `Config not found for tenant ${tenantId}` },
        { status: 404 }
      )
    }

    const config = configRecord.config || {}
    const version = body.version || configRecord.version || '1.0.0'
    const tenantName = configRecord.credit_union_name || tenantId
    const charterNumber = configRecord.charter_number || tenantId

    // Initialize distribution tracking
    const distribution: ConfigDistribution = {
      tenant_id: tenantId,
      version,
      distributed_at: new Date().toISOString(),
      targets: {
        supabase: {
          success: true,
          timestamp: new Date().toISOString(),
        },
      },
    }

    const publishedTo: string[] = ['supabase']
    const errors: string[] = []

    // 2. Push to GitHub (if enabled and configured)
    if (targets.includes('github') && process.env.GITHUB_TOKEN) {
      const githubResult = await syncToGitHub({
        tenantId,
        tenantName,
        charterNumber,
        config,
        version,
      })

      distribution.targets.github = {
        success: githubResult.success,
        repo: githubResult.repo || '',
        commit: githubResult.commit || '',
        timestamp: new Date().toISOString(),
      }

      if (githubResult.success) {
        publishedTo.push('github')
      } else if (githubResult.error) {
        errors.push(`GitHub: ${githubResult.error}`)
      }
    }

    // 3. Upload to CDN (if enabled and configured)
    if (targets.includes('cdn') && process.env.BLOB_READ_WRITE_TOKEN) {
      const cdnResult = await uploadTocdn({
        tenantId,
        config,
        version,
      })

      distribution.targets.cdn = {
        success: cdnResult.success,
        url: cdnResult.url || getConfigURL(tenantId),
        timestamp: new Date().toISOString(),
      }

      if (cdnResult.success) {
        publishedTo.push('cdn')
      } else if (cdnResult.error) {
        errors.push(`CDN: ${cdnResult.error}`)
      }
    }

    // 4. Fire webhooks (if enabled)
    if (targets.includes('webhooks')) {
      const webhookTargets = await getWebhookTargets(tenantId, 'config.published')

      if (webhookTargets.length > 0) {
        const configUrl = distribution.targets.cdn?.url || getConfigURL(tenantId)
        const payload = createConfigPublishPayload(tenantId, version, configUrl, {
          github_repo: distribution.targets.github?.repo,
          github_commit: distribution.targets.github?.commit,
        })

        const webhookResults = await fireWebhooks(webhookTargets, payload)

        distribution.targets.webhooks = webhookResults.map(result => ({
          url: result.url,
          success: result.success,
          status_code: result.status_code || 0,
          timestamp: new Date().toISOString(),
        }))

        const successfulWebhooks = webhookResults.filter(r => r.success).length
        if (successfulWebhooks > 0) {
          publishedTo.push('webhooks')
        }

        // Log any webhook failures
        webhookResults
          .filter(r => !r.success)
          .forEach(r => {
            const log = createWebhookLog(tenantId, payload, r)
            console.warn('[publish] Webhook failed:', log)
            if (r.error) {
              errors.push(`Webhook ${r.url}: ${r.error}`)
            }
          })
      }
    }

    // 5. Update Supabase with distribution record
    await supabase
      .from('cu_configs')
      .update({
        last_published_at: new Date().toISOString(),
        last_published_version: version,
        distribution_status: distribution,
      })
      .eq('charter_number', tenantId)

    // Return the response
    const response: PublishResponse = {
      success: errors.length === 0,
      published_to: publishedTo,
      distribution,
    }

    if (errors.length > 0) {
      response.errors = errors
    }

    return NextResponse.json(response)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[publish] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * GET /api/publish?tenantId=xxx
 * Get the current distribution status for a tenant
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: configRecord, error } = await supabase
      .from('cu_configs')
      .select('charter_number, credit_union_name, version, last_published_at, last_published_version, distribution_status')
      .eq('charter_number', tenantId)
      .single()

    if (error || !configRecord) {
      return NextResponse.json(
        { error: `Config not found for tenant ${tenantId}` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      tenant_id: configRecord.charter_number,
      tenant_name: configRecord.credit_union_name,
      current_version: configRecord.version,
      last_published_at: configRecord.last_published_at,
      last_published_version: configRecord.last_published_version,
      distribution_status: configRecord.distribution_status,
      config_url: getConfigURL(tenantId),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[publish] GET Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

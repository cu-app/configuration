import { type NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/**
 * Resolve tenant logo URL from DB when not set in config.
 * Uses charter number (from config record) to look up credit_unions or ncua_credit_unions.
 */
async function resolveTenantLogoUrl(
  supabase: SupabaseClient,
  charterNumber: string
): Promise<string | null> {
  const charterNum = parseInt(charterNumber, 10)
  if (!Number.isNaN(charterNum)) {
    const { data: cu } = await supabase
      .from('credit_unions')
      .select('logo_url')
      .eq('charter', charterNum)
      .maybeSingle()
    if (cu?.logo_url) return cu.logo_url
  }
  const { data: ncua } = await supabase
    .from('ncua_credit_unions')
    .select('logo_url')
    .eq('charter_number', charterNumber)
    .maybeSingle()
  if (ncua?.logo_url) return ncua.logo_url
  return null
}

/**
 * GET /api/config/[tenantId]
 * Public endpoint for apps to fetch configuration
 *
 * This is the endpoint that mobile apps call on startup to get their config.
 * Returns the full configuration JSON for the specified tenant.
 *
 * Headers:
 * - Cache-Control: 5 minute cache with stale-while-revalidate
 * - ETag: For conditional requests
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
): Promise<NextResponse> {
  try {
    const { tenantId } = await params
    const charterFromQuery = req.nextUrl.searchParams.get('charter') ?? undefined

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch config by tenant_id (e.g. cu_navy_federal) OR charter_number (e.g. 5536)
    const { data: configRecord, error } = await supabase
      .from('cu_configs')
      .select('tenant_id, charter_number, credit_union_name, config, version, updated_at')
      .or(`tenant_id.eq.${tenantId},charter_number.eq.${tenantId}`)
      .maybeSingle()

    if (error || !configRecord) {
      // No saved config: if charter was passed, return minimal config with logo so app can show it
      if (charterFromQuery) {
        const logoUrl = await resolveTenantLogoUrl(supabase, charterFromQuery)
        const charterNum = parseInt(charterFromQuery, 10)
        let name = tenantId
        if (!Number.isNaN(charterNum)) {
          const { data: cu } = await supabase
            .from('credit_unions')
            .select('name')
            .eq('charter', charterNum)
            .maybeSingle()
          if (cu?.name) name = cu.name
        } else {
          const { data: ncua } = await supabase
            .from('ncua_credit_unions')
            .select('cu_name')
            .eq('charter_number', charterFromQuery)
            .maybeSingle()
          if ((ncua as { cu_name?: string })?.cu_name) name = (ncua as { cu_name: string }).cu_name
        }
        const minimalConfig = {
          tenant: { name, logo_url: logoUrl ?? '' },
          tokens: {
            color: { primary: '#00D632' },
            logo: logoUrl ? { primary: logoUrl, mark: '', wordmark: '' } : { primary: '', mark: '', wordmark: '' },
          },
          content: { app_name: name },
        }
        return NextResponse.json(
          {
            tenant_id: tenantId,
            tenant_name: name,
            version: '0.0.0',
            updated_at: new Date().toISOString(),
            config: minimalConfig,
          },
          {
            headers: {
              'Cache-Control': 'public, max-age=60',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }
      return NextResponse.json(
        { error: `Configuration not found for tenant: ${tenantId}` },
        { status: 404 }
      )
    }

    const record = configRecord as { tenant_id?: string; charter_number?: string; credit_union_name?: string }
    const charterNumber =
      record.charter_number ?? charterFromQuery ?? tenantId

    // Generate ETag from version and update time
    const etag = `"${configRecord.version}-${new Date(configRecord.updated_at).getTime()}"`

    // Deep clone config so we can enrich without mutating stored data
    const config = JSON.parse(JSON.stringify(configRecord.config || {}))

    // Ensure each tenant's logo is in the config for the Flutter app
    const existingLogo =
      config.tokens?.logo?.primary ?? config.tenant?.logo_url ?? ''
    if (!existingLogo || existingLogo.trim() === '') {
      const tenantLogoUrl = await resolveTenantLogoUrl(supabase, charterNumber)
      if (tenantLogoUrl) {
        if (!config.tokens) config.tokens = {}
        if (!config.tokens.logo) config.tokens.logo = { primary: '', mark: '', wordmark: '' }
        config.tokens.logo.primary = tenantLogoUrl
      }
    }

    // Build the response with full config (including enriched logo)
    const response = {
      tenant_id: record.tenant_id ?? record.charter_number ?? tenantId,
      tenant_name: configRecord.credit_union_name,
      version: configRecord.version,
      updated_at: configRecord.updated_at,
      config,
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        'ETag': etag,
        'X-Config-Version': configRecord.version,
        'Access-Control-Allow-Origin': '*', // Allow cross-origin for mobile apps
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[config] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * HEAD /api/config/[tenantId]
 * Check config version without downloading full payload
 * Useful for mobile apps to check if config has changed
 */
export async function HEAD(
  _req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
): Promise<NextResponse> {
  try {
    const { tenantId } = await params

    if (!tenantId) {
      return new NextResponse(null, { status: 400 })
    }

    const supabase = await createClient()

    const { data: configRecord, error } = await supabase
      .from('cu_configs')
      .select('version, updated_at')
      .eq('charter_number', tenantId)
      .single()

    if (error || !configRecord) {
      return new NextResponse(null, { status: 404 })
    }

    const etag = `"${configRecord.version}-${new Date(configRecord.updated_at).getTime()}"`

    return new NextResponse(null, {
      status: 200,
      headers: {
        'ETag': etag,
        'X-Config-Version': configRecord.version,
        'Last-Modified': new Date(configRecord.updated_at).toUTCString(),
      },
    })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}

/**
 * OPTIONS /api/config/[tenantId]
 * CORS preflight handler
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  })
}

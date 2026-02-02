import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/config/save
 *
 * Saves tenant configuration to Supabase
 * Stores config in credit_unions table (primary_color, config JSONB)
 * Uses admin client to bypass RLS for write operations
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { charter, config } = body

    if (!charter) {
      return NextResponse.json({ error: 'charter is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const charterNum = parseInt(charter)

    // Extract color from config (supports multiple schema formats)
    const primaryColor = config.branding?.primaryColor || config.primaryColor || null
    const logoUrl = config.branding?.logoUrl || config.logoUrl || null

    // Update the credit_unions table directly
    // Store the full config as JSONB if the column exists, otherwise just update branding fields
    const updateData: Record<string, unknown> = {}

    if (primaryColor) {
      updateData.primary_color = primaryColor
    }
    if (logoUrl) {
      updateData.logo_url = logoUrl
    }
    // Store full config as JSONB (if column exists, will be ignored if not)
    updateData.config = config
    updateData.updated_at = new Date().toISOString()

    // First try with config column
    let { data, error } = await supabase
      .from('credit_unions')
      .update(updateData)
      .eq('charter', charterNum)
      .select('charter, name, primary_color, logo_url')
      .single()

    // If config column doesn't exist, retry without it
    if (error && error.message?.includes('config')) {
      delete updateData.config
      const retry = await supabase
        .from('credit_unions')
        .update(updateData)
        .eq('charter', charterNum)
        .select('charter, name, primary_color, logo_url')
        .single()

      data = retry.data
      error = retry.error
    }

    if (error) {
      console.error('[config/save] Error:', error)
      return NextResponse.json({
        error: error.message,
        hint: 'Ensure the credit_unions table exists and the charter is valid'
      }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({
        error: 'Credit union not found',
        charter: charterNum
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Config saved successfully',
      charter: charterNum,
      data: {
        charter: data.charter,
        name: data.name,
        primary_color: data.primary_color,
        logo_url: data.logo_url,
      },
    })
  } catch (error) {
    console.error('[config/save] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/config/save?charter=123
 *
 * Gets saved configuration for a tenant from credit_unions table
 */
export async function GET(req: NextRequest) {
  const charter = req.nextUrl.searchParams.get('charter')

  if (!charter) {
    return NextResponse.json({ error: 'charter is required' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    const charterNum = parseInt(charter)

    // Get from credit_unions table
    const { data, error } = await supabase
      .from('credit_unions')
      .select('*')
      .eq('charter', charterNum)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Credit union not found' }, { status: 404 })
      }
      console.error('[config/save GET] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Credit union not found' }, { status: 404 })
    }

    // Build config from credit_unions data
    // If the row has a config JSONB column, use that; otherwise build from fields
    const config = data.config || {
      identity: {
        name: data.name,
        displayName: data.display_name || data.name,
        charter: data.charter,
      },
      branding: {
        primaryColor: data.primary_color,
        logoUrl: data.logo_url,
      },
    }

    return NextResponse.json({
      charter: charterNum,
      config,
      name: data.name,
      displayName: data.display_name || data.name,
      primaryColor: data.primary_color,
      logoUrl: data.logo_url,
      updatedAt: data.updated_at,
      source: 'credit_unions',
    })
  } catch (error) {
    console.error('[config/save GET] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

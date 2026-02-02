/**
 * Marketing Homepage API Proxy
 * 
 * Proxies marketing CMS requests to MARKETING_cu_saas_template
 * Handles tenant-specific content
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || 
                     request.headers.get('x-tenant-id') ||
                     request.headers.get('x-cu-id')

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId required" },
        { status: 400 }
      )
    }

    // Load marketing config from cu_configs
    const supabase = await createClient()
    const { data: configRecord } = await supabase
      .from('cu_configs')
      .select('config')
      .eq('tenant_id', tenantId)
      .single()

    if (configRecord?.config?.marketing?.homepage) {
      return NextResponse.json({
        homepage: configRecord.config.marketing.homepage,
      })
    }

    // Fallback: Try to get from marketing template CMS
    const marketingBaseUrl = process.env.MARKETING_TEMPLATE_URL || process.env.NEXT_PUBLIC_MARKETING_BASE_URL || "http://localhost:3001"
    try {
      const response = await fetch(`${marketingBaseUrl}/api/homepage?tenantId=${encodeURIComponent(tenantId)}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
        },
        cache: 'no-store',
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch (error) {
      console.warn('[Marketing Homepage] Could not fetch from marketing template:', error)
    }

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data)
    }

    // Default homepage
    return NextResponse.json({
      homepage: {
        hero: {
          title: "Welcome to Your Credit Union",
          subtitle: "Modern banking solutions for your financial success",
          ctaText: "Join Today",
          ctaLink: "/enrollment",
          backgroundImage: "",
        },
        ogImage: "",
        pageTitle: "CU.APP - Your Credit Union",
        pageDescription: "Member-focused financial services built for your success",
      },
    })
  } catch (error) {
    console.error("[Marketing Homepage] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const tenantId = body.tenantId || 
                     request.headers.get('x-tenant-id') ||
                     request.headers.get('x-cu-id')

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId required" },
        { status: 400 }
      )
    }

    // Update marketing config in cu_configs
    const supabase = await createClient()
    const { data: existing } = await supabase
      .from('cu_configs')
      .select('config')
      .eq('tenant_id', tenantId)
      .single()

    const updatedConfig = {
      ...existing?.config,
      marketing: {
        ...existing?.config?.marketing,
        enabled: existing?.config?.marketing?.enabled ?? true,
        homepage: {
          hero: body.hero || existing?.config?.marketing?.homepage?.hero,
          ogImage: body.ogImage || existing?.config?.marketing?.homepage?.ogImage,
          pageTitle: body.pageTitle || existing?.config?.marketing?.homepage?.pageTitle,
          pageDescription: body.pageDescription || existing?.config?.marketing?.homepage?.pageDescription,
        },
        updated_at: new Date().toISOString(),
      },
    }

    if (existing) {
      await supabase
        .from('cu_configs')
        .update({ config: updatedConfig })
        .eq('tenant_id', tenantId)
    } else {
      await supabase
        .from('cu_configs')
        .insert({
          tenant_id: tenantId,
          config: updatedConfig,
        })
    }

    // Also save to marketing template CMS if configured
    const marketingBaseUrl = process.env.MARKETING_TEMPLATE_URL || process.env.NEXT_PUBLIC_MARKETING_BASE_URL
    if (marketingBaseUrl) {
      try {
        await fetch(`${marketingBaseUrl}/api/homepage`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId,
          },
          body: JSON.stringify({
            ...body,
            tenantId,
            credit_union_id: tenantId, // Marketing template uses credit_union_id
          }),
        })
      } catch (error) {
        console.warn('[Marketing Homepage PUT] Could not sync to marketing template:', error)
        // Continue - config is saved, marketing template sync is optional
      }
    }

    return NextResponse.json({
      homepage: {
        ...body,
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[Marketing Homepage PUT] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

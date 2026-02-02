// GET CREDIT UNIONS WITH LOGOS FROM SUPABASE
// Returns paginated list of CUs with all logo variants
// Supports search, filtering by state, and sorting

import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const url = new URL(request.url)

  // Query params
  const search = url.searchParams.get("search") || ""
  const state = url.searchParams.get("state") || ""
  const offset = Number.parseInt(url.searchParams.get("offset") || "0")
  const limit = Number.parseInt(url.searchParams.get("limit") || "50")
  const sortBy = url.searchParams.get("sort") || "total_assets"
  const sortOrder = url.searchParams.get("order") || "desc"
  const withLogosOnly = url.searchParams.get("with_logos") === "true"

  try {
    // Build query
    let query = supabase
      .from("ncua_credit_unions")
      .select(
        `
        cu_number,
        charter_number,
        cu_name,
        city,
        state,
        website,
        total_assets,
        total_members,
        logo_url,
        logo_source,
        primary_color,
        logo_discovered_at
      `,
        { count: "exact" }
      )
      .eq("is_active", true)

    // Apply search filter
    if (search) {
      query = query.or(
        `cu_name.ilike.%${search}%,city.ilike.%${search}%,charter_number.eq.${Number.parseInt(search) || 0}`
      )
    }

    // Apply state filter
    if (state) {
      query = query.eq("state", state.toUpperCase())
    }

    // Only with logos
    if (withLogosOnly) {
      query = query.not("logo_url", "is", null)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: creditUnions, error, count } = await query

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch credit unions", details: error.message },
        { status: 500 }
      )
    }

    // Get logo details from cu_logos table for richer data
    const charterNumbers = creditUnions?.map((cu) => cu.charter_number) || []

    let logoDetails: Record<number, any> = {}
    if (charterNumbers.length > 0) {
      const { data: logos } = await supabase
        .from("cu_logos")
        .select("*")
        .in("charter_number", charterNumbers)

      if (logos) {
        logoDetails = logos.reduce((acc, logo) => {
          acc[logo.charter_number] = logo
          return acc
        }, {} as Record<number, any>)
      }
    }

    // Merge and format response
    const formattedCUs = creditUnions?.map((cu) => {
      const logos = logoDetails[cu.charter_number] || {}
      const domain = cu.website
        ?.replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0]

      return {
        id: cu.cu_number,
        charter: cu.charter_number,
        name: cu.cu_name,
        displayName: cu.cu_name,
        city: cu.city,
        state: cu.state,
        headquarters: cu.city && cu.state ? `${cu.city}, ${cu.state}` : null,
        website: cu.website,
        domain,
        assets: cu.total_assets,
        assetsFormatted: formatAssets(cu.total_assets),
        members: cu.total_members,
        membersFormatted: formatMembers(cu.total_members),

        // Logo URLs
        logoUrl: cu.logo_url || logos.logo_url_primary || generateFallbackLogo(domain),
        logoUrls: {
          primary: cu.logo_url || logos.logo_url_primary,
          brandfetch: logos.logo_url_brandfetch || (domain ? `https://cdn.brandfetch.io/${domain}/w/400/h/400` : null),
          clearbit: logos.logo_url_clearbit || (domain ? `https://logo.clearbit.com/${domain}?size=256` : null),
          google: logos.logo_url_google || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null),
          duckduckgo: logos.logo_url_duckduckgo || (domain ? `https://icons.duckduckgo.com/ip3/${domain}.ico` : null),
          direct: logos.logo_url_direct,
        },
        logoDomain: domain,
        logoSource: cu.logo_source || logos.source,
        logoQuality: logos.quality_score,

        // Brand color
        primaryColor: cu.primary_color || logos.primary_color || generateColorFromName(cu.cu_name),

        // Metadata
        source: "supabase",
        lastUpdated: cu.logo_discovered_at || logos.discovered_at,
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedCUs,
      pagination: {
        offset,
        limit,
        total: count || 0,
        hasMore: offset + limit < (count || 0),
        nextOffset: offset + limit < (count || 0) ? offset + limit : null,
      },
      filters: {
        search: search || null,
        state: state || null,
        withLogosOnly,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to process request", details: String(err) },
      { status: 500 }
    )
  }
}

function formatAssets(assets: number | null): string {
  if (!assets) return "N/A"
  if (assets >= 1_000_000_000) {
    return `$${(assets / 1_000_000_000).toFixed(1)}B`
  }
  if (assets >= 1_000_000) {
    return `$${(assets / 1_000_000).toFixed(0)}M`
  }
  return `$${assets.toLocaleString()}`
}

function formatMembers(members: number | null): string {
  if (!members) return "N/A"
  if (members >= 1_000_000) {
    return `${(members / 1_000_000).toFixed(1)}M`
  }
  if (members >= 1_000) {
    return `${(members / 1_000).toFixed(0)}K`
  }
  return members.toLocaleString()
}

function generateFallbackLogo(domain: string | null): string {
  if (domain) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  }
  return "/placeholder-logo.svg"
}

function generateColorFromName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash % 360)
  const s = 50 + (Math.abs(hash >> 8) % 30)
  const l = 35 + (Math.abs(hash >> 16) % 20)

  const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100
    l /= 100
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => {
      const k = (n + h / 30) % 12
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0")
    }
    return `#${f(0)}${f(8)}${f(4)}`
  }

  return hslToHex(h, s, l)
}

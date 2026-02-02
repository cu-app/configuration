// BATCH SEED CREDIT UNIONS
// Seeds cu_configs from ncua_credit_unions in batches of 100
// Maps each CU to their state for background photos

import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { DEFAULT_CU_CONFIG } from "@/lib/cu-config-defaults"

const BATCH_SIZE = 100

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Get URL params for pagination
  const url = new URL(request.url)
  const offset = Number.parseInt(url.searchParams.get("offset") || "0")
  const limit = Number.parseInt(url.searchParams.get("limit") || String(BATCH_SIZE))

  // Count total CUs
  const { count: totalCount } = await supabase
    .from("ncua_credit_unions")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  // Fetch batch of credit unions
  const { data: creditUnions, error: fetchError } = await supabase
    .from("ncua_credit_unions")
    .select("*")
    .eq("is_active", true)
    .order("charter_number")
    .range(offset, offset + limit - 1)

  if (fetchError || !creditUnions) {
    return NextResponse.json({ error: "Failed to fetch credit unions", details: fetchError }, { status: 500 })
  }

  // Get state photos for mapping
  const { data: statePhotos } = await supabase
    .from("state_background_photos")
    .select("state_code, photo_url, photo_url_regular")
    .eq("is_primary", true)

  const statePhotoMap = new Map(statePhotos?.map((p) => [p.state_code, p]) || [])

  // Process each credit union
  const results: { charter: number; status: "created" | "updated" | "error"; error?: string }[] = []

  for (const cu of creditUnions) {
    try {
      const tenantId = `cu_${cu.charter_number}`
      const statePhoto = statePhotoMap.get(cu.state)

      // Create config based on NCUA data
      const config = {
        ...DEFAULT_CU_CONFIG,
        tenant: {
          ...DEFAULT_CU_CONFIG.tenant,
          id: tenantId,
          name: cu.cu_name,
          charter_number: String(cu.charter_number),
          domain: cu.website?.replace(/^https?:\/\//, "").replace(/\/$/, "") || `${tenantId}.cu.app`,
          timezone: getTimezoneForState(cu.state),
          legal: {
            ...DEFAULT_CU_CONFIG.tenant.legal,
            name: cu.cu_name,
          },
        },
        tokens: {
          ...DEFAULT_CU_CONFIG.tokens,
          // Will be updated when logo processor runs
        },
        // Map state background photo
        content: {
          ...DEFAULT_CU_CONFIG.content,
          background_image: statePhoto?.photo_url_regular || "",
        },
      }

      // Upsert into cu_configs
      const { error: upsertError } = await supabase.from("cu_configs").upsert(
        {
          tenant_id: tenantId,
          tenant_name: cu.cu_name,
          config,
          environment: "production",
          status: "active",
          version: 1,
          state_code: cu.state,
          charter_number: cu.charter_number,
          total_assets: cu.total_assets,
          total_members: cu.total_members,
        },
        {
          onConflict: "tenant_id",
        },
      )

      if (upsertError) {
        results.push({ charter: cu.charter_number, status: "error", error: upsertError.message })
      } else {
        results.push({ charter: cu.charter_number, status: "created" })
      }
    } catch (err) {
      results.push({ charter: cu.charter_number, status: "error", error: String(err) })
    }
  }

  const created = results.filter((r) => r.status === "created").length
  const errors = results.filter((r) => r.status === "error").length
  const hasMore = offset + limit < (totalCount || 0)

  return NextResponse.json({
    success: true,
    batch: {
      offset,
      limit,
      processed: creditUnions.length,
      created,
      errors,
    },
    total: totalCount,
    has_more: hasMore,
    next_offset: hasMore ? offset + limit : null,
    // Include next URL for easy chaining
    next_url: hasMore ? `/api/cron/seed-credit-unions?offset=${offset + limit}&limit=${limit}` : null,
    results: results.slice(0, 20), // Only return first 20 results to keep response small
    timestamp: new Date().toISOString(),
  })
}

function getTimezoneForState(state: string): string {
  const timezones: Record<string, string> = {
    AL: "America/Chicago",
    AK: "America/Anchorage",
    AZ: "America/Phoenix",
    AR: "America/Chicago",
    CA: "America/Los_Angeles",
    CO: "America/Denver",
    CT: "America/New_York",
    DE: "America/New_York",
    FL: "America/New_York",
    GA: "America/New_York",
    HI: "Pacific/Honolulu",
    ID: "America/Boise",
    IL: "America/Chicago",
    IN: "America/Indiana/Indianapolis",
    IA: "America/Chicago",
    KS: "America/Chicago",
    KY: "America/New_York",
    LA: "America/Chicago",
    ME: "America/New_York",
    MD: "America/New_York",
    MA: "America/New_York",
    MI: "America/Detroit",
    MN: "America/Chicago",
    MS: "America/Chicago",
    MO: "America/Chicago",
    MT: "America/Denver",
    NE: "America/Chicago",
    NV: "America/Los_Angeles",
    NH: "America/New_York",
    NJ: "America/New_York",
    NM: "America/Denver",
    NY: "America/New_York",
    NC: "America/New_York",
    ND: "America/Chicago",
    OH: "America/New_York",
    OK: "America/Chicago",
    OR: "America/Los_Angeles",
    PA: "America/New_York",
    RI: "America/New_York",
    SC: "America/New_York",
    SD: "America/Chicago",
    TN: "America/Chicago",
    TX: "America/Chicago",
    UT: "America/Denver",
    VT: "America/New_York",
    VA: "America/New_York",
    WA: "America/Los_Angeles",
    WV: "America/New_York",
    WI: "America/Chicago",
    WY: "America/Denver",
  }
  return timezones[state] || "America/New_York"
}

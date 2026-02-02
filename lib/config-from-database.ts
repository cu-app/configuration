/**
 * Config From Database
 *
 * Builds CreditUnionConfig (cu-config.ts structure) from Supabase using
 * cu_configs.config JSONB and table-based mappings from schema-to-config-mapper.
 * Table-sourced values override JSONB where applicable.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { CreditUnionConfig } from "@/types/cu-config"
import { KNOWN_TABLE_MAPPINGS } from "./schema-to-config-mapper"

/** JSONB paths to extract from cu_configs.config (aligned with CreditUnionConfig) */
export const JSONB_CONFIG_PATHS = [
  "tenant",
  "tokens",
  "features",
  "ivr_voice",
  "ivr_prompts",
  "products",
  "rules",
  "fraud",
  "compliance",
  "integrations",
  "channels",
  "notifications",
  "content",
  "marketing",
  "ucx",
  "ai",
  "deploy",
  "poweron",
] as const

/**
 * Get a nested value by dot path (e.g. "compliance.fdx.enabled").
 */
export function getByPath(obj: unknown, path: string): unknown {
  if (obj == null) return undefined
  const parts = path.split(".")
  let current: unknown = obj
  for (const key of parts) {
    if (current == null || typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

/**
 * Set a nested value by dot path; creates intermediate objects.
 * Maps "design.*" to "tokens.*" for CreditUnionConfig compatibility.
 */
export function setByPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const normalizedPath = path.startsWith("design.") ? path.replace("design.", "tokens.") : path
  const parts = normalizedPath.split(".")
  let current: Record<string, unknown> = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]
    if (!(key in current) || typeof current[key] !== "object" || current[key] === null) {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }
  current[parts[parts.length - 1]] = value
}

/**
 * Deep merge source into target (target wins for overlapping keys at leaf level).
 * Used to overlay table-sourced values over JSONB config.
 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): void {
  for (const key of Object.keys(source)) {
    const s = source[key]
    const t = target[key]
    if (
      s != null &&
      typeof s === "object" &&
      !Array.isArray(s) &&
      t != null &&
      typeof t === "object" &&
      !Array.isArray(t)
    ) {
      deepMerge(t as Record<string, unknown>, s as Record<string, unknown>)
    } else if (s !== undefined) {
      target[key] = s
    }
  }
}

/**
 * Build CreditUnionConfig from Supabase for a tenant.
 * 1. Load cu_configs.config (JSONB) as base.
 * 2. Extract and normalize JSONB (ensure top-level keys match CreditUnionConfig).
 * 3. Overlay values from table-based mappings (ncua_credit_unions, cu_branding, cu_logos, cu_feature_flags, etc.).
 *
 * @param supabase - Supabase client (server or admin)
 * @param tenantId - tenant_id or cu_number used to scope config and related tables
 * @returns Partial CreditUnionConfig; table/JSONB may not cover all keys
 */
export async function getConfigFromDatabase(
  supabase: SupabaseClient,
  tenantId: string
): Promise<Partial<CreditUnionConfig>> {
  const base: Record<string, unknown> = {}

  // 1. Load cu_configs.config JSONB
  const { data: configRow } = await supabase
    .from("cu_configs")
    .select("config, tenant_id")
    .eq("tenant_id", tenantId)
    .maybeSingle()

  const configJsonb = (configRow?.config as Record<string, unknown> | null) ?? null
  if (configJsonb && typeof configJsonb === "object") {
    deepMerge(base, { ...configJsonb } as Record<string, unknown>)
  }

  // 2. Fetch table-sourced values and overlay by config path
  // ncua_credit_unions: try by cu_number or id
  const { data: ncuaRow } = await supabase
    .from("ncua_credit_unions")
    .select("*")
    .or(`cu_number.eq.${tenantId},id.eq.${tenantId}`)
    .maybeSingle()

  const { data: brandingRow } = await supabase
    .from("cu_branding")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle()

  const { data: logosRow } = await supabase
    .from("cu_logos")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle()

  const { data: detailsRow } = await supabase
    .from("cu_details")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle()

  const tablesToFetch = new Set(KNOWN_TABLE_MAPPINGS.flatMap((m) => m.sourceTables.map((s) => s.table)))
  const rowByTable: Record<string, Record<string, unknown> | null> = {
    ncua_credit_unions: (ncuaRow as Record<string, unknown> | null) ?? null,
    cu_branding: (brandingRow as Record<string, unknown> | null) ?? null,
    cu_logos: (logosRow as Record<string, unknown> | null) ?? null,
    cu_details: (detailsRow as Record<string, unknown> | null) ?? null,
    cu_configs: (configRow as Record<string, unknown> | null) ?? null,
  }

  for (const table of tablesToFetch) {
    if (rowByTable[table] !== undefined) continue
    try {
      const q = supabase.from(table).select("*")
      const tenantScoped = ["cu_limits", "ivr_config", "kyc_config", "fraud_config"].includes(table)
      const { data } = tenantScoped ? await q.eq("tenant_id", tenantId).maybeSingle() : await q.limit(1).maybeSingle()
      rowByTable[table] = (data as Record<string, unknown> | null) ?? null
    } catch {
      rowByTable[table] = null
    }
  }

  for (const mapping of KNOWN_TABLE_MAPPINGS) {
    for (const src of mapping.sourceTables) {
      if (src.table === "cu_configs" && src.column === "config") continue
      const row = rowByTable[src.table]
      if (!row) continue
      const val = src.column === "*" ? row : row[src.column]
      if (val !== undefined && val !== null) {
        setByPath(base, mapping.configPath, val)
      }
    }
  }

  // 3. Feature flags: cu_feature_flags rows where feature_key = X -> features.X
  const { data: featureRows } = await supabase
    .from("cu_feature_flags")
    .select("feature_key, is_enabled")
    .eq("tenant_id", tenantId)

  if (featureRows?.length) {
    const features: Record<string, boolean> = (base.features as Record<string, boolean>) ?? {}
    for (const r of featureRows) {
      const key = (r as { feature_key?: string; is_enabled?: boolean }).feature_key
      const enabled = (r as { feature_key?: string; is_enabled?: boolean }).is_enabled
      if (key) features[key] = Boolean(enabled)
    }
    base.features = features
  }

  return base as Partial<CreditUnionConfig>
}

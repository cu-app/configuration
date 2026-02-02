/**
 * Tenant context resolver for multi-tenant support.
 * Resolves tenant from request/params, loads CU config from Supabase, provides prefix/name/branding.
 * Used by lobby components and API routes for white labeling.
 */

import type { SupabaseClient } from "@supabase/supabase-js"

export interface TenantContext {
  tenantId: string
  tenantName: string
  prefix: string
  domain?: string
  config?: Record<string, unknown>
}

/**
 * Resolve tenant context from Supabase for a given tenant ID (charter_number or tenant_id).
 */
export async function getTenantContext(
  supabase: SupabaseClient,
  tenantId: string
): Promise<TenantContext | null> {
  if (!tenantId) return null

  const { data: configRow, error } = await supabase
    .from("cu_configs")
    .select("tenant_id, charter_number, credit_union_name, config")
    .or(`tenant_id.eq.${tenantId},charter_number.eq.${tenantId}`)
    .maybeSingle()

  if (error || !configRow) return null

  const config = (configRow.config as Record<string, unknown>) ?? {}
  const tenant = (config.tenant as { name?: string; domain?: string }) ?? {}
  const poweron = (config.poweron as { prefix?: string }) ?? {}
  const name = (configRow as { credit_union_name?: string }).credit_union_name ?? tenant.name ?? "Credit Union"
  const prefix = poweron.prefix ?? generatePrefixFromName(name)
  const domain = tenant.domain ?? generateDomainFromName(name)

  return {
    tenantId: (configRow as { tenant_id?: string }).tenant_id ?? (configRow as { charter_number?: string }).charter_number ?? tenantId,
    tenantName: name,
    prefix: prefix.toUpperCase(),
    domain,
    config,
  }
}

function generatePrefixFromName(name: string): string {
  const words = name
    .toUpperCase()
    .replace(/CREDIT UNION|FCU|CU|FEDERAL|THE|&/gi, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0)
  const prefix = words.map((w) => w[0]).join("")
  return prefix.substring(0, 5) || "CU"
}

function generateDomainFromName(name: string): string {
  const domain = name
    .toLowerCase()
    .replace(/credit union|fcu|cu|federal|the|&/g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "")
  return `${domain}.com`
}

/**
 * Get tenant prefix only (for headers / white labeling).
 */
export async function getTenantPrefix(
  supabase: SupabaseClient,
  tenantId: string
): Promise<string | null> {
  const ctx = await getTenantContext(supabase, tenantId)
  return ctx?.prefix ?? null
}

/**
 * CLI: Generate CreditUnionConfig from Supabase for a tenant.
 *
 * Usage (from project root, with .env.local or env set):
 *   npx tsx scripts/generate-config-from-schema.ts <tenantId>
 *
 * Or via Next.js API (no direct Node run):
 *   GET /api/config/[tenantId] using getConfigFromDatabase internally
 */

import { createClient } from "@supabase/supabase-js"
import { getConfigFromDatabase } from "../lib/config-from-database"

async function main() {
  const tenantId = process.argv[2]
  if (!tenantId) {
    console.error("Usage: npx tsx scripts/generate-config-from-schema.ts <tenantId>")
    process.exit(1)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON_KEY)")
    process.exit(1)
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const config = await getConfigFromDatabase(supabase, tenantId)
  console.log(JSON.stringify(config, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

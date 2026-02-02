import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// This endpoint can be called by Vercel Cron or external schedulers
// Add to vercel.json: { "crons": [{ "path": "/api/cron/config-sync", "schedule": "0 * * * *" }] }

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in development or if no secret is set
    if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const results = {
    timestamp: new Date().toISOString(),
    tasks: [] as { task: string; status: string; details?: string }[],
  }

  try {
    // Task 1: Validate all active configurations
    const { data: configs, error: fetchError } = await supabase
      .from("cu_configs")
      .select("id, tenant_id, tenant_name, config, status")
      .eq("status", "active")

    if (fetchError) {
      results.tasks.push({ task: "fetch_configs", status: "error", details: fetchError.message })
    } else {
      results.tasks.push({
        task: "fetch_configs",
        status: "success",
        details: `Found ${configs?.length || 0} active configs`,
      })

      // Task 2: Validate each config has required fields
      const validationIssues: string[] = []
      for (const config of configs || []) {
        const cfg = config.config as Record<string, unknown>

        // Check required top-level tiers exist
        const requiredTiers = [
          "tenant",
          "tokens",
          "features",
          "products",
          "rules",
          "fraud",
          "compliance",
          "integrations",
          "channels",
          "notifications",
          "content",
          "ucx",
          "ai",
          "deploy",
        ]
        const missingTiers = requiredTiers.filter((tier) => !cfg[tier])

        if (missingTiers.length > 0) {
          validationIssues.push(`${config.tenant_id}: Missing tiers: ${missingTiers.join(", ")}`)
        }

        // Check tenant has required fields
        const tenant = cfg.tenant as Record<string, unknown> | undefined
        if (tenant) {
          if (!tenant.id || !tenant.name || !tenant.domain) {
            validationIssues.push(`${config.tenant_id}: Missing required tenant fields (id, name, or domain)`)
          }
        }
      }

      if (validationIssues.length > 0) {
        results.tasks.push({ task: "validate_configs", status: "warning", details: validationIssues.join("; ") })
      } else {
        results.tasks.push({ task: "validate_configs", status: "success", details: "All configs valid" })
      }
    }

    // Task 3: Check for stale draft configs (older than 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: staleConfigs, error: staleError } = await supabase
      .from("cu_configs")
      .select("id, tenant_id, tenant_name, updated_at")
      .eq("status", "draft")
      .lt("updated_at", thirtyDaysAgo.toISOString())

    if (staleError) {
      results.tasks.push({ task: "check_stale_drafts", status: "error", details: staleError.message })
    } else {
      results.tasks.push({
        task: "check_stale_drafts",
        status: staleConfigs && staleConfigs.length > 0 ? "warning" : "success",
        details:
          staleConfigs && staleConfigs.length > 0
            ? `Found ${staleConfigs.length} stale drafts: ${staleConfigs.map((c) => c.tenant_id).join(", ")}`
            : "No stale drafts found",
      })
    }

    // Task 4: Log cron execution
    const { error: logError } = await supabase.from("cu_config_history").insert({
      cu_config_id: configs?.[0]?.id || "00000000-0000-0000-0000-000000000000",
      tenant_id: "system",
      config: { cron_run: results },
      version: 0,
      change_summary: "Automated cron sync",
      changed_by: "cron",
    })

    if (logError) {
      // Non-critical, just log
      console.error("Failed to log cron execution:", logError)
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

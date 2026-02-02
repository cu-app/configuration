import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Daily backup cron - exports all configs to history
// Add to vercel.json: { "crons": [{ "path": "/api/cron/config-backup", "schedule": "0 0 * * *" }] }

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  try {
    // Fetch all active configs
    const { data: configs, error: fetchError } = await supabase.from("cu_configs").select("*").eq("status", "active")

    if (fetchError) {
      throw new Error(`Failed to fetch configs: ${fetchError.message}`)
    }

    // Create backup entries in history
    const backupEntries = (configs || []).map((config) => ({
      cu_config_id: config.id,
      tenant_id: config.tenant_id,
      config: config.config,
      version: config.version,
      change_summary: `Daily backup - ${new Date().toISOString().split("T")[0]}`,
      changed_by: "cron-backup",
    }))

    if (backupEntries.length > 0) {
      const { error: insertError } = await supabase.from("cu_config_history").insert(backupEntries)

      if (insertError) {
        throw new Error(`Failed to create backups: ${insertError.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Backed up ${backupEntries.length} configurations`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Backup cron error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

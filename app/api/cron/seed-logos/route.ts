import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Batch process to seed all tenant logos
export async function GET() {
  try {
    const supabase = await createClient()
    const batchId = `batch_${Date.now()}`
    const BATCH_SIZE = 100

    // Update task agent status
    await supabase
      .from("task_agents")
      .update({ status: "running", last_run_at: new Date().toISOString() })
      .eq("type", "logo_fetch")

    // Get credit unions that need logos
    const { data: creditUnions, error } = await supabase
      .from("ncua_credit_unions")
      .select("cu_number, cu_name, website")
      .limit(BATCH_SIZE)

    if (error) throw error

    const results = []

    for (const cu of creditUnions || []) {
      const cuNumber = cu.cu_number
      let logoUrl = ""
      let fallbackUsed = ""

      // Try different logo sources
      const domain = cu.website?.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0]

      if (domain) {
        // Try Brandfetch first
        const brandfetchUrl = `https://cdn.brandfetch.io/${domain}/w/400/h/400`
        const clearbitUrl = `https://logo.clearbit.com/${domain}`
        const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`

        // Check Brandfetch
        try {
          const res = await fetch(brandfetchUrl, { method: "HEAD" })
          if (res.ok) {
            logoUrl = brandfetchUrl
            fallbackUsed = "brandfetch"
          }
        } catch {}

        // Fallback to Clearbit
        if (!logoUrl) {
          try {
            const res = await fetch(clearbitUrl, { method: "HEAD" })
            if (res.ok) {
              logoUrl = clearbitUrl
              fallbackUsed = "clearbit"
            }
          } catch {}
        }

        // Fallback to Google
        if (!logoUrl) {
          logoUrl = googleUrl
          fallbackUsed = "google"
        }
      }

      // Record the job
      await supabase.from("logo_seed_jobs").insert({
        batch_id: batchId,
        credit_union_id: `cu_${cuNumber}`,
        charter_number: cuNumber,
        status: logoUrl ? "completed" : "failed",
        logo_url_found: logoUrl || null,
        fallback_used: fallbackUsed || null,
        processed_at: new Date().toISOString(),
      })

      results.push({ cuNumber, logoUrl, fallbackUsed })
    }

    // Update task agent status
    await supabase
      .from("task_agents")
      .update({
        status: "completed",
        run_count: supabase.rpc("increment_run_count"),
      })
      .eq("type", "logo_fetch")

    return NextResponse.json({
      success: true,
      batchId,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error("Logo seed error:", error)
    return NextResponse.json({ error: "Logo seeding failed" }, { status: 500 })
  }
}

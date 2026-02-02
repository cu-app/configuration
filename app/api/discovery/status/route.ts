import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const creditUnionId = searchParams.get("creditUnionId")
  const charter = searchParams.get("charter")

  let actualUuid: string | null = null

  if (charter) {
    const { data: cuData } = await supabase.from("credit_unions").select("id").eq("charter", charter).single()
    actualUuid = cuData?.id
  }

  // If no UUID found, return empty jobs (no discovery data yet)
  if (!actualUuid) {
    const jobTypes = ["branches", "logos", "contacts", "social", "products", "reviews"]
    const jobs = jobTypes.map((type) => ({
      id: type,
      name: type.charAt(0).toUpperCase() + type.slice(1) + " Discovery",
      status: "idle",
      lastRun: null,
      itemsProcessed: 0,
    }))
    jobs.unshift({
      id: "enrichment",
      name: "Full Enrichment",
      status: "idle",
      lastRun: null,
      itemsProcessed: 0,
    })
    return NextResponse.json({ jobs })
  }

  // Get recent discovery sessions using the actual UUID
  const { data: sessions } = await supabase
    .from("discovery_sessions")
    .select("*")
    .eq("credit_union_id", actualUuid)
    .order("created_at", { ascending: false })
    .limit(10)

  // Map sessions to job status
  const jobTypes = ["branches", "logos", "contacts", "social", "products", "reviews"]
  const jobs = jobTypes.map((type) => {
    const session = sessions?.find((s) => s.discovery_type === type || s.discovery_type === "all")

    return {
      id: type,
      name: type.charAt(0).toUpperCase() + type.slice(1) + " Discovery",
      status: session?.status || "idle",
      lastRun: session?.completed_at || session?.started_at,
      itemsProcessed: session?.items_found || 0,
    }
  })

  // Add master enrichment job
  const masterSession = sessions?.find((s) => s.discovery_type === "all")
  jobs.unshift({
    id: "enrichment",
    name: "Full Enrichment",
    status: masterSession?.status || "idle",
    lastRun: masterSession?.completed_at || masterSession?.started_at,
    itemsProcessed: masterSession?.items_found || 0,
  })

  return NextResponse.json({ jobs })
}

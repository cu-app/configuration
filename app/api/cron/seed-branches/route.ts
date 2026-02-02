// Batch process all credit unions to fetch branch locations via Google Places
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY
const BATCH_SIZE = 10 // Process 10 CUs per cron run to stay within rate limits

export async function GET() {
  if (!GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ error: "Google Places API key not configured" }, { status: 500 })
  }

  const supabase = await createClient()

  try {
    // Get CUs that haven't had branches fetched recently
    const { data: creditUnions, error: cuError } = await supabase
      .from("ncua_credit_unions")
      .select("cu_number, cu_name, state_code, city")
      .is("branches_fetched_at", null)
      .limit(BATCH_SIZE)

    if (cuError) {
      console.error("[v0] Error fetching CUs:", cuError)
      return NextResponse.json({ error: cuError.message }, { status: 500 })
    }

    if (!creditUnions || creditUnions.length === 0) {
      // All CUs processed, find ones older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { data: staleUnions } = await supabase
        .from("ncua_credit_unions")
        .select("cu_number, cu_name, state_code, city")
        .lt("branches_fetched_at", thirtyDaysAgo)
        .limit(BATCH_SIZE)

      if (!staleUnions || staleUnions.length === 0) {
        return NextResponse.json({ message: "All branches up to date", processed: 0 })
      }
    }

    const results = []

    for (const cu of creditUnions || []) {
      try {
        // Search Google Places for this CU's branches
        const query = `"${cu.cu_name}" credit union in ${cu.state_code}`
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=bank&key=${GOOGLE_PLACES_API_KEY}`

        const response = await fetch(url)
        const data = await response.json()

        if (data.status === "OK" && data.results) {
          // Insert branches
          const branches = data.results.map((place: any) => ({
            cu_number: cu.cu_number,
            place_id: place.place_id,
            name: place.name,
            address: place.formatted_address,
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            rating: place.rating,
            source: "google_places",
            fetched_at: new Date().toISOString(),
          }))

          // Upsert branches (avoid duplicates)
          const { error: branchError } = await supabase.from("cu_branches").upsert(branches, { onConflict: "place_id" })

          if (branchError) {
            console.error(`[v0] Error inserting branches for ${cu.cu_name}:`, branchError)
          }

          // Mark CU as processed
          await supabase
            .from("ncua_credit_unions")
            .update({ branches_fetched_at: new Date().toISOString() })
            .eq("cu_number", cu.cu_number)

          results.push({ cu: cu.cu_name, branches: branches.length })
        }

        // Rate limit: 100ms between requests
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (err) {
        console.error(`[v0] Error processing ${cu.cu_name}:`, err)
        results.push({ cu: cu.cu_name, error: String(err) })
      }
    }

    return NextResponse.json({
      message: "Branch seeding complete",
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error("[v0] Seed branches error:", error)
    return NextResponse.json({ error: "Failed to seed branches" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

// All 50 US states for nationwide search
const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
  "District of Columbia",
]

interface PlaceResult {
  place_id: string
  name: string
  formatted_address: string
  geometry?: { location: { lat: number; lng: number } }
  rating?: number
  user_ratings_total?: number
  business_status?: string
  photos?: { photo_reference: string; width: number; height: number }[]
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { creditUnionId, creditUnionName, searchMode = "local", city, state } = await request.json()

  if (!creditUnionName) {
    return NextResponse.json({ error: "Credit union name required" }, { status: 400 })
  }

  // Create discovery session
  const { data: session, error: sessionError } = await supabase
    .from("discovery_sessions")
    .insert({
      credit_union_id: creditUnionId,
      discovery_type: "branches",
      status: "running",
      started_at: new Date().toISOString(),
      sources_queried: ["google_places"],
    })
    .select()
    .single()

  if (sessionError) {
    console.error("Session creation error:", sessionError)
  }

  const allBranches: Array<{
    placeId: string
    name: string
    address: string
    location: { lat: number; lng: number }
    rating?: number
    userRatingsTotal?: number
    businessStatus?: string
    photos?: { reference: string; width: number; height: number }[]
    state: string
    source: string
    confidenceScore: number
    confidenceReasoning: string
  }> = []

  const seenPlaceIds = new Set<string>()

  try {
    if (searchMode === "nationwide") {
      // YEXT-level: Search across all 50 states
      for (const searchState of US_STATES) {
        const stateBranches = await searchGooglePlaces(creditUnionName, searchState)

        for (const branch of stateBranches) {
          if (!seenPlaceIds.has(branch.place_id)) {
            seenPlaceIds.add(branch.place_id)

            // Calculate confidence based on name match and data completeness
            const nameMatch = branch.name.toLowerCase().includes(creditUnionName.toLowerCase().split(" ")[0])
            const hasPhoto = branch.photos && branch.photos.length > 0
            const hasRating = branch.rating !== undefined

            let confidence = 50
            const reasons: string[] = []

            if (nameMatch) {
              confidence += 30
              reasons.push("Name matches credit union (+30)")
            }
            if (hasPhoto) {
              confidence += 10
              reasons.push("Has photos (+10)")
            }
            if (hasRating) {
              confidence += 5
              reasons.push("Has ratings (+5)")
            }
            if (branch.business_status === "OPERATIONAL") {
              confidence += 5
              reasons.push("Currently operational (+5)")
            }

            allBranches.push({
              placeId: branch.place_id,
              name: branch.name,
              address: branch.formatted_address,
              location: branch.geometry?.location || { lat: 0, lng: 0 },
              rating: branch.rating,
              userRatingsTotal: branch.user_ratings_total,
              businessStatus: branch.business_status,
              photos: branch.photos?.map((p) => ({
                reference: p.photo_reference,
                width: p.width,
                height: p.height,
              })),
              state: searchState,
              source: "google_places",
              confidenceScore: Math.min(100, confidence),
              confidenceReasoning: reasons.join(" | ") || "Basic location data from Google Places",
            })
          }
        }
      }
    } else {
      // Local search - just the specified city/state
      const localBranches = await searchGooglePlaces(creditUnionName, `${city} ${state}`)

      for (const branch of localBranches) {
        if (!seenPlaceIds.has(branch.place_id)) {
          seenPlaceIds.add(branch.place_id)

          const nameMatch = branch.name.toLowerCase().includes(creditUnionName.toLowerCase().split(" ")[0])
          const confidence = nameMatch ? 80 : 50

          allBranches.push({
            placeId: branch.place_id,
            name: branch.name,
            address: branch.formatted_address,
            location: branch.geometry?.location || { lat: 0, lng: 0 },
            rating: branch.rating,
            userRatingsTotal: branch.user_ratings_total,
            businessStatus: branch.business_status,
            photos: branch.photos?.map((p) => ({
              reference: p.photo_reference,
              width: p.width,
              height: p.height,
            })),
            state: state || "",
            source: "google_places",
            confidenceScore: confidence,
            confidenceReasoning: `Local search in ${city}, ${state}`,
          })
        }
      }
    }

    // Store discovered branches in Supabase
    if (session && creditUnionId && allBranches.length > 0) {
      const itemsToInsert = allBranches.map((branch) => ({
        session_id: session.id,
        credit_union_id: creditUnionId,
        item_type: "branch",
        data: {
          place_id: branch.placeId,
          name: branch.name,
          address: branch.address,
          lat: branch.location.lat,
          lng: branch.location.lng,
          rating: branch.rating,
          user_ratings_total: branch.userRatingsTotal,
          business_status: branch.businessStatus,
          photos: branch.photos,
          state: branch.state,
        },
        source: "google_places",
        source_url: `https://www.google.com/maps/place/?q=place_id:${branch.placeId}`,
        confidence_score: branch.confidenceScore / 100,
        confidence_reasoning: branch.confidenceReasoning,
        verification_status: "pending",
      }))

      await supabase.from("discovered_items").insert(itemsToInsert)

      // Update session
      await supabase
        .from("discovery_sessions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          items_found: allBranches.length,
        })
        .eq("id", session.id)
    }

    return NextResponse.json({
      branches: allBranches,
      total: allBranches.length,
      sessionId: session?.id,
      searchMode,
      statesSearched: searchMode === "nationwide" ? US_STATES.length : 1,
    })
  } catch (error) {
    console.error("Branch discovery error:", error)

    // Update session with error
    if (session) {
      await supabase
        .from("discovery_sessions")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
          completed_at: new Date().toISOString(),
        })
        .eq("id", session.id)
    }

    return NextResponse.json({ error: "Failed to discover branches", branches: [] }, { status: 500 })
  }
}

async function searchGooglePlaces(creditUnionName: string, location: string): Promise<PlaceResult[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    // Return mock data if no API key (for development)
    return []
  }

  try {
    const searchQuery = `${creditUnionName} credit union ${location}`
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&type=bank&key=${GOOGLE_PLACES_API_KEY}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === "OK") {
      let results = data.results || []

      // Get next page if available (Google returns max 20 per page, up to 60 total)
      if (data.next_page_token) {
        await new Promise((resolve) => setTimeout(resolve, 2000)) // Required delay
        const nextUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${data.next_page_token}&key=${GOOGLE_PLACES_API_KEY}`
        const nextResponse = await fetch(nextUrl)
        const nextData = await nextResponse.json()
        if (nextData.status === "OK") {
          results = [...results, ...(nextData.results || [])]
        }
      }

      return results
    }

    return []
  } catch (error) {
    console.error(`Error searching ${location}:`, error)
    return []
  }
}

// Google Places API for Credit Union Branch Locations
// Much more accurate than NCUA data

import { type NextRequest, NextResponse } from "next/server"

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

interface PlaceResult {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: { lat: number; lng: number }
  }
  opening_hours?: {
    open_now: boolean
    weekday_text?: string[]
  }
  formatted_phone_number?: string
  website?: string
  photos?: { photo_reference: string }[]
  rating?: number
  types: string[]
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cuName = searchParams.get("name")
  const state = searchParams.get("state")

  if (!cuName) {
    return NextResponse.json({ error: "Credit union name required" }, { status: 400 })
  }

  if (!GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ error: "Google Places API key not configured" }, { status: 500 })
  }

  try {
    // Search for credit union branches
    const query = `"${cuName}" credit union${state ? ` in ${state}` : ""}`
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=bank&key=${GOOGLE_PLACES_API_KEY}`

    const response = await fetch(textSearchUrl)
    const data = await response.json()

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("[v0] Google Places API error:", data.status, data.error_message)
      return NextResponse.json({ error: data.error_message || data.status }, { status: 500 })
    }

    const branches = (data.results || []).map((place: PlaceResult) => ({
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      isOpen: place.opening_hours?.open_now,
      hours: place.opening_hours?.weekday_text,
      phone: place.formatted_phone_number,
      website: place.website,
      rating: place.rating,
      photoRef: place.photos?.[0]?.photo_reference,
    }))

    return NextResponse.json({
      query,
      count: branches.length,
      branches,
      nextPageToken: data.next_page_token,
    })
  } catch (error) {
    console.error("[v0] Branch search error:", error)
    return NextResponse.json({ error: "Failed to search branches" }, { status: 500 })
  }
}

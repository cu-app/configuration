import { NextResponse } from "next/server"

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const photoReference = searchParams.get("ref")
  const maxWidth = searchParams.get("maxwidth") || "400"

  if (!photoReference) {
    return NextResponse.json({ error: "Photo reference required" }, { status: 400 })
  }

  if (!GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ error: "Google Places API key not configured" }, { status: 500 })
  }

  // Return the Google Places photo URL
  const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`

  return NextResponse.redirect(photoUrl)
}

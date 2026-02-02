// UNSPLASH STATE PHOTOS BATCH PROCESSOR
// Fetches environment photos for each US state using Unsplash API
// Runs as a cron job to populate state_background_photos table

import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const UNSPLASH_ACCESS_KEY = "Baj-jRwWOwr3bNFYdKBVQ2lCQJCIYOxZq2OOK0uV8b4"

// State-specific search queries for authentic environment photos
const STATE_PHOTO_QUERIES: Record<string, string[]> = {
  AL: ["alabama countryside", "mobile bay alabama", "birmingham skyline"],
  AK: ["alaska mountains", "denali national park", "alaska northern lights"],
  AZ: ["arizona desert", "grand canyon", "sedona red rocks"],
  AR: ["arkansas ozarks", "hot springs arkansas", "arkansas river valley"],
  CA: ["california coast", "golden gate bridge", "california redwoods", "hollywood hills"],
  CO: ["colorado rocky mountains", "denver skyline", "aspen colorado"],
  CT: ["connecticut fall foliage", "new haven yale", "mystic seaport"],
  DE: ["delaware beach", "wilmington delaware", "brandywine valley"],
  FL: ["florida beach sunset", "miami skyline", "florida everglades", "key west"],
  GA: ["georgia peach orchards", "atlanta skyline", "savannah squares"],
  HI: ["hawaii beach", "maui sunset", "waikiki honolulu", "hawaii volcano"],
  ID: ["idaho mountains", "boise skyline", "shoshone falls"],
  IL: ["chicago skyline", "illinois prairie", "springfield illinois"],
  IN: ["indiana farmland", "indianapolis skyline", "indiana dunes"],
  IA: ["iowa farmland", "des moines skyline", "iowa rolling hills"],
  KS: ["kansas prairie", "kansas city skyline", "flint hills kansas"],
  KY: ["kentucky bluegrass", "louisville skyline", "mammoth cave"],
  LA: ["new orleans french quarter", "louisiana bayou", "baton rouge"],
  ME: ["maine lighthouse", "acadia national park", "portland maine"],
  MD: ["maryland chesapeake bay", "baltimore harbor", "annapolis"],
  MA: ["boston skyline", "cape cod beach", "massachusetts fall foliage"],
  MI: ["michigan great lakes", "detroit skyline", "mackinac island"],
  MN: ["minnesota lakes", "minneapolis skyline", "boundary waters"],
  MS: ["mississippi river", "natchez antebellum", "gulf coast mississippi"],
  MO: ["st louis arch", "kansas city missouri", "ozark mountains missouri"],
  MT: ["montana glacier national park", "big sky montana", "yellowstone montana"],
  NE: ["nebraska sandhills", "omaha skyline", "chimney rock nebraska"],
  NV: ["las vegas strip", "nevada desert", "lake tahoe nevada", "red rock canyon"],
  NH: ["new hampshire white mountains", "lake winnipesaukee", "portsmouth nh"],
  NJ: ["jersey shore", "newark skyline", "princeton new jersey"],
  NM: ["new mexico desert", "santa fe adobe", "white sands national park"],
  NY: ["new york city skyline", "central park", "hudson valley", "niagara falls"],
  NC: ["north carolina blue ridge", "charlotte skyline", "outer banks"],
  ND: ["north dakota badlands", "fargo north dakota", "theodore roosevelt park"],
  OH: ["cleveland skyline", "ohio river valley", "hocking hills ohio"],
  OK: ["oklahoma prairie", "oklahoma city skyline", "wichita mountains"],
  OR: ["oregon coast", "portland oregon", "crater lake", "oregon forest"],
  PA: ["philadelphia skyline", "pennsylvania amish country", "pittsburgh bridges"],
  RI: ["rhode island newport", "providence skyline", "block island"],
  SC: ["charleston south carolina", "myrtle beach", "south carolina lowcountry"],
  SD: ["mount rushmore", "south dakota badlands", "black hills"],
  TN: ["nashville skyline", "smoky mountains tennessee", "memphis beale street"],
  TX: ["texas hill country", "austin skyline", "dallas skyline", "big bend texas"],
  UT: ["utah arches", "salt lake city", "zion national park", "bryce canyon"],
  VT: ["vermont fall foliage", "burlington vermont", "green mountains"],
  VA: ["virginia shenandoah", "richmond skyline", "virginia beach"],
  WA: ["seattle skyline", "washington rainforest", "mount rainier", "puget sound"],
  WV: ["west virginia mountains", "new river gorge", "harpers ferry"],
  WI: ["wisconsin dells", "milwaukee skyline", "door county wisconsin"],
  WY: ["yellowstone wyoming", "grand teton", "wyoming plains"],
}

interface UnsplashPhoto {
  id: string
  urls: {
    full: string
    regular: string
    small: string
    thumb: string
    raw: string
  }
  user: {
    name: string
    username: string
    links: { html: string }
  }
  description: string | null
  alt_description: string | null
  width: number
  height: number
  color: string
  blur_hash: string
  tags?: { title: string }[]
}

async function fetchUnsplashPhotos(query: string, perPage = 3): Promise<UnsplashPhoto[]> {
  const url = new URL("https://api.unsplash.com/search/photos")
  url.searchParams.set("query", query)
  url.searchParams.set("per_page", perPage.toString())
  url.searchParams.set("orientation", "landscape")
  url.searchParams.set("content_filter", "high")

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
    },
  })

  if (!response.ok) {
    console.error(`Unsplash API error: ${response.status} for query "${query}"`)
    return []
  }

  const data = await response.json()
  return data.results || []
}

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in development without secret
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const results: { state: string; photos_added: number; errors: string[] }[] = []
  let totalPhotosAdded = 0
  let statesProcessed = 0

  // Get all states from the database
  const { data: states, error: statesError } = await supabase
    .from("state_teachers")
    .select("state_code, state_name")
    .order("state_code")

  if (statesError || !states) {
    return NextResponse.json({ error: "Failed to fetch states", details: statesError }, { status: 500 })
  }

  // Process states in batches of 5 to avoid rate limiting
  const batchSize = 5
  for (let i = 0; i < states.length; i += batchSize) {
    const batch = states.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (state) => {
        const stateCode = state.state_code
        const queries = STATE_PHOTO_QUERIES[stateCode] || [`${state.state_name} landscape`]
        const stateResult = { state: stateCode, photos_added: 0, errors: [] as string[] }

        for (let queryIndex = 0; queryIndex < queries.length; queryIndex++) {
          const query = queries[queryIndex]
          try {
            const photos = await fetchUnsplashPhotos(query, 2)

            for (const photo of photos) {
              const photoData = {
                state_code: stateCode,
                photo_id: photo.id,
                photo_url: photo.urls.regular,
                photo_url_full: photo.urls.full,
                photo_url_regular: photo.urls.regular,
                photo_url_small: photo.urls.small,
                photo_url_thumb: photo.urls.thumb,
                photographer_name: photo.user.name,
                photographer_username: photo.user.username,
                photographer_url: photo.user.links.html,
                description: photo.description,
                alt_description: photo.alt_description,
                category: queryIndex === 0 ? "landscape" : queryIndex === 1 ? "cityscape" : "nature",
                tags: photo.tags?.map((t) => t.title) || [],
                width: photo.width,
                height: photo.height,
                color: photo.color,
                blur_hash: photo.blur_hash,
                is_primary: queryIndex === 0 && photos.indexOf(photo) === 0,
              }

              const { error: insertError } = await supabase.from("state_background_photos").upsert(photoData, {
                onConflict: "state_code,photo_id",
              })

              if (insertError) {
                stateResult.errors.push(`Failed to insert photo ${photo.id}: ${insertError.message}`)
              } else {
                stateResult.photos_added++
                totalPhotosAdded++
              }
            }
          } catch (err) {
            stateResult.errors.push(`Query "${query}" failed: ${err}`)
          }
        }

        results.push(stateResult)
        statesProcessed++
      }),
    )

    // Rate limit: wait 1 second between batches
    if (i + batchSize < states.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return NextResponse.json({
    success: true,
    states_processed: statesProcessed,
    total_photos_added: totalPhotosAdded,
    results,
    timestamp: new Date().toISOString(),
  })
}

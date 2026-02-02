// Fetches app store ratings for credit union mobile apps
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cuId = searchParams.get("cu_id")
  const name = searchParams.get("name")

  if (!cuId || !name) {
    return NextResponse.json({ error: "Missing cu_id or name" }, { status: 400 })
  }

  const supabase = await createClient()

  // Search for the CU's mobile app on both stores
  const ratings = {
    ios: {
      app_id: null as string | null,
      rating: null as number | null,
      review_count: null as number | null,
      last_updated: null as string | null,
    },
    android: {
      app_id: null as string | null,
      rating: null as number | null,
      review_count: null as number | null,
      last_updated: null as string | null,
    },
  }

  // Store app ratings
  await supabase.from("cu_app_ratings").upsert(
    {
      cu_id: cuId,
      ios_app_id: ratings.ios.app_id,
      ios_rating: ratings.ios.rating,
      ios_review_count: ratings.ios.review_count,
      android_app_id: ratings.android.app_id,
      android_rating: ratings.android.rating,
      android_review_count: ratings.android.review_count,
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "cu_id" },
  )

  return NextResponse.json({ ratings })
}

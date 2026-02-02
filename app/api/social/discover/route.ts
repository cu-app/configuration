// Discovers social media profiles for a credit union
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
  const socialProfiles: Record<string, string | null> = {
    facebook: null,
    twitter: null,
    instagram: null,
    linkedin: null,
    youtube: null,
  }

  // Common patterns for credit union social handles
  const searchName = name
    .toLowerCase()
    .replace(/credit union|federal|fcu/gi, "")
    .trim()
    .replace(/\s+/g, "")

  // Store social profiles
  await supabase.from("cu_social_profiles").upsert(
    {
      cu_id: cuId,
      ...socialProfiles,
      discovered_at: new Date().toISOString(),
    },
    { onConflict: "cu_id" },
  )

  return NextResponse.json({ profiles: socialProfiles })
}

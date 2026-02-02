import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/app-templates - List all templates for a tenant
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get("tenantId")

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("app_templates")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching templates:", error)
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 }
      )
    }

    return NextResponse.json({ templates: data || [] })
  } catch (error) {
    console.error("Error in GET /api/app-templates:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/app-templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, name, description, isDefault } = body

    if (!tenantId || !name) {
      return NextResponse.json(
        { error: "tenantId and name are required" },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("app_templates")
      .insert({
        tenant_id: tenantId,
        name,
        slug,
        description: description || null,
        is_default: isDefault || false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating template:", error)
      
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A template with this name already exists" },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: "Failed to create template" },
        { status: 500 }
      )
    }

    return NextResponse.json({ template: data }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/app-templates:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

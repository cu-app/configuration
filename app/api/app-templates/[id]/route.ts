import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/app-templates/[id] - Get a single template
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("app_templates")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        )
      }
      console.error("Error fetching template:", error)
      return NextResponse.json(
        { error: "Failed to fetch template" },
        { status: 500 }
      )
    }

    return NextResponse.json({ template: data })
  } catch (error) {
    console.error("Error in GET /api/app-templates/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/app-templates/[id] - Update a template
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Build update object from allowed fields
    const allowedFields = [
      "name",
      "description",
      "logo_url",
      "logo_storage_path",
      "splash_config",
      "theme_config",
      "nav_config",
      "features",
      "is_active",
      "is_default",
    ]

    const updateData: Record<string, any> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Update slug if name changed
    if (body.name) {
      updateData.slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("app_templates")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        )
      }
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A template with this name already exists" },
          { status: 409 }
        )
      }
      console.error("Error updating template:", error)
      return NextResponse.json(
        { error: "Failed to update template" },
        { status: 500 }
      )
    }

    return NextResponse.json({ template: data })
  } catch (error) {
    console.error("Error in PATCH /api/app-templates/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/app-templates/[id] - Delete a template (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Soft delete by setting is_active to false
    const { data, error } = await supabase
      .from("app_templates")
      .update({ is_active: false })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        )
      }
      console.error("Error deleting template:", error)
      return NextResponse.json(
        { error: "Failed to delete template" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, template: data })
  } catch (error) {
    console.error("Error in DELETE /api/app-templates/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

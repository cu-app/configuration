import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/app-templates/[id]/logo - Upload logo for a template
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PNG, JPEG, SVG, WebP" },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // First, get the template to verify it exists and get tenant_id
    const { data: template, error: templateError } = await supabase
      .from("app_templates")
      .select("id, tenant_id, logo_storage_path")
      .eq("id", id)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    // Delete old logo if exists
    if (template.logo_storage_path) {
      await supabase.storage
        .from("app-logos")
        .remove([template.logo_storage_path])
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop() || "png"
    const fileName = `${template.tenant_id}/${id}/logo-${Date.now()}.${fileExt}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("app-logos")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("Error uploading logo:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload logo" },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("app-logos")
      .getPublicUrl(fileName)

    const logoUrl = urlData.publicUrl

    // Update template with new logo URL
    const { data: updatedTemplate, error: updateError } = await supabase
      .from("app_templates")
      .update({
        logo_url: logoUrl,
        logo_storage_path: fileName,
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating template with logo:", updateError)
      return NextResponse.json(
        { error: "Failed to update template" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      logoUrl,
      template: updatedTemplate,
    })
  } catch (error) {
    console.error("Error in POST /api/app-templates/[id]/logo:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/app-templates/[id]/logo - Remove logo from template
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

    // Get current template
    const { data: template, error: templateError } = await supabase
      .from("app_templates")
      .select("id, logo_storage_path")
      .eq("id", id)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    // Delete from storage if exists
    if (template.logo_storage_path) {
      await supabase.storage
        .from("app-logos")
        .remove([template.logo_storage_path])
    }

    // Update template to remove logo URL
    const { data: updatedTemplate, error: updateError } = await supabase
      .from("app_templates")
      .update({
        logo_url: null,
        logo_storage_path: null,
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating template:", updateError)
      return NextResponse.json(
        { error: "Failed to update template" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      template: updatedTemplate,
    })
  } catch (error) {
    console.error("Error in DELETE /api/app-templates/[id]/logo:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

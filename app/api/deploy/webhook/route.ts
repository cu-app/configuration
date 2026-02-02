/**
 * Deploy Webhook API
 * 
 * Receives events from GitHub Actions self-healing deploy workflow:
 * - deploy.started
 * - deploy.completed
 * - deploy.failed
 * - health_check.completed
 * - tests.completed
 * - rollback.triggered
 * - rollback.completed
 * - deploy.success
 * 
 * Updates deploy history in database and can trigger rollback.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// ============================================================================
// TYPES
// ============================================================================

interface DeployEvent {
  event: string
  deploy_id: string
  tenant_id: string
  version?: string | number
  commit_sha?: string
  branch?: string
  deploy_url?: string
  status?: string
  error?: string
  healthy?: boolean
  passed?: boolean
  details?: Record<string, unknown>
  failed_version?: string | number
  rollback_to_version?: string | number
  reason?: string
  health_check_passed?: boolean
  tests_passed?: boolean
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret (optional but recommended)
    const webhookSecret = process.env.DEPLOY_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = req.headers.get("x-webhook-signature")
      // In production, verify HMAC signature here
    }

    const event: DeployEvent = await req.json()
    console.log(`[deploy-webhook] Received event: ${event.event}`, event)

    if (!event.event || !event.tenant_id) {
      return NextResponse.json(
        { error: "Missing required fields: event, tenant_id" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    switch (event.event) {
      case "deploy.started":
        await handleDeployStarted(supabase, event)
        break

      case "deploy.completed":
        await handleDeployCompleted(supabase, event)
        break

      case "deploy.failed":
        await handleDeployFailed(supabase, event)
        break

      case "health_check.completed":
        await handleHealthCheck(supabase, event)
        break

      case "tests.completed":
        await handleTestsCompleted(supabase, event)
        break

      case "rollback.triggered":
        await handleRollbackTriggered(supabase, event)
        break

      case "rollback.completed":
        await handleRollbackCompleted(supabase, event)
        break

      case "deploy.success":
        await handleDeploySuccess(supabase, event)
        break

      default:
        console.warn(`[deploy-webhook] Unknown event: ${event.event}`)
    }

    return NextResponse.json({ success: true, event: event.event })
  } catch (error) {
    console.error("[deploy-webhook] Error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

async function handleDeployStarted(supabase: any, event: DeployEvent) {
  // Get config snapshot
  const { data: config } = await supabase
    .from("cu_configs")
    .select("config, version")
    .eq("tenant_id", event.tenant_id)
    .single()

  // Create deploy history entry
  const { error } = await supabase.from("cu_deploy_history").insert({
    tenant_id: event.tenant_id,
    version: event.version || config?.version || 1,
    config_snapshot: config?.config || {},
    commit_sha: event.commit_sha,
    branch: event.branch || "main",
    status: "deploying",
    started_at: new Date().toISOString(),
  })

  if (error) {
    console.error("[deploy-webhook] Failed to create deploy history:", error)
  }

  // Log to audit
  await supabase.from("cu_audit_log").insert({
    tenant_id: event.tenant_id,
    action: "deploy.started",
    change_summary: `Deploy started for version ${event.version || "latest"}`,
  })
}

async function handleDeployCompleted(supabase: any, event: DeployEvent) {
  // Update deploy history
  const { error } = await supabase
    .from("cu_deploy_history")
    .update({
      status: event.status === "success" ? "success" : "pending",
      completed_at: new Date().toISOString(),
    })
    .eq("tenant_id", event.tenant_id)
    .eq("status", "deploying")
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) {
    console.error("[deploy-webhook] Failed to update deploy history:", error)
  }
}

async function handleDeployFailed(supabase: any, event: DeployEvent) {
  // Update deploy history
  const { error } = await supabase
    .from("cu_deploy_history")
    .update({
      status: "failed",
      error_message: event.error || "Deploy failed",
      completed_at: new Date().toISOString(),
    })
    .eq("tenant_id", event.tenant_id)
    .eq("status", "deploying")
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) {
    console.error("[deploy-webhook] Failed to update deploy history:", error)
  }

  // Log to audit
  await supabase.from("cu_audit_log").insert({
    tenant_id: event.tenant_id,
    action: "deploy.failed",
    change_summary: `Deploy failed: ${event.error || "Unknown error"}`,
  })
}

async function handleHealthCheck(supabase: any, event: DeployEvent) {
  // Update deploy history with health check results
  const { error } = await supabase
    .from("cu_deploy_history")
    .update({
      health_check_passed: event.healthy,
      health_check_details: event.details || {},
    })
    .eq("tenant_id", event.tenant_id)
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) {
    console.error("[deploy-webhook] Failed to update health check:", error)
  }
}

async function handleTestsCompleted(supabase: any, event: DeployEvent) {
  // Update deploy history with test results
  const updateData: Record<string, unknown> = {
    health_check_details: {
      tests_passed: event.passed,
      ...(event.details || {}),
    },
  }

  // If tests failed, mark as failed
  if (!event.passed) {
    updateData.status = "failed"
    updateData.error_message = "Integration tests failed"
  }

  const { error } = await supabase
    .from("cu_deploy_history")
    .update(updateData)
    .eq("tenant_id", event.tenant_id)
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) {
    console.error("[deploy-webhook] Failed to update test results:", error)
  }
}

async function handleRollbackTriggered(supabase: any, event: DeployEvent) {
  // Log the rollback
  await supabase.from("cu_audit_log").insert({
    tenant_id: event.tenant_id,
    action: "deploy.rollback_triggered",
    change_summary: `Rollback triggered from version ${event.failed_version} to ${event.rollback_to_version}. Reason: ${event.reason}`,
  })
}

async function handleRollbackCompleted(supabase: any, event: DeployEvent) {
  // Update the failed deploy entry
  const { error } = await supabase
    .from("cu_deploy_history")
    .update({
      status: "rolled_back",
      rolled_back_at: new Date().toISOString(),
      rolled_back_to_version: Number(event.rollback_to_version) || null,
    })
    .eq("tenant_id", event.tenant_id)
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) {
    console.error("[deploy-webhook] Failed to update rollback:", error)
  }

  // Log to audit
  await supabase.from("cu_audit_log").insert({
    tenant_id: event.tenant_id,
    action: "deploy.rollback_completed",
    change_summary: `Rollback completed to version ${event.rollback_to_version}`,
  })
}

async function handleDeploySuccess(supabase: any, event: DeployEvent) {
  // Mark deploy as successful
  const { error } = await supabase
    .from("cu_deploy_history")
    .update({
      status: "success",
      health_check_passed: event.health_check_passed ?? true,
      completed_at: new Date().toISOString(),
    })
    .eq("tenant_id", event.tenant_id)
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) {
    console.error("[deploy-webhook] Failed to mark deploy success:", error)
  }

  // Log to audit
  await supabase.from("cu_audit_log").insert({
    tenant_id: event.tenant_id,
    action: "deploy.success",
    change_summary: `Deploy successful for version ${event.version}`,
  })
}

// ============================================================================
// GET - Retrieve deploy status
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const tenantId = searchParams.get("tenantId")
    const deployId = searchParams.get("deployId")

    if (!tenantId && !deployId) {
      return NextResponse.json(
        { error: "tenantId or deployId required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    if (deployId) {
      // Get specific deploy
      const { data, error } = await supabase
        .from("cu_deploy_history")
        .select("*")
        .eq("id", deployId)
        .single()

      if (error) {
        return NextResponse.json({ error: "Deploy not found" }, { status: 404 })
      }

      return NextResponse.json(data)
    }

    // Get recent deploys for tenant
    const { data, error } = await supabase
      .from("cu_deploy_history")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json({ error: "Failed to fetch deploys" }, { status: 500 })
    }

    // Calculate stats
    const stats = {
      total: data?.length || 0,
      successful: data?.filter((d) => d.status === "success").length || 0,
      failed: data?.filter((d) => d.status === "failed").length || 0,
      rolledBack: data?.filter((d) => d.status === "rolled_back").length || 0,
      lastDeploy: data?.[0] || null,
    }

    return NextResponse.json({ deploys: data || [], stats })
  } catch (error) {
    console.error("[deploy-webhook] GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch deploy status" },
      { status: 500 }
    )
  }
}

// ============================================================================
// TRIGGER DEPLOY (Manual)
// ============================================================================

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenant_id, action, version } = body

    if (!tenant_id || !action) {
      return NextResponse.json(
        { error: "tenant_id and action required" },
        { status: 400 }
      )
    }

    const githubToken = process.env.GITHUB_TOKEN
    const githubRepo = process.env.GITHUB_REPO || "cu-app/configuration-matrix"

    if (!githubToken) {
      return NextResponse.json(
        { error: "GitHub integration not configured" },
        { status: 500 }
      )
    }

    if (action === "deploy") {
      // Get current config
      const supabase = await createClient()
      const { data: config } = await supabase
        .from("cu_configs")
        .select("config, version")
        .eq("tenant_id", tenant_id)
        .single()

      // Trigger GitHub Actions workflow
      const response = await fetch(
        `https://api.github.com/repos/${githubRepo}/dispatches`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_type: "config-published",
            client_payload: {
              tenant_id,
              version: version || config?.version,
              config: config?.config,
            },
          }),
        }
      )

      if (!response.ok) {
        const error = await response.text()
        console.error("[deploy-webhook] GitHub dispatch failed:", error)
        return NextResponse.json(
          { error: "Failed to trigger deploy" },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, message: "Deploy triggered" })
    }

    if (action === "rollback") {
      // Trigger rollback workflow
      const response = await fetch(
        `https://api.github.com/repos/${githubRepo}/dispatches`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_type: "deploy-config",
            client_payload: {
              tenant_id,
              rollback_to: version,
            },
          }),
        }
      )

      if (!response.ok) {
        return NextResponse.json(
          { error: "Failed to trigger rollback" },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, message: "Rollback triggered" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[deploy-webhook] PUT error:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}

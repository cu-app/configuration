import { NextResponse } from "next/server"

const MOTION_API_TOKEN =
  process.env.MOTION_API_TOKEN || "74184f954587a76bc3c25c8879d514fc8fa3442c4bd2609d9309b3d9da0e5db0"
const MOTION_API_BASE = "https://api.usemotion.com/v1"

export async function GET() {
  try {
    // Fetch workspaces
    const workspacesRes = await fetch(`${MOTION_API_BASE}/workspaces`, {
      headers: {
        "X-API-Key": MOTION_API_TOKEN,
      },
    })

    if (!workspacesRes.ok) {
      throw new Error("Failed to fetch workspaces")
    }

    const workspacesData = await workspacesRes.json()
    const workspaces = workspacesData.workspaces || workspacesData

    // Fetch tasks for each workspace
    const tasksPromises = workspaces.map(async (workspace: any) => {
      const tasksRes = await fetch(`${MOTION_API_BASE}/workspaces/${workspace.id}/tasks`, {
        headers: {
          "X-API-Key": MOTION_API_TOKEN,
        },
      })

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        return {
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          tasks: tasksData.tasks || tasksData,
        }
      }
      return null
    })

    const allTasks = await Promise.all(tasksPromises)

    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      workspaces: workspaces.length,
      totalTasks: allTasks.filter(Boolean).reduce((acc, curr) => acc + (curr?.tasks?.length || 0), 0),
      data: allTasks.filter(Boolean),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Motion sync failed",
      },
      { status: 500 },
    )
  }
}

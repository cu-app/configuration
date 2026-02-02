import { NextResponse } from "next/server"

const MOTION_API_TOKEN =
  process.env.MOTION_API_TOKEN || "74184f954587a76bc3c25c8879d514fc8fa3442c4bd2609d9309b3d9da0e5db0"
const MOTION_API_BASE = "https://api.usemotion.com/v1"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get("workspaceId")

  try {
    const endpoint = workspaceId ? `${MOTION_API_BASE}/workspaces/${workspaceId}/tasks` : `${MOTION_API_BASE}/tasks`

    const response = await fetch(endpoint, {
      headers: {
        "X-API-Key": MOTION_API_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Motion API error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      tasks: data.tasks || data,
      lastSync: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch tasks",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const response = await fetch(`${MOTION_API_BASE}/tasks`, {
      method: "POST",
      headers: {
        "X-API-Key": MOTION_API_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Motion API error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      task: data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create task",
      },
      { status: 500 },
    )
  }
}

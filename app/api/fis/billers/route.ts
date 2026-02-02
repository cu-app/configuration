import { NextRequest, NextResponse } from "next/server"
import { getFISAdapter } from "@/lib/services/fis-adapter"

// GET /api/fis/billers - Search billers or get member's saved billers
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const memberId = searchParams.get("memberId")
    const query = searchParams.get("q")
    const category = searchParams.get("category")

    const adapter = getFISAdapter()

    // If query provided, search billers
    if (query) {
      const results = await adapter.searchBillers(query, category || undefined)
      
      return NextResponse.json({
        billers: results.map(biller => ({
          id: biller.billerId,
          name: biller.name,
          category: biller.category,
          logoUrl: biller.logoUrl,
          requiresAccountNumber: biller.requiresAccountNumber,
          fields: biller.fields,
        })),
        count: results.length,
      })
    }

    // Otherwise, get member's saved billers
    if (!memberId) {
      return NextResponse.json(
        { error: "Either 'q' (search query) or 'memberId' is required" },
        { status: 400 }
      )
    }

    const billers = await adapter.getMemberBillers(memberId)

    return NextResponse.json({
      billers: billers.map(biller => ({
        id: biller.billerId,
        name: biller.name,
        accountNumber: biller.accountNumber,
        address: biller.address,
      })),
      count: billers.length,
    })
  } catch (error) {
    console.error("Error fetching billers:", error)
    return NextResponse.json(
      { error: "Failed to fetch billers" },
      { status: 500 }
    )
  }
}

// POST /api/fis/billers - Add a biller to member's saved billers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { memberId, billerId, name, accountNumber, address } = body

    if (!memberId || !billerId || !name || !accountNumber) {
      return NextResponse.json(
        { error: "memberId, billerId, name, and accountNumber are required" },
        { status: 400 }
      )
    }

    const adapter = getFISAdapter()
    const biller = await adapter.addMemberBiller(memberId, {
      billerId,
      name,
      accountNumber,
      address,
    })

    return NextResponse.json({
      biller: {
        id: biller.billerId,
        name: biller.name,
        accountNumber: biller.accountNumber,
        address: biller.address,
      }
    }, { status: 201 })
  } catch (error) {
    console.error("Error adding biller:", error)
    return NextResponse.json(
      { error: "Failed to add biller" },
      { status: 500 }
    )
  }
}

// DELETE /api/fis/billers - Remove a biller from member's saved billers
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const memberId = searchParams.get("memberId")
    const billerId = searchParams.get("billerId")

    if (!memberId || !billerId) {
      return NextResponse.json(
        { error: "memberId and billerId are required" },
        { status: 400 }
      )
    }

    const adapter = getFISAdapter()
    await adapter.removeMemberBiller(memberId, billerId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing biller:", error)
    return NextResponse.json(
      { error: "Failed to remove biller" },
      { status: 500 }
    )
  }
}

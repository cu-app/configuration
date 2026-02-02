import { NextRequest, NextResponse } from "next/server"
import { getTenantAdapter, formatCurrency } from "@/lib/services/tenant-banking-adapter"

// GET /api/scu/transfers - Get scheduled transfers for a member
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const memberId = searchParams.get("memberId")
    const tenantId = searchParams.get("tenantId") || "default"

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId is required" },
        { status: 400 }
      )
    }

    const adapter = getTenantAdapter(tenantId)
    const transfers = await adapter.getScheduledTransfers(memberId)
    const tenantInitials = await adapter.getTenantInitials()

    // Transform to Flutter app format
    const transformedTransfers = transfers.map(transfer => ({
      id: transfer.transferId,
      fromAccount: transfer.fromAccount,
      toAccount: transfer.toAccount,
      amount: transfer.amount,
      formattedAmount: formatCurrency(transfer.amount),
      status: transfer.status.toLowerCase(),
      createdAt: transfer.createdAt,
      completedAt: transfer.completedAt,
      errors: transfer.errors,
      tenantInitials,
    }))

    return NextResponse.json({ 
      transfers: transformedTransfers,
      tenantInitials,
    })
  } catch (error) {
    console.error("Error fetching transfers:", error)
    return NextResponse.json(
      { error: "Failed to fetch transfers" },
      { status: 500 }
    )
  }
}

// POST /api/scu/transfers - Request a new transfer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId = "default", fromAccountId, toAccountId, amount, memo, scheduleDate, frequency } = body

    if (!fromAccountId || !toAccountId || !amount) {
      return NextResponse.json(
        { error: "fromAccountId, toAccountId, and amount are required" },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      )
    }

    const adapter = getTenantAdapter(tenantId)
    const response = await adapter.requestTransfer({
      fromAccountId,
      toAccountId,
      amount,
      memo,
      scheduleDate,
      frequency,
    })
    const tenantInitials = await adapter.getTenantInitials()

    // Check for errors
    if (response.errors && response.errors.length > 0) {
      return NextResponse.json(
        { 
          error: "Transfer request failed",
          details: response.errors,
          tenantInitials,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      transfer: {
        id: response.transferId,
        status: response.status.toLowerCase(),
        fromAccount: response.fromAccount,
        toAccount: response.toAccount,
        amount: response.amount,
        formattedAmount: formatCurrency(response.amount),
        createdAt: response.createdAt,
        tenantInitials,
      }
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating transfer:", error)
    return NextResponse.json(
      { error: "Failed to create transfer" },
      { status: 500 }
    )
  }
}

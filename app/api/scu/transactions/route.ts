import { NextRequest, NextResponse } from "next/server"
import { getTenantAdapter, formatCurrency } from "@/lib/services/tenant-banking-adapter"

// GET /api/scu/transactions - Get transactions for an account
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const accountId = searchParams.get("accountId")
    const tenantId = searchParams.get("tenantId") || "default"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 }
      )
    }

    const adapter = getTenantAdapter(tenantId)
    const transactions = await adapter.getAccountTransactions(accountId, {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    })
    const tenantInitials = await adapter.getTenantInitials()

    // Transform to Flutter app format
    const transformedTransactions = transactions.map(tx => ({
      id: tx.transactionId,
      accountId: tx.accountId,
      type: tx.type.toLowerCase(),
      category: tx.category,
      description: tx.description,
      amount: tx.amount,
      formattedAmount: formatCurrency(Math.abs(tx.amount)),
      displayAmount: tx.type === 'DEBIT' 
        ? `-${formatCurrency(Math.abs(tx.amount))}` 
        : `+${formatCurrency(tx.amount)}`,
      runningBalance: tx.runningBalance,
      formattedBalance: formatCurrency(tx.runningBalance),
      postedDate: tx.postedDate,
      effectiveDate: tx.effectiveDate,
      status: tx.status.toLowerCase(),
      isDebit: tx.type === 'DEBIT',
      isCredit: tx.type === 'CREDIT',
      tenantInitials,
    }))

    return NextResponse.json({ 
      transactions: transformedTransactions,
      count: transformedTransactions.length,
      tenantInitials,
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    )
  }
}

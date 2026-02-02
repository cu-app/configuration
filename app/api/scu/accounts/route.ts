import { NextRequest, NextResponse } from "next/server"
import { getTenantAdapter, mapAccountType, formatCurrency } from "@/lib/services/tenant-banking-adapter"

// GET /api/scu/accounts - Get accounts for a member (legacy route, use /api/tenant/[tenantId]/accounts)
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
    const accounts = await adapter.getMemberAccounts(memberId)
    const tenantInitials = await adapter.getTenantInitials()

    // Transform to Flutter app format
    const transformedAccounts = accounts.map(account => ({
      id: account.accountId,
      accountNumber: account.accountNumber,
      type: mapAccountType(account.accountType),
      subType: account.accountSubType,
      name: account.description,
      balance: account.balance,
      availableBalance: account.availableBalance,
      formattedBalance: formatCurrency(account.balance),
      formattedAvailable: formatCurrency(account.availableBalance),
      interestRate: account.interestRate,
      maturityDate: account.maturityDate,
      status: account.status.toLowerCase(),
      tenantInitials,
    }))

    return NextResponse.json({ 
      accounts: transformedAccounts,
      tenantInitials,
    })
  } catch (error) {
    console.error("Error fetching accounts:", error)
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    )
  }
}

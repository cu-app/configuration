import { NextRequest, NextResponse } from "next/server"
import { 
  getFISAdapter, 
  calculateDeliveryDate,
  PAYMENT_TYPE_LABELS,
  type FISPaymentRequest,
  type FISAccountReference,
} from "@/lib/services/fis-adapter"

// GET /api/fis/payments - Get payment history for a member
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const memberId = searchParams.get("memberId")
    const paymentType = searchParams.get("type")
    const status = searchParams.get("status")
    const pageSize = searchParams.get("pageSize")
    const pageNumber = searchParams.get("pageNumber")

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId is required" },
        { status: 400 }
      )
    }

    const adapter = getFISAdapter()
    const history = await adapter.getPaymentHistory(memberId, {
      paymentType: paymentType || undefined,
      status: status || undefined,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      pageNumber: pageNumber ? parseInt(pageNumber) : 1,
    })

    // Transform to Flutter app format
    const transformedPayments = history.payments.map(payment => ({
      id: payment.paymentId,
      type: payment.paymentType,
      typeLabel: PAYMENT_TYPE_LABELS[payment.paymentType] || payment.paymentType,
      amount: payment.amount,
      formattedAmount: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(payment.amount / 100),
      recipient: payment.recipient,
      status: payment.status.toLowerCase(),
      createdDate: payment.createdDate,
      completedDate: payment.completedDate,
    }))

    return NextResponse.json({
      payments: transformedPayments,
      totalCount: history.totalCount,
      pageSize: history.pageSize,
      pageNumber: history.pageNumber,
      hasMore: history.pageNumber * history.pageSize < history.totalCount,
    })
  } catch (error) {
    console.error("Error fetching payment history:", error)
    return NextResponse.json(
      { error: "Failed to fetch payment history" },
      { status: 500 }
    )
  }
}

// POST /api/fis/payments - Submit a new payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      paymentType, 
      sourceAccount,
      destinationAccount,
      recipient,
      biller,
      amount, 
      memo,
      scheduledDate,
      expedited,
    } = body

    if (!paymentType || !sourceAccount || !amount) {
      return NextResponse.json(
        { error: "paymentType, sourceAccount, and amount are required" },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      )
    }

    const adapter = getFISAdapter()
    let response

    // Route to appropriate payment method based on type
    switch (paymentType) {
      case 'P2P':
        if (!recipient) {
          return NextResponse.json(
            { error: "recipient is required for P2P payments" },
            { status: 400 }
          )
        }
        response = await adapter.sendP2PPayment(
          sourceAccount,
          recipient,
          amount,
          memo
        )
        break

      case 'ACH':
        if (!destinationAccount) {
          return NextResponse.json(
            { error: "destinationAccount is required for ACH transfers" },
            { status: 400 }
          )
        }
        response = await adapter.initiateACHTransfer(
          sourceAccount,
          destinationAccount,
          amount,
          memo,
          scheduledDate
        )
        break

      case 'BILLPAY':
        if (!biller) {
          return NextResponse.json(
            { error: "biller is required for bill payments" },
            { status: 400 }
          )
        }
        response = await adapter.submitBillPayment(
          sourceAccount,
          biller,
          amount,
          scheduledDate
        )
        break

      case 'WIRE':
        if (!recipient) {
          return NextResponse.json(
            { error: "recipient is required for wire transfers" },
            { status: 400 }
          )
        }
        response = await adapter.initiateWireTransfer(
          sourceAccount,
          recipient as any,
          amount,
          memo || 'Wire Transfer',
          expedited
        )
        break

      default:
        return NextResponse.json(
          { error: `Invalid payment type: ${paymentType}` },
          { status: 400 }
        )
    }

    // Check for errors
    if (response.errors && response.errors.length > 0) {
      return NextResponse.json(
        { 
          error: "Payment failed",
          details: response.errors,
        },
        { status: 400 }
      )
    }

    const estimatedDelivery = calculateDeliveryDate(paymentType as any, expedited)

    return NextResponse.json({
      payment: {
        id: response.paymentId,
        confirmationNumber: response.confirmationNumber,
        status: response.status.toLowerCase(),
        estimatedDeliveryDate: response.estimatedDeliveryDate || estimatedDelivery.toISOString(),
        fees: response.fees,
        amount: amount,
        formattedAmount: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(amount / 100),
        type: paymentType,
        typeLabel: PAYMENT_TYPE_LABELS[paymentType],
      }
    }, { status: 201 })
  } catch (error) {
    console.error("Error submitting payment:", error)
    return NextResponse.json(
      { error: "Failed to submit payment" },
      { status: 500 }
    )
  }
}

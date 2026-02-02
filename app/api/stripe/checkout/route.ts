import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { SOURCE_CODE_PRODUCT } from "@/lib/products"

export async function POST(request: Request) {
  try {
    const { creditUnionName } = await request.json()

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: SOURCE_CODE_PRODUCT.name,
              description: `Complete source code license for ${creditUnionName}`,
            },
            unit_amount: SOURCE_CODE_PRODUCT.priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?purchase=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?purchase=cancelled`,
      metadata: {
        creditUnionName,
        productId: SOURCE_CODE_PRODUCT.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 })
  }
}

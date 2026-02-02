"use server"

import { getStripe } from "@/lib/stripe"
import { GITHUB_CLONE_PRODUCTS } from "@/lib/products"
import { createClient } from "@/lib/supabase/server"

export async function startGitHubCloneCheckout(productId: string) {
  const product = GITHUB_CLONE_PRODUCTS.find((p) => p.id === productId)
  if (!product) {
    throw new Error(`Product with id "${productId}" not found`)
  }

  // Get current user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User must be authenticated to subscribe")
  }

  // Create Checkout Session for subscription
  const session = await getStripe().checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    customer_email: user.email,
    client_reference_id: user.id,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
          recurring: product.interval && product.interval !== "one-time"
            ? {
                interval: product.interval as "month" | "year",
              }
            : undefined,
        },
        quantity: 1,
      },
    ],
    mode: product.interval ? "subscription" : "payment",
    metadata: {
      user_id: user.id,
      product_id: product.id,
    },
  })

  return session.client_secret
}

export async function checkGitHubCloneAccess(): Promise<{
  hasAccess: boolean
  planName?: string
  features?: string[]
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { hasAccess: false }
  }

  // Check if user has an active subscription in Supabase
  const { data: subscription } = await supabase
    .from("cu_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (subscription) {
    const product = GITHUB_CLONE_PRODUCTS.find((p) => p.id === subscription.product_id)
    return {
      hasAccess: true,
      planName: product?.name,
      features: product?.features,
    }
  }

  return { hasAccess: false }
}

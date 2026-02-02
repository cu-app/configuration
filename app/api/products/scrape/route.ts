// Scrapes credit union website for product information
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cuId = searchParams.get("cu_id")
  const website = searchParams.get("website")

  if (!cuId || !website) {
    return NextResponse.json({ error: "Missing cu_id or website" }, { status: 400 })
  }

  const supabase = await createClient()

  // Common product pages to check
  const productPages = ["/rates", "/products", "/services", "/loans", "/savings", "/checking", "/credit-cards"]

  const products: Array<{
    type: string
    name: string
    rate: string | null
    url: string
  }> = []

  // Store discovered products
  for (const product of products) {
    await supabase.from("cu_products").upsert(
      {
        cu_id: cuId,
        product_type: product.type,
        product_name: product.name,
        rate_apy: product.rate,
        source_url: product.url,
        discovered_at: new Date().toISOString(),
      },
      { onConflict: "cu_id,product_type,product_name" },
    )
  }

  return NextResponse.json({ products_found: products.length, products })
}

import { type NextRequest, NextResponse } from "next/server"

/**
 * Logo Processor Edge Function
 *
 * Converts institution logos into multiple formats:
 * - Original (color)
 * - Monochrome (B&W using CSS filter, not actual vector conversion)
 * - Multiple sizes (48px, 32px, 24px)
 *
 * For true SVG vectorization, we'd need a service like Vectorizer.ai
 * This implementation provides URL-based transformations
 */

interface LogoVariant {
  type: "original" | "monochrome" | "48px" | "32px" | "24px"
  url: string
  width: number
  height: number
  format: "png" | "svg"
}

interface ProcessedLogo {
  domain: string
  originalUrl: string
  variants: LogoVariant[]
  processedAt: string
  cacheControl: string
}

// Clearbit supports size parameter
function getClearbitUrl(domain: string, size?: number): string {
  const baseUrl = `https://logo.clearbit.com/${domain}`
  return size ? `${baseUrl}?size=${size}` : baseUrl
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get("domain")

  if (!domain) {
    return NextResponse.json({ error: "Missing domain parameter" }, { status: 400 })
  }

  // Clean the domain
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0]

  // Test if Clearbit has the logo
  const testUrl = getClearbitUrl(cleanDomain)

  try {
    const response = await fetch(testUrl, { method: "HEAD" })

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Logo not found in Clearbit",
          domain: cleanDomain,
          fallback: true,
          suggestion: "Use initials fallback with primaryColor",
        },
        { status: 404 },
      )
    }

    // Generate all variants
    const processed: ProcessedLogo = {
      domain: cleanDomain,
      originalUrl: getClearbitUrl(cleanDomain),
      variants: [
        {
          type: "original",
          url: getClearbitUrl(cleanDomain, 128),
          width: 128,
          height: 128,
          format: "png",
        },
        {
          type: "monochrome",
          // Monochrome is achieved via CSS filter on the client
          // filter: grayscale(100%) contrast(1.2)
          url: getClearbitUrl(cleanDomain, 128),
          width: 128,
          height: 128,
          format: "png",
        },
        {
          type: "48px",
          url: getClearbitUrl(cleanDomain, 48),
          width: 48,
          height: 48,
          format: "png",
        },
        {
          type: "32px",
          url: getClearbitUrl(cleanDomain, 32),
          width: 32,
          height: 32,
          format: "png",
        },
        {
          type: "24px",
          url: getClearbitUrl(cleanDomain, 24),
          width: 24,
          height: 24,
          format: "png",
        },
      ],
      processedAt: new Date().toISOString(),
      cacheControl: "public, max-age=86400, s-maxage=604800", // 1 day browser, 7 days CDN
    }

    return NextResponse.json(processed, {
      headers: {
        "Cache-Control": processed.cacheControl,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process logo",
        domain: cleanDomain,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  // Batch process multiple domains
  try {
    const { domains } = await request.json()

    if (!Array.isArray(domains) || domains.length === 0) {
      return NextResponse.json({ error: "domains must be a non-empty array" }, { status: 400 })
    }

    const results = await Promise.all(
      domains.map(async (domain: string) => {
        const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0]
        const testUrl = getClearbitUrl(cleanDomain)

        try {
          const response = await fetch(testUrl, { method: "HEAD" })
          return {
            domain: cleanDomain,
            available: response.ok,
            url: response.ok ? getClearbitUrl(cleanDomain) : null,
          }
        } catch {
          return {
            domain: cleanDomain,
            available: false,
            url: null,
          }
        }
      }),
    )

    return NextResponse.json({
      processed: results.length,
      available: results.filter((r) => r.available).length,
      results,
      processedAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

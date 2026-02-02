/**
 * App Store Reviews API
 * 
 * Fetches real reviews from:
 * - Apple App Store Connect API
 * - Google Play Developer API
 * 
 * Also supports replying to reviews.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SignJWT, importPKCS8 } from "jose"

// ============================================================================
// TYPES
// ============================================================================

interface AppStoreReview {
  id: string
  platform: "ios" | "android"
  rating: number
  title?: string
  review: string
  author: string
  date: string
  version?: string
  responded: boolean
  response?: string
  responseDate?: string
  sentiment: "positive" | "neutral" | "negative"
}

interface AppStoreCredentials {
  // iOS
  apple_issuer_id?: string
  apple_key_id?: string
  apple_private_key?: string
  apple_app_id?: string
  // Android
  google_service_account_json?: string
  google_package_name?: string
}

// ============================================================================
// SENTIMENT ANALYSIS (Simple rule-based)
// ============================================================================

function analyzeSentiment(rating: number, text: string): "positive" | "neutral" | "negative" {
  // Rating-based first
  if (rating >= 4) return "positive"
  if (rating <= 2) return "negative"
  
  // For 3-star reviews, analyze text
  const positiveWords = ["good", "great", "love", "excellent", "amazing", "helpful", "works", "easy"]
  const negativeWords = ["bad", "terrible", "awful", "hate", "broken", "crash", "bug", "worst", "slow", "useless"]
  
  const lowerText = text.toLowerCase()
  const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length
  const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length
  
  if (positiveCount > negativeCount) return "positive"
  if (negativeCount > positiveCount) return "negative"
  return "neutral"
}

// ============================================================================
// APP STORE CONNECT API (iOS)
// ============================================================================

async function generateAppStoreConnectToken(credentials: AppStoreCredentials): Promise<string> {
  if (!credentials.apple_issuer_id || !credentials.apple_key_id || !credentials.apple_private_key) {
    throw new Error("Missing Apple credentials")
  }

  const privateKey = await importPKCS8(credentials.apple_private_key, "ES256")
  
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: credentials.apple_key_id, typ: "JWT" })
    .setIssuer(credentials.apple_issuer_id)
    .setIssuedAt()
    .setExpirationTime("20m")
    .setAudience("appstoreconnect-v1")
    .sign(privateKey)
  
  return token
}

async function fetchAppStoreReviews(credentials: AppStoreCredentials): Promise<AppStoreReview[]> {
  try {
    const token = await generateAppStoreConnectToken(credentials)
    
    // App Store Connect API endpoint for customer reviews
    const response = await fetch(
      `https://api.appstoreconnect.apple.com/v1/apps/${credentials.apple_app_id}/customerReviews?limit=50&sort=-createdDate`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error("[App Store] API error:", error)
      return []
    }

    const data = await response.json()
    
    return (data.data || []).map((review: any) => ({
      id: review.id,
      platform: "ios" as const,
      rating: review.attributes.rating,
      title: review.attributes.title,
      review: review.attributes.body,
      author: review.attributes.reviewerNickname || "Anonymous",
      date: review.attributes.createdDate,
      version: review.attributes.appVersionString,
      responded: !!review.relationships?.response?.data,
      sentiment: analyzeSentiment(review.attributes.rating, review.attributes.body || ""),
    }))
  } catch (error) {
    console.error("[App Store] Fetch error:", error)
    return []
  }
}

async function replyToAppStoreReview(
  credentials: AppStoreCredentials,
  reviewId: string,
  responseText: string
): Promise<boolean> {
  try {
    const token = await generateAppStoreConnectToken(credentials)
    
    const response = await fetch(
      `https://api.appstoreconnect.apple.com/v1/customerReviewResponses`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            type: "customerReviewResponses",
            attributes: {
              responseBody: responseText,
            },
            relationships: {
              review: {
                data: {
                  type: "customerReviews",
                  id: reviewId,
                },
              },
            },
          },
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error("[App Store] Reply error:", error)
    return false
  }
}

// ============================================================================
// GOOGLE PLAY DEVELOPER API (Android)
// ============================================================================

async function getGoogleAccessToken(credentials: AppStoreCredentials): Promise<string> {
  if (!credentials.google_service_account_json) {
    throw new Error("Missing Google credentials")
  }

  const serviceAccount = JSON.parse(credentials.google_service_account_json)
  
  // Create JWT for Google OAuth
  const privateKey = await importPKCS8(serviceAccount.private_key, "RS256")
  
  const token = await new SignJWT({
    scope: "https://www.googleapis.com/auth/androidpublisher",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(serviceAccount.client_email)
    .setSubject(serviceAccount.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey)

  // Exchange JWT for access token
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: token,
    }),
  })

  const data = await response.json()
  return data.access_token
}

async function fetchPlayStoreReviews(credentials: AppStoreCredentials): Promise<AppStoreReview[]> {
  try {
    if (!credentials.google_package_name) {
      throw new Error("Missing Google package name")
    }

    const accessToken = await getGoogleAccessToken(credentials)
    
    // Google Play Developer API endpoint for reviews
    const response = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${credentials.google_package_name}/reviews?maxResults=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error("[Play Store] API error:", error)
      return []
    }

    const data = await response.json()
    
    return (data.reviews || []).map((review: any) => {
      const comment = review.comments?.[0]?.userComment
      const devReply = review.comments?.[1]?.developerComment
      
      return {
        id: review.reviewId,
        platform: "android" as const,
        rating: comment?.starRating || 0,
        review: comment?.text || "",
        author: review.authorName || "Anonymous",
        date: comment?.lastModified?.seconds 
          ? new Date(comment.lastModified.seconds * 1000).toISOString()
          : new Date().toISOString(),
        version: comment?.appVersionName,
        responded: !!devReply,
        response: devReply?.text,
        responseDate: devReply?.lastModified?.seconds
          ? new Date(devReply.lastModified.seconds * 1000).toISOString()
          : undefined,
        sentiment: analyzeSentiment(comment?.starRating || 3, comment?.text || ""),
      }
    })
  } catch (error) {
    console.error("[Play Store] Fetch error:", error)
    return []
  }
}

async function replyToPlayStoreReview(
  credentials: AppStoreCredentials,
  reviewId: string,
  responseText: string
): Promise<boolean> {
  try {
    if (!credentials.google_package_name) {
      throw new Error("Missing Google package name")
    }

    const accessToken = await getGoogleAccessToken(credentials)
    
    const response = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${credentials.google_package_name}/reviews/${reviewId}:reply`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          replyText: responseText,
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error("[Play Store] Reply error:", error)
    return false
  }
}

// ============================================================================
// GET /api/app-store/reviews
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const tenantId = searchParams.get("tenantId") || searchParams.get("creditUnionId")
    const platform = searchParams.get("platform") // "ios", "android", or null for both

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId required" }, { status: 400 })
    }

    // Get credentials from database
    const supabase = await createClient()
    const { data: credentials, error } = await supabase
      .from("cu_app_store_credentials")
      .select("*")
      .eq("tenant_id", tenantId)
      .single()

    if (error || !credentials) {
      // Return empty array if no credentials configured
      return NextResponse.json({
        reviews: [],
        message: "App store credentials not configured",
        configured: { ios: false, android: false },
      })
    }

    const reviews: AppStoreReview[] = []

    // Fetch iOS reviews
    if ((!platform || platform === "ios") && credentials.ios_connected) {
      const iosReviews = await fetchAppStoreReviews(credentials)
      reviews.push(...iosReviews)
    }

    // Fetch Android reviews
    if ((!platform || platform === "android") && credentials.android_connected) {
      const androidReviews = await fetchPlayStoreReviews(credentials)
      reviews.push(...androidReviews)
    }

    // Sort by date descending
    reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calculate stats
    const stats = {
      total: reviews.length,
      ios: reviews.filter(r => r.platform === "ios").length,
      android: reviews.filter(r => r.platform === "android").length,
      averageRating: reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : "0.0",
      positive: reviews.filter(r => r.sentiment === "positive").length,
      negative: reviews.filter(r => r.sentiment === "negative").length,
      needsResponse: reviews.filter(r => !r.responded && r.rating <= 3).length,
    }

    return NextResponse.json({
      reviews,
      stats,
      configured: {
        ios: credentials.ios_connected,
        android: credentials.android_connected,
      },
    })
  } catch (error) {
    console.error("[GET /api/app-store/reviews] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/app-store/reviews (Reply to review)
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenantId, reviewId, platform, responseText } = body

    if (!tenantId || !reviewId || !platform || !responseText) {
      return NextResponse.json(
        { error: "tenantId, reviewId, platform, and responseText required" },
        { status: 400 }
      )
    }

    // Get credentials
    const supabase = await createClient()
    const { data: credentials, error } = await supabase
      .from("cu_app_store_credentials")
      .select("*")
      .eq("tenant_id", tenantId)
      .single()

    if (error || !credentials) {
      return NextResponse.json(
        { error: "App store credentials not configured" },
        { status: 400 }
      )
    }

    let success = false

    if (platform === "ios") {
      success = await replyToAppStoreReview(credentials, reviewId, responseText)
    } else if (platform === "android") {
      success = await replyToPlayStoreReview(credentials, reviewId, responseText)
    }

    if (!success) {
      return NextResponse.json(
        { error: "Failed to post reply" },
        { status: 500 }
      )
    }

    // Log the action
    await supabase.from("cu_audit_log").insert({
      tenant_id: tenantId,
      action: "review.reply",
      change_summary: `Replied to ${platform} review ${reviewId}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[POST /api/app-store/reviews] Error:", error)
    return NextResponse.json(
      { error: "Failed to post reply" },
      { status: 500 }
    )
  }
}

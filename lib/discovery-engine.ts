// YEXT-level Discovery Engine
// Queries 13+ sources to find ALL branch locations, contacts, logos, etc.

export interface DiscoverySource {
  name: string
  displayName: string
  priority: number
  capabilities: string[]
}

export interface DiscoveredItem {
  id: string
  sessionId: string
  creditUnionId: string
  itemType: "branch" | "logo" | "contact" | "social_profile" | "product" | "review" | "app"
  data: Record<string, unknown>
  source: string
  sourceUrl?: string
  confidenceScore: number
  confidenceReasoning: string
  verificationStatus: "pending" | "verified" | "rejected" | "edited"
  version: number
  createdAt: string
}

export interface DiscoverySession {
  id: string
  creditUnionId: string
  discoveryType: string
  status: "pending" | "running" | "completed" | "failed"
  sourcesQueried: string[]
  itemsFound: number
  itemsVerified: number
  itemsRejected: number
  startedAt?: string
  completedAt?: string
  errorMessage?: string
}

// Confidence scoring logic
export function calculateConfidence(item: {
  source: string
  hasPhoto: boolean
  hasPhone: boolean
  hasAddress: boolean
  hasHours: boolean
  hasWebsite: boolean
  matchesOtherSources: number
  totalSources: number
}): { score: number; reasoning: string } {
  let score = 0
  const reasons: string[] = []

  // Source reliability (0-30 points)
  const sourceScores: Record<string, number> = {
    google_places: 30,
    ncua: 28,
    google_maps: 27,
    apple_maps: 25,
    yelp: 22,
    foursquare: 20,
    facebook: 18,
    website_scrape: 15,
    manual: 10,
  }
  const sourceScore = sourceScores[item.source] || 10
  score += sourceScore
  reasons.push(`Source: ${item.source} (+${sourceScore})`)

  // Data completeness (0-40 points)
  if (item.hasAddress) {
    score += 10
    reasons.push("Has address (+10)")
  }
  if (item.hasPhone) {
    score += 8
    reasons.push("Has phone (+8)")
  }
  if (item.hasPhoto) {
    score += 8
    reasons.push("Has photo (+8)")
  }
  if (item.hasHours) {
    score += 7
    reasons.push("Has hours (+7)")
  }
  if (item.hasWebsite) {
    score += 7
    reasons.push("Has website (+7)")
  }

  // Cross-source verification (0-30 points)
  if (item.totalSources > 1) {
    const crossSourceScore = Math.min(30, (item.matchesOtherSources / item.totalSources) * 30)
    score += crossSourceScore
    reasons.push(
      `Verified by ${item.matchesOtherSources}/${item.totalSources} sources (+${crossSourceScore.toFixed(0)})`,
    )
  }

  return {
    score: Math.min(100, score),
    reasoning: reasons.join(" | "),
  }
}

// Branch deduplication - matches addresses across sources
export function deduplicateBranches(branches: DiscoveredItem[]): DiscoveredItem[] {
  const uniqueBranches: Map<string, DiscoveredItem[]> = new Map()

  for (const branch of branches) {
    const data = branch.data as { address?: string; lat?: number; lng?: number }
    // Create a normalized key from address or coordinates
    const key = data.address
      ? normalizeAddress(data.address)
      : data.lat && data.lng
        ? `${data.lat.toFixed(4)},${data.lng.toFixed(4)}`
        : branch.id

    if (!uniqueBranches.has(key)) {
      uniqueBranches.set(key, [])
    }
    uniqueBranches.get(key)!.push(branch)
  }

  // Merge duplicates, keeping highest confidence and combining data
  return Array.from(uniqueBranches.values()).map((group) => {
    if (group.length === 1) return group[0]

    // Sort by confidence, take highest
    group.sort((a, b) => b.confidenceScore - a.confidenceScore)
    const primary = group[0]

    // Merge data from all sources
    const mergedData = group.reduce(
      (acc, item) => ({
        ...acc,
        ...(item.data as Record<string, unknown>),
        sources: [...(acc.sources || []), item.source],
      }),
      { sources: [] as string[] } as Record<string, unknown> & { sources: string[] },
    )

    // Recalculate confidence with cross-source verification
    const { score, reasoning } = calculateConfidence({
      source: primary.source,
      hasPhoto: !!mergedData.photo_url,
      hasPhone: !!mergedData.phone,
      hasAddress: !!mergedData.address,
      hasHours: !!mergedData.hours,
      hasWebsite: !!mergedData.website,
      matchesOtherSources: group.length,
      totalSources: group.length,
    })

    return {
      ...primary,
      data: mergedData,
      confidenceScore: score,
      confidenceReasoning: reasoning,
    }
  })
}

function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\b(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|lane|ln|court|ct|place|pl)\b/g, "")
    .trim()
}

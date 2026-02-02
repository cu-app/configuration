/**
 * Fraud Network API
 * 
 * Private federated fraud signal network between credit unions.
 * Uses existing tables: fraud_signals, nationwide_network_members
 * 
 * Features:
 * - Hash-based matching (no PII shared)
 * - Daisy chain: more CU reports = stronger signal
 * - Anonymous or public posting
 * - Real-time threat scoring
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createHash } from "crypto"

// ============================================================================
// TYPES
// ============================================================================

interface FraudSignal {
  id: string
  reporting_cu_id: string
  signal_type: string
  severity: string
  indicator_hash: string
  indicator_type: string
  description: string | null
  is_confirmed: boolean
  created_at: string
  expires_at: string
}

interface ChainedSignal extends FraudSignal {
  chain_count: number      // How many CUs reported this hash
  first_seen: string       // When first reported
  last_seen: string        // Most recent report
  threat_score: number     // Calculated from chain + severity
  reporting_cus: string[]  // Only for non-anonymous
}

// ============================================================================
// HASH UTILITIES (Privacy-First)
// ============================================================================

function hashIndicator(value: string, salt: string = "cu_fraud_network_2026"): string {
  return createHash("sha256")
    .update(value.toLowerCase().trim() + salt)
    .digest("hex")
}

function calculateThreatScore(chainCount: number, severity: string): number {
  const severityMultiplier: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 5,
  }
  
  const mult = severityMultiplier[severity] || 2
  // Logarithmic scaling: more CUs = higher score, but diminishing returns
  const chainBonus = Math.log2(chainCount + 1) * 10
  
  return Math.min(100, Math.round(chainBonus * mult))
}

// ============================================================================
// GET /api/fraud-network
// Fetch fraud signals with daisy chain aggregation
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const tenantId = searchParams.get("tenantId")
    const hash = searchParams.get("hash") // Check specific hash
    const type = searchParams.get("type") // Filter by signal_type
    const minThreat = parseInt(searchParams.get("minThreat") || "0")
    
    const supabase = await createClient()

    // Verify CU is opted into network
    if (tenantId) {
      const { data: membership } = await supabase
        .from("nationwide_network_members")
        .select("*")
        .eq("credit_union_id", tenantId)
        .single()

      if (!membership?.receive_fraud_alerts) {
        return NextResponse.json({
          error: "Not opted into fraud network",
          optInRequired: true,
        }, { status: 403 })
      }
    }

    // If checking specific hash
    if (hash) {
      const { data: matches, error } = await supabase
        .from("fraud_signals")
        .select("*")
        .eq("indicator_hash", hash)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })

      if (error) throw error

      const chainCount = matches?.length || 0
      const maxSeverity = matches?.reduce((max, s) => {
        const order = { critical: 4, high: 3, medium: 2, low: 1 }
        return order[s.severity as keyof typeof order] > order[max as keyof typeof order] ? s.severity : max
      }, "low") || "low"

      return NextResponse.json({
        found: chainCount > 0,
        chainCount,
        threatScore: calculateThreatScore(chainCount, maxSeverity),
        severity: maxSeverity,
        firstSeen: matches?.[matches.length - 1]?.created_at,
        lastSeen: matches?.[0]?.created_at,
        signalTypes: [...new Set(matches?.map(m => m.signal_type))],
      })
    }

    // Get all active signals, aggregated by hash
    const { data: signals, error } = await supabase
      .from("fraud_signals")
      .select("*")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })

    if (error) throw error

    // Aggregate by indicator_hash (daisy chain)
    const chainMap = new Map<string, ChainedSignal>()

    for (const signal of signals || []) {
      const existing = chainMap.get(signal.indicator_hash)

      if (existing) {
        existing.chain_count++
        existing.last_seen = signal.created_at > existing.last_seen ? signal.created_at : existing.last_seen
        existing.first_seen = signal.created_at < existing.first_seen ? signal.created_at : existing.first_seen
        // Use highest severity
        const order = { critical: 4, high: 3, medium: 2, low: 1 }
        if (order[signal.severity as keyof typeof order] > order[existing.severity as keyof typeof order]) {
          existing.severity = signal.severity
        }
        existing.threat_score = calculateThreatScore(existing.chain_count, existing.severity)
      } else {
        chainMap.set(signal.indicator_hash, {
          ...signal,
          chain_count: 1,
          first_seen: signal.created_at,
          last_seen: signal.created_at,
          threat_score: calculateThreatScore(1, signal.severity),
          reporting_cus: [],
        })
      }
    }

    // Convert to array and filter
    let chainedSignals = Array.from(chainMap.values())

    if (type) {
      chainedSignals = chainedSignals.filter(s => s.signal_type === type)
    }

    if (minThreat > 0) {
      chainedSignals = chainedSignals.filter(s => s.threat_score >= minThreat)
    }

    // Sort by threat score (highest first)
    chainedSignals.sort((a, b) => b.threat_score - a.threat_score)

    // Stats
    const stats = {
      totalSignals: signals?.length || 0,
      uniqueThreats: chainedSignals.length,
      criticalThreats: chainedSignals.filter(s => s.severity === "critical").length,
      highThreats: chainedSignals.filter(s => s.severity === "high").length,
      avgChainLength: chainedSignals.length > 0
        ? (chainedSignals.reduce((sum, s) => sum + s.chain_count, 0) / chainedSignals.length).toFixed(1)
        : "0",
      topThreatScore: chainedSignals[0]?.threat_score || 0,
    }

    return NextResponse.json({
      signals: chainedSignals.slice(0, 100), // Limit response
      stats,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[fraud-network] GET error:", error)
    return NextResponse.json({ error: "Failed to fetch fraud signals" }, { status: 500 })
  }
}

// ============================================================================
// POST /api/fraud-network
// Report a new fraud signal
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      tenantId,
      signalType,
      severity,
      indicatorValue, // Raw value - will be hashed
      indicatorType,
      description,
      isAnonymous = true,
    } = body

    if (!tenantId || !signalType || !indicatorValue || !indicatorType) {
      return NextResponse.json({
        error: "Missing required fields: tenantId, signalType, indicatorValue, indicatorType"
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify CU is opted in to share
    const { data: membership } = await supabase
      .from("nationwide_network_members")
      .select("*")
      .eq("credit_union_id", tenantId)
      .single()

    if (!membership?.share_fraud_signals) {
      return NextResponse.json({
        error: "Not opted in to share fraud signals",
        optInRequired: true,
      }, { status: 403 })
    }

    // Hash the indicator (NEVER store raw PII)
    const indicatorHash = hashIndicator(indicatorValue)

    // Check if this CU already reported this exact hash
    const { data: existing } = await supabase
      .from("fraud_signals")
      .select("id")
      .eq("reporting_cu_id", isAnonymous ? "anonymous" : tenantId)
      .eq("indicator_hash", indicatorHash)
      .gte("expires_at", new Date().toISOString())
      .single()

    if (existing) {
      return NextResponse.json({
        error: "You already reported this indicator",
        alreadyReported: true,
      }, { status: 409 })
    }

    // Insert the signal
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 90) // 90 day expiry

    const { data: signal, error } = await supabase
      .from("fraud_signals")
      .insert({
        reporting_cu_id: isAnonymous ? "anonymous" : tenantId,
        signal_type: signalType,
        severity: severity || "medium",
        indicator_hash: indicatorHash,
        indicator_type: indicatorType,
        description: description || null,
        is_confirmed: false,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Check how many other CUs reported this hash (daisy chain strength)
    const { count } = await supabase
      .from("fraud_signals")
      .select("*", { count: "exact", head: true })
      .eq("indicator_hash", indicatorHash)

    const threatScore = calculateThreatScore(count || 1, severity || "medium")

    return NextResponse.json({
      success: true,
      signal: {
        id: signal.id,
        indicatorHash,
        chainCount: count || 1,
        threatScore,
      },
      message: count && count > 1
        ? `Signal added. ${count} CUs have now reported this indicator.`
        : "Signal added. You're the first to report this indicator.",
    })
  } catch (error) {
    console.error("[fraud-network] POST error:", error)
    return NextResponse.json({ error: "Failed to report fraud signal" }, { status: 500 })
  }
}

// ============================================================================
// PUT /api/fraud-network
// Update network membership / confirm signal
// ============================================================================

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, tenantId, charterNumber, signalId, ...settings } = body

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Join or update network membership
    if (action === "join" || action === "update") {
      const { data, error } = await supabase
        .from("nationwide_network_members")
        .upsert({
          credit_union_id: tenantId,
          charter_number: charterNumber || tenantId,
          share_fraud_signals: settings.shareFraudSignals ?? true,
          receive_fraud_alerts: settings.receiveFraudAlerts ?? true,
          share_product_insights: settings.shareProductInsights ?? false,
          opted_in_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        membership: data,
        message: action === "join" ? "Welcome to the fraud network!" : "Settings updated",
      })
    }

    // Confirm a fraud signal (I've seen this too)
    if (action === "confirm" && signalId) {
      const { error } = await supabase
        .from("fraud_signals")
        .update({ is_confirmed: true })
        .eq("id", signalId)

      if (error) throw error

      return NextResponse.json({ success: true, message: "Signal confirmed" })
    }

    // Leave network
    if (action === "leave") {
      const { error } = await supabase
        .from("nationwide_network_members")
        .delete()
        .eq("credit_union_id", tenantId)

      if (error) throw error

      return NextResponse.json({ success: true, message: "Left fraud network" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[fraud-network] PUT error:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

// ============================================================================
// DELETE /api/fraud-network
// Remove a signal you reported
// ============================================================================

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const signalId = searchParams.get("signalId")
    const tenantId = searchParams.get("tenantId")

    if (!signalId || !tenantId) {
      return NextResponse.json({ error: "signalId and tenantId required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Only allow deleting own signals
    const { error } = await supabase
      .from("fraud_signals")
      .delete()
      .eq("id", signalId)
      .eq("reporting_cu_id", tenantId)

    if (error) throw error

    return NextResponse.json({ success: true, message: "Signal removed" })
  } catch (error) {
    console.error("[fraud-network] DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete signal" }, { status: 500 })
  }
}

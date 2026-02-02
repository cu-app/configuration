/**
 * CU Launcher Batch Loader
 * 
 * Efficiently loads all 4,822 credit unions from Supabase in batches
 * Handles logo loading, pagination, and error recovery
 */

export interface CreditUnion {
  cu_number?: string
  charter_number: string
  cu_name: string
  city?: string
  state?: string
  total_assets?: number
  total_members?: number
  logo_url?: string
  primary_color?: string
  website?: string
}

export interface BatchLoadOptions {
  batchSize?: number
  withLogosOnly?: boolean
  onProgress?: (loaded: number, total: number) => void
  onBatchComplete?: (batch: CreditUnion[], batchNumber: number) => void
}

export interface BatchLoadResult {
  creditUnions: CreditUnion[]
  total: number
  batchesLoaded: number
  errors: string[]
}

/**
 * Load all credit unions in batches
 */
export async function loadAllCreditUnions(
  options: BatchLoadOptions = {}
): Promise<BatchLoadResult> {
  const {
    batchSize = 100,
    withLogosOnly = false,
    onProgress,
    onBatchComplete,
  } = options

  const allCreditUnions: CreditUnion[] = []
  const errors: string[] = []
  let offset = 0
  let hasMore = true
  let batchNumber = 0
  let total = 0

  while (hasMore) {
    try {
      const params = new URLSearchParams({
        batchSize: batchSize.toString(),
        offset: offset.toString(),
        withLogos: withLogosOnly.toString(),
      })

      const response = await fetch(`/api/culauncher/batch-load?${params}`)
      const data = await response.json()

      if (!response.ok) {
        errors.push(`Batch ${batchNumber + 1}: ${data.error || "Unknown error"}`)
        break
      }

      const batch = data.creditUnions || []
      allCreditUnions.push(...batch)
      total = data.pagination?.total || total
      hasMore = data.pagination?.hasMore || false
      offset = data.pagination?.nextOffset || offset + batchSize
      batchNumber++

      // Call progress callback
      if (onProgress) {
        onProgress(allCreditUnions.length, total)
      }

      // Call batch complete callback
      if (onBatchComplete) {
        onBatchComplete(batch, batchNumber)
      }

      // Small delay to avoid overwhelming the server
      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    } catch (error) {
      errors.push(
        `Batch ${batchNumber + 1}: ${error instanceof Error ? error.message : "Unknown error"}`
      )
      // Continue with next batch
      offset += batchSize
      batchNumber++
    }
  }

  return {
    creditUnions: allCreditUnions,
    total,
    batchesLoaded: batchNumber,
    errors,
  }
}

/**
 * Load credit unions with logos only (faster, smaller dataset)
 */
export async function loadCreditUnionsWithLogos(
  options: Omit<BatchLoadOptions, "withLogosOnly"> = {}
): Promise<BatchLoadResult> {
  return loadAllCreditUnions({
    ...options,
    withLogosOnly: true,
  })
}

/**
 * Get statistics about credit unions
 */
export async function getCreditUnionStats(): Promise<{
  total: number
  withLogos: number
  withoutLogos: number
  logoCoverage: number
  byState: Record<string, number>
  recommendations: {
    batchSize: number
    largeBatchSize: number
    estimatedBatches: number
    estimatedBatchesWithLogos: number
  }
}> {
  const response = await fetch("/api/culauncher/batch-load", {
    method: "POST",
  })

  if (!response.ok) {
    throw new Error("Failed to get statistics")
  }

  const data = await response.json()
  return {
    total: data.statistics.total,
    withLogos: data.statistics.withLogos,
    withoutLogos: data.statistics.withoutLogos,
    logoCoverage: data.statistics.logoCoverage,
    byState: data.statistics.byState,
    recommendations: data.recommendations,
  }
}

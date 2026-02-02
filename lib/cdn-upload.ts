// CDN Upload: Push configuration to edge storage for fast global access
// Part of the distribution pipeline: Dashboard → Supabase → GitHub → CDN → Apps

import { put, del, list } from '@vercel/blob'

export interface CDNUploadResult {
  success: boolean
  url?: string
  error?: string
}

export interface CDNUploadOptions {
  tenantId: string
  config: Record<string, unknown>
  version: string
}

/**
 * Upload configuration to Vercel Blob Storage (CDN)
 * Creates a publicly accessible URL for apps to fetch config
 */
export async function uploadTocdn(options: CDNUploadOptions): Promise<CDNUploadResult> {
  const { tenantId, config, version } = options

  // Check if Vercel Blob is configured
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // Fallback: Return a placeholder URL if blob storage isn't configured
    // In production, you'd want to fail or use an alternative
    console.warn('[cdn-upload] BLOB_READ_WRITE_TOKEN not configured, skipping CDN upload')
    return {
      success: false,
      error: 'CDN storage not configured (BLOB_READ_WRITE_TOKEN missing)',
    }
  }

  try {
    const configContent = JSON.stringify(config, null, 2)
    const pathname = `config/${tenantId}/config.json`

    // Upload to Vercel Blob Storage
    const blob = await put(pathname, configContent, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false, // Keep consistent URL
      cacheControlMaxAge: 300, // 5-minute cache
    })

    // Also upload a versioned copy for history
    const versionedPathname = `config/${tenantId}/versions/${version}.json`
    await put(versionedPathname, configContent, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    })

    return {
      success: true,
      url: blob.url,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[cdn-upload] Error:', message)
    return { success: false, error: message }
  }
}

/**
 * Delete configuration from CDN
 */
export async function deleteFromCDN(tenantId: string): Promise<CDNUploadResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { success: false, error: 'CDN storage not configured' }
  }

  try {
    // List all files for this tenant
    const { blobs } = await list({ prefix: `config/${tenantId}/` })

    // Delete each file
    await Promise.all(blobs.map(blob => del(blob.url)))

    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[cdn-upload] Delete error:', message)
    return { success: false, error: message }
  }
}

/**
 * List all config versions for a tenant
 */
export async function listConfigVersions(tenantId: string): Promise<{
  success: boolean
  versions?: Array<{ version: string; url: string; uploadedAt: Date }>
  error?: string
}> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { success: false, error: 'CDN storage not configured' }
  }

  try {
    const { blobs } = await list({ prefix: `config/${tenantId}/versions/` })

    const versions = blobs.map(blob => {
      // Extract version from pathname like "config/tenant123/versions/1.0.0.json"
      const versionMatch = blob.pathname.match(/versions\/(.+)\.json$/)
      return {
        version: versionMatch ? versionMatch[1] : 'unknown',
        url: blob.url,
        uploadedAt: blob.uploadedAt,
      }
    })

    // Sort by upload date, newest first
    versions.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())

    return { success: true, versions }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[cdn-upload] List error:', message)
    return { success: false, error: message }
  }
}

/**
 * Get the public CDN URL for a tenant's config
 * This is the URL that mobile apps should fetch
 */
export function getConfigURL(tenantId: string): string {
  // If using Vercel Blob, URLs are automatically generated
  // For custom domains, you could configure this differently
  const blobBaseUrl = process.env.BLOB_PUBLIC_URL || 'https://blob.vercel-storage.com'
  return `${blobBaseUrl}/config/${tenantId}/config.json`
}

/**
 * Alternative: Upload to Cloudflare R2 (if configured)
 * This is a fallback for teams using Cloudflare
 */
export async function uploadToR2(options: CDNUploadOptions): Promise<CDNUploadResult> {
  const { tenantId, config } = options

  const r2AccountId = process.env.R2_ACCOUNT_ID
  const r2AccessKey = process.env.R2_ACCESS_KEY_ID
  const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY
  const r2Bucket = process.env.R2_BUCKET_NAME

  if (!r2AccountId || !r2AccessKey || !r2SecretKey || !r2Bucket) {
    return { success: false, error: 'Cloudflare R2 not configured' }
  }

  try {
    // Use S3-compatible API for R2
    const endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`
    const key = `config/${tenantId}/config.json`
    const body = JSON.stringify(config, null, 2)

    // Create AWS-style signature for R2
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const datetime = new Date().toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z'

    // Note: In production, you'd want to use a proper AWS SDK or signing library
    // This is a simplified example
    const response = await fetch(`${endpoint}/${r2Bucket}/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-amz-date': datetime,
        'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
        // In production, add proper AWS signature headers
      },
      body,
    })

    if (!response.ok) {
      return { success: false, error: 'R2 upload failed' }
    }

    // Return public URL (requires R2 public access or custom domain)
    const publicUrl = process.env.R2_PUBLIC_URL || endpoint
    return {
      success: true,
      url: `${publicUrl}/${key}`,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[cdn-upload] R2 error:', message)
    return { success: false, error: message }
  }
}

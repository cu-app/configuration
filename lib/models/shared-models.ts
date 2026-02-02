/**
 * Shared Data Models
 * 
 * Common types used across all services for unified communication
 */

export interface UnifiedRequest {
  tenantId: string
  channel?: 'ivr' | 'mobile' | 'web' | 'chat' | 'email' | 'sms' | 'push'
  operation: string
  payload: any
  context?: RequestContext
}

export interface RequestContext {
  memberId?: string
  sessionId?: string
  deviceId?: string
  ipAddress?: string
  userAgent?: string
  location?: string
  [key: string]: any
}

export interface UnifiedResponse<T = any> {
  success: boolean
  data?: T
  error?: ErrorResponse
  metadata: ResponseMetadata
}

export interface ErrorResponse {
  code: string
  message: string
  details?: any
  timestamp: string
}

export interface ResponseMetadata {
  tenantId: string
  service: string
  operation: string
  processingTime: number
  timestamp: string
  layers?: string[]
  cacheHit?: boolean
  version?: string
}

/**
 * Extract tenant ID from request
 */
export function extractTenantId(request: Request): string | null {
  // Try headers first
  const headerTenantId = 
    (request as any).headers?.get?.('x-tenant-id') ||
    (request as any).headers?.get?.('x-cu-id') ||
    (request as any).headers?.get?.('tenant-id')
  
  if (headerTenantId) {
    return headerTenantId
  }
  
  // Try URL query params
  try {
    const url = new URL((request as any).url || '')
    const queryTenantId = 
      url.searchParams.get('tenantId') ||
      url.searchParams.get('cuId') ||
      url.searchParams.get('tenant_id')
    
    if (queryTenantId) {
      return queryTenantId
    }
  } catch (error) {
    // URL parsing failed, continue
  }
  
  return null
}

/**
 * Create unified error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  metadata: Partial<ResponseMetadata>,
  status = 500
): Response {
  const errorResponse: UnifiedResponse = {
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
    },
    metadata: {
      tenantId: metadata.tenantId || 'unknown',
      service: metadata.service || 'unknown',
      operation: metadata.operation || 'unknown',
      processingTime: metadata.processingTime || 0,
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  }
  
  return Response.json(errorResponse, { status })
}

/**
 * Create unified success response
 */
export function createSuccessResponse<T>(
  data: T,
  metadata: Partial<ResponseMetadata>
): Response {
  const successResponse: UnifiedResponse<T> = {
    success: true,
    data,
    metadata: {
      tenantId: metadata.tenantId || 'unknown',
      service: metadata.service || 'unknown',
      operation: metadata.operation || 'unknown',
      processingTime: metadata.processingTime || 0,
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  }
  
  return Response.json(successResponse)
}

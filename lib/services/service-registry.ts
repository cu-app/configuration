/**
 * Service Registry
 * 
 * Central registry of all services with metadata and handlers
 */

import type { NextRequest, NextResponse } from 'next/server'
import type { CreditUnionConfig } from '@/types/cu-config'
import { unifiedServiceContext } from './unified-service-context'

export interface ServiceContext {
  tenantId: string
  config: CreditUnionConfig
  unifiedContext: typeof unifiedServiceContext
}

export interface ServiceHandler {
  (
    request: NextRequest,
    context: ServiceContext,
    pathSegments: string[]
  ): Promise<NextResponse>
}

export interface ServiceDefinition {
  id: string
  name: string
  version: string
  path: string // API path prefix (e.g., '/api/omnichannel')
  requiredFeature?: string // Feature flag required to use this service
  dependencies: string[] // Other service IDs this depends on
  handler: ServiceHandler
  healthCheck?: () => Promise<boolean>
  description?: string
}

/**
 * Service Registry
 * 
 * All services are registered here with their handlers
 */
export const SERVICE_REGISTRY: ServiceDefinition[] = [
  {
    id: 'omnichannel',
    name: 'Omnichannel API',
    version: '1.0.0',
    path: '/api/omnichannel',
    description: 'Unified API for all channels (IVR, Mobile, Web, Chat)',
    handler: async (request, context) => {
      const { POST } = await import('@/app/api/omnichannel/route')
      return POST(request as any)
    },
  },
  {
    id: 'fdx',
    name: 'FDX API',
    version: '1.0.0',
    path: '/api/fdx',
    requiredFeature: 'fdx',
    description: 'FDX (1033 Compliance) API proxy',
    handler: async (request, context, pathSegments) => {
      const { GET, POST } = await import('@/app/api/fdx/[...path]/route')
      const params = { path: pathSegments }
      if (request.method === 'GET') {
        return GET(request, { params } as any)
      } else if (request.method === 'POST') {
        return POST(request, { params } as any)
      }
      return new NextResponse(null, { status: 405 })
    },
  },
  {
    id: 'marketing',
    name: 'Marketing CMS',
    version: '1.0.0',
    path: '/api/marketing',
    requiredFeature: 'marketing',
    description: 'Marketing site content management',
    handler: async (request, context, pathSegments) => {
      if (pathSegments[0] === 'homepage') {
        const { GET, PUT } = await import('@/app/api/marketing/homepage/route')
        if (request.method === 'GET') {
          return GET(request)
        } else if (request.method === 'PUT') {
          return PUT(request)
        }
      }
      return new NextResponse(null, { status: 404 })
    },
  },
  {
    id: 'ivr',
    name: 'IVR Service',
    version: '1.0.0',
    path: '/api/ivr',
    requiredFeature: 'ivr',
    dependencies: ['omnichannel'],
    description: 'IVR integration (Genesys + Hume)',
    handler: async (request, context, pathSegments) => {
      if (pathSegments[0] === 'genesys') {
        const { POST } = await import('@/app/api/ivr/genesys/route')
        return POST(request as any)
      }
      return new NextResponse(null, { status: 404 })
    },
  },
  {
    id: 'features',
    name: 'Feature Catalog & Packaging',
    version: '1.0.0',
    path: '/api/features',
    description: 'Feature catalog and package cloning',
    handler: async (request, context, pathSegments) => {
      if (pathSegments[0] === 'clone') {
        const { GET, POST } = await import('@/app/api/features/clone/route')
        if (request.method === 'GET') {
          return GET(request)
        } else if (request.method === 'POST') {
          return POST(request)
        }
      }
      return new NextResponse(null, { status: 404 })
    },
  },
  {
    id: 'graphql',
    name: 'GraphQL API',
    version: '1.0.0',
    path: '/api/graphql',
    dependencies: ['transaction-enrichment'],
    description: 'GraphQL API for mobile app',
    handler: async (request, context) => {
      const { POST } = await import('@/app/api/graphql/route')
      return POST(request)
    },
  },
  {
    id: 'integrations',
    name: 'Integration Status',
    version: '1.0.0',
    path: '/api/integrations',
    description: 'Integration health and status',
    handler: async (request, context, pathSegments) => {
      if (pathSegments[0] === 'status') {
        const { GET } = await import('@/app/api/integrations/status/route')
        return GET(request as any)
      }
      return new NextResponse(null, { status: 404 })
    },
  },
]

/**
 * Get service by ID
 */
export function getServiceById(serviceId: string): ServiceDefinition | null {
  return SERVICE_REGISTRY.find(s => s.id === serviceId) || null
}

/**
 * Get service by path
 */
export function getServiceByPath(path: string): ServiceDefinition | null {
  // Find service with longest matching path prefix
  let bestMatch: ServiceDefinition | null = null
  let bestMatchLength = 0
  
  for (const service of SERVICE_REGISTRY) {
    if (path.startsWith(service.path)) {
      if (service.path.length > bestMatchLength) {
        bestMatch = service
        bestMatchLength = service.path.length
      }
    }
  }
  
  return bestMatch
}

/**
 * Get all services
 */
export function getAllServices(): ServiceDefinition[] {
  return SERVICE_REGISTRY
}

/**
 * Get services available for a tenant
 */
export async function getAvailableServices(tenantId: string): Promise<ServiceDefinition[]> {
  const available: ServiceDefinition[] = []
  
  for (const service of SERVICE_REGISTRY) {
    const isAvailable = await unifiedServiceContext.isServiceAvailable(tenantId, service.id)
    if (isAvailable) {
      available.push(service)
    }
  }
  
  return available
}

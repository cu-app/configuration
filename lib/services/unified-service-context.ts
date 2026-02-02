/**
 * Unified Service Context
 * 
 * Single source of truth for:
 * - CU Configuration (cached)
 * - Service Registry
 * - Integration Status
 * - Shared State
 * 
 * This ties all services together with a unified context.
 */

import type { CreditUnionConfig } from '@/types/cu-config'
import { createClient } from '@/lib/supabase/server'

interface CachedConfig {
  config: CreditUnionConfig
  timestamp: number
  expiresAt: number
}

interface ServiceDefinition {
  id: string
  name: string
  version: string
  path: string
  requiredFeature?: string
  dependencies: string[]
  enabled: boolean
}

interface IntegrationStatus {
  id: string
  name: string
  enabled: boolean
  healthy: boolean
  lastChecked: string
  details: {
    version?: string
    endpoint?: string
    error?: string
  }
}

export class UnifiedServiceContext {
  private static instance: UnifiedServiceContext
  private configCache: Map<string, CachedConfig> = new Map()
  private serviceRegistry: Map<string, ServiceDefinition> = new Map()
  private integrationStatusCache: Map<string, Map<string, IntegrationStatus>> = new Map()
  
  // Cache TTL: 5 minutes
  private readonly CACHE_TTL = 5 * 60 * 1000
  
  private constructor() {
    this.initializeServiceRegistry()
  }
  
  static getInstance(): UnifiedServiceContext {
    if (!UnifiedServiceContext.instance) {
      UnifiedServiceContext.instance = new UnifiedServiceContext()
    }
    return UnifiedServiceContext.instance
  }
  
  /**
   * Initialize service registry with all available services
   */
  private initializeServiceRegistry(): void {
    const services: ServiceDefinition[] = [
      {
        id: 'omnichannel',
        name: 'Omnichannel API',
        version: '1.0.0',
        path: '/api/omnichannel',
        enabled: true,
        dependencies: [],
      },
      {
        id: 'fdx',
        name: 'FDX API',
        version: '1.0.0',
        path: '/api/fdx',
        requiredFeature: 'fdx',
        enabled: true,
        dependencies: [],
      },
      {
        id: 'marketing',
        name: 'Marketing CMS',
        version: '1.0.0',
        path: '/api/marketing',
        requiredFeature: 'marketing',
        enabled: true,
        dependencies: [],
      },
      {
        id: 'ivr',
        name: 'IVR Service',
        version: '1.0.0',
        path: '/api/ivr',
        requiredFeature: 'ivr',
        enabled: true,
        dependencies: ['omnichannel'],
      },
      {
        id: 'features',
        name: 'Feature Catalog & Packaging',
        version: '1.0.0',
        path: '/api/features',
        enabled: true,
        dependencies: [],
      },
      {
        id: 'transaction-enrichment',
        name: 'Transaction Enrichment',
        version: '1.0.0',
        path: '/api/transactions/enrich',
        enabled: true,
        dependencies: [],
      },
      {
        id: 'graphql',
        name: 'GraphQL API',
        version: '1.0.0',
        path: '/api/graphql',
        enabled: true,
        dependencies: ['transaction-enrichment'],
      },
    ]
    
    services.forEach(service => {
      this.serviceRegistry.set(service.id, service)
    })
  }
  
  /**
   * Get CU configuration (with caching)
   */
  async getConfig(tenantId: string, forceRefresh = false): Promise<CreditUnionConfig | null> {
    // Check cache first
    if (!forceRefresh) {
      const cached = this.configCache.get(tenantId)
      if (cached && Date.now() < cached.expiresAt) {
        return cached.config
      }
    }
    
    // Load from Supabase
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('cu_configs')
        .select('config')
        .eq('tenant_id', tenantId)
        .single()
      
      if (error || !data?.config) {
        console.warn(`[UnifiedServiceContext] Config not found for tenant: ${tenantId}`)
        return null
      }
      
      const config = data.config as CreditUnionConfig
      
      // Cache it
      this.configCache.set(tenantId, {
        config,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_TTL,
      })
      
      return config
    } catch (error) {
      console.error(`[UnifiedServiceContext] Error loading config for ${tenantId}:`, error)
      return null
    }
  }
  
  /**
   * Invalidate config cache for a tenant
   */
  invalidateConfig(tenantId: string): void {
    this.configCache.delete(tenantId)
  }
  
  /**
   * Get service definition
   */
  getService(serviceId: string): ServiceDefinition | null {
    return this.serviceRegistry.get(serviceId) || null
  }
  
  /**
   * Get all services
   */
  getAllServices(): ServiceDefinition[] {
    return Array.from(this.serviceRegistry.values())
  }
  
  /**
   * Check if feature is enabled for a tenant
   */
  async isFeatureEnabled(tenantId: string, feature: string): Promise<boolean> {
    const config = await this.getConfig(tenantId)
    if (!config) return false
    
    // Check features object
    if (config.features && typeof config.features === 'object') {
      const features = config.features as Record<string, boolean>
      return features[feature] === true
    }
    
    return false
  }
  
  /**
   * Get all enabled integrations for a CU
   */
  async getEnabledIntegrations(tenantId: string): Promise<IntegrationStatus[]> {
    const config = await this.getConfig(tenantId)
    if (!config) return []
    
    const integrations: IntegrationStatus[] = []
    
    // Check each integration
    if (config.integrations?.core?.poweron?.enabled) {
      integrations.push({
        id: 'poweron',
        name: 'PowerOn (Symitar)',
        enabled: true,
        healthy: true, // TODO: Add health check
        lastChecked: new Date().toISOString(),
        details: {
          version: config.integrations.core.poweron.version,
        },
      })
    }
    
    if (config.compliance?.fdx?.enabled) {
      integrations.push({
        id: 'fdx',
        name: 'FDX (1033 Compliance)',
        enabled: true,
        healthy: true, // TODO: Add health check
        lastChecked: new Date().toISOString(),
        details: {
          version: config.compliance.fdx.version,
        },
      })
    }
    
    if (config.channels?.ivr?.enabled) {
      integrations.push({
        id: 'ivr',
        name: 'IVR (Hume + Twilio)',
        enabled: true,
        healthy: true, // TODO: Add health check
        lastChecked: new Date().toISOString(),
        details: {
          endpoint: config.channels.ivr.twilio?.phone_number,
        },
      })
    }
    
    if (config.marketing?.enabled) {
      integrations.push({
        id: 'marketing',
        name: 'Marketing CMS',
        enabled: true,
        healthy: true, // TODO: Add health check
        lastChecked: new Date().toISOString(),
        details: {
          endpoint: config.marketing.site_url,
        },
      })
    }
    
    // Transaction enrichment (check if service is configured)
    if (config.services?.transaction_enrichment?.enabled) {
      integrations.push({
        id: 'transaction-enrichment',
        name: 'Transaction Enrichment',
        enabled: true,
        healthy: true, // TODO: Add health check
        lastChecked: new Date().toISOString(),
        details: {
          endpoint: config.services.transaction_enrichment.api_url,
        },
      })
    }
    
    return integrations
  }
  
  /**
   * Check if service is available for tenant
   */
  async isServiceAvailable(tenantId: string, serviceId: string): Promise<boolean> {
    const service = this.getService(serviceId)
    if (!service || !service.enabled) {
      return false
    }
    
    // Check if service has required feature
    if (service.requiredFeature) {
      return await this.isFeatureEnabled(tenantId, service.requiredFeature)
    }
    
    return true
  }
  
  /**
   * Get service dependencies
   */
  getServiceDependencies(serviceId: string): ServiceDefinition[] {
    const service = this.getService(serviceId)
    if (!service) return []
    
    return service.dependencies
      .map(depId => this.getService(depId))
      .filter((dep): dep is ServiceDefinition => dep !== null)
  }
  
  /**
   * Clear all caches
   */
  clearCache(): void {
    this.configCache.clear()
    this.integrationStatusCache.clear()
  }
}

// Export singleton instance
export const unifiedServiceContext = UnifiedServiceContext.getInstance()

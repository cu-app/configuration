# Unified Integration Architecture Plan

## Current State Analysis

### ✅ What Exists
1. **Configuration Matrix** - Central config in Supabase (`cu_configs`)
2. **Omnichannel API** - 21-layer routing (IVR, Mobile, Web, Chat)
3. **GraphQL API** - Mobile app backend with PowerOn + transaction enrichment
4. **FDX API** - 1033 compliance proxy (`/api/fdx/[...path]`)
5. **IVR Integration** - Genesys + Hume (`/api/ivr/genesys`)
6. **Marketing CMS** - Homepage management (`/api/marketing/homepage`)
7. **Feature Catalog & Packaging** - Feature catalog & cloning (`/api/features/clone`)
8. **Transaction Enrichment** - Cloudflare Workers service

### ❌ Integration Gaps

1. **Config Loading Duplication**
   - Each API route loads config independently
   - No shared caching
   - Repeated Supabase queries

2. **No Unified Service Layer**
   - Services don't know about each other
   - No service registry
   - Manual integration everywhere

3. **Scattered Integration Points**
   - Marketing CMS separate from omnichannel
   - IVR separate from omnichannel (partially integrated)
   - Feature packaging isolated
   - FDX proxy separate

4. **No Event/Message Bus**
   - Services can't communicate
   - No cross-service notifications
   - No unified logging/monitoring

5. **Inconsistent Data Flow**
   - Some routes use omnichannel, others don't
   - Transaction enrichment only in GraphQL
   - FDX not in omnichannel flow

---

## Proposed Unified Architecture

### 1. **Unified Service Context** 🎯

**File:** `lib/services/unified-service-context.ts`

```typescript
/**
 * Unified Service Context
 * 
 * Single source of truth for:
 * - CU Configuration (cached)
 * - Service Registry
 * - Integration Status
 * - Shared State
 */

export class UnifiedServiceContext {
  private static instance: UnifiedServiceContext
  private configCache: Map<string, { config: CreditUnionConfig; timestamp: number }>
  private serviceRegistry: Map<string, ServiceDefinition>
  
  // Get config (with caching)
  async getConfig(tenantId: string): Promise<CreditUnionConfig>
  
  // Register service
  registerService(service: ServiceDefinition): void
  
  // Get service
  getService(serviceId: string): ServiceDefinition | null
  
  // Get all enabled integrations for CU
  getEnabledIntegrations(tenantId: string): IntegrationStatus[]
  
  // Check if feature enabled
  isFeatureEnabled(tenantId: string, feature: string): boolean
}
```

### 2. **Unified API Gateway** 🚪

**File:** `app/api/v1/[...path]/route.ts`

```typescript
/**
 * Unified API Gateway
 * 
 * Routes ALL requests through unified context:
 * - /v1/omnichannel/* → Omnichannel API
 * - /v1/fdx/* → FDX API
 * - /v1/marketing/* → Marketing API
 * - /v1/ivr/* → IVR API
 * - /v1/features/* → Feature API
 * - /v1/graphql → GraphQL API
 * 
 * All routes:
 * - Load config once (cached)
 * - Share service context
 * - Unified error handling
 * - Unified logging
 * - Feature flag checks
 */

export async function GET/POST/PUT/DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // 1. Extract tenant from headers/query
  const tenantId = extractTenantId(request)
  
  // 2. Load unified context (cached)
  const context = await UnifiedServiceContext.getInstance()
  const config = await context.getConfig(tenantId)
  
  // 3. Route to appropriate service
  const service = context.getService(path[0])
  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }
  
  // 4. Check feature flags
  if (!context.isFeatureEnabled(tenantId, service.requiredFeature)) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 })
  }
  
  // 5. Process request through service
  return service.handler(request, { config, context })
}
```

### 3. **Service Registry** 📋

**File:** `lib/services/service-registry.ts`

```typescript
/**
 * Service Registry
 * 
 * Central registry of all services:
 * - Omnichannel Service
 * - FDX Service
 * - Marketing Service
 * - IVR Service
 * - Feature packaging service
 * - Transaction Enrichment Service
 * - PowerOn Service
 * - Hume Service
 */

export interface ServiceDefinition {
  id: string
  name: string
  version: string
  path: string // API path prefix
  requiredFeature?: string // Feature flag
  dependencies: string[] // Other service IDs
  handler: (request: NextRequest, context: ServiceContext) => Promise<NextResponse>
  healthCheck?: () => Promise<boolean>
}

export const SERVICE_REGISTRY: ServiceDefinition[] = [
  {
    id: 'omnichannel',
    name: 'Omnichannel API',
    version: '1.0.0',
    path: '/v1/omnichannel',
    handler: omnichannelHandler,
  },
  {
    id: 'fdx',
    name: 'FDX API',
    version: '1.0.0',
    path: '/v1/fdx',
    requiredFeature: 'fdx',
    handler: fdxHandler,
  },
  {
    id: 'marketing',
    name: 'Marketing CMS',
    version: '1.0.0',
    path: '/v1/marketing',
    requiredFeature: 'marketing',
    handler: marketingHandler,
  },
  {
    id: 'ivr',
    name: 'IVR Service',
    version: '1.0.0',
    path: '/v1/ivr',
    requiredFeature: 'ivr',
    dependencies: ['omnichannel'],
    handler: ivrHandler,
  },
  {
    id: 'features',
    name: 'Feature Catalog & Packaging',
    version: '1.0.0',
    path: '/v1/features',
    handler: featuresHandler,
  },
  {
    id: 'transaction-enrichment',
    name: 'Transaction Enrichment',
    version: '1.0.0',
    path: '/v1/transactions/enrich',
    handler: transactionEnrichmentHandler,
  },
  {
    id: 'graphql',
    name: 'GraphQL API',
    version: '1.0.0',
    path: '/v1/graphql',
    dependencies: ['transaction-enrichment'],
    handler: graphqlHandler,
  },
]
```

### 4. **Event Bus** 📡

**File:** `lib/events/event-bus.ts`

```typescript
/**
 * Unified Event Bus
 * 
 * Allows services to communicate:
 * - Config updates
 * - Integration status changes
 * - Feature toggles
 * - Transaction events
 * - IVR events
 * - Marketing updates
 */

export interface Event {
  type: string
  tenantId: string
  payload: any
  timestamp: string
  source: string
}

export class EventBus {
  private subscribers: Map<string, Array<(event: Event) => Promise<void>>>
  
  // Subscribe to event type
  subscribe(eventType: string, handler: (event: Event) => Promise<void>): void
  
  // Publish event
  async publish(event: Event): Promise<void>
  
  // Get event history
  getEventHistory(tenantId: string, eventType?: string): Event[]
}

// Event Types
export const EVENT_TYPES = {
  CONFIG_UPDATED: 'config.updated',
  INTEGRATION_STATUS_CHANGED: 'integration.status.changed',
  FEATURE_TOGGLED: 'feature.toggled',
  TRANSACTION_ENRICHED: 'transaction.enriched',
  IVR_CALL_STARTED: 'ivr.call.started',
  IVR_CALL_ENDED: 'ivr.call.ended',
  MARKETING_CONTENT_UPDATED: 'marketing.content.updated',
  FEATURE_PACKAGE_CREATED: 'features.package.created',
}
```

### 5. **Unified Integration Status** 📊

**File:** `lib/integrations/unified-status.ts`

```typescript
/**
 * Unified Integration Status
 * 
 * Single source of truth for all integration health:
 * - PowerOn
 * - FDX
 * - Transaction Enrichment
 * - IVR (Hume + Twilio)
 * - Marketing CMS
 * - Feature catalog
 */

export interface IntegrationStatus {
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

export class UnifiedIntegrationStatus {
  // Check all integrations for a CU
  async checkAll(tenantId: string): Promise<IntegrationStatus[]>
  
  // Check specific integration
  async check(tenantId: string, integrationId: string): Promise<IntegrationStatus>
  
  // Subscribe to status changes
  onStatusChange(callback: (status: IntegrationStatus) => void): void
}
```

### 6. **Shared Data Models** 📦

**File:** `lib/models/shared-models.ts`

```typescript
/**
 * Shared Data Models
 * 
 * Common types used across all services:
 * - Request/Response wrappers
 * - Error types
 * - Status types
 * - Config types
 */

export interface UnifiedRequest {
  tenantId: string
  channel?: string
  operation: string
  payload: any
  context?: RequestContext
}

export interface UnifiedResponse<T = any> {
  success: boolean
  data?: T
  error?: ErrorResponse
  metadata: ResponseMetadata
}

export interface RequestContext {
  memberId?: string
  sessionId?: string
  deviceId?: string
  ipAddress?: string
  userAgent?: string
}

export interface ResponseMetadata {
  tenantId: string
  service: string
  operation: string
  processingTime: number
  timestamp: string
  layers?: string[]
}
```

### 7. **Integration Flow Improvements** 🔄

#### A. Transaction Enrichment Everywhere
- Add to omnichannel Layer 11
- Add to FDX transactions
- Add to GraphQL (already done)
- Add to IVR transaction queries

#### B. FDX in Omnichannel Flow
- Add FDX layer to omnichannel architecture
- Route compliance requests through omnichannel
- Share PowerOn bridge with FDX

#### C. Marketing CMS Integration
- Connect marketing updates to event bus
- Allow omnichannel to fetch marketing content
- Share branding/config with marketing

#### D. IVR Full Integration
- Route all IVR through omnichannel
- Share Hume integration
- Share PowerOn connection
- Unified session management

#### E. Feature catalog
- Connect feature catalog to config
- Enable/disable features based on purchases
- Auto-update config when package created

---

## Implementation Plan

### Phase 1: Foundation (Week 1)
1. ✅ Create `UnifiedServiceContext`
2. ✅ Create `ServiceRegistry`
3. ✅ Create shared data models
4. ✅ Create event bus

### Phase 2: Gateway (Week 2)
1. ✅ Create unified API gateway
2. ✅ Migrate existing routes to gateway
3. ✅ Add config caching
4. ✅ Add feature flag checks

### Phase 3: Integration (Week 3)
1. ✅ Add transaction enrichment to omnichannel
2. ✅ Integrate FDX into omnichannel
3. ✅ Connect marketing to event bus
4. ✅ Full IVR integration

### Phase 4: Enhancement (Week 4)
1. ✅ Unified integration status dashboard
2. ✅ Event history viewer
3. ✅ Service health monitoring
4. ✅ Performance metrics

---

## Benefits

### 1. **Single Source of Truth**
- One config loader (cached)
- One service registry
- One event bus

### 2. **Better Performance**
- Config caching (no repeated DB queries)
- Shared connections (PowerOn, Hume, etc.)
- Optimized routing

### 3. **Easier Development**
- Services discover each other
- Shared utilities
- Consistent patterns

### 4. **Better Observability**
- Unified logging
- Event history
- Integration status dashboard

### 5. **Feature Flags**
- Centralized feature management
- Easy enable/disable
- Per-CU customization

---

## Migration Strategy

### Step 1: Create New Infrastructure
- Build unified context
- Build service registry
- Build event bus

### Step 2: Migrate One Service at a Time
- Start with omnichannel (already has most)
- Then GraphQL
- Then FDX
- Then marketing
- Then IVR
- Feature catalog

### Step 3: Update Frontend
- Update API calls to use `/v1/*` paths
- Use unified status endpoint
- Show integration health

### Step 4: Deprecate Old Routes
- Keep old routes for backward compatibility
- Add deprecation warnings
- Remove after migration complete

---

## Example: Unified Request Flow

### Before (Current):
```
Mobile App → /api/graphql → Load config → PowerOn → Transaction Enrichment → Response
IVR → /api/ivr/genesys → Load config → Omnichannel → PowerOn → Response
Web → /api/fdx/accounts → Load config → PowerOn → FDX Bridge → Response
```

### After (Unified):
```
Mobile App → /v1/graphql → Gateway → Service Context (cached config) → GraphQL Service → PowerOn → Transaction Enrichment → Event Bus → Response
IVR → /v1/ivr/genesys → Gateway → Service Context → IVR Service → Omnichannel Service → PowerOn → Event Bus → Response
Web → /v1/fdx/accounts → Gateway → Service Context → FDX Service → PowerOn → FDX Bridge → Event Bus → Response
```

**Benefits:**
- Config loaded once (cached)
- Services share connections
- Events published for monitoring
- Unified error handling
- Feature flags checked automatically

---

## Next Steps

1. **Review this plan** - Does this align with your vision?
2. **Prioritize** - Which phase should we start with?
3. **Implement** - Begin with Phase 1 (Foundation)

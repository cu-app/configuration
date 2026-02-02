# CU Launcher Batch Loading Strategy

## The Challenge
Load all 4,822 NCUA credit unions from Supabase efficiently, including logos, without overwhelming the database or browser.

## Solution: Intelligent Batch Loading

### Strategy Overview

```
┌─────────────────────────────────────────────────────────┐
│  Client Request                                         │
│  "Load all CUs with logos"                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│  API: /api/culauncher/batch-load                        │
│  - Batch size: 100 (configurable)                       │
│  - Cursor-based pagination                              │
│  - Filter: withLogosOnly = true                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│  Supabase Query                                         │
│  SELECT * FROM ncua_credit_unions                       │
│  WHERE is_active = true                                  │
│  AND logo_url IS NOT NULL                               │
│  ORDER BY cu_name                                        │
│  LIMIT 100 OFFSET {offset}                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│  Return Batch + Metadata                                 │
│  {                                                       │
│    creditUnions: [...],                                 │
│    pagination: {                                         │
│      total: 4822,                                        │
│      hasMore: true,                                      │
│      nextOffset: 100                                     │
│    }                                                     │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
```

### Implementation

#### 1. API Endpoint: `/api/culauncher/batch-load`

**GET Request:**
```typescript
GET /api/culauncher/batch-load?batchSize=100&offset=0&withLogos=true

Response:
{
  creditUnions: CreditUnion[],
  pagination: {
    total: 4822,
    batchSize: 100,
    offset: 0,
    hasMore: true,
    nextOffset: 100
  }
}
```

**POST Request (Statistics):**
```typescript
POST /api/culauncher/batch-load

Response:
{
  statistics: {
    total: 4822,
    withLogos: 3500,
    withoutLogos: 1322,
    logoCoverage: 72.5,
    byState: { CA: 342, TX: 498, ... }
  },
  recommendations: {
    batchSize: 100,
    largeBatchSize: 500,
    estimatedBatches: 49,
    estimatedBatchesWithLogos: 35
  }
}
```

#### 2. Client-Side Batch Loader: `lib/culauncher-batch-loader.ts`

**Usage:**
```typescript
import { loadAllCreditUnions, loadCreditUnionsWithLogos } from '@/lib/culauncher-batch-loader'

// Load all CUs with logos
const result = await loadCreditUnionsWithLogos({
  batchSize: 100,
  onProgress: (loaded, total) => {
    console.log(`Loaded ${loaded} of ${total}`)
  },
  onBatchComplete: (batch, batchNumber) => {
    console.log(`Batch ${batchNumber} complete: ${batch.length} CUs`)
  }
})

// Result:
// {
//   creditUnions: [...], // All 3,500+ CUs with logos
//   total: 3500,
//   batchesLoaded: 35,
//   errors: []
// }
```

### Batch Size Recommendations

| Scenario | Batch Size | Reason |
|----------|-----------|--------|
| **Initial Load (with logos)** | 100 | Good balance of speed and memory |
| **Large Initial Load** | 500 | Faster, but more memory usage |
| **Search Results** | 20 | Small, fast results |
| **Infinite Scroll** | 50 | Smooth scrolling experience |

### Performance Optimizations

1. **Filter First**: Load CUs with logos only (`withLogosOnly=true`) to reduce dataset
2. **Cursor Pagination**: Use `OFFSET` and `LIMIT` for predictable pagination
3. **Indexed Queries**: Ensure `is_active` and `logo_url` are indexed in Supabase
4. **Batch Delay**: 100ms delay between batches to avoid overwhelming server
5. **Error Recovery**: Continue loading even if one batch fails

### Loading All 4,822 Credit Unions

**Option 1: With Logos Only (Recommended)**
```typescript
// Loads ~3,500 CUs with logos (faster)
const result = await loadCreditUnionsWithLogos({
  batchSize: 100,
  onProgress: (loaded, total) => {
    updateProgressBar(loaded / total)
  }
})
// ~35 batches, ~3.5 seconds
```

**Option 2: All Credit Unions**
```typescript
// Loads all 4,822 CUs (slower, includes those without logos)
const result = await loadAllCreditUnions({
  batchSize: 100,
  onProgress: (loaded, total) => {
    updateProgressBar(loaded / total)
  }
})
// ~49 batches, ~5 seconds
```

**Option 3: Large Batches (Faster)**
```typescript
// Loads faster but uses more memory
const result = await loadCreditUnionsWithLogos({
  batchSize: 500, // Large batches
  onProgress: (loaded, total) => {
    updateProgressBar(loaded / total)
  }
})
// ~7 batches, ~1 second
```

### Database Optimization

**Recommended Supabase Indexes:**
```sql
-- Index for active CUs
CREATE INDEX idx_ncua_active ON ncua_credit_unions(is_active) WHERE is_active = true;

-- Index for logo queries
CREATE INDEX idx_ncua_logo ON ncua_credit_unions(logo_url) WHERE logo_url IS NOT NULL;

-- Composite index for common queries
CREATE INDEX idx_ncua_search ON ncua_credit_unions(cu_name, city, state) WHERE is_active = true;
```

### Usage in Components

**In CU Search Component:**
```typescript
// Search is already implemented with debouncing
// Uses: GET /api/culauncher/cu-search?q=query&limit=20
```

**For Preloading (Future Enhancement):**
```typescript
// Preload popular CUs on page load
useEffect(() => {
  loadCreditUnionsWithLogos({
    batchSize: 500, // Large initial batch
    onBatchComplete: (batch) => {
      // Cache in localStorage or state
      cacheCreditUnions(batch)
    }
  })
}, [])
```

### Error Handling

The batch loader includes automatic error recovery:
- If one batch fails, it continues with the next
- Errors are collected and returned in the result
- Client can retry failed batches if needed

### Memory Considerations

**With 100 CUs per batch:**
- ~50KB per batch (JSON)
- ~1.75MB for all 3,500 CUs with logos
- Manageable for modern browsers

**With 500 CUs per batch:**
- ~250KB per batch
- ~875KB for all 3,500 CUs
- Even more efficient

### Next Steps

1. **Add Caching**: Cache loaded CUs in localStorage or IndexedDB
2. **Virtual Scrolling**: Use react-window for large lists
3. **Progressive Loading**: Load visible CUs first, then background load
4. **Logo CDN**: Move logos to CDN for faster loading
5. **Image Optimization**: Lazy load logos, use WebP format

## Summary

**To load all credit unions in batches:**

1. Use `/api/culauncher/batch-load?batchSize=100&withLogos=true`
2. Start with `offset=0`
3. Continue until `hasMore=false`
4. Use `nextOffset` for next batch
5. Repeat until all loaded

**For logos specifically:**
- Filter with `withLogosOnly=true` (reduces from 4,822 to ~3,500)
- Use batch size of 100-500
- Expect ~35 batches for all CUs with logos
- Total time: ~3-5 seconds

**The batch loader utility handles all of this automatically!**

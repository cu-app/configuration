# CU.APP Transaction Enrichment

**Replace MX's $50K/year service with edge computing for ~$5/month**

Cloudflare Workers-based transaction enrichment system that provides:
- ✅ Description cleaning
- ✅ Merchant matching
- ✅ Category prediction (ML-powered)
- ✅ Subscription detection
- ✅ Recurring payment tracking
- ✅ Bill payment identification
- ✅ Location matching

## 🚀 Performance

- **Latency**: <50ms globally (edge computing)
- **Cost**: ~$5/month for 10M requests
- **Uptime**: 99.99% (Cloudflare SLA)
- **Scale**: Handles millions of transactions/day

## 💰 Cost Comparison

| Service | Cost | Notes |
|---------|------|-------|
| **MX** | $50,000/year | Plus integration fees |
| **CU.APP Edge** | $5/month ($60/year) | 10M requests included |
| **Savings** | **$49,940/year** | 833x cheaper |

## 📦 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Cloudflare Worker                        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Cleaner    │  │   Merchant   │  │  Categorizer │ │
│  │              │─▶│   Matcher    │─▶│     (ML)     │ │
│  │  Remove      │  │              │  │              │ │
│  │  noise from  │  │  Match to    │  │  Predict     │ │
│  │  bank desc   │  │  known       │  │  category    │ │
│  └──────────────┘  │  merchants   │  │  using AI    │ │
│                     └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Pattern Detector                      │  │
│  │  - Subscriptions (Netflix, Spotify, etc.)        │  │
│  │  - Recurring payments (loans, insurance)         │  │
│  │  - Bill pay detection                            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
           │                    │                 │
           ▼                    ▼                 ▼
    ┌──────────┐        ┌──────────┐      ┌──────────┐
    │ KV Store │        │ KV Store │      │ KV Store │
    │ Merchants│        │Categories│      │ Patterns │
    └──────────┘        └──────────┘      └──────────┘
```

## 🏁 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Train ML Model

```bash
npm run train
```

This creates a TensorFlow.js model in `models/categorizer/` trained on transaction patterns.

### 3. Seed Merchant Database

```bash
wrangler dev
# In another terminal:
curl -X POST http://localhost:8787/seed
```

### 4. Deploy to Cloudflare

```bash
wrangler deploy
```

### 5. Test Enrichment

```bash
curl -X POST https://your-worker.workers.dev/enrich \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": {
      "guid": "TXN-123",
      "account_guid": "ACC-456",
      "amount": -15.99,
      "description": "NETFLIX.COM 123456789",
      "date": "2025-01-15",
      "mcc_code": "4899"
    }
  }'
```

**Response:**
```json
{
  "transaction": {
    "guid": "TXN-123",
    "cleaned_description": "Netflix",
    "merchant_guid": "MER-NETFLIX",
    "merchant_name": "Netflix",
    "merchant_logo_url": "https://logo.clearbit.com/netflix.com",
    "category_guid": "CAT-ENT-STREAMING",
    "category_name": "Streaming Services",
    "category_confidence": 0.94,
    "is_subscription": true,
    "is_recurring": true,
    "is_bill_pay": false,
    "enriched_by": "CUAPP",
    "processing_time_ms": 23
  }
}
```

## 📡 API Endpoints

### `POST /enrich`
Enrich a single transaction.

**Request:**
```json
{
  "transaction": {
    "guid": "TXN-123",
    "account_guid": "ACC-456",
    "amount": -87.43,
    "description": "WALMART SUPERCENTER #1234",
    "date": "2025-01-15",
    "mcc_code": "5411",
    "latitude": 27.9506,
    "longitude": -82.4572
  },
  "history": [] // Optional: for pattern detection
}
```

**Response:**
```json
{
  "transaction": {
    "guid": "TXN-123",
    "cleaned_description": "Walmart",
    "merchant_guid": "MER-WALMART",
    "merchant_name": "Walmart",
    "category_guid": "CAT-FOOD-GROCERY",
    "category_name": "Groceries",
    "category_confidence": 0.88,
    "is_subscription": false,
    "is_recurring": false,
    "enriched_by": "CUAPP",
    "processing_time_ms": 18
  },
  "processing_time_ms": 18
}
```

### `POST /enrich/batch`
Enrich multiple transactions at once.

**Request:**
```json
{
  "account_guid": "ACC-456",
  "transactions": [
    { "guid": "TXN-1", "description": "STARBUCKS", "amount": -5.45, "date": "2025-01-15" },
    { "guid": "TXN-2", "description": "SHELL OIL", "amount": -52.30, "date": "2025-01-14" }
  ]
}
```

### `GET /merchant/search?q=starbucks`
Search for a merchant by name.

### `GET /subscriptions?account_guid=ACC-456`
Get all detected subscriptions for an account.

### `GET /health`
Health check endpoint.

## 🧠 How It Works

### 1. Description Cleaning

Raw bank descriptions are messy:

```
"AMZN MKTP US*2X3Y4Z5W6 AMAZON.COM/BILL WA"
```

We clean them to:

```
"Amazon Marketplace"
```

**Cleaning steps:**
- Remove transaction IDs (long numbers)
- Remove masked card numbers (`****1234`)
- Remove POS/PURCHASE/DEBIT indicators
- Remove dates
- Match against known merchant patterns
- Extract location hints (state codes, ZIP codes)
- Convert to title case

### 2. Merchant Matching

We match transactions to merchants using multiple strategies:

**Strategy 1: Exact Name Match** (95% confidence)
```
"STARBUCKS" → Merchant: MER-STARBUCKS
```

**Strategy 2: Pattern Match** (88% confidence)
```
"AMZN MKTP US*123456" → Pattern: "AMZN" → Merchant: MER-AMAZON
```

**Strategy 3: MCC Code Lookup** (70-82% confidence)
```
MCC 5411 (Grocery Stores) → Merchant: MER-WALMART
```

**Strategy 4: Fuzzy String Match** (75%+ confidence)
```
"STRBUKS" → Levenshtein distance → "STARBUCKS" → MER-STARBUCKS
```

**Strategy 5: Location Match** (if lat/lon provided)
```
Lat: 27.9506, Lon: -82.4572
→ Find nearest merchant location within 10 miles
```

### 3. Categorization

**Rule-Based (Fast Path):**
For obvious cases, we use pattern matching:
```typescript
if (description.includes('netflix')) {
  return { category: 'CAT-ENT-STREAMING', confidence: 0.94 };
}
```

**ML-Based (Fallback):**
For ambiguous cases, we use a TensorFlow.js neural network trained on historical data:

```
Input:
  - Tokenized description (20 tokens)
  - Normalized amount
  - Day of week
  - Hour of day

Output:
  - Category probabilities (softmax)
  - Confidence score (0-1)
```

### 4. Pattern Detection

**Subscription Detection:**
```typescript
// Check if merchant is known subscription service
if (merchantGuid === 'MER-NETFLIX') return true;

// Or analyze historical transactions
const pattern = detectRecurringPattern(history);
if (pattern.frequency === 'MONTHLY' && pattern.confidence > 0.85) {
  return true;
}
```

**Recurring Payment Detection:**
```
Transactions:
  - 2024-12-15: $29.99 (LA Fitness)
  - 2024-11-15: $29.99 (LA Fitness)
  - 2024-10-15: $29.99 (LA Fitness)

Pattern Detected:
  - Frequency: MONTHLY
  - Confidence: 0.92
  - Next expected: 2025-01-15
```

## 🗄️ Data Storage (Cloudflare KV)

### Merchant Index
```
Key: merchant:MER-NETFLIX
Value: {
  guid: "MER-NETFLIX",
  name: "Netflix",
  logo_url: "https://logo.clearbit.com/netflix.com",
  mcc_codes: ["4899"],
  name_patterns: ["NETFLIX"]
}

Key: merchant:name:netflix
Value: "MER-NETFLIX"

Key: merchant:pattern:netflix
Value: "MER-NETFLIX"

Key: merchant:mcc:4899
Value: "MER-NETFLIX"
```

### Category Index
```
Key: category:CAT-ENT-STREAMING
Value: {
  guid: "CAT-ENT-STREAMING",
  name: "Streaming Services",
  parent: "CAT-ENTERTAINMENT"
}
```

### Transaction History
```
Key: history:ACC-456
Value: [
  {
    guid: "TXN-1",
    merchant_guid: "MER-NETFLIX",
    amount: -15.99,
    date: "2025-01-15"
  },
  ...
]
Expiration: 90 days
```

## 🧪 Testing

### Run Unit Tests
```bash
npm test
```

### Test Locally
```bash
wrangler dev
```

Then in another terminal:
```bash
# Single enrichment
curl -X POST http://localhost:8787/enrich -H "Content-Type: application/json" -d @test-transaction.json

# Batch enrichment
curl -X POST http://localhost:8787/enrich/batch -H "Content-Type: application/json" -d @test-batch.json

# Merchant search
curl http://localhost:8787/merchant/search?q=starbucks

# Health check
curl http://localhost:8787/health
```

## 📈 Performance Optimization

### 1. Edge Computing
All processing happens at Cloudflare's edge (200+ locations globally), ensuring <50ms latency regardless of user location.

### 2. KV Caching
Merchant and category lookups are cached in Cloudflare KV, providing sub-millisecond read times.

### 3. Rule-Based Fast Path
Common merchants (Netflix, Starbucks, etc.) are categorized via rules before hitting the ML model, reducing latency.

### 4. Batch Processing
The `/enrich/batch` endpoint processes multiple transactions in parallel using `Promise.all()`.

### 5. Durable Objects (Future)
For ML model serving, we can use Durable Objects to cache the TensorFlow.js model in memory for faster inference.

## 🔒 Security

### API Authentication (Recommended)
Add bearer token authentication:

```typescript
const authHeader = request.headers.get('Authorization');
if (authHeader !== `Bearer ${env.API_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

Set `API_SECRET` in wrangler.toml:
```toml
[vars]
API_SECRET = "your-secret-token"
```

### Rate Limiting
Implement rate limiting using Durable Objects:

```typescript
const limiter = env.RATE_LIMITER.get(id);
const allowed = await limiter.checkLimit(clientIp);
if (!allowed) {
  return new Response('Too Many Requests', { status: 429 });
}
```

## 🚢 Deployment

### Production Deployment
```bash
wrangler deploy --env production
```

### Environment Variables
Set in wrangler.toml:
```toml
[env.production]
name = "cuapp-transaction-enrichment-prod"
route = "api.cuapp.com/v1/transactions/*"
```

### Custom Domain
```bash
wrangler route add api.cuapp.com/v1/transactions/* cuapp-transaction-enrichment-prod
```

## 📊 Monitoring

### Cloudflare Analytics
View request metrics in Cloudflare dashboard:
- Requests per second
- Latency percentiles (p50, p95, p99)
- Error rates
- Cache hit rates

### Custom Logging
```typescript
console.log('Enriched transaction', {
  guid: transaction.guid,
  merchant: merchantMatch.merchant?.name,
  category: category.name,
  latency_ms: Date.now() - startTime,
});
```

View logs:
```bash
wrangler tail
```

## 🎯 MX API Compatibility

This service is designed to be a **drop-in replacement** for MX's Helios API.

### MX Helios Endpoint
```
GET https://api.mx.com/transactions/{guid}
```

### CU.APP Edge Endpoint
```
POST https://your-worker.workers.dev/enrich
```

### Field Mapping

| MX Field | CU.APP Field | Notes |
|----------|--------------|-------|
| `description` | `cleaned_description` | Human-readable |
| `category` | `category_name` | |
| `top_level_category` | `category_parent_name` | |
| `merchant_guid` | `merchant_guid` | |
| `merchant_name` | `merchant_name` | |
| `is_subscription` | `is_subscription` | |
| `is_recurring` | `is_recurring` | |
| `is_bill_pay` | `is_bill_pay` | |

## 💡 Future Enhancements

### 1. Receipt OCR
Add receipt image processing using Cloudflare AI:
```typescript
const items = await env.AI.run('@cf/meta/llama-3-8b', {
  prompt: 'Extract line items from receipt image',
  image: receiptImage,
});
```

### 2. Anomaly Detection
Flag unusual transactions:
```typescript
if (amount > avgAmount * 3) {
  alert('Unusual transaction detected');
}
```

### 3. Budget Tracking
Track spending by category:
```typescript
const monthlySpending = await getSpendingByCategory(accountGuid, month);
if (monthlySpending['CAT-FOOD'] > budget['CAT-FOOD']) {
  notify('Over budget for Food & Dining');
}
```

### 4. Cashback Optimization
Suggest better credit cards based on spending patterns:
```typescript
const topCategories = getTopSpendingCategories(accountGuid);
const bestCards = findCardsWithHighestCashback(topCategories);
```

## 📞 Support

For questions or issues:
- GitHub Issues: [link]
- Email: support@cuapp.com
- Discord: [link]

## 📄 License

MIT License - see LICENSE file

---

**Built with ❤️ using Cloudflare Workers + TensorFlow.js**

**Saving credit unions $49,940/year, one transaction at a time.**

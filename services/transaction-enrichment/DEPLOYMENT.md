# Deployment Guide

## Prerequisites

1. **Cloudflare Account**
   - Sign up at [cloudflare.com](https://cloudflare.com)
   - Workers plan: $5/month (includes 10M requests)

2. **Node.js & npm**
   ```bash
   node --version  # v16 or higher
   npm --version
   ```

3. **Wrangler CLI**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

## Setup Steps

### 1. Clone and Install

```bash
cd /Users/kylekusche/Desktop/cuapp-transaction-enrichment
npm install
```

### 2. Create KV Namespaces

```bash
# Production namespaces
wrangler kv:namespace create "MERCHANTS"
wrangler kv:namespace create "CATEGORIES"
wrangler kv:namespace create "PATTERNS"
wrangler kv:namespace create "TRANSACTION_HISTORY"

# Preview namespaces (for local dev)
wrangler kv:namespace create "MERCHANTS" --preview
wrangler kv:namespace create "CATEGORIES" --preview
wrangler kv:namespace create "PATTERNS" --preview
wrangler kv:namespace create "TRANSACTION_HISTORY" --preview
```

**Output:**
```
✨ Successfully created KV namespace with id "abc123..."
Add the following to your wrangler.toml:
{ binding = "MERCHANTS", id = "abc123..." }
```

### 3. Update wrangler.toml

Replace the placeholder IDs in `wrangler.toml` with your actual namespace IDs:

```toml
[[kv_namespaces]]
binding = "MERCHANTS"
id = "YOUR_MERCHANTS_ID_HERE"
preview_id = "YOUR_MERCHANTS_PREVIEW_ID_HERE"

[[kv_namespaces]]
binding = "CATEGORIES"
id = "YOUR_CATEGORIES_ID_HERE"
preview_id = "YOUR_CATEGORIES_PREVIEW_ID_HERE"

[[kv_namespaces]]
binding = "PATTERNS"
id = "YOUR_PATTERNS_ID_HERE"
preview_id = "YOUR_PATTERNS_PREVIEW_ID_HERE"

[[kv_namespaces]]
binding = "TRANSACTION_HISTORY"
id = "YOUR_HISTORY_ID_HERE"
preview_id = "YOUR_HISTORY_PREVIEW_ID_HERE"
```

### 4. Train ML Model

```bash
npm run train
```

This creates a TensorFlow.js model in `models/categorizer/`.

**Output:**
```
Training samples: 50
Vocabulary size: 87
Categories: 31
Epoch 50: loss = 0.1234, accuracy = 0.9600
Model saved successfully!
```

### 5. Seed Merchant Database (Local Dev)

```bash
# Start local dev server
wrangler dev

# In another terminal, seed merchants
curl -X POST http://localhost:8787/seed
```

Or manually seed using Wrangler KV:

```bash
wrangler kv:key put --namespace-id=YOUR_MERCHANTS_ID \
  "merchant:MER-NETFLIX" \
  '{"guid":"MER-NETFLIX","name":"Netflix","logo_url":"https://logo.clearbit.com/netflix.com","mcc_codes":["4899"],"name_patterns":["NETFLIX"]}'

wrangler kv:key put --namespace-id=YOUR_MERCHANTS_ID \
  "merchant:name:netflix" \
  "MER-NETFLIX"
```

### 6. Test Locally

```bash
wrangler dev
```

Test enrichment:
```bash
curl -X POST http://localhost:8787/enrich \
  -H "Content-Type: application/json" \
  -d @test-transaction.json
```

Expected response:
```json
{
  "transaction": {
    "guid": "TXN-20250115-001",
    "cleaned_description": "Netflix",
    "merchant_name": "Netflix",
    "category_name": "Streaming Services",
    "is_subscription": true,
    "processing_time_ms": 18
  }
}
```

### 7. Deploy to Production

```bash
wrangler deploy
```

**Output:**
```
✨ Successful deployment!
URL: https://cuapp-transaction-enrichment.YOUR_SUBDOMAIN.workers.dev
```

### 8. Set Up Custom Domain (Optional)

#### Option A: Cloudflare Domain

If you have a domain on Cloudflare:

```bash
wrangler route add api.cuapp.com/v1/transactions/* cuapp-transaction-enrichment
```

#### Option B: Custom Routes in wrangler.toml

```toml
routes = [
  { pattern = "api.cuapp.com/v1/transactions/*", zone_name = "cuapp.com" }
]
```

Then deploy:
```bash
wrangler deploy
```

### 9. Verify Deployment

```bash
# Health check
curl https://your-worker.workers.dev/health

# Test enrichment
curl -X POST https://your-worker.workers.dev/enrich \
  -H "Content-Type: application/json" \
  -d @test-transaction.json
```

## Production Checklist

### Security

- [ ] Add API authentication (bearer token)
- [ ] Enable rate limiting
- [ ] Set up CORS restrictions
- [ ] Configure IP allowlists if needed

#### Add Bearer Token Auth

In `src/index.ts`:
```typescript
const authHeader = request.headers.get('Authorization');
if (authHeader !== `Bearer ${env.API_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

Set secret:
```bash
wrangler secret put API_SECRET
# Enter your secret token when prompted
```

### Monitoring

- [ ] Set up Cloudflare Analytics dashboard
- [ ] Configure log retention
- [ ] Set up alerts for errors/latency

#### View Logs

```bash
wrangler tail --format=pretty
```

#### Set Up Alerts

In Cloudflare dashboard:
1. Go to Workers & Pages → cuapp-transaction-enrichment
2. Metrics → Create Alert
3. Configure:
   - Error rate > 5%
   - Latency p95 > 100ms
   - Requests/min > 10000

### Performance

- [ ] Test with production-scale data
- [ ] Benchmark latency at p50, p95, p99
- [ ] Load test with 1000+ concurrent requests

#### Load Testing

```bash
# Using Apache Bench
ab -n 10000 -c 100 -p test-transaction.json \
  -T application/json \
  https://your-worker.workers.dev/enrich

# Or using k6
k6 run load-test.js
```

### Data Management

- [ ] Seed production merchant database
- [ ] Set up merchant data sync process
- [ ] Configure KV backup strategy

#### Bulk Import Merchants

```bash
# From CSV file
node scripts/import-merchants.js merchants.csv
```

## Maintenance

### Update ML Model

When you have new training data:

```bash
npm run train
wrangler deploy
```

### Update Merchant Database

```bash
# Add new merchant
wrangler kv:key put --namespace-id=YOUR_MERCHANTS_ID \
  "merchant:MER-NEWCO" \
  '{"guid":"MER-NEWCO","name":"New Company","mcc_codes":["1234"]}'
```

### Monitor Performance

```bash
# View live logs
wrangler tail

# View analytics
wrangler metrics
```

## Rollback

If deployment fails:

```bash
# View deployment history
wrangler deployments list

# Rollback to previous version
wrangler deployments rollback --deployment-id=DEPLOYMENT_ID
```

## Cost Monitoring

### Free Tier Limits
- 100,000 requests/day
- 10ms CPU time per request

### Paid Plan ($5/month)
- 10,000,000 requests/month
- 50ms CPU time per request

### Monitor Usage

In Cloudflare dashboard:
- Workers & Pages → cuapp-transaction-enrichment → Metrics
- View:
  - Requests per day
  - CPU time per request
  - Error rate
  - Bandwidth usage

### Set Budget Alerts

1. Go to Cloudflare dashboard
2. Billing → Notifications
3. Create alert: "Workers usage exceeds 8M requests/month"

## Troubleshooting

### Issue: "Error: Could not resolve 'MERCHANTS'"

**Solution:** Ensure KV namespaces are created and IDs are set in wrangler.toml.

```bash
wrangler kv:namespace list
```

### Issue: "Module not found: @tensorflow/tfjs"

**Solution:** Install dependencies:

```bash
npm install
```

### Issue: "Exceeded CPU limit"

**Solution:** Optimize code or upgrade to higher plan.

1. Review CPU time in logs
2. Optimize ML inference
3. Use Durable Objects for model caching

### Issue: "CORS error when calling API"

**Solution:** Update CORS headers in `src/index.ts`:

```typescript
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

## Support

- Cloudflare Workers Docs: https://developers.cloudflare.com/workers
- Wrangler CLI Docs: https://developers.cloudflare.com/workers/wrangler
- GitHub Issues: [Your repo URL]

---

**Deployment complete! 🚀**

Your transaction enrichment service is now running at the edge, replacing MX's $50K/year service for $5/month.

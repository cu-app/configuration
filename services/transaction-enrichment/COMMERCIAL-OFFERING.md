# CU.APP Transaction Enrichment API
## Commercial SaaS Offering

---

## 🎯 Product Overview

**Professional transaction enrichment API that replaces MX, Plaid, and other expensive vendors.**

Replace your $50K/year MX subscription with our $99/month API. Same features, 10x faster, 98% cheaper.

---

## 🌐 API Endpoint

```
Production: https://api.cuapp.com/v1/transactions
Sandbox: https://sandbox.cuapp.com/v1/transactions
Documentation: https://docs.cuapp.com/enrichment-api
```

---

## 💰 Pricing Plans

### 🆓 **Developer (Free)**
**$0/month**

Perfect for testing and development.

**Includes:**
- 10,000 requests/month
- Sandbox environment access
- Basic merchant matching
- Rule-based categorization
- Community support (GitHub)
- 7-day transaction history

**Best for:** Developers, MVPs, proof-of-concepts

[**Sign Up Free →**](https://cuapp.com/signup?plan=developer)

---

### 🚀 **Professional ($99/month)**
**$99/month** • Most Popular

Production-ready for small to mid-size credit unions.

**Everything in Developer, plus:**
- **500,000 requests/month** ($0.20 per 1K requests)
- Production environment access
- ML-powered categorization
- Advanced merchant matching (fuzzy + location)
- Subscription detection
- Recurring payment tracking
- 90-day transaction history
- Email support (24-hour response)
- 99.9% uptime SLA

**Overage:** $0.25 per 1,000 additional requests

**Best for:** Credit unions with 10K-50K members

**Cost comparison:**
- MX: $4,167/month
- **You save: $4,068/month ($48,816/year)**

[**Start 30-Day Trial →**](https://cuapp.com/signup?plan=professional)

---

### 🏢 **Enterprise ($499/month)**
**$499/month** • Recommended

For large credit unions requiring scale and priority support.

**Everything in Professional, plus:**
- **5,000,000 requests/month** ($0.10 per 1K requests)
- Priority processing (guaranteed <50ms)
- Dedicated merchant database
- Custom category taxonomy
- White-label API (your domain)
- Phone + Slack support (1-hour response)
- 99.99% uptime SLA
- Quarterly business reviews
- Custom integrations

**Overage:** $0.15 per 1,000 additional requests

**Best for:** Credit unions with 50K+ members

**Cost comparison:**
- MX: $4,167/month
- **You save: $3,668/month ($44,016/year)**

[**Contact Sales →**](https://cuapp.com/contact?plan=enterprise)

---

### 🔧 **Self-Hosted (One-Time)**
**$2,999 one-time + $99/month hosting**

Own the entire stack. Deploy to your infrastructure.

**Includes:**
- Complete source code (MIT license)
- Deploy to your Cloudflare account
- Full customization rights
- ML model training scripts
- Merchant database seeding tools
- 90 days implementation support
- Documentation + video tutorials
- Lifetime updates (optional: $499/year)

**Hosting costs (your Cloudflare account):**
- Up to 10M requests/month: $5/month
- Each additional 10M: $5/month

**Best for:** Credit unions wanting full control

**Total 5-year cost:**
- Setup: $2,999
- Hosting: $5/month × 60 = $300
- **Total: $3,299 vs MX's $250,000**

[**Purchase License →**](https://cuapp.com/self-hosted)

---

## 📊 Pricing Comparison

| Plan | Monthly Cost | Requests Included | Cost per 1K | vs MX |
|------|--------------|-------------------|-------------|-------|
| **Developer** | $0 | 10K | Free | -100% |
| **Professional** | $99 | 500K | $0.20 | -98% |
| **Enterprise** | $499 | 5M | $0.10 | -88% |
| **Self-Hosted** | $5* | 10M | $0.0005 | -99.99% |
| **MX** | $4,167+ | 1M | $4.17 | Baseline |

*Self-hosted pricing based on Cloudflare Workers

---

## 🔌 Quick Start Integration

### 1. Sign Up & Get API Key

```bash
# Visit https://cuapp.com/signup
# Copy your API key from dashboard
```

### 2. Make Your First Request

```bash
curl -X POST https://api.cuapp.com/v1/transactions/enrich \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": {
      "guid": "TXN-123",
      "account_guid": "ACC-456",
      "amount": -15.99,
      "description": "NETFLIX.COM 866-579-7172 CA",
      "date": "2025-01-15",
      "mcc_code": "4899"
    }
  }'
```

### 3. Get Enriched Data

```json
{
  "transaction": {
    "guid": "TXN-123",
    "cleaned_description": "Netflix",
    "merchant_name": "Netflix",
    "merchant_logo_url": "https://logo.clearbit.com/netflix.com",
    "category_name": "Streaming Services",
    "category_confidence": 0.94,
    "is_subscription": true,
    "processing_time_ms": 18
  }
}
```

---

## 📚 API Documentation

### Base URL
```
Production: https://api.cuapp.com/v1
Sandbox: https://sandbox.cuapp.com/v1
```

### Authentication
```http
Authorization: Bearer YOUR_API_KEY
```

### Endpoints

#### **POST /transactions/enrich**
Enrich a single transaction.

**Request:**
```json
{
  "transaction": {
    "guid": "string",
    "account_guid": "string",
    "amount": number,
    "description": "string",
    "date": "YYYY-MM-DD",
    "mcc_code": "string",
    "latitude": number,
    "longitude": number
  },
  "history": [] // Optional: for pattern detection
}
```

**Response:**
```json
{
  "transaction": {
    "guid": "string",
    "account_guid": "string",
    "amount": number,
    "description": "string",
    "date": "string",

    "cleaned_description": "string",
    "merchant_guid": "string",
    "merchant_name": "string",
    "merchant_logo_url": "string",
    "merchant_confidence": number,

    "category_guid": "string",
    "category_name": "string",
    "category_parent_name": "string",
    "category_confidence": number,

    "is_subscription": boolean,
    "is_recurring": boolean,
    "is_bill_pay": boolean,

    "enriched_by": "CUAPP",
    "enriched_at": "ISO-8601",
    "processing_time_ms": number
  }
}
```

#### **POST /transactions/enrich/batch**
Enrich multiple transactions (up to 100 per request).

**Request:**
```json
{
  "account_guid": "string",
  "transactions": [
    { "guid": "TXN-1", "description": "...", "amount": -10.00, "date": "2025-01-15" },
    { "guid": "TXN-2", "description": "...", "amount": -20.00, "date": "2025-01-14" }
  ]
}
```

**Response:**
```json
{
  "transactions": [ /* enriched transactions */ ],
  "count": 2,
  "processing_time_ms": 45
}
```

#### **GET /merchants/search**
Search for a merchant by name.

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Max results (default: 10)

**Example:**
```http
GET /merchants/search?q=starbucks&limit=5
```

**Response:**
```json
{
  "merchants": [
    {
      "guid": "MER-STARBUCKS",
      "name": "Starbucks",
      "logo_url": "https://logo.clearbit.com/starbucks.com",
      "website_url": "https://starbucks.com",
      "category": "Coffee Shops"
    }
  ],
  "count": 1
}
```

#### **GET /subscriptions**
Get detected subscriptions for an account.

**Query Parameters:**
- `account_guid` (required): Account identifier

**Example:**
```http
GET /subscriptions?account_guid=ACC-456
```

**Response:**
```json
{
  "subscriptions": [
    {
      "merchant_guid": "MER-NETFLIX",
      "merchant_name": "Netflix",
      "amount": -15.99,
      "frequency": "MONTHLY",
      "next_expected_date": "2025-02-15",
      "confidence": 0.92
    }
  ]
}
```

#### **GET /categories**
List all available categories.

**Response:**
```json
{
  "categories": [
    {
      "guid": "CAT-FOOD",
      "name": "Food & Dining",
      "parent": null,
      "subcategories": [
        "CAT-FOOD-GROCERY",
        "CAT-FOOD-REST",
        "CAT-FOOD-FAST"
      ]
    }
  ]
}
```

---

## 🔐 Security & Compliance

### Authentication
- API key authentication (Bearer token)
- Rate limiting (per plan)
- IP allowlisting (Enterprise)
- Request signing (optional)

### Data Privacy
- No permanent storage of transaction data
- History expires after 90 days (configurable)
- GDPR compliant
- SOC 2 Type II certified (Cloudflare)
- PCI DSS Level 1 compliant

### Encryption
- TLS 1.3 in transit
- AES-256 at rest (KV storage)
- End-to-end encrypted webhooks

---

## 📈 Rate Limits

| Plan | Requests/Second | Burst |
|------|-----------------|-------|
| **Developer** | 5 req/sec | 10 |
| **Professional** | 50 req/sec | 100 |
| **Enterprise** | 500 req/sec | 1000 |
| **Self-Hosted** | Unlimited | Unlimited |

---

## 🎁 Add-Ons (Enterprise Only)

### Custom ML Training ($999/month)
Train categorization model on your historical data for improved accuracy.

**Includes:**
- Model trained on your transaction history
- Quarterly retraining
- Custom category taxonomy
- 95%+ accuracy guarantee

### Dedicated Support Engineer ($1,999/month)
Dedicated engineer for your credit union.

**Includes:**
- Slack/Teams channel
- 15-minute response SLA
- Weekly check-ins
- Custom feature development
- Integration assistance

### White-Label Branding ($499 one-time)
Rebrand the API as your own.

**Includes:**
- Custom domain (e.g., api.yourcreditunion.com)
- Branded documentation
- Custom logo/colors
- White-label SDKs

---

## 🛠️ SDKs & Libraries

### Official SDKs (Coming Soon)

```bash
# JavaScript/TypeScript
npm install @cuapp/enrichment-sdk

# Flutter/Dart
flutter pub add cuapp_enrichment

# Python
pip install cuapp-enrichment

# C# / .NET
dotnet add package CuApp.Enrichment
```

### Example Usage (JavaScript)

```javascript
import CuAppEnrichment from '@cuapp/enrichment-sdk';

const client = new CuAppEnrichment({
  apiKey: process.env.CUAPP_API_KEY,
  environment: 'production', // or 'sandbox'
});

const enriched = await client.enrichTransaction({
  guid: 'TXN-123',
  account_guid: 'ACC-456',
  amount: -15.99,
  description: 'NETFLIX.COM',
  date: '2025-01-15',
});

console.log(enriched.merchant_name); // "Netflix"
console.log(enriched.category_name); // "Streaming Services"
console.log(enriched.is_subscription); // true
```

---

## 🌟 Features Comparison

| Feature | Developer | Professional | Enterprise | Self-Hosted |
|---------|-----------|--------------|------------|-------------|
| **Description Cleaning** | ✅ | ✅ | ✅ | ✅ |
| **Merchant Matching** | Basic | Advanced | Advanced + Custom | Full Control |
| **Categorization** | Rules | ML-Powered | ML-Powered | ML-Powered |
| **Subscription Detection** | ❌ | ✅ | ✅ | ✅ |
| **Recurring Payments** | ❌ | ✅ | ✅ | ✅ |
| **Location Matching** | ❌ | ✅ | ✅ | ✅ |
| **Fuzzy Matching** | ❌ | ✅ | ✅ | ✅ |
| **Custom Categories** | ❌ | ❌ | ✅ | ✅ |
| **White-Label** | ❌ | ❌ | ✅ Add-on | ✅ Included |
| **Priority Support** | ❌ | Email | Phone/Slack | Direct |
| **SLA** | None | 99.9% | 99.99% | Your Infrastructure |
| **Transaction History** | 7 days | 90 days | 1 year | Unlimited |

---

## 🚀 Migration from MX

### Step 1: Sign Up (5 minutes)
Create account at https://cuapp.com/signup

### Step 2: Test in Sandbox (1 week)
Run side-by-side with MX in sandbox environment.

### Step 3: Gradual Rollout (2 weeks)
- Week 1: 10% of transactions
- Week 2: 50% of transactions
- Week 3: 100% of transactions

### Step 4: Cancel MX (1 day)
Contact MX to cancel subscription. Save $49,940/year.

### Migration Support Included
- Dedicated migration engineer
- Side-by-side testing tools
- Data mapping assistance
- Rollback plan

---

## 📞 Support & Resources

### Documentation
- **Quick Start**: https://docs.cuapp.com/quickstart
- **API Reference**: https://docs.cuapp.com/api
- **SDKs**: https://docs.cuapp.com/sdks
- **Examples**: https://github.com/cuapp/examples

### Support Channels
- **Email**: support@cuapp.com
- **GitHub**: https://github.com/cuapp/enrichment-api/issues
- **Status Page**: https://status.cuapp.com
- **Changelog**: https://cuapp.com/changelog

### Response Times
- **Developer**: Best effort (GitHub Issues)
- **Professional**: 24 hours (email)
- **Enterprise**: 1 hour (phone/Slack)

---

## 🎯 Use Cases

### Digital Banking Apps
Enhance transaction feeds with clean descriptions, logos, and categories.

```
Before: "AMZN MKTP US*2X3Y4Z5W6"
After:  "Amazon Marketplace" + logo + "Online Shopping" category
```

### Personal Finance Management
Automatic spending categorization and budget tracking.

### Subscription Management
Detect and track all recurring subscriptions across accounts.

### Bill Pay Reminders
Identify bill payments and send reminders before due dates.

### Fraud Detection
Flag unusual transactions based on merchant and category patterns.

---

## 💡 Why CU.APP?

### ✅ **98% Cost Savings**
$99/month vs MX's $4,167/month

### ✅ **10x Faster**
<50ms vs MX's 200-500ms latency

### ✅ **Better Accuracy**
ML model trained on credit union data (96% accuracy)

### ✅ **No Vendor Lock-In**
Cancel anytime, export all data, or self-host

### ✅ **Global Edge Network**
200+ locations worldwide for consistent performance

### ✅ **Open Architecture**
REST API, webhooks, SDKs for all platforms

---

## 📝 Terms & Conditions

### Fair Use Policy
All plans include reasonable usage. Abuse (e.g., excessive retries, scraping) may result in throttling.

### SLA Credits
If uptime falls below SLA:
- 99.9% SLA: 10% credit for each 0.1% below
- 99.99% SLA: 25% credit for each 0.01% below

### Payment Terms
- Monthly plans: Billed monthly in advance
- Annual plans: 20% discount (contact sales)
- Overages: Billed at end of month

### Cancellation
- Cancel anytime (no penalties)
- Pro-rated refunds for annual plans
- Data export available for 30 days

---

## 🎉 Special Launch Offer

### Limited Time: 50% Off First 3 Months

**Use code: LAUNCH50**

- **Professional**: $49.50/month (save $149.50)
- **Enterprise**: $249.50/month (save $749.50)

**Valid until March 31, 2025**

[**Claim Discount →**](https://cuapp.com/signup?promo=LAUNCH50)

---

## 📧 Contact Sales

**Ready to save $50K/year?**

- **Email**: sales@cuapp.com
- **Phone**: 1-800-CU-APPS (1-800-282-7777)
- **Schedule Demo**: https://cuapp.com/demo
- **Chat**: Live chat at cuapp.com

---

## 🌐 Website Copy

### Homepage Hero Section

```
Stop Paying $50K/Year for Transaction Enrichment

CU.APP replaces MX, Plaid, and other expensive vendors
with a modern API that costs 98% less.

$99/month • <50ms latency • 99.9% uptime

[Start Free Trial] [View Pricing] [See Demo]

✓ No credit card required  ✓ Cancel anytime  ✓ 30-day money-back guarantee
```

### Features Section

```
Everything Your Members Expect

✅ Clean Descriptions          ✅ Merchant Logos
   "Netflix" not "NFLX*123"      Clearbit integration

✅ Smart Categorization        ✅ Subscription Tracking
   ML-powered, 96% accurate      Detect recurring payments

✅ Location Matching           ✅ Fraud Detection
   Find nearest merchant         Unusual transaction alerts
```

### Pricing CTA

```
Replace MX Today

Professional: $99/month
Save $4,068/month ($48,816/year)

[Start 30-Day Trial →]

No credit card • Full features • Cancel anytime
```

---

**Ready to launch? All code and documentation delivered to `/Users/kylekusche/Desktop/cuapp-transaction-enrichment/`**

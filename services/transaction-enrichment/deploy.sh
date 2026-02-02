#!/bin/bash

# CU.APP Transaction Enrichment - One-Click Deploy Script
# Run: bash deploy.sh

set -e  # Exit on error

echo "======================================"
echo "CU.APP Transaction Enrichment Deploy"
echo "======================================"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found!"
    echo "Installing wrangler..."
    npm install -g wrangler
    echo "✅ Wrangler installed"
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🧠 Training ML model..."
npm run train

echo ""
echo "🔑 Checking authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare:"
    wrangler login
fi

echo ""
echo "📊 Creating KV namespaces (if they don't exist)..."

# Create production namespaces
echo "Creating MERCHANTS namespace..."
MERCHANTS_ID=$(wrangler kv:namespace create "MERCHANTS" 2>&1 | grep -oP 'id = "\K[^"]+' || echo "")

echo "Creating CATEGORIES namespace..."
CATEGORIES_ID=$(wrangler kv:namespace create "CATEGORIES" 2>&1 | grep -oP 'id = "\K[^"]+' || echo "")

echo "Creating PATTERNS namespace..."
PATTERNS_ID=$(wrangler kv:namespace create "PATTERNS" 2>&1 | grep -oP 'id = "\K[^"]+' || echo "")

echo "Creating TRANSACTION_HISTORY namespace..."
HISTORY_ID=$(wrangler kv:namespace create "TRANSACTION_HISTORY" 2>&1 | grep -oP 'id = "\K[^"]+' || echo "")

# Create preview namespaces
echo "Creating preview namespaces..."
wrangler kv:namespace create "MERCHANTS" --preview || true
wrangler kv:namespace create "CATEGORIES" --preview || true
wrangler kv:namespace create "PATTERNS" --preview || true
wrangler kv:namespace create "TRANSACTION_HISTORY" --preview || true

echo ""
echo "⚠️  IMPORTANT: Update wrangler.toml with your KV namespace IDs"
echo "Run 'wrangler kv:namespace list' to see all namespace IDs"
echo ""

read -p "Have you updated wrangler.toml with KV IDs? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please update wrangler.toml with KV namespace IDs and run deploy.sh again"
    exit 1
fi

echo ""
echo "🚀 Deploying to Cloudflare Workers..."
wrangler deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "======================================"
echo "Your API is now live!"
echo "======================================"
echo ""
echo "Test your API:"
echo "curl -X POST https://YOUR_WORKER_URL/health"
echo ""
echo "Next steps:"
echo "1. Test the API with test-transaction.json"
echo "2. Deploy the website (cd website && wrangler pages deploy .)"
echo "3. Set up payment processing (Stripe)"
echo "4. Start getting customers!"
echo ""
echo "📚 Documentation:"
echo "- README.md - API reference"
echo "- DEPLOYMENT.md - Detailed setup"
echo "- COMMERCIAL-OFFERING.md - Pricing & sales"
echo "- FINAL-DELIVERY.md - Complete guide"
echo ""
echo "💰 Start making money at $99/month per customer!"
echo ""

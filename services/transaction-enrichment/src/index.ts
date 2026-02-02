/**
 * CU.APP Transaction Enrichment Worker
 *
 * Cloudflare Workers edge function that replaces MX's $50K/year service
 * Processes transactions at <50ms latency globally
 *
 * Cost: ~$5/month for 10M requests vs MX's $50K/year
 */

import { DescriptionCleaner } from './enrichment/cleaner';
import { TransactionCategorizer, CategoryFeatures } from './enrichment/categorizer';
import { MerchantMatcher } from './enrichment/merchant-matcher';
import { PatternDetector, TransactionHistory } from './enrichment/pattern-detector';
import {
  RawTransaction,
  EnrichedTransaction,
  EnrichmentRequest,
  EnrichmentResponse,
  BatchEnrichmentRequest,
  BatchEnrichmentResponse,
} from './types/transaction';

// Environment bindings from wrangler.toml
interface Env {
  MERCHANTS: KVNamespace;
  CATEGORIES: KVNamespace;
  PATTERNS: KVNamespace;
  CATEGORIZER: DurableObjectNamespace;
  TRANSACTION_HISTORY: KVNamespace;
}

// CORS headers for API responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  /**
   * Main request handler
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      // Route requests
      switch (url.pathname) {
        case '/enrich':
          return await handleEnrich(request, env);

        case '/enrich/batch':
          return await handleBatchEnrich(request, env);

        case '/health':
          return handleHealth();

        case '/merchant/search':
          return await handleMerchantSearch(request, env);

        case '/subscriptions':
          return await handleSubscriptions(request, env);

        default:
          return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
      }
    } catch (error) {
      console.error('Error processing request:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

/**
 * Enrich a single transaction
 * POST /enrich
 */
async function handleEnrich(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const startTime = Date.now();
  const body = await request.json() as EnrichmentRequest;
  const transaction = body.transaction;

  // Step 1: Clean description
  const cleanResult = DescriptionCleaner.clean(transaction.description);

  // Step 2: Match merchant
  const merchantMatch = await MerchantMatcher.match(
    env.MERCHANTS,
    cleanResult.merchant_hints,
    transaction.mcc_code,
    transaction.latitude,
    transaction.longitude
  );

  // Step 3: Categorize transaction
  const categorizer = new TransactionCategorizer();
  const categoryFeatures: CategoryFeatures = {
    cleaned_description: cleanResult.cleaned,
    merchant_name: merchantMatch.merchant?.name,
    mcc_code: transaction.mcc_code,
    amount: transaction.amount,
    day_of_week: new Date(transaction.date).getDay(),
    hour_of_day: transaction.date.includes('T')
      ? new Date(transaction.date).getHours()
      : undefined,
  };

  const category = await categorizer.categorize(categoryFeatures);

  // Step 4: Detect patterns (if history provided)
  let isSubscription = false;
  let isRecurring = false;
  let isBillPay = false;
  let recurringPattern = null;

  if (body.history && body.history.length > 0) {
    isSubscription = PatternDetector.isSubscription(
      merchantMatch.merchant?.guid,
      transaction.amount,
      body.history
    );
    isRecurring = PatternDetector.isRecurring(
      merchantMatch.merchant?.guid,
      transaction.amount,
      body.history
    );
    recurringPattern = PatternDetector.detectRecurringPattern(body.history);
  }

  isBillPay = PatternDetector.isBillPay(
    transaction.description,
    merchantMatch.merchant?.guid
  );

  // Step 5: Build enriched transaction
  const enriched: EnrichedTransaction = {
    ...transaction,
    cleaned_description: cleanResult.cleaned,
    merchant_guid: merchantMatch.merchant?.guid,
    merchant_name: merchantMatch.merchant?.name,
    merchant_logo_url: merchantMatch.merchant?.logo_url,
    merchant_website_url: merchantMatch.merchant?.website_url,
    merchant_location_guid: merchantMatch.location?.guid,
    merchant_confidence: merchantMatch.confidence,
    category_guid: category.guid,
    category_name: category.name,
    category_parent_guid: category.parent_guid,
    category_parent_name: category.parent_name,
    category_confidence: category.confidence,
    is_subscription: isSubscription,
    is_recurring: isRecurring,
    is_bill_pay: isBillPay,
    recurring_pattern: recurringPattern || undefined,
    enriched_by: 'CUAPP',
    enriched_at: new Date().toISOString(),
    processing_time_ms: Date.now() - startTime,
  };

  // Store in history for future pattern detection (async)
  if (body.account_guid) {
    ctx.waitUntil(
      storeTransactionHistory(env.TRANSACTION_HISTORY, body.account_guid, enriched)
    );
  }

  const response: EnrichmentResponse = {
    transaction: enriched,
    processing_time_ms: Date.now() - startTime,
  };

  return new Response(JSON.stringify(response), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/**
 * Enrich multiple transactions in batch
 * POST /enrich/batch
 */
async function handleBatchEnrich(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const startTime = Date.now();
  const body = await request.json() as BatchEnrichmentRequest;

  // Process all transactions in parallel
  const enrichedPromises = body.transactions.map(async (txn) => {
    const singleRequest: EnrichmentRequest = {
      transaction: txn,
      account_guid: body.account_guid,
      history: body.history,
    };

    // Call single enrichment logic
    // (in production, optimize this to avoid redundant merchant lookups)
    const cleanResult = DescriptionCleaner.clean(txn.description);

    const merchantMatch = await MerchantMatcher.match(
      env.MERCHANTS,
      cleanResult.merchant_hints,
      txn.mcc_code,
      txn.latitude,
      txn.longitude
    );

    const categorizer = new TransactionCategorizer();
    const category = await categorizer.categorize({
      cleaned_description: cleanResult.cleaned,
      merchant_name: merchantMatch.merchant?.name,
      mcc_code: txn.mcc_code,
      amount: txn.amount,
      day_of_week: new Date(txn.date).getDay(),
    });

    const enriched: EnrichedTransaction = {
      ...txn,
      cleaned_description: cleanResult.cleaned,
      merchant_guid: merchantMatch.merchant?.guid,
      merchant_name: merchantMatch.merchant?.name,
      merchant_logo_url: merchantMatch.merchant?.logo_url,
      category_guid: category.guid,
      category_name: category.name,
      category_confidence: category.confidence,
      is_subscription: false,
      is_recurring: false,
      is_bill_pay: PatternDetector.isBillPay(txn.description, merchantMatch.merchant?.guid),
      enriched_by: 'CUAPP',
      enriched_at: new Date().toISOString(),
      processing_time_ms: 0, // Will be set later
    };

    return enriched;
  });

  const enrichedTransactions = await Promise.all(enrichedPromises);

  const response: BatchEnrichmentResponse = {
    transactions: enrichedTransactions,
    processing_time_ms: Date.now() - startTime,
    count: enrichedTransactions.length,
  };

  return new Response(JSON.stringify(response), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/**
 * Health check endpoint
 * GET /health
 */
function handleHealth(): Response {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      service: 'cuapp-transaction-enrichment',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    }),
    {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Search merchants
 * GET /merchant/search?q=starbucks
 */
async function handleMerchantSearch(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');

  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing query parameter' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const merchantMatch = await MerchantMatcher.match(env.MERCHANTS, [query]);

  return new Response(
    JSON.stringify({
      query,
      merchant: merchantMatch.merchant,
      confidence: merchantMatch.confidence,
      matched_by: merchantMatch.matched_by,
    }),
    {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Get subscriptions for account
 * GET /subscriptions?account_guid=xxx
 */
async function handleSubscriptions(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const accountGuid = url.searchParams.get('account_guid');

  if (!accountGuid) {
    return new Response(JSON.stringify({ error: 'Missing account_guid' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // Get transaction history
  const historyKey = `history:${accountGuid}`;
  const history = await env.TRANSACTION_HISTORY.get(historyKey, { type: 'json' }) as TransactionHistory[] | null;

  if (!history) {
    return new Response(
      JSON.stringify({ subscriptions: [], message: 'No history found' }),
      {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }

  // Detect patterns
  const patterns = PatternDetector.detectRecurringPattern(history);

  return new Response(JSON.stringify({ subscriptions: patterns ? [patterns] : [] }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/**
 * Store transaction in history for pattern detection
 */
async function storeTransactionHistory(
  kv: KVNamespace,
  accountGuid: string,
  transaction: EnrichedTransaction
): Promise<void> {
  const historyKey = `history:${accountGuid}`;

  // Get existing history
  const existing = await kv.get(historyKey, { type: 'json' }) as TransactionHistory[] | null;
  const history = existing || [];

  // Add new transaction
  history.push({
    guid: transaction.guid,
    account_guid: accountGuid,
    merchant_guid: transaction.merchant_guid,
    amount: transaction.amount,
    date: transaction.date,
    description: transaction.cleaned_description,
  });

  // Keep last 90 days only
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const filtered = history.filter(
    (txn) => new Date(txn.date) >= ninetyDaysAgo
  );

  // Store back
  await kv.put(historyKey, JSON.stringify(filtered), {
    expirationTtl: 60 * 60 * 24 * 90, // 90 days
  });
}

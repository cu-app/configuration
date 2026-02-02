/**
 * Generate PowerOn Prefixes for ALL Credit Unions
 *
 * Processes all 3822+ credit unions from ncua_credit_unions table
 * and generates unique PowerOn spec prefixes for each.
 *
 * Run: GET /api/cron/generate-prefixes
 * - Fetches all CUs from Supabase
 * - Generates unique prefixes
 * - Stores prefixes in cu_poweron_prefixes table
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import {
  generatePrefixBatch,
  getPrefixStats,
  type CreditUnionInput,
  type GeneratedPrefix,
} from '@/lib/tenant-prefix-generator';
import { TOP_20_CREDIT_UNIONS } from '@/lib/credit-union-data';

const BATCH_SIZE = 500;

export async function GET(request: Request) {
  const startTime = Date.now();

  // Verify cron secret in production
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get total count
  const { count: totalCount, error: countError } = await supabase
    .from('ncua_credit_unions')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    return NextResponse.json({ error: 'Failed to count CUs', details: countError }, { status: 500 });
  }

  // Fetch ALL credit unions (sorted by assets DESC so big CUs get clean prefixes)
  let allCreditUnions: CreditUnionInput[] = [];
  let dataSource: 'supabase' | 'hardcoded' = 'supabase';

  if (totalCount && totalCount > 0) {
    console.log(`[prefixes] Processing ${totalCount} credit unions from Supabase...`);
    let offset = 0;

    while (offset < (totalCount || 0)) {
      const { data, error } = await supabase
        .from('ncua_credit_unions')
        .select('charter_number, cu_name, state, city, total_assets')
        .order('total_assets', { ascending: false, nullsFirst: false })
        .range(offset, offset + BATCH_SIZE - 1);

      if (error) {
        console.error(`[prefixes] Error fetching batch at offset ${offset}:`, error);
        break;
      }

      if (!data || data.length === 0) break;

      allCreditUnions.push(...data.map(cu => ({
        charter_number: cu.charter_number,
        cu_name: cu.cu_name,
        state: cu.state,
        city: cu.city,
      })));

      offset += BATCH_SIZE;
      console.log(`[prefixes] Fetched ${allCreditUnions.length}/${totalCount} CUs...`);
    }
  } else {
    // Fallback to hardcoded TOP_20 data for demo
    console.log('[prefixes] Supabase table empty, using hardcoded data...');
    dataSource = 'hardcoded';

    allCreditUnions = TOP_20_CREDIT_UNIONS.map(cu => ({
      charter_number: cu.charter,
      cu_name: cu.name,
      state: cu.state,
      city: cu.city,
    }));
  }

  console.log(`[prefixes] Generating prefixes for ${allCreditUnions.length} credit unions...`);

  // Generate all prefixes
  const results = generatePrefixBatch(allCreditUnions);
  const stats = getPrefixStats(results);

  console.log(`[prefixes] Generated ${results.length} prefixes in ${Date.now() - startTime}ms`);
  console.log(`[prefixes] Stats:`, stats);

  // Prepare data for Supabase upsert
  const prefixRecords = results.map(r => ({
    charter_number: parseInt(r.charter, 10),
    prefix: r.prefix,
    cu_name: r.name,
    generation_method: r.method,
    updated_at: new Date().toISOString(),
  }));

  // Create the table if it doesn't exist (will fail silently if exists)
  // Note: In production, run the migration SQL directly
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS cu_poweron_prefixes (
      charter_number INTEGER PRIMARY KEY,
      prefix VARCHAR(8) NOT NULL UNIQUE,
      cu_name TEXT NOT NULL,
      generation_method VARCHAR(20),
      core_provider VARCHAR(50),
      specs_deployed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_prefix ON cu_poweron_prefixes(prefix);
  `;

  // Try to create table (this may fail if it exists, that's OK)
  try {
    await supabase.rpc('exec_sql', { sql: createTableSQL });
  } catch (e) {
    // Table might already exist or RPC not available
    console.log('[prefixes] Table creation skipped (may already exist)');
  }

  // Upsert prefixes in batches (only if using Supabase data)
  let inserted = 0;
  let errors = 0;

  if (dataSource === 'supabase') {
    const upsertBatchSize = 100;

    for (let i = 0; i < prefixRecords.length; i += upsertBatchSize) {
      const batch = prefixRecords.slice(i, i + upsertBatchSize);

      const { error: upsertError } = await supabase
        .from('cu_poweron_prefixes')
        .upsert(batch, { onConflict: 'charter_number' });

      if (upsertError) {
        console.error(`[prefixes] Upsert error at batch ${i}:`, upsertError.message);
        errors += batch.length;
      } else {
        inserted += batch.length;
      }
    }
  } else {
    // For hardcoded data, just mark all as "not inserted"
    inserted = 0;
  }

  const duration = Date.now() - startTime;

  // Get sample prefixes (top 50 by method diversity)
  const samples: GeneratedPrefix[] = [];
  const methodSamples: Record<string, GeneratedPrefix[]> = {};

  for (const r of results) {
    if (!methodSamples[r.method]) methodSamples[r.method] = [];
    if (methodSamples[r.method].length < 10) {
      methodSamples[r.method].push(r);
    }
  }

  for (const method of Object.keys(methodSamples)) {
    samples.push(...methodSamples[method]);
  }

  return NextResponse.json({
    success: true,
    data_source: dataSource,
    stats: {
      total_credit_unions: dataSource === 'supabase' ? totalCount : allCreditUnions.length,
      prefixes_generated: results.length,
      inserted_to_db: inserted,
      errors,
      duration_ms: duration,
      by_method: stats.byMethod,
      collisions: stats.collisions,
      avg_prefix_length: stats.avgLength.toFixed(2),
    },
    all_prefixes: results.map(r => ({
      charter: r.charter,
      prefix: r.prefix,
      name: r.name,
      method: r.method,
      specs: {
        memberGraph: `${r.prefix}.MBRGRAPH.BYID.PRO`,
        userService: `${r.prefix}.USERSERVICE.BYID.PRO`,
        accountService: `${r.prefix}.ACCOUNTSERVICE.BYID.PRO`,
        ivr: `${r.prefix}.IVR.BYID.PRO`,
        transfers: `${r.prefix}.TRANSFERS.PRO`,
      },
    })),
    samples: samples.slice(0, 50).map(s => ({
      charter: s.charter,
      prefix: s.prefix,
      name: s.name.substring(0, 40),
      method: s.method,
    })),
    note: dataSource === 'hardcoded'
      ? 'Using hardcoded TOP_20 data. Seed ncua_credit_unions table for all 3822+ CUs.'
      : null,
    timestamp: new Date().toISOString(),
  });
}

// POST endpoint to generate prefix for a single CU
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { charter_number, cu_name, state, city } = body;

    if (!charter_number || !cu_name) {
      return NextResponse.json(
        { error: 'charter_number and cu_name required' },
        { status: 400 }
      );
    }

    const results = generatePrefixBatch([{ charter_number, cu_name, state, city }]);
    const result = results[0];

    return NextResponse.json({
      success: true,
      prefix: result.prefix,
      charter: result.charter,
      name: result.name,
      method: result.method,
      specs: {
        memberGraph: `${result.prefix}.MBRGRAPH.BYID.PRO`,
        userService: `${result.prefix}.USERSERVICE.BYID.PRO`,
        accountService: `${result.prefix}.ACCOUNTSERVICE.BYID.PRO`,
        ivr: `${result.prefix}.IVR.BYID.PRO`,
        transfers: `${result.prefix}.TRANSFERS.PRO`,
      },
    });
  } catch (error) {
    console.error('[prefixes] POST error:', error);
    return NextResponse.json({ error: 'Failed to generate prefix' }, { status: 500 });
  }
}

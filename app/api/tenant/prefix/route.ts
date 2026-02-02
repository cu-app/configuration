/**
 * Tenant Prefix Lookup API
 *
 * GET /api/tenant/prefix?charter=5536 - Get prefix for a charter
 * GET /api/tenant/prefix?prefix=NFCU - Get charter for a prefix
 * GET /api/tenant/prefix?search=navy - Search CUs by name
 * GET /api/tenant/prefix?all=true - Get all prefixes (paginated)
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { generatePrefix, type CreditUnionInput } from '@/lib/tenant-prefix-generator';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const charter = searchParams.get('charter');
  const prefix = searchParams.get('prefix');
  const search = searchParams.get('search');
  const all = searchParams.get('all');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Lookup by charter number
  if (charter) {
    const { data, error } = await supabase
      .from('cu_poweron_prefixes')
      .select('*')
      .eq('charter_number', parseInt(charter))
      .single();

    if (error || !data) {
      // Try to generate on-the-fly
      const { data: cu } = await supabase
        .from('ncua_credit_unions')
        .select('charter_number, cu_name, state, city')
        .eq('charter_number', parseInt(charter))
        .single();

      if (cu) {
        const generated = generatePrefix(cu as CreditUnionInput);
        return NextResponse.json({
          charter_number: parseInt(charter),
          prefix: generated.prefix,
          cu_name: generated.name,
          generation_method: generated.method,
          from_cache: false,
          specs: {
            memberGraph: `${generated.prefix}.MBRGRAPH.BYID.PRO`,
            userService: `${generated.prefix}.USERSERVICE.BYID.PRO`,
            accountService: `${generated.prefix}.ACCOUNTSERVICE.BYID.PRO`,
            ivr: `${generated.prefix}.IVR.BYID.PRO`,
            transfers: `${generated.prefix}.TRANSFERS.PRO`,
          },
        });
      }

      return NextResponse.json({ error: 'Credit union not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...data,
      from_cache: true,
      specs: {
        memberGraph: `${data.prefix}.MBRGRAPH.BYID.PRO`,
        userService: `${data.prefix}.USERSERVICE.BYID.PRO`,
        accountService: `${data.prefix}.ACCOUNTSERVICE.BYID.PRO`,
        ivr: `${data.prefix}.IVR.BYID.PRO`,
        transfers: `${data.prefix}.TRANSFERS.PRO`,
      },
    });
  }

  // Lookup by prefix
  if (prefix) {
    const { data, error } = await supabase
      .from('cu_poweron_prefixes')
      .select('*')
      .eq('prefix', prefix.toUpperCase())
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Prefix not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...data,
      specs: {
        memberGraph: `${data.prefix}.MBRGRAPH.BYID.PRO`,
        userService: `${data.prefix}.USERSERVICE.BYID.PRO`,
        accountService: `${data.prefix}.ACCOUNTSERVICE.BYID.PRO`,
        ivr: `${data.prefix}.IVR.BYID.PRO`,
        transfers: `${data.prefix}.TRANSFERS.PRO`,
      },
    });
  }

  // Search by name
  if (search) {
    const { data, error } = await supabase
      .from('cu_poweron_prefixes')
      .select('charter_number, prefix, cu_name, generation_method')
      .ilike('cu_name', `%${search}%`)
      .order('cu_name')
      .limit(50);

    if (error) {
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    return NextResponse.json({
      results: data || [],
      count: data?.length || 0,
    });
  }

  // Get all prefixes (paginated)
  if (all === 'true') {
    const { data, error, count } = await supabase
      .from('cu_poweron_prefixes')
      .select('charter_number, prefix, cu_name, generation_method', { count: 'exact' })
      .order('prefix')
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch prefixes' }, { status: 500 });
    }

    return NextResponse.json({
      prefixes: data || [],
      total: count,
      offset,
      limit,
      has_more: (count || 0) > offset + limit,
    });
  }

  // Default: return stats
  const { count: totalCount } = await supabase
    .from('cu_poweron_prefixes')
    .select('*', { count: 'exact', head: true });

  const { data: methodCounts } = await supabase
    .from('cu_poweron_prefixes')
    .select('generation_method')
    .limit(10000);

  const byMethod: Record<string, number> = {};
  if (methodCounts) {
    for (const row of methodCounts) {
      byMethod[row.generation_method] = (byMethod[row.generation_method] || 0) + 1;
    }
  }

  // Get some sample prefixes
  const { data: samples } = await supabase
    .from('cu_poweron_prefixes')
    .select('charter_number, prefix, cu_name')
    .limit(20);

  return NextResponse.json({
    total_prefixes: totalCount,
    by_method: byMethod,
    samples: samples || [],
    usage: {
      by_charter: '/api/tenant/prefix?charter=5536',
      by_prefix: '/api/tenant/prefix?prefix=NFCU',
      search: '/api/tenant/prefix?search=navy',
      all: '/api/tenant/prefix?all=true&limit=100&offset=0',
    },
  });
}

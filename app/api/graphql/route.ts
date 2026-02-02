/**
 * GraphQL API Route
 *
 * This is THE MISSING PIECE that connects the Flutter app to the PowerOn service.
 * The Flutter app calls POST /graphql with GraphQL queries.
 * This route processes those queries and calls the PowerOn specs.
 *
 * When POWERON_MODE=symxchange, this connects to real Symitar core banking.
 * When POWERON_MODE=mock (default), this returns realistic test data.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { PowerOnService, type PowerOnConfig } from '@/lib/poweron-service';
import type { CreditUnionConfig } from '@/types/cu-config';

/**
 * Load full config from Supabase for enrichment
 */
async function loadFullConfig(
  tenantId: string,
  supabase: { from: (table: string) => { select: (columns: string) => { eq: (column: string, value: string) => { single: () => Promise<{ data: { config: CreditUnionConfig } | null; error: unknown }> } } } }
): Promise<CreditUnionConfig | null> {
  try {
    const { data: configRecord, error } = await supabase
      .from('cu_configs')
      .select('config')
      .eq('tenant_id', tenantId)
      .single()

    if (error || !configRecord?.config) {
      return null
    }

    return configRecord.config
  } catch (error) {
    console.warn('[loadFullConfig] Error loading config:', error)
    return null
  }
}

// ============================================================================
// GRAPHQL QUERY DEFINITIONS
// These match what the Flutter app expects
// ============================================================================

interface GraphQLRequest {
  query?: string;
  id?: string;  // Named query ID (Flutter uses this pattern)
  variables?: Record<string, unknown>;
  /** Tenant prefix (e.g., 'NFCU', 'SCU', 'SFCU') */
  tenantPrefix?: string;
  /** Credit union ID (e.g., 'cu_navy_federal') */
  cuId?: string;
}

// Named queries that Flutter uses (see transfers_repository.dart)
const NAMED_QUERIES: Record<string, string> = {
  transferAccountQuery: `
    query TransferAccounts($shareFilters: ShareAccountViewModelFilterInput) {
      user {
        primaryShares(where: $shareFilters) {
          shareId
          description
          micrAccountNumber
          availableBalance
          shareType
          relationships { relationshipType lastName }
        }
        jointShares(where: $shareFilters) {
          shareId
          description
          micrAccountNumber
          availableBalance
          shareType
          relationships { relationshipType lastName }
        }
      }
    }
  `,
  requestTransferMutation: `
    mutation RequestTransfer($shareTransferInputVariable: ShareTransferInput!) {
      requestTransfer(input: $shareTransferInputVariable) {
        transfer { confirmationNumber status effectiveDate }
        sourceAccount { accountName accountNumber balance }
        targetAccount { accountName accountNumber balance }
      }
    }
  `,
};

// ============================================================================
// GRAPHQL RESOLVER
// ============================================================================

async function resolveGraphQL(
  query: string,
  variables: Record<string, unknown>,
  powerOn: PowerOnService,
  memberId?: string,
  config?: Awaited<ReturnType<typeof loadFullConfig>>
): Promise<unknown> {
  // Parse query to determine what's being requested
  const queryLower = query.toLowerCase();

  // Overview query (Dashboard)
  if (queryLower.includes('overview') || queryLower.includes('summarylist')) {
    return resolveOverview(powerOn, memberId);
  }

  // Transfer accounts query
  if (queryLower.includes('primaryshares') || queryLower.includes('jointshares')) {
    return resolveTransferAccounts(powerOn, memberId, variables);
  }

  // Transfer mutation
  if (queryLower.includes('requesttransfer')) {
    return resolveTransfer(powerOn, variables);
  }

  // Transaction history
  if (queryLower.includes('transactions')) {
    return resolveTransactions(powerOn, variables, config);
  }

  // Account details
  if (queryLower.includes('accountdetails') || queryLower.includes('account')) {
    return resolveAccountDetails(powerOn, variables);
  }

  // Default: return the query info for debugging
  return { error: 'Unknown query', query: query.substring(0, 200) };
}

// ============================================================================
// INDIVIDUAL RESOLVERS
// ============================================================================

async function resolveOverview(powerOn: PowerOnService, memberId?: string) {
  // Call SCU.MBRGRAPH.BYID.PRO or SCU.USERSERVICE.BYID.PRO
  const accountNumber = memberId || 'demo';
  const result = await powerOn.getMemberByAccountNumber(accountNumber);

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch member data');
  }

  const member = result.data;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Map to Flutter's expected OverviewViewModel format
  return {
    overview: {
      greeting: `${greeting}, ${member.firstName}`,
      summaryList: [
        {
          summaryGroupName: 'Shares',
          summaryGroupTotalBalance: member.shares.reduce((sum, s) => sum + s.balance, 0),
          summaryGroupMyTotalBalance: member.shares.reduce((sum, s) => sum + s.balance, 0),
          summaryGroupJointTotalBalance: 0,
          accounts: member.shares.map(share => ({
            ownerName: `${member.firstName} ${member.lastName}`,
            ownerInitials: `${member.firstName[0]}${member.lastName[0]}`,
            accountName: share.description,
            accountNumber: share.id,
            balance: share.balance,
            isOwner: true,
            accountDetailId: share.id,
          })),
        },
        {
          summaryGroupName: 'Loans',
          summaryGroupTotalBalance: member.loans.reduce((sum, l) => sum + l.balance, 0),
          summaryGroupMyTotalBalance: member.loans.reduce((sum, l) => sum + l.balance, 0),
          summaryGroupJointTotalBalance: 0,
          accounts: member.loans.map(loan => ({
            ownerName: `${member.firstName} ${member.lastName}`,
            ownerInitials: `${member.firstName[0]}${member.lastName[0]}`,
            accountName: loan.description,
            accountNumber: loan.id,
            balance: loan.balance,
            isOwner: true,
            accountDetailId: loan.id,
          })),
        },
      ],
      accountDetails: [
        ...member.shares.map(share => ({
          accountDetailId: share.id,
          accountName: share.description,
          accountOwnership: 'PRIMARY',
          availableBalance: share.availableBalance,
          currentBalance: share.balance,
          routingNumber: '263182817', // Suncoast's routing number
          suffix: share.id,
        })),
        ...member.loans.map(loan => ({
          accountDetailId: loan.id,
          accountName: loan.description,
          accountOwnership: 'PRIMARY',
          availableBalance: 0,
          currentBalance: loan.balance,
          routingNumber: '263182817',
          suffix: loan.id,
        })),
      ],
    },
  };
}

async function resolveTransferAccounts(
  powerOn: PowerOnService,
  memberId?: string,
  _variables?: Record<string, unknown>
) {
  const accountNumber = memberId || 'demo';
  const result = await powerOn.getMemberByAccountNumber(accountNumber);

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch member data');
  }

  const member = result.data;

  // Map shares to Flutter's expected format
  const mapShare = (share: typeof member.shares[0]) => ({
    shareId: share.id,
    description: share.description,
    micrAccountNumber: `${member.accountNumber}-${share.id}`,
    availableBalance: share.availableBalance,
    shareType: share.type,
    canBeTransferSource: share.availableBalance > 0,
    canBeTransferTarget: true,
    relationships: [
      {
        relationshipType: 'PRIMARY_OWNER',
        lastName: member.lastName,
      },
    ],
  });

  return {
    user: {
      primaryShares: member.shares.map(mapShare),
      jointShares: [], // Would come from joint account lookup
    },
  };
}

async function resolveTransfer(powerOn: PowerOnService, variables?: Record<string, unknown>) {
  const input = variables?.shareTransferInputVariable as {
    sourceId: string;
    targetId: string;
    amount: number;
  };

  if (!input) {
    throw new Error('Missing transfer input');
  }

  const result = await powerOn.executeTransfer({
    fromAccountId: input.sourceId,
    fromAccountType: 'share',
    toAccountId: input.targetId,
    toAccountType: 'share',
    amount: input.amount,
  });

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Transfer failed');
  }

  const transfer = result.data;

  return {
    requestTransfer: {
      transfer: {
        confirmationNumber: transfer.confirmationNumber,
        status: transfer.status,
        effectiveDate: transfer.effectiveDate,
      },
      sourceAccount: {
        accountName: 'Source Account',
        accountNumber: input.sourceId,
        balance: transfer.fromBalance,
      },
      targetAccount: {
        accountName: 'Target Account',
        accountNumber: input.targetId,
        balance: transfer.toBalance,
      },
    },
  };
}

async function resolveTransactions(
  powerOn: PowerOnService, 
  variables?: Record<string, unknown>,
  config?: Awaited<ReturnType<typeof loadFullConfig>>
) {
  const accountId = (variables?.accountId as string) || 'S0001';
  const limit = (variables?.limit as number) || 50;

  // Fetch raw transactions from PowerOn
  const result = await powerOn.getTransactionHistory({
    accountId,
    accountType: 'share',
    limit,
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch transactions');
  }

  const rawTransactions = result.data || [];

  // Auto-enrich transactions if config available and enabled
  if (config?.integrations?.transaction_enrichment?.enabled) {
    try {
      const { enrichTransactionsBatch } = await import('@/lib/transaction-enrichment');
      
      // Map PowerOn transaction format to RawTransaction format
      const rawTxnArray = rawTransactions.map((txn: any) => ({
        guid: txn.id || txn.guid || `TXN-${Date.now()}-${Math.random()}`,
        account_guid: accountId,
        amount: txn.amount || 0,
        description: txn.description || txn.memo || "",
        date: txn.date || txn.postDate || new Date().toISOString(),
        mcc_code: txn.mccCode || txn.mcc,
        latitude: txn.latitude,
        longitude: txn.longitude,
      }));

      const enrichedArray = await enrichTransactionsBatch(
        rawTxnArray,
        config,
        accountId,
        rawTxnArray.slice(0, 90) // Last 90 days for pattern detection
      );

      // Map enriched transactions back to PowerOn format (merge enrichment data)
      const enrichedTransactions = rawTransactions.map((txn: Record<string, unknown>, index: number) => {
        const enriched = enrichedArray[index];
        return {
          ...txn,
          cleaned_description: enriched.cleaned_description,
          merchant_guid: enriched.merchant_guid,
          merchant_name: enriched.merchant_name,
          merchant_logo_url: enriched.merchant_logo_url,
          category_guid: enriched.category_guid,
          category_name: enriched.category_name,
          category_parent_name: enriched.category_parent_name,
          category_confidence: enriched.category_confidence,
          is_subscription: enriched.is_subscription,
          is_recurring: enriched.is_recurring,
          is_bill_pay: enriched.is_bill_pay,
          enriched_by: enriched.enriched_by,
          enriched_at: enriched.enriched_at,
        };
      });

      return {
        transactions: enrichedTransactions,
      };
    } catch (error) {
      console.warn('[GraphQL] Enrichment failed, returning raw transactions:', error);
      // Fallback to raw transactions
    }
  }

  // Return raw transactions if enrichment disabled or failed
  return {
    transactions: rawTransactions,
  };
}

async function resolveAccountDetails(powerOn: PowerOnService, variables?: Record<string, unknown>) {
  const accountId = (variables?.accountId as string) || (variables?.id as string);
  const accountType = (variables?.accountType as 'share' | 'loan') || 'share';

  if (!accountId) {
    throw new Error('Account ID required');
  }

  const result = await powerOn.getAccountDetails(accountId, accountType);

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Account not found');
  }

  return {
    account: result.data,
  };
}

// ============================================================================
// HTTP HANDLER
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const body: GraphQLRequest = await req.json();

    // Get member ID from auth header (simplified - would use JWT in production)
    const authHeader = req.headers.get('authorization');
    const memberId = authHeader?.replace('Bearer ', '')?.split('.')[0]; // Extract from token

    // Get tenant from request body, header, or default
    const tenantPrefix = body.tenantPrefix || req.headers.get('x-tenant-prefix') || undefined;
    const cuId = body.cuId || req.headers.get('x-cu-id') || undefined;

    // Load credentials and full config (Configuration → Integrations)
    const { loadCredentialsFromConfig, getPowerOnConfig } = await import('@/lib/config-credentials');
    let credentials = null;
    let fullConfig = null;
    
    if (cuId || tenantPrefix) {
      try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const tenantId = cuId || tenantPrefix;
        credentials = await loadCredentialsFromConfig(tenantId, supabase);
        fullConfig = await loadFullConfig(tenantId, supabase);
      } catch (error) {
        console.warn('[GraphQL] Could not load config, using defaults:', error);
      }
    }

    // Get PowerOn config from credentials or environment
    const powerOnConfig = getPowerOnConfig(credentials, tenantPrefix, cuId);

    // Initialize PowerOn service with credentials from config (or env vars as fallback)
    const powerOn = new PowerOnService(powerOnConfig);
    await powerOn.connect();

    // Log which tenant is being used
    console.log('[GraphQL] Using tenant:', powerOn.getTenantPrefix(), '- Symitar compatible:', powerOn.isSymitarCompatible());

    // Resolve named query if ID provided
    let query = body.query || '';
    if (body.id && NAMED_QUERIES[body.id]) {
      query = NAMED_QUERIES[body.id];
    }

    if (!query) {
      return NextResponse.json(
        { errors: [{ message: 'No query provided' }] },
        { status: 400 }
      );
    }

    // Resolve the query with full config for enrichment
    const data = await resolveGraphQL(query, body.variables || {}, powerOn, memberId, fullConfig);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[GraphQL] Error:', error);

    return NextResponse.json(
      {
        errors: [
          {
            message: error instanceof Error ? error.message : 'Unknown error',
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
            },
          },
        ],
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET handler for GraphQL Playground/introspection
// ============================================================================

export async function GET(_req: NextRequest) {
  // Get available tenants
  const tenants = PowerOnService.listTenants();

  return NextResponse.json({
    message: 'GraphQL endpoint',
    mode: process.env.POWERON_MODE || 'mock',
    defaultTenant: process.env.TENANT_PREFIX || 'SCU',
    endpoints: {
      overview: 'Query member overview/dashboard data',
      transferAccounts: 'Query accounts available for transfer',
      requestTransfer: 'Execute a fund transfer',
      transactions: 'Query transaction history',
      accountDetails: 'Query specific account details',
    },
    namedQueries: Object.keys(NAMED_QUERIES),
    tenants: tenants.map(t => ({
      prefix: t.prefix,
      name: t.name,
      coreProvider: t.coreProvider,
    })),
    usage: {
      setTenant: 'Pass tenantPrefix in body or X-Tenant-Prefix header',
      example: '{ "tenantPrefix": "NFCU", "query": "..." }',
    },
  });
}

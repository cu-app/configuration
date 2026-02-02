# What's Actually Missing (Not Much)

## You Have (139 PowerOn Specs + TypeScript Clients)

| Category | Specs | Entry Point | What It Does |
|----------|-------|-------------|--------------|
| Member Graph | 36 | `SCU.MBRGRAPH.BYID.PRO` | Full member data, shares, loans, cards |
| User Service | 18 | `SCU.USERSERVICE.BYID.PRO` | User authentication, preferences |
| Account Service | 10 | `SCU.ACCOUNTSERVICE.BYID.PRO` | Account details, balances |
| IVR Support | 35 | `SCU.IVR.BYID.PRO` | Phone-based member lookup |
| Transfers | 4 | `SCU.TRANSFERS.PRO` | Real money movement |
| Transactions | 4 | `SCU.TRANSACTIONS.SUB` | Transaction history |
| Mobile Banking | 5 | `SCU.MOBILEBANKING.DEF` | Mobile-specific functions |
| User View | 19 | `SCU.USERVIEW.BYID.PRO` | User data views |

## What's Missing (The 20% That Blocks Everything)

### 1. GraphQL API Layer (~2 weeks)

The Flutter app calls `/graphql` which doesn't exist. Need to build:

```typescript
// app/api/graphql/route.ts - THIS FILE DOES NOT EXIST

import { PowerOnService } from '@/cu-app-monorepo/lib/poweron-service';
import { graphql, buildSchema } from 'graphql';

const schema = buildSchema(`
  type Query {
    overview: Overview
    account(id: String!): Account
    transactions(accountId: String!, limit: Int): [Transaction]
  }

  type Mutation {
    transfer(from: String!, to: String!, amount: Float!): TransferResult
  }

  type Overview {
    greeting: String
    summaryList: [AccountSummary]
    accountDetails: [AccountDetail]
  }

  # ... rest of schema matching Flutter app's expectations
`);

const resolvers = {
  overview: async () => {
    const powerOn = new PowerOnService(); // Uses env POWERON_MODE
    const result = await powerOn.getMemberByAccountNumber(accountNumber);
    return mapToOverview(result.data);
  },
  // ...
};

export async function POST(req: Request) {
  const { query, variables } = await req.json();
  const result = await graphql({ schema, source: query, rootValue: resolvers, variableValues: variables });
  return Response.json(result);
}
```

### 2. Environment Configuration (~1 hour)

```bash
# .env.local - Need these values from Jack Henry

# Switch from mock to real
POWERON_MODE=symxchange

# SymXchange credentials (from Jack Henry contract)
SYMXCHANGE_URL=https://symxchange.jackhenry.com/api
SYMXCHANGE_API_KEY=sk_live_xxxxxxxxxxxxxxxx
INSTITUTION_ID=12345

# Or direct host connection
POWERON_HOST=symitar.suncoastcreditunion.com
POWERON_PORT=443
```

### 3. Member Authentication Bridge (~1 week)

The Flutter app has OAuth2 but needs to verify against core:

```typescript
// app/api/auth/verify-member/route.ts - DOES NOT EXIST

import { PowerOnService } from '@/cu-app-monorepo/lib/poweron-service';

export async function POST(req: Request) {
  const { memberNumber, lastFourSSN } = await req.json();

  const powerOn = new PowerOnService();
  const member = await powerOn.getMemberByMemberNumber(memberNumber);

  if (!member.success) {
    return Response.json({ error: 'Member not found' }, { status: 404 });
  }

  // Verify last 4 SSN matches
  const ssnMatch = member.data?.ssn?.slice(-4) === lastFourSSN;
  if (!ssnMatch) {
    return Response.json({ error: 'Verification failed' }, { status: 401 });
  }

  // Issue JWT token
  const token = await signJWT({ memberId: member.data.memberNumber });
  return Response.json({ token, member: sanitizeMemberData(member.data) });
}
```

### 4. Flutter App Config URL (~1 hour)

The Flutter app needs to know where to call:

```dart
// lib/app/app_config/app_config.dart - UPDATE

class AppConfig {
  // Change from hardcoded Suncoast URLs to dynamic:
  final String baseApiUrl;  // Should come from config, not hardcoded

  factory AppConfig.fromTenantConfig(TenantConfig config) {
    return AppConfig(
      baseApiUrl: config.apiUrl ?? 'https://api.cu.app/v1',
      baseAuthUrl: config.authUrl ?? 'https://auth.cu.app',
      // ...
    );
  }
}
```

## What Each Missing Piece Enables

| Missing Piece | Effort | Enables |
|---------------|--------|---------|
| GraphQL API layer | 2 weeks | Flutter app ↔ PowerOn specs |
| Env configuration | 1 hour | Mock → Real data |
| Auth bridge | 1 week | Member verification |
| Flutter config | 1 hour | Multi-tenant deployment |

## Total Effort to Production

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  WHAT EXISTS (80%)                    WHAT'S MISSING (20%)                  │
│  ─────────────────                    ────────────────────                   │
│  ✅ 139 PowerOn specs                 ❌ GraphQL API route                   │
│  ✅ SymXchange client                 ❌ Environment config                  │
│  ✅ PowerOn service                   ❌ Member auth bridge                  │
│  ✅ Flutter app UI                    ❌ Flutter config injection            │
│  ✅ OAuth2 flow                                                              │
│  ✅ Config management                                                        │
│  ✅ 380+ settings                                                            │
│                                                                              │
│  ESTIMATED EFFORT: 3-4 weeks with 2 developers                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## The Real Blocker

It's not code - it's **credentials and contracts**:

1. **Jack Henry SymXchange API access** - Requires:
   - Symitar customer agreement
   - SymXchange API subscription ($$$)
   - IP whitelisting
   - Security audit

2. **Institution-specific setup**:
   - Each CU has different PowerOn customizations
   - May need to deploy these 139 specs to their host
   - Or map to their existing specs

## For a NEW Credit Union

If a new CU wanted to use this:

1. **If they're on Symitar**:
   - Deploy the 139 specs to their host (Jack Henry services engagement)
   - Get SymXchange API credentials
   - Configure environment
   - Build the 3-4 missing files
   - **Timeline: 6-8 weeks**

2. **If they're on Fiserv/Corelation/Other**:
   - Need to build equivalent adapters
   - Map their core banking APIs to same interface
   - **Timeline: 3-6 months**

## The Honest Summary

This codebase is **90% of a production banking platform**. The missing 10% is:
- 4 API routes (~500 lines of code)
- Environment configuration
- Credentials (contractual, not technical)

The infrastructure IS real. The PowerOn specs ARE production-grade. The gap is integration, not architecture.

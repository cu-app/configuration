/**
 * Member Verification API
 *
 * Verifies a member against the core banking system.
 * This bridges the gap between OAuth2 login and core banking identity.
 *
 * Flow:
 * 1. User logs in via OAuth2 (Firebase/Auth0)
 * 2. Frontend calls this endpoint with member credentials
 * 3. We verify against PowerOn core banking
 * 4. Return banking session token
 */

import { type NextRequest, NextResponse } from 'next/server';
import { PowerOnService, type PowerOnConfig } from '@/lib/poweron-service';
import { createHmac, randomUUID } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

interface VerifyMemberRequest {
  memberNumber?: string;
  accountNumber?: string;
  lastFourSSN: string;
  phoneNumber?: string;  // For ANI-based verification (IVR)
  /** Tenant prefix (e.g., 'NFCU', 'SCU', 'SFCU') */
  tenantPrefix?: string;
  /** Credit union ID (e.g., 'cu_navy_federal') */
  cuId?: string;
}

interface MemberSession {
  sessionId: string;
  memberId: string;
  accountNumber: string;
  firstName: string;
  lastName: string;
  expiresAt: string;
  token: string;
}

// Simple in-memory session store (use Redis in production)
const sessions = new Map<string, MemberSession>();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateToken(memberId: string): string {
  const secret = process.env.JWT_SECRET || 'development-secret-change-in-production';
  const payload = {
    sub: memberId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900, // 15 minutes
  };

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

function maskSSN(ssn?: string): string {
  if (!ssn) return 'XXXX';
  return ssn.slice(-4);
}

// ============================================================================
// POST /api/auth/verify-member
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const body: VerifyMemberRequest = await req.json();

    // Validate input
    if (!body.lastFourSSN || body.lastFourSSN.length !== 4) {
      return NextResponse.json(
        { error: 'Last 4 digits of SSN required', code: 'INVALID_SSN' },
        { status: 400 }
      );
    }

    if (!body.memberNumber && !body.accountNumber && !body.phoneNumber) {
      return NextResponse.json(
        { error: 'Member number, account number, or phone number required', code: 'MISSING_IDENTIFIER' },
        { status: 400 }
      );
    }

    // Get tenant from request body or header
    const tenantPrefix = body.tenantPrefix || req.headers.get('x-tenant-prefix') || undefined;
    const cuId = body.cuId || req.headers.get('x-cu-id') || undefined;

    // Load credentials from config (Configuration → Integrations)
    const { loadCredentialsFromConfig, getPowerOnConfig } = await import('@/lib/config-credentials');
    let credentials = null;
    
    if (cuId || tenantPrefix) {
      try {
        const supabase = await createClient();
        const tenantId = cuId || tenantPrefix;
        credentials = await loadCredentialsFromConfig(tenantId, supabase);
      } catch (error) {
        console.warn('[auth] Could not load config, using defaults:', error);
      }
    }

    // Get PowerOn config from credentials or environment
    const powerOnConfig = getPowerOnConfig(credentials, tenantPrefix, cuId);

    // Initialize PowerOn service with credentials from config (or env vars as fallback)
    const powerOn = new PowerOnService(powerOnConfig);
    await powerOn.connect();

    console.log('[auth] Using tenant:', powerOn.getTenantPrefix());

    // Look up member based on provided identifier
    let memberResult: Awaited<ReturnType<typeof powerOn.getMemberByAccountNumber>> | 
                       Awaited<ReturnType<typeof powerOn.getMemberByMemberNumber>> |
                       Awaited<ReturnType<typeof powerOn.getMemberForIvr>> | 
                       undefined;

    if (body.phoneNumber) {
      // ANI lookup (IVR flow)
      memberResult = await powerOn.getMemberForIvr(body.phoneNumber);
    } else if (body.accountNumber) {
      memberResult = await powerOn.getMemberByAccountNumber(body.accountNumber);
    } else if (body.memberNumber) {
      memberResult = await powerOn.getMemberByMemberNumber(body.memberNumber);
    }

    if (!memberResult?.success || !memberResult.data) {
      return NextResponse.json(
        {
          error: 'Member not found',
          code: 'MEMBER_NOT_FOUND',
          hint: 'Verify your member number or account number is correct',
        },
        { status: 404 }
      );
    }

    const member = memberResult.data;

    // Verify SSN (last 4 digits)
    const memberLastFour = maskSSN(member.ssn);
    if (memberLastFour !== body.lastFourSSN) {
      // Log failed verification attempt (for fraud monitoring)
      console.warn(`[auth] SSN mismatch for member ${member.memberNumber}`);

      return NextResponse.json(
        {
          error: 'Verification failed',
          code: 'SSN_MISMATCH',
          hint: 'The last 4 digits of SSN do not match our records',
        },
        { status: 401 }
      );
    }

    // Create session
    const sessionId = randomUUID();
    const token = generateToken(member.memberNumber);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    const session: MemberSession = {
      sessionId,
      memberId: member.memberNumber,
      accountNumber: member.accountNumber,
      firstName: member.firstName,
      lastName: member.lastName,
      expiresAt,
      token,
    };

    sessions.set(sessionId, session);

    // Return session (no sensitive data)
    return NextResponse.json({
      success: true,
      session: {
        sessionId,
        token,
        expiresAt,
      },
      member: {
        firstName: member.firstName,
        lastName: member.lastName,
        memberNumber: member.memberNumber,
        // Don't return SSN, full account numbers, etc.
        hasEmail: !!member.email,
        hasPhone: !!member.phone,
        shareCount: member.shares.length,
        loanCount: member.loans.length,
        cardCount: member.cards.length,
      },
    });
  } catch (error) {
    console.error('[auth/verify-member] Error:', error);

    return NextResponse.json(
      {
        error: 'Verification service unavailable',
        code: 'SERVICE_ERROR',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/auth/verify-member?sessionId=xxx
// Check session status
// ============================================================================

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID required' },
      { status: 400 }
    );
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return NextResponse.json(
      { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
      { status: 404 }
    );
  }

  const isExpired = new Date(session.expiresAt) < new Date();

  if (isExpired) {
    sessions.delete(sessionId);
    return NextResponse.json(
      { error: 'Session expired', code: 'SESSION_EXPIRED' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    valid: true,
    memberId: session.memberId,
    firstName: session.firstName,
    expiresAt: session.expiresAt,
  });
}

// ============================================================================
// DELETE /api/auth/verify-member?sessionId=xxx
// Logout / invalidate session
// ============================================================================

export async function DELETE(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');

  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
  }

  return NextResponse.json({ success: true });
}

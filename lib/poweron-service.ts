/**
 * PowerOn Service
 *
 * Bridge between the CU.APP application and Symitar (Jack Henry) core banking systems.
 * Uses the PowerOn spec registry to invoke core banking operations.
 *
 * This service handles:
 * - Member lookups via PowerOn specs
 * - Account operations (shares, loans, cards)
 * - Transfer execution
 * - IVR data retrieval
 * - Transaction history
 *
 * Connection modes:
 * - SymXchange API (REST/SOAP)
 * - Direct PowerOn via host connection
 * - Mock mode for development/testing
 */

import {
  PowerOnSpec,
  PowerOnCategory,
  getSpecByName,
  getTransferSpec,
  getIvrMemberLookupSpec,
  getUserServiceSpec,
  getAccountServiceSpec,
  getMemberGraphSpec,
  getSpecsByCategory,
  // Tenant-specific functions
  getTenantSpec,
  getTenantTransferSpec,
  getTenantIvrMemberLookupSpec,
  getTenantUserServiceSpec,
  getTenantAccountServiceSpec,
  getTenantMemberGraphSpec,
  getTenantEntryPointSpecs,
  getAllTenantSpecs,
  listTenantPrefixes,
  isTenantSymitarCompatible,
  getSpecPrefix,
  TENANT_POWERON_REGISTRY,
} from './poweron-specs';

// ============================================================================
// TYPES
// ============================================================================

export type ConnectionMode = 'symxchange' | 'direct' | 'mock';

export interface PowerOnConfig {
  mode: ConnectionMode;
  symxchangeUrl?: string;
  symxchangeApiKey?: string;
  hostAddress?: string;
  hostPort?: number;
  institutionId?: string;
  timeout?: number;
  /**
   * Tenant prefix for PowerOn specs (e.g., 'NFCU', 'SCU', 'SFCU')
   * Defaults to 'SCU' if not specified
   */
  tenantPrefix?: string;
  /**
   * Credit union ID (e.g., 'cu_navy_federal')
   * If provided and tenantPrefix is not, will look up prefix from registry
   */
  cuId?: string;
}

export interface PowerOnResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  spec: string;
  executionTimeMs: number;
  timestamp: string;
}

export interface MemberData {
  accountNumber: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  ssn?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  shares: ShareAccount[];
  loans: LoanAccount[];
  cards: CardAccount[];
  preferences?: MemberPreferences;
}

export interface ShareAccount {
  id: string;
  type: string;
  description: string;
  balance: number;
  availableBalance: number;
  interestRate?: number;
  openDate?: string;
  maturityDate?: string;
  holds?: AccountHold[];
}

export interface LoanAccount {
  id: string;
  type: string;
  description: string;
  balance: number;
  originalAmount: number;
  interestRate: number;
  paymentAmount: number;
  paymentDueDate?: string;
  nextPaymentDate?: string;
  payoffAmount?: number;
}

export interface CardAccount {
  id: string;
  type: 'debit' | 'credit';
  lastFour: string;
  status: 'active' | 'blocked' | 'expired' | 'lost' | 'stolen';
  expirationDate: string;
  creditLimit?: number;
  availableCredit?: number;
}

export interface AccountHold {
  amount: number;
  reason: string;
  expirationDate?: string;
}

export interface MemberPreferences {
  estatements: boolean;
  smsAlerts: boolean;
  emailAlerts: boolean;
  pushNotifications: boolean;
  language: string;
}

export interface TransferRequest {
  fromAccountId: string;
  fromAccountType: 'share' | 'loan' | 'external';
  toAccountId: string;
  toAccountType: 'share' | 'loan' | 'external';
  amount: number;
  memo?: string;
  effectiveDate?: string;
  frequency?: 'once' | 'weekly' | 'biweekly' | 'monthly';
}

export interface TransferResult {
  confirmationNumber: string;
  status: 'completed' | 'pending' | 'scheduled' | 'failed';
  fromBalance?: number;
  toBalance?: number;
  effectiveDate: string;
  memo?: string;
}

export interface TransactionHistoryRequest {
  accountId: string;
  accountType: 'share' | 'loan';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  balance: number;
  type: 'debit' | 'credit';
  category?: string;
  merchantName?: string;
  mcc?: string;
}

// ============================================================================
// POWERON SERVICE
// ============================================================================

export class PowerOnService {
  private config: PowerOnConfig;
  private connected: boolean = false;
  private tenantPrefix: string;

  constructor(config?: Partial<PowerOnConfig>) {
    // Determine tenant prefix from config, cuId, or environment
    let prefix = config?.tenantPrefix;
    if (!prefix && config?.cuId) {
      prefix = getSpecPrefix(config.cuId);
    }
    if (!prefix) {
      prefix = process.env.TENANT_PREFIX || process.env.POWERON_TENANT_PREFIX || 'SCU';
    }
    this.tenantPrefix = prefix.toUpperCase();

    this.config = {
      mode: config?.mode || (process.env.POWERON_MODE as ConnectionMode) || 'mock',
      symxchangeUrl: config?.symxchangeUrl || process.env.SYMXCHANGE_URL,
      symxchangeApiKey: config?.symxchangeApiKey || process.env.SYMXCHANGE_API_KEY,
      hostAddress: config?.hostAddress || process.env.POWERON_HOST,
      hostPort: config?.hostPort || parseInt(process.env.POWERON_PORT || '443'),
      institutionId: config?.institutionId || process.env.INSTITUTION_ID,
      timeout: config?.timeout || 30000,
      tenantPrefix: this.tenantPrefix,
      cuId: config?.cuId,
    };
  }

  /**
   * Get the tenant prefix for this service instance
   */
  getTenantPrefix(): string {
    return this.tenantPrefix;
  }

  /**
   * Check if this tenant uses Symitar (compatible with standard specs)
   */
  isSymitarCompatible(): boolean {
    return isTenantSymitarCompatible(this.tenantPrefix);
  }

  /**
   * Get a tenant-specific spec by base name
   */
  getSpec(baseSpecName: string): PowerOnSpec | undefined {
    return getTenantSpec(this.tenantPrefix, baseSpecName);
  }

  /**
   * Initialize connection to PowerOn/SymXchange
   */
  async connect(): Promise<boolean> {
    if (this.config.mode === 'mock') {
      this.connected = true;
      return true;
    }

    try {
      if (this.config.mode === 'symxchange') {
        // Test SymXchange connection
        const response = await fetch(`${this.config.symxchangeUrl}/health`, {
          headers: {
            Authorization: `Bearer ${this.config.symxchangeApiKey}`,
          },
        });
        this.connected = response.ok;
      } else if (this.config.mode === 'direct') {
        // Direct host connection would use TCP/socket
        // This is a placeholder for actual implementation
        this.connected = true;
      }
      return this.connected;
    } catch (error) {
      console.error('PowerOn connection failed:', error);
      this.connected = false;
      return false;
    }
  }

  /**
   * Execute a PowerOn spec
   */
  async executeSpec<T>(
    spec: PowerOnSpec,
    params: Record<string, unknown>
  ): Promise<PowerOnResponse<T>> {
    const startTime = Date.now();

    try {
      if (this.config.mode === 'mock') {
        return this.executeMockSpec<T>(spec, params, startTime);
      }

      if (this.config.mode === 'symxchange') {
        return await this.executeViaSymXchange<T>(spec, params, startTime);
      }

      if (this.config.mode === 'direct') {
        return await this.executeDirectPowerOn<T>(spec, params, startTime);
      }

      throw new Error(`Unknown connection mode: ${this.config.mode}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        spec: spec.name,
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get member data by account number
   * Uses tenant-specific spec: {PREFIX}.MBRGRAPH.BYID.PRO
   */
  async getMemberByAccountNumber(accountNumber: string): Promise<PowerOnResponse<MemberData>> {
    const spec = getTenantMemberGraphSpec(this.tenantPrefix);
    return this.executeSpec<MemberData>(spec, { accountNumber });
  }

  /**
   * Get member data by member number
   * Uses tenant-specific spec: {PREFIX}.USERSERVICE.BYID.PRO
   */
  async getMemberByMemberNumber(memberNumber: string): Promise<PowerOnResponse<MemberData>> {
    const spec = getTenantUserServiceSpec(this.tenantPrefix);
    return this.executeSpec<MemberData>(spec, { memberNumber });
  }

  /**
   * Get member data for IVR (includes phone lookup)
   * Uses tenant-specific spec: {PREFIX}.IVR.BYID.PRO
   */
  async getMemberForIvr(ani: string): Promise<PowerOnResponse<MemberData>> {
    const spec = getTenantIvrMemberLookupSpec(this.tenantPrefix);
    return this.executeSpec<MemberData>(spec, { phoneNumber: ani });
  }

  /**
   * Get account details
   * Uses tenant-specific spec: {PREFIX}.ACCOUNTSERVICE.BYID.PRO
   */
  async getAccountDetails(
    accountId: string,
    accountType: 'share' | 'loan'
  ): Promise<PowerOnResponse<ShareAccount | LoanAccount>> {
    const spec = getTenantAccountServiceSpec(this.tenantPrefix);
    return this.executeSpec<ShareAccount | LoanAccount>(spec, { accountId, accountType });
  }

  /**
   * Execute a transfer between accounts
   * Uses tenant-specific spec: {PREFIX}.TRANSFERS.PRO
   */
  async executeTransfer(request: TransferRequest): Promise<PowerOnResponse<TransferResult>> {
    const spec = getTenantTransferSpec(this.tenantPrefix);
    return this.executeSpec<TransferResult>(spec, request as unknown as Record<string, unknown>);
  }

  /**
   * Get transaction history for an account
   * Uses tenant-specific spec: {PREFIX}.TRANSACTIONS.SUB
   */
  async getTransactionHistory(
    request: TransactionHistoryRequest
  ): Promise<PowerOnResponse<Transaction[]>> {
    const specName = `${this.tenantPrefix}.TRANSACTIONS.SUB`;
    const spec = getTenantSpec(this.tenantPrefix, 'TRANSACTIONS.SUB');
    if (!spec) {
      return {
        success: false,
        error: 'Transaction spec not found',
        spec: specName,
        executionTimeMs: 0,
        timestamp: new Date().toISOString(),
      };
    }
    return this.executeSpec<Transaction[]>(spec, request as unknown as Record<string, unknown>);
  }

  /**
   * Get available specs for a category (tenant-specific)
   */
  getAvailableSpecs(category?: PowerOnCategory): PowerOnSpec[] {
    if (category) {
      // Get base category specs and convert to tenant-specific
      const baseSpecs = getSpecsByCategory(category);
      return baseSpecs.map((spec) => {
        const baseName = spec.name.replace('SCU.', '');
        return getTenantSpec(this.tenantPrefix, baseName) || spec;
      });
    }
    return getAllTenantSpecs(this.tenantPrefix);
  }

  /**
   * Get all entry point specs for this tenant
   */
  getEntryPointSpecs(): PowerOnSpec[] {
    return getTenantEntryPointSpecs(this.tenantPrefix);
  }

  /**
   * List all configured tenants
   */
  static listTenants(): { cuId: string; name: string; prefix: string; coreProvider: string }[] {
    return listTenantPrefixes();
  }

  /**
   * Get all available tenant prefixes
   */
  static getTenantPrefixes(): string[] {
    return TENANT_POWERON_REGISTRY.map((t) => t.specPrefix);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async executeViaSymXchange<T>(
    spec: PowerOnSpec,
    params: Record<string, unknown>,
    startTime: number
  ): Promise<PowerOnResponse<T>> {
    const response = await fetch(`${this.config.symxchangeUrl}/poweron/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.symxchangeApiKey}`,
        'X-Institution-ID': this.config.institutionId || '',
      },
      body: JSON.stringify({
        specName: spec.name,
        specPath: spec.path,
        parameters: params,
      }),
    });

    const data = await response.json();

    return {
      success: response.ok,
      data: data.result as T,
      error: data.error,
      spec: spec.name,
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }

  private async executeDirectPowerOn<T>(
    spec: PowerOnSpec,
    params: Record<string, unknown>,
    startTime: number
  ): Promise<PowerOnResponse<T>> {
    // Direct PowerOn execution would use host TCP connection
    // This is a placeholder for actual implementation
    throw new Error('Direct PowerOn execution not yet implemented');
  }

  private executeMockSpec<T>(
    spec: PowerOnSpec,
    params: Record<string, unknown>,
    startTime: number
  ): PowerOnResponse<T> {
    // Return mock data based on spec category
    const mockData = this.generateMockData(spec, params);

    return {
      success: true,
      data: mockData as T,
      spec: spec.name,
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }

  private generateMockData(spec: PowerOnSpec, params: Record<string, unknown>): unknown {
    // Generate mock data based on spec category
    switch (spec.category) {
      case 'membergraph':
      case 'userservice':
      case 'userview':
      case 'ivr':
        return this.generateMockMemberData(params);

      case 'accountservice':
        return this.generateMockAccountData(params);

      case 'transfers':
        return this.generateMockTransferResult(params);

      case 'transactions':
        return this.generateMockTransactions(params);

      default:
        return { mock: true, spec: spec.name, params };
    }
  }

  private generateMockMemberData(params: Record<string, unknown>): MemberData {
    const accountNumber = (params.accountNumber as string) || '1234567890';
    return {
      accountNumber,
      memberNumber: `M${accountNumber.slice(-6)}`,
      firstName: 'John',
      lastName: 'Member',
      ssn: '***-**-1234',  // Mock SSN - last 4 is "1234" for testing
      email: 'john.member@example.com',
      phone: '555-123-4567',
      address: {
        street: '123 Main Street',
        city: 'Anytown',
        state: 'FL',
        zip: '33701',
      },
      shares: [
        {
          id: 'S0001',
          type: 'Regular Savings',
          description: 'Primary Savings',
          balance: 5432.10,
          availableBalance: 5432.10,
          interestRate: 0.05,
          openDate: '2020-01-15',
        },
        {
          id: 'S0010',
          type: 'Share Draft',
          description: 'Checking Account',
          balance: 2156.78,
          availableBalance: 2056.78,
          holds: [{ amount: 100, reason: 'Pending transaction' }],
        },
      ],
      loans: [
        {
          id: 'L0001',
          type: 'Auto Loan',
          description: '2022 Toyota Camry',
          balance: 18543.21,
          originalAmount: 25000,
          interestRate: 4.99,
          paymentAmount: 425.50,
          nextPaymentDate: '2024-02-01',
        },
      ],
      cards: [
        {
          id: 'C0001',
          type: 'debit',
          lastFour: '4532',
          status: 'active',
          expirationDate: '12/26',
        },
      ],
      preferences: {
        estatements: true,
        smsAlerts: true,
        emailAlerts: true,
        pushNotifications: false,
        language: 'en',
      },
    };
  }

  private generateMockAccountData(
    params: Record<string, unknown>
  ): ShareAccount | LoanAccount {
    const accountType = params.accountType as string;

    if (accountType === 'loan') {
      return {
        id: params.accountId as string || 'L0001',
        type: 'Auto Loan',
        description: '2022 Toyota Camry',
        balance: 18543.21,
        originalAmount: 25000,
        interestRate: 4.99,
        paymentAmount: 425.50,
        nextPaymentDate: '2024-02-01',
      };
    }

    return {
      id: params.accountId as string || 'S0001',
      type: 'Regular Savings',
      description: 'Primary Savings',
      balance: 5432.10,
      availableBalance: 5432.10,
      interestRate: 0.05,
      openDate: '2020-01-15',
    };
  }

  private generateMockTransferResult(params: Record<string, unknown>): TransferResult {
    return {
      confirmationNumber: `TRF${Date.now()}`,
      status: 'completed',
      fromBalance: 5000 - (params.amount as number || 0),
      toBalance: 2000 + (params.amount as number || 0),
      effectiveDate: new Date().toISOString().split('T')[0],
      memo: params.memo as string,
    };
  }

  private generateMockTransactions(params: Record<string, unknown>): Transaction[] {
    const limit = (params.limit as number) || 10;
    const transactions: Transaction[] = [];

    const descriptions = [
      { desc: 'AMAZON.COM', category: 'Shopping', type: 'debit' as const },
      { desc: 'PAYROLL DIRECT DEP', category: 'Income', type: 'credit' as const },
      { desc: 'SHELL OIL', category: 'Gas', type: 'debit' as const },
      { desc: 'PUBLIX SUPER MARKETS', category: 'Groceries', type: 'debit' as const },
      { desc: 'TRANSFER FROM SAVINGS', category: 'Transfer', type: 'credit' as const },
      { desc: 'NETFLIX.COM', category: 'Entertainment', type: 'debit' as const },
      { desc: 'ATM WITHDRAWAL', category: 'Cash', type: 'debit' as const },
      { desc: 'STARBUCKS', category: 'Food & Drink', type: 'debit' as const },
    ];

    let balance = 2156.78;
    const now = new Date();

    for (let i = 0; i < limit; i++) {
      const txn = descriptions[i % descriptions.length];
      const amount = txn.type === 'credit'
        ? Math.floor(Math.random() * 2000) + 500
        : Math.floor(Math.random() * 100) + 10;

      const date = new Date(now);
      date.setDate(date.getDate() - i);

      if (txn.type === 'debit') {
        balance += amount;
      } else {
        balance -= amount;
      }

      transactions.push({
        id: `TXN${Date.now()}${i}`,
        date: date.toISOString().split('T')[0],
        description: txn.desc,
        amount: txn.type === 'debit' ? -amount : amount,
        balance,
        type: txn.type,
        category: txn.category,
      });
    }

    return transactions;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let powerOnServiceInstance: PowerOnService | null = null;

export function getPowerOnService(config?: Partial<PowerOnConfig>): PowerOnService {
  if (!powerOnServiceInstance) {
    powerOnServiceInstance = new PowerOnService(config);
  }
  return powerOnServiceInstance;
}

export default PowerOnService;

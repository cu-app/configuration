/**
 * Tenant PowerOn Registry
 *
 * Maps credit union tenants to their PowerOn spec prefixes.
 * Each credit union has a unique 2-5 character prefix used in their
 * PowerOn spec names (e.g., NFCU.MBRGRAPH.BYID.PRO for Navy Federal).
 *
 * This allows the same spec types to be deployed across different
 * credit unions with tenant-specific naming.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TenantPowerOnConfig {
  /** Credit union ID (from credit-union-data.ts) */
  cuId: string;
  /** Display name */
  name: string;
  /** PowerOn spec prefix (2-5 chars, uppercase) */
  specPrefix: string;
  /** Core banking provider */
  coreProvider: 'symitar' | 'fiserv' | 'corelation' | 'ncr' | 'salesforce' | 'zafin' | 'temenos' | 'other';
  /** Whether specs have been deployed to this tenant's host */
  specsDeployed: boolean;
  /** Symitar institution number (if applicable) */
  institutionNumber?: string;
  /** Notes about this tenant's configuration */
  notes?: string;
}

// ============================================================================
// TENANT REGISTRY - Top 20 Credit Unions + SCU (Original)
// ============================================================================

export const TENANT_POWERON_REGISTRY: TenantPowerOnConfig[] = [
  // SCU PowerOn specs
  {
    cuId: 'cu_suncoast',
    name: 'Suncoast Credit Union',
    specPrefix: 'SCU',
    coreProvider: 'symitar',
    specsDeployed: true,
    institutionNumber: '68303',
    notes: 'PowerOn spec registry',
  },

  // Navy Federal - Largest CU
  {
    cuId: 'cu_navy_federal',
    name: 'Navy Federal Credit Union',
    specPrefix: 'NFCU',
    coreProvider: 'zafin',
    specsDeployed: false,
    notes: 'Modernizing from mainframe to Zafin + Backbase',
  },

  // State Employees (NC)
  {
    cuId: 'cu_state_employees',
    name: 'State Employees Credit Union',
    specPrefix: 'SECU',
    coreProvider: 'ncr',
    specsDeployed: false,
    notes: 'Uses NCR Digital Banking (cloud-native)',
  },

  // SchoolsFirst
  {
    cuId: 'cu_schoolsfirst',
    name: 'SchoolsFirst Federal Credit Union',
    specPrefix: 'SFCU',
    coreProvider: 'symitar',
    specsDeployed: false,
    institutionNumber: '11922',
    notes: 'Symitar Episys - compatible with SCU specs',
  },

  // PenFed
  {
    cuId: 'cu_pentagon',
    name: 'Pentagon Federal Credit Union',
    specPrefix: 'PFCU',
    coreProvider: 'salesforce',
    specsDeployed: false,
    notes: 'Uses Salesforce Financial Services Cloud + MuleSoft',
  },

  // BECU
  {
    cuId: 'cu_becu',
    name: 'Boeing Employees Credit Union',
    specPrefix: 'BECU',
    coreProvider: 'fiserv',
    specsDeployed: false,
    notes: 'Fiserv core banking platform',
  },

  // America First
  {
    cuId: 'cu_america_first',
    name: 'America First Credit Union',
    specPrefix: 'AFCU',
    coreProvider: 'symitar',
    specsDeployed: false,
    institutionNumber: '14697',
    notes: 'Symitar Episys - compatible with SCU specs',
  },

  // Mountain America
  {
    cuId: 'cu_mountain_america',
    name: 'Mountain America Credit Union',
    specPrefix: 'MACU',
    coreProvider: 'corelation',
    specsDeployed: false,
    notes: 'Migrating to Corelation KeyStone (2025)',
  },

  // Golden 1
  {
    cuId: 'cu_golden1',
    name: 'The Golden 1 Credit Union',
    specPrefix: 'G1CU',
    coreProvider: 'fiserv',
    specsDeployed: false,
    notes: 'Fiserv DNA Core + Real-Time Payments',
  },

  // Alliant
  {
    cuId: 'cu_alliant',
    name: 'Alliant Credit Union',
    specPrefix: 'ALCU',
    coreProvider: 'symitar',
    specsDeployed: false,
    institutionNumber: '60105',
    notes: 'Symitar Episys - compatible with SCU specs',
  },

  // Randolph-Brooks
  {
    cuId: 'cu_randolph_brooks',
    name: 'Randolph-Brooks Federal Credit Union',
    specPrefix: 'RBFCU',
    coreProvider: 'symitar',
    specsDeployed: false,
    institutionNumber: '7243',
    notes: 'Symitar Episys - compatible with SCU specs',
  },

  // First Tech
  {
    cuId: 'cu_first_tech',
    name: 'First Technology Federal Credit Union',
    specPrefix: 'FTCU',
    coreProvider: 'temenos',
    specsDeployed: false,
    notes: 'Temenos T24 Transact',
  },

  // Lake Michigan
  {
    cuId: 'cu_lake_michigan',
    name: 'Lake Michigan Credit Union',
    specPrefix: 'LMCU',
    coreProvider: 'corelation',
    specsDeployed: false,
    notes: 'Corelation KeyStone',
  },

  // Security Service
  {
    cuId: 'cu_security_service',
    name: 'Security Service Federal Credit Union',
    specPrefix: 'SSFCU',
    coreProvider: 'symitar',
    specsDeployed: false,
    institutionNumber: '6586',
    notes: 'Symitar Episys - compatible with SCU specs',
  },

  // VyStar
  {
    cuId: 'cu_vystar',
    name: 'VyStar Credit Union',
    specPrefix: 'VYCU',
    coreProvider: 'fiserv',
    specsDeployed: false,
    notes: 'Fiserv DNA',
  },

  // Fourleaf
  {
    cuId: 'cu_fourleaf',
    name: 'Fourleaf Credit Union',
    specPrefix: 'FLCU',
    coreProvider: 'symitar',
    specsDeployed: false,
    notes: 'Symitar Episys - compatible with SCU specs',
  },

  // Digital (DCU)
  {
    cuId: 'cu_digital',
    name: 'Digital Federal Credit Union',
    specPrefix: 'DCU',
    coreProvider: 'symitar',
    specsDeployed: false,
    institutionNumber: '6410',
    notes: 'Symitar Episys - compatible with SCU specs',
  },

  // Idaho Central
  {
    cuId: 'cu_idaho_central',
    name: 'Idaho Central Credit Union',
    specPrefix: 'ICCU',
    coreProvider: 'symitar',
    specsDeployed: false,
    institutionNumber: '7067',
    notes: 'Symitar Episys - compatible with SCU specs',
  },

  // Global
  {
    cuId: 'cu_global',
    name: 'Global Credit Union',
    specPrefix: 'GCU',
    coreProvider: 'corelation',
    specsDeployed: false,
    notes: 'Corelation KeyStone',
  },

  // GreenState
  {
    cuId: 'cu_greenstate',
    name: 'GreenState Credit Union',
    specPrefix: 'GSCU',
    coreProvider: 'symitar',
    specsDeployed: false,
    institutionNumber: '3365',
    notes: 'Symitar Episys - compatible with SCU specs',
  },
];

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get tenant config by credit union ID
 */
export function getTenantByCuId(cuId: string): TenantPowerOnConfig | undefined {
  return TENANT_POWERON_REGISTRY.find((t) => t.cuId === cuId);
}

/**
 * Get tenant config by spec prefix
 */
export function getTenantByPrefix(prefix: string): TenantPowerOnConfig | undefined {
  return TENANT_POWERON_REGISTRY.find((t) => t.specPrefix === prefix.toUpperCase());
}

/**
 * Get all tenants using Symitar (compatible with SCU specs)
 */
export function getSymitarTenants(): TenantPowerOnConfig[] {
  return TENANT_POWERON_REGISTRY.filter((t) => t.coreProvider === 'symitar');
}

/**
 * Get all tenants with specs deployed
 */
export function getDeployedTenants(): TenantPowerOnConfig[] {
  return TENANT_POWERON_REGISTRY.filter((t) => t.specsDeployed);
}

/**
 * Get spec prefix for a credit union ID
 */
export function getSpecPrefix(cuId: string): string {
  const tenant = getTenantByCuId(cuId);
  return tenant?.specPrefix || 'CU'; // Default to generic 'CU' prefix
}

// ============================================================================
// SPEC NAME GENERATION
// ============================================================================

/**
 * Base spec names (without prefix) for all 139 specs
 * These are the spec names with the SCU. prefix removed
 */
export const BASE_SPEC_NAMES = {
  // Products
  'PRODUCTS.DEF': 'Product definitions and configurations',

  // Memo Post Mode
  'MEMOPOSTMODE.DEF': 'Memo post mode definitions for batch processing',

  // Transfers
  'TRANSFERS.PRO': 'Main transfer execution entry point',
  'TRANSFERS.DEF': 'Transfer definitions and constants',
  'TRANSFERS.PRINT.SUB': 'Transfer print formatting subroutine',
  'TRANSFERS.JSON.SUB': 'Transfer JSON serialization subroutine',

  // SymXchange
  'SYMXCHANGE.DEF': 'SymXchange API definitions',

  // User View Admin
  'USERVIEWADMIN.BYID.PRO': 'Admin user view lookup by ID',
  'USERVIEWADMIN.LOOKUP.SUB': 'Admin user lookup subroutine',
  'USERVIEWADMIN.LOAN.SUB': 'Admin loan view subroutine',
  'USERVIEWADMIN.PREF.SUB': 'Admin preferences subroutine',
  'USERVIEWADMIN.EXLOAN.SUB': 'Admin external loan subroutine',
  'USERVIEWADMIN.SHARE.SUB': 'Admin share view subroutine',

  // User View
  'USERVIEW.PRINT.SUB': 'User view print formatting',
  'USERVIEW.BYID.PRO': 'User view lookup by ID entry point',
  'USERVIEW.DEF': 'User view definitions',
  'USERVIEW.SHARE.SUB': 'User share account subroutine',
  'USERVIEW.LOAN.SUB': 'User loan account subroutine',
  'USERVIEW.LOANNAME.SUB': 'User loan name subroutine',
  'USERVIEW.EXTERNALLOAN.SUB': 'User external loan subroutine',
  'USERVIEW.NAME.SUB': 'User name subroutine',
  'USERVIEW.TRACKING.SUB': 'User tracking subroutine',
  'USERVIEW.IRS.SUB': 'User IRS reporting subroutine',
  'USERVIEW.SHARENAME.SUB': 'User share name subroutine',
  'USERVIEW.CARD.SUB': 'User card subroutine',
  'USERVIEW.PREFERENCE.SUB': 'User preferences subroutine',
  'USERVIEW.EXTLOANNAME.SUB': 'User external loan name subroutine',
  'USERVIEW.JSON.SUB': 'User view JSON serialization',
  'USERVIEW.RATES.SUB': 'User rates subroutine',
  'USERVIEW.ACCOUNT.SUB': 'User account subroutine',
  'USERVIEW.RATES.JSON.SUB': 'User rates JSON serialization',

  // Member Graph (36 specs)
  'MBRGRAPH.COMMENT.SUB': 'Member comment subroutine',
  'MBRGRAPH.PRINT.SUB': 'Member graph print formatting',
  'MBRGRAPH.NAME.SUB': 'Member name subroutine',
  'MBRGRAPH.SHARE.SUB': 'Member share subroutine',
  'MBRGRAPH.CARDNOTE.SUB': 'Member card note subroutine',
  'MBRGRAPH.SHAREHOLD.SUB': 'Member share hold subroutine',
  'MBRGRAPH.LOAN.SUB': 'Member loan subroutine',
  'MBRGRAPH.EXTLNTRACKING.SUB': 'Member external loan tracking subroutine',
  'MBRGRAPH.LOANNAME.SUB': 'Member loan name subroutine',
  'MBRGRAPH.EXTLNTRANSFER.SUB': 'Member external loan transfer subroutine',
  'MBRGRAPH.SHARENOTE.SUB': 'Member share note subroutine',
  'MBRGRAPH.BYID.PRO': 'Member graph by ID entry point',
  'MBRGRAPH.LOANPLEDGENAME.SUB': 'Member loan pledge name subroutine',
  'MBRGRAPH.TRACKING.SUB': 'Member tracking subroutine',
  'MBRGRAPH.EXTLOANNAME.SUB': 'Member external loan name subroutine',
  'MBRGRAPH.EFTTRANSFER.SUB': 'Member EFT transfer subroutine',
  'MBRGRAPH.EXTERNALLOAN.SUB': 'Member external loan subroutine',
  'MBRGRAPH.EXTLOANNOTE.SUB': 'Member external loan note subroutine',
  'MBRGRAPH.CARDACCESS.SUB': 'Member card access subroutine',
  'MBRGRAPH.PREFERENCE.SUB': 'Member preference subroutine',
  'MBRGRAPH.FMHISTORY.SUB': 'Member FM history subroutine',
  'MBRGRAPH.DEF': 'Member graph definitions',
  'MBRGRAPH.SHARENAME.SUB': 'Member share name subroutine',
  'MBRGRAPH.SHARETRANSFER.SUB': 'Member share transfer subroutine',
  'MBRGRAPH.SHARETRACKING.SUB': 'Member share tracking subroutine',
  'MBRGRAPH.LOANNOTE.SUB': 'Member loan note subroutine',
  'MBRGRAPH.ACCOUNT.SUB': 'Member account subroutine',
  'MBRGRAPH.JSON.SUB': 'Member graph JSON serialization',
  'MBRGRAPH.CARDNAME.SUB': 'Member card name subroutine',
  'MBRGRAPH.LOANTRANSFER.SUB': 'Member loan transfer subroutine',
  'MBRGRAPH.LOANTRACKING.SUB': 'Member loan tracking subroutine',
  'MBRGRAPH.EFT.SUB': 'Member EFT subroutine',
  'MBRGRAPH.LOOKUP.SUB': 'Member lookup subroutine',
  'MBRGRAPH.LOANPLEDGE.SUB': 'Member loan pledge subroutine',
  'MBRGRAPH.CARD.SUB': 'Member card subroutine',

  // User Service (18 specs)
  'USERSERVICE.BYID.PRO': 'User service by ID entry point',
  'USERSERVICE.RATES.SUB': 'User service rates subroutine',
  'USERSERVICE.ACCOUNT.SUB': 'User service account subroutine',
  'USERSERVICE.TRACKING.SUB': 'User service tracking subroutine',
  'USERSERVICE.EXTLOANNAME.SUB': 'User service external loan name subroutine',
  'USERSERVICE.NAME.SUB': 'User service name subroutine',
  'USERSERVICE.LOAN.SUB': 'User service loan subroutine',
  'USERSERVICE.LOANNAME.SUB': 'User service loan name subroutine',
  'USERSERVICE.JSON.SUB': 'User service JSON serialization',
  'USERSERVICE.EXTLOAN.SUB': 'User service external loan subroutine',
  'USERSERVICE.DEF': 'User service definitions',
  'USERSERVICE.RATES.JSON.SUB': 'User service rates JSON serialization',
  'USERSERVICE.CARD.SUB': 'User service card subroutine',
  'USERSERVICE.PRINT.SUB': 'User service print formatting',
  'USERSERVICE.SHARENAME.SUB': 'User service share name subroutine',
  'USERSERVICE.PREFERENCE.SUB': 'User service preference subroutine',
  'USERSERVICE.IRS.SUB': 'User service IRS reporting subroutine',
  'USERSERVICE.SHARE.SUB': 'User service share subroutine',

  // Account Service (10 specs)
  'ACCOUNTSERVICE.EXTLOAN.SUB': 'Account service external loan subroutine',
  'ACCOUNTSERVICE.BYID.PRO': 'Account service by ID entry point',
  'ACCOUNTSERVICE.DEF': 'Account service definitions',
  'ACCOUNTSERVICE.SHARENAME.SUB': 'Account service share name subroutine',
  'ACCOUNTSERVICE.LOAN.SUB': 'Account service loan subroutine',
  'ACCOUNTSERVICE.LOANNAME.SUB': 'Account service loan name subroutine',
  'ACCOUNTSERVICE.JSON.SUB': 'Account service JSON serialization',
  'ACCOUNTSERVICE.PRINT.SUB': 'Account service print formatting',
  'ACCOUNTSERVICE.SHARE.SUB': 'Account service share subroutine',
  'ACCOUNTSERVICE.EXTLOANNAME.SUB': 'Account service external loan name subroutine',

  // IVR Support (35 specs)
  'IVR.LOOKUP.SUB': 'IVR lookup subroutine',
  'IVR.EXTLNTRACKING.SUB': 'IVR external loan tracking subroutine',
  'IVR.SHARENOTE.SUB': 'IVR share note subroutine',
  'IVR.EXTLNTRANSFER.SUB': 'IVR external loan transfer subroutine',
  'IVR.TRACKING.SUB': 'IVR tracking subroutine',
  'IVR.PREFERENCE.SUB': 'IVR preference subroutine',
  'IVR.CARDACCESS.SUB': 'IVR card access subroutine',
  'IVR.NAME.SUB': 'IVR name subroutine',
  'IVR.EXTLOANNOTE.SUB': 'IVR external loan note subroutine',
  'IVR.LOANPLEDGENAME.SUB': 'IVR loan pledge name subroutine',
  'IVR.LOANNAME.SUB': 'IVR loan name subroutine',
  'IVR.LOAN.SUB': 'IVR loan subroutine',
  'IVR.CARDNOTE.SUB': 'IVR card note subroutine',
  'IVR.ACCOUNT.SUB': 'IVR account subroutine',
  'IVR.BYID.PRO': 'IVR by ID entry point',
  'IVR.SHAREHOLD.SUB': 'IVR share hold subroutine',
  'IVR.LOANPLEDGE.SUB': 'IVR loan pledge subroutine',
  'IVR.COMMENT.SUB': 'IVR comment subroutine',
  'IVR.DEF': 'IVR definitions',
  'IVR.EFT.SUB': 'IVR EFT subroutine',
  'IVR.CARDNAME.SUB': 'IVR card name subroutine',
  'IVR.LOANTRANSFER.SUB': 'IVR loan transfer subroutine',
  'IVR.LOANTRACKING.SUB': 'IVR loan tracking subroutine',
  'IVR.LOANNOTE.SUB': 'IVR loan note subroutine',
  'IVR.JSON.SUB': 'IVR JSON serialization',
  'IVR.EXTLOANNAME.SUB': 'IVR external loan name subroutine',
  'IVR.SHARE.SUB': 'IVR share subroutine',
  'IVR.EFTTRANSFER.SUB': 'IVR EFT transfer subroutine',
  'IVR.EXTERNALLOAN.SUB': 'IVR external loan subroutine',
  'IVR.FMHISTORY.SUB': 'IVR FM history subroutine',
  'IVR.PRINT.SUB': 'IVR print formatting',
  'IVR.SHARENAME.SUB': 'IVR share name subroutine',
  'IVR.SHARETRANSFER.SUB': 'IVR share transfer subroutine',
  'IVR.CARD.SUB': 'IVR card subroutine',
  'IVR.SHARETRACKING.SUB': 'IVR share tracking subroutine',

  // Mobile Banking (5 specs)
  'MOBILEBANKING.DEF': 'Mobile banking definitions',
  'UTILITY.DEF': 'Utility definitions',
  'MRMUSER.DEF': 'MRM user definitions',
  'MRMCARD.DEF': 'MRM card definitions',

  // Transactions (4 specs)
  'TRANSACTIONS.JSON.SUB': 'Transactions JSON serialization',
  'TRANSACTIONS.DEF': 'Transactions definitions',
  'TRANSACTIONS.PRINT.SUB': 'Transactions print formatting',
  'TRANSACTIONS.SUB': 'Transactions subroutine',
} as const;

/**
 * Generate tenant-specific spec name
 * @param tenantPrefix - The tenant's spec prefix (e.g., 'NFCU', 'SCU')
 * @param baseSpecName - The base spec name without prefix (e.g., 'MBRGRAPH.BYID.PRO')
 * @returns Full spec name (e.g., 'NFCU.MBRGRAPH.BYID.PRO')
 */
export function getTenantSpecName(tenantPrefix: string, baseSpecName: string): string {
  return `${tenantPrefix.toUpperCase()}.${baseSpecName}`;
}

/**
 * Generate tenant-specific spec name from credit union ID
 * @param cuId - The credit union ID (e.g., 'cu_navy_federal')
 * @param baseSpecName - The base spec name without prefix (e.g., 'MBRGRAPH.BYID.PRO')
 * @returns Full spec name (e.g., 'NFCU.MBRGRAPH.BYID.PRO')
 */
export function getTenantSpecNameByCuId(cuId: string, baseSpecName: string): string {
  const prefix = getSpecPrefix(cuId);
  return getTenantSpecName(prefix, baseSpecName);
}

/**
 * Generate all spec names for a tenant
 * @param tenantPrefix - The tenant's spec prefix (e.g., 'NFCU')
 * @returns Map of base spec name to full tenant spec name
 */
export function getAllTenantSpecs(tenantPrefix: string): Map<string, string> {
  const specs = new Map<string, string>();
  for (const baseSpec of Object.keys(BASE_SPEC_NAMES)) {
    specs.set(baseSpec, getTenantSpecName(tenantPrefix, baseSpec));
  }
  return specs;
}

/**
 * Get key entry point specs for a tenant
 */
export function getTenantEntryPoints(tenantPrefix: string): {
  memberGraph: string;
  userService: string;
  accountService: string;
  ivr: string;
  transfers: string;
} {
  return {
    memberGraph: getTenantSpecName(tenantPrefix, 'MBRGRAPH.BYID.PRO'),
    userService: getTenantSpecName(tenantPrefix, 'USERSERVICE.BYID.PRO'),
    accountService: getTenantSpecName(tenantPrefix, 'ACCOUNTSERVICE.BYID.PRO'),
    ivr: getTenantSpecName(tenantPrefix, 'IVR.BYID.PRO'),
    transfers: getTenantSpecName(tenantPrefix, 'TRANSFERS.PRO'),
  };
}

// ============================================================================
// DYNAMIC PREFIX LOADING (for all 3822+ CUs)
// ============================================================================

import {
  generatePrefix,
  getPrefix as getDynamicPrefix,
  type CreditUnionInput,
} from './tenant-prefix-generator';

/** Cache for dynamically loaded prefixes */
const dynamicPrefixCache = new Map<string, TenantPowerOnConfig>();

/**
 * Load prefix from Supabase cu_poweron_prefixes table
 * Falls back to generating on-the-fly if not found
 */
export async function loadTenantPrefix(
  charterNumber: string | number,
  supabaseClient?: any
): Promise<TenantPowerOnConfig | null> {
  const charter = String(charterNumber);

  // Check static registry first
  const staticTenant = TENANT_POWERON_REGISTRY.find(
    t => t.institutionNumber === charter || t.cuId === `cu_${charter}`
  );
  if (staticTenant) return staticTenant;

  // Check dynamic cache
  if (dynamicPrefixCache.has(charter)) {
    return dynamicPrefixCache.get(charter)!;
  }

  // Try to load from Supabase if client provided
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('cu_poweron_prefixes')
      .select('*')
      .eq('charter_number', parseInt(charter))
      .single();

    if (data && !error) {
      const config: TenantPowerOnConfig = {
        cuId: `cu_${charter}`,
        name: data.cu_name,
        specPrefix: data.prefix,
        coreProvider: data.core_provider || 'symitar',
        specsDeployed: data.specs_deployed || false,
        institutionNumber: charter,
      };
      dynamicPrefixCache.set(charter, config);
      return config;
    }
  }

  return null;
}

/**
 * Generate prefix on-the-fly for any credit union
 */
export function generateTenantPrefix(cu: {
  charter_number: string | number;
  cu_name: string;
  state?: string;
  city?: string;
}): TenantPowerOnConfig {
  const charter = String(cu.charter_number);

  // Check cache first
  if (dynamicPrefixCache.has(charter)) {
    return dynamicPrefixCache.get(charter)!;
  }

  // Generate new prefix
  const generated = generatePrefix(cu as CreditUnionInput);

  const config: TenantPowerOnConfig = {
    cuId: `cu_${charter}`,
    name: cu.cu_name,
    specPrefix: generated.prefix,
    coreProvider: 'symitar', // Default assumption
    specsDeployed: false,
    institutionNumber: charter,
  };

  dynamicPrefixCache.set(charter, config);
  return config;
}

/**
 * Get all tenant prefixes (static + dynamic)
 */
export function getAllTenantConfigs(): TenantPowerOnConfig[] {
  const configs = [...TENANT_POWERON_REGISTRY];

  // Add dynamic configs not in static registry
  for (const [charter, config] of dynamicPrefixCache.entries()) {
    if (!configs.find(c => c.institutionNumber === charter)) {
      configs.push(config);
    }
  }

  return configs;
}

/**
 * Get count of all registered prefixes
 */
export function getTotalPrefixCount(): number {
  return TENANT_POWERON_REGISTRY.length + dynamicPrefixCache.size;
}

/**
 * Clear dynamic cache (for testing)
 */
export function clearDynamicCache(): void {
  dynamicPrefixCache.clear();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TENANT_POWERON_REGISTRY;

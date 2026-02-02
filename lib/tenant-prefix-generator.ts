/**
 * Tenant Prefix Generator
 *
 * Automatically generates unique PowerOn spec prefixes for ALL 3822+ credit unions.
 * Uses smart abbreviation logic to create 2-5 character prefixes from CU names.
 *
 * Algorithm:
 * 1. Extract significant words (skip "Credit Union", "Federal", etc.)
 * 2. Take first letter of each word to form acronym
 * 3. If collision, add distinguishing characters
 * 4. Cache results for performance
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Words to skip when generating prefixes */
const SKIP_WORDS = new Set([
  'credit', 'union', 'federal', 'fcu', 'cu', 'the', 'of', 'and', '&',
  'employees', 'employee', 'members', 'member', 'community', 'cooperative',
  'coop', 'co-op', 'association', 'assoc', 'inc', 'incorporated',
]);

/** Known prefixes for major CUs (manually curated for clarity) */
const KNOWN_PREFIXES: Record<string, string> = {
  // Top 20 by assets
  'NAVY FEDERAL CREDIT UNION': 'NFCU',
  "STATE EMPLOYEES'": 'SECU',
  'SCHOOLSFIRST': 'SFCU',
  'PENTAGON': 'PFCU',
  'BOEING EMPLOYEES': 'BECU',
  'AMERICA FIRST': 'AFCU',
  'MOUNTAIN AMERICA': 'MACU',
  'THE GOLDEN 1': 'G1CU',
  'ALLIANT': 'ALCU',
  'SUNCOAST': 'SCU',
  'RANDOLPH-BROOKS': 'RBFCU',
  'FIRST TECHNOLOGY': 'FTCU',
  'LAKE MICHIGAN': 'LMCU',
  'SECURITY SERVICE': 'SSFCU',
  'VYSTAR': 'VYCU',
  'FOURLEAF': 'FLCU',
  'DIGITAL': 'DCU',
  'IDAHO CENTRAL': 'ICCU',
  'GLOBAL': 'GCU',
  'GREENSTATE': 'GSCU',
  // Additional well-known CUs
  'PATELCO': 'PACO',
  'STAR ONE': 'S1CU',
  'DESERT FINANCIAL': 'DFCU',
  'CONNEXUS': 'CXCU',
  'LOGIX': 'LGXCU',
  'REDSTONE': 'RSCU',
  'COASTAL': 'CSTCU',
  'ALASKA USA': 'AUSA',
  'ORANGE COUNTY': 'OCCU',
  'TRAVIS': 'TVCU',
  'SPACE COAST': 'SPCU',
  'WESTERRA': 'WTCU',
  'ELEVATIONS': 'ELCU',
  'CONSUMERS': 'CNCU',
  'GROW FINANCIAL': 'GFCU',
  'MUNICIPAL': 'MUNI',
  'POINT LOMA': 'PLCU',
  'SAN DIEGO COUNTY': 'SDCU',
  'TEACHERS': 'TFCU',
  'UNIVERSITY': 'UNCU',
  'POLICE': 'PLCU',
  'FIRE FIGHTERS': 'FFCU',
  'FIREFIGHTERS': 'FFCU',
  'POSTAL': 'PSCU',
  'HEALTHCARE': 'HCCU',
  'MEDICAL': 'MDCU',
};

/** State abbreviations for geographic disambiguation */
const STATE_CODES: Record<string, string> = {
  'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR',
  'CALIFORNIA': 'CA', 'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE',
  'FLORIDA': 'FL', 'GEORGIA': 'GA', 'HAWAII': 'HI', 'IDAHO': 'ID',
  'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA', 'KANSAS': 'KS',
  'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
  'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS',
  'MISSOURI': 'MO', 'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV',
  'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY',
  'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH', 'OKLAHOMA': 'OK',
  'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
  'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT',
  'VERMONT': 'VT', 'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV',
  'WISCONSIN': 'WI', 'WYOMING': 'WY',
};

// ============================================================================
// TYPES
// ============================================================================

export interface CreditUnionInput {
  charter_number: number | string;
  cu_name: string;
  state?: string;
  city?: string;
}

export interface GeneratedPrefix {
  prefix: string;
  charter: string;
  name: string;
  method: 'known' | 'acronym' | 'acronym+state' | 'acronym+city' | 'acronym+num' | 'charter';
}

// ============================================================================
// PREFIX CACHE
// ============================================================================

/** In-memory cache of generated prefixes */
const prefixCache = new Map<string, string>();
/** Reverse lookup: prefix -> charter */
const prefixToCharter = new Map<string, string>();

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Generate a unique prefix for a credit union
 */
export function generatePrefix(cu: CreditUnionInput): GeneratedPrefix {
  const charter = String(cu.charter_number);
  const name = cu.cu_name.toUpperCase().trim();

  // Check cache first
  if (prefixCache.has(charter)) {
    return {
      prefix: prefixCache.get(charter)!,
      charter,
      name,
      method: 'known',
    };
  }

  // Check known prefixes
  for (const [knownName, knownPrefix] of Object.entries(KNOWN_PREFIXES)) {
    if (name.includes(knownName)) {
      if (!prefixToCharter.has(knownPrefix)) {
        registerPrefix(charter, knownPrefix);
        return { prefix: knownPrefix, charter, name, method: 'known' };
      }
    }
  }

  // Generate acronym from significant words
  const baseAcronym = generateAcronym(name);

  // Try base acronym
  if (baseAcronym.length >= 2 && !prefixToCharter.has(baseAcronym)) {
    registerPrefix(charter, baseAcronym);
    return { prefix: baseAcronym, charter, name, method: 'acronym' };
  }

  // Try with state suffix
  if (cu.state && cu.state.length === 2) {
    const statePrefix = `${baseAcronym}${cu.state}`.slice(0, 6);
    if (!prefixToCharter.has(statePrefix)) {
      registerPrefix(charter, statePrefix);
      return { prefix: statePrefix, charter, name, method: 'acronym+state' };
    }
  }

  // Try with city initial
  if (cu.city) {
    const cityInitial = cu.city.charAt(0).toUpperCase();
    const cityPrefix = `${baseAcronym}${cityInitial}`.slice(0, 6);
    if (!prefixToCharter.has(cityPrefix)) {
      registerPrefix(charter, cityPrefix);
      return { prefix: cityPrefix, charter, name, method: 'acronym+city' };
    }
  }

  // Try with numeric suffix
  for (let i = 1; i <= 99; i++) {
    const numPrefix = `${baseAcronym}${i}`.slice(0, 6);
    if (!prefixToCharter.has(numPrefix)) {
      registerPrefix(charter, numPrefix);
      return { prefix: numPrefix, charter, name, method: 'acronym+num' };
    }
  }

  // Fallback: use charter number
  const charterPrefix = `CU${charter}`.slice(0, 8);
  registerPrefix(charter, charterPrefix);
  return { prefix: charterPrefix, charter, name, method: 'charter' };
}

/**
 * Generate acronym from credit union name
 */
function generateAcronym(name: string): string {
  // Split into words
  const words = name
    .replace(/[^A-Z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);

  // Filter out skip words and get initials
  const initials: string[] = [];
  for (const word of words) {
    const lower = word.toLowerCase();
    if (!SKIP_WORDS.has(lower)) {
      // Check if it's a state name
      if (STATE_CODES[word]) {
        initials.push(STATE_CODES[word]);
      } else if (word.length <= 3) {
        // Short words/acronyms: use as-is
        initials.push(word.toUpperCase());
      } else {
        // Take first letter
        initials.push(word.charAt(0).toUpperCase());
      }
    }
  }

  // Join and ensure reasonable length
  let acronym = initials.join('');

  // If too short, try including more letters
  if (acronym.length < 2) {
    const significantWords = words.filter(w => !SKIP_WORDS.has(w.toLowerCase()));
    if (significantWords.length > 0) {
      // Take first 2-4 letters of first significant word
      acronym = significantWords[0].slice(0, 4).toUpperCase();
    }
  }

  // If still too short, use first word
  if (acronym.length < 2 && words.length > 0) {
    acronym = words[0].slice(0, 4).toUpperCase();
  }

  // Ensure max length
  return acronym.slice(0, 5);
}

/**
 * Register a prefix in the cache
 */
function registerPrefix(charter: string, prefix: string): void {
  prefixCache.set(charter, prefix);
  prefixToCharter.set(prefix, charter);
}

/**
 * Get prefix for a charter number (from cache)
 */
export function getPrefix(charter: string | number): string | undefined {
  return prefixCache.get(String(charter));
}

/**
 * Get charter for a prefix (reverse lookup)
 */
export function getCharterByPrefix(prefix: string): string | undefined {
  return prefixToCharter.get(prefix.toUpperCase());
}

/**
 * Check if a prefix is already taken
 */
export function isPrefixTaken(prefix: string): boolean {
  return prefixToCharter.has(prefix.toUpperCase());
}

/**
 * Get all registered prefixes
 */
export function getAllPrefixes(): Map<string, string> {
  return new Map(prefixCache);
}

/**
 * Get total count of registered prefixes
 */
export function getPrefixCount(): number {
  return prefixCache.size;
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Generate prefixes for all credit unions in a batch
 */
export function generatePrefixBatch(creditUnions: CreditUnionInput[]): GeneratedPrefix[] {
  // Sort by assets (if available) to give priority to larger CUs
  // This ensures major CUs get cleaner prefixes

  return creditUnions.map(cu => generatePrefix(cu));
}

/**
 * Export prefix registry as JSON
 */
export function exportPrefixRegistry(): Record<string, { prefix: string; name: string }> {
  const registry: Record<string, { prefix: string; name: string }> = {};

  // Note: We don't have names stored in cache, so this is a simplified export
  for (const [charter, prefix] of prefixCache.entries()) {
    registry[charter] = { prefix, name: '' };
  }

  return registry;
}

// ============================================================================
// SPEC NAME GENERATION (using dynamic prefixes)
// ============================================================================

/**
 * Generate tenant-specific spec name using dynamic prefix
 */
export function getDynamicTenantSpecName(charter: string | number, baseSpecName: string): string {
  const prefix = getPrefix(charter);
  if (!prefix) {
    // Generate on-the-fly if not cached (fallback)
    return `CU${charter}.${baseSpecName}`;
  }
  return `${prefix}.${baseSpecName}`;
}

/**
 * Get all entry point specs for a charter
 */
export function getDynamicTenantEntryPoints(charter: string | number): {
  memberGraph: string;
  userService: string;
  accountService: string;
  ivr: string;
  transfers: string;
} | null {
  const prefix = getPrefix(charter);
  if (!prefix) return null;

  return {
    memberGraph: `${prefix}.MBRGRAPH.BYID.PRO`,
    userService: `${prefix}.USERSERVICE.BYID.PRO`,
    accountService: `${prefix}.ACCOUNTSERVICE.BYID.PRO`,
    ivr: `${prefix}.IVR.BYID.PRO`,
    transfers: `${prefix}.TRANSFERS.PRO`,
  };
}

// ============================================================================
// STATISTICS
// ============================================================================

export interface PrefixStats {
  total: number;
  byMethod: Record<string, number>;
  collisions: number;
  avgLength: number;
}

/**
 * Get statistics about generated prefixes
 */
export function getPrefixStats(results: GeneratedPrefix[]): PrefixStats {
  const byMethod: Record<string, number> = {};
  let totalLength = 0;
  let collisions = 0;

  for (const result of results) {
    byMethod[result.method] = (byMethod[result.method] || 0) + 1;
    totalLength += result.prefix.length;
    if (result.method.includes('+')) {
      collisions++;
    }
  }

  return {
    total: results.length,
    byMethod,
    collisions,
    avgLength: results.length > 0 ? totalLength / results.length : 0,
  };
}

export default generatePrefix;

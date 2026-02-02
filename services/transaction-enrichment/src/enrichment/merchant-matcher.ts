/**
 * Merchant Matcher
 *
 * Matches transactions to known merchants using:
 * - Cloudflare KV merchant database
 * - Fuzzy string matching
 * - MCC code lookup
 * - Location data (lat/lon)
 */

export interface Merchant {
  guid: string;
  name: string;
  logo_url?: string;
  website_url?: string;
  mcc_codes: string[];
  name_patterns: string[];
  locations: MerchantLocation[];
}

export interface MerchantLocation {
  guid: string;
  merchant_guid: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
}

export interface MerchantMatchResult {
  merchant: Merchant | null;
  location: MerchantLocation | null;
  confidence: number;
  matched_by: 'EXACT' | 'PATTERN' | 'MCC' | 'LOCATION' | 'FUZZY';
}

export class MerchantMatcher {
  /**
   * Match transaction to merchant using multiple strategies
   */
  static async match(
    kvNamespace: KVNamespace,
    hints: string[],
    mccCode?: string,
    latitude?: number,
    longitude?: number
  ): Promise<MerchantMatchResult> {
    // Strategy 1: Exact name match
    for (const hint of hints) {
      const exactMatch = await this.matchExact(kvNamespace, hint);
      if (exactMatch) {
        return {
          merchant: exactMatch,
          location: null,
          confidence: 0.95,
          matched_by: 'EXACT',
        };
      }
    }

    // Strategy 2: Pattern match
    for (const hint of hints) {
      const patternMatch = await this.matchPattern(kvNamespace, hint);
      if (patternMatch) {
        return {
          merchant: patternMatch,
          location: null,
          confidence: 0.88,
          matched_by: 'PATTERN',
        };
      }
    }

    // Strategy 3: MCC code lookup
    if (mccCode) {
      const mccMatch = await this.matchMCC(kvNamespace, mccCode);
      if (mccMatch) {
        // If we also have location, try to find specific location
        let location = null;
        if (latitude && longitude) {
          location = await this.findNearestLocation(
            kvNamespace,
            mccMatch.guid,
            latitude,
            longitude
          );
        }

        return {
          merchant: mccMatch,
          location,
          confidence: location ? 0.82 : 0.70,
          matched_by: 'MCC',
        };
      }
    }

    // Strategy 4: Fuzzy name match
    if (hints.length > 0) {
      const fuzzyMatch = await this.matchFuzzy(kvNamespace, hints[0]);
      if (fuzzyMatch && fuzzyMatch.confidence > 0.75) {
        return fuzzyMatch;
      }
    }

    // No match found
    return {
      merchant: null,
      location: null,
      confidence: 0.0,
      matched_by: 'FUZZY',
    };
  }

  /**
   * Exact name match from KV
   * Key format: merchant:name:{normalized_name}
   */
  private static async matchExact(
    kv: KVNamespace,
    name: string
  ): Promise<Merchant | null> {
    const normalizedName = this.normalizeName(name);
    const key = `merchant:name:${normalizedName}`;

    const merchantGuid = await kv.get(key);
    if (!merchantGuid) return null;

    const merchant = await kv.get(`merchant:${merchantGuid}`, { type: 'json' });
    return merchant as Merchant | null;
  }

  /**
   * Pattern match - check if merchant name contains pattern
   * Key format: merchant:pattern:{pattern}
   */
  private static async matchPattern(
    kv: KVNamespace,
    name: string
  ): Promise<Merchant | null> {
    const normalized = this.normalizeName(name);

    // Common patterns to check
    const patterns = [
      // Extract first word if multi-word
      normalized.split(' ')[0],
      // Extract domain if looks like URL
      normalized.match(/([a-z0-9]+)\.(com|net|org)/)?.[1],
      // Remove common suffixes
      normalized.replace(/\s+(inc|llc|ltd|corp)$/i, ''),
    ].filter(Boolean);

    for (const pattern of patterns) {
      const key = `merchant:pattern:${pattern}`;
      const merchantGuid = await kv.get(key);

      if (merchantGuid) {
        const merchant = await kv.get(`merchant:${merchantGuid}`, { type: 'json' });
        if (merchant) return merchant as Merchant;
      }
    }

    return null;
  }

  /**
   * MCC code match
   * Key format: merchant:mcc:{mcc_code}
   * Note: MCC codes can map to multiple merchants, we pick the first
   */
  private static async matchMCC(
    kv: KVNamespace,
    mccCode: string
  ): Promise<Merchant | null> {
    const key = `merchant:mcc:${mccCode}`;
    const merchantGuid = await kv.get(key);

    if (!merchantGuid) return null;

    const merchant = await kv.get(`merchant:${merchantGuid}`, { type: 'json' });
    return merchant as Merchant | null;
  }

  /**
   * Find nearest merchant location using lat/lon
   * Uses geohashing for efficient spatial queries
   */
  private static async findNearestLocation(
    kv: KVNamespace,
    merchantGuid: string,
    latitude: number,
    longitude: number
  ): Promise<MerchantLocation | null> {
    // Get all locations for this merchant
    const locationsKey = `merchant:${merchantGuid}:locations`;
    const locationGuids = await kv.get(locationsKey, { type: 'json' }) as string[] | null;

    if (!locationGuids || locationGuids.length === 0) return null;

    // Find closest location
    let closestLocation: MerchantLocation | null = null;
    let closestDistance = Infinity;

    for (const locationGuid of locationGuids) {
      const location = await kv.get(`location:${locationGuid}`, { type: 'json' }) as MerchantLocation | null;

      if (location && location.latitude && location.longitude) {
        const distance = this.haversineDistance(
          latitude,
          longitude,
          location.latitude,
          location.longitude
        );

        if (distance < closestDistance) {
          closestDistance = distance;
          closestLocation = location;
        }
      }
    }

    // Only return if within 10 miles
    return closestDistance < 16.09 ? closestLocation : null;
  }

  /**
   * Fuzzy string matching using Levenshtein distance
   */
  private static async matchFuzzy(
    kv: KVNamespace,
    name: string
  ): Promise<MerchantMatchResult | null> {
    const normalized = this.normalizeName(name);

    // Get list of all merchant names (cached in KV)
    const allNamesKey = 'merchant:index:names';
    const allNames = await kv.get(allNamesKey, { type: 'json' }) as Array<{ name: string; guid: string }> | null;

    if (!allNames) return null;

    // Find best fuzzy match
    let bestMatch: { name: string; guid: string } | null = null;
    let bestScore = 0;

    for (const entry of allNames) {
      const score = this.similarityScore(normalized, this.normalizeName(entry.name));
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    if (!bestMatch || bestScore < 0.75) return null;

    const merchant = await kv.get(`merchant:${bestMatch.guid}`, { type: 'json' }) as Merchant | null;

    if (!merchant) return null;

    return {
      merchant,
      location: null,
      confidence: bestScore,
      matched_by: 'FUZZY',
    };
  }

  /**
   * Normalize merchant name for matching
   */
  private static normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  /**
   * Levenshtein distance-based similarity score (0-1)
   */
  private static similarityScore(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;

    const distance = this.levenshteinDistance(str1, str2);
    return 1 - distance / maxLength;
  }

  /**
   * Levenshtein distance algorithm
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate distance between two lat/lon points in kilometers
   * Uses Haversine formula
   */
  private static haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

/**
 * Seed merchant database with common merchants
 * Run this script to populate KV with merchant data
 */
export async function seedMerchantDatabase(kv: KVNamespace): Promise<void> {
  const commonMerchants: Merchant[] = [
    {
      guid: 'MER-AMAZON',
      name: 'Amazon',
      logo_url: 'https://logo.clearbit.com/amazon.com',
      website_url: 'https://amazon.com',
      mcc_codes: ['5942'], // Book stores
      name_patterns: ['AMZN', 'AMAZON', 'AMZ*'],
      locations: [],
    },
    {
      guid: 'MER-WALMART',
      name: 'Walmart',
      logo_url: 'https://logo.clearbit.com/walmart.com',
      website_url: 'https://walmart.com',
      mcc_codes: ['5411'], // Grocery stores
      name_patterns: ['WM SUPERCENTER', 'WAL-MART', 'WALMART'],
      locations: [],
    },
    {
      guid: 'MER-TARGET',
      name: 'Target',
      logo_url: 'https://logo.clearbit.com/target.com',
      website_url: 'https://target.com',
      mcc_codes: ['5310'], // Discount stores
      name_patterns: ['TARGET'],
      locations: [],
    },
    {
      guid: 'MER-STARBUCKS',
      name: 'Starbucks',
      logo_url: 'https://logo.clearbit.com/starbucks.com',
      website_url: 'https://starbucks.com',
      mcc_codes: ['5814'], // Fast food
      name_patterns: ['STARBUCKS'],
      locations: [],
    },
    {
      guid: 'MER-NETFLIX',
      name: 'Netflix',
      logo_url: 'https://logo.clearbit.com/netflix.com',
      website_url: 'https://netflix.com',
      mcc_codes: ['4899'], // Cable & other services
      name_patterns: ['NETFLIX'],
      locations: [],
    },
    {
      guid: 'MER-SPOTIFY',
      name: 'Spotify',
      logo_url: 'https://logo.clearbit.com/spotify.com',
      website_url: 'https://spotify.com',
      mcc_codes: ['5815'], // Digital goods
      name_patterns: ['SPOTIFY'],
      locations: [],
    },
    // Add more merchants...
  ];

  // Write merchants to KV
  for (const merchant of commonMerchants) {
    // Main merchant record
    await kv.put(`merchant:${merchant.guid}`, JSON.stringify(merchant));

    // Name index
    const normalizedName = merchant.name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    await kv.put(`merchant:name:${normalizedName}`, merchant.guid);

    // Pattern indices
    for (const pattern of merchant.name_patterns) {
      const normalizedPattern = pattern.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      await kv.put(`merchant:pattern:${normalizedPattern}`, merchant.guid);
    }

    // MCC indices
    for (const mcc of merchant.mcc_codes) {
      await kv.put(`merchant:mcc:${mcc}`, merchant.guid);
    }
  }

  // Build name index for fuzzy matching
  const nameIndex = commonMerchants.map(m => ({ name: m.name, guid: m.guid }));
  await kv.put('merchant:index:names', JSON.stringify(nameIndex));

  console.log(`Seeded ${commonMerchants.length} merchants to KV`);
}

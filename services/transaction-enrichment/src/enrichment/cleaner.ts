/**
 * Description Cleaner
 *
 * Transforms raw bank descriptions into human-readable text
 * Example: "AMZN MKTP US*2X3Y4Z5W6" → "Amazon Marketplace"
 */

interface CleaningResult {
  cleaned: string;
  merchant_hints: string[];
  location_hints: string[];
}

export class DescriptionCleaner {
  // Common patterns to remove
  private static NOISE_PATTERNS = [
    /\d{10,}/g,                    // Long transaction IDs
    /\*{2,}\d+/g,                  // Masked card numbers
    /[*#]{2,}/g,                   // Special character sequences
    /\s+POS\s+/gi,                 // POS indicators
    /\s+PURCHASE\s+/gi,            // PURCHASE indicators
    /\s+DEBIT\s+CARD\s+/gi,        // DEBIT CARD text
    /\s+\d{2}\/\d{2}\s+/g,         // Dates
    /\s{2,}/g,                     // Multiple spaces
  ];

  // Known merchant patterns
  private static MERCHANT_PATTERNS: Record<string, string> = {
    'AMZN MKTP': 'Amazon Marketplace',
    'AMZN': 'Amazon',
    'WM SUPERCENTER': 'Walmart',
    'WAL-MART': 'Walmart',
    'TARGET': 'Target',
    'COSTCO': 'Costco',
    'SAMS CLUB': "Sam's Club",
    'WHOLEFDS': 'Whole Foods',
    'TRADER JOE': "Trader Joe's",
    'STARBUCKS': 'Starbucks',
    'DUNKIN': 'Dunkin',
    'MCDONALDS': "McDonald's",
    'CHICK-FIL-A': 'Chick-fil-A',
    'CHIPOTLE': 'Chipotle',
    'NETFLIX': 'Netflix',
    'SPOTIFY': 'Spotify',
    'APPLE.COM': 'Apple',
    'GOOGLE': 'Google',
    'PAYPAL': 'PayPal',
    'VENMO': 'Venmo',
    'UBER': 'Uber',
    'LYFT': 'Lyft',
    'SHELL OIL': 'Shell',
    'EXXON': 'ExxonMobil',
    'CHEVRON': 'Chevron',
    'BP#': 'BP',
    'CIRCLE K': 'Circle K',
    '7-ELEVEN': '7-Eleven',
    'CVS': 'CVS Pharmacy',
    'WALGREENS': 'Walgreens',
    'PUBLIX': 'Publix',
    'KROGER': 'Kroger',
    'SAFEWAY': 'Safeway',
  };

  // Location indicators
  private static LOCATION_PATTERNS = [
    /\b([A-Z]{2})\s*$/,           // State codes at end
    /\b(\d{5})\b/,                 // ZIP codes
    /\b(FL|CA|TX|NY|IL)\b/,       // Common states
  ];

  static clean(raw: string): CleaningResult {
    let cleaned = raw.toUpperCase();
    const merchant_hints: string[] = [];
    const location_hints: string[] = [];

    // Extract location hints before cleaning
    for (const pattern of this.LOCATION_PATTERNS) {
      const match = cleaned.match(pattern);
      if (match) {
        location_hints.push(match[1]);
      }
    }

    // Remove noise
    for (const pattern of this.NOISE_PATTERNS) {
      cleaned = cleaned.replace(pattern, ' ');
    }

    // Check for known merchants
    for (const [pattern, name] of Object.entries(this.MERCHANT_PATTERNS)) {
      if (cleaned.includes(pattern)) {
        merchant_hints.push(name);
        cleaned = name; // Replace with clean name
        break;
      }
    }

    // Clean up whitespace
    cleaned = cleaned.trim().replace(/\s+/g, ' ');

    // Title case
    cleaned = this.toTitleCase(cleaned);

    return {
      cleaned,
      merchant_hints,
      location_hints,
    };
  }

  private static toTitleCase(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Extract merchant name from description using NLP patterns
   */
  static extractMerchantName(description: string): string | null {
    // Remove common prefixes
    let cleaned = description
      .replace(/^(PURCHASE|DEBIT|CREDIT|POS|ACH)\s+/i, '')
      .trim();

    // Extract before location indicators
    const parts = cleaned.split(/\s+(FL|CA|TX|NY|IL|\d{5})\b/);
    if (parts.length > 0) {
      cleaned = parts[0].trim();
    }

    // Extract before transaction IDs
    const beforeId = cleaned.split(/\s+\d{10,}/)[0];
    if (beforeId) {
      cleaned = beforeId.trim();
    }

    return cleaned.length > 2 ? cleaned : null;
  }

  /**
   * Detect if description indicates a fee
   */
  static isFee(description: string): boolean {
    const feePatterns = [
      /\bFEE\b/i,
      /\bCHARGE\b/i,
      /\bOVERDRAFT\b/i,
      /\bNSF\b/i,
      /\bLATE\b/i,
      /\bPENALTY\b/i,
      /\bMONTHLY SERVICE\b/i,
    ];

    return feePatterns.some(pattern => pattern.test(description));
  }

  /**
   * Detect if description indicates ATM withdrawal
   */
  static isATM(description: string): boolean {
    return /\b(ATM|CASH WITHDRAW)/i.test(description);
  }

  /**
   * Detect if description indicates transfer
   */
  static isTransfer(description: string): boolean {
    return /\b(TRANSFER|XFER|FROM|TO)\b/i.test(description);
  }

  /**
   * Detect if description indicates check
   */
  static isCheck(description: string): boolean {
    return /\b(CHECK|CHK)\b/i.test(description);
  }
}

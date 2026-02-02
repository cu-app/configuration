/**
 * Pattern Detector
 *
 * Detects recurring patterns in transactions:
 * - Subscriptions (Netflix, Spotify, etc.)
 * - Bill payments (utilities, insurance, etc.)
 * - Recurring payments (gym memberships, loan payments, etc.)
 */

export interface RecurringPattern {
  pattern_id: string;
  merchant_guid?: string;
  amount: number;
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  next_expected_date?: string; // ISO date
  confidence: number;
  detected_occurrences: number;
  last_occurrence_date: string;
}

export interface TransactionHistory {
  guid: string;
  account_guid: string;
  merchant_guid?: string;
  amount: number;
  date: string; // ISO date
  description: string;
}

export class PatternDetector {
  /**
   * Detect if transaction is part of a subscription
   */
  static isSubscription(
    merchantGuid?: string,
    amount?: number,
    history?: TransactionHistory[]
  ): boolean {
    // Known subscription merchants
    const knownSubscriptionMerchants = [
      'MER-NETFLIX',
      'MER-SPOTIFY',
      'MER-HULU',
      'MER-DISNEY',
      'MER-APPLE-MUSIC',
      'MER-AMAZON-PRIME',
      'MER-HBO',
      'MER-YOUTUBE',
      'MER-LINKEDIN',
      'MER-GITHUB',
      'MER-ADOBE',
      'MER-MICROSOFT365',
      'MER-DROPBOX',
      'MER-ICLOUD',
    ];

    if (merchantGuid && knownSubscriptionMerchants.includes(merchantGuid)) {
      return true;
    }

    // Check if amount and history suggest subscription pattern
    if (amount && history && history.length >= 3) {
      const pattern = this.detectRecurringPattern(history);
      if (pattern && pattern.frequency === 'MONTHLY' && pattern.confidence > 0.85) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect if transaction is bill payment
   */
  static isBillPay(description: string, merchantGuid?: string): boolean {
    const billPayPatterns = [
      /\bBILL\s+PAY(MENT)?\b/i,
      /\bPAYMENT\s+TO\b/i,
      /\bELECTRIC(ITY)?\b/i,
      /\bWATER\b/i,
      /\bGAS\s+UTIL/i,
      /\bCARD\s+SERVICES\b/i,
      /\bINSURANCE\b/i,
      /\bMORTGAGE\b/i,
      /\bAUTO\s+LOAN\b/i,
      /\bSTUDENT\s+LOAN\b/i,
    ];

    return billPayPatterns.some(pattern => pattern.test(description));
  }

  /**
   * Detect if transaction is recurring
   * Looks for patterns in historical transactions
   */
  static isRecurring(
    merchantGuid?: string,
    amount?: number,
    history?: TransactionHistory[]
  ): boolean {
    if (!history || history.length < 2) return false;

    const pattern = this.detectRecurringPattern(history);
    return pattern !== null && pattern.confidence > 0.75;
  }

  /**
   * Detect recurring payment pattern from transaction history
   */
  static detectRecurringPattern(
    history: TransactionHistory[]
  ): RecurringPattern | null {
    if (history.length < 2) return null;

    // Sort by date
    const sorted = [...history].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group by merchant and amount
    const groups = this.groupByMerchantAndAmount(sorted);

    // Find best recurring pattern
    let bestPattern: RecurringPattern | null = null;
    let bestScore = 0;

    for (const group of groups) {
      if (group.transactions.length < 2) continue;

      const pattern = this.analyzeGroup(group);
      if (pattern && pattern.confidence > bestScore) {
        bestScore = pattern.confidence;
        bestPattern = pattern;
      }
    }

    return bestPattern;
  }

  /**
   * Group transactions by merchant and similar amount
   */
  private static groupByMerchantAndAmount(
    transactions: TransactionHistory[]
  ): Array<{ merchant_guid?: string; amount: number; transactions: TransactionHistory[] }> {
    const groups = new Map<string, TransactionHistory[]>();

    for (const txn of transactions) {
      // Key: merchant + rounded amount
      const amountRounded = Math.round(Math.abs(txn.amount) * 100) / 100;
      const key = `${txn.merchant_guid || 'UNKNOWN'}:${amountRounded}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(txn);
    }

    return Array.from(groups.entries()).map(([key, transactions]) => {
      const [merchant_guid, amountStr] = key.split(':');
      return {
        merchant_guid: merchant_guid !== 'UNKNOWN' ? merchant_guid : undefined,
        amount: parseFloat(amountStr),
        transactions,
      };
    });
  }

  /**
   * Analyze a group of similar transactions for recurring pattern
   */
  private static analyzeGroup(group: {
    merchant_guid?: string;
    amount: number;
    transactions: TransactionHistory[];
  }): RecurringPattern | null {
    const txns = group.transactions;
    if (txns.length < 2) return null;

    // Calculate intervals between transactions (in days)
    const intervals: number[] = [];
    for (let i = 1; i < txns.length; i++) {
      const date1 = new Date(txns[i - 1].date).getTime();
      const date2 = new Date(txns[i].date).getTime();
      const daysDiff = Math.round((date2 - date1) / (1000 * 60 * 60 * 24));
      intervals.push(daysDiff);
    }

    // Detect frequency
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const frequency = this.detectFrequency(avgInterval);

    if (!frequency) return null;

    // Calculate confidence based on consistency
    const intervalVariance = this.calculateVariance(intervals);
    const confidence = this.calculateConfidence(
      intervals.length,
      intervalVariance,
      avgInterval
    );

    // Predict next occurrence
    const lastDate = new Date(txns[txns.length - 1].date);
    const nextDate = new Date(lastDate.getTime() + avgInterval * 24 * 60 * 60 * 1000);

    return {
      pattern_id: `PAT-${group.merchant_guid || 'UNKNOWN'}-${Date.now()}`,
      merchant_guid: group.merchant_guid,
      amount: group.amount,
      frequency,
      next_expected_date: nextDate.toISOString().split('T')[0],
      confidence,
      detected_occurrences: txns.length,
      last_occurrence_date: txns[txns.length - 1].date,
    };
  }

  /**
   * Detect frequency from average interval
   */
  private static detectFrequency(
    avgDays: number
  ): 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | null {
    // Weekly: 7 days ± 2 days
    if (avgDays >= 5 && avgDays <= 9) {
      return 'WEEKLY';
    }

    // Biweekly: 14 days ± 3 days
    if (avgDays >= 11 && avgDays <= 17) {
      return 'BIWEEKLY';
    }

    // Monthly: 30 days ± 5 days
    if (avgDays >= 25 && avgDays <= 35) {
      return 'MONTHLY';
    }

    // Quarterly: 90 days ± 10 days
    if (avgDays >= 80 && avgDays <= 100) {
      return 'QUARTERLY';
    }

    // Annual: 365 days ± 15 days
    if (avgDays >= 350 && avgDays <= 380) {
      return 'ANNUAL';
    }

    return null;
  }

  /**
   * Calculate variance of intervals
   */
  private static calculateVariance(intervals: number[]): number {
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const squaredDiffs = intervals.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / intervals.length;
  }

  /**
   * Calculate confidence score (0-1)
   * Based on:
   * - Number of occurrences
   * - Consistency (low variance)
   * - Reasonable interval
   */
  private static calculateConfidence(
    occurrences: number,
    variance: number,
    avgInterval: number
  ): number {
    // More occurrences = higher confidence
    let occurrenceScore = Math.min(occurrences / 6, 1.0); // Max at 6 occurrences

    // Lower variance = higher confidence
    const maxVariance = 10; // days
    let consistencyScore = Math.max(0, 1 - variance / maxVariance);

    // Reasonable interval (not too short, not too long)
    let intervalScore = 1.0;
    if (avgInterval < 7) intervalScore = 0.7; // Too frequent
    if (avgInterval > 365) intervalScore = 0.6; // Too infrequent

    // Weighted average
    return (
      occurrenceScore * 0.4 +
      consistencyScore * 0.4 +
      intervalScore * 0.2
    );
  }

  /**
   * Get human-readable description of pattern
   */
  static describePattern(pattern: RecurringPattern): string {
    const amountStr = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(pattern.amount));

    const frequencyStr = pattern.frequency.toLowerCase();

    return `${amountStr} ${frequencyStr} payment (${pattern.detected_occurrences} occurrences detected)`;
  }

  /**
   * Check if next payment is due soon
   */
  static isPaymentDueSoon(pattern: RecurringPattern, daysThreshold = 3): boolean {
    if (!pattern.next_expected_date) return false;

    const nextDate = new Date(pattern.next_expected_date);
    const today = new Date();
    const daysDiff = Math.round(
      (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysDiff >= 0 && daysDiff <= daysThreshold;
  }

  /**
   * Check if payment is overdue
   */
  static isPaymentOverdue(pattern: RecurringPattern, daysTolerance = 5): boolean {
    if (!pattern.next_expected_date) return false;

    const nextDate = new Date(pattern.next_expected_date);
    const today = new Date();
    const daysDiff = Math.round(
      (today.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysDiff > daysTolerance;
  }
}

/**
 * Subscription detection service
 * Tracks subscription across all accounts
 */
export class SubscriptionTracker {
  /**
   * Detect all subscriptions from transaction history
   */
  static async detectSubscriptions(
    kv: KVNamespace,
    accountGuid: string,
    transactions: TransactionHistory[]
  ): Promise<RecurringPattern[]> {
    const patterns: RecurringPattern[] = [];

    // Group by merchant
    const merchantGroups = new Map<string, TransactionHistory[]>();
    for (const txn of transactions) {
      if (!txn.merchant_guid) continue;

      if (!merchantGroups.has(txn.merchant_guid)) {
        merchantGroups.set(txn.merchant_guid, []);
      }
      merchantGroups.get(txn.merchant_guid)!.push(txn);
    }

    // Analyze each merchant group
    for (const [merchantGuid, merchantTxns] of merchantGroups) {
      if (merchantTxns.length < 2) continue;

      const pattern = PatternDetector.detectRecurringPattern(merchantTxns);
      if (pattern && pattern.frequency === 'MONTHLY' && pattern.confidence > 0.75) {
        patterns.push(pattern);

        // Store pattern in KV for future reference
        await kv.put(
          `subscription:${accountGuid}:${pattern.pattern_id}`,
          JSON.stringify(pattern)
        );
      }
    }

    return patterns;
  }

  /**
   * Get all active subscriptions for account
   */
  static async getActiveSubscriptions(
    kv: KVNamespace,
    accountGuid: string
  ): Promise<RecurringPattern[]> {
    const patterns: RecurringPattern[] = [];

    // List all subscription keys for this account
    const prefix = `subscription:${accountGuid}:`;
    const list = await kv.list({ prefix });

    for (const key of list.keys) {
      const pattern = await kv.get(key.name, { type: 'json' }) as RecurringPattern | null;
      if (pattern) {
        patterns.push(pattern);
      }
    }

    return patterns;
  }

  /**
   * Cancel subscription tracking
   */
  static async cancelSubscription(
    kv: KVNamespace,
    accountGuid: string,
    patternId: string
  ): Promise<void> {
    await kv.delete(`subscription:${accountGuid}:${patternId}`);
  }
}

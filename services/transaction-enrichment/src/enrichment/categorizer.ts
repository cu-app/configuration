/**
 * ML-Powered Transaction Categorizer
 *
 * Uses TensorFlow.js at the edge to categorize transactions
 * Trained on historical transaction data + free datasets
 */

import * as tf from '@tensorflow/tfjs';

export interface CategoryPrediction {
  guid: string;
  name: string;
  confidence: number;
  parent_guid?: string;
  parent_name?: string;
}

export interface CategoryFeatures {
  cleaned_description: string;
  merchant_name?: string;
  mcc_code?: string;
  amount: number;
  day_of_week: number;
  hour_of_day?: number;
}

/**
 * Standard MX-compatible category taxonomy
 */
export const CATEGORY_TAXONOMY = {
  'CAT-INCOME': { name: 'Income', parent: null },
  'CAT-INCOME-SALARY': { name: 'Salary', parent: 'CAT-INCOME' },
  'CAT-INCOME-INVEST': { name: 'Investment Income', parent: 'CAT-INCOME' },

  'CAT-TRANSFER': { name: 'Transfer', parent: null },
  'CAT-TRANSFER-INT': { name: 'Internal Transfer', parent: 'CAT-TRANSFER' },
  'CAT-TRANSFER-EXT': { name: 'External Transfer', parent: 'CAT-TRANSFER' },

  'CAT-FOOD': { name: 'Food & Dining', parent: null },
  'CAT-FOOD-GROCERY': { name: 'Groceries', parent: 'CAT-FOOD' },
  'CAT-FOOD-REST': { name: 'Restaurants', parent: 'CAT-FOOD' },
  'CAT-FOOD-FAST': { name: 'Fast Food', parent: 'CAT-FOOD' },
  'CAT-FOOD-COFFEE': { name: 'Coffee Shops', parent: 'CAT-FOOD' },

  'CAT-SHOPPING': { name: 'Shopping', parent: null },
  'CAT-SHOPPING-RETAIL': { name: 'Retail', parent: 'CAT-SHOPPING' },
  'CAT-SHOPPING-ONLINE': { name: 'Online Shopping', parent: 'CAT-SHOPPING' },
  'CAT-SHOPPING-CLOTHING': { name: 'Clothing', parent: 'CAT-SHOPPING' },
  'CAT-SHOPPING-ELECTRONICS': { name: 'Electronics', parent: 'CAT-SHOPPING' },

  'CAT-GAS': { name: 'Gas & Fuel', parent: null },

  'CAT-AUTO': { name: 'Auto & Transport', parent: null },
  'CAT-AUTO-PAYMENT': { name: 'Auto Payment', parent: 'CAT-AUTO' },
  'CAT-AUTO-INSURANCE': { name: 'Auto Insurance', parent: 'CAT-AUTO' },
  'CAT-AUTO-SERVICE': { name: 'Auto Service', parent: 'CAT-AUTO' },
  'CAT-AUTO-PARKING': { name: 'Parking', parent: 'CAT-AUTO' },
  'CAT-AUTO-PUBLICTRANS': { name: 'Public Transportation', parent: 'CAT-AUTO' },

  'CAT-BILLS': { name: 'Bills & Utilities', parent: null },
  'CAT-BILLS-ELECTRIC': { name: 'Electric', parent: 'CAT-BILLS' },
  'CAT-BILLS-WATER': { name: 'Water', parent: 'CAT-BILLS' },
  'CAT-BILLS-GAS': { name: 'Gas Utility', parent: 'CAT-BILLS' },
  'CAT-BILLS-PHONE': { name: 'Phone', parent: 'CAT-BILLS' },
  'CAT-BILLS-INTERNET': { name: 'Internet', parent: 'CAT-BILLS' },
  'CAT-BILLS-CABLE': { name: 'Cable & Satellite', parent: 'CAT-BILLS' },

  'CAT-ENTERTAINMENT': { name: 'Entertainment', parent: null },
  'CAT-ENT-STREAMING': { name: 'Streaming Services', parent: 'CAT-ENTERTAINMENT' },
  'CAT-ENT-MOVIES': { name: 'Movies & DVDs', parent: 'CAT-ENTERTAINMENT' },
  'CAT-ENT-MUSIC': { name: 'Music', parent: 'CAT-ENTERTAINMENT' },
  'CAT-ENT-GAMES': { name: 'Games', parent: 'CAT-ENTERTAINMENT' },

  'CAT-HEALTH': { name: 'Health & Fitness', parent: null },
  'CAT-HEALTH-DOCTOR': { name: 'Doctor', parent: 'CAT-HEALTH' },
  'CAT-HEALTH-PHARMACY': { name: 'Pharmacy', parent: 'CAT-HEALTH' },
  'CAT-HEALTH-GYM': { name: 'Gym', parent: 'CAT-HEALTH' },
  'CAT-HEALTH-INSURANCE': { name: 'Health Insurance', parent: 'CAT-HEALTH' },

  'CAT-HOUSING': { name: 'Housing', parent: null },
  'CAT-HOUSING-RENT': { name: 'Rent', parent: 'CAT-HOUSING' },
  'CAT-HOUSING-MORTGAGE': { name: 'Mortgage', parent: 'CAT-HOUSING' },
  'CAT-HOUSING-INSURANCE': { name: 'Home Insurance', parent: 'CAT-HOUSING' },
  'CAT-HOUSING-MAINT': { name: 'Home Maintenance', parent: 'CAT-HOUSING' },

  'CAT-TRAVEL': { name: 'Travel', parent: null },
  'CAT-TRAVEL-HOTEL': { name: 'Hotel', parent: 'CAT-TRAVEL' },
  'CAT-TRAVEL-FLIGHT': { name: 'Flight', parent: 'CAT-TRAVEL' },
  'CAT-TRAVEL-RENTAL': { name: 'Car Rental', parent: 'CAT-TRAVEL' },

  'CAT-FEES': { name: 'Fees & Charges', parent: null },
  'CAT-FEES-BANK': { name: 'Bank Fee', parent: 'CAT-FEES' },
  'CAT-FEES-ATM': { name: 'ATM Fee', parent: 'CAT-FEES' },
  'CAT-FEES-LATE': { name: 'Late Fee', parent: 'CAT-FEES' },

  'CAT-EDUCATION': { name: 'Education', parent: null },
  'CAT-EDU-TUITION': { name: 'Tuition', parent: 'CAT-EDUCATION' },
  'CAT-EDU-BOOKS': { name: 'Books & Supplies', parent: 'CAT-EDUCATION' },

  'CAT-PERSONAL': { name: 'Personal Care', parent: null },
  'CAT-PERSONAL-HAIR': { name: 'Hair & Beauty', parent: 'CAT-PERSONAL' },
  'CAT-PERSONAL-LAUNDRY': { name: 'Laundry', parent: 'CAT-PERSONAL' },

  'CAT-PETS': { name: 'Pets', parent: null },
  'CAT-PETS-VET': { name: 'Veterinary', parent: 'CAT-PETS' },
  'CAT-PETS-FOOD': { name: 'Pet Food', parent: 'CAT-PETS' },

  'CAT-UNCATEGORIZED': { name: 'Uncategorized', parent: null },
};

export class TransactionCategorizer {
  private model: tf.LayersModel | null = null;
  private vocabulary: Map<string, number> = new Map();
  private maxSequenceLength = 20;

  /**
   * Rule-based categorization (fast path)
   * Used for obvious cases before hitting ML model
   */
  static categorizeByRules(features: CategoryFeatures): CategoryPrediction | null {
    const desc = features.cleaned_description.toLowerCase();
    const merchant = features.merchant_name?.toLowerCase() || '';
    const amount = features.amount;

    // Income patterns
    if (amount > 0) {
      if (desc.includes('payroll') || desc.includes('salary') || desc.includes('direct deposit')) {
        return {
          guid: 'CAT-INCOME-SALARY',
          name: 'Salary',
          confidence: 0.95,
          parent_guid: 'CAT-INCOME',
          parent_name: 'Income',
        };
      }
      if (desc.includes('dividend') || desc.includes('interest')) {
        return {
          guid: 'CAT-INCOME-INVEST',
          name: 'Investment Income',
          confidence: 0.90,
          parent_guid: 'CAT-INCOME',
          parent_name: 'Income',
        };
      }
    }

    // Transfers
    if (desc.includes('transfer') || desc.includes('xfer')) {
      if (desc.includes('from') || desc.includes('to')) {
        return {
          guid: 'CAT-TRANSFER-INT',
          name: 'Internal Transfer',
          confidence: 0.92,
          parent_guid: 'CAT-TRANSFER',
          parent_name: 'Transfer',
        };
      }
    }

    // Fees
    if (desc.includes('fee') || desc.includes('overdraft') || desc.includes('nsf')) {
      return {
        guid: 'CAT-FEES-BANK',
        name: 'Bank Fee',
        confidence: 0.93,
        parent_guid: 'CAT-FEES',
        parent_name: 'Fees & Charges',
      };
    }

    // Streaming services
    if (merchant.includes('netflix') || merchant.includes('spotify') ||
        merchant.includes('hulu') || merchant.includes('disney')) {
      return {
        guid: 'CAT-ENT-STREAMING',
        name: 'Streaming Services',
        confidence: 0.94,
        parent_guid: 'CAT-ENTERTAINMENT',
        parent_name: 'Entertainment',
      };
    }

    // Groceries
    if (merchant.includes('walmart') || merchant.includes('target') ||
        merchant.includes('publix') || merchant.includes('kroger') ||
        merchant.includes('whole foods') || merchant.includes('trader joe')) {
      return {
        guid: 'CAT-FOOD-GROCERY',
        name: 'Groceries',
        confidence: 0.88,
        parent_guid: 'CAT-FOOD',
        parent_name: 'Food & Dining',
      };
    }

    // Fast food
    if (merchant.includes('mcdonalds') || merchant.includes('burger king') ||
        merchant.includes('wendys') || merchant.includes('taco bell') ||
        merchant.includes('chick-fil-a') || merchant.includes('chipotle')) {
      return {
        guid: 'CAT-FOOD-FAST',
        name: 'Fast Food',
        confidence: 0.91,
        parent_guid: 'CAT-FOOD',
        parent_name: 'Food & Dining',
      };
    }

    // Coffee shops
    if (merchant.includes('starbucks') || merchant.includes('dunkin')) {
      return {
        guid: 'CAT-FOOD-COFFEE',
        name: 'Coffee Shops',
        confidence: 0.93,
        parent_guid: 'CAT-FOOD',
        parent_name: 'Food & Dining',
      };
    }

    // Gas stations
    if (merchant.includes('shell') || merchant.includes('exxon') ||
        merchant.includes('chevron') || merchant.includes('bp') ||
        merchant.includes('circle k') || merchant.includes('7-eleven')) {
      return {
        guid: 'CAT-GAS',
        name: 'Gas & Fuel',
        confidence: 0.90,
        parent_guid: null,
        parent_name: null,
      };
    }

    // Pharmacies
    if (merchant.includes('cvs') || merchant.includes('walgreens')) {
      return {
        guid: 'CAT-HEALTH-PHARMACY',
        name: 'Pharmacy',
        confidence: 0.89,
        parent_guid: 'CAT-HEALTH',
        parent_name: 'Health & Fitness',
      };
    }

    // Amazon
    if (merchant.includes('amazon')) {
      return {
        guid: 'CAT-SHOPPING-ONLINE',
        name: 'Online Shopping',
        confidence: 0.87,
        parent_guid: 'CAT-SHOPPING',
        parent_name: 'Shopping',
      };
    }

    // Use MCC code for fallback categorization
    if (features.mcc_code) {
      const mccCategory = this.categorizeMCC(features.mcc_code);
      if (mccCategory) return mccCategory;
    }

    return null; // Let ML model handle it
  }

  /**
   * MCC (Merchant Category Code) to category mapping
   */
  private static categorizeMCC(mcc: string): CategoryPrediction | null {
    const mccNum = parseInt(mcc);

    // Grocery stores
    if (mccNum >= 5411 && mccNum <= 5499) {
      return {
        guid: 'CAT-FOOD-GROCERY',
        name: 'Groceries',
        confidence: 0.82,
        parent_guid: 'CAT-FOOD',
        parent_name: 'Food & Dining',
      };
    }

    // Restaurants
    if (mccNum >= 5812 && mccNum <= 5814) {
      return {
        guid: 'CAT-FOOD-REST',
        name: 'Restaurants',
        confidence: 0.80,
        parent_guid: 'CAT-FOOD',
        parent_name: 'Food & Dining',
      };
    }

    // Gas stations
    if (mccNum >= 5541 && mccNum <= 5542) {
      return {
        guid: 'CAT-GAS',
        name: 'Gas & Fuel',
        confidence: 0.83,
        parent_guid: null,
        parent_name: null,
      };
    }

    // Hotels
    if (mccNum >= 3500 && mccNum <= 3999) {
      return {
        guid: 'CAT-TRAVEL-HOTEL',
        name: 'Hotel',
        confidence: 0.84,
        parent_guid: 'CAT-TRAVEL',
        parent_name: 'Travel',
      };
    }

    // Airlines
    if (mccNum >= 3000 && mccNum <= 3299) {
      return {
        guid: 'CAT-TRAVEL-FLIGHT',
        name: 'Flight',
        confidence: 0.85,
        parent_guid: 'CAT-TRAVEL',
        parent_name: 'Travel',
      };
    }

    return null;
  }

  /**
   * Load ML model from Durable Object storage
   * Model is trained on historical transaction data
   */
  async loadModel(modelUrl: string): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(modelUrl);
      console.log('TransactionCategorizer model loaded');
    } catch (error) {
      console.error('Failed to load ML model:', error);
      // Fall back to rule-based only
    }
  }

  /**
   * Tokenize text for ML model input
   */
  private tokenize(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const tokens: number[] = [];

    for (const word of words) {
      if (this.vocabulary.has(word)) {
        tokens.push(this.vocabulary.get(word)!);
      }
    }

    // Pad or truncate to max sequence length
    while (tokens.length < this.maxSequenceLength) {
      tokens.push(0); // padding
    }

    return tokens.slice(0, this.maxSequenceLength);
  }

  /**
   * ML-based prediction (used when rules don't match)
   */
  async predictML(features: CategoryFeatures): Promise<CategoryPrediction> {
    if (!this.model) {
      // No model loaded, return uncategorized
      return {
        guid: 'CAT-UNCATEGORIZED',
        name: 'Uncategorized',
        confidence: 0.0,
      };
    }

    try {
      // Prepare input features
      const text = `${features.cleaned_description} ${features.merchant_name || ''}`;
      const tokens = this.tokenize(text);

      // Additional features
      const amountNormalized = Math.log(Math.abs(features.amount) + 1) / 10;
      const dayOfWeek = features.day_of_week / 7;
      const hourOfDay = (features.hour_of_day || 12) / 24;

      // Create tensor
      const inputTensor = tf.tensor2d([[
        ...tokens,
        amountNormalized,
        dayOfWeek,
        hourOfDay,
      ]]);

      // Predict
      const predictions = this.model.predict(inputTensor) as tf.Tensor;
      const probabilities = await predictions.data();

      // Get top prediction
      const maxIdx = probabilities.indexOf(Math.max(...Array.from(probabilities)));
      const confidence = probabilities[maxIdx];

      // Map index to category (this would be learned during training)
      const categoryGuid = Object.keys(CATEGORY_TAXONOMY)[maxIdx] || 'CAT-UNCATEGORIZED';
      const category = CATEGORY_TAXONOMY[categoryGuid];

      inputTensor.dispose();
      predictions.dispose();

      return {
        guid: categoryGuid,
        name: category.name,
        confidence,
        parent_guid: category.parent || undefined,
        parent_name: category.parent ? CATEGORY_TAXONOMY[category.parent].name : undefined,
      };
    } catch (error) {
      console.error('ML prediction failed:', error);
      return {
        guid: 'CAT-UNCATEGORIZED',
        name: 'Uncategorized',
        confidence: 0.0,
      };
    }
  }

  /**
   * Main categorization method
   * Tries rules first, falls back to ML
   */
  async categorize(features: CategoryFeatures): Promise<CategoryPrediction> {
    // Try rule-based first (fast)
    const ruleResult = TransactionCategorizer.categorizeByRules(features);
    if (ruleResult && ruleResult.confidence > 0.85) {
      return ruleResult;
    }

    // Fall back to ML model
    const mlResult = await this.predictML(features);

    // If ML has higher confidence, use it
    if (ruleResult && mlResult.confidence > ruleResult.confidence) {
      return mlResult;
    }

    return ruleResult || mlResult;
  }
}

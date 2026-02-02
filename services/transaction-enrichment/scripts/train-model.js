/**
 * ML Model Training Script
 *
 * Trains TensorFlow.js model for transaction categorization
 * Run: npm run train
 */

const tf = require('@tensorflow/tfjs');
const fs = require('fs');
const path = require('path');

/**
 * Training data format
 * In production, load from historical transaction database
 */
const TRAINING_DATA = [
  // Income
  { description: 'PAYROLL DIRECT DEPOSIT', amount: 3500, category: 'CAT-INCOME-SALARY' },
  { description: 'SALARY PAYMENT', amount: 4200, category: 'CAT-INCOME-SALARY' },
  { description: 'DIVIDEND PAYMENT', amount: 150, category: 'CAT-INCOME-INVEST' },

  // Groceries
  { description: 'WALMART SUPERCENTER', amount: -87.43, category: 'CAT-FOOD-GROCERY' },
  { description: 'TARGET STORE', amount: -65.12, category: 'CAT-FOOD-GROCERY' },
  { description: 'PUBLIX SUPERMARKET', amount: -102.56, category: 'CAT-FOOD-GROCERY' },
  { description: 'WHOLE FOODS MARKET', amount: -78.90, category: 'CAT-FOOD-GROCERY' },
  { description: 'TRADER JOES', amount: -45.67, category: 'CAT-FOOD-GROCERY' },

  // Restaurants
  { description: 'CHIPOTLE MEXICAN GRILL', amount: -12.50, category: 'CAT-FOOD-FAST' },
  { description: 'MCDONALDS', amount: -8.75, category: 'CAT-FOOD-FAST' },
  { description: 'CHICK-FIL-A', amount: -11.20, category: 'CAT-FOOD-FAST' },
  { description: 'OLIVE GARDEN', amount: -45.80, category: 'CAT-FOOD-REST' },
  { description: 'RED LOBSTER', amount: -67.30, category: 'CAT-FOOD-REST' },

  // Coffee
  { description: 'STARBUCKS', amount: -5.45, category: 'CAT-FOOD-COFFEE' },
  { description: 'DUNKIN DONUTS', amount: -4.80, category: 'CAT-FOOD-COFFEE' },

  // Gas
  { description: 'SHELL OIL', amount: -52.30, category: 'CAT-GAS' },
  { description: 'EXXON MOBILE', amount: -48.90, category: 'CAT-GAS' },
  { description: 'CHEVRON', amount: -55.20, category: 'CAT-GAS' },
  { description: 'BP GAS STATION', amount: -41.60, category: 'CAT-GAS' },

  // Entertainment
  { description: 'NETFLIX.COM', amount: -15.99, category: 'CAT-ENT-STREAMING' },
  { description: 'SPOTIFY', amount: -9.99, category: 'CAT-ENT-STREAMING' },
  { description: 'HULU', amount: -12.99, category: 'CAT-ENT-STREAMING' },
  { description: 'DISNEY PLUS', amount: -7.99, category: 'CAT-ENT-STREAMING' },
  { description: 'AMC THEATERS', amount: -24.50, category: 'CAT-ENT-MOVIES' },

  // Shopping
  { description: 'AMAZON.COM', amount: -67.89, category: 'CAT-SHOPPING-ONLINE' },
  { description: 'AMAZON MARKETPLACE', amount: -34.99, category: 'CAT-SHOPPING-ONLINE' },
  { description: 'BEST BUY', amount: -299.99, category: 'CAT-SHOPPING-ELECTRONICS' },
  { description: 'APPLE.COM/BILL', amount: -49.99, category: 'CAT-SHOPPING-ELECTRONICS' },

  // Bills
  { description: 'ELECTRIC COMPANY PAYMENT', amount: -125.67, category: 'CAT-BILLS-ELECTRIC' },
  { description: 'WATER UTILITIES', amount: -45.30, category: 'CAT-BILLS-WATER' },
  { description: 'VERIZON WIRELESS', amount: -85.99, category: 'CAT-BILLS-PHONE' },
  { description: 'COMCAST CABLE', amount: -120.50, category: 'CAT-BILLS-CABLE' },

  // Health
  { description: 'CVS PHARMACY', amount: -18.99, category: 'CAT-HEALTH-PHARMACY' },
  { description: 'WALGREENS', amount: -32.45, category: 'CAT-HEALTH-PHARMACY' },
  { description: 'DR SMITH OFFICE', amount: -150.00, category: 'CAT-HEALTH-DOCTOR' },
  { description: 'LA FITNESS', amount: -29.99, category: 'CAT-HEALTH-GYM' },

  // Travel
  { description: 'MARRIOTT HOTEL', amount: -189.00, category: 'CAT-TRAVEL-HOTEL' },
  { description: 'DELTA AIRLINES', amount: -345.80, category: 'CAT-TRAVEL-FLIGHT' },
  { description: 'UBER TRIP', amount: -18.45, category: 'CAT-AUTO-PUBLICTRANS' },
  { description: 'LYFT RIDE', amount: -22.30, category: 'CAT-AUTO-PUBLICTRANS' },

  // Fees
  { description: 'OVERDRAFT FEE', amount: -35.00, category: 'CAT-FEES-BANK' },
  { description: 'ATM WITHDRAWAL FEE', amount: -3.00, category: 'CAT-FEES-ATM' },
  { description: 'LATE PAYMENT FEE', amount: -25.00, category: 'CAT-FEES-LATE' },

  // Transfers
  { description: 'TRANSFER FROM SAVINGS', amount: 500.00, category: 'CAT-TRANSFER-INT' },
  { description: 'TRANSFER TO CHECKING', amount: -500.00, category: 'CAT-TRANSFER-INT' },
];

// Category mapping
const CATEGORIES = [
  'CAT-INCOME',
  'CAT-INCOME-SALARY',
  'CAT-INCOME-INVEST',
  'CAT-TRANSFER',
  'CAT-TRANSFER-INT',
  'CAT-FOOD',
  'CAT-FOOD-GROCERY',
  'CAT-FOOD-REST',
  'CAT-FOOD-FAST',
  'CAT-FOOD-COFFEE',
  'CAT-SHOPPING',
  'CAT-SHOPPING-ONLINE',
  'CAT-SHOPPING-ELECTRONICS',
  'CAT-GAS',
  'CAT-AUTO-PUBLICTRANS',
  'CAT-BILLS',
  'CAT-BILLS-ELECTRIC',
  'CAT-BILLS-WATER',
  'CAT-BILLS-PHONE',
  'CAT-BILLS-CABLE',
  'CAT-ENT-STREAMING',
  'CAT-ENT-MOVIES',
  'CAT-HEALTH-PHARMACY',
  'CAT-HEALTH-DOCTOR',
  'CAT-HEALTH-GYM',
  'CAT-TRAVEL-HOTEL',
  'CAT-TRAVEL-FLIGHT',
  'CAT-FEES-BANK',
  'CAT-FEES-ATM',
  'CAT-FEES-LATE',
  'CAT-UNCATEGORIZED',
];

/**
 * Tokenize description text
 */
function tokenize(text, vocabulary, maxLength = 20) {
  const words = text.toLowerCase().split(/\s+/);
  const tokens = [];

  for (const word of words) {
    if (!vocabulary.has(word)) {
      vocabulary.set(word, vocabulary.size);
    }
    tokens.push(vocabulary.get(word));
  }

  // Pad or truncate
  while (tokens.length < maxLength) {
    tokens.push(0);
  }

  return tokens.slice(0, maxLength);
}

/**
 * Prepare training data
 */
function prepareData() {
  const vocabulary = new Map();
  vocabulary.set('<PAD>', 0); // Padding token

  const X = [];
  const y = [];

  for (const example of TRAINING_DATA) {
    // Tokenize description
    const tokens = tokenize(example.description, vocabulary);

    // Normalize amount
    const amountNormalized = Math.log(Math.abs(example.amount) + 1) / 10;

    // Features: tokens + amount + day_of_week (mock) + hour_of_day (mock)
    const features = [...tokens, amountNormalized, 0.5, 0.5];

    // Label: category index
    const categoryIdx = CATEGORIES.indexOf(example.category);
    if (categoryIdx === -1) {
      console.warn(`Unknown category: ${example.category}`);
      continue;
    }

    X.push(features);
    y.push(categoryIdx);
  }

  return { X, y, vocabulary };
}

/**
 * Build and train model
 */
async function trainModel() {
  console.log('Preparing training data...');
  const { X, y, vocabulary } = prepareData();

  console.log(`Training samples: ${X.length}`);
  console.log(`Vocabulary size: ${vocabulary.size}`);
  console.log(`Categories: ${CATEGORIES.length}`);

  // Convert to tensors
  const xs = tf.tensor2d(X);
  const ys = tf.oneHot(tf.tensor1d(y, 'int32'), CATEGORIES.length);

  console.log('Building model...');

  // Simple feedforward neural network
  const model = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [23], // 20 tokens + 3 numeric features
        units: 64,
        activation: 'relu',
      }),
      tf.layers.dropout({ rate: 0.3 }),
      tf.layers.dense({
        units: 32,
        activation: 'relu',
      }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({
        units: CATEGORIES.length,
        activation: 'softmax',
      }),
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  console.log('Training model...');

  await model.fit(xs, ys, {
    epochs: 50,
    batchSize: 8,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(
          `Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`
        );
      },
    },
  });

  console.log('Saving model...');

  const modelDir = path.join(__dirname, '../models/categorizer');
  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
  }

  await model.save(`file://${modelDir}`);

  // Save vocabulary
  const vocabPath = path.join(modelDir, 'vocabulary.json');
  const vocabObj = {};
  vocabulary.forEach((idx, word) => {
    vocabObj[word] = idx;
  });
  fs.writeFileSync(vocabPath, JSON.stringify(vocabObj, null, 2));

  // Save category mapping
  const categoriesPath = path.join(modelDir, 'categories.json');
  fs.writeFileSync(categoriesPath, JSON.stringify(CATEGORIES, null, 2));

  console.log('Model saved successfully!');
  console.log(`Model directory: ${modelDir}`);

  // Test prediction
  console.log('\nTesting predictions...');
  const testCases = [
    'STARBUCKS COFFEE',
    'NETFLIX.COM',
    'WALMART SUPERCENTER',
    'SHELL OIL',
  ];

  for (const testCase of testCases) {
    const tokens = tokenize(testCase, vocabulary);
    const input = tf.tensor2d([[...tokens, 0.5, 0.5, 0.5]]);
    const prediction = model.predict(input);
    const predictionData = await prediction.data();
    const maxIdx = predictionData.indexOf(Math.max(...predictionData));
    const predictedCategory = CATEGORIES[maxIdx];
    const confidence = predictionData[maxIdx];

    console.log(
      `"${testCase}" -> ${predictedCategory} (${(confidence * 100).toFixed(1)}%)`
    );

    input.dispose();
    prediction.dispose();
  }

  xs.dispose();
  ys.dispose();
}

// Run training
trainModel()
  .then(() => {
    console.log('Training complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Training failed:', error);
    process.exit(1);
  });

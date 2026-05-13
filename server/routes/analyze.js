const express = require('express');
const router = express.Router();

const formatUserConditions = (conditions) => {
  if (!Array.isArray(conditions) || conditions.length === 0) return 'None';
  return conditions.map((condition) => {
    if (typeof condition === 'string') return condition;
    if (condition?.name && condition?.severity) return `${condition.name} (${condition.severity})`;
    return condition?.name || '';
  }).filter(Boolean).join(', ') || 'None';
};

const formatUserGoals = (userProfile) => {
  const goals = userProfile?.goals;
  if (Array.isArray(goals) && goals.length) return goals.join(', ');
  return userProfile?.goal || 'General Health';
};

const formatNutriments = (nutriments) => {
  if (!nutriments || typeof nutriments !== 'object') return 'Not listed';
  const keys = [
    'energy-kcal_100g',
    'energy-kcal',
    'proteins_100g',
    'carbohydrates_100g',
    'sugars_100g',
    'fat_100g',
    'saturated-fat_100g',
    'fiber_100g',
    'salt_100g',
    'sodium_100g',
  ];

  return keys
    .filter((key) => nutriments[key] !== undefined && nutriments[key] !== null)
    .map((key) => `${key}: ${nutriments[key]}`)
    .join(', ') || 'Not listed';
};

const normalizeNutrition = (nutrition) => {
  if (!nutrition || typeof nutrition !== 'object') return null;
  const servingSize = nutrition.serving_size || nutrition.servingSize || nutrition.serving || null;
  const servingQuantity = nutrition.serving_quantity || nutrition.servingQuantity || null;
  const nutriments = nutrition.nutriments && typeof nutrition.nutriments === 'object'
    ? { ...nutrition.nutriments }
    : { ...nutrition };

  delete nutriments.nutriments;
  delete nutriments.servingSize;
  delete nutriments.serving;

  const normalized = {};
  const setNumber = (key, ...values) => {
    for (const value of values) {
      if (value === undefined || value === null || value === '') continue;
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        normalized[key] = parsed;
        return;
      }
    }
  };

  setNumber('energy-kcal_serving', nutriments['energy-kcal_serving'], nutriments.energy_kcal_serving, nutriments.calories_serving, nutriments.calories);
  setNumber('proteins_serving', nutriments.proteins_serving, nutriments.protein_serving, nutriments.protein, nutriments.proteins);
  setNumber('carbohydrates_serving', nutriments.carbohydrates_serving, nutriments.carbs_serving, nutriments.carbs, nutriments.carbohydrates);
  setNumber('fat_serving', nutriments.fat_serving, nutriments.fats_serving, nutriments.fat, nutriments.fats);
  setNumber('sodium_mg_serving', nutriments.sodium_mg_serving, nutriments.sodiumMgServing, nutriments.sodium_mg);
  setNumber('sodium_serving', nutriments.sodium_serving, nutriments.sodium);
  setNumber('salt_serving', nutriments.salt_serving, nutriments.salt);
  setNumber('serving_quantity', servingQuantity, nutriments.serving_quantity);

  if (servingSize) normalized.serving_size = String(servingSize);
  return Object.keys(normalized).length ? normalized : null;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Ordered by remaining free-tier quota: untouched models first, then partially used
const MODEL_LIST = [
  "gemini-2.5-flash-lite",   // fresh quota (0 usage)
  "gemini-2.0-flash-lite",   // fresh quota (0 usage), lightweight
  "gemini-2.5-flash",        // some RPD remaining
];

// Global cooldown: tracks when we were last rate-limited so we don't keep burning quota
let rateLimitCooldownUntil = 0;
const RATE_LIMIT_COOLDOWN_MS = 60_000; // wait 60s after a 429 before trying again

async function callGemini(apiKey, modelName, body) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  return response;
}

async function generateWithFallback(apiKey, body) {
  // Check global cooldown first — don't even try if we were recently rate-limited
  const now = Date.now();
  if (now < rateLimitCooldownUntil) {
    const waitSec = Math.ceil((rateLimitCooldownUntil - now) / 1000);
    throw new Error(`Rate limited. Please wait ~${waitSec}s before scanning again.`);
  }

  let lastError = null;

  // Only 1 round — don't burn quota with aggressive retries
  for (const modelName of MODEL_LIST) {
    try {
      console.log(`[FitScan AI] Trying ${modelName}...`);
      const response = await callGemini(apiKey, modelName, body);

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          console.log(`[FitScan AI] ✅ Success with ${modelName}`);
          return text;
        }
        throw new Error('Empty response from model');
      }

      const status = response.status;

      // 429 = Rate limited — stop immediately, activate global cooldown
      if (status === 429) {
        console.warn(`[FitScan AI] 🛑 Rate limited (429). Activating ${RATE_LIMIT_COOLDOWN_MS / 1000}s cooldown.`);
        rateLimitCooldownUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
        throw new Error('Rate limited by Google. Please wait ~60 seconds before trying again.');
      }

      if (status === 404 || status === 400) {
        console.warn(`[FitScan AI] ❌ ${modelName} unavailable/error (${status}).`);
        continue; // try next model
      }

      if (status === 503 || status === 500) {
        console.warn(`[FitScan AI] ⏳ ${modelName} server error (${status}). Trying next model...`);
        await sleep(1000);
        continue; // try next model, but don't do multiple rounds
      }

      const errText = await response.text().catch(() => '');
      lastError = new Error(`HTTP ${status}: ${errText.slice(0, 100)}`);
    } catch (err) {
      lastError = err;
      console.warn(`[FitScan AI] Error on ${modelName}:`, err.message);
      // If it's a rate limit error, don't try the next model
      if (err.message.includes('Rate limited')) throw err;
    }
  }

  throw lastError || new Error('All Gemini models are currently unavailable.');
}

function parseResponse(text) {
  let clean = text.trim();

  // Remove markdown formatting
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // Extract only the JSON object
  const start = clean.indexOf('{');
  let end = clean.lastIndexOf('}');

  if (start === -1) throw new Error('No JSON object found in AI response');

  // If the JSON is truncated (no closing brace), try a basic repair
  if (end === -1 || end < start) {
    console.warn('[FitScan AI] Truncated JSON detected. Attempting emergency repair...');
    // Close strings, arrays, and the object itself
    if (clean.endsWith(',')) clean = clean.slice(0, -1);
    clean = clean.substring(start) + '\n  ],\n  "alternatives": []\n}';
    end = clean.lastIndexOf('}');
  }

  clean = clean.substring(start, end + 1);

  // Basic cleanup for trailing commas
  clean = clean.replace(/,(\s*[}\]])/g, '$1');

  try {
    const result = JSON.parse(clean);
    return normalizeResult(result);
  } catch (err) {
    console.error('[FitScan AI] JSON Parse Failure. Cleaned text was:', clean);
    throw new Error(`Failed to parse AI response: ${err.message}`);
  }
}

// Ensure verdict is always an array of "Good: ..." / "Bad: ..." short labels
function normalizeResult(result) {
  if (!result.verdict || typeof result.verdict === 'string') {
    // AI returned a string instead of array — convert it
    const raw = result.verdict || result.explanation || '';
    // Split on sentence boundaries
    const sentences = raw.split(/[.!]\s+/).map(s => s.replace(/[.!]$/, '').trim()).filter(Boolean);

    // Try to classify each sentence as good or bad based on keywords
    const goodWords = ['good', 'great', 'high protein', 'low sugar', 'healthy', 'beneficial', 'rich in', 'decent', 'source of', 'fiber', 'vitamin', 'mineral', 'natural', 'low calorie', 'low fat'];
    const badWords = ['bad', 'harmful', 'risk', 'avoid', 'sugar', 'artificial', 'problematic', 'triggers', 'unhealthy', 'excess', 'high fat', 'high sodium', 'processed', 'addictive', 'concern', 'negative', 'detrimental', 'suboptimal'];

    result.verdict = sentences.map(s => {
      const lower = s.toLowerCase();
      const isGood = goodWords.some(w => lower.includes(w));
      const isBad = badWords.some(w => lower.includes(w));

      // Truncate to keep it short (max ~8 words)
      const words = s.split(/\s+/).slice(0, 8).join(' ');

      if (isGood && !isBad) return `Good: ${words}`;
      if (isBad) return `Bad: ${words}`;
      return `Bad: ${words}`; // default to bad if unclear
    });

    // Ensure at least 1 bullet
    if (result.verdict.length === 0) {
      result.verdict = ['Bad: Not recommended for your profile'];
    }
  }

  // If it's already an array, ensure each item has a Good:/Bad: prefix
  if (Array.isArray(result.verdict)) {
    result.verdict = result.verdict.map(v => {
      if (typeof v !== 'string') return 'Bad: Unknown concern';
      if (/^(good|bad):/i.test(v)) return v; // already has prefix
      // Classify based on keywords
      const lower = v.toLowerCase();
      const seemsGood = ['good', 'great', 'protein', 'healthy', 'beneficial', 'low sugar', 'fiber', 'vitamin', 'natural'].some(w => lower.includes(w));
      return seemsGood ? `Good: ${v}` : `Bad: ${v}`;
    });
  }

  // Clean up the explanation field (no longer needed for display but keep for sharing)
  delete result.explanation;

  const normalizedNutrition = normalizeNutrition(result.nutrition || result.nutriments);
  if (normalizedNutrition) {
    result.nutrition = normalizedNutrition;
    result.nutriments = normalizedNutrition;
  }

  return result;
}

// POST /api/analyze/image
router.post('/image', async (req, res) => {
  const { imageBase64, userProfile } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured on server.' });
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required.' });

  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  const mimeMatch = imageBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  const prompt = `You are "Nutri Scan", a brutally honest nutrition analyst for the Indian health market.
Analyze this packaged food product image for a user with:
- Age: ${userProfile?.age || 'Not specified'}
- Goal: ${formatUserGoals(userProfile)}
- Conditions: ${formatUserConditions(userProfile?.conditions)}

Identify the product brand and name. Analyze ingredients against the user's profile. Score 1-10.
Also read the nutrition facts panel from the image. Return nutrition values for ONE SERVING whenever visible. If only per-100g values are visible, include serving_size/serving_quantity if visible so the app can calculate one serving. Use numbers only for nutrient values.

CRITICAL: "verdict" must be an array of 3-5 ultra-short labels. Each label starts with "Good:" or "Bad:" followed by MAX 5 words. No full sentences. No explanations. Just the point.
Examples:
- "Good: High protein content"
- "Bad: Harmful for diabetes"
- "Bad: Triggers acid reflux"
- "Good: Low calorie"
- "Bad: Excess added sugar"

CRITICAL: "sideEffects" must be an array of 2-4 possible side effects or health risks from consuming this product, based on the user's health profile and the ingredients. If none, return an empty array.

Respond ONLY with valid JSON, no markdown:
{
  "brand": "Brand",
  "productName": "Product",
  "score": 7,
  "nutrition": {
    "serving_size": "30g",
    "energy-kcal_serving": 120,
    "proteins_serving": 3,
    "carbohydrates_serving": 18,
    "fat_serving": 4,
    "sodium_mg_serving": 140
  },
  "verdict": ["Good: High protein", "Bad: Harmful for diabetes", "Bad: Contains Sucralose"],
  "sideEffects": ["May spike blood sugar", "Can cause bloating due to artificial sweeteners"],
  "ingredientsAnalysis": [
    { "name": "Ingredient", "impact": "harmful", "reason": "One short sentence why." }
  ],
  "alternatives": [
    { "name": "Better Product (India)", "reason": "Why it's better in one line." }
  ]
}`;

  const geminiBody = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data: base64Data } }
      ]
    }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
  };

  try {
    const text = await generateWithFallback(apiKey, geminiBody);
    const result = parseResponse(text);
    res.json(result);
  } catch (err) {
    console.error('[FitScan AI] Final error:', err.message);
    res.status(503).json({ error: 'AI analysis temporarily unavailable. Please try again in a moment.', details: err.message });
  }
});

// POST /api/analyze/text
router.post('/text', async (req, res) => {
  const { productData, userProfile } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured on server.' });

  const prompt = `You are "FitScan", a brutally honest nutrition analyst for the Indian health market.
Analyze this product for a user with:
- Age: ${userProfile?.age || 'Not specified'}
- Goal: ${formatUserGoals(userProfile)}
- Conditions: ${formatUserConditions(userProfile?.conditions)}

Product:
- Brand: ${productData.brands || 'Unknown'}
- Name: ${productData.product_name || 'Unknown'}
- Ingredients: ${productData.ingredients_text || 'Not listed'}
- Nutriments: ${formatNutriments(productData.nutriments)}

Score 1-10 for this specific user profile.

CRITICAL: "verdict" must be an array of 3-5 ultra-short labels. Each label starts with "Good:" or "Bad:" followed by MAX 5 words. No full sentences. No explanations. Just the point.
Examples:
- "Good: High protein content"
- "Bad: Harmful for diabetes"
- "Bad: Triggers acid reflux"
- "Good: Low calorie"
- "Bad: Excess added sugar"

CRITICAL: "sideEffects" must be an array of 2-4 possible side effects or health risks from consuming this product, based on the user's health profile and the ingredients. If none, return an empty array.

Respond ONLY with valid JSON, no markdown:
{
  "brand": "${productData.brands || 'Unknown'}",
  "productName": "${productData.product_name || 'Unknown'}",
  "score": 7,
  "verdict": ["Good: High protein", "Bad: Harmful for diabetes", "Bad: Contains Sucralose"],
  "sideEffects": ["May spike blood sugar", "Can cause bloating due to artificial sweeteners"],
  "ingredientsAnalysis": [
    { "name": "Ingredient", "impact": "harmful", "reason": "One short sentence why." }
  ],
  "alternatives": [
    { "name": "Better Product (India)", "reason": "Why it's better in one line." }
  ]
}`;

  const geminiBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
  };

  try {
    const text = await generateWithFallback(apiKey, geminiBody);
    const result = parseResponse(text);
    res.json(result);
  } catch (err) {
    console.error('[FitScan AI] Final error:', err.message);
    res.status(503).json({ error: 'AI analysis temporarily unavailable. Please try again in a moment.', details: err.message });
  }
});

module.exports = router;

const express = require('express');
const jwt = require('jsonwebtoken');
const { uploadImage } = require('../config/cloudinary');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// Middleware to authenticate
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.use(authenticate);

const parseIngredientsText = (ingredients) => {
  if (!ingredients) return '';
  if (typeof ingredients !== 'string') return String(ingredients);

  try {
    const parsed = JSON.parse(ingredients);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (typeof item === 'string') return item;
          return [item?.name, item?.reason].filter(Boolean).join(': ');
        })
        .filter(Boolean)
        .join(', ');
    }
    return String(parsed);
  } catch {
    return ingredients;
  }
};

const safeJsonParse = (value, fallback = null) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeProductKey = (brand, productName) => {
  const normalizedBrand = (brand || 'unknown').trim().toLowerCase();
  const normalizedProduct = (productName || '').trim().toLowerCase();
  return `${normalizedBrand}::${normalizedProduct}`;
};

const shouldShowInFoodDatabase = (productName) => {
  const normalized = (productName || '').trim().toLowerCase();
  return Boolean(normalized && !['unknown', 'unknown product', 'product'].includes(normalized));
};

const upsertProductDatabase = async (pool, userId, scan) => {
  const {
    productName,
    brand,
    score,
    ingredients,
    productData,
  } = scan;

  if (!productName) return;

  const ingredientsAnalysis = safeJsonParse(ingredients, Array.isArray(ingredients) ? ingredients : null);
  const productBrand = productData?.brands || brand || 'Unknown Brand';
  const productIngredientsText = productData?.ingredients_text || parseIngredientsText(ingredients);
  const productKey = normalizeProductKey(productBrand, productName);
  const nutriments = productData?.nutriments || productData?.nutrientLevels || null;

  await pool.query(
    `
      INSERT INTO product_database (
        product_key,
        product_name,
        brand,
        ingredients_text,
        ingredients_analysis,
        nutriments,
        raw_product_data,
        latest_score,
        scan_count,
        first_scanned_by,
        last_scanned_by,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, $9, $9, CURRENT_TIMESTAMP)
      ON CONFLICT (product_key)
      DO UPDATE SET
        product_name = EXCLUDED.product_name,
        brand = COALESCE(EXCLUDED.brand, product_database.brand),
        ingredients_text = COALESCE(NULLIF(EXCLUDED.ingredients_text, ''), product_database.ingredients_text),
        ingredients_analysis = COALESCE(EXCLUDED.ingredients_analysis, product_database.ingredients_analysis),
        nutriments = COALESCE(EXCLUDED.nutriments, product_database.nutriments),
        raw_product_data = COALESCE(EXCLUDED.raw_product_data, product_database.raw_product_data),
        latest_score = EXCLUDED.latest_score,
        scan_count = product_database.scan_count + 1,
        last_scanned_by = EXCLUDED.last_scanned_by,
        updated_at = CURRENT_TIMESTAMP
    `,
    [
      productKey,
      productName,
      productBrand,
      productIngredientsText,
      ingredientsAnalysis ? JSON.stringify(ingredientsAnalysis) : null,
      nutriments ? JSON.stringify(nutriments) : null,
      productData ? JSON.stringify(productData) : null,
      score,
      userId,
    ]
  );
};

// Shared product database: products scanned by everyone on the platform.
router.get('/database', async (req, res) => {
  const search = (req.query.search || '').trim();

  try {
    const values = [];
    let whereClause = "WHERE food_database_flag = true AND product_name IS NOT NULL AND product_name <> ''";

    if (search) {
      values.push(`%${search}%`);
      whereClause += ` AND (product_name ILIKE $${values.length} OR brand ILIKE $${values.length} OR ingredients ILIKE $${values.length})`;
    }

    const productsRes = await req.pool.query(
      `
        SELECT DISTINCT ON (LOWER(COALESCE(brand, '')), LOWER(product_name))
          id,
          product_name,
          brand,
          ingredients,
          score,
          created_at
        FROM scans
        ${whereClause}
        ORDER BY LOWER(COALESCE(brand, '')), LOWER(product_name), created_at DESC
        LIMIT 100
      `,
      values
    );

    const products = productsRes.rows
      .map((scan) => ({
        id: scan.id,
        product_name: scan.product_name,
        brands: scan.brand || 'Unknown Brand',
        ingredients_text: parseIngredientsText(scan.ingredients),
        ingredientsAnalysis: safeJsonParse(scan.ingredients, []),
        nutriments: {},
        rawProductData: null,
        latest_score: scan.score,
        scan_count: 1,
        created_at: scan.created_at,
        updated_at: scan.created_at,
      }))
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch product database' });
  }
});

// Get user's scan history
router.get('/', async (req, res) => {
  try {
    const scansRes = await req.pool.query(
      'SELECT * FROM scans WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(scansRes.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Save a new scan
router.post('/', async (req, res) => {
  const { productName, brand, score, ingredients, verdict, explanation, alternatives, sideEffects, productData, imageUrl } = req.body;

  // ── Debug logging ──
  console.log('━━━ POST /scans ━━━');
  console.log('  Product:', productName);
  console.log('  Brand:', brand);
  console.log('  Score:', score);
  console.log('  imageUrl received:', imageUrl ? `${typeof imageUrl} (${imageUrl.length} chars, starts with: ${imageUrl.substring(0, 50)}...)` : 'NULL / undefined');

  let finalImageUrl = imageUrl;

  try {
    // If the image is a base64 string, upload it to Cloudinary
    if (imageUrl && imageUrl.startsWith('data:image')) {
      console.log('  → Uploading to Cloudinary...');
      try {
        finalImageUrl = await uploadImage(imageUrl);
        console.log('  ✓ Cloudinary URL:', finalImageUrl);
      } catch (uploadErr) {
        console.error('  ✗ Cloudinary upload failed, falling back to original:', uploadErr.message);
        // Fallback to original if upload fails (though Cloudinary is preferred)
        finalImageUrl = imageUrl;
      }
    }

    const insertRes = await req.pool.query(
      'INSERT INTO scans (user_id, product_name, brand, score, ingredients, verdict, explanation, alternatives, side_effects, food_database_flag, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [req.userId, productName, brand, score, ingredients, verdict, explanation, JSON.stringify(alternatives), JSON.stringify(sideEffects || []), shouldShowInFoodDatabase(productName), finalImageUrl || null]
    );

    console.log('  ✓ Scan saved — id:', insertRes.rows[0].id, '| image_url in DB:', insertRes.rows[0].image_url ? 'SET' : 'NULL');

    await upsertProductDatabase(req.pool, req.userId, {
      productName,
      brand,
      score,
      ingredients,
      productData,
    });

    // Reward points for scanning
    await req.pool.query('UPDATE users SET points = points + 5 WHERE id = $1', [req.userId]);

    res.json(insertRes.rows[0]);
  } catch (error) {
    console.error('  ✗ Scan save FAILED:', error);
    res.status(500).json({ error: 'Failed to save scan' });
  }
});

module.exports = router;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const authRoutes = require('./routes/auth');
const scansRoutes = require('./routes/scans');
const analyzeRoutes = require('./routes/analyze');
const featuresRoutes = require('./routes/features');

const app = express();
const PORT = process.env.PORT || 5000;

// Setup PostgreSQL connection pool with discrete credentials
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

const refreshFoodDatabaseFlags = async () => {
  try {
    await pool.query(`
      UPDATE scans
      SET food_database_flag = false
      WHERE
        product_name IS NULL
        OR TRIM(product_name) = ''
        OR LOWER(TRIM(product_name)) IN ('unknown', 'unknown product', 'product');
    `);

    await pool.query(`
      UPDATE scans
      SET food_database_flag = true
      WHERE
        product_name IS NOT NULL
        AND TRIM(product_name) <> ''
        AND LOWER(TRIM(product_name)) NOT IN ('unknown', 'unknown product', 'product');
    `);

    console.log('Food database scan flags refreshed');
  } catch (err) {
    console.error('Error refreshing food database flags:', err);
  }
};

// Initialize database tables if they don't exist
const initDb = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        google_id VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        points INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        last_login_at TIMESTAMP,
        profile JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Scans table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        product_name VARCHAR(255),
        brand VARCHAR(255),
        score INTEGER,
        ingredients TEXT,
        verdict VARCHAR(255),
        explanation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Shared Food Database: one product row can be reused by all users.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_database (
        id SERIAL PRIMARY KEY,
        product_key VARCHAR(600) UNIQUE NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        brand VARCHAR(255),
        ingredients_text TEXT,
        ingredients_analysis JSONB,
        nutriments JSONB,
        raw_product_data JSONB,
        latest_score INTEGER,
        scan_count INTEGER DEFAULT 1,
        first_scanned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        last_scanned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS product_database_product_key_idx
      ON product_database (product_key);
    `);

    // Feature Requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feature_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        voters JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Medical conditions table stores each user's selected conditions and severity.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_medical_conditions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        condition_name VARCHAR(255) NOT NULL,
        severity VARCHAR(20) NOT NULL DEFAULT 'Medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, condition_name)
      );
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS user_medical_conditions_user_condition_idx
      ON user_medical_conditions (user_id, condition_name);
    `);

    // Health goals table stores each user's selected goals as queryable rows.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_health_goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        goal_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, goal_name)
      );
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS user_health_goals_user_goal_idx
      ON user_health_goals (user_id, goal_name);
    `);

    // Manual migration checks using information_schema for maximum compatibility
    const addColumnIfMissing = async (tableName, columnName, dataType) => {
      const checkRes = await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2",
        [tableName, columnName]
      );
      if (checkRes.rows.length === 0) {
        console.log(`Migrating: Adding column ${columnName} to ${tableName}...`);
        await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${dataType}`);
      }
    };

    await addColumnIfMissing('scans', 'score', 'INTEGER');
    await addColumnIfMissing('scans', 'alternatives', 'JSONB');
    await addColumnIfMissing('scans', 'side_effects', 'JSONB');
    await addColumnIfMissing('scans', 'food_database_flag', 'BOOLEAN DEFAULT false');
    await addColumnIfMissing('scans', 'image_url', 'TEXT');
    await addColumnIfMissing('product_database', 'ingredients_analysis', 'JSONB');
    await addColumnIfMissing('product_database', 'nutriments', 'JSONB');
    await addColumnIfMissing('product_database', 'raw_product_data', 'JSONB');
    await addColumnIfMissing('product_database', 'latest_score', 'INTEGER');
    await addColumnIfMissing('product_database', 'scan_count', 'INTEGER DEFAULT 1');
    await addColumnIfMissing('product_database', 'first_scanned_by', 'INTEGER REFERENCES users(id) ON DELETE SET NULL');
    await addColumnIfMissing('product_database', 'last_scanned_by', 'INTEGER REFERENCES users(id) ON DELETE SET NULL');
    await addColumnIfMissing('product_database', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    await addColumnIfMissing('users', 'points', 'INTEGER DEFAULT 0');
    await addColumnIfMissing('users', 'streak', 'INTEGER DEFAULT 0');
    await addColumnIfMissing('users', 'last_login_at', 'TIMESTAMP');
    await addColumnIfMissing('users', 'profile', 'JSONB');
    await addColumnIfMissing('user_medical_conditions', 'severity', "VARCHAR(20) NOT NULL DEFAULT 'Medium'");
    await addColumnIfMissing('user_medical_conditions', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    // Backfill products from older scans so Food Database is not empty after migration.
    await pool.query(`
      INSERT INTO product_database (
        product_key,
        product_name,
        brand,
        ingredients_text,
        latest_score,
        scan_count,
        first_scanned_by,
        last_scanned_by,
        created_at,
        updated_at
      )
      SELECT DISTINCT ON (LOWER(COALESCE(brand, '')), LOWER(product_name))
        LOWER(COALESCE(brand, 'unknown')) || '::' || LOWER(product_name) AS product_key,
        product_name,
        brand,
        ingredients,
        score,
        1,
        user_id,
        user_id,
        created_at,
        created_at
      FROM scans
      WHERE product_name IS NOT NULL AND product_name <> ''
      ON CONFLICT (product_key) DO NOTHING;
    `);

    await refreshFoodDatabaseFlags();

    console.log('Database tables initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

initDb();
setInterval(refreshFoodDatabaseFlags, 2 * 60 * 1000);

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Pass pool to routes
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

app.use('/auth', authRoutes);
app.use('/scans', scansRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/features', featuresRoutes);

app.get('/', (req, res) => {
  res.send('FitScan API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const SEVERITY_LEVELS = ['Low', 'Medium', 'High'];

const normalizeCondition = (condition) => {
  if (typeof condition === 'string') {
    return { name: condition, severity: 'Medium' };
  }

  const name = typeof condition?.name === 'string' ? condition.name.trim() : '';
  const severity = SEVERITY_LEVELS.includes(condition?.severity) ? condition.severity : 'Medium';
  return name ? { name, severity } : null;
};

const normalizeConditions = (conditions) => {
  if (!Array.isArray(conditions)) return [];
  const byName = new Map();
  conditions.forEach((condition) => {
    const normalized = normalizeCondition(condition);
    if (normalized) byName.set(normalized.name, normalized);
  });
  return Array.from(byName.values());
};

const normalizeGoals = (goals) => {
  if (!Array.isArray(goals)) return [];
  return Array.from(new Set(
    goals
      .filter((goal) => typeof goal === 'string')
      .map((goal) => goal.trim())
      .filter(Boolean)
  ));
};

const syncMedicalConditions = async (pool, userId, conditions) => {
  const normalizedConditions = normalizeConditions(conditions);

  await pool.query('DELETE FROM user_medical_conditions WHERE user_id = $1', [userId]);

  for (const condition of normalizedConditions) {
    await pool.query(
      `INSERT INTO user_medical_conditions (user_id, condition_name, severity, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, condition_name)
       DO UPDATE SET severity = EXCLUDED.severity, updated_at = CURRENT_TIMESTAMP`,
      [userId, condition.name, condition.severity]
    );
  }

  return normalizedConditions;
};

const getMedicalConditions = async (pool, userId) => {
  const conditionsRes = await pool.query(
    `SELECT condition_name AS name, severity
     FROM user_medical_conditions
     WHERE user_id = $1
     ORDER BY condition_name ASC`,
    [userId]
  );
  return conditionsRes.rows;
};

const syncHealthGoals = async (pool, userId, goals) => {
  const normalizedGoals = normalizeGoals(goals);

  await pool.query('DELETE FROM user_health_goals WHERE user_id = $1', [userId]);

  for (const goal of normalizedGoals) {
    await pool.query(
      `INSERT INTO user_health_goals (user_id, goal_name, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, goal_name)
       DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
      [userId, goal]
    );
  }

  return normalizedGoals;
};

const getHealthGoals = async (pool, userId) => {
  const goalsRes = await pool.query(
    `SELECT goal_name
     FROM user_health_goals
     WHERE user_id = $1
     ORDER BY goal_name ASC`,
    [userId]
  );
  return goalsRes.rows.map((row) => row.goal_name);
};

const hydrateUserMedicalProfile = async (pool, user) => {
  const conditions = await getMedicalConditions(pool, user.id);
  const goals = await getHealthGoals(pool, user.id);
  if (!conditions.length && !goals.length) return user;

  return {
    ...user,
    profile: {
      ...(user.profile || {}),
      ...(conditions.length ? { conditions } : {}),
      ...(goals.length ? { goals } : {}),
    },
  };
};

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

// Helper to update streak and points
async function updateStreak(pool, userId) {
  const userRes = await pool.query('SELECT points, streak, last_login_at FROM users WHERE id = $1', [userId]);
  const user = userRes.rows[0];

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let lastLogin = user.last_login_at ? new Date(user.last_login_at) : null;
  if (lastLogin) {
    lastLogin = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let newPoints = user.points || 0;
  let newStreak = user.streak || 0;

  if (!lastLogin) {
    newStreak = 1;
    newPoints += 5;
  } else if (lastLogin.getTime() === today.getTime()) {
    return { points: newPoints, streak: newStreak };
  } else if (lastLogin.getTime() === yesterday.getTime()) {
    newStreak += 1;
    newPoints += 5;
  } else {
    newPoints = Math.max(0, newPoints - 5);
    newStreak = 1;
    newPoints += 5;
  }

  await pool.query(
    'UPDATE users SET points = $1, streak = $2, last_login_at = $3 WHERE id = $4',
    [newPoints, newStreak, now, userId]
  );

  return { points: newPoints, streak: newStreak };
}

// Register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const userRes = await req.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length > 0) return res.status(400).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const insertRes = await req.pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, profile',
      [email, passwordHash, name]
    );
    const user = insertRes.rows[0];
    const { points, streak } = await updateStreak(req.pool, user.id);
    const hydratedUser = await hydrateUserMedicalProfile(req.pool, { ...user, points, streak });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: hydratedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRes = await req.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

    const user = userRes.rows[0];
    if (!user.password_hash) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const { points, streak } = await updateStreak(req.pool, user.id);
    const hydratedUser = await hydrateUserMedicalProfile(req.pool, {
      id: user.id, email: user.email, name: user.name, points, streak,
      profile: user.profile
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: hydratedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Google OAuth
router.post('/google', async (req, res) => {
  const { email, name, googleId } = req.body;
  try {
    let userRes = await req.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user;
    if (userRes.rows.length === 0) {
      const insertRes = await req.pool.query(
        'INSERT INTO users (email, name, google_id) VALUES ($1, $2, $3) RETURNING id, email, name, profile',
        [email, name, googleId]
      );
      user = insertRes.rows[0];
    } else {
      user = userRes.rows[0];
    }

    const { points, streak } = await updateStreak(req.pool, user.id);
    const hydratedUser = await hydrateUserMedicalProfile(req.pool, {
      id: user.id, email: user.email, name: user.name, points, streak,
      profile: user.profile
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: hydratedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Google login failed' });
  }
});

// Get current user (session restoration)
router.get('/me', authenticate, async (req, res) => {
  try {
    const userRes = await req.pool.query(
      'SELECT id, email, name, points, streak, profile FROM users WHERE id = $1',
      [req.userId]
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = await hydrateUserMedicalProfile(req.pool, userRes.rows[0]);
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update Profile
router.put('/profile', authenticate, async (req, res) => {
  const { profile } = req.body;
  try {
    const nextProfile = { ...(profile || {}) };
    if (Object.prototype.hasOwnProperty.call(nextProfile, 'conditions')) {
      nextProfile.conditions = normalizeConditions(nextProfile.conditions);
    }
    if (Object.prototype.hasOwnProperty.call(nextProfile, 'goals')) {
      nextProfile.goals = normalizeGoals(nextProfile.goals);
    }

    await req.pool.query(
      'UPDATE users SET profile = $1 WHERE id = $2',
      [JSON.stringify(nextProfile), req.userId]
    );

    if (Object.prototype.hasOwnProperty.call(nextProfile, 'conditions')) {
      await syncMedicalConditions(req.pool, req.userId, nextProfile.conditions);
    }
    if (Object.prototype.hasOwnProperty.call(nextProfile, 'goals')) {
      await syncHealthGoals(req.pool, req.userId, nextProfile.goals);
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update personal details from profile page
router.put('/details', authenticate, async (req, res) => {
  const { name, profile } = req.body;
  try {
    const userRes = await req.pool.query(
      'SELECT profile FROM users WHERE id = $1',
      [req.userId]
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentProfile = userRes.rows[0].profile || {};
    const nextProfile = { ...currentProfile, ...(profile || {}) };
    if (Object.prototype.hasOwnProperty.call(profile || {}, 'conditions')) {
      nextProfile.conditions = normalizeConditions(profile.conditions);
    }
    if (Object.prototype.hasOwnProperty.call(profile || {}, 'goals')) {
      nextProfile.goals = normalizeGoals(profile.goals);
    }

    await req.pool.query(
      'UPDATE users SET name = COALESCE($1, name), profile = $2 WHERE id = $3',
      [name || null, JSON.stringify(nextProfile), req.userId]
    );

    if (Object.prototype.hasOwnProperty.call(profile || {}, 'conditions')) {
      await syncMedicalConditions(req.pool, req.userId, nextProfile.conditions);
    }
    if (Object.prototype.hasOwnProperty.call(profile || {}, 'goals')) {
      await syncHealthGoals(req.pool, req.userId, nextProfile.goals);
    }

    const updatedRes = await req.pool.query(
      'SELECT id, email, name, points, streak, profile FROM users WHERE id = $1',
      [req.userId]
    );

    const updatedUser = await hydrateUserMedicalProfile(req.pool, updatedRes.rows[0]);
    res.json({ user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update personal details' });
  }
});

// Get/Update Streak
router.get('/streak', authenticate, async (req, res) => {
  try {
    const { points, streak } = await updateStreak(req.pool, req.userId);
    res.json({ points, streak });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update streak' });
  }
});

// Get Leaderboard
router.get('/leaderboard', authenticate, async (req, res) => {
  try {
    const leaderboardRes = await req.pool.query(
      'SELECT name, points, streak FROM users ORDER BY points DESC, streak DESC LIMIT 50'
    );
    res.json(leaderboardRes.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;

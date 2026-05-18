const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Razorpay = require('razorpay');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Helper to authenticate user
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// POST /api/payment/create-order
router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Razorpay keys not configured on server' });
    }

    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    const { planType } = req.body;
    const amountPaise = planType === 'family' ? 29900 : 2000; // ₹299 vs ₹20

    const options = {
      amount: amountPaise,
      currency: 'INR',
      receipt: `receipt_user_${req.userId}_${Date.now()}`,
      notes: { planType: planType || 'basic' }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// POST /api/payment/verify
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const { RAZORPAY_KEY_SECRET } = process.env;

    if (!RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Razorpay keys not configured on server' });
    }

    // Verify the signature
    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text.toString())
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      // Payment successful, update user based on planType
      const { planType } = req.body;
      const dbPlanType = planType === 'family' ? 'family' : 'basic';
      const days = planType === 'family' ? 30 : 7;

      await req.pool.query(
        `UPDATE users SET is_premium = true, subscription_plan = $1, subscription_expires_at = CURRENT_TIMESTAMP + interval '${days} days', image_scans_used = 0 WHERE id = $2`,
        [dbPlanType, req.userId]
      );

      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ error: 'Payment signature verification failed' });
    }
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

module.exports = router;

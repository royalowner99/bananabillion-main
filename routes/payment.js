const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { db } = require('../config/firebase');

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Products configuration
const PRODUCTS = {
  mystery_box_single: {
    id: 'mystery_box_single',
    name: 'Mystery Box',
    description: 'Premium Banana Mystery Box',
    price: 4900, // in paise (₹49)
    currency: 'INR',
    boxes: 1
  },
  mystery_box_bundle: {
    id: 'mystery_box_bundle',
    name: 'Mystery Box Bundle',
    description: '5x Premium Banana Mystery Box',
    price: 19900, // in paise (₹199)
    currency: 'INR',
    boxes: 5
  }
};

// Mystery Box rewards configuration
const MYSTERY_BOX_REWARDS = {
  coins: [
    { min: 10000, max: 15000, probability: 40 },
    { min: 15000, max: 25000, probability: 30 },
    { min: 25000, max: 35000, probability: 20 },
    { min: 35000, max: 50000, probability: 10 }
  ],
  boosters: [
    { type: '3x_tap', name: '3x Tap Booster', duration: 3600, probability: 60 },
    { type: '5x_tap', name: '5x Tap Booster', duration: 1800, probability: 40 }
  ],
  extras: [
    { type: 'energy_refill', name: 'Full Energy Refill', probability: 70 },
    { type: 'rare_miner', name: 'Rare Miner Boost', value: 1000, probability: 30 }
  ]
};

// Create order
router.post('/create-order', async (req, res) => {
  try {
    const { telegramId, productId } = req.body;
    
    const product = PRODUCTS[productId];
    if (!product) {
      return res.status(400).json({ success: false, message: 'Invalid product' });
    }
    
    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: product.price,
      currency: product.currency,
      receipt: `order_${telegramId}_${Date.now()}`,
      notes: {
        telegramId,
        productId,
        boxes: product.boxes
      }
    });
    
    // Save order to database
    await db.collection('orders').doc(order.id).set({
      orderId: order.id,
      telegramId,
      productId,
      amount: product.price,
      currency: product.currency,
      boxes: product.boxes,
      status: 'created',
      createdAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      },
      product,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify payment
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, telegramId } = req.body;
    
    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }
    
    // Get order details
    const orderDoc = await db.collection('orders').doc(razorpay_order_id).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    const order = orderDoc.data();
    
    // Check if already processed
    if (order.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Order already processed' });
    }
    
    // Update order status
    await db.collection('orders').doc(razorpay_order_id).update({
      status: 'completed',
      paymentId: razorpay_payment_id,
      completedAt: new Date().toISOString()
    });
    
    // Give user their mystery boxes
    const userRef = db.collection('users').doc(telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userData = userDoc.data();
    const currentBoxes = userData.mysteryBoxes || 0;
    
    await userRef.update({
      mysteryBoxes: currentBoxes + order.boxes,
      totalPurchases: (userData.totalPurchases || 0) + 1,
      totalSpent: (userData.totalSpent || 0) + order.amount
    });
    
    // Save transaction
    await db.collection('transactions').add({
      telegramId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      productId: order.productId,
      amount: order.amount,
      boxes: order.boxes,
      type: 'purchase',
      createdAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: `Successfully purchased ${order.boxes} Mystery Box(es)!`,
      boxes: currentBoxes + order.boxes
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Open mystery box
router.post('/open-box', async (req, res) => {
  try {
    const { telegramId } = req.body;
    
    const userRef = db.collection('users').doc(telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    if (!userData.mysteryBoxes || userData.mysteryBoxes < 1) {
      return res.status(400).json({ success: false, message: 'No mystery boxes available' });
    }
    
    // Generate rewards
    const rewards = generateMysteryBoxRewards();
    
    // Apply rewards
    let updates = {
      mysteryBoxes: userData.mysteryBoxes - 1,
      coins: (userData.coins || 0) + rewards.coins
    };
    
    // Apply energy refill if won
    if (rewards.extras.type === 'energy_refill') {
      updates.energy = userData.maxEnergy || 1000;
    }
    
    // Apply rare miner boost if won
    if (rewards.extras.type === 'rare_miner') {
      updates.tapPower = (userData.tapPower || 1) + rewards.extras.value;
    }
    
    // Save booster if won
    if (rewards.booster) {
      const activeBoosters = userData.activeBoosters || [];
      activeBoosters.push({
        type: rewards.booster.type,
        name: rewards.booster.name,
        multiplier: rewards.booster.type === '5x_tap' ? 5 : 3,
        expiresAt: new Date(Date.now() + rewards.booster.duration * 1000).toISOString()
      });
      updates.activeBoosters = activeBoosters;
    }
    
    await userRef.update(updates);
    
    // Save box opening record
    await db.collection('boxOpenings').add({
      telegramId,
      rewards,
      openedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      rewards,
      remainingBoxes: userData.mysteryBoxes - 1
    });
  } catch (error) {
    console.error('Open box error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate mystery box rewards
function generateMysteryBoxRewards() {
  // Generate coins
  const coinTier = weightedRandom(MYSTERY_BOX_REWARDS.coins);
  const coins = Math.floor(Math.random() * (coinTier.max - coinTier.min + 1)) + coinTier.min;
  
  // Generate booster
  const booster = weightedRandom(MYSTERY_BOX_REWARDS.boosters);
  
  // Generate extra reward
  const extras = weightedRandom(MYSTERY_BOX_REWARDS.extras);
  
  return { coins, booster, extras };
}

// Weighted random selection
function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.probability, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.probability;
    if (random <= 0) return item;
  }
  
  return items[items.length - 1];
}

// Get user's boxes count
router.get('/boxes/:telegramId', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.telegramId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      boxes: userDoc.data().mysteryBoxes || 0
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get products
router.get('/products', (req, res) => {
  res.json({
    success: true,
    products: Object.values(PRODUCTS)
  });
});

module.exports = router;

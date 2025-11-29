const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { db } = require('../config/firebase');

// Razorpay instance - only initialize if credentials are available
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log('✅ Razorpay initialized');
} else {
  console.log('⚠️ Razorpay credentials not found - payment features disabled');
}

// Products configuration
const PRODUCTS = {
  // ============ COIN PACKS ============
  coin_pack_small: {
    id: 'coin_pack_small',
    name: 'Starter Pack',
    description: '50,000 Coins',
    price: 4900,
    currency: 'INR',
    type: 'coin_pack',
    coins: 50000
  },
  coin_pack_medium: {
    id: 'coin_pack_medium',
    name: 'Pro Pack',
    description: '150,000 Coins + 10% Bonus',
    price: 9900,
    currency: 'INR',
    type: 'coin_pack',
    coins: 165000
  },
  coin_pack_large: {
    id: 'coin_pack_large',
    name: 'Elite Pack',
    description: '500,000 Coins + 20% Bonus',
    price: 24900,
    currency: 'INR',
    type: 'coin_pack',
    coins: 600000
  },
  coin_pack_mega: {
    id: 'coin_pack_mega',
    name: 'Mega Pack',
    description: '2,000,000 Coins + 30% Bonus',
    price: 79900,
    currency: 'INR',
    type: 'coin_pack',
    coins: 2600000
  },
  
  // ============ LUCKY SPINS ============
  spin_single: {
    id: 'spin_single',
    name: 'Lucky Spin',
    description: '1 Spin - Win up to 100K!',
    price: 1900,
    currency: 'INR',
    type: 'spin',
    spins: 1
  },
  spin_pack: {
    id: 'spin_pack',
    name: 'Spin Bundle',
    description: '5 Spins + 1 FREE',
    price: 7900,
    currency: 'INR',
    type: 'spin',
    spins: 6
  },
  spin_mega: {
    id: 'spin_mega',
    name: 'Mega Spin Pack',
    description: '15 Spins + 5 FREE',
    price: 19900,
    currency: 'INR',
    type: 'spin',
    spins: 20
  },
  
  // ============ BOOSTERS ============
  booster_2x_1h: {
    id: 'booster_2x_1h',
    name: '2x Mining (1 Hour)',
    description: 'Double mining for 1 hour',
    price: 2900,
    currency: 'INR',
    type: 'booster_pack',
    multiplier: 2,
    duration: 3600
  },
  booster_3x_1h: {
    id: 'booster_3x_1h',
    name: '3x Mining (1 Hour)',
    description: 'Triple mining for 1 hour',
    price: 4900,
    currency: 'INR',
    type: 'booster_pack',
    multiplier: 3,
    duration: 3600
  },
  booster_5x_30m: {
    id: 'booster_5x_30m',
    name: '5x Mining (30 Min)',
    description: '5x mining for 30 minutes',
    price: 4900,
    currency: 'INR',
    type: 'booster_pack',
    multiplier: 5,
    duration: 1800
  },
  energy_refill: {
    id: 'energy_refill',
    name: 'Full Energy',
    description: 'Instant full energy refill',
    price: 1900,
    currency: 'INR',
    type: 'energy_refill'
  },
  
  // ============ MYSTERY BOXES ============
  mystery_box_single: {
    id: 'mystery_box_single',
    name: 'Mystery Box',
    description: 'Premium Banana Mystery Box',
    price: 4900,
    currency: 'INR',
    type: 'mystery_box',
    boxes: 1
  },
  mystery_box_bundle: {
    id: 'mystery_box_bundle',
    name: 'Mystery Box Bundle',
    description: '5x Premium Banana Mystery Box',
    price: 19900,
    currency: 'INR',
    type: 'mystery_box',
    boxes: 5
  },
  
  // ============ PROFILE COSMETICS ============
  colored_frame: {
    id: 'colored_frame',
    name: 'Colored Frame',
    description: 'Colorful profile frame',
    price: 2900,
    currency: 'INR',
    type: 'cosmetic',
    cosmetic: 'colored_frame'
  },
  premium_banner: {
    id: 'premium_banner',
    name: 'Premium Banner',
    description: 'Exclusive profile banner',
    price: 4900,
    currency: 'INR',
    type: 'cosmetic',
    cosmetic: 'premium_banner'
  },
  animated_frame: {
    id: 'animated_frame',
    name: 'Animated Avatar Frame',
    description: 'Animated glowing frame',
    price: 9900,
    currency: 'INR',
    type: 'cosmetic',
    cosmetic: 'animated_frame'
  },
  
  // ============ VIP PASSES ============
  banana_pass: {
    id: 'banana_pass',
    name: 'Banana Pass',
    description: 'Lifetime premium upgrade',
    price: 29900,
    currency: 'INR',
    type: 'banana_pass',
    benefits: {
      miningBonus: 20,
      specialEmoji: '🍌👑',
      dailyBooster: true,
      badge: 'banana_pass'
    }
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
    // Check if Razorpay is configured
    if (!razorpay) {
      return res.status(503).json({ success: false, message: 'Payment system not configured' });
    }
    
    const { telegramId, productId } = req.body;
    
    console.log('Create order request - telegramId:', telegramId, 'productId:', productId);
    console.log('Available products:', Object.keys(PRODUCTS));
    
    const product = PRODUCTS[productId];
    if (!product) {
      console.log('Product not found:', productId);
      return res.status(400).json({ success: false, message: `Invalid product: ${productId}` });
    }
    
    console.log('Found product:', product.name, 'Price:', product.price);

    // Check if user already owns this item (for cosmetics and banana pass)
    if (product.type === 'cosmetic' || product.type === 'banana_pass') {
      const userDoc = await db.collection('users').doc(telegramId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (product.type === 'banana_pass' && userData.bananaPass) {
          return res.status(400).json({ success: false, message: 'You already own Banana Pass!' });
        }
        if (product.type === 'cosmetic') {
          const ownedCosmetics = userData.ownedCosmetics || [];
          if (ownedCosmetics.includes(product.cosmetic)) {
            return res.status(400).json({ success: false, message: 'You already own this item!' });
          }
        }
      }
    }
    
    const order = await razorpay.orders.create({
      amount: product.price,
      currency: product.currency,
      receipt: `order_${telegramId}_${Date.now()}`,
      notes: { telegramId, productId }
    });
    
    await db.collection('orders').doc(order.id).set({
      orderId: order.id,
      telegramId,
      productId,
      productType: product.type,
      amount: product.price,
      currency: product.currency,
      status: 'created',
      createdAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      order: { id: order.id, amount: order.amount, currency: order.currency },
      product,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify payment and apply rewards
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, telegramId } = req.body;
    
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }
    
    const orderDoc = await db.collection('orders').doc(razorpay_order_id).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    const order = orderDoc.data();
    if (order.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Order already processed' });
    }
    
    await db.collection('orders').doc(razorpay_order_id).update({
      status: 'completed',
      paymentId: razorpay_payment_id,
      completedAt: new Date().toISOString()
    });
    
    const userRef = db.collection('users').doc(telegramId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userData = userDoc.data();
    const product = PRODUCTS[order.productId];
    let updates = {
      totalPurchases: (userData.totalPurchases || 0) + 1,
      totalSpent: (userData.totalSpent || 0) + order.amount
    };
    let responseData = { success: true };

    // Apply rewards based on product type
    if (product.type === 'coin_pack') {
      updates.coins = (userData.coins || 0) + product.coins;
      responseData.message = `Got ${product.coins.toLocaleString()} coins!`;
      responseData.coins = updates.coins;
      responseData.type = 'coin_pack';
    }
    else if (product.type === 'spin') {
      const currentSpins = userData.luckySpins || 0;
      updates.luckySpins = currentSpins + product.spins;
      responseData.message = `Got ${product.spins} Lucky Spin(s)!`;
      responseData.spins = updates.luckySpins;
      responseData.type = 'spin';
    }
    else if (product.type === 'booster_pack') {
      const activeBoosters = userData.activeBoosters || [];
      activeBoosters.push({
        type: `${product.multiplier}x_tap`,
        name: product.name,
        multiplier: product.multiplier,
        expiresAt: new Date(Date.now() + product.duration * 1000).toISOString()
      });
      updates.activeBoosters = activeBoosters;
      responseData.message = `${product.name} activated!`;
      responseData.type = 'booster';
    }
    else if (product.type === 'energy_refill') {
      updates.energy = userData.maxEnergy || 1000;
      responseData.message = 'Energy fully restored!';
      responseData.energy = updates.energy;
      responseData.type = 'energy';
    }
    else if (product.type === 'mystery_box') {
      const currentBoxes = userData.mysteryBoxes || 0;
      updates.mysteryBoxes = currentBoxes + product.boxes;
      responseData.message = `Got ${product.boxes} Mystery Box(es)!`;
      responseData.boxes = updates.mysteryBoxes;
      responseData.type = 'mystery_box';
    } 
    else if (product.type === 'cosmetic') {
      const ownedCosmetics = userData.ownedCosmetics || [];
      ownedCosmetics.push(product.cosmetic);
      updates.ownedCosmetics = ownedCosmetics;
      updates.activeCosmetic = product.cosmetic;
      responseData.message = `Unlocked ${product.name}!`;
      responseData.cosmetic = product.cosmetic;
      responseData.ownedCosmetics = ownedCosmetics;
      responseData.type = 'cosmetic';
    }
    else if (product.type === 'banana_pass') {
      updates.bananaPass = true;
      updates.bananaPassPurchasedAt = new Date().toISOString();
      updates.miningBonus = 20;
      updates.specialEmoji = '🍌👑';
      updates.badge = 'banana_pass';
      responseData.message = 'Banana Pass Activated! Enjoy +20% mining, special emoji, daily 2x booster!';
      responseData.bananaPass = true;
      responseData.type = 'banana_pass';
    }
    
    await userRef.update(updates);
    
    await db.collection('transactions').add({
      telegramId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      productId: order.productId,
      productType: product.type,
      amount: order.amount,
      type: 'purchase',
      createdAt: new Date().toISOString()
    });
    
    res.json(responseData);
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
    
    const rewards = generateMysteryBoxRewards();
    let updates = {
      mysteryBoxes: userData.mysteryBoxes - 1,
      coins: (userData.coins || 0) + rewards.coins
    };
    
    if (rewards.extras.type === 'energy_refill') {
      updates.energy = userData.maxEnergy || 1000;
    }
    if (rewards.extras.type === 'rare_miner') {
      updates.tapPower = (userData.tapPower || 1) + rewards.extras.value;
    }
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
    await db.collection('boxOpenings').add({ telegramId, rewards, openedAt: new Date().toISOString() });
    
    res.json({ success: true, rewards, remainingBoxes: userData.mysteryBoxes - 1 });
  } catch (error) {
    console.error('Open box error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Claim daily Banana Pass booster
router.post('/claim-pass-booster', async (req, res) => {
  try {
    const { telegramId } = req.body;
    const userRef = db.collection('users').doc(telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userData = userDoc.data();
    if (!userData.bananaPass) {
      return res.status(400).json({ success: false, message: 'Banana Pass required' });
    }
    
    const today = new Date().toDateString();
    if (userData.lastPassBoosterClaim === today) {
      return res.status(400).json({ success: false, message: 'Already claimed today' });
    }
    
    const activeBoosters = userData.activeBoosters || [];
    activeBoosters.push({
      type: '2x_tap',
      name: 'Banana Pass 2x Booster',
      multiplier: 2,
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour
    });
    
    await userRef.update({
      activeBoosters,
      lastPassBoosterClaim: today
    });
    
    res.json({ success: true, message: 'Daily 2x Booster activated for 1 hour!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Equip cosmetic
router.post('/equip-cosmetic', async (req, res) => {
  try {
    const { telegramId, cosmetic } = req.body;
    const userRef = db.collection('users').doc(telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userData = userDoc.data();
    const ownedCosmetics = userData.ownedCosmetics || [];
    
    if (!ownedCosmetics.includes(cosmetic)) {
      return res.status(400).json({ success: false, message: 'You do not own this cosmetic' });
    }
    
    await userRef.update({ activeCosmetic: cosmetic });
    res.json({ success: true, message: 'Cosmetic equipped!', activeCosmetic: cosmetic });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user purchases/inventory
router.get('/inventory/:telegramId', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.telegramId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userData = userDoc.data();
    res.json({
      success: true,
      mysteryBoxes: userData.mysteryBoxes || 0,
      ownedCosmetics: userData.ownedCosmetics || [],
      activeCosmetic: userData.activeCosmetic || null,
      bananaPass: userData.bananaPass || false,
      miningBonus: userData.miningBonus || 0,
      specialEmoji: userData.specialEmoji || null,
      badge: userData.badge || null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

function generateMysteryBoxRewards() {
  const coinTier = weightedRandom(MYSTERY_BOX_REWARDS.coins);
  const coins = Math.floor(Math.random() * (coinTier.max - coinTier.min + 1)) + coinTier.min;
  const booster = weightedRandom(MYSTERY_BOX_REWARDS.boosters);
  const extras = weightedRandom(MYSTERY_BOX_REWARDS.extras);
  return { coins, booster, extras };
}

function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.probability, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.probability;
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

router.get('/boxes/:telegramId', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.telegramId).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, boxes: userDoc.data().mysteryBoxes || 0 });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/products', (req, res) => {
  res.json({ success: true, products: Object.values(PRODUCTS) });
});

// Lucky Spin rewards configuration
const SPIN_REWARDS = [
  { type: 'coins', value: 1000, probability: 25, label: '1K Coins' },
  { type: 'coins', value: 5000, probability: 20, label: '5K Coins' },
  { type: 'coins', value: 10000, probability: 15, label: '10K Coins' },
  { type: 'coins', value: 25000, probability: 10, label: '25K Coins' },
  { type: 'coins', value: 50000, probability: 5, label: '50K Coins' },
  { type: 'coins', value: 100000, probability: 2, label: '100K Coins!' },
  { type: 'energy', value: 'full', probability: 10, label: 'Full Energy' },
  { type: 'booster', value: '2x', duration: 1800, probability: 8, label: '2x Boost 30m' },
  { type: 'booster', value: '3x', duration: 1800, probability: 3, label: '3x Boost 30m' },
  { type: 'box', value: 1, probability: 2, label: 'Mystery Box!' }
];

// Use Lucky Spin
router.post('/use-spin', async (req, res) => {
  try {
    const { telegramId } = req.body;
    const userRef = db.collection('users').doc(telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userData = userDoc.data();
    if (!userData.luckySpins || userData.luckySpins < 1) {
      return res.status(400).json({ success: false, message: 'No spins available' });
    }
    
    // Get random reward
    const reward = weightedRandom(SPIN_REWARDS);
    let updates = { luckySpins: userData.luckySpins - 1 };
    
    // Apply reward
    if (reward.type === 'coins') {
      updates.coins = (userData.coins || 0) + reward.value;
    } else if (reward.type === 'energy') {
      updates.energy = userData.maxEnergy || 1000;
    } else if (reward.type === 'booster') {
      const activeBoosters = userData.activeBoosters || [];
      const multiplier = reward.value === '3x' ? 3 : 2;
      activeBoosters.push({
        type: `${multiplier}x_tap`,
        name: `${multiplier}x Spin Booster`,
        multiplier: multiplier,
        expiresAt: new Date(Date.now() + reward.duration * 1000).toISOString()
      });
      updates.activeBoosters = activeBoosters;
    } else if (reward.type === 'box') {
      updates.mysteryBoxes = (userData.mysteryBoxes || 0) + reward.value;
    }
    
    await userRef.update(updates);
    
    res.json({
      success: true,
      reward: {
        type: reward.type,
        value: reward.value,
        label: reward.label
      },
      remainingSpins: userData.luckySpins - 1
    });
  } catch (error) {
    console.error('Spin error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user spins count
router.get('/spins/:telegramId', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.telegramId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, spins: userDoc.data().luckySpins || 0 });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

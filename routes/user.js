const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// Generate unique referral code
function generateReferralCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Create or Get User
router.post('/init', async (req, res) => {
  try {
    const { telegramId, username, firstName, lastName, referredBy, photoUrl } = req.body;

    const userRef = db.collection('users').doc(telegramId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Create new user
      const newUser = {
        telegramId,
        username,
        firstName,
        lastName: lastName || '',
        photoUrl: photoUrl || null,
        coins: 1000,
        totalTaps: 0,
        energy: 1000,
        maxEnergy: 1000,
        level: 1,
        tapPower: 1,
        miners: {},
        boosters: {},
        claimedLeagues: [],
        referralCode: generateReferralCode(),
        referredBy: referredBy || null,
        referrals: [],
        completedTasks: [],
        lastDailyReward: null,
        dailyStreak: 0,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };

      // Add referral bonus - both referrer and new user get coins
      if (referredBy) {
        const referrerQuery = await db.collection('users')
          .where('referralCode', '==', referredBy)
          .limit(1)
          .get();
        
        if (!referrerQuery.empty) {
          const referrerDoc = referrerQuery.docs[0];
          const referrerData = referrerDoc.data();
          
          // Make sure not self-referral
          if (referrerData.telegramId !== telegramId) {
            // Give referrer 2500 coins
            const referrerReferrals = referrerData.referrals || [];
            if (!referrerReferrals.includes(telegramId)) {
              await referrerDoc.ref.update({
                referrals: [...referrerReferrals, telegramId],
                coins: (referrerData.coins || 0) + 2500
              });
              console.log(`🎁 Referral bonus: ${referrerData.username} got 2500 coins for inviting ${username}`);
              
              // Give new user bonus coins too
              newUser.coins = 2000; // 1000 base + 1000 referral bonus
              newUser.referredBy = referredBy;
            }
          }
        }
      }

      await userRef.set(newUser);
      res.json({ success: true, user: newUser });
    } else {
      // Update last active
      await userRef.update({ lastActive: new Date().toISOString() });
      res.json({ success: true, user: userDoc.data() });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get User Profile
router.get('/:telegramId', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.telegramId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Include gifts data
    res.json({ 
      success: true, 
      user: userData,
      gifts: {
        freeSpins: userData.freeSpins || 0,
        mysteryBoxes: userData.mysteryBoxes || [],
        lastGift: userData.lastGift || null,
        notifications: userData.notifications || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check for pending gifts/rewards
router.get('/:telegramId/gifts', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.telegramId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData = userDoc.data();
    
    res.json({ 
      success: true,
      freeSpins: userData.freeSpins || 0,
      mysteryBoxes: userData.mysteryBoxes || [],
      lastGift: userData.lastGift || null,
      spinGift: userData.spinGift || null,
      notifications: (userData.notifications || []).filter(n => !n.read)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Use a free spin
router.post('/:telegramId/use-spin', async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.params.telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData = userDoc.data();
    const freeSpins = userData.freeSpins || 0;
    
    if (freeSpins <= 0) {
      return res.status(400).json({ success: false, message: 'No free spins available' });
    }
    
    // Generate random reward
    const rewards = [
      { type: 'coins', amount: 100, chance: 30 },
      { type: 'coins', amount: 500, chance: 25 },
      { type: 'coins', amount: 1000, chance: 20 },
      { type: 'coins', amount: 5000, chance: 15 },
      { type: 'coins', amount: 10000, chance: 7 },
      { type: 'coins', amount: 50000, chance: 2 },
      { type: 'energy', amount: 500, chance: 1 }
    ];
    
    // Weighted random selection
    const totalChance = rewards.reduce((sum, r) => sum + r.chance, 0);
    let random = Math.random() * totalChance;
    let reward = rewards[0];
    
    for (const r of rewards) {
      random -= r.chance;
      if (random <= 0) {
        reward = r;
        break;
      }
    }
    
    // Apply reward
    const updates = { freeSpins: freeSpins - 1 };
    
    if (reward.type === 'coins') {
      updates.coins = (userData.coins || 0) + reward.amount;
    } else if (reward.type === 'energy') {
      updates.energy = Math.min((userData.energy || 0) + reward.amount, userData.maxEnergy || 1000);
    }
    
    await userRef.update(updates);
    
    res.json({ 
      success: true, 
      reward,
      remainingSpins: freeSpins - 1
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Open mystery box
router.post('/:telegramId/open-mystery-box', async (req, res) => {
  try {
    const { boxIndex } = req.body;
    const userRef = db.collection('users').doc(req.params.telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData = userDoc.data();
    const mysteryBoxes = userData.mysteryBoxes || [];
    
    if (!mysteryBoxes.length || boxIndex >= mysteryBoxes.length) {
      return res.status(400).json({ success: false, message: 'No mystery box available' });
    }
    
    const box = mysteryBoxes[boxIndex];
    
    // Generate reward based on box type
    const min = box.minReward || 100;
    const max = box.maxReward || 1000;
    const rewardAmount = Math.floor(Math.random() * (max - min + 1)) + min;
    
    // Remove the opened box
    mysteryBoxes.splice(boxIndex, 1);
    
    // Add coins
    const newCoins = (userData.coins || 0) + rewardAmount;
    
    await userRef.update({
      mysteryBoxes,
      coins: newCoins
    });
    
    res.json({ 
      success: true, 
      reward: { type: 'coins', amount: rewardAmount },
      boxType: box.type,
      remainingBoxes: mysteryBoxes.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Leaderboard - Multiple types
router.get('/leaderboard/top', async (req, res) => {
  try {
    const type = req.query.type || 'coins';
    let orderField = 'coins';
    
    if (type === 'miners') orderField = 'totalTaps';
    else if (type === 'level') orderField = 'level';
    else if (type === 'weekly') orderField = 'weeklyCoins';
    
    const usersSnapshot = await db.collection('users')
      .orderBy(orderField, 'desc')
      .limit(100)
      .get();
    
    const leaderboard = usersSnapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        rank: index + 1,
        username: data.username,
        firstName: data.firstName,
        coins: data.coins,
        level: data.level || 1,
        totalTaps: data.totalTaps || 0,
        weeklyCoins: data.weeklyCoins || 0,
        bananaPass: data.bananaPass || false,
        photoUrl: data.photoUrl || null
      };
    });
    
    res.json({ success: true, leaderboard, type });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user rank
router.get('/rank/:telegramId', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.telegramId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    // Count users with more coins
    const higherCoinsSnapshot = await db.collection('users')
      .where('coins', '>', userData.coins)
      .count()
      .get();
    
    const rank = higherCoinsSnapshot.data().count + 1;
    
    res.json({ 
      success: true, 
      rank,
      coins: userData.coins,
      level: userData.level,
      totalTaps: userData.totalTaps
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get referral stats
router.get('/referrals/:telegramId', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.telegramId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData = userDoc.data();
    const referrals = userData.referrals || [];
    
    // Get referral details
    const referralDetails = [];
    for (const refId of referrals.slice(0, 50)) { // Limit to 50
      const refDoc = await db.collection('users').doc(refId).get();
      if (refDoc.exists) {
        const refData = refDoc.data();
        referralDetails.push({
          username: refData.username,
          firstName: refData.firstName,
          joinedAt: refData.createdAt,
          level: refData.level || 1
        });
      }
    }
    
    res.json({ 
      success: true, 
      referralCode: userData.referralCode,
      totalReferrals: referrals.length,
      totalEarnings: referrals.length * 2500,
      referrals: referralDetails
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset user (for testing)
router.post('/reset/:telegramId', async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.params.telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await userRef.update({
      coins: 1000,
      energy: 1000,
      totalTaps: 0,
      level: 1,
      tapPower: 1,
      miners: {},
      dailyStreak: 0
    });

    res.json({ success: true, message: 'User reset to default values' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

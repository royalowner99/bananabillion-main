const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// Anti-cheat: Track tap rates per user
const tapRateLimits = new Map();
const TAP_RATE_WINDOW = 10000; // 10 second window
const MAX_TAPS_PER_WINDOW = 200; // Max 200 taps per 10 seconds (20/sec average)
const SUSPICIOUS_THRESHOLD = 300; // Flag if over 300 taps in window

// Tap Action - saves all user data from client
router.post('/tap', async (req, res) => {
  try {
    const { telegramId, taps, currentCoins, currentEnergy, totalTaps, level, tapPower, maxEnergy } = req.body;

    // Anti-cheat: Rate limiting
    const now = Date.now();
    let userTapData = tapRateLimits.get(telegramId) || { taps: 0, windowStart: now, warnings: 0, flagged: false };
    
    // Reset window if expired
    if (now - userTapData.windowStart > TAP_RATE_WINDOW) {
      userTapData = { taps: 0, windowStart: now, warnings: userTapData.warnings, flagged: userTapData.flagged };
    }
    
    // Add taps to window
    userTapData.taps += taps;
    
    // Check for suspicious activity
    if (userTapData.taps > SUSPICIOUS_THRESHOLD) {
      userTapData.flagged = true;
      userTapData.warnings++;
      console.log(`⚠️ Suspicious tap activity: ${telegramId} - ${userTapData.taps} taps in ${TAP_RATE_WINDOW/1000}s`);
    }
    
    // Reject if over limit
    if (userTapData.taps > MAX_TAPS_PER_WINDOW) {
      tapRateLimits.set(telegramId, userTapData);
      return res.status(429).json({ 
        success: false, 
        message: 'Too many taps! Slow down.',
        cooldown: TAP_RATE_WINDOW - (now - userTapData.windowStart)
      });
    }
    
    tapRateLimits.set(telegramId, userTapData);

    const userRef = db.collection('users').doc(telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userDoc.data();
    
    // Anti-cheat: Validate tap power isn't impossibly high
    const maxPossibleTapPower = (user.tapPower || 1) * 10; // Max 10x with all boosters
    if (tapPower && tapPower > maxPossibleTapPower) {
      console.log(`⚠️ Suspicious tap power: ${telegramId} - claimed ${tapPower}, max possible ${maxPossibleTapPower}`);
      return res.status(400).json({ success: false, message: 'Invalid tap power' });
    }
    
    // Anti-cheat: Validate coins gained isn't impossibly high
    const maxCoinsPerTap = maxPossibleTapPower;
    const maxPossibleCoins = user.coins + (taps * maxCoinsPerTap);
    if (currentCoins && currentCoins > maxPossibleCoins + 10000) { // 10k buffer for passive income
      console.log(`⚠️ Suspicious coins: ${telegramId} - claimed ${currentCoins}, max possible ${maxPossibleCoins}`);
      // Don't reject, but cap the coins
      req.body.currentCoins = maxPossibleCoins;
    }
    
    // Use client values if provided, otherwise calculate
    const newCoins = currentCoins !== undefined ? Number(currentCoins) : (user.coins + (taps * user.tapPower));
    const newEnergy = currentEnergy !== undefined ? Number(currentEnergy) : Math.max(0, user.energy - taps);
    const newTotalTaps = totalTaps !== undefined ? Number(totalTaps) : (user.totalTaps + taps);
    const newLevel = level !== undefined ? Number(level) : user.level;
    const newTapPower = tapPower !== undefined ? Number(tapPower) : user.tapPower;
    const newMaxEnergy = maxEnergy !== undefined ? Number(maxEnergy) : user.maxEnergy;

    await userRef.update({
      coins: newCoins,
      totalTaps: newTotalTaps,
      energy: newEnergy,
      level: newLevel,
      tapPower: newTapPower,
      maxEnergy: newMaxEnergy,
      lastActive: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      coins: newCoins, 
      energy: newEnergy,
      totalTaps: newTotalTaps,
      level: newLevel,
      tapPower: newTapPower,
      maxEnergy: newMaxEnergy
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Restore Energy
router.post('/restore-energy', async (req, res) => {
  try {
    const { telegramId } = req.body;

    const userRef = db.collection('users').doc(telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userDoc.data();
    const now = Date.now();
    const lastActive = new Date(user.lastActive).getTime();
    const timePassed = (now - lastActive) / 1000;
    const energyRestored = Math.floor(timePassed / 3);

    const newEnergy = Math.min(user.energy + energyRestored, user.maxEnergy);

    await userRef.update({
      energy: newEnergy,
      lastActive: new Date().toISOString()
    });

    res.json({ success: true, energy: newEnergy });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Claim Daily Reward
router.post('/daily-reward', async (req, res) => {
  try {
    const { telegramId } = req.body;

    const userRef = db.collection('users').doc(telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userDoc.data();
    const now = new Date();
    const lastReward = user.lastDailyReward ? new Date(user.lastDailyReward) : null;

    if (lastReward) {
      const hoursSinceLastReward = (now - lastReward) / (1000 * 60 * 60);
      if (hoursSinceLastReward < 24) {
        return res.status(400).json({ 
          success: false, 
          message: 'Daily reward already claimed',
          nextRewardIn: 24 - hoursSinceLastReward
        });
      }
    }

    const newStreak = user.dailyStreak + 1;
    const reward = 500 + (newStreak * 100);
    const newCoins = user.coins + reward;

    await userRef.update({
      dailyStreak: newStreak,
      coins: newCoins,
      lastDailyReward: now.toISOString()
    });

    res.json({ 
      success: true, 
      reward, 
      coins: newCoins,
      streak: newStreak 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upgrade Tap Power
router.post('/upgrade-tap', async (req, res) => {
  try {
    const { telegramId } = req.body;

    const userRef = db.collection('users').doc(telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userDoc.data();
    const upgradeCost = user.tapPower * 1000;
    
    if (user.coins < upgradeCost) {
      return res.status(400).json({ success: false, message: 'Not enough coins' });
    }

    const newCoins = user.coins - upgradeCost;
    const newTapPower = user.tapPower + 1;

    await userRef.update({
      coins: newCoins,
      tapPower: newTapPower
    });

    res.json({ 
      success: true, 
      tapPower: newTapPower,
      coins: newCoins 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upgrade Energy
router.post('/upgrade-energy', async (req, res) => {
  try {
    const { telegramId } = req.body;

    const userRef = db.collection('users').doc(telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userDoc.data();
    const upgradeCost = (user.maxEnergy / 1000) * 2000;
    
    if (user.coins < upgradeCost) {
      return res.status(400).json({ success: false, message: 'Not enough coins' });
    }

    const newCoins = user.coins - upgradeCost;
    const newMaxEnergy = user.maxEnergy + 500;

    await userRef.update({
      coins: newCoins,
      maxEnergy: newMaxEnergy,
      energy: newMaxEnergy
    });

    res.json({ 
      success: true, 
      maxEnergy: newMaxEnergy,
      energy: newMaxEnergy,
      coins: newCoins 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upgrade Miner
router.post('/upgrade-miner', async (req, res) => {
  try {
    const { telegramId, minerId, price } = req.body;

    const userRef = db.collection('users').doc(telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userDoc.data();
    
    if (user.coins < price) {
      return res.status(400).json({ success: false, message: 'Not enough coins' });
    }

    const miners = user.miners || {};
    const currentLevel = miners[minerId] || 0;
    miners[minerId] = currentLevel + 1;

    const newCoins = user.coins - price;
    const newTapPower = (user.tapPower || 1) + Math.floor(price / 1000);

    await userRef.update({
      coins: newCoins,
      miners: miners,
      tapPower: newTapPower
    });

    res.json({ 
      success: true, 
      miners: miners,
      tapPower: newTapPower,
      coins: newCoins 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upgrade Booster
router.post('/upgrade-booster', async (req, res) => {
  try {
    const { telegramId, boosterId, price, newLevel, currentCoins } = req.body;

    const userRef = db.collection('users').doc(telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userDoc.data();
    
    // Verify user has enough coins
    if (user.coins < price) {
      return res.status(400).json({ success: false, message: 'Not enough coins' });
    }

    const boosters = user.boosters || {};
    boosters[boosterId] = newLevel;

    // Calculate new stats based on booster
    let updates = {
      coins: currentCoins !== undefined ? currentCoins : user.coins - price,
      boosters: boosters
    };

    // Apply booster effects - base tap power from level + multitap level
    if (boosterId === 'multitap') {
      const baseTapPower = 1 + Math.floor(((user.level || 1) - 1) * 1); // 1 tap power per level
      updates.tapPower = baseTapPower + newLevel;
    } else if (boosterId === 'energy_limit') {
      const baseMaxEnergy = 1000 + Math.floor((user.level || 1) / 5) * 50; // 50 energy per 5 levels
      updates.maxEnergy = baseMaxEnergy + (newLevel * 500);
    }

    await userRef.update(updates);

    res.json({ 
      success: true, 
      boosters: boosters,
      coins: updates.coins,
      tapPower: updates.tapPower || user.tapPower,
      maxEnergy: updates.maxEnergy || user.maxEnergy
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Claim League Reward
router.post('/claim-league', async (req, res) => {
  try {
    const { telegramId, leagueId, reward, currentCoins } = req.body;

    const userRef = db.collection('users').doc(telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userDoc.data();
    const claimedLeagues = user.claimedLeagues || [];
    
    // Check if already claimed
    if (claimedLeagues.includes(leagueId)) {
      return res.status(400).json({ success: false, message: 'League already claimed' });
    }

    claimedLeagues.push(leagueId);
    const newCoins = currentCoins !== undefined ? currentCoins : user.coins + reward;

    await userRef.update({
      coins: newCoins,
      claimedLeagues: claimedLeagues
    });

    res.json({ 
      success: true, 
      coins: newCoins,
      claimedLeagues: claimedLeagues
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get active boosters (clean up expired ones)
router.get('/active-boosters/:telegramId', async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.params.telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userDoc.data();
    const activeBoosters = user.activeBoosters || [];
    const now = new Date();
    
    // Filter out expired boosters
    const validBoosters = activeBoosters.filter(b => new Date(b.expiresAt) > now);
    
    // Update if any expired
    if (validBoosters.length !== activeBoosters.length) {
      await userRef.update({ activeBoosters: validBoosters });
    }

    res.json({ 
      success: true, 
      activeBoosters: validBoosters
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sync user data (for periodic saves)
router.post('/sync', async (req, res) => {
  try {
    const { telegramId, coins, energy, totalTaps, level, tapPower, maxEnergy, activeBoosters } = req.body;

    const userRef = db.collection('users').doc(telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updates = {
      lastActive: new Date().toISOString()
    };
    
    if (coins !== undefined) updates.coins = Number(coins);
    if (energy !== undefined) updates.energy = Number(energy);
    if (totalTaps !== undefined) updates.totalTaps = Number(totalTaps);
    if (level !== undefined) updates.level = Number(level);
    if (tapPower !== undefined) updates.tapPower = Number(tapPower);
    if (maxEnergy !== undefined) updates.maxEnergy = Number(maxEnergy);
    if (activeBoosters !== undefined) {
      // Clean up expired boosters before saving
      const now = new Date();
      updates.activeBoosters = activeBoosters.filter(b => new Date(b.expiresAt) > now);
    }

    await userRef.update(updates);

    res.json({ success: true, message: 'Data synced' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

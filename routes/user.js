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

      // Add referral bonus
      if (referredBy) {
        const referrerQuery = await db.collection('users')
          .where('referralCode', '==', referredBy)
          .limit(1)
          .get();
        
        if (!referrerQuery.empty) {
          const referrerDoc = referrerQuery.docs[0];
          await referrerDoc.ref.update({
            referrals: [...referrerDoc.data().referrals, telegramId],
            coins: referrerDoc.data().coins + 1000
          });
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

    res.json({ success: true, user: userDoc.data() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Leaderboard
router.get('/leaderboard/top', async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users')
      .orderBy('coins', 'desc')
      .limit(100)
      .get();
    
    const leaderboard = usersSnapshot.docs.map(doc => ({
      username: doc.data().username,
      firstName: doc.data().firstName,
      coins: doc.data().coins,
      level: doc.data().level,
      totalTaps: doc.data().totalTaps
    }));
    
    res.json({ success: true, leaderboard });
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

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// Admin IDs from environment
const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(id => id.trim());

// Middleware to check admin
function isAdmin(req, res, next) {
  const adminId = req.headers['x-admin-id'] || req.query.adminId;
  if (!adminId || !ADMIN_IDS.includes(adminId)) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
  next();
}

// Get all stats
router.get('/stats', isAdmin, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const tasksSnapshot = await db.collection('tasks').get();
    
    let totalCoins = 0;
    let totalTaps = 0;
    let totalReferrals = 0;
    
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      totalCoins += data.coins || 0;
      totalTaps += data.totalTaps || 0;
      totalReferrals += (data.referrals || []).length;
    });
    
    res.json({
      success: true,
      stats: {
        totalUsers: usersSnapshot.size,
        totalTasks: tasksSnapshot.size,
        totalCoins,
        totalTaps,
        totalReferrals,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all users
router.get('/users', isAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const usersSnapshot = await db.collection('users')
      .orderBy('coins', 'desc')
      .limit(limit)
      .get();
    
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ success: true, users, total: usersSnapshot.size });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single user
router.get('/user/:telegramId', isAdmin, async (req, res) => {
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

// Update user (add/remove coins, ban, etc.)
router.post('/user/:telegramId/update', isAdmin, async (req, res) => {
  try {
    const { coins, energy, level, tapPower, banned } = req.body;
    const userRef = db.collection('users').doc(req.params.telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const updates = {};
    if (coins !== undefined) updates.coins = Number(coins);
    if (energy !== undefined) updates.energy = Number(energy);
    if (level !== undefined) updates.level = Number(level);
    if (tapPower !== undefined) updates.tapPower = Number(tapPower);
    if (banned !== undefined) updates.banned = Boolean(banned);
    
    await userRef.update(updates);
    
    res.json({ success: true, message: 'User updated', updates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add coins to user
router.post('/user/:telegramId/add-coins', isAdmin, async (req, res) => {
  try {
    const { amount } = req.body;
    const userRef = db.collection('users').doc(req.params.telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const currentCoins = userDoc.data().coins || 0;
    const newCoins = currentCoins + Number(amount);
    
    await userRef.update({ coins: newCoins });
    
    res.json({ success: true, message: `Added ${amount} coins`, newBalance: newCoins });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete user
router.delete('/user/:telegramId', isAdmin, async (req, res) => {
  try {
    await db.collection('users').doc(req.params.telegramId).delete();
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all tasks
router.get('/tasks', isAdmin, async (req, res) => {
  try {
    const tasksSnapshot = await db.collection('tasks').get();
    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create task
router.post('/task/create', isAdmin, async (req, res) => {
  try {
    const { title, description, type, reward, icon, link, chatId, isActive } = req.body;
    
    const taskData = {
      title,
      description: description || '',
      type: type || 'social',
      reward: Number(reward) || 1000,
      icon: icon || '📋',
      link: link || '',
      chatId: chatId || '',
      isActive: isActive !== false,
      createdAt: new Date().toISOString()
    };
    
    const taskRef = await db.collection('tasks').add(taskData);
    
    res.json({ success: true, task: { id: taskRef.id, ...taskData } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update task
router.post('/task/:taskId/update', isAdmin, async (req, res) => {
  try {
    const { title, description, type, reward, icon, link, chatId, isActive } = req.body;
    const taskRef = db.collection('tasks').doc(req.params.taskId);
    
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (type !== undefined) updates.type = type;
    if (reward !== undefined) updates.reward = Number(reward);
    if (icon !== undefined) updates.icon = icon;
    if (link !== undefined) updates.link = link;
    if (chatId !== undefined) updates.chatId = chatId;
    if (isActive !== undefined) updates.isActive = Boolean(isActive);
    
    await taskRef.update(updates);
    
    res.json({ success: true, message: 'Task updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete task
router.delete('/task/:taskId', isAdmin, async (req, res) => {
  try {
    await db.collection('tasks').doc(req.params.taskId).delete();
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Broadcast message to all users (returns user list for bot to message)
router.get('/broadcast/users', isAdmin, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const userIds = usersSnapshot.docs.map(doc => doc.data().telegramId);
    
    res.json({ success: true, userIds, total: userIds.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset all users (dangerous!)
router.post('/reset-all', isAdmin, async (req, res) => {
  try {
    const { confirm } = req.body;
    if (confirm !== 'RESET_ALL_USERS') {
      return res.status(400).json({ success: false, message: 'Confirmation required' });
    }
    
    const usersSnapshot = await db.collection('users').get();
    const batch = db.batch();
    
    usersSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        coins: 1000,
        energy: 1000,
        totalTaps: 0,
        level: 1,
        tapPower: 1
      });
    });
    
    await batch.commit();
    
    res.json({ success: true, message: `Reset ${usersSnapshot.size} users` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

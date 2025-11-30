const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../config/firebase');

// Admin credentials from environment
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Simple token store (in production, use Redis or database)
const activeTokens = new Map();

// Generate secure token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Activity logging helper (defined early so it can be used in login)
async function logActivity(type, message, userId = null) {
  try {
    await db.collection('admin_logs').add({
      type,
      message,
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Log error:', e.message);
  }
}

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('Login attempt:', { 
      username, 
      password: password ? '***' : 'empty',
      expectedUser: ADMIN_USERNAME,
      userMatch: username === ADMIN_USERNAME,
      passMatch: password === ADMIN_PASSWORD
    });
    
    if (!username || username !== ADMIN_USERNAME) {
      logActivity('error', `Failed login attempt: ${username}`);
      return res.status(403).json({ success: false, message: 'Invalid username' });
    }
    
    if (!password || password !== ADMIN_PASSWORD) {
      logActivity('error', `Wrong password for: ${username}`);
      return res.status(403).json({ success: false, message: 'Invalid password' });
    }
    
    const token = generateToken();
    activeTokens.set(token, { username, createdAt: Date.now() });
    
    logActivity('admin', `Admin logged in: ${username}`);
    
    res.json({ success: true, token, username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify session
router.get('/verify', isAdmin, (req, res) => {
  res.json({ success: true, username: req.adminUsername });
});

// Middleware to check admin
function isAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  
  if (!token) {
    return res.status(403).json({ success: false, message: 'No token provided' });
  }
  
  const session = activeTokens.get(token);
  if (!session) {
    return res.status(403).json({ success: false, message: 'Invalid session' });
  }
  
  // Check token expiry (24 hours)
  if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
    activeTokens.delete(token);
    return res.status(403).json({ success: false, message: 'Session expired' });
  }
  
  req.adminUsername = session.username;
  next();
}

// Get all stats
router.get('/stats', isAdmin, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const tasksSnapshot = await db.collection('tasks').where('isActive', '==', true).get();
    
    let totalCoins = 0;
    let totalTaps = 0;
    let totalReferrals = 0;
    let todayUsers = 0;
    const today = new Date().toISOString().split('T')[0];
    
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      totalCoins += data.coins || 0;
      totalTaps += data.totalTaps || 0;
      totalReferrals += (data.referrals || []).length;
      if (data.createdAt && data.createdAt.startsWith(today)) {
        todayUsers++;
      }
    });
    
    res.json({
      success: true,
      stats: {
        totalUsers: usersSnapshot.size,
        totalTasks: tasksSnapshot.size,
        totalCoins,
        totalTaps,
        totalReferrals,
        todayUsers,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recent activity
router.get('/activity', isAdmin, async (req, res) => {
  try {
    const logsSnapshot = await db.collection('admin_logs')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    
    const activities = logsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        icon: data.type === 'admin' ? '👤' : data.type === 'error' ? '❌' : '📌',
        text: data.message,
        timestamp: data.timestamp
      };
    });
    
    res.json({ success: true, activities });
  } catch (error) {
    res.json({ success: true, activities: [] });
  }
});

// Get all users with pagination and sorting
router.get('/users', isAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const sort = req.query.sort || 'coins';
    
    let query = db.collection('users');
    
    if (sort === 'coins') {
      query = query.orderBy('coins', 'desc');
    } else if (sort === 'createdAt') {
      query = query.orderBy('createdAt', 'desc');
    } else if (sort === 'totalTaps') {
      query = query.orderBy('totalTaps', 'desc');
    }
    
    const usersSnapshot = await query.limit(limit).get();
    
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

// Update user
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
    await logActivity('admin', `Updated user ${req.params.telegramId}`, req.adminId);
    
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
    await logActivity('admin', `Added ${amount} coins to user ${req.params.telegramId}`, req.adminId);
    
    res.json({ success: true, message: `Added ${amount} coins`, newBalance: newCoins });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete user
router.delete('/user/:telegramId', isAdmin, async (req, res) => {
  try {
    await db.collection('users').doc(req.params.telegramId).delete();
    await logActivity('admin', `Deleted user ${req.params.telegramId}`, req.adminId);
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
    await logActivity('admin', `Created task: ${title}`, req.adminId);
    
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
    await logActivity('admin', `Updated task ${req.params.taskId}`, req.adminId);
    
    res.json({ success: true, message: 'Task updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete task
router.delete('/task/:taskId', isAdmin, async (req, res) => {
  try {
    await db.collection('tasks').doc(req.params.taskId).delete();
    await logActivity('admin', `Deleted task ${req.params.taskId}`, req.adminId);
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete all tasks
router.delete('/tasks/delete-all', isAdmin, async (req, res) => {
  try {
    const tasksSnapshot = await db.collection('tasks').get();
    const batch = db.batch();
    tasksSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    await logActivity('admin', 'Deleted all tasks', req.adminId);
    res.json({ success: true, message: `Deleted ${tasksSnapshot.size} tasks` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Broadcast - Get users for broadcast
router.get('/broadcast/users', isAdmin, async (req, res) => {
  try {
    const target = req.query.target || 'all';
    let query = db.collection('users');
    
    if (target === 'active') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.where('lastActive', '>=', weekAgo);
    } else if (target === 'top') {
      query = query.orderBy('coins', 'desc').limit(100);
    }
    
    const usersSnapshot = await query.get();
    const userIds = usersSnapshot.docs.map(doc => doc.data().telegramId).filter(Boolean);
    
    res.json({ success: true, userIds, total: userIds.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Broadcast - Send message
router.post('/broadcast/send', isAdmin, async (req, res) => {
  try {
    const { message, type, target, photo, buttonText, buttonUrl } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    
    // Check if bot is available
    if (!global.bot) {
      return res.status(400).json({ success: false, message: 'Bot is not connected' });
    }
    
    // Get target users
    let query = db.collection('users');
    if (target === 'active') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.where('lastActive', '>=', weekAgo);
    } else if (target === 'top') {
      query = query.orderBy('coins', 'desc').limit(100);
    } else if (target === 'inactive') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.where('lastActive', '<', weekAgo);
    }
    
    const usersSnapshot = await query.get();
    const userIds = usersSnapshot.docs.map(doc => doc.data().telegramId).filter(Boolean);
    
    if (userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No users found for this target' });
    }
    
    // Store broadcast record
    const broadcastData = {
      message,
      type,
      target,
      photo,
      buttonText,
      buttonUrl,
      totalUsers: userIds.length,
      sent: 0,
      failed: 0,
      status: 'sending',
      createdAt: new Date().toISOString()
    };
    
    const broadcastRef = await db.collection('broadcasts').add(broadcastData);
    
    // Send messages in background (don't await)
    sendBroadcastMessages(broadcastRef.id, userIds, message, type, photo, buttonText, buttonUrl);
    
    await logActivity('admin', `Broadcast started to ${userIds.length} users`, req.adminUsername);
    
    res.json({ 
      success: true, 
      broadcastId: broadcastRef.id,
      totalUsers: userIds.length,
      message: `Sending broadcast to ${userIds.length} users...`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Background function to send broadcast messages
async function sendBroadcastMessages(broadcastId, userIds, message, type, photo, buttonText, buttonUrl) {
  let sent = 0;
  let failed = 0;
  
  // Prepare inline keyboard if button is provided
  let replyMarkup = null;
  if (buttonText && buttonUrl) {
    replyMarkup = {
      inline_keyboard: [[{ text: buttonText, url: buttonUrl }]]
    };
  }
  
  for (const chatId of userIds) {
    try {
      if (type === 'photo' && photo) {
        await global.bot.sendPhoto(chatId, photo, {
          caption: message,
          parse_mode: 'Markdown',
          reply_markup: replyMarkup
        });
      } else {
        await global.bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_markup: replyMarkup
        });
      }
      sent++;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      failed++;
      console.log(`Broadcast failed for ${chatId}:`, error.message);
    }
    
    // Update progress every 10 messages
    if ((sent + failed) % 10 === 0) {
      try {
        await db.collection('broadcasts').doc(broadcastId).update({ sent, failed });
      } catch (e) {}
    }
  }
  
  // Final update
  try {
    await db.collection('broadcasts').doc(broadcastId).update({
      sent,
      failed,
      status: 'sent',
      completedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error('Failed to update broadcast status:', e.message);
  }
  
  console.log(`✅ Broadcast complete: ${sent} sent, ${failed} failed`);
}

// Broadcast history
router.get('/broadcast/history', isAdmin, async (req, res) => {
  try {
    const broadcastsSnapshot = await db.collection('broadcasts')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    
    const broadcasts = broadcastsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ success: true, broadcasts });
  } catch (error) {
    res.json({ success: true, broadcasts: [] });
  }
});

// Bot status
router.get('/bot/status', isAdmin, async (req, res) => {
  try {
    const isRunning = global.bot !== null && global.bot !== undefined;
    res.json({
      success: true,
      isRunning,
      mode: process.env.NODE_ENV === 'production' ? 'Webhook' : 'Polling',
      username: process.env.BOT_USERNAME || 'N/A',
      uptime: process.uptime() ? formatUptime(process.uptime()) : 'N/A'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

// Bot test connection
router.get('/bot/test', isAdmin, async (req, res) => {
  try {
    if (global.bot) {
      const me = await global.bot.getMe();
      res.json({ success: true, bot: me });
    } else {
      res.json({ success: false, message: 'Bot not initialized' });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Bot restart (placeholder - actual implementation depends on deployment)
router.post('/bot/restart', isAdmin, async (req, res) => {
  await logActivity('admin', 'Bot restart requested', req.adminId);
  res.json({ success: true, message: 'Restart signal sent' });
});

// Clear bot cache
router.post('/bot/clear-cache', isAdmin, async (req, res) => {
  await logActivity('admin', 'Bot cache cleared', req.adminId);
  res.json({ success: true, message: 'Cache cleared' });
});

// Game settings
router.get('/settings', isAdmin, async (req, res) => {
  try {
    const settingsDoc = await db.collection('config').doc('game_settings').get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {
      initialCoins: 1000,
      tapReward: 1,
      dailyReward: 500,
      referralReward: 2500,
      maxEnergy: 1000,
      energyRegen: 1
    };
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/settings', isAdmin, async (req, res) => {
  try {
    const settings = req.body;
    await db.collection('config').doc('game_settings').set(settings, { merge: true });
    await logActivity('admin', 'Game settings updated', req.adminId);
    res.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset all users
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
    await logActivity('admin', `Reset ${usersSnapshot.size} users`, req.adminId);
    
    res.json({ success: true, message: `Reset ${usersSnapshot.size} users` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear all data
router.delete('/clear-all', isAdmin, async (req, res) => {
  try {
    const { confirm } = req.body;
    if (confirm !== 'DELETE_ALL_DATA') {
      return res.status(400).json({ success: false, message: 'Confirmation required' });
    }
    
    // Delete users
    const usersSnapshot = await db.collection('users').get();
    const userBatch = db.batch();
    usersSnapshot.docs.forEach(doc => userBatch.delete(doc.ref));
    await userBatch.commit();
    
    // Delete tasks
    const tasksSnapshot = await db.collection('tasks').get();
    const taskBatch = db.batch();
    tasksSnapshot.docs.forEach(doc => taskBatch.delete(doc.ref));
    await taskBatch.commit();
    
    await logActivity('admin', 'All data cleared', req.adminId);
    
    res.json({ success: true, message: 'All data cleared' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Activity logs
router.get('/logs', isAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logsSnapshot = await db.collection('admin_logs')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    const logs = logsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ success: true, logs });
  } catch (error) {
    res.json({ success: true, logs: [] });
  }
});

// Clear logs
router.delete('/logs/clear', isAdmin, async (req, res) => {
  try {
    const logsSnapshot = await db.collection('admin_logs').get();
    const batch = db.batch();
    logsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    res.json({ success: true, message: 'Logs cleared' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send bonus to all users
router.post('/bonus/all', isAdmin, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    const usersSnapshot = await db.collection('users').get();
    const batch = db.batch();
    let count = 0;
    
    usersSnapshot.docs.forEach(doc => {
      const currentCoins = doc.data().coins || 0;
      batch.update(doc.ref, { coins: currentCoins + Number(amount) });
      count++;
    });
    
    await batch.commit();
    await logActivity('admin', `Sent ${amount} bonus coins to ${count} users. Reason: ${reason || 'N/A'}`, req.adminUsername);
    
    res.json({ success: true, message: `Sent ${amount} coins to ${count} users` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== GIFT SYSTEM ====================

// Send coins gift
router.post('/gift/coins', isAdmin, async (req, res) => {
  try {
    const { target, userId, amount, message } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    let count = 0;
    
    if (target === 'specific') {
      if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });
      
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      const currentCoins = userDoc.data().coins || 0;
      await userRef.update({ 
        coins: currentCoins + Number(amount),
        lastGift: { type: 'coins', amount, message, timestamp: new Date().toISOString() }
      });
      count = 1;
    } else {
      let query = db.collection('users');
      
      if (target === 'active') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.where('lastActive', '>=', weekAgo);
      } else if (target === 'top100') {
        query = query.orderBy('coins', 'desc').limit(100);
      }
      
      const usersSnapshot = await query.get();
      const batch = db.batch();
      
      usersSnapshot.docs.forEach(doc => {
        const currentCoins = doc.data().coins || 0;
        batch.update(doc.ref, { 
          coins: currentCoins + Number(amount),
          lastGift: { type: 'coins', amount, message, timestamp: new Date().toISOString() }
        });
        count++;
      });
      
      await batch.commit();
    }
    
    await logActivity('admin', `Sent ${amount} coins to ${count} users (${target})`, req.adminUsername);
    res.json({ success: true, message: `Sent ${amount} coins to ${count} users` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send energy gift
router.post('/gift/energy', isAdmin, async (req, res) => {
  try {
    const { target, userId, amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    let count = 0;
    
    if (target === 'specific') {
      if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });
      
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      const currentEnergy = userDoc.data().energy || 0;
      await userRef.update({ energy: currentEnergy + Number(amount) });
      count = 1;
    } else {
      const usersSnapshot = await db.collection('users').get();
      const batch = db.batch();
      
      usersSnapshot.docs.forEach(doc => {
        const currentEnergy = doc.data().energy || 0;
        batch.update(doc.ref, { energy: currentEnergy + Number(amount) });
        count++;
      });
      
      await batch.commit();
    }
    
    await logActivity('admin', `Sent ${amount} energy to ${count} users`, req.adminUsername);
    res.json({ success: true, message: `Sent ${amount} energy to ${count} users` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send mystery box
router.post('/gift/mystery-box', isAdmin, async (req, res) => {
  try {
    const { target, userId, boxType, quantity, minReward, maxReward, rewards } = req.body;
    
    // Define box ranges
    const boxRanges = {
      common: { min: 100, max: 1000 },
      rare: { min: 1000, max: 10000 },
      epic: { min: 10000, max: 50000 },
      legendary: { min: 50000, max: 200000 },
      custom: { min: minReward || 1000, max: maxReward || 10000 }
    };
    
    const range = boxRanges[boxType] || boxRanges.common;
    let count = 0;
    
    const mysteryBox = {
      type: boxType,
      quantity: quantity || 1,
      minReward: range.min,
      maxReward: range.max,
      rewards: rewards || { coins: true },
      createdAt: new Date().toISOString(),
      opened: false
    };
    
    if (target === 'specific') {
      if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });
      
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      const currentBoxes = userDoc.data().mysteryBoxes || [];
      currentBoxes.push(mysteryBox);
      await userRef.update({ mysteryBoxes: currentBoxes });
      count = 1;
    } else {
      let query = db.collection('users');
      if (target === 'active') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.where('lastActive', '>=', weekAgo);
      }
      
      const usersSnapshot = await query.get();
      const batch = db.batch();
      
      usersSnapshot.docs.forEach(doc => {
        const currentBoxes = doc.data().mysteryBoxes || [];
        currentBoxes.push(mysteryBox);
        batch.update(doc.ref, { mysteryBoxes: currentBoxes });
        count++;
      });
      
      await batch.commit();
    }
    
    // Log the gift
    await db.collection('gift_history').add({
      type: 'mystery_box',
      boxType,
      target,
      count,
      timestamp: new Date().toISOString(),
      admin: req.adminUsername
    });
    
    await logActivity('admin', `Sent ${boxType} mystery box to ${count} users`, req.adminUsername);
    res.json({ success: true, message: `Sent ${boxType} mystery box to ${count} users` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send free spins
router.post('/gift/spins', isAdmin, async (req, res) => {
  try {
    const { target, userId, amount, expiryHours } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    const spinGift = {
      amount: Number(amount),
      expiresAt: expiryHours > 0 ? new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString() : null,
      createdAt: new Date().toISOString()
    };
    
    let count = 0;
    
    if (target === 'specific') {
      if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });
      
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      const currentSpins = userDoc.data().freeSpins || 0;
      await userRef.update({ 
        freeSpins: currentSpins + Number(amount),
        spinGift
      });
      count = 1;
    } else {
      let query = db.collection('users');
      if (target === 'active') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.where('lastActive', '>=', weekAgo);
      }
      
      const usersSnapshot = await query.get();
      const batch = db.batch();
      
      usersSnapshot.docs.forEach(doc => {
        const currentSpins = doc.data().freeSpins || 0;
        batch.update(doc.ref, { 
          freeSpins: currentSpins + Number(amount),
          spinGift
        });
        count++;
      });
      
      await batch.commit();
    }
    
    await logActivity('admin', `Sent ${amount} free spins to ${count} users`, req.adminUsername);
    res.json({ success: true, message: `Sent ${amount} free spins to ${count} users` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk rewards
router.post('/gift/bulk', isAdmin, async (req, res) => {
  try {
    const { userIds, rewardType, amount } = req.body;
    
    if (!userIds || !userIds.length) {
      return res.status(400).json({ success: false, message: 'No user IDs provided' });
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (const id of userIds) {
      try {
        const userRef = db.collection('users').doc(id.trim());
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
          const updates = {};
          
          switch (rewardType) {
            case 'coins':
              updates.coins = (userDoc.data().coins || 0) + Number(amount);
              break;
            case 'energy':
              updates.energy = (userDoc.data().energy || 0) + Number(amount);
              break;
            case 'spins':
              updates.freeSpins = (userDoc.data().freeSpins || 0) + Number(amount);
              break;
            case 'mystery':
              const boxes = userDoc.data().mysteryBoxes || [];
              boxes.push({
                type: 'rare',
                quantity: 1,
                minReward: 1000,
                maxReward: 10000,
                createdAt: new Date().toISOString(),
                opened: false
              });
              updates.mysteryBoxes = boxes;
              break;
          }
          
          await userRef.update(updates);
          successCount++;
        } else {
          failCount++;
        }
      } catch (e) {
        failCount++;
      }
    }
    
    await logActivity('admin', `Bulk ${rewardType}: ${successCount} success, ${failCount} failed`, req.adminUsername);
    res.json({ 
      success: true, 
      message: `Sent to ${successCount} users. ${failCount} failed.` 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== POPUP SYSTEM ====================

// Create popup
router.post('/popup/create', isAdmin, async (req, res) => {
  try {
    const popupData = {
      ...req.body,
      createdAt: new Date().toISOString(),
      createdBy: req.adminUsername
    };
    
    const popupRef = await db.collection('popups').add(popupData);
    await logActivity('admin', `Created popup: ${popupData.title}`, req.adminUsername);
    
    res.json({ success: true, message: 'Popup created', id: popupRef.id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all popups
router.get('/popups', isAdmin, async (req, res) => {
  try {
    const popupsSnapshot = await db.collection('popups')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    const popups = popupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ success: true, popups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Toggle popup
router.post('/popup/:popupId/toggle', isAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    await db.collection('popups').doc(req.params.popupId).update({ isActive });
    res.json({ success: true, message: 'Popup updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete popup
router.delete('/popup/:popupId', isAdmin, async (req, res) => {
  try {
    await db.collection('popups').doc(req.params.popupId).delete();
    res.json({ success: true, message: 'Popup deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== NOTIFICATION SYSTEM ====================

// Send in-game notification
router.post('/notification/send', isAdmin, async (req, res) => {
  try {
    const { type, title, message, target, userId, duration } = req.body;
    
    const notification = {
      type,
      title,
      message,
      duration: duration || 5,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    let count = 0;
    
    if (target === 'specific') {
      if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });
      
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      const notifications = userDoc.data().notifications || [];
      notifications.unshift(notification);
      await userRef.update({ notifications: notifications.slice(0, 50) }); // Keep last 50
      count = 1;
    } else {
      // Store as global notification
      await db.collection('global_notifications').add({
        ...notification,
        target: 'all'
      });
      count = 'all';
    }
    
    await logActivity('admin', `Sent notification: ${title}`, req.adminUsername);
    res.json({ success: true, message: `Notification sent to ${count} users` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get active popups for users (public endpoint)
router.get('/public/popups', async (req, res) => {
  try {
    const now = new Date().toISOString();
    const popupsSnapshot = await db.collection('popups')
      .where('isActive', '==', true)
      .get();
    
    const popups = popupsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(p => {
        if (p.startDate && p.startDate > now) return false;
        if (p.endDate && p.endDate < now) return false;
        return true;
      });
    
    res.json({ success: true, popups });
  } catch (error) {
    res.json({ success: true, popups: [] });
  }
});

// Get global notifications for users (public endpoint)
router.get('/public/notifications', async (req, res) => {
  try {
    const notificationsSnapshot = await db.collection('global_notifications')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ success: true, notifications });
  } catch (error) {
    res.json({ success: true, notifications: [] });
  }
});

// Get gift history
router.get('/gift/history', isAdmin, async (req, res) => {
  try {
    const type = req.query.type;
    let query = db.collection('gift_history').orderBy('timestamp', 'desc').limit(50);
    
    if (type) {
      query = query.where('type', '==', type);
    }
    
    const historySnapshot = await query.get();
    const history = historySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ success: true, history });
  } catch (error) {
    res.json({ success: true, history: [] });
  }
});

module.exports = router;

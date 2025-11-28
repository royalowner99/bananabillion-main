const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

const BOT_TOKEN = process.env.BOT_TOKEN;

// Verify Telegram channel/group membership
async function verifyTelegramMembership(userId, chatId) {
  try {
    // Extract chat username from link if needed
    let chatIdentifier = chatId;
    if (chatId.includes('t.me/')) {
      chatIdentifier = '@' + chatId.split('t.me/')[1].split('/')[0].split('?')[0];
    } else if (!chatId.startsWith('@') && !chatId.startsWith('-')) {
      chatIdentifier = '@' + chatId;
    }
    
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(chatIdentifier)}&user_id=${userId}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.ok) {
      const status = data.result.status;
      // member, administrator, creator are valid statuses
      return ['member', 'administrator', 'creator', 'restricted'].includes(status);
    }
    
    console.log('Telegram API response:', data);
    return false;
  } catch (error) {
    console.error('Telegram verification error:', error);
    return false;
  }
}

// Get All Tasks
router.get('/all', async (req, res) => {
  try {
    const tasksSnapshot = await db.collection('tasks')
      .where('isActive', '==', true)
      .get();
    
    const tasks = tasksSnapshot.docs.map(doc => ({
      _id: doc.id,
      ...doc.data()
    }));
    
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify Task (check if user completed the task requirement)
router.post('/verify', async (req, res) => {
  try {
    const { telegramId, taskId } = req.body;

    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = taskDoc.data();
    
    // Check task type and verify accordingly
    if (task.type === 'telegram' || task.type === 'channel' || task.type === 'group') {
      // Verify Telegram membership
      const chatId = task.chatId || task.link;
      const isMember = await verifyTelegramMembership(telegramId, chatId);
      
      if (!isMember) {
        return res.json({ 
          success: false, 
          verified: false,
          message: 'Please join the channel/group first!' 
        });
      }
      
      return res.json({ success: true, verified: true });
    }
    
    // For other task types (social, website, etc.), auto-verify after delay
    return res.json({ success: true, verified: true });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Complete Task
router.post('/complete', async (req, res) => {
  try {
    const { telegramId, taskId, skipVerification } = req.body;

    const userRef = db.collection('users').doc(telegramId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const user = userDoc.data();
    const task = taskDoc.data();

    if (user.completedTasks && user.completedTasks.includes(taskId)) {
      return res.status(400).json({ success: false, message: 'Task already completed' });
    }

    // Verify Telegram tasks before completing
    if (!skipVerification && (task.type === 'telegram' || task.type === 'channel' || task.type === 'group')) {
      const chatId = task.chatId || task.link;
      const isMember = await verifyTelegramMembership(telegramId, chatId);
      
      if (!isMember) {
        return res.status(400).json({ 
          success: false, 
          message: 'You must join the channel/group to claim this reward!' 
        });
      }
    }

    const completedTasks = user.completedTasks || [];
    const newCoins = (user.coins || 0) + task.reward;

    await userRef.update({
      completedTasks: [...completedTasks, taskId],
      coins: newCoins
    });

    res.json({ 
      success: true, 
      reward: task.reward,
      coins: newCoins
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create Task (Admin)
router.post('/create', async (req, res) => {
  try {
    const { title, description, type, reward, icon, link, requirement } = req.body;

    const taskData = {
      title,
      description,
      type,
      reward,
      icon: icon || '🎯',
      link: link || '',
      requirement: requirement || '',
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const taskRef = await db.collection('tasks').add(taskData);
    
    res.json({ 
      success: true, 
      task: { _id: taskRef.id, ...taskData }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

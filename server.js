require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Firebase connection with error handling
let db = null;
try {
  const firebase = require('./config/firebase');
  db = firebase.db;
  
  // Test Firebase Connection
  db.collection('_health').doc('test').set({ timestamp: new Date() })
    .then(() => console.log('✅ Firebase Connected'))
    .catch(err => console.error('❌ Firebase Connection Error:', err.message));
} catch (err) {
  console.error('❌ Firebase initialization failed:', err.message);
  console.log('⚠️ App will run but database features won\'t work');
}

// Import Routes
const userRoutes = require('./routes/user');
const gameRoutes = require('./routes/game');
const taskRoutes = require('./routes/task');
const adminRoutes = require('./routes/admin');

// Use Routes
app.use('/api/user', userRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: db ? 'connected' : 'not connected',
    timestamp: new Date().toISOString()
  });
});

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Telegram Bot - with error handling for network issues
let bot = null;
const isProduction = process.env.NODE_ENV === 'production';

try {
  if (isProduction && process.env.WEBAPP_URL) {
    // Production: Use webhook mode
    bot = new TelegramBot(process.env.BOT_TOKEN);
    console.log('🤖 Telegram Bot initialized (webhook mode)');
  } else {
    // Development: Use polling mode
    bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
    console.log('🤖 Telegram Bot initialized (polling mode)');
  }
  console.log('📱 Bot Username:', process.env.BOT_USERNAME);
} catch (error) {
  console.log('⚠️ Bot initialization failed:', error.message);
  console.log('📱 Game will still work without bot');
}

// Bot Commands (only if bot is initialized)
if (bot) {
bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;
  const referralCode = match[1] ? match[1].trim().replace(/\s+/g, '') : null;
  
  console.log(`📨 /start command from user ${userId} (${username}), referral: ${referralCode}`);
  
  // For local testing, use localhost. For production, use your deployed URL
  const baseUrl = process.env.WEBAPP_URL || `http://localhost:${PORT}`;
  // Pass referral code to webapp via URL parameter
  const webAppUrl = referralCode ? `${baseUrl}?ref=${referralCode}` : baseUrl;
  
  // If user came from referral, save it to database
  if (referralCode) {
    try {
      const userRef = db.collection('users').doc(userId.toString());
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        // New user with referral - will be created when they open the app
        console.log(`🎁 New user ${userId} referred by ${referralCode}`);
      }
    } catch (err) {
      console.error('Referral check error:', err.message);
    }
  }
  
  const welcomeMessage = `🍌 Welcome to Banana Billion! 🍌

Tap the banana to earn coins!

👤 Username: @${username}
🆔 User ID: ${userId}
${referralCode ? `🎁 Invited by: ${referralCode}\n✨ You'll get 1,000 bonus coins!` : ''}

Click "Play Game" below to start mining!`;
  
  bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎮 Play Game', web_app: { url: webAppUrl } }],
        [{ text: '📢 Join Channel', url: process.env.TELEGRAM_CHANNEL }],
        [{ text: '👥 Join Group', url: process.env.TELEGRAM_GROUP }]
      ]
    }
  }).then(() => {
    console.log('✅ Welcome message sent successfully');
  }).catch(err => {
    console.error('❌ Error sending message:', err.message);
  });
});

// Admin IDs
const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(id => id.trim());

function isAdmin(userId) {
  return ADMIN_IDS.includes(userId.toString());
}

// Admin Command: /admin - Show admin menu
bot.onText(/\/admin/, async (msg) => {
  const userId = msg.from.id;
  if (!isAdmin(userId)) {
    return bot.sendMessage(msg.chat.id, '❌ You are not authorized.');
  }
  
  bot.sendMessage(msg.chat.id, `🔐 *Admin Panel*\n\nChoose an action:`, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📊 Stats', callback_data: 'admin_stats' }],
        [{ text: '👥 Users', callback_data: 'admin_users' }, { text: '📋 Tasks', callback_data: 'admin_tasks' }],
        [{ text: '📢 Broadcast', callback_data: 'admin_broadcast' }],
        [{ text: '💰 Add Coins', callback_data: 'admin_addcoins' }],
        [{ text: '🌐 Open Web Panel', url: `${process.env.WEBAPP_URL}/admin.html` }]
      ]
    }
  });
});

// Admin Command: /stats - Get bot statistics
bot.onText(/\/stats/, async (msg) => {
  const userId = msg.from.id;
  if (!isAdmin(userId)) return;
  
  try {
    const usersSnapshot = await db.collection('users').get();
    let totalCoins = 0, totalTaps = 0, totalReferrals = 0;
    
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      totalCoins += data.coins || 0;
      totalTaps += data.totalTaps || 0;
      totalReferrals += (data.referrals || []).length;
    });
    
    const tasksSnapshot = await db.collection('tasks').get();
    
    bot.sendMessage(msg.chat.id, `📊 *Bot Statistics*\n
👥 Total Users: *${usersSnapshot.size}*
💰 Total Coins: *${formatNumber(totalCoins)}*
👆 Total Taps: *${formatNumber(totalTaps)}*
🤝 Total Referrals: *${totalReferrals}*
📋 Active Tasks: *${tasksSnapshot.size}*`, { parse_mode: 'Markdown' });
  } catch (err) {
    bot.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
  }
});

// Admin Command: /addcoins <userId> <amount>
bot.onText(/\/addcoins (\d+) (-?\d+)/, async (msg, match) => {
  const userId = msg.from.id;
  if (!isAdmin(userId)) return;
  
  const targetId = match[1];
  const amount = parseInt(match[2]);
  
  try {
    const userRef = db.collection('users').doc(targetId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return bot.sendMessage(msg.chat.id, '❌ User not found');
    }
    
    const currentCoins = userDoc.data().coins || 0;
    await userRef.update({ coins: currentCoins + amount });
    
    bot.sendMessage(msg.chat.id, `✅ ${amount > 0 ? 'Added' : 'Removed'} *${Math.abs(amount)}* coins ${amount > 0 ? 'to' : 'from'} user ${targetId}\nNew balance: *${currentCoins + amount}*`, { parse_mode: 'Markdown' });
  } catch (err) {
    bot.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
  }
});

// Admin Command: /user <userId> - Get user info
bot.onText(/\/user (\d+)/, async (msg, match) => {
  const userId = msg.from.id;
  if (!isAdmin(userId)) return;
  
  const targetId = match[1];
  
  try {
    const userDoc = await db.collection('users').doc(targetId).get();
    
    if (!userDoc.exists) {
      return bot.sendMessage(msg.chat.id, '❌ User not found');
    }
    
    const u = userDoc.data();
    bot.sendMessage(msg.chat.id, `👤 *User Info*\n
🆔 ID: \`${u.telegramId}\`
👤 Username: @${u.username || 'N/A'}
💰 Coins: *${formatNumber(u.coins)}*
⚡ Energy: ${u.energy}/${u.maxEnergy}
⭐ Level: ${u.level}
👆 Tap Power: ${u.tapPower}
🤝 Referrals: ${(u.referrals || []).length}
📅 Joined: ${new Date(u.createdAt).toLocaleDateString()}`, { parse_mode: 'Markdown' });
  } catch (err) {
    bot.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
  }
});

// Admin Command: /ban <userId>
bot.onText(/\/ban (\d+)/, async (msg, match) => {
  const userId = msg.from.id;
  if (!isAdmin(userId)) return;
  
  const targetId = match[1];
  
  try {
    await db.collection('users').doc(targetId).update({ banned: true });
    bot.sendMessage(msg.chat.id, `🚫 User ${targetId} has been banned`);
  } catch (err) {
    bot.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
  }
});

// Admin Command: /unban <userId>
bot.onText(/\/unban (\d+)/, async (msg, match) => {
  const userId = msg.from.id;
  if (!isAdmin(userId)) return;
  
  const targetId = match[1];
  
  try {
    await db.collection('users').doc(targetId).update({ banned: false });
    bot.sendMessage(msg.chat.id, `✅ User ${targetId} has been unbanned`);
  } catch (err) {
    bot.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
  }
});

// Admin Command: /broadcast <message>
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
  const userId = msg.from.id;
  if (!isAdmin(userId)) return;
  
  const message = match[1];
  
  try {
    const usersSnapshot = await db.collection('users').get();
    let sent = 0, failed = 0;
    
    bot.sendMessage(msg.chat.id, `📢 Broadcasting to ${usersSnapshot.size} users...`);
    
    for (const doc of usersSnapshot.docs) {
      try {
        await bot.sendMessage(doc.data().telegramId, `📢 *Announcement*\n\n${message}`, { parse_mode: 'Markdown' });
        sent++;
      } catch (e) {
        failed++;
      }
      // Rate limiting
      await new Promise(r => setTimeout(r, 50));
    }
    
    bot.sendMessage(msg.chat.id, `✅ Broadcast complete!\n📤 Sent: ${sent}\n❌ Failed: ${failed}`);
  } catch (err) {
    bot.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
  }
});

// Admin Command: /topusers - Get top 10 users
bot.onText(/\/topusers/, async (msg) => {
  const userId = msg.from.id;
  if (!isAdmin(userId)) return;
  
  try {
    const usersSnapshot = await db.collection('users')
      .orderBy('coins', 'desc')
      .limit(10)
      .get();
    
    let text = '🏆 *Top 10 Users*\n\n';
    usersSnapshot.docs.forEach((doc, i) => {
      const u = doc.data();
      text += `${i + 1}. @${u.username || u.firstName} - *${formatNumber(u.coins)}* coins\n`;
    });
    
    bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
  } catch (err) {
    bot.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
  }
});

// Admin callback handler
bot.on('callback_query', async (query) => {
  const userId = query.from.id;
  const data = query.data;
  
  if (!data.startsWith('admin_')) return;
  if (!isAdmin(userId)) {
    return bot.answerCallbackQuery(query.id, { text: '❌ Not authorized' });
  }
  
  try {
    if (data === 'admin_stats') {
      const usersSnapshot = await db.collection('users').get();
      let totalCoins = 0;
      usersSnapshot.docs.forEach(doc => totalCoins += doc.data().coins || 0);
      
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(query.message.chat.id, `📊 *Quick Stats*\n👥 Users: ${usersSnapshot.size}\n💰 Total Coins: ${formatNumber(totalCoins)}`, { parse_mode: 'Markdown' });
    }
    
    if (data === 'admin_users') {
      const usersSnapshot = await db.collection('users').orderBy('coins', 'desc').limit(5).get();
      let text = '👥 *Top 5 Users*\n\n';
      usersSnapshot.docs.forEach((doc, i) => {
        const u = doc.data();
        text += `${i + 1}. ${u.username || u.firstName} - ${formatNumber(u.coins)}\n`;
      });
      text += '\nUse /user <id> for details\nUse /topusers for top 10';
      
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(query.message.chat.id, text, { parse_mode: 'Markdown' });
    }
    
    if (data === 'admin_tasks') {
      const tasksSnapshot = await db.collection('tasks').get();
      let text = `📋 *Tasks (${tasksSnapshot.size})*\n\n`;
      tasksSnapshot.docs.slice(0, 5).forEach(doc => {
        const t = doc.data();
        text += `${t.icon} ${t.title} - ${t.reward} coins ${t.isActive ? '✅' : '❌'}\n`;
      });
      text += '\nManage tasks in web panel';
      
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(query.message.chat.id, text, { parse_mode: 'Markdown' });
    }
    
    if (data === 'admin_broadcast') {
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(query.message.chat.id, '📢 To broadcast, use:\n`/broadcast Your message here`', { parse_mode: 'Markdown' });
    }
    
    if (data === 'admin_addcoins') {
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(query.message.chat.id, '💰 To add coins, use:\n`/addcoins <userId> <amount>`\n\nExample: `/addcoins 123456789 5000`', { parse_mode: 'Markdown' });
    }
  } catch (err) {
    bot.answerCallbackQuery(query.id, { text: '❌ Error' });
  }
});

// Helper function for formatting numbers
function formatNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num?.toLocaleString() || '0';
}

// Handle all messages for debugging
bot.on('message', (msg) => {
  if (msg.text?.startsWith('/')) return; // Skip commands
  console.log('📩 Message received:', {
    from: msg.from.username || msg.from.first_name,
    text: msg.text,
    chat_id: msg.chat.id
  });
});

// Handle bot errors
bot.on('polling_error', (error) => {
  // Only log once per minute to avoid spam
  if (!bot.lastErrorLog || Date.now() - bot.lastErrorLog > 60000) {
    console.error('⚠️ Bot connection issue (will retry):', error.message);
    bot.lastErrorLog = Date.now();
  }
});
} // End of if(bot) block

// Webhook endpoint for Telegram (production)
app.post(`/webhook/${process.env.BOT_TOKEN}`, (req, res) => {
  if (bot) {
    bot.processUpdate(req.body);
  }
  res.sendStatus(200);
});

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  if (isProduction && process.env.WEBAPP_URL && bot) {
    // Set webhook for production
    const webhookUrl = `${process.env.WEBAPP_URL}/webhook/${process.env.BOT_TOKEN}`;
    try {
      await bot.setWebHook(webhookUrl);
      console.log('✅ Webhook set:', webhookUrl);
    } catch (err) {
      console.error('❌ Webhook error:', err.message);
    }
  } else {
    console.log(`📱 Open http://localhost:${PORT} to test`);
  }
  
  if (!bot) {
    console.log('⚠️ Bot not connected - game still works');
  }
});

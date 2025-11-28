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

// Use Routes
app.use('/api/user', userRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/task', taskRoutes);

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

// Handle all messages for debugging
bot.on('message', (msg) => {
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

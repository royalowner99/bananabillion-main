# 🤖 Test Your Telegram Bot

## ✅ Server Status
Your server is now running with Firebase!

## 🧪 Test the Bot

### Step 1: Open Telegram
Open Telegram on your phone or desktop

### Step 2: Find Your Bot
Search for: `@bananabillionbot`

### Step 3: Send /start
Send the command: `/start`

### Expected Response
You should see:
```
🍌 Welcome to Banana Billion! 🍌

Tap the banana to earn coins!

👤 Username: @your_username
🆔 User ID: your_id

Click "Play Game" below to start!
```

With buttons:
- 🎮 Play Game
- 📢 Join Channel
- 👥 Join Group

## 🔍 Check Server Logs

The server will show:
```
📨 /start command from user [your_id] ([your_username])
✅ Welcome message sent successfully
```

## ⚠️ Important Notes

### For Local Testing
- The "Play Game" button will open: `http://localhost:3000`
- This only works if you're testing on the same computer
- For real testing, you need to deploy the app

### For Production
1. Deploy your app (see DEPLOYMENT.md)
2. Update `.env`:
   ```
   WEBAPP_URL=https://your-deployed-url.com
   ```
3. Restart server
4. Test bot again

## 🐛 Troubleshooting

### Bot doesn't respond
1. Check server is running: `http://localhost:3000/health`
2. Check server logs for errors
3. Verify BOT_TOKEN in `.env` is correct
4. Make sure no other bot instance is running

### "Play Game" button doesn't work
- For local testing, this is expected
- You need to deploy the app first
- Or test the game directly at: `http://localhost:3000`

### Bot responds but game doesn't load
1. Deploy your app first
2. Update WEBAPP_URL in `.env`
3. Restart server

## 🚀 Next Steps

### For Local Development
Test the game directly in browser:
- Open: `http://localhost:3000`
- Should see the game interface
- Can tap banana and earn coins

### For Production
1. Deploy to Vercel/Railway/Render
2. Update WEBAPP_URL in `.env`
3. Redeploy
4. Test bot in Telegram
5. Share with users!

## 📊 Current Configuration

- **Bot Username**: @bananabillionbot
- **Server**: Running on port 3000
- **Database**: Firebase Firestore ✅
- **Web App URL**: http://localhost:3000 (local)

## ✅ Quick Test Checklist

- [ ] Server is running (check terminal)
- [ ] Firebase connected (see "✅ Firebase Connected")
- [ ] Bot initialized (see "🤖 Telegram Bot initialized")
- [ ] Sent /start to @bananabillionbot
- [ ] Received welcome message
- [ ] Saw buttons (Play Game, Join Channel, Join Group)
- [ ] Tested game at http://localhost:3000

## 🎮 Test the Game Directly

While the bot button won't work locally, you can test the game:

1. Open: http://localhost:3000
2. Should see loading screen with banana
3. Game loads in dev mode
4. Can tap banana
5. Earn coins
6. Check tasks, leaderboard, etc.

## 📝 Server Logs to Watch

When you send /start, you should see:
```
📩 Message received: {
  from: 'your_username',
  text: '/start',
  chat_id: your_chat_id
}
📨 /start command from user your_id (your_username)
✅ Welcome message sent successfully
```

---

**Your bot is working!** 🎉

**For full testing**: Deploy the app and update WEBAPP_URL

**For local testing**: Use http://localhost:3000 directly in browser

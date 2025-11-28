# ⚡ Quick Start Guide

Get your Banana Billion game running in 5 minutes!

## Prerequisites
- Node.js installed (v14 or higher)
- A Telegram account
- A Firebase account (free)

## Step 1: Install Dependencies (30 seconds)
```bash
npm install
```

## Step 2: Setup Firebase (2 minutes)

### A. Create Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click "Add project"
3. Name it "bananabillion"
4. Click through the setup

### B. Enable Firestore
1. Click "Firestore Database" in sidebar
2. Click "Create database"
3. Choose "Test mode" (for now)
4. Select your region
5. Click "Enable"

### C. Get Credentials
1. Go to Project Settings (gear icon)
2. Click "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file

### D. Update .env
Open the downloaded JSON file and copy values to `.env`:

```env
FIREBASE_PROJECT_ID=your-project-id-from-json
FIREBASE_PRIVATE_KEY_ID=your-private-key-id-from-json
FIREBASE_PRIVATE_KEY="paste-entire-private-key-here"
FIREBASE_CLIENT_EMAIL=your-client-email-from-json
FIREBASE_CLIENT_ID=your-client-id-from-json
```

**Tip:** Keep the quotes around FIREBASE_PRIVATE_KEY!

## Step 3: Initialize Tasks (10 seconds)
```bash
npm run init-tasks
```

You should see:
```
✅ Default tasks created
📋 8 tasks initialized successfully!
```

## Step 4: Start Server (5 seconds)
```bash
npm start
```

You should see:
```
✅ Firebase Connected
🚀 Server running on port 3000
```

## Step 5: Test It! (1 minute)

### Test in Browser
Open: `http://localhost:3000`

You should see the game loading screen with a banana! 🍌

### Test API
Open: `http://localhost:3000/test.html`

Click "Test API Connection" - should show success!

## Step 6: Setup Telegram Bot (2 minutes)

### A. Create Bot
1. Open Telegram
2. Search for [@BotFather](https://t.me/BotFather)
3. Send `/newbot`
4. Follow instructions
5. Copy the bot token

### B. Update .env
```env
BOT_TOKEN=your-bot-token-here
BOT_USERNAME=your-bot-username
```

### C. Restart Server
```bash
npm start
```

## Step 7: Deploy (Optional - 5 minutes)

### Quick Deploy to Vercel (Free)
```bash
npm i -g vercel
vercel login
vercel
```

Follow prompts, then add environment variables in Vercel dashboard.

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment guides.

## ✅ You're Done!

Your game is now running! 🎉

### What's Next?

1. **Customize**: Edit tasks in Firebase Console
2. **Brand**: Update social links in `.env`
3. **Deploy**: Follow [DEPLOYMENT.md](DEPLOYMENT.md)
4. **Test**: Open bot in Telegram and play!

## 🆘 Need Help?

### Common Issues

**"Firebase Connection Error"**
- Check your `.env` file
- Make sure Firestore is enabled
- Verify credentials are correct

**"No tasks found"**
- Run: `npm run init-tasks`
- Check Firebase Console → Firestore

**"Bot not responding"**
- Verify BOT_TOKEN is correct
- Make sure bot is not running elsewhere
- Check server is running

### Still Stuck?

1. Check [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed Firebase guide
2. Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
3. Look at server console for error messages
4. Check browser console (F12) for frontend errors

## 📚 Documentation

- [README.md](README.md) - Full documentation
- [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Detailed Firebase setup
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guides

---

**Happy Gaming! 🍌🎮**

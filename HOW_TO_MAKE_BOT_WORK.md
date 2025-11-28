# 🤖 How to Make Your Telegram Mini App Bot Work

## 📋 What You Need

### 1. ✅ Already Done (You Have These)
- [x] Firebase Project: `bananabillion-43513`
- [x] Firebase Credentials in `.env`
- [x] Bot Token: `8002962453:AAGEf5z6rwqjD9KamjRhjlgwv1xH6ST9Qco`
- [x] Bot Username: `@bananabillionbot`
- [x] Complete game code
- [x] All features implemented

### 2. 🔥 What You Need to Do

#### Step 1: Deploy Your App (REQUIRED)

The bot's "Play Game" button needs a **public HTTPS URL**. Local `localhost` won't work in Telegram.

**Option A: Deploy to Vercel (Easiest - FREE)**
```bash
npm i -g vercel
vercel login
vercel
```

After deployment, you'll get a URL like: `https://bananabillion-xxx.vercel.app`

**Option B: Deploy to Railway**
1. Go to https://railway.app
2. Connect GitHub
3. Add environment variables
4. Deploy

**Option C: Deploy to Render**
1. Go to https://render.com
2. Create Web Service
3. Connect repo
4. Add environment variables

#### Step 2: Update Environment Variables

After deployment, update your `.env` on the hosting platform:

```env
WEBAPP_URL=https://your-deployed-url.vercel.app
```

#### Step 3: Configure Bot Menu Button

1. Open Telegram
2. Go to @BotFather
3. Send: `/mybots`
4. Select: `@bananabillionbot`
5. Click: `Bot Settings`
6. Click: `Menu Button`
7. Click: `Configure menu button`
8. Enter your deployed URL: `https://your-deployed-url.vercel.app`
9. Enter button text: `🎮 Play Game`

#### Step 4: Set Bot Commands (Optional)

Send to @BotFather:
```
/setcommands
```
Select your bot, then send:
```
start - Start the game
help - Get help
```

## 🔧 Environment Variables Checklist

Make sure these are set on your hosting platform:

```env
# Firebase (REQUIRED)
FIREBASE_PROJECT_ID=bananabillion-43513
FIREBASE_PRIVATE_KEY_ID=8f059fa5ee54252a2dfd4b13fe3337206fff8d02
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@bananabillion-43513.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=105560895721289411805
FIREBASE_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
FIREBASE_DATABASE_URL=https://bananabillion-43513.firebaseio.com

# Server
PORT=3000
NODE_ENV=production
WEBAPP_URL=https://your-deployed-url.vercel.app

# Telegram Bot
BOT_TOKEN=8002962453:AAGEf5z6rwqjD9KamjRhjlgwv1xH6ST9Qco
BOT_USERNAME=bananabillionbot

# Social Links
TELEGRAM_CHANNEL=https://t.me/bananabillion
TELEGRAM_GROUP=https://t.me/bananabilliongroup
TWITTER_HANDLE=https://twitter.com/BananaBillion
YOUTUBE_CHANNEL=https://youtube.com/@bananabillion
```

## 🚀 Quick Deploy to Vercel

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Login
```bash
vercel login
```

### Step 3: Deploy
```bash
vercel
```

Follow the prompts:
- Set up and deploy? `Y`
- Which scope? Select your account
- Link to existing project? `N`
- Project name? `bananabillion`
- Directory? `./`
- Override settings? `N`

### Step 4: Add Environment Variables

Go to: https://vercel.com/dashboard
1. Click your project
2. Go to Settings → Environment Variables
3. Add ALL variables from your `.env` file

### Step 5: Redeploy
```bash
vercel --prod
```

### Step 6: Get Your URL
Your URL will be: `https://bananabillion-xxx.vercel.app`

## 📱 Configure Telegram Bot

### Set Web App URL

1. Open @BotFather in Telegram
2. Send `/mybots`
3. Select `@bananabillionbot`
4. Click `Bot Settings`
5. Click `Menu Button`
6. Click `Configure menu button`
7. Enter URL: `https://your-vercel-url.vercel.app`
8. Enter text: `🎮 Play Game`

### Test Your Bot

1. Open Telegram
2. Search for `@bananabillionbot`
3. Send `/start`
4. Click "🎮 Play Game" button
5. Game should open!

## ✅ Final Checklist

- [ ] Deployed to Vercel/Railway/Render
- [ ] Got public HTTPS URL
- [ ] Added all environment variables to hosting
- [ ] Updated WEBAPP_URL in hosting
- [ ] Configured bot menu button in @BotFather
- [ ] Tested /start command
- [ ] Tested "Play Game" button
- [ ] Game loads with your profile photo
- [ ] Can tap and earn coins
- [ ] Tasks load correctly

## 🐛 Troubleshooting

### Bot doesn't respond to /start
- Check BOT_TOKEN is correct
- Make sure server is running
- Check hosting logs for errors

### "Play Game" button doesn't work
- Make sure you deployed the app
- Check WEBAPP_URL is set correctly
- Verify menu button is configured in @BotFather

### Game loads but shows error
- Check Firebase credentials
- Verify Firestore is enabled
- Check browser console for errors

### Profile photo doesn't show
- This is normal in development mode
- In Telegram, photo will load automatically

### Tasks not loading
- Run `npm run init-tasks` on server
- Check Firebase Console for tasks collection

## 📊 What Users Will See

### When they open your bot:
1. Welcome message with buttons
2. "🎮 Play Game" button opens the mini app
3. Game loads with their Telegram profile photo
4. They can tap to mine coins
5. Complete tasks for rewards
6. Invite friends with referral code
7. Compete on leaderboard

### Features Available:
- ⛏️ Tap to mine coins
- 🤖 Buy and upgrade miners
- 📋 Complete tasks for rewards
- 👥 Referral system
- 🏆 Leaderboard
- 👤 Profile with photo
- 🎁 Daily rewards
- ⚡ Energy system

## 🎯 Summary

**To make your bot work, you need to:**

1. **Deploy your app** to get a public HTTPS URL
2. **Add environment variables** to your hosting platform
3. **Configure menu button** in @BotFather with your URL
4. **Test** by sending /start to your bot

**That's it!** Once deployed, your bot will work for everyone on Telegram.

## 📞 Quick Commands

```bash
# Deploy to Vercel
vercel --prod

# Check server locally
npm start

# Initialize tasks
npm run init-tasks

# Check setup
npm run check
```

## 🔗 Important Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Firebase Console**: https://console.firebase.google.com/project/bananabillion-43513
- **BotFather**: https://t.me/BotFather
- **Your Bot**: https://t.me/bananabillionbot

---

**Ready to deploy?** Run `vercel` and follow the steps above! 🚀

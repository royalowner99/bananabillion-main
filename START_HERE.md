# 🚀 START HERE - Banana Billion Setup

Welcome! This is your starting point for setting up the Banana Billion game.

## 📋 What You Need (5 minutes)

1. **Node.js** - [Download here](https://nodejs.org/) (v14 or higher)
2. **Firebase Account** - [Sign up free](https://console.firebase.google.com/)
3. **Telegram Account** - For creating the bot
4. **Code Editor** - VS Code, Sublime, or any editor

> **🎉 Good News!** Your Firebase project is already created: `bananabillion-43513`
> 
> **👉 Follow [NEXT_STEPS.md](NEXT_STEPS.md) for your personalized setup guide!**

## 🎯 Quick Setup (Choose Your Path)

### 🏃 Fast Track (Experienced Developers)
```bash
npm install
npm run check
npm run init-tasks
npm start
```
Then visit `http://localhost:3000`

### 📖 Guided Setup (First Time)
Follow **[QUICKSTART.md](QUICKSTART.md)** - Step-by-step guide with screenshots

### ✅ Checklist Approach
Use **[CHECKLIST.md](CHECKLIST.md)** - Check off items as you complete them

## 📚 Documentation Map

```
START_HERE.md (You are here!)
    ↓
QUICKSTART.md ────→ Get running in 5 minutes
    ↓
CHECKLIST.md ─────→ Track your progress
    ↓
FIREBASE_SETUP.md ─→ Detailed Firebase guide
    ↓
DEPLOYMENT.md ────→ Deploy to production
    ↓
SUMMARY.md ───────→ Complete overview
```

## 🎮 What You're Building

A **Telegram Mini App** game where users:
- 🍌 Tap a banana to earn coins
- ⚡ Manage energy that regenerates
- 📋 Complete tasks for rewards
- 👥 Invite friends with referral codes
- 🏆 Compete on leaderboards
- 💪 Upgrade their tap power

## 🔥 Why Firebase?

- ✅ **No MongoDB needed** - Simpler setup
- ✅ **Free tier** - Generous limits
- ✅ **Auto-scaling** - Handles growth
- ✅ **Real-time** - Fast updates
- ✅ **Easy deploy** - Works everywhere

## 📦 Installation Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project
3. Enable Firestore
4. Download credentials
5. Update `.env` file

**Detailed guide:** [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

### Step 3: Configure Environment
Copy `.env.example` to `.env` and fill in:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your-email
BOT_TOKEN=your-bot-token
BOT_USERNAME=your-bot-username
```

### Step 4: Verify Setup
```bash
npm run check
```

Should show: ✅ Everything configured correctly!

### Step 5: Initialize Game
```bash
npm run init-tasks
```

Creates 8 default tasks in your database.

### Step 6: Start Server
```bash
npm start
```

Server runs on `http://localhost:3000`

### Step 7: Test
Open in browser:
- **Game**: http://localhost:3000
- **Test Page**: http://localhost:3000/test.html
- **Health**: http://localhost:3000/health

## 🤖 Telegram Bot Setup

1. Open Telegram
2. Search for `@BotFather`
3. Send `/newbot`
4. Follow instructions
5. Copy bot token to `.env`
6. Restart server

## 🚀 Deploy (When Ready)

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Railway
1. Connect GitHub
2. Add environment variables
3. Deploy

### Render
1. Connect GitHub
2. Configure build
3. Add environment variables

**Full guide:** [DEPLOYMENT.md](DEPLOYMENT.md)

## 🆘 Need Help?

### Common Issues

**"Firebase connection error"**
→ Check `.env` credentials
→ Verify Firestore is enabled

**"No tasks found"**
→ Run `npm run init-tasks`

**"Port already in use"**
→ Change PORT in `.env`
→ Or kill process on port 3000

**"Bot not responding"**
→ Check BOT_TOKEN
→ Restart server

### Get Support

1. Check [QUICKSTART.md](QUICKSTART.md)
2. Review [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
3. Read error messages carefully
4. Check server console logs
5. Use browser DevTools (F12)

## 📖 Learn More

| Document | When to Read |
|----------|--------------|
| **[QUICKSTART.md](QUICKSTART.md)** | First time setup |
| **[CHECKLIST.md](CHECKLIST.md)** | Track progress |
| **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)** | Firebase issues |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Ready to deploy |
| **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** | Understanding code |
| **[SUMMARY.md](SUMMARY.md)** | Complete overview |

## ✅ Success Checklist

- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] Firebase project created
- [ ] Firestore enabled
- [ ] `.env` configured
- [ ] Setup verified (`npm run check`)
- [ ] Tasks initialized (`npm run init-tasks`)
- [ ] Server running (`npm start`)
- [ ] Game loads in browser
- [ ] Can tap and earn coins

## 🎉 Next Steps

Once everything works locally:

1. **Customize**
   - Update social links in `.env`
   - Modify tasks in Firebase Console
   - Change game branding

2. **Deploy**
   - Choose hosting platform
   - Add environment variables
   - Deploy and test

3. **Launch**
   - Configure bot in @BotFather
   - Share with friends
   - Monitor and improve

## 💡 Pro Tips

- Use `npm run dev` for development (auto-reload)
- Test with `/test.html` before deploying
- Check Firebase Console regularly
- Monitor server logs for errors
- Start small, scale gradually

## 🎯 Your Goal

Get the game running locally, then deploy to production!

**Time estimate:**
- Setup: 10-15 minutes
- Testing: 5 minutes
- Deploy: 10 minutes
- **Total: ~30 minutes**

## 🚀 Ready? Let's Go!

1. **Right now**: Run `npm install`
2. **Next**: Follow [QUICKSTART.md](QUICKSTART.md)
3. **Then**: Use [CHECKLIST.md](CHECKLIST.md)
4. **Finally**: Deploy with [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Questions?** Check the documentation files.

**Stuck?** Review error messages and logs.

**Ready?** Let's build something awesome! 🍌🎮

**Good luck! 🚀**

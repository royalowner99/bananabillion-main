# 🍌 Banana Billion - Telegram Mini App Game

A complete tap-to-earn game built as a Telegram Mini App where users collect Banana Billion coins!

> **🎉 NEW: Now using Firebase instead of MongoDB!** Much easier to setup and deploy!

> **👉 New here? Start with [START_HERE.md](START_HERE.md) for a guided setup!**

## ✨ Features

- 🎮 **Tap to Earn**: Tap the banana to earn coins
- ⚡ **Energy System**: Energy regenerates over time (1 per 3 seconds)
- 📋 **Tasks**: 8 default tasks with social media integration
- 👥 **Referral System**: Unique codes, earn 1000 coins per friend
- 🏆 **Leaderboard**: Top 100 players compete
- 💪 **Upgrades**: Boost tap power and energy capacity
- 🎁 **Daily Rewards**: Streak bonuses up to 15,000 coins
- 📱 **Mobile First**: Optimized for Telegram mobile app

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Database**: Firebase Firestore (No MongoDB!)
- **Bot**: Telegram Bot API
- **Frontend**: Vanilla JavaScript (No frameworks!)
- **Deployment**: Vercel, Railway, Render, or Heroku

## 📚 Documentation

> **📖 [View Complete Documentation Index](DOCS_INDEX.md)** - All 11 guides organized by topic

### 🚀 Getting Started
| Document | Description | Time |
|----------|-------------|------|
| **[START_HERE.md](START_HERE.md)** | Your starting point - read this first! | 5 min |
| **[QUICKSTART.md](QUICKSTART.md)** | Get running in 5 minutes | 5 min |
| **[CHECKLIST.md](CHECKLIST.md)** | Step-by-step setup checklist | - |

### 🔧 Setup & Configuration
| Document | Description | Time |
|----------|-------------|------|
| **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)** | Detailed Firebase guide | 10 min |
| **[COMMANDS.md](COMMANDS.md)** | All available npm commands | 2 min |

### 🚀 Deployment & Production
| Document | Description | Time |
|----------|-------------|------|
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Deploy to Vercel, Railway, Render, Heroku | 10 min |

### 📖 Understanding the Project
| Document | Description | Time |
|----------|-------------|------|
| **[SUMMARY.md](SUMMARY.md)** | Complete project overview | 10 min |
| **[WHAT_YOU_GOT.md](WHAT_YOU_GOT.md)** | Everything included in this package | 10 min |
| **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** | Code organization and architecture | 15 min |

## 🚀 Quick Start

**New to this?** Follow [QUICKSTART.md](QUICKSTART.md) for a step-by-step guide!

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Firebase
See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed instructions.

Quick: Create project → Enable Firestore → Download credentials → Update `.env`

### 3. Check Setup
```bash
npm run check
```

This will verify your configuration and Firebase connection.

### 4. Initialize Tasks
```bash
npm run init-tasks
```

### 5. Start Server
```bash
npm start
```

### 6. Test
- **Game**: `http://localhost:3000`
- **Test page**: `http://localhost:3000/test.html`
- **Health check**: `http://localhost:3000/health`

## 📖 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)** - Detailed Firebase setup
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deploy to production

## Setup Telegram Bot

1. Create a bot with [@BotFather](https://t.me/BotFather)
2. Get your bot token and add it to `.env`
3. Set up your bot's menu button to open the Mini App
4. Configure webhook or use polling mode

## 📁 Project Structure

```
bananabillion-game/
├── 📂 config/          # Firebase configuration
├── 📂 public/          # Frontend files (HTML, CSS, JS)
├── 📂 routes/          # API endpoints (user, game, task)
├── 📂 scripts/         # Setup utilities
├── 📄 server.js        # Main Express server
├── 📄 .env             # Your configuration (not in git)
└── 📚 docs/            # Complete documentation
```

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment guides.

**Recommended platforms:**
- **Vercel** (Easiest, free tier) ⭐
- **Railway** (Simple, free tier)
- **Render** (Free tier available)
- **Heroku** (Classic choice)

Quick deploy to Vercel:
```bash
npm i -g vercel
vercel
```

Don't forget to:
1. Add all environment variables
2. Run `npm run init-tasks` after first deploy
3. Update bot's web app URL in @BotFather

## 📡 API Endpoints

### User
- `POST /api/user/init` - Initialize/get user
- `GET /api/user/:telegramId` - Get user profile
- `GET /api/user/leaderboard/top` - Get top 100 players

### Game
- `POST /api/game/tap` - Record taps and earn coins
- `POST /api/game/restore-energy` - Restore energy over time
- `POST /api/game/daily-reward` - Claim daily reward
- `POST /api/game/upgrade-tap` - Upgrade tap power
- `POST /api/game/upgrade-energy` - Upgrade energy capacity

### Tasks
- `GET /api/task/all` - Get all active tasks
- `POST /api/task/complete` - Complete a task
- `POST /api/task/create` - Create new task (admin)

## 🛠️ Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run init-tasks` - Initialize default tasks in Firebase
- `npm run check` - Check setup and configuration

## 🎮 Game Features

### Core Mechanics
- **Tap to Earn**: Each tap earns coins based on tap power
- **Energy System**: 1000 energy, regenerates 1 per 3 seconds
- **Upgrades**: Increase tap power and max energy
- **Levels**: Progress through levels as you earn more

### Social Features
- **Referral System**: Unique codes, earn 1000 coins per referral
- **Leaderboard**: Top 100 players by coins
- **Tasks**: Social media tasks for bonus rewards

### Rewards
- **Daily Login**: Streak bonuses (500 + streak × 100 coins)
- **Task Completion**: 2000-15000 coins per task
- **Referrals**: 1000 coins per friend

## 🔒 Security Notes

For production:
1. Update Firestore security rules
2. Add authentication to admin endpoints
3. Validate Telegram WebApp data
4. Use environment variables for all secrets
5. Enable HTTPS only

## 📝 License

MIT - Feel free to use for your own projects!

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 💬 Support

- Check documentation files for detailed guides
- Review server logs for errors
- Test with `/test.html` page
- Verify Firebase Console for data

## 🌟 Why This Project?

### ✅ Advantages
- **No MongoDB**: Uses Firebase - easier setup, free tier, auto-scaling
- **No Complex Setup**: Just Firebase + environment variables
- **Production Ready**: Includes security rules, error handling, validation
- **Well Documented**: 6 comprehensive guides included
- **Easy Deploy**: One-command deploy to Vercel/Railway
- **Mobile Optimized**: Built for Telegram mobile experience
- **Extensible**: Clean code structure, easy to customize

### 🎯 Perfect For
- Learning Telegram Mini Apps
- Building your first tap-to-earn game
- Understanding Firebase integration
- Creating a community game
- Starting a crypto/gaming project

### 🚀 What's Included
- ✅ Complete backend API
- ✅ Responsive frontend
- ✅ Database integration
- ✅ Telegram bot setup
- ✅ Task system
- ✅ Referral system
- ✅ Leaderboard
- ✅ Upgrade mechanics
- ✅ Daily rewards
- ✅ Full documentation

---

**Made with 🍌 for the Telegram Mini Apps community**

**Star ⭐ this project if you find it helpful!**

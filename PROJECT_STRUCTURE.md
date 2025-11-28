# 📁 Project Structure

```
bananabillion-game/
│
├── 📂 config/
│   └── firebase.js              # Firebase Admin SDK configuration
│
├── 📂 public/                   # Frontend files (served statically)
│   ├── index.html              # Main game interface
│   ├── app.js                  # Game logic and API calls
│   ├── style.css               # Game styling
│   ├── test.html               # API testing page
│   └── favicon.ico             # Site icon
│
├── 📂 routes/                   # API route handlers
│   ├── user.js                 # User management endpoints
│   ├── game.js                 # Game mechanics endpoints
│   └── task.js                 # Task management endpoints
│
├── 📂 scripts/                  # Utility scripts
│   ├── initTasks.js            # Initialize default tasks
│   └── checkSetup.js           # Verify configuration
│
├── 📄 server.js                 # Main Express server
├── 📄 package.json              # Dependencies and scripts
├── 📄 .env                      # Environment variables (not in git)
├── 📄 .env.example              # Environment template
├── 📄 .gitignore                # Git ignore rules
├── 📄 vercel.json               # Vercel deployment config
│
└── 📚 Documentation/
    ├── README.md                # Main documentation
    ├── QUICKSTART.md            # 5-minute setup guide
    ├── FIREBASE_SETUP.md        # Detailed Firebase guide
    ├── DEPLOYMENT.md            # Deployment instructions
    └── PROJECT_STRUCTURE.md     # This file
```

## 🔧 Core Files Explained

### Backend

**server.js**
- Express server setup
- Firebase connection
- Telegram bot initialization
- Route mounting
- Static file serving

**config/firebase.js**
- Firebase Admin SDK initialization
- Firestore database connection
- Exports `db` and `admin` instances

### Routes

**routes/user.js**
- `POST /api/user/init` - Create or get user
- `GET /api/user/:telegramId` - Get user profile
- `GET /api/user/leaderboard/top` - Get leaderboard

**routes/game.js**
- `POST /api/game/tap` - Handle tap actions
- `POST /api/game/restore-energy` - Restore energy
- `POST /api/game/daily-reward` - Daily rewards
- `POST /api/game/upgrade-tap` - Upgrade tap power
- `POST /api/game/upgrade-energy` - Upgrade energy

**routes/task.js**
- `GET /api/task/all` - Get all tasks
- `POST /api/task/complete` - Complete task
- `POST /api/task/create` - Create new task

### Frontend

**public/index.html**
- Game UI structure
- Multiple screens (game, tasks, boost, friends, leaderboard)
- Telegram WebApp SDK integration

**public/app.js**
- Game state management
- API communication
- Tap handling and animations
- Energy restoration
- Screen navigation
- Telegram WebApp integration

**public/style.css**
- Responsive design
- Animations (tap effects, floating banana)
- Dark theme optimized for Telegram
- Mobile-first approach

### Scripts

**scripts/initTasks.js**
- Creates default tasks in Firestore
- Social media tasks
- Referral tasks
- Achievement tasks

**scripts/checkSetup.js**
- Validates environment variables
- Tests Firebase connection
- Checks for tasks in database
- Provides setup feedback

## 🗄️ Firebase Collections

### users
```javascript
{
  telegramId: string,        // Unique Telegram user ID
  username: string,          // Telegram username
  firstName: string,         // User's first name
  lastName: string,          // User's last name
  coins: number,             // Total coins earned
  totalTaps: number,         // Total taps made
  energy: number,            // Current energy
  maxEnergy: number,         // Maximum energy capacity
  level: number,             // User level
  tapPower: number,          // Coins per tap
  referralCode: string,      // Unique referral code
  referredBy: string,        // Referrer's code
  referrals: array,          // List of referred user IDs
  completedTasks: array,     // Completed task IDs
  lastDailyReward: string,   // Last daily claim timestamp
  dailyStreak: number,       // Daily login streak
  createdAt: string,         // Account creation date
  lastActive: string         // Last activity timestamp
}
```

### tasks
```javascript
{
  title: string,             // Task title
  description: string,       // Task description
  type: string,              // social, referral, daily, special
  reward: number,            // Coins reward
  icon: string,              // Emoji icon
  link: string,              // External link (optional)
  requirement: string,       // Requirement identifier
  isActive: boolean,         // Task active status
  createdAt: string          // Task creation date
}
```

## 🔄 Data Flow

### User Initialization
1. User opens bot → Telegram sends user data
2. Frontend calls `POST /api/user/init`
3. Backend checks if user exists in Firestore
4. If new: create user with defaults
5. If exists: update last active
6. Return user data to frontend

### Tap Action
1. User taps banana → Frontend increments counter
2. After 500ms of no taps → Send batch to API
3. Backend validates energy
4. Update coins, taps, energy in Firestore
5. Return new values to frontend

### Task Completion
1. User clicks task → Open link (if any)
2. After 3 seconds → Show verify button
3. User clicks verify → Call API
4. Backend checks if already completed
5. Add task to completed list
6. Add reward to coins
7. Return success to frontend

### Energy Restoration
1. Frontend timer runs every 3 seconds
2. Increment energy by 1 (max: maxEnergy)
3. Update UI
4. Periodically sync with backend

## 🎮 Game Mechanics

### Energy System
- Initial: 1000 energy
- Cost: 1 energy per tap
- Regeneration: 1 energy per 3 seconds
- Upgradeable: +500 max energy per upgrade

### Coin System
- Initial: 1000 coins
- Per tap: 1 × tapPower
- Upgrades cost coins
- Used for: upgrades, future features

### Upgrade System
- **Tap Power**: Cost = current power × 1000
- **Max Energy**: Cost = (maxEnergy / 1000) × 2000

### Referral System
- Each user gets unique code
- Referrer earns 1000 coins per referral
- Tracked in both users' documents

## 🔐 Environment Variables

### Required
- `FIREBASE_PROJECT_ID` - Firebase project identifier
- `FIREBASE_PRIVATE_KEY` - Service account private key
- `FIREBASE_CLIENT_EMAIL` - Service account email
- `BOT_TOKEN` - Telegram bot token
- `BOT_USERNAME` - Telegram bot username

### Optional
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (production/development)
- Social media links for tasks

## 📦 Dependencies

### Production
- `express` - Web server framework
- `firebase-admin` - Firebase SDK
- `node-telegram-bot-api` - Telegram bot
- `dotenv` - Environment variables
- `cors` - Cross-origin requests
- `body-parser` - Request parsing

### Development
- `nodemon` - Auto-restart server

## 🚀 Deployment Checklist

- [ ] Firebase project created
- [ ] Firestore enabled
- [ ] Service account credentials obtained
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Tasks initialized
- [ ] Server tested locally
- [ ] Deployed to hosting platform
- [ ] Environment variables set on platform
- [ ] Bot web app URL updated
- [ ] Tested in Telegram

## 🔧 Maintenance

### Adding New Tasks
1. Use Firebase Console or API
2. Set appropriate reward
3. Mark as active
4. Users see it immediately

### Monitoring
- Check `/health` endpoint
- Review Firebase Console logs
- Monitor user growth in Firestore
- Track task completion rates

### Scaling
- Firebase scales automatically
- Consider Cloud Functions for heavy operations
- Add caching for leaderboard
- Implement rate limiting

## 📊 Analytics Ideas

Track in Firestore:
- Daily active users
- Total taps per day
- Most completed tasks
- Referral conversion rate
- Average session time
- Coin distribution

## 🎯 Future Enhancements

- [ ] Achievements system
- [ ] Power-ups and boosters
- [ ] Tournaments and events
- [ ] NFT integration
- [ ] Multiplayer features
- [ ] In-game shop
- [ ] Premium features
- [ ] Push notifications

---

**This structure is optimized for:**
- Easy deployment
- Simple maintenance
- Quick scaling
- Clear organization
- Developer-friendly

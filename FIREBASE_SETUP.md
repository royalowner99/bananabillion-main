# 🔥 Firebase Setup Guide for Banana Billion

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `bananabillion` (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click "Create database"
3. Choose **Production mode** or **Test mode**
4. Select your region (closest to your users)
5. Click "Enable"

## Step 3: Get Service Account Credentials

1. Go to **Project Settings** (gear icon) → **Service accounts**
2. Click "Generate new private key"
3. Download the JSON file
4. Open the JSON file and copy the values

## Step 4: Configure Environment Variables

Update your `.env` file with values from the downloaded JSON:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk%40your-project-id.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
```

**Important:** Keep the private key in quotes and preserve the `\n` characters!

## Step 5: Install Dependencies

```bash
npm install
```

## Step 6: Initialize Tasks

```bash
npm run init-tasks
```

## Step 7: Start the Server

```bash
npm start
```

## Firestore Collections Structure

### users
```javascript
{
  telegramId: "123456789",
  username: "user123",
  firstName: "John",
  lastName: "Doe",
  coins: 1000,
  totalTaps: 0,
  energy: 1000,
  maxEnergy: 1000,
  level: 1,
  tapPower: 1,
  referralCode: "ABC123XY",
  referredBy: null,
  referrals: [],
  completedTasks: [],
  lastDailyReward: null,
  dailyStreak: 0,
  createdAt: "2024-01-01T00:00:00.000Z",
  lastActive: "2024-01-01T00:00:00.000Z"
}
```

### tasks
```javascript
{
  title: "Join Telegram Channel",
  description: "Join our official Telegram channel",
  type: "social",
  reward: 5000,
  icon: "📢",
  link: "https://t.me/channel",
  requirement: "join_channel",
  isActive: true,
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

## Firestore Security Rules (Optional)

Go to **Firestore Database** → **Rules** and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Note:** For production, implement proper security rules!

## Deploy to Hosting

### Option 1: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts
4. Add environment variables in Vercel dashboard

### Option 2: Railway
1. Go to [Railway.app](https://railway.app)
2. Create new project
3. Connect GitHub repo
4. Add environment variables
5. Deploy

### Option 3: Render
1. Go to [Render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repo
4. Add environment variables
5. Deploy

## Testing

1. Local: `http://localhost:3000`
2. Test page: `http://localhost:3000/test.html`
3. Health check: `http://localhost:3000/health`

## Troubleshooting

### Error: "Could not reach Cloud Firestore backend"
- Check your internet connection
- Verify Firebase credentials in `.env`
- Make sure Firestore is enabled in Firebase Console

### Error: "Permission denied"
- Update Firestore security rules
- Check service account permissions

### Tasks not loading
- Run: `npm run init-tasks`
- Check Firestore console for tasks collection

## Support

For issues, check:
- Firebase Console logs
- Server console output
- Browser console (F12)

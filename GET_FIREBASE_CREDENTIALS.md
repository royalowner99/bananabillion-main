# 🔑 Get Firebase Admin SDK Credentials

You have the **client-side** Firebase config, but we need the **server-side Admin SDK** credentials.

## 📋 Your Firebase Project Info
- **Project ID**: `bananabillion-43513`
- **Project Name**: bananabillion

## 🎯 Step-by-Step Guide

### Step 1: Go to Firebase Console
Open: https://console.firebase.google.com/project/bananabillion-43513/settings/serviceaccounts/adminsdk

Or manually:
1. Go to https://console.firebase.google.com/
2. Click on your project: **bananabillion-43513**
3. Click the ⚙️ gear icon (Settings)
4. Click **Project settings**

### Step 2: Navigate to Service Accounts
1. Click on the **Service accounts** tab at the top
2. You should see "Firebase Admin SDK" section

### Step 3: Generate Private Key
1. Scroll down to "Firebase Admin SDK" section
2. Click the **Generate new private key** button
3. A popup will appear warning you to keep it secure
4. Click **Generate key**
5. A JSON file will download (e.g., `bananabillion-43513-firebase-adminsdk-xxxxx.json`)

### Step 4: Open the Downloaded JSON File
Open the JSON file in a text editor. It will look like this:

```json
{
  "type": "service_account",
  "project_id": "bananabillion-43513",
  "private_key_id": "abc123def456...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@bananabillion-43513.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40bananabillion-43513.iam.gserviceaccount.com"
}
```

### Step 5: Update Your .env File

Copy the values from the JSON file to your `.env`:

```env
# Firebase Configuration (Admin SDK)
FIREBASE_PROJECT_ID=bananabillion-43513
FIREBASE_PRIVATE_KEY_ID=abc123def456...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@bananabillion-43513.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789012345678901
FIREBASE_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40bananabillion-43513.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://bananabillion-43513.firebaseio.com
```

**IMPORTANT:** 
- Keep the quotes around `FIREBASE_PRIVATE_KEY`
- Keep the `\n` characters in the private key
- Don't remove any dashes or line breaks

### Step 6: Enable Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for now)
4. Select your region (closest to your users)
5. Click **Enable**

### Step 7: Verify Setup

Run this command:
```bash
npm run check
```

You should see:
```
✅ Firebase connection successful!
```

## 🔒 Security Notes

1. **Never commit** the JSON file to git
2. **Never share** your private key
3. **Keep** the JSON file in a secure location
4. **Add** `*firebase*.json` to `.gitignore` (already done)

## ✅ Quick Checklist

- [ ] Downloaded service account JSON
- [ ] Copied `project_id` to `.env`
- [ ] Copied `private_key_id` to `.env`
- [ ] Copied `private_key` to `.env` (with quotes!)
- [ ] Copied `client_email` to `.env`
- [ ] Copied `client_id` to `.env`
- [ ] Copied `client_x509_cert_url` to `.env`
- [ ] Enabled Firestore Database
- [ ] Ran `npm run check`
- [ ] Saw success message

## 🆘 Troubleshooting

### "Cannot find module 'firebase-admin'"
```bash
npm install
```

### "Firebase connection failed"
- Check all values are copied correctly
- Make sure private key has quotes
- Verify Firestore is enabled

### "Permission denied"
- Make sure you're the project owner
- Check Firestore is enabled
- Verify service account has permissions

## 📝 Example .env (with your project)

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=bananabillion-43513
FIREBASE_PRIVATE_KEY_ID=paste-from-json
FIREBASE_PRIVATE_KEY="paste-entire-private-key-here-with-quotes"
FIREBASE_CLIENT_EMAIL=paste-from-json
FIREBASE_CLIENT_ID=paste-from-json
FIREBASE_CERT_URL=paste-from-json
FIREBASE_DATABASE_URL=https://bananabillion-43513.firebaseio.com

# Server
PORT=3000
NODE_ENV=production

# Telegram Bot (already configured)
BOT_TOKEN=8002962453:AAGEf5z6rwqjD9KamjRhjlgwv1xH6ST9Qco
BOT_USERNAME=bananabillionbot

# Admin
ADMIN_USERNAME=ROYALOWNER9
ADMIN_TELEGRAM_IDS=1526312302

# Telegram Social Links
TELEGRAM_CHANNEL=https://t.me/bananabillion
TELEGRAM_GROUP=https://t.me/bananabilliongroup
TWITTER_HANDLE=https://twitter.com/BananaBillion
YOUTUBE_CHANNEL=https://youtube.com/@bananabillion

# Game Settings
INITIAL_COINS=1000
TAP_REWARD=1
DAILY_REWARD=500
REFERRAL_REWARD=1000
```

## 🚀 Next Steps

After updating `.env`:

1. **Verify setup**:
   ```bash
   npm run check
   ```

2. **Initialize tasks**:
   ```bash
   npm run init-tasks
   ```

3. **Start server**:
   ```bash
   npm start
   ```

4. **Test game**:
   Open http://localhost:3000

---

**Need help?** Check [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for more details.

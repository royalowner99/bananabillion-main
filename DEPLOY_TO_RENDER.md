# 🚀 Deploy Banana Billion Bot to Render

## Step 1: Push Code to GitHub

First, create a GitHub repository and push your code:

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Banana Billion Bot"

# Add your GitHub repo (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/banana-billion-bot.git

# Push to GitHub
git push -u origin main
```

## Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)
3. Verify your email

## Step 3: Deploy on Render

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure the service:
   - **Name:** `banana-billion-bot`
   - **Region:** Oregon (or closest to you)
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free

## Step 4: Add Environment Variables

In Render dashboard, go to **Environment** tab and add these variables:

```
NODE_ENV = production
PORT = 3000

# Firebase
FIREBASE_PROJECT_ID = bananabillion-43513
FIREBASE_PRIVATE_KEY_ID = 8f059fa5ee54252a2dfd4b13fe3337206fff8d02
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCfaksSWCEXrAsd\niufrQOnR+9U8yhELm7oqcVbSIs/TG7Lzh4lcPPTaA2BII3xKVZJcRLk2Yh9/r/sx\nKM10MVHbVSecTbMlV9R4QIsJqM7oRbtpkwldDG+Ry5vX3N6gdf0Oyz62X/dXiryk\nzpzNu8bezlY5xg2LvcELu6ZxvzOwJCrciHt+oYPIWAfAS5YuhbVnmn83vg61TYr8\n+IdUIhlJcDNSyr2JmQbbAE7U/3MxnMGJG87QnKkjH+qlTIxy2b61NsOiObUjAz1F\nnmOzHdI2QEl1i9CSpsLZJfOnK6peA0FNNJS6Ewsf5rckzLEXopt3DaZFj8tAKcLm\ncbfKUiW1AgMBAAECggEAEk1lk5RXLkzUFN75C/8uqStY2ssXRGYrbEqJbYROKH5m\nYAPYXyTndq1LDVU3pKAo9tt0CTygQaxuckEtP3EXJQ+khdM85WVtUSYV4HTHVo8E\n+pTFTy/JkmtWN+UVkUYimON4Tn97mgslZ+WJxqwPo858Q1NMBFZzlrmDXU1WrZr2\n20K3buc8OvLsiYEeGfOutpecz8kpvxuSQNrsJzuwVhgAYZp76Wph/D6xWn8H3H1I\n1nuEtP6PJ73nv1gQGruwYps7JuwIIHYTn2FxF3YZRGkNg0Jzckd5n3vPBvOSqu3R\nyaMjYA3BPUJbWwEyeAYCoRBlpFcXogRPPeUFpEC5wQKBgQDcC4+0DGuHIVYtwuCw\nDKl9PM27MXebAxWpl7UiV8pNIUTWA4dPbtFHvWBpq9W3BvRZ2+AKDjtWFuF9eVWc\nWd+tn93QHEv7cjnsJg23u6FBPTuBwyjrIVUifBvjZV5BZP3pKArs2+YgyZxSqMtH\nItUvLumBxsFjZ9tAPTdRFYUN9QKBgQC5dphIR6aF5W0gpnll1iG02EYSFgMIm2dB\nECo5thTnv6wZ4V04IUkj/8Eqp89u947vlz4GUmIiyLSbWZROVzIMT2D401nXYEwb\nsxrmpK0EKIv/+CKnOSHK/v4e9plTJY7O5YQfkomEU39WYMBExQ9WhXejJcjnPde+\nQSRNQ7QgwQKBgQDTeuEPv+gQJT/4FxVu3Zx/WtK3GCHFfz9wkPdrHEi3vEO2FAoV\nk4HbmuxwYs+xaiOpwSIfR/JLGQ56UwSukcnhyoWaH7f+35c/mIsSjGe8lab9XZ2T\n7aMu02zSLXhbDT7iuLNXVThlRp7Q6p0DrzyIbmPJcEYozYXwxWTGrxIDiQKBgAZ1\n7ioebNufOWT4x6PXiMcO/anloGdtWnR2xrHJ+QJ1t94S7rdk2XJql2UQAXbhItaP\n0zZPKmIB0eDThwoPmYu6PCuO2UNadGxGmfpM5EYPz4i0MSjYIag7p8iWWJL/7PCi\nKC8dYLL+YaI1rpz2rGkcLyW8zDnZ+qkDBeu3HxBBAoGBAJSWRcOY3qFLhiX7L/eA\nJEPXx3pKpYSS346AYh8GXVejJurdKUWJNvjCuIaDq24NEtirDYKrutp8koqittJV\nkTreOqvNEMtWnxYE6xq8EBF0yztXnGv4n0FGhBYgjvuk/kLaKn53lEjD37qyzIff\nxfEwit8t6zDZkqn89dU3mnfg\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-fbsvc@bananabillion-43513.iam.gserviceaccount.com
FIREBASE_CLIENT_ID = 105560895721289411805
FIREBASE_CERT_URL = https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40bananabillion-43513.iam.gserviceaccount.com
FIREBASE_DATABASE_URL = https://bananabillion-43513.firebaseio.com

# Telegram Bot
BOT_TOKEN = 8002962453:AAGEf5z6rwqjD9KamjRhjlgwv1xH6ST9Qco
BOT_USERNAME = bananabillionbot

# Social Links
TELEGRAM_CHANNEL = https://t.me/bananabillion
TELEGRAM_GROUP = https://t.me/bananabilliongroup
TWITTER_HANDLE = https://twitter.com/BananaBillion
YOUTUBE_CHANNEL = https://youtube.com/@bananabillion

# Admin
ADMIN_USERNAME = ROYALOWNER9
ADMIN_TELEGRAM_IDS = 1526312302
```

⚠️ **IMPORTANT:** After deployment, add one more variable:
```
WEBAPP_URL = https://your-app-name.onrender.com
```
(Replace with your actual Render URL)

## Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (2-5 minutes)
3. Copy your URL (e.g., `https://banana-billion-bot.onrender.com`)

## Step 6: Update WEBAPP_URL

1. Go to **Environment** tab
2. Add: `WEBAPP_URL = https://banana-billion-bot.onrender.com`
3. Click **"Save Changes"** - this will redeploy

## Step 7: Configure BotFather

1. Open Telegram, go to @BotFather
2. Send `/mybots` → Select your bot
3. Click **"Bot Settings"** → **"Menu Button"** → **"Configure menu button"**
4. Send your Render URL: `https://banana-billion-bot.onrender.com`

## Step 8: Initialize Tasks

After deployment, run this once to create default tasks:
1. Open your Render URL in browser
2. Or use the Render Shell to run: `node scripts/initTasks.js`

## Step 9: Add Bot to Channel/Group as Admin

For task verification to work:
1. Add @bananabillionbot to your channel as **Admin**
2. Add @bananabillionbot to your group as **Admin**
3. Give it permission to see members

## 🎉 Done!

Your bot is now live! Test it:
1. Open Telegram
2. Search for @bananabillionbot
3. Send /start
4. Click "Play Game"

## Troubleshooting

**Bot not responding?**
- Check Render logs for errors
- Verify BOT_TOKEN is correct
- Make sure WEBAPP_URL is set

**Firebase errors?**
- Check FIREBASE_PRIVATE_KEY has proper newlines
- Verify project ID matches

**Tasks not verifying?**
- Bot must be admin in channel/group
- Channel/group must be public or bot needs proper permissions

# 🚀 Deployment Guide

## Deploy to Vercel (Recommended - Free)

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel
```

### 4. Add Environment Variables
Go to your Vercel dashboard → Project → Settings → Environment Variables

Add all variables from your `.env` file:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_CLIENT_ID`
- `FIREBASE_CERT_URL`
- `FIREBASE_DATABASE_URL`
- `BOT_TOKEN`
- `BOT_USERNAME`
- All other variables...

### 5. Redeploy
```bash
vercel --prod
```

---

## Deploy to Railway (Easy - Free Tier)

### 1. Create Account
Go to [Railway.app](https://railway.app) and sign up

### 2. New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Connect your repository

### 3. Add Environment Variables
In Railway dashboard:
- Go to Variables tab
- Add all variables from `.env`

### 4. Deploy
Railway will automatically deploy!

---

## Deploy to Render (Free Tier Available)

### 1. Create Account
Go to [Render.com](https://render.com)

### 2. New Web Service
- Click "New +" → "Web Service"
- Connect GitHub repository
- Name: `bananabillion`
- Environment: `Node`
- Build Command: `npm install`
- Start Command: `npm start`

### 3. Add Environment Variables
In Environment tab, add all variables from `.env`

### 4. Deploy
Click "Create Web Service"

---

## Deploy to Heroku

### 1. Install Heroku CLI
```bash
npm install -g heroku
```

### 2. Login
```bash
heroku login
```

### 3. Create App
```bash
heroku create bananabillion
```

### 4. Add Environment Variables
```bash
heroku config:set FIREBASE_PROJECT_ID=your-value
heroku config:set FIREBASE_PRIVATE_KEY="your-key"
# ... add all other variables
```

### 5. Deploy
```bash
git push heroku main
```

---

## After Deployment

### 1. Update Telegram Bot
Set your bot's web app URL:
1. Go to [@BotFather](https://t.me/BotFather)
2. Send `/setmenubutton`
3. Select your bot
4. Enter your deployed URL

### 2. Test
- Open your bot in Telegram
- Click "Play Game"
- Test all features

### 3. Initialize Tasks
Run this once after deployment:
```bash
npm run init-tasks
```

Or use the test page: `https://your-domain.com/test.html`

---

## Environment Variables Checklist

Make sure all these are set in your hosting platform:

- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_PRIVATE_KEY_ID`
- [ ] `FIREBASE_PRIVATE_KEY`
- [ ] `FIREBASE_CLIENT_EMAIL`
- [ ] `FIREBASE_CLIENT_ID`
- [ ] `FIREBASE_CERT_URL`
- [ ] `FIREBASE_DATABASE_URL`
- [ ] `PORT` (usually auto-set)
- [ ] `NODE_ENV=production`
- [ ] `BOT_TOKEN`
- [ ] `BOT_USERNAME`
- [ ] `ADMIN_USERNAME`
- [ ] `ADMIN_TELEGRAM_IDS`
- [ ] `TELEGRAM_CHANNEL`
- [ ] `TELEGRAM_GROUP`
- [ ] `TWITTER_HANDLE`
- [ ] `YOUTUBE_CHANNEL`

---

## Troubleshooting

### Bot not responding
- Check BOT_TOKEN is correct
- Verify bot is not already running elsewhere
- Check server logs

### Database errors
- Verify Firebase credentials
- Check Firestore is enabled
- Run init-tasks script

### CORS errors
- Add your domain to Firebase authorized domains
- Check CORS settings in server.js

---

## Monitoring

### Check Health
Visit: `https://your-domain.com/health`

Should return:
```json
{
  "status": "ok",
  "database": "firebase",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### View Logs
- **Vercel**: Dashboard → Deployments → View Logs
- **Railway**: Dashboard → Deployments → View Logs
- **Render**: Dashboard → Logs tab
- **Heroku**: `heroku logs --tail`

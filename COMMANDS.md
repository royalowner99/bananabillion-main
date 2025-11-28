# 🎮 Available Commands

Quick reference for all npm commands in this project.

## 📦 Installation

### Install Dependencies
```bash
npm install
```
Installs all required packages from `package.json`.

**When to use:**
- First time setup
- After cloning repository
- After updating dependencies

---

## 🔍 Setup & Verification

### Check Setup
```bash
npm run check
```
Verifies your configuration and Firebase connection.

**What it checks:**
- ✅ Node.js version
- ✅ Environment variables
- ✅ Firebase connection
- ✅ Tasks in database

**When to use:**
- After initial setup
- Before deploying
- Troubleshooting issues

---

## 🎯 Database

### Initialize Tasks
```bash
npm run init-tasks
```
Creates 8 default tasks in Firebase Firestore.

**What it does:**
- Clears existing tasks
- Creates social media tasks
- Creates referral tasks
- Creates achievement tasks

**When to use:**
- First time setup
- After Firebase setup
- To reset tasks
- After database changes

---

## 🚀 Running the Server

### Start Production Server
```bash
npm start
```
Starts the server in production mode.

**Features:**
- Runs on port 3000 (or PORT from .env)
- Connects to Firebase
- Starts Telegram bot
- Serves static files

**When to use:**
- Production deployment
- Testing production build
- Final testing before deploy

### Start Development Server
```bash
npm run dev
```
Starts the server with auto-reload (using nodemon).

**Features:**
- Auto-restarts on file changes
- Same as production mode
- Better for development

**When to use:**
- During development
- Making code changes
- Testing features

---

## 🧪 Testing

### Manual Testing
```bash
# Start server
npm start

# Then open in browser:
# http://localhost:3000 - Main game
# http://localhost:3000/test.html - API testing
# http://localhost:3000/health - Health check
```

---

## 📋 Command Summary

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm install` | Install dependencies | First setup |
| `npm run check` | Verify setup | After configuration |
| `npm run init-tasks` | Create default tasks | Database setup |
| `npm start` | Start production server | Production/Testing |
| `npm run dev` | Start dev server | Development |

---

## 🔧 Advanced Usage

### Run Multiple Commands
```bash
# Install and check setup
npm install && npm run check

# Initialize tasks and start server
npm run init-tasks && npm start

# Full setup sequence
npm install && npm run check && npm run init-tasks && npm start
```

### With Custom Port
```bash
# Windows
set PORT=8080 && npm start

# Linux/Mac
PORT=8080 npm start
```

### With Environment
```bash
# Windows
set NODE_ENV=development && npm start

# Linux/Mac
NODE_ENV=development npm start
```

---

## 🐛 Debugging Commands

### Check Node Version
```bash
node --version
```
Should be v14 or higher.

### Check npm Version
```bash
npm --version
```

### List Installed Packages
```bash
npm list --depth=0
```

### Check for Outdated Packages
```bash
npm outdated
```

### Update Packages
```bash
npm update
```

---

## 🔍 Troubleshooting Commands

### Clear npm Cache
```bash
npm cache clean --force
```

### Reinstall Dependencies
```bash
rm -rf node_modules
npm install
```

### Check for Errors
```bash
npm run check
```

### Test Firebase Connection
```bash
node -e "require('./config/firebase').db.collection('_health').doc('test').set({test:true}).then(()=>console.log('✅ Connected')).catch(e=>console.log('❌ Error:',e.message))"
```

---

## 📊 Monitoring Commands

### Check Server Status
```bash
curl http://localhost:3000/health
```

### Test API Endpoint
```bash
curl http://localhost:3000/api/task/all
```

### View Server Logs
Server logs appear in the terminal where you ran `npm start`.

---

## 🚀 Deployment Commands

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Deploy to Heroku
```bash
# Install Heroku CLI first

# Login
heroku login

# Create app
heroku create your-app-name

# Deploy
git push heroku main
```

---

## 💡 Pro Tips

### Create Custom Scripts
Add to `package.json`:
```json
"scripts": {
  "setup": "npm install && npm run check && npm run init-tasks",
  "reset": "npm run init-tasks && npm start",
  "test-api": "curl http://localhost:3000/health"
}
```

Then run:
```bash
npm run setup
npm run reset
npm run test-api
```

### Use npm Scripts in CI/CD
```yaml
# Example GitHub Actions
- run: npm install
- run: npm run check
- run: npm run init-tasks
```

---

## 🎯 Common Workflows

### First Time Setup
```bash
npm install
npm run check
npm run init-tasks
npm start
```

### Daily Development
```bash
npm run dev
# Make changes
# Server auto-restarts
```

### Before Deployment
```bash
npm run check
npm start
# Test everything
# Then deploy
```

### After Deployment
```bash
# On production server
npm run init-tasks
# Verify tasks created
```

---

## 📝 Command Cheat Sheet

```bash
# Quick reference
npm install          # Install packages
npm run check        # Verify setup
npm run init-tasks   # Create tasks
npm start            # Start server
npm run dev          # Dev mode
```

---

## 🆘 Getting Help

### Command Not Found?
```bash
# Make sure you're in project directory
cd path/to/bananabillion-game

# Check package.json exists
ls package.json
```

### Permission Errors?
```bash
# Windows: Run as Administrator
# Linux/Mac: Use sudo
sudo npm install
```

### Port Already in Use?
```bash
# Find process on port 3000
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000

# Kill the process or change PORT in .env
```

---

**Need more help?** Check [START_HERE.md](START_HERE.md) or [QUICKSTART.md](QUICKSTART.md)

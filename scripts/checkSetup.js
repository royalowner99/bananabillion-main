require('dotenv').config();

console.log('\n🔍 Checking Banana Billion Setup...\n');

let errors = 0;
let warnings = 0;

// Check Node.js version
const nodeVersion = process.version;
console.log(`✅ Node.js version: ${nodeVersion}`);

// Check required environment variables
const requiredVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'BOT_TOKEN',
  'BOT_USERNAME'
];

console.log('\n📋 Checking Environment Variables:\n');

requiredVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}`);
  } else {
    console.log(`❌ ${varName} - MISSING!`);
    errors++;
  }
});

// Check optional but recommended variables
const optionalVars = [
  'TELEGRAM_CHANNEL',
  'TELEGRAM_GROUP',
  'TWITTER_HANDLE',
  'YOUTUBE_CHANNEL'
];

console.log('\n📌 Optional Variables:\n');

optionalVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}`);
  } else {
    console.log(`⚠️  ${varName} - Not set`);
    warnings++;
  }
});

// Check Firebase connection
console.log('\n🔥 Testing Firebase Connection...\n');

try {
  const { db } = require('../config/firebase');
  
  db.collection('_health').doc('test').set({ 
    timestamp: new Date(),
    test: true 
  })
  .then(() => {
    console.log('✅ Firebase connection successful!');
    
    // Check for tasks
    return db.collection('tasks').get();
  })
  .then(snapshot => {
    if (snapshot.empty) {
      console.log('⚠️  No tasks found. Run: npm run init-tasks');
      warnings++;
    } else {
      console.log(`✅ Found ${snapshot.size} tasks in database`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Setup Summary:');
    console.log('='.repeat(50));
    
    if (errors === 0 && warnings === 0) {
      console.log('\n🎉 Perfect! Everything is configured correctly!');
      console.log('\n▶️  Run: npm start');
    } else if (errors === 0) {
      console.log(`\n✅ Setup is functional with ${warnings} warning(s)`);
      console.log('\n▶️  Run: npm start');
    } else {
      console.log(`\n❌ Found ${errors} error(s) and ${warnings} warning(s)`);
      console.log('\n📖 Check QUICKSTART.md for setup instructions');
    }
    
    console.log('\n');
    process.exit(errors > 0 ? 1 : 0);
  })
  .catch(error => {
    console.log('❌ Firebase connection failed!');
    console.log('Error:', error.message);
    console.log('\n📖 Check FIREBASE_SETUP.md for help');
    errors++;
    process.exit(1);
  });
  
} catch (error) {
  console.log('❌ Firebase configuration error!');
  console.log('Error:', error.message);
  console.log('\n📖 Check your .env file and FIREBASE_SETUP.md');
  errors++;
  process.exit(1);
}

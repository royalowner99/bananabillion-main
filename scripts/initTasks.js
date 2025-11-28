require('dotenv').config();
const { db } = require('../config/firebase');

const defaultTasks = [
  // Telegram Tasks (with verification)
  {
    title: 'Join Mining HQ',
    description: 'Join our official Telegram channel',
    type: 'telegram', // This type triggers membership verification
    reward: 5000,
    icon: '📢',
    link: process.env.TELEGRAM_CHANNEL || 'https://t.me/yourchannel',
    chatId: process.env.TELEGRAM_CHANNEL || '@yourchannel', // Used for verification
    requirement: 'join_channel',
    isActive: true
  },
  {
    title: 'Join Miners Community',
    description: 'Join our community group',
    type: 'telegram', // This type triggers membership verification
    reward: 5000,
    icon: '👥',
    link: process.env.TELEGRAM_GROUP || 'https://t.me/yourgroup',
    chatId: process.env.TELEGRAM_GROUP || '@yourgroup', // Used for verification
    requirement: 'join_group',
    isActive: true
  },
  // Social Tasks (no verification, trust-based)
  {
    title: 'Follow on X',
    description: 'Follow us on Twitter/X',
    type: 'social',
    reward: 3000,
    icon: '🐦',
    link: process.env.TWITTER_HANDLE || 'https://twitter.com/yourhandle',
    requirement: 'follow_twitter',
    isActive: true
  },
  {
    title: 'Watch Mining Tutorial',
    description: 'Subscribe to our YouTube channel',
    type: 'social',
    reward: 3000,
    icon: '📺',
    link: process.env.YOUTUBE_CHANNEL || 'https://youtube.com/@yourchannel',
    requirement: 'subscribe_youtube',
    isActive: true
  },
  // Referral Tasks
  {
    title: 'Build Mining Crew',
    description: 'Invite 5 friends to your mining crew',
    type: 'referral',
    reward: 15000,
    icon: '⛏️',
    requirement: 'invite_5',
    isActive: true
  },
  // Achievement Tasks
  {
    title: 'First 10K Mined',
    description: 'Mine your first 10,000 coins',
    type: 'achievement',
    reward: 5000,
    icon: '💎',
    requirement: 'coins_10000',
    isActive: true
  },
  {
    title: 'Mining Veteran',
    description: 'Complete 1,000 mining operations',
    type: 'achievement',
    reward: 3000,
    icon: '🏆',
    requirement: 'taps_1000',
    isActive: true
  },
  {
    title: 'Dedicated Miner',
    description: 'Mine for 7 consecutive days',
    type: 'daily',
    reward: 20000,
    icon: '🔥',
    requirement: 'streak_7',
    isActive: true
  },
  {
    title: 'Buy First Miner',
    description: 'Purchase your first mining rig',
    type: 'achievement',
    reward: 2500,
    icon: '🤖',
    requirement: 'first_miner',
    isActive: true
  },
  {
    title: 'Reach Level 5',
    description: 'Reach mining level 5',
    type: 'achievement',
    reward: 10000,
    icon: '⭐',
    requirement: 'level_5',
    isActive: true
  }
];

async function initTasks() {
  try {
    console.log('🔥 Initializing Firebase tasks...');

    // Get all existing tasks
    const tasksSnapshot = await db.collection('tasks').get();
    
    // Delete existing tasks
    const batch = db.batch();
    tasksSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log('🗑️  Cleared existing tasks');

    // Add default tasks
    for (const task of defaultTasks) {
      await db.collection('tasks').add({
        ...task,
        createdAt: new Date().toISOString()
      });
    }
    
    console.log('✅ Default tasks created');
    console.log(`\n📋 ${defaultTasks.length} tasks initialized successfully!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

initTasks();

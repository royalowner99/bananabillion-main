// Telegram Web App
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.expand();
  tg.ready();
}

// API Base URL
const API_URL = window.location.origin + '/api';

// Game State
let userData = null;
let currentScreen = 'game';
const isDevelopment = !tg || !tg.initDataUnsafe?.user;

// Miners Configuration with detailed descriptions
const MINERS = [
  { 
    id: 'basic', 
    name: 'Basic Pickaxe', 
    icon: '⛏️', 
    basePower: 1, 
    basePrice: 500, 
    description: 'Simple but reliable. Mines +1 coin/min passively.',
    effect: '+1/min passive income'
  },
  { 
    id: 'drill', 
    name: 'Power Drill', 
    icon: '🔧', 
    basePower: 5, 
    basePrice: 2500, 
    description: 'Electric powered drill. 5x faster than pickaxe.',
    effect: '+5/min passive income'
  },
  { 
    id: 'excavator', 
    name: 'Excavator', 
    icon: '🚜', 
    basePower: 25, 
    basePrice: 15000, 
    description: 'Heavy machinery for serious miners.',
    effect: '+25/min passive income'
  },
  { 
    id: 'laser', 
    name: 'Laser Cutter', 
    icon: '🔫', 
    basePower: 100, 
    basePrice: 75000, 
    description: 'High-tech laser precision mining.',
    effect: '+100/min passive income'
  },
  { 
    id: 'quantum', 
    name: 'Quantum Rig', 
    icon: '⚛️', 
    basePower: 500, 
    basePrice: 400000, 
    description: 'Mines across multiple dimensions.',
    effect: '+500/min passive income'
  },
  { 
    id: 'alien', 
    name: 'Alien Tech', 
    icon: '👽', 
    basePower: 2500, 
    basePrice: 2000000, 
    description: 'Reverse-engineered extraterrestrial tech.',
    effect: '+2.5K/min passive income'
  },
  { 
    id: 'cosmic', 
    name: 'Cosmic Harvester', 
    icon: '🌌', 
    basePower: 10000, 
    basePrice: 10000000, 
    description: 'Harvests energy from distant stars.',
    effect: '+10K/min passive income'
  },
  { 
    id: 'divine', 
    name: 'Divine Extractor', 
    icon: '✨', 
    basePower: 50000, 
    basePrice: 50000000, 
    description: 'Blessed by ancient gods. Ultimate power.',
    effect: '+50K/min passive income'
  }
];

// Telegram User Data
let telegramUser = null;

// Initialize App
async function initApp() {
  try {
    let user;
    
    // Get referral code from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref') || urlParams.get('start') || null;
    
    if (referralCode) {
      console.log('🎁 Referral code detected:', referralCode);
    }
    
    if (isDevelopment) {
      console.log('🔧 Development mode - using test user');
      user = {
        id: 123456789,
        username: 'testminer',
        first_name: 'Test',
        last_name: 'Miner',
        photo_url: null
      };
      telegramUser = user;
    } else {
      const initData = tg.initDataUnsafe;
      user = initData.user;
      telegramUser = user;
      
      // Also check start_param from Telegram
      const startParam = initData.start_param || referralCode;
      
      if (!user) {
        showError('Please open this app from Telegram');
        return;
      }
    }

    // Initialize user with referral code
    const response = await fetch(`${API_URL}/user/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: user.id.toString(),
        username: user.username || user.first_name,
        firstName: user.first_name,
        lastName: user.last_name || '',
        photoUrl: user.photo_url || null,
        referredBy: referralCode || tg?.initDataUnsafe?.start_param || null
      })
    });

    const data = await response.json();
    if (data.success) {
      userData = data.user;
      // Ensure numeric values
      userData.coins = Number(userData.coins) || 1000;
      userData.energy = Number(userData.energy) || 1000;
      userData.maxEnergy = Number(userData.maxEnergy) || 1000;
      userData.tapPower = Number(userData.tapPower) || 1;
      userData.level = Number(userData.level) || 1;
      userData.totalTaps = Number(userData.totalTaps) || 0;
      userData.dailyStreak = Number(userData.dailyStreak) || 0;
      userData.photoUrl = user.photo_url || userData.photoUrl;
      userData.boosters = userData.boosters || {};
      
      // Re-apply booster effects on load
      recalculateBoosterEffects();
      
      // Load Banana Pass and inventory data
      userData.bananaPass = data.user.bananaPass || false;
      userData.miningBonus = data.user.miningBonus || 0;
      userData.mysteryBoxes = data.user.mysteryBoxes || 0;
      userData.ownedCosmetics = data.user.ownedCosmetics || [];
      userData.activeCosmetic = data.user.activeCosmetic || null;
      userData.specialEmoji = data.user.specialEmoji || null;
      userData.activeBoosters = data.user.activeBoosters || [];
      userData.luckySpins = data.user.luckySpins || 0;
      
      console.log('User loaded:', userData.username, 'Coins:', userData.coins, 'TapPower:', userData.tapPower, 'BananaPass:', userData.bananaPass);
      
      // Load daily booster data on init
      loadDailyBoosterData();
      
      updateAllUI();
      updateProfileUI();
      loadTasks();
      startEnergyRestore();
      startPassiveIncome();
      checkDailyReward();
      updateBoostBadge();
      updatePaidBoosterIndicator();
      
      // Apply cosmetics and Banana Pass badge
      if (userData.activeCosmetic || userData.bananaPass) {
        applyCosmetics();
      }
      
      // Hide loading, show game
      setTimeout(() => {
        document.getElementById('loading').classList.remove('active');
        document.getElementById('game').classList.add('active');
      }, 2000);
    }
  } catch (error) {
    console.error('Init error:', error);
    showError('Failed to initialize. Please try again.');
  }
}

// Update All UI Elements
function updateAllUI() {
  if (!userData) {
    console.log('No userData yet');
    return;
  }
  
  console.log('Updating UI with coins:', userData.coins);
  
  // Update gift counts
  updateGiftUI();
  
  // Update username
  const usernameEl = document.getElementById('username');
  if (usernameEl) usernameEl.textContent = userData.username || 'Miner';
  
  const levelEl = document.getElementById('userLevel');
  if (levelEl) levelEl.textContent = userData.level || 1;
  
  // Update avatar with photo if available
  updateAvatar();
  
  // Update balances everywhere - ensure coins is a number
  const coins = Number(userData.coins) || 0;
  const balanceElements = ['coinBalance', 'minersBalance', 'tasksBalance', 'friendsBalance', 'profileBalance', 'boostBalance', 'leaderboardBalance'];
  balanceElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = formatNumber(coins);
    }
  });
  
  // Update boost badge
  updateBoostBadge();
  
  // Update mining stats - show with all bonuses
  let displayPower = userData.tapPower || 1;
  if (userData.bananaPass && userData.miningBonus) {
    displayPower = Math.floor(displayPower * (1 + userData.miningBonus / 100));
  }
  // Apply active booster multiplier
  const activeMultiplier = getActiveBoosterMultiplier();
  if (activeMultiplier > 1) {
    displayPower = Math.floor(displayPower * activeMultiplier);
  }
  // Apply turbo mode
  if (turboModeActive) {
    displayPower = Math.floor(displayPower * 5);
  }
  const miningPowerEl = document.getElementById('miningPower');
  if (miningPowerEl) {
    miningPowerEl.textContent = formatNumber(displayPower);
    // Add visual indicator if booster or turbo is active
    if (activeMultiplier > 1 || turboModeActive) {
      miningPowerEl.classList.add('boosted');
      let title = '';
      if (turboModeActive) title += '5x Turbo! ';
      if (activeMultiplier > 1) title += `${activeMultiplier}x Booster`;
      miningPowerEl.title = title.trim();
    } else {
      miningPowerEl.classList.remove('boosted');
      miningPowerEl.title = '';
    }
  }
  
  const perHourEl = document.getElementById('perHour');
  if (perHourEl) perHourEl.textContent = formatNumber(calculatePerHour());
  
  const totalMinedEl = document.getElementById('totalMined');
  if (totalMinedEl) totalMinedEl.textContent = formatNumber(userData.totalTaps || 0);
  
  // Update energy
  const energy = Number(userData.energy) || 0;
  const maxEnergy = Number(userData.maxEnergy) || 1000;
  const energyPercent = (energy / maxEnergy) * 100;
  
  const energyFillEl = document.getElementById('energyFill');
  if (energyFillEl) energyFillEl.style.width = energyPercent + '%';
  
  const currentEnergyEl = document.getElementById('currentEnergy');
  if (currentEnergyEl) currentEnergyEl.textContent = energy;
  
  const maxEnergyEl = document.getElementById('maxEnergy');
  if (maxEnergyEl) maxEnergyEl.textContent = maxEnergy;
  
  // Update referral info
  const referralCodeEl = document.getElementById('referralCode');
  if (referralCodeEl) referralCodeEl.textContent = userData.referralCode || 'N/A';
  
  const totalReferralsEl = document.getElementById('totalReferrals');
  if (totalReferralsEl) totalReferralsEl.textContent = userData.referrals?.length || 0;
  
  const referralEarningsEl = document.getElementById('referralEarnings');
  if (referralEarningsEl) referralEarningsEl.textContent = formatNumber((userData.referrals?.length || 0) * 2500);
  
  // Update miners
  renderMiners();
}

// Format Numbers
function formatNumber(num) {
  if (num === undefined || num === null || isNaN(num)) return '0';
  num = Number(num);
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return Math.floor(num).toLocaleString();
}

// Calculate Per Hour Income
function calculatePerHour() {
  const miners = userData.miners || {};
  let total = 0;
  MINERS.forEach(miner => {
    const level = miners[miner.id] || 0;
    if (level > 0) {
      total += miner.basePower * level * 60; // Per hour
    }
  });
  return total;
}

// Mining Handler
let mineCount = 0;
let mineTimeout = null;

// Anti-Auto-Clicker System
const antiCheat = {
  tapTimes: [],           // Store last tap timestamps
  maxTapsPerSecond: 15,   // Maximum allowed taps per second
  warningCount: 0,        // Number of warnings
  maxWarnings: 3,         // Max warnings before penalty
  penaltyUntil: 0,        // Penalty end timestamp
  penaltyDuration: 30000, // 30 second penalty
  suspiciousPatterns: 0,  // Count of suspicious patterns detected
  lastTapInterval: 0,     // Last interval between taps
  sameIntervalCount: 0,   // Count of same intervals (bot detection)
  
  // Check if tap is allowed
  canTap: function() {
    const now = Date.now();
    
    // Check if in penalty
    if (now < this.penaltyUntil) {
      const remaining = Math.ceil((this.penaltyUntil - now) / 1000);
      return { allowed: false, reason: `⏳ Cooldown: ${remaining}s (too fast!)` };
    }
    
    // Remove taps older than 1 second
    this.tapTimes = this.tapTimes.filter(t => now - t < 1000);
    
    // Check taps per second
    if (this.tapTimes.length >= this.maxTapsPerSecond) {
      this.warningCount++;
      if (this.warningCount >= this.maxWarnings) {
        this.penaltyUntil = now + this.penaltyDuration;
        this.warningCount = 0;
        this.suspiciousPatterns++;
        return { allowed: false, reason: '🚫 Auto-clicker detected! 30s cooldown.' };
      }
      return { allowed: false, reason: '⚠️ Slow down! Tapping too fast.' };
    }
    
    // Check for bot-like patterns (same interval between taps)
    if (this.tapTimes.length > 0) {
      const interval = now - this.tapTimes[this.tapTimes.length - 1];
      
      // If interval is suspiciously consistent (within 5ms tolerance)
      if (Math.abs(interval - this.lastTapInterval) < 5 && interval < 200) {
        this.sameIntervalCount++;
        if (this.sameIntervalCount > 10) {
          this.penaltyUntil = now + this.penaltyDuration * 2; // Double penalty for bots
          this.sameIntervalCount = 0;
          this.suspiciousPatterns++;
          return { allowed: false, reason: '🤖 Bot pattern detected! 60s cooldown.' };
        }
      } else {
        this.sameIntervalCount = Math.max(0, this.sameIntervalCount - 1);
      }
      this.lastTapInterval = interval;
    }
    
    // Record this tap
    this.tapTimes.push(now);
    return { allowed: true };
  },
  
  // Reset on legitimate activity
  reset: function() {
    this.warningCount = Math.max(0, this.warningCount - 1);
  }
};

// Verify tap is from real user interaction
function isRealTap(event) {
  // Check if event is trusted (from real user action)
  if (!event.isTrusted) {
    return false;
  }
  
  // Check for suspicious event properties
  if (event.screenX === 0 && event.screenY === 0 && event.clientX === 0 && event.clientY === 0) {
    return false;
  }
  
  return true;
}

// Show cooldown indicator
let cooldownInterval = null;
function showCooldownIndicator() {
  const indicator = document.getElementById('cooldownIndicator');
  const textEl = document.getElementById('cooldownText');
  const mineBtn = document.getElementById('mineButton');
  
  if (!indicator) return;
  
  indicator.classList.add('show');
  if (mineBtn) mineBtn.classList.add('cooldown');
  
  // Clear existing interval
  if (cooldownInterval) clearInterval(cooldownInterval);
  
  // Update countdown
  cooldownInterval = setInterval(() => {
    const remaining = Math.max(0, Math.ceil((antiCheat.penaltyUntil - Date.now()) / 1000));
    
    if (remaining <= 0) {
      indicator.classList.remove('show');
      if (mineBtn) mineBtn.classList.remove('cooldown');
      clearInterval(cooldownInterval);
      cooldownInterval = null;
      showNotification('✅ You can tap again!');
    } else {
      if (textEl) textEl.textContent = `Cooldown: ${remaining}s`;
    }
  }, 100);
}

// Hide cooldown indicator
function hideCooldownIndicator() {
  const indicator = document.getElementById('cooldownIndicator');
  const mineBtn = document.getElementById('mineButton');
  
  if (indicator) indicator.classList.remove('show');
  if (mineBtn) mineBtn.classList.remove('cooldown');
  
  if (cooldownInterval) {
    clearInterval(cooldownInterval);
    cooldownInterval = null;
  }
}

document.getElementById('mineButton').addEventListener('click', async (e) => {
  // Anti-cheat: Verify real tap
  if (!isRealTap(e)) {
    console.log('Fake tap detected');
    return;
  }
  
  // Anti-cheat: Check tap rate
  const tapCheck = antiCheat.canTap();
  if (!tapCheck.allowed) {
    showNotification(tapCheck.reason);
    
    // Show cooldown indicator if in penalty
    if (antiCheat.penaltyUntil > Date.now()) {
      showCooldownIndicator();
    }
    
    // Add warning shake to button
    const btn = document.getElementById('mineButton');
    if (btn) {
      btn.classList.add('warning');
      setTimeout(() => btn.classList.remove('warning'), 300);
    }
    return;
  }
  
  if (userData.energy <= 0) {
    showNotification('⚡ Not enough energy!');
    return;
  }
  
  mineCount++;
  
  // Visual feedback
  const button = e.currentTarget;
  button.style.transform = 'scale(0.95)';
  setTimeout(() => button.style.transform = '', 100);
  
  // Calculate tap power with all bonuses
  let displayTapPower = Math.floor(Number(userData.tapPower) || 1);
  
  // Apply Banana Pass bonus (+20%)
  if (userData.bananaPass && userData.miningBonus) {
    displayTapPower = Math.floor(displayTapPower * (1 + userData.miningBonus / 100));
  }
  
  // Apply active paid boosters (2x, 3x, 5x)
  const activeMultiplier = getActiveBoosterMultiplier();
  if (activeMultiplier > 1) {
    displayTapPower = Math.floor(displayTapPower * activeMultiplier);
  }
  
  // Apply turbo mode (5x) - stacks with other bonuses
  if (turboModeActive) {
    displayTapPower = Math.floor(displayTapPower * 5);
  }
  
  // Create floating reward
  createFloatingReward(displayTapPower);
  
  // Create particles
  createParticles();
  
  // Haptic feedback (only if supported)
  try {
    if (tg?.HapticFeedback?.impactOccurred) {
      tg.HapticFeedback.impactOccurred('light');
    }
  } catch (e) {
    // Haptic not supported, ignore
  }
  
  // Update UI immediately - apply all bonuses
  let tapPower = Math.floor(Number(userData.tapPower) || 1);
  if (userData.bananaPass && userData.miningBonus) {
    tapPower = Math.floor(tapPower * (1 + userData.miningBonus / 100));
  }
  if (activeMultiplier > 1) {
    tapPower = Math.floor(tapPower * activeMultiplier);
  }
  // Apply turbo mode
  if (turboModeActive) {
    tapPower = Math.floor(tapPower * 5);
  }
  userData.coins = Math.floor(Number(userData.coins) || 0) + tapPower;
  userData.energy = Math.max(0, (Number(userData.energy) || 0) - 1);
  userData.totalTaps = Math.floor(Number(userData.totalTaps) || 0) + 1;
  updateBalanceDisplay();
  
  // Update energy bar
  const energyPercent = (userData.energy / userData.maxEnergy) * 100;
  const energyFillEl = document.getElementById('energyFill');
  if (energyFillEl) energyFillEl.style.width = energyPercent + '%';
  const currentEnergyEl = document.getElementById('currentEnergy');
  if (currentEnergyEl) currentEnergyEl.textContent = userData.energy;
  
  // Check for level up
  checkLevelUp();
  
  // Batch send to server - save all user data
  clearTimeout(mineTimeout);
  mineTimeout = setTimeout(async () => {
    const tapsToSend = mineCount;
    mineCount = 0;
    
    if (tapsToSend <= 0) return;
    
    try {
      const response = await fetch(`${API_URL}/game/tap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: userData.telegramId,
          taps: tapsToSend,
          currentCoins: userData.coins,
          currentEnergy: userData.energy,
          totalTaps: userData.totalTaps,
          level: userData.level,
          tapPower: userData.tapPower
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Sync energy from server
        userData.energy = Number(data.energy) || userData.energy;
        const energyPercent = (userData.energy / userData.maxEnergy) * 100;
        const energyFillEl = document.getElementById('energyFill');
        if (energyFillEl) energyFillEl.style.width = energyPercent + '%';
        const currentEnergyEl = document.getElementById('currentEnergy');
        if (currentEnergyEl) currentEnergyEl.textContent = userData.energy;
      }
    } catch (error) {
      console.error('Mine error:', error);
    }
  }, 500);
});

// Create Floating Reward
function createFloatingReward(amount) {
  const container = document.getElementById('floatingRewards');
  const reward = document.createElement('div');
  reward.className = 'floating-reward';
  reward.textContent = `+${amount}`;
  
  // Random position
  const x = Math.random() * 100 - 50;
  reward.style.left = `calc(50% + ${x}px)`;
  reward.style.top = '40%';
  
  container.appendChild(reward);
  setTimeout(() => reward.remove(), 1000);
}

// Create Particles
function createParticles() {
  const container = document.getElementById('particles');
  const emojis = ['🍌', '💰', '✨', '⭐', '💎'];
  
  for (let i = 0; i < 5; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    
    const angle = (Math.random() * 360) * (Math.PI / 180);
    const distance = 80 + Math.random() * 60;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    
    particle.style.left = '50%';
    particle.style.top = '50%';
    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    
    container.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
  }
}

// Level System Configuration
const LEVEL_CONFIG = {
  maxLevel: 100,
  baseXP: 100,        // XP needed for level 2
  xpMultiplier: 1.5,  // Each level needs 1.5x more XP
  tapPowerPerLevel: 1, // +1 tap power per level
  energyPerLevel: 50,  // +50 max energy every 5 levels
};

// Calculate XP needed for a specific level
function getXPForLevel(level) {
  if (level <= 1) return 0;
  return Math.floor(LEVEL_CONFIG.baseXP * Math.pow(LEVEL_CONFIG.xpMultiplier, level - 2));
}

// Calculate total XP needed to reach a level
function getTotalXPForLevel(level) {
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += getXPForLevel(i);
  }
  return total;
}

// Get current level from total taps (XP = taps)
function calculateLevel(totalTaps) {
  let level = 1;
  let xpNeeded = 0;
  
  while (level < LEVEL_CONFIG.maxLevel) {
    xpNeeded += getXPForLevel(level + 1);
    if (totalTaps < xpNeeded) break;
    level++;
  }
  
  return level;
}

// Check Level Up - based on total taps as XP
function checkLevelUp() {
  const currentLevel = userData.level || 1;
  const totalTaps = userData.totalTaps || 0;
  const newLevel = calculateLevel(totalTaps);
  
  if (newLevel > currentLevel && newLevel <= LEVEL_CONFIG.maxLevel) {
    // Level up!
    const levelsGained = newLevel - currentLevel;
    
    userData.level = newLevel;
    userData.tapPower = 1 + Math.floor((newLevel - 1) * LEVEL_CONFIG.tapPowerPerLevel);
    
    // Increase max energy every 5 levels
    if (newLevel % 5 === 0) {
      userData.maxEnergy = 1000 + Math.floor(newLevel / 5) * LEVEL_CONFIG.energyPerLevel;
      userData.energy = userData.maxEnergy; // Refill energy on milestone
    }
    
    showLevelUp(newLevel);
    updateAllUI();
    
    // Save to server
    saveLevelToServer();
  }
}

// Save level progress to server
async function saveLevelToServer() {
  try {
    await fetch(`${API_URL}/game/tap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: userData.telegramId,
        taps: 0,
        currentCoins: userData.coins,
        currentEnergy: userData.energy,
        totalTaps: userData.totalTaps,
        level: userData.level,
        tapPower: userData.tapPower,
        maxEnergy: userData.maxEnergy
      })
    });
  } catch (err) {
    console.error('Save level error:', err);
  }
}

// Get level progress percentage
function getLevelProgress() {
  const currentLevel = userData.level || 1;
  const totalTaps = userData.totalTaps || 0;
  
  if (currentLevel >= LEVEL_CONFIG.maxLevel) return 100;
  
  const xpForCurrentLevel = getTotalXPForLevel(currentLevel);
  const xpForNextLevel = getTotalXPForLevel(currentLevel + 1);
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
  const currentProgress = totalTaps - xpForCurrentLevel;
  
  return Math.min(100, Math.floor((currentProgress / xpNeededForNext) * 100));
}

// Get taps needed for next level
function getTapsForNextLevel() {
  const currentLevel = userData.level || 1;
  if (currentLevel >= LEVEL_CONFIG.maxLevel) return 0;
  
  const totalTaps = userData.totalTaps || 0;
  const xpForNextLevel = getTotalXPForLevel(currentLevel + 1);
  
  return Math.max(0, xpForNextLevel - totalTaps);
}

// Show Level Up Modal
function showLevelUp(level) {
  const modal = document.getElementById('levelUpModal');
  const levelEl = document.getElementById('newLevel');
  
  if (modal && levelEl) {
    levelEl.textContent = level;
    modal.classList.add('active');
  }
  
  showNotification(`🎉 Level Up! You are now level ${level}!`);
}

// Close level up modal
const closeLevelBtn = document.getElementById('closeLevelUp');
if (closeLevelBtn) {
  closeLevelBtn.addEventListener('click', () => {
    document.getElementById('levelUpModal').classList.remove('active');
  });
}

// Show level info when clicking on level badge
function showLevelInfo() {
  const level = userData.level || 1;
  const progress = getLevelProgress();
  const tapsNeeded = getTapsForNextLevel();
  const tapPower = userData.tapPower || 1;
  
  let message = `⭐ Level ${level}\n`;
  message += `💪 Tap Power: ${tapPower}\n`;
  
  if (level < LEVEL_CONFIG.maxLevel) {
    message += `📊 Progress: ${progress}%\n`;
    message += `⛏️ Taps to next level: ${formatNumber(tapsNeeded)}`;
  } else {
    message += `🏆 MAX LEVEL REACHED!`;
  }
  
  showNotification(message);
}

// Make showLevelInfo available globally
window.showLevelInfo = showLevelInfo;

// Energy Restore
function startEnergyRestore() {
  setInterval(() => {
    if (userData && userData.energy < userData.maxEnergy) {
      userData.energy = Math.min(Number(userData.energy) + 1, Number(userData.maxEnergy));
      
      // Update only energy display
      const energyPercent = (userData.energy / userData.maxEnergy) * 100;
      const energyFillEl = document.getElementById('energyFill');
      if (energyFillEl) energyFillEl.style.width = energyPercent + '%';
      const currentEnergyEl = document.getElementById('currentEnergy');
      if (currentEnergyEl) currentEnergyEl.textContent = userData.energy;
    }
  }, 3000);
}

// Passive Income from Miners
let passiveIncomeAccumulator = 0;

function startPassiveIncome() {
  setInterval(() => {
    if (userData && userData.miners) {
      const perHour = calculatePerHour();
      if (perHour > 0) {
        const perSecond = perHour / 3600;
        passiveIncomeAccumulator += perSecond;
        
        // Only add whole coins to avoid floating point issues
        if (passiveIncomeAccumulator >= 1) {
          const coinsToAdd = Math.floor(passiveIncomeAccumulator);
          userData.coins += coinsToAdd;
          passiveIncomeAccumulator -= coinsToAdd;
          
          // Update only the balance display, not everything
          updateBalanceDisplay();
        }
      }
    }
  }, 1000);
}

// Update only balance displays (lightweight)
function updateBalanceDisplay() {
  const coins = Math.floor(Number(userData.coins) || 0);
  const balanceElements = ['coinBalance', 'minersBalance', 'tasksBalance', 'friendsBalance', 'profileBalance', 'leaderboardBalance', 'shopBalance', 'boostBalance'];
  balanceElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = formatNumber(coins);
  });
}

// Render Miners
function renderMiners() {
  const container = document.getElementById('minersList');
  if (!container) return;
  container.innerHTML = '';
  
  const userMiners = userData.miners || {};
  
  MINERS.forEach(miner => {
    const level = userMiners[miner.id] || 0;
    const price = Math.floor(miner.basePrice * Math.pow(1.5, level));
    const currentPower = level > 0 ? miner.basePower * level : 0;
    const nextPower = miner.basePower * (level + 1);
    const powerGain = nextPower - currentPower;
    const canAfford = userData.coins >= price;
    
    const card = document.createElement('div');
    card.className = `miner-card ${level === 0 ? 'new' : ''} ${!canAfford ? 'locked' : ''}`;
    card.innerHTML = `
      <div class="miner-icon">${miner.icon}</div>
      <div class="miner-info">
        <div class="miner-name">${miner.name}</div>
        <div class="miner-desc">${miner.description}</div>
        <div class="miner-stats">
          ${level > 0 ? `<div class="miner-current">Current: +${formatNumber(currentPower)}/min</div>` : ''}
          <div class="miner-gain">
            <span class="gain-label">${level === 0 ? 'Gives:' : 'Next:'}</span>
            <span class="gain-value">+${formatNumber(powerGain)}/min</span>
          </div>
        </div>
      </div>
      <div class="miner-right">
        <div class="miner-level-badge">${level > 0 ? `Lv.${level}` : 'NEW'}</div>
        <div class="miner-price">${canAfford ? '🍌' : '🔒'} ${formatNumber(price)}</div>
        <button class="btn-upgrade ${canAfford ? '' : 'disabled'}" 
                id="miner-btn-${miner.id}"
                ${!canAfford ? 'disabled' : ''}>
          ${level === 0 ? '🛒 Buy' : '⬆️ Upgrade'}
        </button>
      </div>
    `;
    
    container.appendChild(card);
    
    // Add click handler
    const btn = document.getElementById(`miner-btn-${miner.id}`);
    if (btn && canAfford) {
      btn.onclick = () => upgradeMiner(miner.id);
    }
  });
}

// Upgrade Miner
async function upgradeMiner(minerId) {
  const miner = MINERS.find(m => m.id === minerId);
  if (!miner) return;
  
  const level = (userData.miners?.[minerId]) || 0;
  const price = Math.floor(miner.basePrice * Math.pow(1.5, level));
  
  if (userData.coins < price) {
    showNotification('❌ Not enough coins!');
    return;
  }
  
  // Update locally
  userData.coins -= price;
  if (!userData.miners) userData.miners = {};
  userData.miners[minerId] = level + 1;
  userData.tapPower = (userData.tapPower || 1) + Math.floor(miner.basePower / 2);
  
  updateAllUI();
  showNotification(`✅ ${miner.name} upgraded to Lv.${level + 1}!`);
  
  // Sync with server
  try {
    await fetch(`${API_URL}/game/upgrade-miner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: userData.telegramId,
        minerId: minerId,
        price: price
      })
    });
  } catch (error) {
    console.error('Upgrade error:', error);
  }
}

// Load Tasks
async function loadTasks() {
  try {
    const response = await fetch(`${API_URL}/task/all`);
    const data = await response.json();
    
    if (data.success) {
      renderTasks(data.tasks);
    }
  } catch (error) {
    console.error('Load tasks error:', error);
  }
}

// Task states stored globally
const taskStates = {};

// Render Tasks (legacy - now using renderSpecialTasks)
function renderTasks(tasks) {
  // Update badge count
  const completedTasks = userData.completedTasks || [];
  const availableTasks = tasks.filter(t => !completedTasks.includes(t._id)).length;
  
  const badgeEl = document.getElementById('taskBadge');
  if (badgeEl) {
    badgeEl.textContent = availableTasks;
    badgeEl.style.display = availableTasks > 0 ? 'block' : 'none';
  }
}

// Handle Task - Simple 3 step flow
async function handleTask(taskId, taskLink, reward, btn) {
  const state = taskStates[taskId] || 'start';
  
  console.log('Task clicked:', taskId, 'State:', state);
  
  // STEP 1: Start
  if (state === 'start') {
    if (taskLink && taskLink.length > 0) {
      // Open link
      window.open(taskLink, '_blank');
      
      btn.textContent = 'Wait...';
      btn.disabled = true;
      
      setTimeout(() => {
        taskStates[taskId] = 'verify';
        btn.textContent = 'Verify';
        btn.className = 'task-btn verify';
        btn.disabled = false;
      }, 2000);
    } else {
      // No link - go to claim
      taskStates[taskId] = 'claim';
      btn.textContent = 'Claim';
      btn.className = 'task-btn claim';
    }
    return;
  }
  
  // STEP 2: Verify
  if (state === 'verify') {
    btn.textContent = 'Checking...';
    btn.disabled = true;
    
    setTimeout(() => {
      taskStates[taskId] = 'claim';
      btn.textContent = 'Claim';
      btn.className = 'task-btn claim';
      btn.disabled = false;
      showNotification('✅ Verified! Click Claim');
    }, 1500);
    return;
  }
  
  // STEP 3: Claim
  if (state === 'claim') {
    btn.textContent = 'Claiming...';
    btn.disabled = true;
    
    try {
      const response = await fetch(`${API_URL}/task/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: userData.telegramId,
          taskId: taskId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        userData.coins = Number(data.coins);
        if (!userData.completedTasks) userData.completedTasks = [];
        userData.completedTasks.push(taskId);
        delete taskStates[taskId];
        
        btn.textContent = '✓ Done';
        btn.className = 'task-btn completed';
        btn.disabled = true;
        btn.onclick = null;
        
        updateBalanceDisplay();
        showNotification(`🎉 +${formatNumber(reward)} coins!`);
      } else {
        btn.textContent = 'Claim';
        btn.disabled = false;
        showNotification('❌ ' + (data.message || 'Error'));
      }
    } catch (err) {
      console.error('Claim error:', err);
      btn.textContent = 'Claim';
      btn.disabled = false;
      showNotification('❌ Network error');
    }
  }
}

// Check Daily Reward
function checkDailyReward() {
  const lastReward = userData.lastDailyReward;
  if (!lastReward) {
    showDailyReward();
    return;
  }
  
  const hoursSince = (Date.now() - new Date(lastReward).getTime()) / (1000 * 60 * 60);
  if (hoursSince >= 24) {
    showDailyReward();
  }
  
  // Also check for gifts
  checkForGifts();
}

// Check for pending gifts from admin
async function checkForGifts() {
  try {
    const response = await fetch(`${API_URL}/user/${userData.telegramId}/gifts`);
    const data = await response.json();
    
    if (data.success) {
      // Update local data
      userData.freeSpins = data.freeSpins || 0;
      userData.mysteryBoxes = data.mysteryBoxes || [];
      
      // Show gift notification if there are gifts
      if (data.freeSpins > 0) {
        showNotification(`🎰 You have ${data.freeSpins} free spins!`);
      }
      if (data.mysteryBoxes && data.mysteryBoxes.length > 0) {
        showNotification(`📦 You have ${data.mysteryBoxes.length} mystery box(es)!`);
      }
      if (data.lastGift) {
        showNotification(data.lastGift.message || '🎁 You received a gift!');
      }
      
      // Update UI badges
      updateGiftBadges();
    }
  } catch (error) {
    console.error('Gift check error:', error);
  }
}

// Update gift badges in UI
function updateGiftBadges() {
  const spins = userData.freeSpins || 0;
  const boxes = (userData.mysteryBoxes || []).length;
  
  // Update boost tab badge if there are gifts
  const boostBadge = document.querySelector('[data-screen="boost"] .badge');
  if (boostBadge && (spins > 0 || boxes > 0)) {
    boostBadge.textContent = spins + boxes;
    boostBadge.style.display = 'flex';
  }
}

// Update gift UI elements
function updateGiftUI() {
  const spins = userData.freeSpins || 0;
  const boxes = (userData.mysteryBoxes || []).length;
  
  // Update spin count
  const spinsCountEl = document.getElementById('freeSpinsCount');
  if (spinsCountEl) spinsCountEl.textContent = spins;
  
  // Update mystery box count
  const boxCountEl = document.getElementById('mysteryBoxCount');
  if (boxCountEl) boxCountEl.textContent = boxes;
  
  // Update card states
  const spinsCard = document.getElementById('freeSpinsCard');
  if (spinsCard) spinsCard.classList.toggle('empty', spins <= 0);
  
  const boxCard = document.getElementById('mysteryBoxCard');
  if (boxCard) boxCard.classList.toggle('empty', boxes <= 0);
  
  // Update badges
  updateGiftBadges();
}

// Use free spin
async function useFreeSpin() {
  if (!userData.freeSpins || userData.freeSpins <= 0) {
    showNotification('❌ No free spins available');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/user/${userData.telegramId}/use-spin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    if (data.success) {
      userData.freeSpins = data.remainingSpins;
      if (data.reward.type === 'coins') {
        userData.coins += data.reward.amount;
      } else if (data.reward.type === 'energy') {
        userData.energy = Math.min(userData.energy + data.reward.amount, userData.maxEnergy);
      }
      updateAllUI();
      showNotification(`🎰 You won ${formatNumber(data.reward.amount)} ${data.reward.type}!`);
    } else {
      showNotification('❌ ' + (data.message || 'Spin failed'));
    }
  } catch (error) {
    console.error('Spin error:', error);
    showNotification('❌ Network error');
  }
}

// Open mystery box
async function openMysteryBox(index = 0) {
  if (!userData.mysteryBoxes || userData.mysteryBoxes.length === 0) {
    showNotification('❌ No mystery boxes available');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/user/${userData.telegramId}/open-mystery-box`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boxIndex: index })
    });
    
    const data = await response.json();
    if (data.success) {
      userData.mysteryBoxes = userData.mysteryBoxes.filter((_, i) => i !== index);
      userData.coins += data.reward.amount;
      updateAllUI();
      
      const boxEmoji = data.boxType === 'legendary' ? '🟡' : data.boxType === 'epic' ? '🟣' : data.boxType === 'rare' ? '🔵' : '🟢';
      showNotification(`${boxEmoji} Mystery Box: +${formatNumber(data.reward.amount)} coins!`);
    } else {
      showNotification('❌ ' + (data.message || 'Failed to open box'));
    }
  } catch (error) {
    console.error('Mystery box error:', error);
    showNotification('❌ Network error');
  }
}

// Show Daily Reward Modal
function showDailyReward() {
  const streak = (userData.dailyStreak || 0) + 1;
  const reward = 500 + (streak * 100);
  
  document.getElementById('streakValue').textContent = streak;
  document.getElementById('dailyRewardAmount').textContent = formatNumber(reward);
  document.getElementById('dailyModal').classList.add('active');
}

// Claim Daily Reward
document.getElementById('claimDailyBtn').addEventListener('click', async () => {
  try {
    const response = await fetch(`${API_URL}/game/daily-reward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId: userData.telegramId })
    });
    
    const data = await response.json();
    if (data.success) {
      userData.coins = data.coins;
      userData.dailyStreak = data.streak;
      userData.lastDailyReward = new Date().toISOString();
      updateAllUI();
      
      document.getElementById('dailyModal').classList.remove('active');
      showNotification(`🎁 +${formatNumber(data.reward)} daily reward!`);
    }
  } catch (error) {
    console.error('Daily reward error:', error);
    document.getElementById('dailyModal').classList.remove('active');
  }
});

// Leaderboard state
let currentLeaderboardType = 'coins';

// Load Leaderboard
async function loadLeaderboard(type = 'coins') {
  currentLeaderboardType = type;
  
  try {
    // Load user rank
    loadUserRank();
    
    const response = await fetch(`${API_URL}/user/leaderboard/top?type=${type}`);
    const data = await response.json();
    
    if (data.success) {
      renderLeaderboard(data.leaderboard, type);
    }
  } catch (error) {
    console.error('Leaderboard error:', error);
  }
}

// Load user's rank
async function loadUserRank() {
  try {
    const response = await fetch(`${API_URL}/user/rank/${userData.telegramId}`);
    const data = await response.json();
    
    if (data.success) {
      const rankEl = document.getElementById('userRankNumber');
      const coinsEl = document.getElementById('userRankCoins');
      const levelEl = document.getElementById('userRankLevel');
      
      if (rankEl) rankEl.textContent = `#${data.rank}`;
      if (coinsEl) coinsEl.textContent = formatNumber(data.coins);
      if (levelEl) levelEl.textContent = data.level || 1;
    }
  } catch (err) {
    console.error('Load rank error:', err);
  }
}

// Render Leaderboard
function renderLeaderboard(players, type = 'coins') {
  const container = document.getElementById('leaderboardList');
  container.innerHTML = '';
  
  if (players.length === 0) {
    container.innerHTML = '<div class="no-data">No players yet</div>';
    return;
  }
  
  players.forEach((player, index) => {
    const rank = index + 1;
    let rankClass = '';
    if (rank === 1) rankClass = 'top-1';
    else if (rank === 2) rankClass = 'top-2';
    else if (rank === 3) rankClass = 'top-3';
    
    // Determine what value to show based on type
    let scoreValue = player.coins;
    let scoreIcon = '🍌';
    if (type === 'miners') {
      scoreValue = player.totalTaps;
      scoreIcon = '⛏️';
    } else if (type === 'level') {
      scoreValue = player.level;
      scoreIcon = '⭐';
    }
    
    const isCurrentUser = player.username === userData.username;
    
    const item = document.createElement('div');
    item.className = `leaderboard-item ${rankClass} ${isCurrentUser ? 'current-user' : ''}`;
    item.innerHTML = `
      <div class="lb-rank">${rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}</div>
      <div class="lb-avatar">
        ${player.photoUrl ? `<img src="${player.photoUrl}" alt="">` : '🦍'}
        ${player.bananaPass ? '<span class="lb-pass-badge">👑</span>' : ''}
      </div>
      <div class="lb-info">
        <div class="lb-name">${player.username || player.firstName || 'Anonymous'}</div>
        <div class="lb-level">Level ${player.level || 1}</div>
      </div>
      <div class="lb-score">${scoreIcon} ${formatNumber(scoreValue)}</div>
    `;
    
    container.appendChild(item);
  });
}

// Copy Referral Link
document.getElementById('copyLinkBtn').addEventListener('click', () => {
  const botUsername = 'bananabillionbot';
  const referralLink = `https://t.me/${botUsername}?start=${userData.referralCode}`;
  
  navigator.clipboard.writeText(referralLink).then(() => {
    showNotification('📋 Link copied!');
  }).catch(() => {
    showNotification(referralLink);
  });
});

// Share Referral Link
document.getElementById('shareLinkBtn').addEventListener('click', () => {
  const botUsername = 'bananabillionbot';
  const referralLink = `https://t.me/${botUsername}?start=${userData.referralCode}`;
  const text = `🍌 Join Banana Billion Mining Empire!\n\nTap to mine coins and build your empire!\n\n${referralLink}`;
  
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`);
  } else {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, '_blank');
  }
});

// Navigation
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const screen = btn.dataset.screen;
    switchScreen(screen);
  });
});

document.querySelectorAll('.back-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const screen = btn.dataset.back;
    switchScreen(screen);
  });
});

function switchScreen(screenName) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenName).classList.add('active');
  
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-screen="${screenName}"]`)?.classList.add('active');
  
  currentScreen = screenName;
  
  if (screenName === 'leaderboard') {
    loadLeaderboard();
  }
  if (screenName === 'shop') {
    initShop();
  }
  if (screenName === 'miners') {
    renderMiners();
  }
  if (screenName === 'tasks') {
    switchTaskTab('special');
  }
  if (screenName === 'boost') {
    renderBoostScreen();
  }
  if (screenName === 'friends') {
    loadReferrals();
  }
  if (screenName === 'wallet') {
    initWallet();
  }
}

// Load referrals data
async function loadReferrals() {
  try {
    // Update balance display
    const friendsBalanceEl = document.getElementById('friendsBalance');
    if (friendsBalanceEl) friendsBalanceEl.textContent = formatNumber(userData.coins);
    
    const response = await fetch(`${API_URL}/user/referrals/${userData.telegramId}`);
    const data = await response.json();
    
    if (data.success) {
      // Update referral code display
      const codeEl = document.getElementById('referralCode');
      if (codeEl) codeEl.textContent = data.referralCode || userData.referralCode;
      
      // Update stats
      const totalEl = document.getElementById('totalReferrals');
      if (totalEl) totalEl.textContent = data.totalReferrals || 0;
      
      const earningsEl = document.getElementById('referralEarnings');
      if (earningsEl) earningsEl.textContent = formatNumber(data.totalEarnings || 0);
      
      // Render referrals list
      const listEl = document.getElementById('referralsList');
      if (listEl) {
        if (data.referrals && data.referrals.length > 0) {
          listEl.innerHTML = data.referrals.map(ref => {
            // Format join date
            const joinDate = ref.joinedAt ? formatDate(ref.joinedAt) : 'Recently';
            return `
              <div class="referral-item">
                <div class="referral-avatar">👤</div>
                <div class="referral-info">
                  <span class="referral-name">${ref.username || ref.firstName || 'User'}</span>
                  <span class="referral-date">Lv.${ref.level || 1} • Joined ${joinDate}</span>
                </div>
                <div class="referral-bonus">+2,500 🍌</div>
              </div>
            `;
          }).join('');
        } else {
          listEl.innerHTML = `
            <div class="no-referrals-box">
              <div class="no-ref-icon">👥</div>
              <p>No referrals yet</p>
              <span>Share your link to earn 2,500 coins per friend!</span>
            </div>
          `;
        }
      }
    }
  } catch (err) {
    console.error('Load referrals error:', err);
  }
}

// Format date helper
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

// Show Notification - Always use custom toast (Telegram methods not supported in browser)
function showNotification(message) {
  // Create custom notification toast
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(26, 31, 46, 0.95);
    color: white;
    padding: 12px 24px;
    border-radius: 12px;
    font-size: 14px;
    z-index: 9999;
    border: 1px solid rgba(247, 179, 43, 0.3);
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    animation: slideDown 0.3s ease;
  `;
  notif.textContent = message;
  document.body.appendChild(notif);
  setTimeout(() => {
    notif.style.opacity = '0';
    notif.style.transition = 'opacity 0.3s';
    setTimeout(() => notif.remove(), 300);
  }, 2500);
}

// Show Error
function showError(message) {
  const loading = document.getElementById('loading');
  loading.innerHTML = `
    <div class="loading-content">
      <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
      <h2 style="color: #ef4444;">Error</h2>
      <p style="margin-top: 10px; color: #9ca3af;">${message}</p>
    </div>
  `;
}

// ==================== TASK TAB SYSTEM ====================
let adsWatchedToday = 0;
const MAX_ADS_PER_DAY = 5;
const claimedLeagues = JSON.parse(localStorage.getItem('claimedLeagues') || '[]');
const claimedRefTasks = JSON.parse(localStorage.getItem('claimedRefTasks') || '[]');

// Tab switching for tasks
document.querySelectorAll('.tasks-tabs .tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    switchTaskTab(tabName);
  });
});

function switchTaskTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tasks-tabs .tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.tasks-tabs [data-tab="${tabName}"]`)?.classList.add('active');
  
  // Update tab content
  document.querySelectorAll('.task-tab-content').forEach(c => c.classList.remove('active'));
  
  if (tabName === 'special') {
    document.getElementById('specialTasks').classList.add('active');
    renderSpecialTasks();
  } else if (tabName === 'leagues') {
    document.getElementById('leaguesTasks').classList.add('active');
    renderLeagues();
  } else if (tabName === 'referral') {
    document.getElementById('referralTasks').classList.add('active');
    renderReferralTasks();
  } else if (tabName === 'premium') {
    document.getElementById('premiumTasks').classList.add('active');
    renderPremiumTasks();
  }
}

// ==================== SPECIAL TASKS ====================
function renderSpecialTasks() {
  const container = document.getElementById('specialTasks');
  if (!container) return;
  
  fetch(`${API_URL}/task/all`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        container.innerHTML = '';
        const completedTasks = userData.completedTasks || [];
        
        data.tasks.forEach(task => {
          const isCompleted = completedTasks.includes(task._id);
          
          const card = document.createElement('div');
          card.className = `special-task-card ${isCompleted ? 'completed' : ''}`;
          card.innerHTML = `
            <div class="special-task-icon">${task.icon || '📋'}</div>
            <div class="special-task-info">
              <div class="special-task-title">${task.title}</div>
              <div class="special-task-reward">+${formatNumber(task.reward)} 🍌</div>
            </div>
            <div class="special-task-action">
              ${isCompleted ? '<span class="checkmark">✓</span>' : '<span class="arrow">›</span>'}
            </div>
          `;
          
          if (!isCompleted) {
            card.onclick = () => showTaskPopup(task);
          }
          
          container.appendChild(card);
        });
        
        // Update dot indicator
        const availableTasks = data.tasks.filter(t => !completedTasks.includes(t._id)).length;
        const dot = document.getElementById('specialDot');
        if (dot) dot.classList.toggle('show', availableTasks > 0);
      }
    })
    .catch(err => console.error('Load special tasks error:', err));
}

// ==================== TASK POPUP MODAL ====================
function showTaskPopup(task) {
  // Remove existing popup
  const existingPopup = document.querySelector('.task-popup-overlay');
  if (existingPopup) existingPopup.remove();
  
  const isCompleted = (userData.completedTasks || []).includes(task._id);
  const state = taskStates[task._id] || 'start';
  const isTelegramTask = task.type === 'telegram' || task.type === 'channel' || task.type === 'group';
  
  // Get task type info
  const taskTypeInfo = getTaskTypeInfo(task);
  
  // Determine button state and text
  let buttonText = '▶️ Start Task';
  let buttonClass = 'start';
  
  if (state === 'verify') {
    buttonText = '✓ Verify';
    buttonClass = 'verify';
  } else if (state === 'claim') {
    buttonText = '🎁 Claim Reward';
    buttonClass = 'claim';
  }
  
  const popup = document.createElement('div');
  popup.className = 'task-popup-overlay';
  popup.innerHTML = `
    <div class="task-popup-modal">
      <button class="task-popup-close" onclick="closeTaskPopup()">✕</button>
      
      <div class="task-popup-header">
        <div class="task-popup-icon-wrap ${taskTypeInfo.colorClass}">
          <span class="task-popup-icon">${task.icon || '📋'}</span>
        </div>
        <h2 class="task-popup-title">${task.title}</h2>
        <p class="task-popup-desc">${task.description || taskTypeInfo.description}</p>
      </div>
      
      <div class="task-popup-reward-box">
        <div class="task-popup-reward-label">Reward</div>
        <div class="task-popup-reward-value">
          <span class="reward-coin">🍌</span>
          <span class="reward-amount">+${formatNumber(task.reward)}</span>
        </div>
      </div>
      
      <div class="task-popup-steps">
        <div class="task-step ${state !== 'start' ? 'completed' : 'active'}">
          <div class="step-number">${state !== 'start' ? '✓' : '1'}</div>
          <div class="step-info">
            <div class="step-title">${taskTypeInfo.stepTitle}</div>
            <div class="step-desc">${taskTypeInfo.stepDesc}</div>
          </div>
        </div>
        <div class="task-step ${state === 'claim' ? 'completed' : state === 'verify' ? 'active' : ''}">
          <div class="step-number">${state === 'claim' ? '✓' : '2'}</div>
          <div class="step-info">
            <div class="step-title">Verify Completion</div>
            <div class="step-desc">We'll check if you completed the task</div>
          </div>
        </div>
        <div class="task-step ${state === 'claim' ? 'active' : ''}">
          <div class="step-number">3</div>
          <div class="step-info">
            <div class="step-title">Claim Reward</div>
            <div class="step-desc">Get your ${formatNumber(task.reward)} coins!</div>
          </div>
        </div>
      </div>
      
      <div class="task-popup-actions">
        <button class="task-popup-btn ${buttonClass}" id="taskPopupBtn" data-task-id="${task._id}">
          ${buttonText}
        </button>
      </div>
      
      ${isTelegramTask ? `
        <div class="task-popup-note">
          <span class="note-icon">ℹ️</span>
          <span>Bot must be admin in the channel/group for verification</span>
        </div>
      ` : ''}
    </div>
  `;
  
  document.body.appendChild(popup);
  
  // Add click handler
  const btn = document.getElementById('taskPopupBtn');
  btn.onclick = () => handleTaskPopupAction(task, btn);
  
  // Close on overlay click
  popup.onclick = (e) => {
    if (e.target === popup) closeTaskPopup();
  };
  
  // Animate in
  requestAnimationFrame(() => {
    popup.classList.add('active');
  });
}

// Get task type specific info
function getTaskTypeInfo(task) {
  const type = task.type || 'social';
  
  const typeMap = {
    'telegram': {
      colorClass: 'telegram',
      description: 'Join our Telegram community to stay updated!',
      stepTitle: 'Join Channel/Group',
      stepDesc: 'Tap to open and join'
    },
    'channel': {
      colorClass: 'telegram',
      description: 'Subscribe to our official channel',
      stepTitle: 'Join Channel',
      stepDesc: 'Tap to open and subscribe'
    },
    'group': {
      colorClass: 'telegram',
      description: 'Join our community group',
      stepTitle: 'Join Group',
      stepDesc: 'Tap to open and join'
    },
    'social': {
      colorClass: 'social',
      description: 'Follow us on social media',
      stepTitle: 'Visit & Follow',
      stepDesc: 'Tap to open the link'
    },
    'achievement': {
      colorClass: 'achievement',
      description: 'Complete this milestone to earn rewards',
      stepTitle: 'Complete Task',
      stepDesc: 'Reach the required goal'
    },
    'referral': {
      colorClass: 'referral',
      description: 'Invite friends and earn together',
      stepTitle: 'Invite Friends',
      stepDesc: 'Share your referral link'
    },
    'daily': {
      colorClass: 'daily',
      description: 'Complete daily activities',
      stepTitle: 'Daily Activity',
      stepDesc: 'Complete the daily requirement'
    }
  };
  
  return typeMap[type] || typeMap['social'];
}

// Handle task popup button action
async function handleTaskPopupAction(task, btn) {
  const state = taskStates[task._id] || 'start';
  const isTelegramTask = task.type === 'telegram' || task.type === 'channel' || task.type === 'group';
  
  // STEP 1: Start - Open link
  if (state === 'start') {
    if (task.link) {
      // Open the link
      if (isTelegramTask && tg?.openTelegramLink) {
        tg.openTelegramLink(task.link);
      } else {
        window.open(task.link, '_blank');
      }
      
      // Update state
      taskStates[task._id] = 'verify';
      
      // Update button
      btn.textContent = '⏳ Verifying...';
      btn.className = 'task-popup-btn loading';
      
      // Wait a moment then update UI
      setTimeout(() => {
        btn.textContent = '✓ Verify';
        btn.className = 'task-popup-btn verify';
        updateTaskPopupSteps('verify');
      }, 2000);
    } else {
      taskStates[task._id] = 'claim';
      btn.textContent = '🎁 Claim Reward';
      btn.className = 'task-popup-btn claim';
      updateTaskPopupSteps('claim');
    }
    return;
  }
  
  // STEP 2: Verify
  if (state === 'verify') {
    btn.textContent = '⏳ Checking...';
    btn.className = 'task-popup-btn loading';
    btn.disabled = true;
    
    try {
      if (isTelegramTask) {
        // Verify with server
        const response = await fetch(`${API_URL}/task/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId: userData.telegramId,
            taskId: task._id
          })
        });
        
        const data = await response.json();
        
        if (data.verified) {
          taskStates[task._id] = 'claim';
          btn.textContent = '🎁 Claim Reward';
          btn.className = 'task-popup-btn claim';
          btn.disabled = false;
          updateTaskPopupSteps('claim');
          showNotification('✅ Verified successfully!');
        } else {
          btn.textContent = '✓ Verify';
          btn.className = 'task-popup-btn verify';
          btn.disabled = false;
          showNotification('❌ ' + (data.message || 'Please complete the task first!'));
        }
      } else {
        // Auto-verify for non-Telegram tasks
        await new Promise(resolve => setTimeout(resolve, 1500));
        taskStates[task._id] = 'claim';
        btn.textContent = '🎁 Claim Reward';
        btn.className = 'task-popup-btn claim';
        btn.disabled = false;
        updateTaskPopupSteps('claim');
        showNotification('✅ Verified!');
      }
    } catch (err) {
      console.error('Verify error:', err);
      btn.textContent = '✓ Verify';
      btn.className = 'task-popup-btn verify';
      btn.disabled = false;
      showNotification('❌ Verification failed, try again');
    }
    return;
  }
  
  // STEP 3: Claim
  if (state === 'claim') {
    btn.textContent = '⏳ Claiming...';
    btn.className = 'task-popup-btn loading';
    btn.disabled = true;
    
    try {
      const response = await fetch(`${API_URL}/task/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: userData.telegramId,
          taskId: task._id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        userData.coins = Number(data.coins);
        if (!userData.completedTasks) userData.completedTasks = [];
        userData.completedTasks.push(task._id);
        delete taskStates[task._id];
        
        // Show success animation
        showTaskCompleteAnimation(task.reward);
        
        // Update UI
        updateBalanceDisplay();
        renderSpecialTasks();
        
        // Close popup after animation
        setTimeout(() => {
          closeTaskPopup();
        }, 1500);
      } else {
        btn.textContent = '🎁 Claim Reward';
        btn.className = 'task-popup-btn claim';
        btn.disabled = false;
        showNotification('❌ ' + (data.message || 'Failed to claim'));
        
        // Reset state if needed
        if (data.message && data.message.includes('join')) {
          taskStates[task._id] = 'verify';
          btn.textContent = '✓ Verify';
          btn.className = 'task-popup-btn verify';
          updateTaskPopupSteps('verify');
        }
      }
    } catch (err) {
      console.error('Claim error:', err);
      btn.textContent = '🎁 Claim Reward';
      btn.className = 'task-popup-btn claim';
      btn.disabled = false;
      showNotification('❌ Error claiming reward');
    }
  }
}

// Update task popup steps UI
function updateTaskPopupSteps(currentState) {
  const steps = document.querySelectorAll('.task-step');
  if (!steps.length) return;
  
  steps.forEach((step, index) => {
    step.classList.remove('active', 'completed');
    
    if (currentState === 'verify') {
      if (index === 0) step.classList.add('completed');
      if (index === 1) step.classList.add('active');
    } else if (currentState === 'claim') {
      if (index === 0 || index === 1) step.classList.add('completed');
      if (index === 2) step.classList.add('active');
    }
  });
}

// Show task complete animation
function showTaskCompleteAnimation(reward) {
  const popup = document.querySelector('.task-popup-modal');
  if (!popup) return;
  
  // Replace content with success animation
  popup.innerHTML = `
    <div class="task-complete-animation">
      <div class="success-checkmark">
        <div class="check-icon">✓</div>
      </div>
      <h2 class="success-title">Task Completed!</h2>
      <div class="success-reward">
        <span class="reward-coin-big">🍌</span>
        <span class="reward-amount-big">+${formatNumber(reward)}</span>
      </div>
      <div class="success-confetti"></div>
    </div>
  `;
  
  // Create confetti
  const confettiContainer = popup.querySelector('.success-confetti');
  const emojis = ['🎉', '⭐', '✨', '💰', '🍌', '🎊'];
  
  for (let i = 0; i < 20; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.animationDuration = (1 + Math.random()) + 's';
    confettiContainer.appendChild(confetti);
  }
}

// Close task popup
function closeTaskPopup() {
  const popup = document.querySelector('.task-popup-overlay');
  if (popup) {
    popup.classList.remove('active');
    setTimeout(() => popup.remove(), 300);
  }
}



// ==================== ADVANCED LEAGUE SYSTEM ====================
const LEAGUES = [
  { 
    id: 'bronze', 
    name: 'Bronze', 
    icon: '🥉', 
    target: 1000, 
    reward: 1000,
    color: '#cd7f32',
    perks: '+5% tap bonus'
  },
  { 
    id: 'silver', 
    name: 'Silver', 
    icon: '🥈', 
    target: 10000, 
    reward: 5000,
    color: '#c0c0c0',
    perks: '+10% tap bonus'
  },
  { 
    id: 'gold', 
    name: 'Gold', 
    icon: '🥇', 
    target: 50000, 
    reward: 10000,
    color: '#ffd700',
    perks: '+15% tap bonus'
  },
  { 
    id: 'platinum', 
    name: 'Platinum', 
    icon: '💎', 
    target: 200000, 
    reward: 30000,
    color: '#e5e4e2',
    perks: '+20% tap bonus'
  },
  { 
    id: 'diamond', 
    name: 'Diamond', 
    icon: '👑', 
    target: 1000000, 
    reward: 100000,
    color: '#b9f2ff',
    perks: '+25% tap bonus'
  },
  { 
    id: 'master', 
    name: 'Master', 
    icon: '🔥', 
    target: 5000000, 
    reward: 500000,
    color: '#ff6b35',
    perks: '+30% tap bonus'
  },
  { 
    id: 'legend', 
    name: 'Legend', 
    icon: '⚡', 
    target: 25000000, 
    reward: 2500000,
    color: '#9d4edd',
    perks: '+40% tap bonus'
  },
  { 
    id: 'mythic', 
    name: 'Mythic', 
    icon: '🌟', 
    target: 100000000, 
    reward: 10000000,
    color: '#ff0080',
    perks: '+50% tap bonus'
  }
];

// Get user's current league based on total coins earned
function getCurrentLeague() {
  const totalEarned = userData.totalCoinsEarned || userData.coins || 0;
  let currentLeague = null;
  
  for (let i = LEAGUES.length - 1; i >= 0; i--) {
    if (totalEarned >= LEAGUES[i].target) {
      currentLeague = LEAGUES[i];
      break;
    }
  }
  
  return currentLeague;
}

// Get next league
function getNextLeague() {
  const totalEarned = userData.totalCoinsEarned || userData.coins || 0;
  
  for (let i = 0; i < LEAGUES.length; i++) {
    if (totalEarned < LEAGUES[i].target) {
      return LEAGUES[i];
    }
  }
  
  return null; // Max league reached
}

// Get league bonus multiplier
function getLeagueBonus() {
  const league = getCurrentLeague();
  if (!league) return 1;
  
  const bonuses = {
    'bronze': 1.05,
    'silver': 1.10,
    'gold': 1.15,
    'platinum': 1.20,
    'diamond': 1.25,
    'master': 1.30,
    'legend': 1.40,
    'mythic': 1.50
  };
  
  return bonuses[league.id] || 1;
}

function renderLeagues() {
  const container = document.getElementById('leaguesList');
  if (!container) return;
  
  container.innerHTML = '';
  const totalEarned = userData.totalCoinsEarned || userData.coins || 0;
  let hasAvailable = false;
  const currentLeague = getCurrentLeague();
  
  // Add current league header
  const headerHtml = `
    <div class="league-header">
      <div class="current-league-display">
        <span class="current-league-icon">${currentLeague?.icon || '🆕'}</span>
        <div class="current-league-info">
          <span class="current-league-label">Current League</span>
          <span class="current-league-name">${currentLeague?.name || 'Newcomer'}</span>
        </div>
      </div>
      <div class="league-bonus-badge">
        ${currentLeague ? currentLeague.perks : 'No bonus yet'}
      </div>
    </div>
  `;
  container.innerHTML = headerHtml;
  
  // Create leagues list
  const listDiv = document.createElement('div');
  listDiv.className = 'leagues-cards';
  
  LEAGUES.forEach((league, index) => {
    const progress = Math.min(100, (totalEarned / league.target) * 100);
    const isUnlocked = totalEarned >= league.target;
    const canClaim = isUnlocked && !claimedLeagues.includes(league.id);
    const isClaimed = claimedLeagues.includes(league.id);
    const isCurrent = currentLeague?.id === league.id;
    const isNext = !isUnlocked && (index === 0 || totalEarned >= LEAGUES[index - 1].target);
    
    if (canClaim) hasAvailable = true;
    
    // Calculate coins needed
    const coinsNeeded = Math.max(0, league.target - totalEarned);
    
    const card = document.createElement('div');
    card.className = `league-card ${isCurrent ? 'current' : ''} ${isUnlocked ? 'unlocked' : ''} ${isClaimed ? 'claimed' : ''} ${isNext ? 'next' : ''}`;
    card.style.setProperty('--league-color', league.color);
    
    card.innerHTML = `
      <div class="league-icon-wrap" style="background: linear-gradient(135deg, ${league.color}33 0%, ${league.color}11 100%);">
        <span class="league-icon">${league.icon}</span>
        ${isCurrent ? '<div class="league-current-badge">YOU</div>' : ''}
      </div>
      <div class="league-info">
        <div class="league-name-row">
          <span class="league-name">${league.name}</span>
          ${isUnlocked && !isClaimed ? '<span class="league-new-badge">NEW!</span>' : ''}
        </div>
        <div class="league-reward-text">${formatNumber(league.reward)}</div>
        <div class="league-progress">
          <div class="league-progress-bar" style="width: ${progress}%; background: ${league.color};"></div>
        </div>
        <div class="league-progress-text">
          ${isUnlocked 
            ? '✓ Completed' 
            : `${formatNumber(totalEarned)} / ${formatNumber(league.target)}`
          }
        </div>
      </div>
      <div class="league-action">
        ${isClaimed 
          ? '<div class="league-claimed-check">✓</div>'
          : canClaim 
            ? `<button class="league-claim-btn pulse" data-league="${league.id}">Claim</button>`
            : `<button class="league-claim-btn" disabled>${isUnlocked ? 'Claimed' : formatNumber(coinsNeeded)}</button>`
        }
      </div>
    `;
    
    listDiv.appendChild(card);
  });
  
  container.appendChild(listDiv);
  
  // Add click handlers
  container.querySelectorAll('.league-claim-btn:not([disabled])').forEach(btn => {
    btn.onclick = () => {
      const leagueId = btn.dataset.league;
      const league = LEAGUES.find(l => l.id === leagueId);
      if (league) claimLeague(league, btn);
    };
  });
  
  // Update dot indicator
  const dot = document.getElementById('leaguesDot');
  if (dot) dot.classList.toggle('show', hasAvailable);
}

async function claimLeague(league, btn) {
  if (claimedLeagues.includes(league.id)) return;
  
  // Disable button and show loading
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span>';
  
  try {
    // Add reward
    userData.coins += league.reward;
    claimedLeagues.push(league.id);
    localStorage.setItem('claimedLeagues', JSON.stringify(claimedLeagues));
    
    // Sync with server
    await fetch(`${API_URL}/game/claim-league`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: userData.telegramId,
        leagueId: league.id,
        reward: league.reward,
        currentCoins: userData.coins
      })
    });
    
    // Show celebration
    showLeagueCelebration(league);
    
    // Update UI
    updateBalanceDisplay();
    renderLeagues();
    
  } catch (err) {
    console.error('Claim league error:', err);
    // Still update locally even if server fails
    updateBalanceDisplay();
    renderLeagues();
    showNotification(`🏆 ${league.name} League! +${formatNumber(league.reward)} coins!`);
  }
}

// Show league celebration modal
function showLeagueCelebration(league) {
  // Create celebration overlay
  const overlay = document.createElement('div');
  overlay.className = 'league-celebration-overlay';
  overlay.innerHTML = `
    <div class="league-celebration">
      <div class="celebration-particles"></div>
      <div class="celebration-icon">${league.icon}</div>
      <h2 class="celebration-title">League Unlocked!</h2>
      <div class="celebration-league-name" style="color: ${league.color}">${league.name}</div>
      <div class="celebration-reward">
        <span class="reward-icon">🍌</span>
        <span class="reward-amount">+${formatNumber(league.reward)}</span>
      </div>
      <div class="celebration-perk">${league.perks}</div>
      <button class="celebration-btn">Awesome!</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Add particles
  const particlesContainer = overlay.querySelector('.celebration-particles');
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.className = 'celebration-particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 0.5 + 's';
    particle.style.background = league.color;
    particlesContainer.appendChild(particle);
  }
  
  // Close button
  overlay.querySelector('.celebration-btn').onclick = () => {
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 300);
  };
  
  // Auto close after 5 seconds
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 300);
    }
  }, 5000);
}

// Update league display in top bar (optional)
function updateLeagueDisplay() {
  const league = getCurrentLeague();
  const leagueBadge = document.getElementById('leagueBadge');
  if (leagueBadge && league) {
    leagueBadge.innerHTML = `<span>${league.icon}</span> ${league.name}`;
    leagueBadge.style.display = 'flex';
  }
}

// ==================== REFERRAL TASKS ====================
const REF_TASKS = [
  { id: 'ref1', target: 1, reward: 2500, icon: '🐱' },
  { id: 'ref3', target: 3, reward: 50000, icon: '🐱' },
  { id: 'ref10', target: 10, reward: 200000, icon: '🐱' },
  { id: 'ref25', target: 25, reward: 250000, icon: '🐱' }
];

function renderReferralTasks() {
  const container = document.getElementById('refTasksList');
  if (!container) return;
  
  container.innerHTML = '';
  const referralCount = userData.referrals?.length || 0;
  
  REF_TASKS.forEach(task => {
    const progress = Math.min(100, (referralCount / task.target) * 100);
    const canClaim = referralCount >= task.target && !claimedRefTasks.includes(task.id);
    const isClaimed = claimedRefTasks.includes(task.id);
    
    const card = document.createElement('div');
    card.className = 'ref-task-card';
    card.innerHTML = `
      <div class="ref-task-icon-wrap">
        <span class="ref-task-icon">${task.icon}</span>
        <span class="ref-heart">💙</span>
      </div>
      <div class="ref-task-info">
        <div class="ref-task-title">Invite ${task.target} Friend${task.target > 1 ? 's' : ''}</div>
        <div class="ref-task-reward-text">${formatNumber(task.reward)}</div>
        <div class="ref-task-progress">
          <div class="ref-task-progress-bar" style="width: ${progress}%"></div>
        </div>
      </div>
      <div class="ref-task-action">
        <button class="ref-claim-btn ${isClaimed ? 'claimed' : ''}" 
                ${!canClaim ? 'disabled' : ''}>
          ${isClaimed ? '✓' : 'Claim'}
        </button>
      </div>
    `;
    
    if (canClaim) {
      card.querySelector('.ref-claim-btn').onclick = () => claimRefTask(task);
    }
    
    container.appendChild(card);
  });
}

async function claimRefTask(task) {
  if (claimedRefTasks.includes(task.id)) return;
  
  userData.coins += task.reward;
  claimedRefTasks.push(task.id);
  localStorage.setItem('claimedRefTasks', JSON.stringify(claimedRefTasks));
  
  updateBalanceDisplay();
  renderReferralTasks();
  showNotification(`👥 Referral milestone! +${formatNumber(task.reward)} coins!`);
  
  // Sync with server
  try {
    await fetch(`${API_URL}/game/tap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: userData.telegramId,
        taps: 0,
        currentCoins: userData.coins
      })
    });
  } catch (err) {
    console.error('Sync error:', err);
  }
}

// ==================== PREMIUM TASKS (ADS) ====================
const PREMIUM_TASKS = [
  { id: 'ad1', title: 'Watch Video Ad', desc: 'Watch a 30 second video', reward: 500, icon: '🎬' },
  { id: 'ad2', title: 'Watch Bonus Video', desc: 'Watch for extra rewards', reward: 1000, icon: '📺' },
  { id: 'ad3', title: 'Lucky Spin', desc: 'Watch ad & spin the wheel!', reward: 'spin', icon: '🎰' }
];

// Lucky Spin Configuration
const SPIN_REWARDS = [
  { value: 100, label: '100', color: '#ef4444', probability: 25 },
  { value: 250, label: '250', color: '#f97316', probability: 20 },
  { value: 500, label: '500', color: '#eab308', probability: 18 },
  { value: 1000, label: '1K', color: '#22c55e', probability: 15 },
  { value: 2500, label: '2.5K', color: '#3b82f6', probability: 12 },
  { value: 5000, label: '5K', color: '#8b5cf6', probability: 7 },
  { value: 10000, label: '10K', color: '#ec4899', probability: 2 },
  { value: 25000, label: '25K', color: '#f59e0b', probability: 1 }
];
const MAX_DAILY_SPINS = 3;
let dailySpinsUsed = 0;

function loadSpinData() {
  const today = new Date().toDateString();
  const saved = JSON.parse(localStorage.getItem('spinData') || '{}');
  if (saved.date !== today) {
    dailySpinsUsed = 0;
    localStorage.setItem('spinData', JSON.stringify({ date: today, spins: 0 }));
  } else {
    dailySpinsUsed = saved.spins || 0;
  }
}

function renderPremiumTasks() {
  const container = document.getElementById('premiumTasksList');
  if (!container) return;
  
  // Load ads watched from localStorage
  const today = new Date().toDateString();
  const savedAds = JSON.parse(localStorage.getItem('adsData') || '{}');
  if (savedAds.date !== today) {
    adsWatchedToday = 0;
    localStorage.setItem('adsData', JSON.stringify({ date: today, count: 0 }));
  } else {
    adsWatchedToday = savedAds.count || 0;
  }
  
  // Load spin data
  loadSpinData();
  
  // Update counter
  document.getElementById('adsWatched').textContent = adsWatchedToday;
  
  container.innerHTML = '';
  
  PREMIUM_TASKS.forEach(task => {
    const isAdLimitReached = adsWatchedToday >= MAX_ADS_PER_DAY;
    const isSpinLimitReached = task.reward === 'spin' && dailySpinsUsed >= MAX_DAILY_SPINS;
    const isDisabled = isAdLimitReached || isSpinLimitReached;
    
    let rewardText = task.reward === 'spin' ? `🎰 ${MAX_DAILY_SPINS - dailySpinsUsed}/${MAX_DAILY_SPINS}` : `+${formatNumber(task.reward)} 🍌`;
    let statusText = isSpinLimitReached ? 'No Spins Left' : (isAdLimitReached ? 'Daily Limit' : '');
    
    const card = document.createElement('div');
    card.className = `premium-task-card ${task.reward === 'spin' ? 'spin-card' : ''} ${isDisabled ? 'disabled' : ''}`;
    card.innerHTML = `
      <div class="premium-task-icon-wrap ${task.reward === 'spin' ? 'spin-icon' : ''}">
        <span class="premium-task-icon">${task.icon}</span>
      </div>
      <div class="premium-task-info">
        <div class="premium-task-title">${task.title}</div>
        <div class="premium-task-reward">${rewardText}</div>
      </div>
      <div class="premium-task-action">
        ${isDisabled 
          ? `<span class="premium-status">${statusText}</span>` 
          : '<span class="arrow">›</span>'
        }
      </div>
    `;
    
    if (!isDisabled) {
      card.onclick = () => showPremiumTaskPopup(task);
    }
    
    container.appendChild(card);
  });
}

// Show Premium Task Popup
function showPremiumTaskPopup(task) {
  const existingPopup = document.querySelector('.task-popup-overlay');
  if (existingPopup) existingPopup.remove();
  
  const isSpin = task.reward === 'spin';
  const spinsLeft = MAX_DAILY_SPINS - dailySpinsUsed;
  const adsLeft = MAX_ADS_PER_DAY - adsWatchedToday;
  
  const popup = document.createElement('div');
  popup.className = 'task-popup-overlay';
  popup.innerHTML = `
    <div class="task-popup-modal">
      <button class="task-popup-close" onclick="closeTaskPopup()">✕</button>
      
      <div class="task-popup-header">
        <div class="task-popup-icon-wrap premium">
          <span class="task-popup-icon">${task.icon}</span>
        </div>
        <h2 class="task-popup-title">${task.title}</h2>
        <p class="task-popup-desc">${task.desc}</p>
      </div>
      
      <div class="task-popup-reward-box ${isSpin ? 'spin-box' : ''}">
        ${isSpin ? `
          <div class="task-popup-reward-label">Spin the Wheel!</div>
          <div class="spin-prizes">
            <span class="spin-prize">🎰 Win up to 25,000 coins!</span>
          </div>
          <div class="spins-remaining">
            <span class="spins-count">${spinsLeft}</span>
            <span class="spins-label">spins remaining today</span>
          </div>
        ` : `
          <div class="task-popup-reward-label">Reward</div>
          <div class="task-popup-reward-value">
            <span class="reward-coin">🍌</span>
            <span class="reward-amount">+${formatNumber(task.reward)}</span>
          </div>
        `}
      </div>
      
      <div class="premium-task-info-box">
        <div class="info-row">
          <span class="info-icon">📺</span>
          <span class="info-text">Watch a short video advertisement</span>
        </div>
        <div class="info-row">
          <span class="info-icon">⏱️</span>
          <span class="info-text">Takes about 15-30 seconds</span>
        </div>
        <div class="info-row">
          <span class="info-icon">🎁</span>
          <span class="info-text">${isSpin ? 'Spin the wheel after watching' : 'Get instant reward after watching'}</span>
        </div>
      </div>
      
      <div class="task-popup-actions">
        <button class="task-popup-btn premium-btn" id="premiumTaskBtn">
          ▶️ Watch Ad & ${isSpin ? 'Spin' : 'Earn'}
        </button>
      </div>
      
      <div class="ads-remaining-note">
        <span class="note-icon">ℹ️</span>
        <span>${adsLeft} ads remaining today</span>
      </div>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  // Add click handler
  document.getElementById('premiumTaskBtn').onclick = () => {
    closeTaskPopup();
    watchAd(task);
  };
  
  // Close on overlay click
  popup.onclick = (e) => {
    if (e.target === popup) closeTaskPopup();
  };
  
  // Animate in
  requestAnimationFrame(() => {
    popup.classList.add('active');
  });
}

// Monetag Rewarded Interstitial Ad
// Zone ID: 10246329

// Track pending ad rewards
let pendingAdReward = null;
let adInProgress = false;

// Monetag Ad Zone ID
const MONETAG_ZONE_ID = '10246329';

function watchAd(task) {
  console.log('📺 watchAd called for task:', task.id);
  
  if (adsWatchedToday >= MAX_ADS_PER_DAY) {
    showNotification('❌ Daily ad limit reached! Come back tomorrow.');
    return;
  }
  
  if (adInProgress) {
    showNotification('⏳ Please wait for current ad to finish');
    return;
  }
  
  // Try to find button (might not exist if called from popup)
  const btn = document.getElementById(`btn-${task.id}`);
  if (btn) {
    btn.textContent = '⏳ Loading...';
    btn.classList.add('loading');
    btn.disabled = true;
  }
  
  adInProgress = true;
  showNotification('📺 Loading ad...');
  
  // Calculate reward for non-spin tasks
  let reward;
  if (task.reward === 'spin') {
    reward = 0; // Spin wheel will determine reward
  } else if (task.reward === 'random') {
    const rewards = [100, 250, 500, 1000, 2500, 5000];
    reward = rewards[Math.floor(Math.random() * rewards.length)];
  } else {
    reward = task.reward;
  }
  
  // Store pending reward
  pendingAdReward = {
    taskId: task.id,
    reward: reward,
    btn: btn || null
  };
  
  console.log('🎯 Pending reward set:', pendingAdReward);
  
  // Try to show Monetag Rewarded Interstitial
  showMonetagAd(task, reward, btn);
}

// Show Monetag Rewarded Interstitial Ad
function showMonetagAd(task, reward, btn) {
  console.log('🎬 Attempting to show ad...');
  console.log('📍 show_10246329 available:', typeof window.show_10246329);
  
  // Check if Monetag SDK function is available
  if (typeof window.show_10246329 === 'function') {
    console.log('✅ Monetag SDK found, showing rewarded popup...');
    
    try {
      // Use rewarded popup format
      window.show_10246329('pop')
        .then(() => {
          // User successfully watched the ad
          console.log('✅ Ad watched successfully!');
          adInProgress = false;
          completeAdReward(task.id, reward, btn);
        })
        .catch((error) => {
          // Ad was closed early or failed
          console.log('❌ Ad error:', error);
          adInProgress = false;
          resetAdButton(btn);
          pendingAdReward = null;
          
          if (error === 'closed' || String(error).includes('closed')) {
            showNotification('❌ Please watch the full ad to get your reward!');
          } else {
            showNotification('❌ Ad failed to load. Please try again later.');
          }
        });
    } catch (e) {
      console.error('❌ Ad exception:', e);
      adInProgress = false;
      showFallbackAd(task, reward, btn);
    }
  } else {
    // Monetag SDK not loaded
    console.log('⚠️ Monetag SDK not loaded');
    adInProgress = false;
    resetAdButton(btn);
    pendingAdReward = null;
    showNotification('❌ Ads not available. Please try again later.');
  }
}

// Reset ad button to original state
function resetAdButton(btn) {
  adInProgress = false;
  if (!btn) {
    console.log('No button to reset');
    return;
  }
  btn.textContent = '▶️ Watch';
  btn.classList.remove('loading');
  btn.disabled = false;
}

// Fallback ad when Monetag isn't available (for testing/development)
function showFallbackAd(task, reward, btn) {
  showNotification('📺 Loading advertisement...');
  
  const overlay = document.createElement('div');
  overlay.className = 'ad-overlay';
  overlay.innerHTML = `
    <div class="ad-modal">
      <div class="ad-header">
        <span class="ad-badge">AD</span>
        <span class="ad-title">Sponsored Content</span>
      </div>
      <div class="ad-content">
        <div class="ad-placeholder">
          <div class="ad-icon">📺</div>
          <p>Advertisement Loading...</p>
        </div>
      </div>
      <div class="ad-footer">
        <div class="ad-progress-container">
          <div class="ad-progress-bar" id="adProgressBar"></div>
        </div>
        <div class="ad-timer">
          Watch for <span id="adCountdown">5</span>s to earn reward
        </div>
        <button class="ad-close-btn" id="adCloseBtn" disabled>
          ⏳ Please wait...
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  const progressBar = document.getElementById('adProgressBar');
  const countdown = document.getElementById('adCountdown');
  const closeBtn = document.getElementById('adCloseBtn');
  
  let timeLeft = 5;
  let progress = 0;
  
  const timer = setInterval(() => {
    progress += 20;
    timeLeft--;
    
    if (progressBar) progressBar.style.width = progress + '%';
    if (countdown) countdown.textContent = timeLeft;
    
    if (timeLeft <= 0) {
      clearInterval(timer);
      if (closeBtn) {
        closeBtn.disabled = false;
        closeBtn.textContent = '✓ Claim Reward';
        closeBtn.classList.add('ready');
      }
    }
  }, 1000);
  
  // Claim reward button
  if (closeBtn) {
    closeBtn.onclick = () => {
      if (timeLeft <= 0) {
        overlay.remove();
        adInProgress = false;
        completeAdReward(task.id, reward, btn);
      }
    };
  }
  
  // Close on overlay click (only after timer)
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      if (timeLeft <= 0) {
        overlay.remove();
        adInProgress = false;
        completeAdReward(task.id, reward, btn);
      } else {
        // User tried to close early
        overlay.remove();
        adInProgress = false;
        resetAdButton(btn);
        pendingAdReward = null;
        showNotification('❌ Watch the full ad to get your reward!');
        clearInterval(timer);
      }
    }
  };
}

function completeAdReward(taskId, reward, btn) {
  if (!pendingAdReward || pendingAdReward.taskId !== taskId) return;
  
  // Clear pending reward
  pendingAdReward = null;
  
  // Check if this is a lucky spin
  if (taskId === 'ad3') {
    // Show spin wheel instead of giving reward directly
    btn.textContent = '🎰 Spin!';
    btn.classList.remove('loading');
    showSpinWheel(btn);
    return;
  }
  
  // Add reward for regular ads
  userData.coins += reward;
  adsWatchedToday++;
  
  // Save to localStorage
  const today = new Date().toDateString();
  localStorage.setItem('adsData', JSON.stringify({ date: today, count: adsWatchedToday }));
  
  updateBalanceDisplay();
  document.getElementById('adsWatched').textContent = adsWatchedToday;
  
  btn.textContent = '✓ Done';
  btn.classList.remove('loading');
  
  showNotification(`📺 Ad watched! +${formatNumber(reward)} coins!`);
  
  // Reset button after 3 seconds
  setTimeout(() => {
    if (adsWatchedToday < MAX_ADS_PER_DAY) {
      btn.textContent = '▶️ Watch';
      btn.disabled = false;
    } else {
      btn.textContent = 'Limit';
      btn.disabled = true;
    }
  }, 3000);
  
  // Sync with server
  fetch(`${API_URL}/game/tap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      telegramId: userData.telegramId,
      taps: 0,
      currentCoins: userData.coins
    })
  }).catch(err => console.error('Sync error:', err));
}

// ==================== PREMIUM LUCKY SPIN WHEEL ====================
function showSpinWheel(btn) {
  const spinsLeft = MAX_DAILY_SPINS - dailySpinsUsed;
  
  // Create beautiful spin wheel overlay
  const overlay = document.createElement('div');
  overlay.className = 'spin-overlay';
  overlay.innerHTML = `
    <div class="spin-modal">
      <button class="spin-close-x" id="spinCloseBtn">✕</button>
      
      <div class="spin-header">
        <div class="spin-title-icon">🎰</div>
        <h2 class="spin-title">Lucky Wheel</h2>
        <div class="spin-subtitle">Spin to win amazing rewards!</div>
        <div class="spin-spins-left">
          <span class="spins-icon">🎫</span>
          <span class="spins-text">${spinsLeft} spin${spinsLeft !== 1 ? 's' : ''} remaining</span>
        </div>
      </div>
      
      <div class="wheel-wrapper">
        <div class="wheel-glow"></div>
        <div class="wheel-outer-ring"></div>
        <div class="wheel-container">
          <div class="wheel-pointer-container">
            <div class="wheel-pointer"></div>
          </div>
          <div class="wheel" id="spinWheel">
            <canvas id="wheelCanvas" width="300" height="300"></canvas>
          </div>
          <div class="wheel-center">
            <div class="wheel-center-inner">
              <span>SPIN</span>
            </div>
          </div>
        </div>
        <div class="wheel-lights">
          ${Array(12).fill().map((_, i) => `<div class="wheel-light" style="--i: ${i}"></div>`).join('')}
        </div>
      </div>
      
      <div class="spin-prizes">
        ${SPIN_REWARDS.slice(0, 4).map(r => `
          <div class="prize-chip" style="--chip-color: ${r.color}">
            <span>🍌</span>${r.label}
          </div>
        `).join('')}
      </div>
      
      <button class="spin-btn-main" id="spinBtn">
        <span class="spin-btn-icon">🎲</span>
        <span class="spin-btn-text">SPIN NOW!</span>
      </button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Draw the wheel
  drawWheel();
  
  // Start light animation
  startLightAnimation();
  
  // Spin button handler
  document.getElementById('spinBtn').onclick = () => startSpin(overlay, btn);
  
  // Close button
  document.getElementById('spinCloseBtn').onclick = () => {
    overlay.remove();
    btn.textContent = '▶️ Watch';
    btn.disabled = false;
  };
}

function drawWheel() {
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 140;
  const segmentCount = SPIN_REWARDS.length;
  const segmentAngle = (2 * Math.PI) / segmentCount;
  
  // Draw segments
  SPIN_REWARDS.forEach((reward, i) => {
    const startAngle = i * segmentAngle - Math.PI / 2;
    const endAngle = startAngle + segmentAngle;
    
    // Draw segment
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    
    // Gradient fill
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, lightenColor(reward.color, 30));
    gradient.addColorStop(1, reward.color);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Segment border
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw text
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(startAngle + segmentAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Orbitron, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 3;
    ctx.fillText(`🍌${reward.label}`, radius - 15, 5);
    ctx.restore();
  });
  
  // Inner circle decoration
  ctx.beginPath();
  ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();
}

function lightenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

let lightInterval;
function startLightAnimation() {
  let activeLight = 0;
  const lights = document.querySelectorAll('.wheel-light');
  
  lightInterval = setInterval(() => {
    lights.forEach((light, i) => {
      light.classList.toggle('active', i === activeLight);
    });
    activeLight = (activeLight + 1) % lights.length;
  }, 100);
}

function stopLightAnimation() {
  if (lightInterval) {
    clearInterval(lightInterval);
    document.querySelectorAll('.wheel-light').forEach(l => l.classList.add('active'));
  }
}

function startSpin(overlay, adBtn) {
  const spinBtn = document.getElementById('spinBtn');
  const wheel = document.getElementById('spinWheel');
  
  // Disable button
  spinBtn.disabled = true;
  spinBtn.innerHTML = '<span class="spin-btn-icon">⏳</span><span class="spin-btn-text">Spinning...</span>';
  
  // Speed up lights during spin
  stopLightAnimation();
  let fastLight = 0;
  const lights = document.querySelectorAll('.wheel-light');
  const fastLightInterval = setInterval(() => {
    lights.forEach((light, i) => light.classList.toggle('active', i === fastLight || i === (fastLight + 6) % 12));
    fastLight = (fastLight + 1) % 12;
  }, 50);
  
  // Calculate winning segment
  const totalProbability = SPIN_REWARDS.reduce((sum, r) => sum + r.probability, 0);
  let random = Math.random() * totalProbability;
  let winningIndex = 0;
  
  for (let i = 0; i < SPIN_REWARDS.length; i++) {
    random -= SPIN_REWARDS[i].probability;
    if (random <= 0) {
      winningIndex = i;
      break;
    }
  }
  
  const winningReward = SPIN_REWARDS[winningIndex];
  
  // Calculate rotation
  const segmentAngle = 360 / SPIN_REWARDS.length;
  const targetAngle = 360 - (winningIndex * segmentAngle) - (segmentAngle / 2);
  const totalRotation = 360 * 6 + targetAngle; // 6 full spins
  
  // Apply spin
  wheel.style.transition = 'transform 5s cubic-bezier(0.2, 0.8, 0.3, 1)';
  wheel.style.transform = `rotate(${totalRotation}deg)`;
  
  // Play tick sound effect (visual feedback)
  let tickCount = 0;
  const tickInterval = setInterval(() => {
    tickCount++;
    if (tickCount > 30) clearInterval(tickInterval);
  }, 100);
  
  // After spin completes
  setTimeout(() => {
    clearInterval(fastLightInterval);
    clearInterval(tickInterval);
    
    // All lights on
    lights.forEach(l => l.classList.add('active'));
    
    // Update counters
    dailySpinsUsed++;
    adsWatchedToday++;
    
    const today = new Date().toDateString();
    localStorage.setItem('spinData', JSON.stringify({ date: today, spins: dailySpinsUsed }));
    localStorage.setItem('adsData', JSON.stringify({ date: today, count: adsWatchedToday }));
    
    // Add reward
    userData.coins += winningReward.value;
    updateBalanceDisplay();
    
    // Show result after short delay
    setTimeout(() => {
      showSpinResult(overlay, winningReward, adBtn);
    }, 500);
    
    // Sync with server
    fetch(`${API_URL}/game/tap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: userData.telegramId,
        taps: 0,
        currentCoins: userData.coins
      })
    }).catch(err => console.error('Sync error:', err));
    
  }, 5000);
}

function showSpinResult(overlay, reward, adBtn) {
  const modal = overlay.querySelector('.spin-modal');
  
  // Create confetti
  const confettiColors = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
  let confettiHTML = '';
  for (let i = 0; i < 50; i++) {
    const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const size = 5 + Math.random() * 10;
    confettiHTML += `<div class="confetti-piece" style="
      left: ${left}%;
      background: ${color};
      width: ${size}px;
      height: ${size}px;
      animation-delay: ${delay}s;
    "></div>`;
  }
  
  modal.innerHTML = `
    <div class="spin-result-container">
      <div class="confetti-container">${confettiHTML}</div>
      
      <div class="result-glow" style="--glow-color: ${reward.color}"></div>
      
      <div class="result-content">
        <div class="result-stars">✨ 🌟 ✨</div>
        <div class="result-title">CONGRATULATIONS!</div>
        <div class="result-subtitle">You Won</div>
        
        <div class="result-prize" style="--prize-color: ${reward.color}">
          <div class="prize-icon">🍌</div>
          <div class="prize-amount">${formatNumber(reward.value)}</div>
        </div>
        
        <div class="result-message">Coins added to your balance!</div>
        
        <button class="result-claim-btn" id="spinClaimBtn">
          <span>🎉</span> Claim Reward
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('spinClaimBtn').onclick = () => {
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.remove();
      renderPremiumTasks(); // Refresh the premium tasks list
    }, 300);
  };
}

// Initialize tasks when switching to tasks screen
function initTasksScreen() {
  switchTaskTab('special');
}

// Tab switching for leaderboard
document.querySelectorAll('.leaderboard-tabs .tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.leaderboard-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const type = btn.dataset.lb;
    loadLeaderboard(type);
  });
});

// Update Avatar
function updateAvatar() {
  const photoUrl = userData.photoUrl || telegramUser?.photo_url;
  
  // Main avatar in top bar
  const avatarContainer = document.getElementById('avatarEmoji');
  if (photoUrl && avatarContainer) {
    avatarContainer.innerHTML = `<img src="${photoUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
  }
  
  // Profile avatar
  const profilePhoto = document.getElementById('profilePhoto');
  const profileEmoji = document.getElementById('profileEmoji');
  if (photoUrl && profilePhoto) {
    profilePhoto.src = photoUrl;
    profilePhoto.style.display = 'block';
    if (profileEmoji) profileEmoji.style.display = 'none';
  }
}

// Update Profile UI
function updateProfileUI() {
  if (!userData) return;
  
  // Profile info
  const profileNameEl = document.getElementById('profileName');
  if (profileNameEl) profileNameEl.textContent = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.username;
  
  const profileUsernameEl = document.getElementById('profileUsername');
  if (profileUsernameEl) profileUsernameEl.textContent = userData.username || 'anonymous';
  
  const profileIdEl = document.getElementById('profileId');
  if (profileIdEl) profileIdEl.textContent = userData.telegramId;
  
  const profileLevelEl = document.getElementById('profileLevel');
  if (profileLevelEl) profileLevelEl.textContent = userData.level || 1;
  
  // Profile stats
  const profileCoinsEl = document.getElementById('profileCoins');
  if (profileCoinsEl) profileCoinsEl.textContent = formatNumber(userData.coins);
  
  const profileTapsEl = document.getElementById('profileTaps');
  if (profileTapsEl) profileTapsEl.textContent = formatNumber(userData.totalTaps || 0);
  
  const profilePowerEl = document.getElementById('profilePower');
  if (profilePowerEl) profilePowerEl.textContent = formatNumber(userData.tapPower || 1);
  
  const profileReferralsEl = document.getElementById('profileReferrals');
  if (profileReferralsEl) profileReferralsEl.textContent = userData.referrals?.length || 0;
  
  // Account info
  if (userData.createdAt) {
    const joinDate = new Date(userData.createdAt);
    const profileJoinedEl = document.getElementById('profileJoined');
    if (profileJoinedEl) profileJoinedEl.textContent = joinDate.toLocaleDateString();
  }
  
  const profileStreakEl = document.getElementById('profileStreak');
  if (profileStreakEl) profileStreakEl.textContent = `${userData.dailyStreak || 0} days`;
  
  const profileEnergyEl = document.getElementById('profileEnergy');
  if (profileEnergyEl) profileEnergyEl.textContent = userData.maxEnergy || 1000;
  
  // Wallet balance in profile
  const profileWalletBalanceEl = document.getElementById('profileWalletBalance');
  if (profileWalletBalanceEl) profileWalletBalanceEl.textContent = formatNumber(userData.coins);
  
  // Update achievements
  updateAchievements();
}

// Update Achievements
function updateAchievements() {
  const achievements = document.querySelectorAll('.achievement-badge');
  
  // First Tap
  if (userData.totalTaps > 0) {
    achievements[0]?.classList.add('unlocked');
  }
  
  // 10K Coins
  if (userData.coins >= 10000) {
    achievements[1]?.classList.add('unlocked');
  }
  
  // 7 Day Streak
  if (userData.dailyStreak >= 7) {
    achievements[2]?.classList.add('unlocked');
  }
  
  // Level 10
  if (userData.level >= 10) {
    achievements[3]?.classList.add('unlocked');
  }
  
  // 5 Miners
  const minerCount = Object.values(userData.miners || {}).filter(v => v > 0).length;
  if (minerCount >= 5) {
    achievements[4]?.classList.add('unlocked');
  }
  
  // All Tasks
  if (userData.completedTasks?.length >= 10) {
    achievements[5]?.classList.add('unlocked');
  }
}

// Click on avatar to go to profile
document.querySelector('.user-profile')?.addEventListener('click', () => {
  switchScreen('profile');
});

// ==================== BOOSTER SYSTEM ====================
const BOOSTERS = [
  {
    id: 'multitap',
    name: 'Multitap',
    icon: '👆',
    description: 'Increase coins per tap',
    effect: '+1 coin per tap',
    basePrice: 1000,
    priceMultiplier: 2,
    maxLevel: 20,
    type: 'permanent'
  },
  {
    id: 'energy_limit',
    name: 'Energy Limit',
    icon: '🔋',
    description: 'Increase maximum energy',
    effect: '+500 max energy',
    basePrice: 1000,
    priceMultiplier: 2,
    maxLevel: 20,
    type: 'permanent'
  },
  {
    id: 'recharge_speed',
    name: 'Recharging Speed',
    icon: '⚡',
    description: 'Faster energy recovery',
    effect: '+1 energy per second',
    basePrice: 2000,
    priceMultiplier: 2.5,
    maxLevel: 10,
    type: 'permanent'
  },
  {
    id: 'tap_bot',
    name: 'Tap Bot',
    icon: '🤖',
    description: 'Auto-tap while offline',
    effect: 'Earns coins while away',
    basePrice: 50000,
    priceMultiplier: 3,
    maxLevel: 5,
    type: 'permanent'
  }
];

// Daily booster state
let dailyBoosterData = {
  date: '',
  turboUsed: 0,
  fullEnergyUsed: 0
};
const MAX_DAILY_TURBO = 3;
const MAX_DAILY_FULL_ENERGY = 3;
let turboModeActive = false;
let turboEndTime = 0;

// Load daily booster data
function loadDailyBoosterData() {
  const today = new Date().toDateString();
  const saved = JSON.parse(localStorage.getItem('dailyBoosterData') || '{}');
  
  if (saved.date !== today) {
    dailyBoosterData = {
      date: today,
      turboUsed: 0,
      fullEnergyUsed: 0
    };
    localStorage.setItem('dailyBoosterData', JSON.stringify(dailyBoosterData));
  } else {
    dailyBoosterData = saved;
  }
}

// Save daily booster data
function saveDailyBoosterData() {
  localStorage.setItem('dailyBoosterData', JSON.stringify(dailyBoosterData));
}

// Render boost screen
function renderBoostScreen() {
  loadDailyBoosterData();
  renderActiveBoosters();
  renderDailyBoosters();
  renderPurchasableBoosters();
  updateBoostBadge();
}

// Render active paid boosters
function renderActiveBoosters() {
  const section = document.getElementById('activeBoostersSection');
  const list = document.getElementById('activeBoostersList');
  if (!section || !list) return;
  
  // Get active boosters from userData
  const activeBoosters = userData.activeBoosters || [];
  const now = new Date();
  
  // Filter out expired boosters
  const validBoosters = activeBoosters.filter(b => new Date(b.expiresAt) > now);
  
  if (validBoosters.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  list.innerHTML = '';
  
  validBoosters.forEach(booster => {
    const expiresAt = new Date(booster.expiresAt);
    const remainingMs = expiresAt - now;
    const remainingMins = Math.ceil(remainingMs / 60000);
    
    const card = document.createElement('div');
    card.className = 'active-booster-card';
    card.innerHTML = `
      <div class="active-booster-icon">${getBoosterIcon(booster.multiplier)}</div>
      <div class="active-booster-info">
        <span class="active-booster-name">${booster.name || booster.multiplier + 'x Mining'}</span>
        <span class="active-booster-time">⏱️ ${remainingMins} min left</span>
      </div>
      <div class="active-booster-multiplier">${booster.multiplier}x</div>
    `;
    list.appendChild(card);
  });
}

// Get booster icon based on multiplier
function getBoosterIcon(multiplier) {
  if (multiplier >= 5) return '💥';
  if (multiplier >= 3) return '🔥';
  return '🚀';
}

// Get active booster multiplier (highest active)
function getActiveBoosterMultiplier() {
  const activeBoosters = userData.activeBoosters || [];
  const now = new Date();
  
  let maxMultiplier = 1;
  
  activeBoosters.forEach(booster => {
    if (new Date(booster.expiresAt) > now) {
      if (booster.multiplier > maxMultiplier) {
        maxMultiplier = booster.multiplier;
      }
    }
  });
  
  return maxMultiplier;
}

// Clean up expired boosters periodically
function cleanupExpiredBoosters() {
  if (!userData.activeBoosters) return;
  
  const now = new Date();
  const validBoosters = userData.activeBoosters.filter(b => new Date(b.expiresAt) > now);
  
  if (validBoosters.length !== userData.activeBoosters.length) {
    userData.activeBoosters = validBoosters;
    // Notify user if a booster expired
    if (validBoosters.length < userData.activeBoosters.length) {
      showNotification('⏱️ A booster has expired');
    }
  }
}

// Run cleanup every minute
setInterval(cleanupExpiredBoosters, 60000);

// Sync user data to server periodically (every 30 seconds)
async function syncUserData() {
  if (!userData || !userData.telegramId) return;
  
  try {
    await fetch(`${API_URL}/game/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: userData.telegramId,
        coins: userData.coins,
        energy: userData.energy,
        totalTaps: userData.totalTaps,
        level: userData.level,
        tapPower: userData.tapPower,
        maxEnergy: userData.maxEnergy,
        activeBoosters: userData.activeBoosters
      })
    });
  } catch (err) {
    console.error('Sync error:', err);
  }
}

// Sync every 30 seconds
setInterval(syncUserData, 30000);

// Also sync when page is about to close
window.addEventListener('beforeunload', () => {
  if (userData && userData.telegramId) {
    navigator.sendBeacon(`${API_URL}/game/sync`, JSON.stringify({
      telegramId: userData.telegramId,
      coins: userData.coins,
      energy: userData.energy,
      totalTaps: userData.totalTaps
    }));
  }
});

// Update paid booster indicator
function updatePaidBoosterIndicator() {
  const indicator = document.getElementById('paidBoosterIndicator');
  const textEl = document.getElementById('boosterIndicatorText');
  const iconEl = indicator?.querySelector('.booster-indicator-icon');
  
  if (!indicator) return;
  
  const multiplier = getActiveBoosterMultiplier();
  
  if (multiplier > 1) {
    indicator.classList.add('show');
    if (textEl) textEl.textContent = `${multiplier}x Active`;
    if (iconEl) iconEl.textContent = getBoosterIcon(multiplier);
  } else {
    indicator.classList.remove('show');
  }
}

// Update indicator periodically
setInterval(updatePaidBoosterIndicator, 5000);

// Render daily free boosters
function renderDailyBoosters() {
  const turboCard = document.getElementById('turboBooster');
  const fullEnergyCard = document.getElementById('fullEnergyBooster');
  
  const turboLeft = MAX_DAILY_TURBO - dailyBoosterData.turboUsed;
  const fullEnergyLeft = MAX_DAILY_FULL_ENERGY - dailyBoosterData.fullEnergyUsed;
  
  // Update turbo
  document.getElementById('turboUsesLeft').textContent = turboLeft;
  turboCard.className = `daily-booster-card ${turboLeft > 0 ? 'available' : 'used'}`;
  turboCard.onclick = turboLeft > 0 ? () => showBoosterModal('turbo') : null;
  
  // Update full energy
  document.getElementById('fullEnergyUsesLeft').textContent = fullEnergyLeft;
  fullEnergyCard.className = `daily-booster-card ${fullEnergyLeft > 0 ? 'available' : 'used'}`;
  fullEnergyCard.onclick = fullEnergyLeft > 0 ? () => showBoosterModal('fullEnergy') : null;
}

// Render purchasable boosters
function renderPurchasableBoosters() {
  const container = document.getElementById('boostersList');
  if (!container) return;
  
  container.innerHTML = '';
  const userBoosters = userData.boosters || {};
  
  BOOSTERS.forEach(booster => {
    const level = userBoosters[booster.id] || 0;
    const isMaxed = level >= booster.maxLevel;
    const price = isMaxed ? 0 : Math.floor(booster.basePrice * Math.pow(booster.priceMultiplier, level));
    const canAfford = userData.coins >= price;
    
    const card = document.createElement('div');
    card.className = `booster-card ${!canAfford && !isMaxed ? 'locked' : ''}`;
    card.innerHTML = `
      <div class="booster-icon-wrap">${booster.icon}</div>
      <div class="booster-info">
        <div class="booster-name">${booster.name}</div>
        <div class="booster-price-row">
          ${isMaxed 
            ? '<span class="booster-price" style="color: var(--success);">MAX</span>'
            : `<span class="booster-price">${formatNumber(price)}</span>`
          }
          <span class="booster-level">${level} lvl</span>
        </div>
      </div>
      <div class="booster-action">
        <span class="arrow">›</span>
      </div>
    `;
    
    if (!isMaxed) {
      card.onclick = () => showBoosterModal(booster.id, booster, level, price);
    }
    
    container.appendChild(card);
  });
  
  // Update balance display
  const boostBalanceEl = document.getElementById('boostBalance');
  if (boostBalanceEl) boostBalanceEl.textContent = formatNumber(userData.coins);
}

// Show booster modal
function showBoosterModal(type, booster = null, level = 0, price = 0) {
  // Remove existing modal
  const existingModal = document.querySelector('.booster-modal');
  if (existingModal) existingModal.remove();
  
  let modalContent = '';
  
  if (type === 'turbo') {
    modalContent = `
      <div class="booster-modal-header">
        <div class="booster-modal-icon">🚀</div>
        <h2 class="booster-modal-title">Turbo Tap</h2>
        <p class="booster-modal-desc">5x tap power for 20 seconds! Tap as fast as you can!</p>
      </div>
      <div class="booster-modal-stats">
        <div class="booster-stat-row">
          <span class="booster-stat-label">Duration</span>
          <span class="booster-stat-value">20 seconds</span>
        </div>
        <div class="booster-stat-row">
          <span class="booster-stat-label">Multiplier</span>
          <span class="booster-stat-value">5x</span>
        </div>
        <div class="booster-stat-row">
          <span class="booster-stat-label">Uses left today</span>
          <span class="booster-stat-value">${MAX_DAILY_TURBO - dailyBoosterData.turboUsed}/${MAX_DAILY_TURBO}</span>
        </div>
      </div>
      <div class="booster-modal-actions">
        <button class="booster-buy-btn free" onclick="activateTurbo()">
          ⚡ Activate FREE
        </button>
        <button class="booster-cancel-btn" onclick="closeBoosterModal()">Cancel</button>
      </div>
    `;
  } else if (type === 'fullEnergy') {
    modalContent = `
      <div class="booster-modal-header">
        <div class="booster-modal-icon">⚡</div>
        <h2 class="booster-modal-title">Full Tank</h2>
        <p class="booster-modal-desc">Instantly refill your energy to maximum!</p>
      </div>
      <div class="booster-modal-stats">
        <div class="booster-stat-row">
          <span class="booster-stat-label">Current Energy</span>
          <span class="booster-stat-value">${userData.energy}/${userData.maxEnergy}</span>
        </div>
        <div class="booster-stat-row">
          <span class="booster-stat-label">After refill</span>
          <span class="booster-stat-value">${userData.maxEnergy}/${userData.maxEnergy}</span>
        </div>
        <div class="booster-stat-row">
          <span class="booster-stat-label">Uses left today</span>
          <span class="booster-stat-value">${MAX_DAILY_FULL_ENERGY - dailyBoosterData.fullEnergyUsed}/${MAX_DAILY_FULL_ENERGY}</span>
        </div>
      </div>
      <div class="booster-modal-actions">
        <button class="booster-buy-btn free" onclick="activateFullEnergy()">
          ⚡ Refill FREE
        </button>
        <button class="booster-cancel-btn" onclick="closeBoosterModal()">Cancel</button>
      </div>
    `;
  } else if (booster) {
    const nextEffect = getBoosterEffect(booster, level + 1);
    const canAfford = userData.coins >= price;
    const isMaxed = level >= booster.maxLevel;
    
    modalContent = `
      <div class="booster-modal-header">
        <div class="booster-modal-icon">${booster.icon}</div>
        <h2 class="booster-modal-title">${booster.name}</h2>
        <p class="booster-modal-desc">${booster.description}</p>
      </div>
      <div class="booster-modal-stats">
        <div class="booster-stat-row">
          <span class="booster-stat-label">Current Level</span>
          <span class="booster-stat-value">${level}/${booster.maxLevel}</span>
        </div>
        <div class="booster-stat-row">
          <span class="booster-stat-label">Current Effect</span>
          <span class="booster-stat-value">${getBoosterEffect(booster, level)}</span>
        </div>
        ${!isMaxed ? `
        <div class="booster-stat-row">
          <span class="booster-stat-label">Next Level</span>
          <span class="booster-stat-value" style="color: var(--success);">${nextEffect}</span>
        </div>
        ` : ''}
      </div>
      <div class="booster-modal-actions">
        ${isMaxed 
          ? '<button class="booster-buy-btn" disabled>Maximum Level</button>'
          : `<button class="booster-buy-btn" ${!canAfford ? 'disabled' : ''} onclick="purchaseBooster('${booster.id}', ${price})">
              🍌 ${formatNumber(price)} - Upgrade
            </button>`
        }
        <button class="booster-cancel-btn" onclick="closeBoosterModal()">Cancel</button>
      </div>
    `;
  }
  
  const modal = document.createElement('div');
  modal.className = 'booster-modal active';
  modal.innerHTML = `<div class="booster-modal-content">${modalContent}</div>`;
  modal.onclick = (e) => {
    if (e.target === modal) closeBoosterModal();
  };
  
  document.body.appendChild(modal);
}

// Close booster modal
function closeBoosterModal() {
  const modal = document.querySelector('.booster-modal');
  if (modal) modal.remove();
}

// Get booster effect text
function getBoosterEffect(booster, level) {
  if (level === 0) return 'None';
  
  switch (booster.id) {
    case 'multitap':
      return `+${level} per tap`;
    case 'energy_limit':
      return `+${level * 500} max energy`;
    case 'recharge_speed':
      return `+${level} energy/sec`;
    case 'tap_bot':
      return `${level * 100} coins/hour offline`;
    default:
      return booster.effect;
  }
}

// Store original tap power for turbo mode
let originalTapPowerBeforeTurbo = 0;
let turboTimeout = null;

// Activate turbo mode
function activateTurbo() {
  // Check if turbo is already active
  if (turboModeActive) {
    showNotification('🚀 Turbo mode is already active!');
    closeBoosterModal();
    return;
  }
  
  // Check daily limit
  if (dailyBoosterData.turboUsed >= MAX_DAILY_TURBO) {
    showNotification('❌ No turbo uses left today!');
    closeBoosterModal();
    return;
  }
  
  closeBoosterModal();
  
  // Activate turbo mode (don't modify tapPower, use turboModeActive flag)
  turboModeActive = true;
  turboEndTime = Date.now() + 20000;
  
  // Update daily uses
  dailyBoosterData.turboUsed++;
  saveDailyBoosterData();
  
  // Show turbo indicator
  showTurboIndicator();
  
  // Update UI
  updateAllUI();
  renderDailyBoosters();
  updateBoostBadge();
  
  // Switch to game screen for tapping
  switchScreen('game');
  
  showNotification('🚀 TURBO MODE ACTIVATED! 5x tap power for 20 seconds!');
  
  // Clear any existing timeout
  if (turboTimeout) clearTimeout(turboTimeout);
  
  // End turbo after 20 seconds
  turboTimeout = setTimeout(() => {
    endTurboMode();
  }, 20000);
}

// End turbo mode
function endTurboMode() {
  if (!turboModeActive) return;
  
  turboModeActive = false;
  hideTurboIndicator();
  updateAllUI();
  showNotification('⏱️ Turbo mode ended!');
  
  if (turboTimeout) {
    clearTimeout(turboTimeout);
    turboTimeout = null;
  }
}

// Show turbo indicator
function showTurboIndicator() {
  let indicator = document.querySelector('.turbo-active-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'turbo-active-indicator';
    document.body.appendChild(indicator);
  }
  
  indicator.classList.add('show');
  
  // Update timer
  const updateTimer = () => {
    if (!turboModeActive) return;
    const remaining = Math.max(0, Math.ceil((turboEndTime - Date.now()) / 1000));
    indicator.innerHTML = `🚀 TURBO <span class="turbo-timer">${remaining}s</span>`;
    if (remaining > 0) {
      requestAnimationFrame(updateTimer);
    }
  };
  updateTimer();
}

// Hide turbo indicator
function hideTurboIndicator() {
  const indicator = document.querySelector('.turbo-active-indicator');
  if (indicator) indicator.classList.remove('show');
}

// Activate full energy
function activateFullEnergy() {
  // Check daily limit
  if (dailyBoosterData.fullEnergyUsed >= MAX_DAILY_FULL_ENERGY) {
    showNotification('❌ No energy refills left today!');
    closeBoosterModal();
    return;
  }
  
  // Check if energy is already full
  if (userData.energy >= userData.maxEnergy) {
    showNotification('⚡ Your energy is already full!');
    closeBoosterModal();
    return;
  }
  
  closeBoosterModal();
  
  // Store old energy for animation
  const oldEnergy = userData.energy;
  
  // Refill energy
  userData.energy = userData.maxEnergy;
  
  // Update daily uses
  dailyBoosterData.fullEnergyUsed++;
  saveDailyBoosterData();
  
  // Animate energy bar with smooth fill
  const energyFill = document.getElementById('energyFill');
  const energyContainer = document.querySelector('.energy-container');
  
  if (energyFill) {
    energyFill.style.transition = 'width 0.5s ease-out';
    energyFill.style.width = '100%';
  }
  
  if (energyContainer) {
    energyContainer.classList.add('refilling');
    setTimeout(() => {
      energyContainer.classList.remove('refilling');
      if (energyFill) energyFill.style.transition = '';
    }, 500);
  }
  
  // Update UI
  updateAllUI();
  renderDailyBoosters();
  updateBoostBadge();
  
  const energyGained = userData.maxEnergy - oldEnergy;
  showNotification(`⚡ +${energyGained} Energy restored!`);
  
  // Create energy particles effect
  createEnergyParticles();
  
  // Sync with server
  fetch(`${API_URL}/game/tap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      telegramId: userData.telegramId,
      taps: 0,
      currentEnergy: userData.energy,
      currentCoins: userData.coins
    })
  }).catch(err => console.error('Sync error:', err));
}

// Energy particles effect
function createEnergyParticles() {
  const energyBar = document.querySelector('.energy-container');
  if (!energyBar) return;
  
  const rect = energyBar.getBoundingClientRect();
  
  for (let i = 0; i < 10; i++) {
    const particle = document.createElement('div');
    particle.textContent = '⚡';
    particle.style.cssText = `
      position: fixed;
      left: ${rect.left + Math.random() * rect.width}px;
      top: ${rect.top}px;
      font-size: 16px;
      pointer-events: none;
      z-index: 9999;
      animation: energyParticle 1s ease-out forwards;
      --ty: ${-30 - Math.random() * 50}px;
    `;
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
  }
}

// Purchase booster
async function purchaseBooster(boosterId, price) {
  const booster = BOOSTERS.find(b => b.id === boosterId);
  if (!booster) return;
  
  if (userData.coins < price) {
    showNotification('❌ Not enough coins!');
    return;
  }
  
  closeBoosterModal();
  
  // Deduct coins and upgrade
  userData.coins -= price;
  if (!userData.boosters) userData.boosters = {};
  const newLevel = (userData.boosters[boosterId] || 0) + 1;
  userData.boosters[boosterId] = newLevel;
  
  // Apply booster effect
  applyBoosterEffect(boosterId, newLevel);
  
  // Update UI
  updateAllUI();
  renderPurchasableBoosters();
  
  showNotification(`✅ ${booster.name} upgraded to level ${newLevel}!`);
  
  // Sync with server
  try {
    await fetch(`${API_URL}/game/upgrade-booster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: userData.telegramId,
        boosterId: boosterId,
        price: price,
        newLevel: newLevel,
        currentCoins: userData.coins
      })
    });
  } catch (err) {
    console.error('Booster upgrade error:', err);
  }
}

// Apply booster effect
function applyBoosterEffect(boosterId, level) {
  switch (boosterId) {
    case 'multitap':
      // Base tap power from level + multitap booster level
      const baseTapPower = 1 + Math.floor(((userData.level || 1) - 1) * LEVEL_CONFIG.tapPowerPerLevel);
      userData.tapPower = baseTapPower + level;
      break;
    case 'energy_limit':
      const baseMaxEnergy = 1000 + Math.floor((userData.level || 1) / 5) * LEVEL_CONFIG.energyPerLevel;
      userData.maxEnergy = baseMaxEnergy + (level * 500);
      break;
    case 'recharge_speed':
      // This affects energy regen rate - handled in startEnergyRestore
      break;
    case 'tap_bot':
      // This affects offline earnings - handled on server
      break;
  }
}

// Recalculate all booster effects on load
function recalculateBoosterEffects() {
  if (!userData.boosters) return;
  
  // Calculate base tap power from level
  const baseTapPower = 1 + Math.floor(((userData.level || 1) - 1) * LEVEL_CONFIG.tapPowerPerLevel);
  const multitapLevel = userData.boosters.multitap || 0;
  userData.tapPower = baseTapPower + multitapLevel;
  
  // Calculate max energy from level + energy limit booster
  const baseMaxEnergy = 1000 + Math.floor((userData.level || 1) / 5) * LEVEL_CONFIG.energyPerLevel;
  const energyLimitLevel = userData.boosters.energy_limit || 0;
  userData.maxEnergy = baseMaxEnergy + (energyLimitLevel * 500);
  
  console.log('Recalculated - Base TapPower:', baseTapPower, 'Multitap Level:', multitapLevel, 'Final TapPower:', userData.tapPower);
}

// Update boost badge
function updateBoostBadge() {
  loadDailyBoosterData();
  const badge = document.getElementById('boostBadge');
  if (!badge) return;
  
  const hasFreeBoosters = 
    dailyBoosterData.turboUsed < MAX_DAILY_TURBO || 
    dailyBoosterData.fullEnergyUsed < MAX_DAILY_FULL_ENERGY;
  
  badge.style.display = hasFreeBoosters ? 'block' : 'none';
}

// Initialize boost screen when navigating
function initBoostScreen() {
  renderBoostScreen();
}

// Initialize
initApp();


// ==================== SHOP & PAYMENT SYSTEM ====================

// Load user's mystery boxes
async function loadUserBoxes() {
  try {
    const response = await fetch(`${API_URL}/payment/boxes/${userData.telegramId}`);
    const data = await response.json();
    if (data.success) {
      userData.mysteryBoxes = data.boxes;
      updateBoxCount();
    }
  } catch (err) {
    console.error('Load boxes error:', err);
  }
}

// Update box count display
function updateBoxCount() {
  const countEl = document.getElementById('userBoxCount');
  if (countEl) {
    countEl.textContent = userData.mysteryBoxes || 0;
  }
  
  const openBtn = document.getElementById('openBoxBtn');
  if (openBtn) {
    openBtn.disabled = !userData.mysteryBoxes || userData.mysteryBoxes < 1;
    openBtn.textContent = userData.mysteryBoxes > 0 ? '🎰 Open Box' : '📦 No Boxes';
  }
}

// Buy product with Razorpay
async function buyProduct(productId) {
  try {
    console.log('Buying product:', productId);
    showNotification('🔄 Creating order...');
    
    if (!productId) {
      showNotification('❌ Invalid product');
      return;
    }
    
    if (!userData || !userData.telegramId) {
      showNotification('❌ Please wait for app to load');
      return;
    }
    
    // Create order on server
    const response = await fetch(`${API_URL}/payment/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: userData.telegramId,
        productId: productId
      })
    });
    
    const data = await response.json();
    console.log('Create order response:', data);
    
    if (!data.success) {
      showNotification('❌ ' + (data.message || 'Failed to create order'));
      return;
    }
    
    // Open Razorpay checkout
    const options = {
      key: data.key,
      amount: data.order.amount,
      currency: data.order.currency,
      name: 'Banana Billion',
      description: data.product.description,
      order_id: data.order.id,
      handler: async function(response) {
        // Verify payment on server
        await verifyPayment(response, userData.telegramId);
      },
      prefill: {
        name: userData.username || userData.firstName,
      },
      theme: {
        color: '#f7b32b'
      },
      modal: {
        ondismiss: function() {
          showNotification('❌ Payment cancelled');
        }
      }
    };
    
    const rzp = new Razorpay(options);
    rzp.open();
    
  } catch (err) {
    console.error('Buy product error:', err);
    showNotification('❌ Payment failed. Try again.');
  }
}

// Verify payment
async function verifyPayment(paymentResponse, telegramId) {
  try {
    showNotification('🔄 Verifying payment...');
    
    const response = await fetch(`${API_URL}/payment/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        telegramId: telegramId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('🎉 ' + data.message);
      
      // Handle different product types
      if (data.type === 'mystery_box' && data.boxes !== undefined) {
        userData.mysteryBoxes = data.boxes;
        updateBoxCount();
        showPurchaseSuccess('boxes', data.boxes);
      } else if (data.type === 'cosmetic' && data.cosmetic) {
        userData.ownedCosmetics = data.ownedCosmetics;
        userData.activeCosmetic = data.cosmetic;
        updateShopUI();
        showPurchaseSuccess('cosmetic', data.cosmetic);
      } else if (data.type === 'banana_pass' && data.bananaPass) {
        userData.bananaPass = true;
        userData.miningBonus = 20;
        updateShopUI();
        showPurchaseSuccess('banana_pass');
      } else if (data.type === 'spin' && data.spins !== undefined) {
        userData.luckySpins = data.spins;
        updateSpinCount();
        showPurchaseSuccess('spins', data.spins);
      } else if (data.type === 'coin_pack' && data.coins !== undefined) {
        userData.coins = data.coins;
        updateBalanceDisplay();
        showPurchaseSuccess('coins', data.coins);
      } else if (data.type === 'booster') {
        showPurchaseSuccess('booster', data.message);
      } else if (data.type === 'energy' && data.energy !== undefined) {
        userData.energy = data.energy;
        updateAllUI();
        showPurchaseSuccess('energy');
      }
    } else {
      showNotification('❌ ' + (data.message || 'Payment verification failed'));
    }
  } catch (err) {
    console.error('Verify payment error:', err);
    showNotification('❌ Verification failed. Contact support.');
  }
}

// Show purchase success animation
function showPurchaseSuccess(type, value) {
  const modal = document.createElement('div');
  modal.className = 'purchase-success-modal';
  
  let content = '';
  if (type === 'boxes') {
    content = `
      <div class="success-icon">🎁</div>
      <h2>Purchase Successful!</h2>
      <p>You now have <strong>${value}</strong> Mystery Box(es)</p>`;
  } else if (type === 'cosmetic') {
    const cosmeticNames = {
      'colored_frame': 'Colored Frame',
      'premium_banner': 'Premium Banner',
      'animated_frame': 'Animated Frame'
    };
    content = `
      <div class="success-icon">🎨</div>
      <h2>Cosmetic Unlocked!</h2>
      <p><strong>${cosmeticNames[value] || value}</strong> is now equipped!</p>`;
  } else if (type === 'banana_pass') {
    content = `
      <div class="success-icon">🍌👑</div>
      <h2>Banana Pass Activated!</h2>
      <p>Enjoy +20% mining, special emoji, and daily 2x booster!</p>`;
  } else if (type === 'spins') {
    content = `
      <div class="success-icon">🎰</div>
      <h2>Spins Added!</h2>
      <p>You now have <strong>${value}</strong> Lucky Spin(s)</p>
      <p class="success-hint">Go spin the wheel to win prizes!</p>`;
  } else if (type === 'coins') {
    content = `
      <div class="success-icon">💰</div>
      <h2>Coins Added!</h2>
      <p>Your balance: <strong>${formatNumber(value)}</strong> 🍌</p>`;
  } else if (type === 'booster') {
    content = `
      <div class="success-icon">🚀</div>
      <h2>Booster Activated!</h2>
      <p>${value}</p>`;
  } else if (type === 'energy') {
    content = `
      <div class="success-icon">⚡</div>
      <h2>Energy Restored!</h2>
      <p>Your energy is now full!</p>`;
  } else {
    content = `
      <div class="success-icon">🎉</div>
      <h2>Purchase Successful!</h2>
      <p>Thank you for your purchase!</p>`;
  }
  
  modal.innerHTML = `
    <div class="purchase-success-content">
      ${content}
      <button onclick="this.parentElement.parentElement.remove()">Continue</button>
    </div>
  `;
  document.body.appendChild(modal);
  createConfetti();
}

// Open mystery box
async function openMysteryBox() {
  if (!userData.mysteryBoxes || userData.mysteryBoxes < 1) {
    showNotification('❌ No mystery boxes! Buy some from the shop.');
    return;
  }
  
  try {
    showNotification('🎰 Opening box...');
    
    const response = await fetch(`${API_URL}/payment/open-box`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId: userData.telegramId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      userData.mysteryBoxes = data.remainingBoxes;
      userData.coins += data.rewards.coins;
      updateBoxCount();
      updateBalanceDisplay();
      
      // Show rewards animation
      showBoxRewards(data.rewards);
    } else {
      showNotification('❌ ' + (data.message || 'Failed to open box'));
    }
  } catch (err) {
    console.error('Open box error:', err);
    showNotification('❌ Error opening box');
  }
}

// Show box rewards animation
function showBoxRewards(rewards) {
  const modal = document.createElement('div');
  modal.className = 'box-rewards-modal';
  modal.innerHTML = `
    <div class="box-rewards-content">
      <div class="box-opening-animation">
        <div class="box-icon">📦</div>
        <div class="box-glow"></div>
      </div>
      <h2>🎉 Mystery Box Opened!</h2>
      
      <div class="rewards-list">
        <div class="reward-item coins">
          <span class="reward-icon">💰</span>
          <span class="reward-value">+${formatNumber(rewards.coins)} Coins</span>
        </div>
        
        <div class="reward-item booster">
          <span class="reward-icon">⚡</span>
          <span class="reward-value">${rewards.booster.name}</span>
        </div>
        
        <div class="reward-item extra">
          <span class="reward-icon">${rewards.extras.type === 'energy_refill' ? '🔋' : '⭐'}</span>
          <span class="reward-value">${rewards.extras.name}</span>
        </div>
      </div>
      
      <button class="claim-rewards-btn" onclick="this.parentElement.parentElement.remove()">
        ✨ Awesome!
      </button>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Add confetti
  createConfetti();
}

// Create confetti effect
function createConfetti() {
  const colors = ['#f7b32b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];
  const emojis = ['🍌', '💰', '⭐', '✨', '🎉'];
  
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    confetti.style.cssText = `
      position: fixed;
      top: -20px;
      left: ${Math.random() * 100}vw;
      font-size: ${15 + Math.random() * 15}px;
      animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
      z-index: 10001;
    `;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 4000);
  }
}

// Initialize shop when navigating
function initShop() {
  loadUserBoxes();
  loadUserInventory();
  loadUserSpins();
  const shopBalanceEl = document.getElementById('shopBalance');
  if (shopBalanceEl) shopBalanceEl.textContent = formatNumber(userData.coins);
}

// Load user inventory (cosmetics, banana pass)
async function loadUserInventory() {
  try {
    const response = await fetch(`${API_URL}/payment/inventory/${userData.telegramId}`);
    const data = await response.json();
    
    if (data.success) {
      userData.mysteryBoxes = data.mysteryBoxes;
      userData.ownedCosmetics = data.ownedCosmetics || [];
      userData.activeCosmetic = data.activeCosmetic;
      userData.bananaPass = data.bananaPass;
      userData.miningBonus = data.miningBonus || 0;
      userData.specialEmoji = data.specialEmoji;
      userData.badge = data.badge;
      
      updateShopUI();
    }
  } catch (err) {
    console.error('Load inventory error:', err);
  }
}

// Update shop UI based on owned items
function updateShopUI() {
  // Update Banana Pass section
  const passSection = document.getElementById('bananaPassSection');
  const passOwned = document.getElementById('bananaPassOwned');
  
  if (userData.bananaPass) {
    if (passSection) passSection.classList.add('hidden');
    if (passOwned) passOwned.classList.remove('hidden');
  } else {
    if (passSection) passSection.classList.remove('hidden');
    if (passOwned) passOwned.classList.add('hidden');
  }
  
  // Update cosmetics
  const cosmetics = ['colored_frame', 'premium_banner', 'animated_frame'];
  cosmetics.forEach(cosmetic => {
    const card = document.getElementById(`cosmetic_${cosmetic}`);
    if (card) {
      card.classList.remove('owned', 'equipped');
      if (userData.ownedCosmetics && userData.ownedCosmetics.includes(cosmetic)) {
        card.classList.add('owned');
        if (userData.activeCosmetic === cosmetic) {
          card.classList.add('equipped');
        }
      }
    }
  });
  
  // Update box count
  updateBoxCount();
  
  // Apply cosmetic effects to profile
  applyCosmetics();
}

// Apply cosmetics to profile avatar
function applyCosmetics() {
  const avatar = document.querySelector('.avatar');
  const profileAvatar = document.querySelector('.profile-avatar-container');
  
  if (!avatar) return;
  
  // Remove existing cosmetic classes
  avatar.classList.remove('colored-frame', 'animated-frame', 'premium-banner');
  if (profileAvatar) {
    profileAvatar.classList.remove('colored-frame', 'animated-frame', 'premium-banner');
  }
  
  // Apply active cosmetic
  if (userData.activeCosmetic) {
    avatar.classList.add(userData.activeCosmetic.replace('_', '-'));
    if (profileAvatar) {
      profileAvatar.classList.add(userData.activeCosmetic.replace('_', '-'));
    }
  }
  
  // Apply Banana Pass badge
  const existingBadge = avatar.querySelector('.banana-badge');
  if (userData.bananaPass) {
    if (!existingBadge) {
      const badge = document.createElement('span');
      badge.className = 'banana-badge';
      badge.textContent = '👑';
      avatar.appendChild(badge);
    }
  } else {
    // Remove badge if user doesn't have Banana Pass
    if (existingBadge) {
      existingBadge.remove();
    }
  }
}

// Claim daily Banana Pass booster
async function claimPassBooster() {
  if (!userData.bananaPass) {
    showNotification('You need Banana Pass for this!');
    return;
  }
  
  try {
    const btn = document.getElementById('claimPassBooster');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Claiming...';
    }
    
    const response = await fetch(`${API_URL}/payment/claim-pass-booster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId: userData.telegramId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification(data.message);
      if (btn) btn.textContent = 'Claimed Today!';
    } else {
      showNotification(data.message || 'Already claimed today');
      if (btn) {
        btn.textContent = 'Already Claimed';
        btn.disabled = true;
      }
    }
  } catch (err) {
    console.error('Claim booster error:', err);
    showNotification('Error claiming booster');
    const btn = document.getElementById('claimPassBooster');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Claim Daily 2x Booster';
    }
  }
}

// Make claimPassBooster available globally
window.claimPassBooster = claimPassBooster;

// ==================== LUCKY SPIN SYSTEM ====================

// Load user spins
async function loadUserSpins() {
  try {
    const response = await fetch(`${API_URL}/payment/spins/${userData.telegramId}`);
    const data = await response.json();
    if (data.success) {
      userData.luckySpins = data.spins;
      updateSpinCount();
    }
  } catch (err) {
    console.error('Load spins error:', err);
  }
}

// Update spin count display
function updateSpinCount() {
  const countEl = document.getElementById('userSpinCount');
  if (countEl) countEl.textContent = userData.luckySpins || 0;
  
  const spinBtn = document.getElementById('useSpinBtn');
  if (spinBtn) {
    spinBtn.disabled = !userData.luckySpins || userData.luckySpins < 1;
    spinBtn.textContent = userData.luckySpins > 0 ? '🎰 Spin Now!' : '🎰 No Spins';
  }
}

// Spin state
let currentSpinReward = null;
let isSpinning = false;

// Open spin modal
function useLuckySpin() {
  const modal = document.getElementById('spinModal');
  if (modal) {
    modal.classList.add('active');
    updateModalSpinCount();
    resetSpinWheel();
  }
}

// Update spin count in modal
function updateModalSpinCount() {
  const countEl = document.getElementById('modalSpinCount');
  if (countEl) countEl.textContent = userData.luckySpins || 0;
  
  const spinBtn = document.getElementById('spinNowBtn');
  if (spinBtn) {
    spinBtn.disabled = !userData.luckySpins || userData.luckySpins < 1 || isSpinning;
  }
}

// Reset spin wheel
function resetSpinWheel() {
  const wheel = document.getElementById('spinWheel');
  const resultContainer = document.getElementById('spinResultContainer');
  const controls = document.querySelector('.spin-controls');
  
  if (wheel) {
    wheel.style.transition = 'none';
    wheel.style.transform = 'rotate(0deg)';
  }
  if (resultContainer) resultContainer.classList.remove('show');
  if (controls) controls.style.display = 'flex';
}

// Do the spin
async function doSpin() {
  if (!userData.luckySpins || userData.luckySpins < 1) {
    showNotification('❌ No spins available! Buy some from the shop.');
    return;
  }
  
  if (isSpinning) return;
  isSpinning = true;
  
  const modal = document.getElementById('spinModal');
  const wheel = document.getElementById('spinWheel');
  const spinBtn = document.getElementById('spinNowBtn');
  
  if (spinBtn) {
    spinBtn.disabled = true;
    spinBtn.querySelector('.btn-text').textContent = '🎰 Spinning...';
  }
  if (modal) modal.classList.add('spinning');
  
  try {
    // Call API to get result
    const response = await fetch(`${API_URL}/payment/use-spin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId: userData.telegramId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      userData.luckySpins = data.remainingSpins;
      currentSpinReward = data.reward;
      
      // Calculate wheel rotation
      const segmentAngle = 360 / 8;
      const rewardIndex = getSpinRewardIndex(data.reward);
      // Spin multiple times + land on segment (offset to center of segment)
      const baseRotation = 360 * 6; // 6 full rotations
      const segmentRotation = (7 - rewardIndex) * segmentAngle; // Reverse because wheel spins clockwise
      const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.6); // Random within segment
      const targetAngle = baseRotation + segmentRotation + randomOffset;
      
      if (wheel) {
        wheel.style.transition = 'transform 5s cubic-bezier(0.2, 0.8, 0.3, 1)';
        wheel.style.transform = `rotate(${targetAngle}deg)`;
      }
      
      // Show result after animation
      setTimeout(() => {
        isSpinning = false;
        if (modal) modal.classList.remove('spinning');
        showSpinResult(data.reward);
      }, 5000);
      
    } else {
      isSpinning = false;
      if (modal) modal.classList.remove('spinning');
      if (spinBtn) {
        spinBtn.disabled = false;
        spinBtn.querySelector('.btn-text').textContent = '🎰 SPIN!';
      }
      showNotification('❌ ' + (data.message || 'Spin failed'));
    }
  } catch (err) {
    console.error('Spin error:', err);
    isSpinning = false;
    if (modal) modal.classList.remove('spinning');
    if (spinBtn) {
      spinBtn.disabled = false;
      spinBtn.querySelector('.btn-text').textContent = '🎰 SPIN!';
    }
    showNotification('❌ Error spinning wheel');
  }
}

// Show spin result
function showSpinResult(reward) {
  const resultContainer = document.getElementById('spinResultContainer');
  const resultIcon = document.getElementById('resultIcon');
  const resultValue = document.getElementById('resultValue');
  const controls = document.querySelector('.spin-controls');
  
  // Get icon based on reward type
  let icon = '🎉';
  if (reward.type === 'coins') icon = '💰';
  else if (reward.type === 'energy') icon = '⚡';
  else if (reward.type === 'booster') icon = '🚀';
  else if (reward.type === 'box') icon = '📦';
  
  if (resultIcon) resultIcon.textContent = icon;
  if (resultValue) resultValue.textContent = reward.label;
  if (controls) controls.style.display = 'none';
  if (resultContainer) resultContainer.classList.add('show');
  
  // Create celebration effects
  createConfetti();
}

// Claim spin reward
function claimSpinReward() {
  if (!currentSpinReward) {
    closeSpinModal();
    return;
  }
  
  // Apply reward to local state
  if (currentSpinReward.type === 'coins') {
    userData.coins = (userData.coins || 0) + currentSpinReward.value;
  } else if (currentSpinReward.type === 'energy') {
    userData.energy = userData.maxEnergy;
  } else if (currentSpinReward.type === 'box') {
    userData.mysteryBoxes = (userData.mysteryBoxes || 0) + currentSpinReward.value;
  }
  
  updateBalanceDisplay();
  updateSpinCount();
  updateBoxCount();
  
  showNotification(`🎉 You won ${currentSpinReward.label}!`);
  currentSpinReward = null;
  
  // Reset and allow another spin
  resetSpinWheel();
  updateModalSpinCount();
  
  const spinBtn = document.getElementById('spinNowBtn');
  if (spinBtn) {
    spinBtn.querySelector('.btn-text').textContent = '🎰 SPIN!';
  }
}

// Get spin reward index for wheel animation
function getSpinRewardIndex(reward) {
  // Map reward to wheel segment index (matches HTML order)
  const segments = [
    { type: 'coins', value: 1000 },    // 0: 1K
    { type: 'coins', value: 5000 },    // 1: 5K
    { type: 'coins', value: 10000 },   // 2: 10K
    { type: 'energy', value: 'full' }, // 3: Energy
    { type: 'coins', value: 25000 },   // 4: 25K
    { type: 'booster', value: '2x' },  // 5: 2x Booster
    { type: 'coins', value: 50000 },   // 6: 50K
    { type: 'box', value: 1 }          // 7: Box
  ];
  
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].type === reward.type) {
      if (reward.type === 'coins') {
        // Find closest coin value
        if (reward.value <= 2500) return 0;
        if (reward.value <= 7500) return 1;
        if (reward.value <= 17500) return 2;
        if (reward.value <= 37500) return 4;
        return 6;
      }
      return i;
    }
  }
  return 0;
}

// Close spin modal
function closeSpinModal() {
  const modal = document.getElementById('spinModal');
  if (modal) {
    modal.classList.remove('active');
    modal.classList.remove('spinning');
  }
  isSpinning = false;
  currentSpinReward = null;
  
  // Reset wheel after modal closes
  setTimeout(resetSpinWheel, 300);
}

// Make functions globally available
window.useLuckySpin = useLuckySpin;
window.closeSpinModal = closeSpinModal;
window.doSpin = doSpin;
window.claimSpinReward = claimSpinReward;
window.buyProduct = buyProduct;

// Debug function to check available products
async function debugProducts() {
  try {
    const response = await fetch(`${API_URL}/payment/products`);
    const data = await response.json();
    console.log('Available products:', data.products?.map(p => p.id));
    return data;
  } catch (err) {
    console.error('Debug products error:', err);
  }
}
window.debugProducts = debugProducts;

// ==================== WALLET SYSTEM ====================

// Initialize wallet screen
async function initWallet() {
  // Update balance
  const walletBalanceEl = document.getElementById('walletBalance');
  if (walletBalanceEl) walletBalanceEl.textContent = formatNumber(userData.coins);
  
  // Update token balance
  const tokenBalanceEl = document.getElementById('tokenBalance');
  if (tokenBalanceEl) tokenBalanceEl.textContent = formatNumber(userData.coins);
  
  // Calculate USD value (1M = $100, so 1 = $0.0001)
  const usdValue = (userData.coins * 0.0001).toFixed(2);
  const tokenUsdEl = document.getElementById('tokenUsdValue');
  if (tokenUsdEl) tokenUsdEl.textContent = `≈ $${usdValue}`;
  
  // Update mining stats
  const totalMinedEl = document.getElementById('walletTotalMined');
  if (totalMinedEl) totalMinedEl.textContent = formatNumber(userData.totalTaps || 0);
  
  const miningPowerEl = document.getElementById('walletMiningPower');
  if (miningPowerEl) miningPowerEl.textContent = formatNumber(userData.tapPower || 1);
  
  const perHourEl = document.getElementById('walletPerHour');
  if (perHourEl) perHourEl.textContent = formatNumber(calculatePerHour());
  
  // Load user rank
  try {
    const response = await fetch(`${API_URL}/user/rank/${userData.telegramId}`);
    const data = await response.json();
    if (data.success) {
      const rankEl = document.getElementById('walletRank');
      if (rankEl) rankEl.textContent = `#${data.rank}`;
    }
  } catch (err) {
    console.error('Load rank error:', err);
  }
  
  // Update airdrop requirements
  updateAirdropRequirements();
}

// Update airdrop requirements status
function updateAirdropRequirements() {
  const coins = userData.coins || 0;
  const level = userData.level || 1;
  const referrals = userData.referrals?.length || 0;
  
  // Requirement 1: Mine 10,000 $BANANA
  const req1 = document.getElementById('req1Status');
  const req1Item = req1?.closest('.requirement-item');
  if (req1) {
    if (coins >= 10000) {
      req1.textContent = '✓';
      req1Item?.classList.add('completed');
    } else {
      req1.textContent = `${formatNumber(coins)}/10K`;
    }
  }
  
  // Requirement 2: Reach Level 5
  const req2 = document.getElementById('req2Status');
  const req2Item = req2?.closest('.requirement-item');
  if (req2) {
    if (level >= 5) {
      req2.textContent = '✓';
      req2Item?.classList.add('completed');
    } else {
      req2.textContent = `Lv.${level}/5`;
    }
  }
  
  // Requirement 3: Invite 3 friends
  const req3 = document.getElementById('req3Status');
  const req3Item = req3?.closest('.requirement-item');
  if (req3) {
    if (referrals >= 3) {
      req3.textContent = '✓';
      req3Item?.classList.add('completed');
    } else {
      req3.textContent = `${referrals}/3`;
    }
  }
}

// Show coming soon notification
function showComingSoon() {
  showNotification('🚀 Coming Soon! Stay tuned for updates.');
}

window.showComingSoon = showComingSoon;

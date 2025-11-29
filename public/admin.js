// ===================== ADMIN PANEL v2.0 =====================
const API = '/api/admin';
let token = localStorage.getItem('adminToken');
let currentPage = 'dashboard';

// Navigation Menu
const NAV_MENU = [
  { group: 'Main', items: [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'analytics', icon: '📈', label: 'Analytics' }
  ]},
  { group: 'Management', items: [
    { id: 'users', icon: '👥', label: 'Users', badge: true },
    { id: 'tasks', icon: '📋', label: 'Tasks' },
    { id: 'leaderboard', icon: '🏆', label: 'Leaderboard' }
  ]},
  { group: 'Gifts & Rewards', items: [
    { id: 'gifts', icon: '🎁', label: 'Send Gifts' },
    { id: 'mystery', icon: '📦', label: 'Mystery Box' },
    { id: 'spins', icon: '🎰', label: 'Free Spins' },
    { id: 'bonus', icon: '💎', label: 'Bonus Manager' }
  ]},
  { group: 'Communication', items: [
    { id: 'broadcast', icon: '📢', label: 'Broadcast' },
    { id: 'popup', icon: '🔔', label: 'Popup & Alerts' },
    { id: 'bot', icon: '🤖', label: 'Bot Control' }
  ]},
  { group: 'Settings', items: [
    { id: 'settings', icon: '⚙️', label: 'Game Settings' },
    { id: 'logs', icon: '📜', label: 'Activity Logs' },
    { id: 'backup', icon: '💾', label: 'Backup' }
  ]}
];

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  if (token) {
    verifyAndStart();
  }
});

async function verifyAndStart() {
  try {
    const res = await api('/verify');
    if (res.success) {
      showApp();
    } else {
      logout();
    }
  } catch (e) {
    logout();
  }
}

function showApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('adminName').textContent = localStorage.getItem('adminUser') || 'Admin';
  renderNav();
  navigate('dashboard');
}

function renderNav() {
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = NAV_MENU.map(group => `
    <div class="nav-group">
      <div class="nav-group-title">${group.group}</div>
      ${group.items.map(item => `
        <div class="nav-item ${currentPage === item.id ? 'active' : ''}" onclick="navigate('${item.id}')">
          <span class="icon">${item.icon}</span>
          <span>${item.label}</span>
          ${item.badge ? '<span class="badge" id="badge_' + item.id + '">0</span>' : ''}
        </div>
      `).join('')}
    </div>
  `).join('');
}

// ===================== AUTH =====================
async function login(e) {
  e.preventDefault();
  const username = document.getElementById('loginUser').value;
  const password = document.getElementById('loginPass').value;
  
  showLoading();
  try {
    const res = await fetch(API + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    
    if (data.success) {
      token = data.token;
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', username);
      showApp();
      toast('Welcome back!', 'success');
    } else {
      toast(data.message || 'Login failed', 'error');
    }
  } catch (e) {
    toast('Connection error', 'error');
  }
  hideLoading();
}

function logout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  token = null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
}

// ===================== NAVIGATION =====================
function navigate(page) {
  currentPage = page;
  renderNav();
  document.getElementById('pageTitle').textContent = getPageTitle(page);
  loadPage(page);
}

function getPageTitle(page) {
  const titles = {
    dashboard: '📊 Dashboard',
    analytics: '📈 Analytics',
    users: '👥 User Management',
    tasks: '📋 Task Management',
    leaderboard: '🏆 Leaderboard',
    gifts: '🎁 Send Gifts',
    mystery: '📦 Mystery Box',
    spins: '🎰 Free Spins',
    bonus: '💎 Bonus Manager',
    broadcast: '📢 Broadcast',
    popup: '🔔 Popup & Alerts',
    bot: '🤖 Bot Control',
    settings: '⚙️ Game Settings',
    logs: '📜 Activity Logs',
    backup: '💾 Backup & Restore'
  };
  return titles[page] || page;
}

function refresh() {
  loadPage(currentPage);
  toast('Refreshed', 'info');
}

async function loadPage(page) {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
  
  const pages = {
    dashboard: pageDashboard,
    analytics: pageAnalytics,
    users: pageUsers,
    tasks: pageTasks,
    leaderboard: pageLeaderboard,
    gifts: pageGifts,
    mystery: pageMystery,
    spins: pageSpins,
    bonus: pageBonus,
    broadcast: pageBroadcast,
    popup: pagePopup,
    bot: pageBot,
    settings: pageSettings,
    logs: pageLogs,
    backup: pageBackup
  };
  
  if (pages[page]) {
    await pages[page]();
  } else {
    content.innerHTML = '<div class="empty"><div class="icon">🚧</div><p>Coming Soon</p></div>';
  }
}

// ===================== API HELPER =====================
async function api(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token
    }
  };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(API + endpoint, options);
  return res.json();
}

// ===================== PAGES =====================

// Dashboard
async function pageDashboard() {
  const content = document.getElementById('content');
  
  try {
    const [stats, topUsers] = await Promise.all([
      api('/stats'),
      api('/users?limit=5&sort=coins')
    ]);
    
    const s = stats.stats || {};
    if (document.getElementById('badge_users')) {
      document.getElementById('badge_users').textContent = formatNum(s.totalUsers || 0);
    }
    
    content.innerHTML = `
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon blue">👥</div>
          <div class="stat-value">${formatNum(s.totalUsers || 0)}</div>
          <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon yellow">🪙</div>
          <div class="stat-value">${formatNum(s.totalCoins || 0)}</div>
          <div class="stat-label">Total Coins</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">👆</div>
          <div class="stat-value">${formatNum(s.totalTaps || 0)}</div>
          <div class="stat-label">Total Taps</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">🔗</div>
          <div class="stat-value">${formatNum(s.totalReferrals || 0)}</div>
          <div class="stat-label">Referrals</div>
        </div>
      </div>
      
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><h3>🏆 Top Players</h3></div>
          <div class="card-body">
            ${(topUsers.users || []).map((u, i) => `
              <div class="list-item">
                <div class="list-avatar">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '👤'}</div>
                <div class="list-info">
                  <div class="list-title">${u.username || u.firstName || 'User'}</div>
                  <div class="list-subtitle">Level ${u.level || 1}</div>
                </div>
                <div class="list-value">${formatNum(u.coins)} 🪙</div>
              </div>
            `).join('') || '<p>No users</p>'}
          </div>
        </div>
        
        <div class="card">
          <div class="card-header"><h3>⚡ Quick Actions</h3></div>
          <div class="card-body">
            <div class="quick-actions">
              <button class="quick-btn" onclick="navigate('gifts')"><span class="icon">🎁</span><span>Send Gift</span></button>
              <button class="quick-btn" onclick="navigate('mystery')"><span class="icon">📦</span><span>Mystery Box</span></button>
              <button class="quick-btn" onclick="navigate('broadcast')"><span class="icon">📢</span><span>Broadcast</span></button>
              <button class="quick-btn" onclick="navigate('popup')"><span class="icon">🔔</span><span>Send Alert</span></button>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (e) {
    content.innerHTML = '<div class="empty"><div class="icon">❌</div><p>Failed to load</p></div>';
  }
}


// Analytics
async function pageAnalytics() {
  const content = document.getElementById('content');
  try {
    const stats = await api('/stats');
    const s = stats.stats || {};
    
    content.innerHTML = `
      <div class="stats-row">
        <div class="stat-card"><div class="stat-icon blue">👥</div><div class="stat-value">${formatNum(s.totalUsers)}</div><div class="stat-label">Total Users</div></div>
        <div class="stat-card"><div class="stat-icon green">📅</div><div class="stat-value">${s.todayUsers || 0}</div><div class="stat-label">New Today</div></div>
        <div class="stat-card"><div class="stat-icon yellow">🪙</div><div class="stat-value">${formatNum(s.totalCoins)}</div><div class="stat-label">Total Coins</div></div>
        <div class="stat-card"><div class="stat-icon purple">📋</div><div class="stat-value">${s.totalTasks || 0}</div><div class="stat-label">Active Tasks</div></div>
      </div>
      <div class="card">
        <div class="card-header"><h3>📊 Statistics</h3></div>
        <div class="card-body">
          <div class="list-item"><div class="list-info"><div class="list-title">Avg Coins/User</div></div><div class="list-value">${s.totalUsers ? formatNum(Math.round(s.totalCoins / s.totalUsers)) : 0}</div></div>
          <div class="list-item"><div class="list-info"><div class="list-title">Avg Taps/User</div></div><div class="list-value">${s.totalUsers ? formatNum(Math.round(s.totalTaps / s.totalUsers)) : 0}</div></div>
          <div class="list-item"><div class="list-info"><div class="list-title">Referral Rate</div></div><div class="list-value">${s.totalUsers ? ((s.totalReferrals / s.totalUsers) * 100).toFixed(1) : 0}%</div></div>
        </div>
      </div>
    `;
  } catch (e) {
    content.innerHTML = '<div class="empty"><div class="icon">❌</div><p>Failed to load</p></div>';
  }
}

// Users
let usersCache = [];
async function pageUsers() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="toolbar">
      <input type="text" class="search-input" id="userSearch" placeholder="🔍 Search users..." onkeyup="filterUsers()">
      <select class="form-control" style="width:auto;" onchange="loadUsersList(this.value)">
        <option value="coins">Sort by Coins</option>
        <option value="createdAt">Sort by Date</option>
        <option value="level">Sort by Level</option>
      </select>
      <button class="btn btn-secondary btn-sm" onclick="exportUsers()">📥 Export</button>
    </div>
    <div class="card"><div class="card-body"><div id="usersTable">Loading...</div></div></div>
  `;
  await loadUsersList('coins');
}

async function loadUsersList(sort) {
  try {
    const data = await api('/users?limit=100&sort=' + sort);
    usersCache = data.users || [];
    renderUsers(usersCache);
  } catch (e) {
    document.getElementById('usersTable').innerHTML = '<p>Failed to load</p>';
  }
}

function renderUsers(users) {
  document.getElementById('usersTable').innerHTML = users.length ? `
    <div class="table-wrap">
      <table>
        <thead><tr><th>User</th><th>ID</th><th>Coins</th><th>Level</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td><strong>${u.username || u.firstName || 'User'}</strong></td>
              <td><code>${u.telegramId}</code></td>
              <td>${formatNum(u.coins)}</td>
              <td>Lv.${u.level || 1}</td>
              <td>${u.banned ? '<span class="badge badge-danger">Banned</span>' : '<span class="badge badge-success">Active</span>'}</td>
              <td class="table-actions">
                <button class="btn btn-sm btn-secondary" onclick="editUser('${u.telegramId}')">✏️</button>
                <button class="btn btn-sm btn-success" onclick="giftUser('${u.telegramId}')">🎁</button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser('${u.telegramId}')">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '<div class="empty"><div class="icon">👥</div><p>No users found</p></div>';
}

function filterUsers() {
  const q = document.getElementById('userSearch').value.toLowerCase();
  const filtered = usersCache.filter(u => 
    (u.username || '').toLowerCase().includes(q) || 
    (u.firstName || '').toLowerCase().includes(q) || 
    (u.telegramId || '').includes(q)
  );
  renderUsers(filtered);
}

function editUser(id) {
  const u = usersCache.find(x => x.telegramId === id);
  if (!u) return;
  
  openModal('Edit User', `
    <div class="form-group"><label>Telegram ID</label><input class="form-control" value="${u.telegramId}" disabled></div>
    <div class="form-row">
      <div class="form-group"><label>Coins</label><input class="form-control" type="number" id="editCoins" value="${u.coins || 0}"></div>
      <div class="form-group"><label>Level</label><input class="form-control" type="number" id="editLevel" value="${u.level || 1}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Energy</label><input class="form-control" type="number" id="editEnergy" value="${u.energy || 1000}"></div>
      <div class="form-group"><label>Tap Power</label><input class="form-control" type="number" id="editTapPower" value="${u.tapPower || 1}"></div>
    </div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveUser('${id}')">Save</button>`);
}

async function saveUser(id) {
  showLoading();
  await api('/user/' + id + '/update', 'POST', {
    coins: Number(document.getElementById('editCoins').value),
    level: Number(document.getElementById('editLevel').value),
    energy: Number(document.getElementById('editEnergy').value),
    tapPower: Number(document.getElementById('editTapPower').value)
  });
  hideLoading();
  closeModal();
  toast('User updated', 'success');
  loadUsersList('coins');
}

function giftUser(id) {
  openModal('Send Gift', `
    <div class="form-group"><label>Gift Type</label>
      <select class="form-control" id="giftType">
        <option value="coins">🪙 Coins</option>
        <option value="energy">⚡ Energy</option>
        <option value="spins">🎰 Free Spins</option>
        <option value="mystery">📦 Mystery Box</option>
      </select>
    </div>
    <div class="form-group"><label>Amount</label><input class="form-control" type="number" id="giftAmount" value="10000"></div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-success" onclick="sendGiftToUser('${id}')">Send Gift</button>`);
}

async function sendGiftToUser(id) {
  const type = document.getElementById('giftType').value;
  const amount = Number(document.getElementById('giftAmount').value);
  
  showLoading();
  if (type === 'coins') {
    await api('/user/' + id + '/add-coins', 'POST', { amount });
  } else if (type === 'energy') {
    await api('/gift/energy', 'POST', { target: 'specific', userId: id, amount });
  } else if (type === 'spins') {
    await api('/gift/spins', 'POST', { target: 'specific', userId: id, amount, expiryHours: 72 });
  } else if (type === 'mystery') {
    await api('/gift/mystery-box', 'POST', { target: 'specific', userId: id, boxType: 'rare', quantity: amount > 10 ? 1 : amount });
  }
  hideLoading();
  closeModal();
  toast('Gift sent!', 'success');
}

async function deleteUser(id) {
  if (!confirm('Delete this user?')) return;
  showLoading();
  await api('/user/' + id, 'DELETE');
  hideLoading();
  toast('User deleted', 'success');
  loadUsersList('coins');
}

async function exportUsers() {
  const data = await api('/users?limit=10000');
  const csv = 'ID,Username,Coins,Level,Taps\n' + (data.users || []).map(u => 
    [u.telegramId, u.username || '', u.coins, u.level || 1, u.totalTaps || 0].join(',')
  ).join('\n');
  download('users.csv', csv);
  toast('Exported!', 'success');
}

// Tasks
let tasksCache = [];
async function pageTasks() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="toolbar">
      <button class="btn btn-primary" onclick="createTask()">➕ Create Task</button>
      <button class="btn btn-secondary btn-sm" onclick="pageTasks()">🔄 Refresh</button>
    </div>
    <div class="card"><div class="card-body"><div id="tasksTable">Loading...</div></div></div>
  `;
  
  try {
    const data = await api('/tasks');
    tasksCache = data.tasks || [];
    
    document.getElementById('tasksTable').innerHTML = tasksCache.length ? `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Task</th><th>Type</th><th>Reward</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${tasksCache.map(t => `
              <tr>
                <td><span style="font-size:20px;">${t.icon || '📋'}</span> ${t.title}</td>
                <td><span class="badge badge-info">${t.type}</span></td>
                <td>${formatNum(t.reward)} 🪙</td>
                <td>${t.isActive ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>'}</td>
                <td class="table-actions">
                  <button class="btn btn-sm btn-secondary" onclick="editTask('${t.id}')">✏️</button>
                  <button class="btn btn-sm btn-${t.isActive ? 'warning' : 'success'}" onclick="toggleTask('${t.id}', ${t.isActive})">${t.isActive ? '⏸️' : '▶️'}</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteTask('${t.id}')">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '<div class="empty"><div class="icon">📋</div><p>No tasks</p></div>';
  } catch (e) {
    document.getElementById('tasksTable').innerHTML = '<p>Failed to load</p>';
  }
}

function createTask() { showTaskModal(); }
function editTask(id) { showTaskModal(tasksCache.find(t => t.id === id)); }

function showTaskModal(task = null) {
  openModal(task ? 'Edit Task' : 'Create Task', `
    <div class="form-group"><label>Title</label><input class="form-control" id="taskTitle" value="${task?.title || ''}" placeholder="Join our channel"></div>
    <div class="form-group"><label>Description</label><input class="form-control" id="taskDesc" value="${task?.description || ''}"></div>
    <div class="form-row">
      <div class="form-group"><label>Type</label>
        <select class="form-control" id="taskType">
          <option value="telegram" ${task?.type === 'telegram' ? 'selected' : ''}>Telegram</option>
          <option value="social" ${task?.type === 'social' ? 'selected' : ''}>Social</option>
          <option value="daily" ${task?.type === 'daily' ? 'selected' : ''}>Daily</option>
        </select>
      </div>
      <div class="form-group"><label>Reward</label><input class="form-control" type="number" id="taskReward" value="${task?.reward || 1000}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Icon</label><input class="form-control" id="taskIcon" value="${task?.icon || '📋'}" maxlength="4"></div>
      <div class="form-group"><label>Link</label><input class="form-control" id="taskLink" value="${task?.link || ''}" placeholder="https://..."></div>
    </div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveTask('${task?.id || ''}')">Save</button>`);
}

async function saveTask(id) {
  const data = {
    title: document.getElementById('taskTitle').value,
    description: document.getElementById('taskDesc').value,
    type: document.getElementById('taskType').value,
    reward: Number(document.getElementById('taskReward').value),
    icon: document.getElementById('taskIcon').value,
    link: document.getElementById('taskLink').value,
    isActive: true
  };
  
  showLoading();
  await api(id ? '/task/' + id + '/update' : '/task/create', 'POST', data);
  hideLoading();
  closeModal();
  toast(id ? 'Task updated' : 'Task created', 'success');
  pageTasks();
}

async function toggleTask(id, active) {
  await api('/task/' + id + '/update', 'POST', { isActive: !active });
  toast('Task ' + (active ? 'disabled' : 'enabled'), 'success');
  pageTasks();
}

async function deleteTask(id) {
  if (!confirm('Delete task?')) return;
  await api('/task/' + id, 'DELETE');
  toast('Deleted', 'success');
  pageTasks();
}

// Leaderboard
async function pageLeaderboard() {
  const content = document.getElementById('content');
  try {
    const data = await api('/users?limit=50&sort=coins');
    content.innerHTML = `
      <div class="card">
        <div class="card-header"><h3>🏆 Top 50 Players</h3></div>
        <div class="card-body">
          ${(data.users || []).map((u, i) => `
            <div class="list-item">
              <div class="list-avatar" style="background:${i < 3 ? 'linear-gradient(135deg, #f7b32b, #d4941f)' : ''}">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i+1)}</div>
              <div class="list-info">
                <div class="list-title">${u.username || u.firstName || 'User'}</div>
                <div class="list-subtitle">Level ${u.level || 1} • ${formatNum(u.totalTaps || 0)} taps</div>
              </div>
              <div class="list-value">${formatNum(u.coins)} 🪙</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (e) {
    content.innerHTML = '<div class="empty"><div class="icon">❌</div><p>Failed to load</p></div>';
  }
}


// ===================== GIFTS PAGE =====================
async function pageGifts() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h3>🪙 Send Coins</h3></div>
        <div class="card-body">
          <div class="form-group"><label>Target</label>
            <select class="form-control" id="coinsTarget" onchange="toggleUserInput('coins')">
              <option value="specific">Specific User</option>
              <option value="all">All Users</option>
              <option value="active">Active Users (7 days)</option>
              <option value="top100">Top 100 Users</option>
            </select>
          </div>
          <div class="form-group" id="coinsUserGroup"><label>Telegram ID</label><input class="form-control" id="coinsUserId" placeholder="Enter user ID"></div>
          <div class="form-group"><label>Amount</label><input class="form-control" type="number" id="coinsAmount" value="10000"></div>
          <div class="form-group"><label>Message (optional)</label><input class="form-control" id="coinsMessage" placeholder="🎁 Gift from admin!"></div>
          <button class="btn btn-success" style="width:100%;" onclick="sendCoins()">💰 Send Coins</button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header"><h3>⚡ Send Energy</h3></div>
        <div class="card-body">
          <div class="form-group"><label>Target</label>
            <select class="form-control" id="energyTarget" onchange="toggleUserInput('energy')">
              <option value="specific">Specific User</option>
              <option value="all">All Users</option>
            </select>
          </div>
          <div class="form-group" id="energyUserGroup"><label>Telegram ID</label><input class="form-control" id="energyUserId" placeholder="Enter user ID"></div>
          <div class="form-group"><label>Amount</label><input class="form-control" type="number" id="energyAmount" value="1000"></div>
          <button class="btn btn-info" style="width:100%;" onclick="sendEnergy()">⚡ Send Energy</button>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header"><h3>👥 Bulk Send (Multiple Users)</h3></div>
      <div class="card-body">
        <div class="form-group"><label>User IDs (one per line)</label>
          <textarea class="form-control" id="bulkIds" rows="4" placeholder="123456789&#10;987654321&#10;456789123"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Gift Type</label>
            <select class="form-control" id="bulkType">
              <option value="coins">🪙 Coins</option>
              <option value="energy">⚡ Energy</option>
              <option value="spins">🎰 Spins</option>
              <option value="mystery">📦 Mystery Box</option>
            </select>
          </div>
          <div class="form-group"><label>Amount</label><input class="form-control" type="number" id="bulkAmount" value="10000"></div>
        </div>
        <button class="btn btn-primary" onclick="sendBulk()">📤 Send to All Listed Users</button>
      </div>
    </div>
  `;
}

function toggleUserInput(type) {
  const target = document.getElementById(type + 'Target').value;
  document.getElementById(type + 'UserGroup').style.display = target === 'specific' ? 'block' : 'none';
}

async function sendCoins() {
  const target = document.getElementById('coinsTarget').value;
  const userId = document.getElementById('coinsUserId').value;
  const amount = Number(document.getElementById('coinsAmount').value);
  const message = document.getElementById('coinsMessage').value;
  
  if (target === 'specific' && !userId) return toast('Enter user ID', 'error');
  if (!amount) return toast('Enter amount', 'error');
  
  showLoading();
  await api('/gift/coins', 'POST', { target, userId, amount, message });
  hideLoading();
  toast('Coins sent!', 'success');
}

async function sendEnergy() {
  const target = document.getElementById('energyTarget').value;
  const userId = document.getElementById('energyUserId').value;
  const amount = Number(document.getElementById('energyAmount').value);
  
  if (target === 'specific' && !userId) return toast('Enter user ID', 'error');
  
  showLoading();
  await api('/gift/energy', 'POST', { target, userId, amount });
  hideLoading();
  toast('Energy sent!', 'success');
}

async function sendBulk() {
  const ids = document.getElementById('bulkIds').value.trim().split('\n').filter(x => x.trim());
  const type = document.getElementById('bulkType').value;
  const amount = Number(document.getElementById('bulkAmount').value);
  
  if (!ids.length) return toast('Enter user IDs', 'error');
  
  showLoading();
  await api('/gift/bulk', 'POST', { userIds: ids, rewardType: type, amount });
  hideLoading();
  toast('Bulk gift sent!', 'success');
}

// ===================== MYSTERY BOX PAGE =====================
async function pageMystery() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>📦 Quick Send Mystery Box</h3></div>
      <div class="card-body">
        <div class="quick-actions">
          <button class="quick-btn" onclick="sendQuickBox('common')" style="border-color:#22c55e;"><span class="icon">🟢</span><span>Common</span><small style="color:var(--text-muted);">100-1K</small></button>
          <button class="quick-btn" onclick="sendQuickBox('rare')" style="border-color:#3b82f6;"><span class="icon">🔵</span><span>Rare</span><small style="color:var(--text-muted);">1K-10K</small></button>
          <button class="quick-btn" onclick="sendQuickBox('epic')" style="border-color:#8b5cf6;"><span class="icon">🟣</span><span>Epic</span><small style="color:var(--text-muted);">10K-50K</small></button>
          <button class="quick-btn" onclick="sendQuickBox('legendary')" style="border-color:#f7b32b;"><span class="icon">🟡</span><span>Legendary</span><small style="color:var(--text-muted);">50K-200K</small></button>
        </div>
      </div>
    </div>
    
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h3>🎯 Send to Specific User</h3></div>
        <div class="card-body">
          <div class="form-group"><label>Telegram ID</label><input class="form-control" id="mysteryUserId" placeholder="Enter user ID"></div>
          <div class="form-group"><label>Box Type</label>
            <select class="form-control" id="mysteryBoxType">
              <option value="common">🟢 Common</option>
              <option value="rare">🔵 Rare</option>
              <option value="epic">🟣 Epic</option>
              <option value="legendary">🟡 Legendary</option>
            </select>
          </div>
          <div class="form-group"><label>Quantity</label><input class="form-control" type="number" id="mysteryQty" value="1" min="1" max="10"></div>
          <button class="btn btn-primary" style="width:100%;" onclick="sendMysteryToUser()">📦 Send Mystery Box</button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header"><h3>📊 Box Statistics</h3></div>
        <div class="card-body">
          <div class="list-item"><div class="list-avatar">🟢</div><div class="list-info"><div class="list-title">Common Box</div><div class="list-subtitle">100 - 1,000 coins</div></div></div>
          <div class="list-item"><div class="list-avatar">🔵</div><div class="list-info"><div class="list-title">Rare Box</div><div class="list-subtitle">1,000 - 10,000 coins</div></div></div>
          <div class="list-item"><div class="list-avatar">🟣</div><div class="list-info"><div class="list-title">Epic Box</div><div class="list-subtitle">10,000 - 50,000 coins</div></div></div>
          <div class="list-item"><div class="list-avatar">🟡</div><div class="list-info"><div class="list-title">Legendary Box</div><div class="list-subtitle">50,000 - 200,000 coins</div></div></div>
        </div>
      </div>
    </div>
  `;
}

function sendQuickBox(boxType) {
  openModal('Send ' + boxType.charAt(0).toUpperCase() + boxType.slice(1) + ' Box', `
    <div class="form-group"><label>Send To</label>
      <select class="form-control" id="quickBoxTarget">
        <option value="all">All Users</option>
        <option value="active">Active Users (7 days)</option>
        <option value="top100">Top 100 Users</option>
      </select>
    </div>
    <div class="form-group"><label>Quantity per User</label><input class="form-control" type="number" id="quickBoxQty" value="1" min="1" max="5"></div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="confirmQuickBox('${boxType}')">Send</button>`);
}

async function confirmQuickBox(boxType) {
  const target = document.getElementById('quickBoxTarget').value;
  const quantity = Number(document.getElementById('quickBoxQty').value);
  
  showLoading();
  await api('/gift/mystery-box', 'POST', { target, boxType, quantity });
  hideLoading();
  closeModal();
  toast('Mystery boxes sent!', 'success');
}

async function sendMysteryToUser() {
  const userId = document.getElementById('mysteryUserId').value;
  const boxType = document.getElementById('mysteryBoxType').value;
  const quantity = Number(document.getElementById('mysteryQty').value);
  
  if (!userId) return toast('Enter user ID', 'error');
  
  showLoading();
  await api('/gift/mystery-box', 'POST', { target: 'specific', userId, boxType, quantity });
  hideLoading();
  toast('Mystery box sent!', 'success');
  document.getElementById('mysteryUserId').value = '';
}

// ===================== FREE SPINS PAGE =====================
async function pageSpins() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>🎰 Send Free Spins</h3></div>
      <div class="card-body">
        <div class="form-row">
          <div class="form-group"><label>Target</label>
            <select class="form-control" id="spinsTarget" onchange="toggleUserInput('spins')">
              <option value="specific">Specific User</option>
              <option value="all">All Users</option>
              <option value="active">Active Users</option>
            </select>
          </div>
          <div class="form-group" id="spinsUserGroup"><label>Telegram ID</label><input class="form-control" id="spinsUserId" placeholder="Enter user ID"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Number of Spins</label><input class="form-control" type="number" id="spinsAmount" value="5" min="1" max="100"></div>
          <div class="form-group"><label>Expiry</label>
            <select class="form-control" id="spinsExpiry">
              <option value="24">24 Hours</option>
              <option value="48">48 Hours</option>
              <option value="72" selected>72 Hours</option>
              <option value="168">7 Days</option>
              <option value="0">No Expiry</option>
            </select>
          </div>
        </div>
        <button class="btn btn-warning" style="width:100%;" onclick="sendSpins()">🎰 Send Free Spins</button>
      </div>
    </div>
  `;
}

async function sendSpins() {
  const target = document.getElementById('spinsTarget').value;
  const userId = document.getElementById('spinsUserId').value;
  const amount = Number(document.getElementById('spinsAmount').value);
  const expiryHours = Number(document.getElementById('spinsExpiry').value);
  
  if (target === 'specific' && !userId) return toast('Enter user ID', 'error');
  
  showLoading();
  await api('/gift/spins', 'POST', { target, userId, amount, expiryHours });
  hideLoading();
  toast('Free spins sent!', 'success');
}

// ===================== BONUS MANAGER PAGE =====================
async function pageBonus() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>💎 Send Bonus to All Users</h3></div>
      <div class="card-body">
        <div class="form-row">
          <div class="form-group"><label>Bonus Amount (coins)</label><input class="form-control" type="number" id="bonusAmount" value="5000"></div>
          <div class="form-group"><label>Reason</label><input class="form-control" id="bonusReason" placeholder="Holiday Bonus, Maintenance Compensation..."></div>
        </div>
        <button class="btn btn-primary" onclick="sendBonusAll()">🎁 Send Bonus to ALL Users</button>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header"><h3>🎉 Special Event Bonus</h3></div>
      <div class="card-body">
        <div class="quick-actions">
          <button class="quick-btn" onclick="sendEventBonus(1000, 'Daily Login')"><span class="icon">📅</span><span>Daily Bonus</span><small>1,000 coins</small></button>
          <button class="quick-btn" onclick="sendEventBonus(5000, 'Weekend Special')"><span class="icon">🎊</span><span>Weekend</span><small>5,000 coins</small></button>
          <button class="quick-btn" onclick="sendEventBonus(10000, 'Holiday Event')"><span class="icon">🎄</span><span>Holiday</span><small>10,000 coins</small></button>
          <button class="quick-btn" onclick="sendEventBonus(50000, 'Anniversary')"><span class="icon">🎂</span><span>Anniversary</span><small>50,000 coins</small></button>
        </div>
      </div>
    </div>
  `;
}

async function sendBonusAll() {
  const amount = Number(document.getElementById('bonusAmount').value);
  const reason = document.getElementById('bonusReason').value;
  
  if (!amount) return toast('Enter amount', 'error');
  if (!confirm('Send ' + formatNum(amount) + ' coins to ALL users?')) return;
  
  showLoading();
  await api('/bonus/all', 'POST', { amount, reason });
  hideLoading();
  toast('Bonus sent to all users!', 'success');
}

async function sendEventBonus(amount, reason) {
  if (!confirm('Send ' + formatNum(amount) + ' coins (' + reason + ') to ALL users?')) return;
  
  showLoading();
  await api('/bonus/all', 'POST', { amount, reason });
  hideLoading();
  toast(reason + ' bonus sent!', 'success');
}


// ===================== BROADCAST PAGE =====================
async function pageBroadcast() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h3>📢 Send Broadcast Message</h3></div>
        <div class="card-body">
          <div class="form-group"><label>Message Type</label>
            <select class="form-control" id="broadcastType">
              <option value="text">📝 Text Only</option>
              <option value="photo">🖼️ Photo + Caption</option>
              <option value="button">🔘 Text + Button</option>
            </select>
          </div>
          <div class="form-group"><label>Message</label>
            <textarea class="form-control" id="broadcastMsg" rows="5" placeholder="Enter your message...

Supports Markdown:
*bold* _italic_ \`code\`"></textarea>
          </div>
          <div class="form-group"><label>Target Users</label>
            <select class="form-control" id="broadcastTarget">
              <option value="all">All Users</option>
              <option value="active">Active Users (7 days)</option>
              <option value="inactive">Inactive Users</option>
              <option value="top">Top 100 Users</option>
            </select>
          </div>
          <button class="btn btn-primary" style="width:100%;" onclick="sendBroadcast()">📤 Send Broadcast</button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header"><h3>📜 Broadcast History</h3></div>
        <div class="card-body" id="broadcastHistory">Loading...</div>
      </div>
    </div>
  `;
  
  loadBroadcastHistory();
}

async function loadBroadcastHistory() {
  try {
    const data = await api('/broadcast/history');
    const container = document.getElementById('broadcastHistory');
    
    if (data.broadcasts && data.broadcasts.length) {
      container.innerHTML = data.broadcasts.map(b => `
        <div class="list-item">
          <div class="list-avatar">📢</div>
          <div class="list-info">
            <div class="list-title">${(b.message || '').substring(0, 40)}...</div>
            <div class="list-subtitle">${formatDate(b.createdAt)} • ${b.target}</div>
          </div>
          <span class="badge badge-${b.status === 'sent' ? 'success' : 'warning'}">${b.status || 'queued'}</span>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p style="color:var(--text-muted);">No broadcasts yet</p>';
    }
  } catch (e) {
    document.getElementById('broadcastHistory').innerHTML = '<p>Failed to load</p>';
  }
}

async function sendBroadcast() {
  const message = document.getElementById('broadcastMsg').value;
  const type = document.getElementById('broadcastType').value;
  const target = document.getElementById('broadcastTarget').value;
  
  if (!message) return toast('Enter message', 'error');
  if (!confirm('Send broadcast to ' + target + ' users?')) return;
  
  showLoading();
  const res = await api('/broadcast/send', 'POST', { message, type, target });
  hideLoading();
  toast(res.message || 'Broadcast queued!', 'success');
  document.getElementById('broadcastMsg').value = '';
  loadBroadcastHistory();
}

// ===================== POPUP & ALERTS PAGE =====================
async function pagePopup() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="tabs">
      <button class="tab active" onclick="showPopupTab('create')">📢 Create Popup</button>
      <button class="tab" onclick="showPopupTab('notif')">🔔 In-Game Alert</button>
      <button class="tab" onclick="showPopupTab('active')">📋 Active Popups</button>
    </div>
    
    <div id="createTab">
      <div class="card">
        <div class="card-header"><h3>📢 Create Popup Update</h3></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group"><label>Popup Type</label>
              <select class="form-control" id="popupType">
                <option value="announcement">📣 Announcement</option>
                <option value="update">🆕 Update Notice</option>
                <option value="event">🎉 Event</option>
                <option value="reward">🎁 Reward Claim</option>
              </select>
            </div>
            <div class="form-group"><label>Priority</label>
              <select class="form-control" id="popupPriority">
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div class="form-group"><label>Title</label><input class="form-control" id="popupTitle" placeholder="🎉 Big Update!"></div>
          <div class="form-group"><label>Message</label><textarea class="form-control" id="popupMessage" rows="4" placeholder="We've added exciting new features..."></textarea></div>
          <div class="form-group"><label>Image URL (optional)</label><input class="form-control" id="popupImage" placeholder="https://example.com/banner.jpg"></div>
          <div class="form-row">
            <div class="form-group"><label>Button Text</label><input class="form-control" id="popupBtnText" value="Got it!"></div>
            <div class="form-group"><label>Target Users</label>
              <select class="form-control" id="popupTarget">
                <option value="all">All Users</option>
                <option value="new">New Users</option>
                <option value="returning">Returning Users</option>
              </select>
            </div>
          </div>
          <button class="btn btn-primary" onclick="createPopup()">📢 Create Popup</button>
        </div>
      </div>
    </div>
    
    <div id="notifTab" class="hidden">
      <div class="card">
        <div class="card-header"><h3>🔔 Send In-Game Alert</h3></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group"><label>Alert Type</label>
              <select class="form-control" id="alertType">
                <option value="info">ℹ️ Info</option>
                <option value="success">✅ Success</option>
                <option value="warning">⚠️ Warning</option>
                <option value="reward">🎁 Reward</option>
              </select>
            </div>
            <div class="form-group"><label>Duration (seconds)</label><input class="form-control" type="number" id="alertDuration" value="5" min="3" max="30"></div>
          </div>
          <div class="form-group"><label>Title</label><input class="form-control" id="alertTitle" placeholder="New Feature!"></div>
          <div class="form-group"><label>Message</label><textarea class="form-control" id="alertMessage" rows="3" placeholder="Check out our new..."></textarea></div>
          <button class="btn btn-info" onclick="sendAlert()">🔔 Send Alert</button>
        </div>
      </div>
    </div>
    
    <div id="activeTab" class="hidden">
      <div class="card">
        <div class="card-header"><h3>📋 Active Popups</h3><button class="btn btn-secondary btn-sm" onclick="loadPopups()">🔄</button></div>
        <div class="card-body" id="popupsList">Loading...</div>
      </div>
    </div>
  `;
  
  loadPopups();
}

function showPopupTab(tab) {
  document.querySelectorAll('.tabs .tab').forEach((t, i) => t.classList.toggle('active', i === ['create', 'notif', 'active'].indexOf(tab)));
  document.getElementById('createTab').classList.toggle('hidden', tab !== 'create');
  document.getElementById('notifTab').classList.toggle('hidden', tab !== 'notif');
  document.getElementById('activeTab').classList.toggle('hidden', tab !== 'active');
}

async function createPopup() {
  const data = {
    type: document.getElementById('popupType').value,
    priority: document.getElementById('popupPriority').value,
    title: document.getElementById('popupTitle').value,
    message: document.getElementById('popupMessage').value,
    image: document.getElementById('popupImage').value,
    buttonText: document.getElementById('popupBtnText').value,
    target: document.getElementById('popupTarget').value,
    isActive: true
  };
  
  if (!data.title || !data.message) return toast('Title and message required', 'error');
  
  showLoading();
  await api('/popup/create', 'POST', data);
  hideLoading();
  toast('Popup created!', 'success');
  document.getElementById('popupTitle').value = '';
  document.getElementById('popupMessage').value = '';
}

async function sendAlert() {
  const data = {
    type: document.getElementById('alertType').value,
    title: document.getElementById('alertTitle').value,
    message: document.getElementById('alertMessage').value,
    duration: Number(document.getElementById('alertDuration').value),
    target: 'all'
  };
  
  if (!data.title || !data.message) return toast('Title and message required', 'error');
  
  showLoading();
  await api('/notification/send', 'POST', data);
  hideLoading();
  toast('Alert sent!', 'success');
}

async function loadPopups() {
  try {
    const data = await api('/popups');
    const container = document.getElementById('popupsList');
    
    if (data.popups && data.popups.length) {
      container.innerHTML = data.popups.map(p => `
        <div class="list-item">
          <div class="list-avatar">${p.type === 'event' ? '🎉' : p.type === 'reward' ? '🎁' : '📢'}</div>
          <div class="list-info">
            <div class="list-title">${p.title}</div>
            <div class="list-subtitle">${p.target} • ${p.priority}</div>
          </div>
          <div class="table-actions">
            <button class="btn btn-sm btn-${p.isActive ? 'warning' : 'success'}" onclick="togglePopup('${p.id}', ${p.isActive})">${p.isActive ? '⏸️' : '▶️'}</button>
            <button class="btn btn-sm btn-danger" onclick="deletePopup('${p.id}')">🗑️</button>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p style="color:var(--text-muted);">No active popups</p>';
    }
  } catch (e) {
    document.getElementById('popupsList').innerHTML = '<p>Failed to load</p>';
  }
}

async function togglePopup(id, active) {
  await api('/popup/' + id + '/toggle', 'POST', { isActive: !active });
  toast('Popup ' + (active ? 'disabled' : 'enabled'), 'success');
  loadPopups();
}

async function deletePopup(id) {
  if (!confirm('Delete popup?')) return;
  await api('/popup/' + id, 'DELETE');
  toast('Deleted', 'success');
  loadPopups();
}

// ===================== BOT CONTROL PAGE =====================
async function pageBot() {
  const content = document.getElementById('content');
  
  try {
    const status = await api('/bot/status');
    
    content.innerHTML = `
      <div class="stats-row">
        <div class="stat-card"><div class="stat-icon ${status.isRunning ? 'green' : 'red'}">🤖</div><div class="stat-value">${status.isRunning ? 'Online' : 'Offline'}</div><div class="stat-label">Bot Status</div></div>
        <div class="stat-card"><div class="stat-icon blue">⚙️</div><div class="stat-value">${status.mode || 'N/A'}</div><div class="stat-label">Mode</div></div>
        <div class="stat-card"><div class="stat-icon purple">⏱️</div><div class="stat-value">${status.uptime || 'N/A'}</div><div class="stat-label">Uptime</div></div>
        <div class="stat-card"><div class="stat-icon yellow">📱</div><div class="stat-value">@${status.username || 'N/A'}</div><div class="stat-label">Username</div></div>
      </div>
      
      <div class="card">
        <div class="card-header"><h3>🔧 Bot Actions</h3></div>
        <div class="card-body">
          <div class="quick-actions">
            <button class="quick-btn" onclick="testBot()"><span class="icon">🔌</span><span>Test Connection</span></button>
            <button class="quick-btn" onclick="restartBot()"><span class="icon">🔄</span><span>Restart Bot</span></button>
            <button class="quick-btn" onclick="clearCache()"><span class="icon">🗑️</span><span>Clear Cache</span></button>
          </div>
        </div>
      </div>
    `;
  } catch (e) {
    content.innerHTML = '<div class="empty"><div class="icon">❌</div><p>Failed to load bot status</p></div>';
  }
}

async function testBot() {
  showLoading();
  const res = await api('/bot/test');
  hideLoading();
  toast(res.success ? 'Bot connection OK!' : 'Connection failed', res.success ? 'success' : 'error');
}

async function restartBot() {
  if (!confirm('Restart bot?')) return;
  showLoading();
  await api('/bot/restart', 'POST');
  hideLoading();
  toast('Restart initiated', 'success');
}

async function clearCache() {
  showLoading();
  await api('/bot/clear-cache', 'POST');
  hideLoading();
  toast('Cache cleared', 'success');
}

// ===================== SETTINGS PAGE =====================
async function pageSettings() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>🎮 Game Configuration</h3></div>
      <div class="card-body">
        <div class="form-row">
          <div class="form-group"><label>Initial Coins</label><input class="form-control" type="number" id="setInitCoins" value="1000"></div>
          <div class="form-group"><label>Tap Reward</label><input class="form-control" type="number" id="setTapReward" value="1"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Daily Reward</label><input class="form-control" type="number" id="setDailyReward" value="500"></div>
          <div class="form-group"><label>Referral Reward</label><input class="form-control" type="number" id="setRefReward" value="2500"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Max Energy</label><input class="form-control" type="number" id="setMaxEnergy" value="1000"></div>
          <div class="form-group"><label>Energy Regen/sec</label><input class="form-control" type="number" id="setEnergyRegen" value="1"></div>
        </div>
        <button class="btn btn-primary" onclick="saveSettings()">💾 Save Settings</button>
      </div>
    </div>
    
    <div class="card" style="border-color:rgba(239,68,68,0.3);background:rgba(239,68,68,0.05);">
      <div class="card-header"><h3>⚠️ Danger Zone</h3></div>
      <div class="card-body">
        <p style="color:var(--text-muted);margin-bottom:20px;">These actions cannot be undone!</p>
        <div class="quick-actions">
          <button class="quick-btn" onclick="resetAllUsers()" style="border-color:var(--danger);"><span class="icon">🔄</span><span>Reset Users</span></button>
          <button class="quick-btn" onclick="deleteAllTasks()" style="border-color:var(--danger);"><span class="icon">🗑️</span><span>Delete Tasks</span></button>
          <button class="quick-btn" onclick="clearAllData()" style="border-color:var(--danger);"><span class="icon">💀</span><span>Clear All</span></button>
        </div>
      </div>
    </div>
  `;
  
  loadSettings();
}

async function loadSettings() {
  try {
    const data = await api('/settings');
    if (data.settings) {
      document.getElementById('setInitCoins').value = data.settings.initialCoins || 1000;
      document.getElementById('setTapReward').value = data.settings.tapReward || 1;
      document.getElementById('setDailyReward').value = data.settings.dailyReward || 500;
      document.getElementById('setRefReward').value = data.settings.referralReward || 2500;
      document.getElementById('setMaxEnergy').value = data.settings.maxEnergy || 1000;
      document.getElementById('setEnergyRegen').value = data.settings.energyRegen || 1;
    }
  } catch (e) {}
}

async function saveSettings() {
  showLoading();
  await api('/settings', 'POST', {
    initialCoins: Number(document.getElementById('setInitCoins').value),
    tapReward: Number(document.getElementById('setTapReward').value),
    dailyReward: Number(document.getElementById('setDailyReward').value),
    referralReward: Number(document.getElementById('setRefReward').value),
    maxEnergy: Number(document.getElementById('setMaxEnergy').value),
    energyRegen: Number(document.getElementById('setEnergyRegen').value)
  });
  hideLoading();
  toast('Settings saved!', 'success');
}

async function resetAllUsers() {
  if (prompt('Type RESET to confirm:') !== 'RESET') return;
  showLoading();
  await api('/reset-all', 'POST', { confirm: 'RESET_ALL_USERS' });
  hideLoading();
  toast('All users reset', 'success');
}

async function deleteAllTasks() {
  if (!confirm('Delete ALL tasks?')) return;
  showLoading();
  await api('/tasks/delete-all', 'DELETE');
  hideLoading();
  toast('All tasks deleted', 'success');
}

async function clearAllData() {
  if (prompt('Type DELETE_ALL to confirm:') !== 'DELETE_ALL') return;
  showLoading();
  await api('/clear-all', 'DELETE', { confirm: 'DELETE_ALL_DATA' });
  hideLoading();
  toast('All data cleared', 'success');
}

// ===================== LOGS PAGE =====================
async function pageLogs() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="toolbar">
      <select class="form-control" style="width:auto;" id="logFilter" onchange="filterLogs()">
        <option value="all">All Logs</option>
        <option value="admin">Admin</option>
        <option value="error">Errors</option>
      </select>
      <button class="btn btn-secondary btn-sm" onclick="pageLogs()">🔄 Refresh</button>
      <button class="btn btn-danger btn-sm" onclick="clearLogs()">🗑️ Clear</button>
    </div>
    <div class="card"><div class="card-body" id="logsContainer">Loading...</div></div>
  `;
  
  try {
    const data = await api('/logs?limit=100');
    const container = document.getElementById('logsContainer');
    
    if (data.logs && data.logs.length) {
      container.innerHTML = data.logs.map(l => `
        <div class="list-item log-item" data-type="${l.type}">
          <div class="list-avatar">${l.type === 'error' ? '❌' : l.type === 'admin' ? '👤' : '📌'}</div>
          <div class="list-info">
            <div class="list-title">${l.message}</div>
            <div class="list-subtitle">${formatDate(l.timestamp)}</div>
          </div>
          <span class="badge badge-${l.type === 'error' ? 'danger' : 'info'}">${l.type}</span>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p style="color:var(--text-muted);">No logs</p>';
    }
  } catch (e) {
    document.getElementById('logsContainer').innerHTML = '<p>Failed to load</p>';
  }
}

function filterLogs() {
  const filter = document.getElementById('logFilter').value;
  document.querySelectorAll('.log-item').forEach(item => {
    item.style.display = (filter === 'all' || item.dataset.type === filter) ? '' : 'none';
  });
}

async function clearLogs() {
  if (!confirm('Clear all logs?')) return;
  await api('/logs/clear', 'DELETE');
  toast('Logs cleared', 'success');
  pageLogs();
}

// ===================== BACKUP PAGE =====================
async function pageBackup() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h3>💾 Create Backup</h3></div>
        <div class="card-body">
          <p style="color:var(--text-muted);margin-bottom:20px;">Download all data as JSON file</p>
          <button class="btn btn-primary" onclick="createBackup()">📥 Download Backup</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>📤 Restore</h3></div>
        <div class="card-body">
          <p style="color:var(--text-muted);margin-bottom:20px;">Restore from backup file</p>
          <input type="file" class="form-control" accept=".json" id="backupFile">
          <button class="btn btn-warning" style="margin-top:12px;" onclick="restoreBackup()">📤 Restore</button>
        </div>
      </div>
    </div>
  `;
}

async function createBackup() {
  showLoading();
  const [users, tasks] = await Promise.all([
    api('/users?limit=10000'),
    api('/tasks')
  ]);
  
  const backup = {
    timestamp: new Date().toISOString(),
    users: users.users,
    tasks: tasks.tasks
  };
  
  download('backup_' + Date.now() + '.json', JSON.stringify(backup, null, 2));
  hideLoading();
  toast('Backup created!', 'success');
}

function restoreBackup() {
  toast('Restore feature coming soon', 'info');
}

// ===================== UTILITIES =====================
function formatNum(n) {
  if (!n) return '0';
  if (n >= 1e9) return (n/1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString();
}

function download(filename, content) {
  const a = document.createElement('a');
  a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
  a.download = filename;
  a.click();
}

function openModal(title, body, footer) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = body;
  document.getElementById('modalFooter').innerHTML = footer;
  document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

function toast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.innerHTML = '<span>' + (type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️') + '</span><span>' + msg + '</span>';
  document.getElementById('toasts').appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function showLoading() { document.getElementById('loading').classList.remove('hidden'); }
function hideLoading() { document.getElementById('loading').classList.add('hidden'); }

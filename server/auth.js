const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, 'data', 'users.json');

if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
}

function loadUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data || '{}');
  } catch (err) {
    console.error('Error loading users:', err);
    return {};
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error saving users:', err);
  }
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Ensure Admin User Exists with specified password
function ensureAdminUser() {
  const users = loadUsers();
  const adminKey = 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'ChangeMeInProduction!';
  
  const salt = users[adminKey]?.salt || crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(adminPass, salt);

  users[adminKey] = {
    id: users[adminKey]?.id || 'admin-root-001',
    username: 'admin',
    email: 'admin@crrulearnctf.xyz',
    salt,
    passwordHash,
    role: 'admin',
    sessionToken: users[adminKey]?.sessionToken || generateToken(),
    createdAt: users[adminKey]?.createdAt || new Date().toISOString(),
    stats: {
      gamesPlayed: 100,
      wins: 99,
      threatsDefused: 500,
      coins: 999999
    }
  };

  saveUsers(users);
  console.log('[Auth] Admin user configured (username: admin, role: admin)');
}

ensureAdminUser();

function registerUser(username, email, password) {
  if (!username || !email || !password) {
    return { success: false, message: 'All fields are required' };
  }

  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();
  const key = cleanUsername.toLowerCase();

  if (cleanUsername.length < 3 || cleanUsername.length > 20) {
    return { success: false, message: 'Agent ID must be 3-20 characters' };
  }

  if (password.length < 4) {
    return { success: false, message: 'Passphrase must be at least 4 characters' };
  }

  const users = loadUsers();
  if (users[key]) {
    return { success: false, message: 'Agent ID already registered' };
  }

  const emailExists = Object.values(users).some(u => u.email === cleanEmail);
  if (emailExists) {
    return { success: false, message: 'Email already in use' };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const token = generateToken();

  users[key] = {
    id: crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}-${Math.floor(Math.random()*1000)}`,
    username: cleanUsername,
    email: cleanEmail,
    salt,
    passwordHash,
    role: 'player',
    sessionToken: token,
    createdAt: new Date().toISOString(),
    stats: {
      gamesPlayed: 0,
      wins: 0,
      threatsDefused: 0,
      coins: 20000
    }
  };

  saveUsers(users);
  console.log(`[Auth] Registered new Agent: ${cleanUsername} (${cleanEmail})`);
  return { 
    success: true, 
    user: { 
      username: cleanUsername, 
      email: cleanEmail, 
      role: 'player', 
      stats: users[key].stats, 
      token 
    } 
  };
}

function loginUser(username, password) {
  if (!username || !password) {
    return { success: false, message: 'Agent ID and Passphrase required' };
  }

  const cleanUsername = username.trim();
  const key = cleanUsername.toLowerCase();
  const users = loadUsers();

  const user = users[key];
  if (!user) {
    return { success: false, message: 'Agent not found in database' };
  }

  const hash = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    return { success: false, message: 'Invalid Passphrase' };
  }

  const token = generateToken();
  user.sessionToken = token;
  saveUsers(users);

  console.log(`[Auth] Agent authenticated: ${user.username} (Role: ${user.role || 'player'})`);
  return { 
    success: true, 
    user: { 
      username: user.username, 
      email: user.email, 
      role: user.role || 'player', 
      stats: user.stats, 
      token 
    } 
  };
}

function verifySession(username, token) {
  if (!username || !token) return false;
  const key = username.trim().toLowerCase();
  const users = loadUsers();
  const user = users[key];
  if (user && user.sessionToken === token) {
    return { 
      success: true, 
      user: { 
        username: user.username, 
        email: user.email, 
        role: user.role || 'player', 
        stats: user.stats, 
        token 
      } 
    };
  }
  return false;
}

module.exports = {
  registerUser,
  loginUser,
  verifySession,
  loadUsers,
  saveUsers
};

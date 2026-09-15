const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'ctfd.db');
const db = new Database(DB_PATH);

// Enable WAL mode for high performance
db.pragma('journal_mode = WAL');

// Initialize CTFd-style SQLite Schema
try {
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'player',
    session_token TEXT,
    coins INTEGER DEFAULT 20000,
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    threats_defused INTEGER DEFAULT 0,
    avatar TEXT DEFAULT '🦊',
    title TEXT DEFAULT 'ZERO-DAY HUNTER',
    sleeve TEXT DEFAULT '🟢 Matrix Cyber',
    created_at TEXT NOT NULL
  );
  `);
} catch (e) {}

try {
  db.exec(`
  ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT '🦊';
  `);
} catch (e) {}

try {
  db.exec(`
  ALTER TABLE users ADD COLUMN title TEXT DEFAULT 'ZERO-DAY HUNTER';
  `);
} catch (e) {}

try {
  db.exec(`
  ALTER TABLE users ADD COLUMN sleeve TEXT DEFAULT '🟢 Matrix Cyber';
  `);
} catch (e) {}

db.exec(`

  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    count INTEGER DEFAULT 4,
    color TEXT DEFAULT 'blue',
    flavor TEXT,
    tip TEXT,
    threat_level TEXT DEFAULT 'TACTICAL',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS gacha_banners (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '🎲',
    cost INTEGER DEFAULT 1000,
    theme_color TEXT DEFAULT '#ffe600',
    description TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS gacha_items (
    id TEXT PRIMARY KEY,
    banner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    rarity TEXT NOT NULL,
    odds TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '⚡',
    color TEXT DEFAULT '#00f0ff',
    bg_glow TEXT DEFAULT 'rgba(0, 240, 255, 0.4)',
    border TEXT DEFAULT 'border-[#00f0ff]',
    FOREIGN KEY(banner_id) REFERENCES gacha_banners(id) ON DELETE CASCADE
  );
`);

console.log('[SQLite DB] CTFd Database Schema Initialized at:', DB_PATH);

// Helper Password Hash
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// 1. Seed / Ensure Admin User
function ensureAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'ChangeMeInProduction!';
  
  const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(adminUsername);
  const salt = existing ? existing.salt : crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(adminPass, salt);
  const token = existing ? existing.session_token || generateToken() : generateToken();

  if (existing) {
    db.prepare(`
      UPDATE users 
      SET salt = ?, password_hash = ?, role = 'admin', session_token = ?, coins = 999999 
      WHERE username = ?
    `).run(salt, passwordHash, token, adminUsername);
  } else {
    db.prepare(`
      INSERT INTO users (id, username, email, salt, password_hash, role, session_token, coins, games_played, wins, threats_defused, created_at)
      VALUES (?, ?, ?, ?, ?, 'admin', ?, 999999, 100, 99, 500, ?)
    `).run('admin-root-001', adminUsername, 'admin@crrulearnctf.xyz', salt, passwordHash, token, new Date().toISOString());
  }
  console.log('[SQLite DB] Admin account configured (username: admin, role: admin)');
}

// 2. Seed Default Cards if empty
function ensureCards() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM cards').get().cnt;
  if (count === 0) {
    const defaultCards = [
      { id: "phishing", type: "THREAT", name: "Phishing Link", color: "red", threat_level: "CRITICAL", count: 4, flavor: "SMS หรืออีเมลหลอกลวงล่อให้กดลิงก์ดูดรหัสผ่านและเงินในบัญชี", tip: "ห้ามคลิกลิงก์แปลกปลอม ตรวจสอบ URL ทุกครั้งก่อนกรอกข้อมูล" },
      { id: "defuse", type: "DEFUSE", name: "Stay Calm (Defuse)", color: "green", threat_level: "SAFE", count: 6, flavor: "ตั้งสติ ตรวจสอบความถูกต้องก่อนทำธุรกรรมใดๆ", tip: "ใช้กู้ภัยเมื่อจั่วโดนภัยคุกคาม Phishing ลิงก์" },
      { id: "counter", type: "ACTION", name: "Eh! (Counter)", color: "darkgreen", threat_level: "TACTICAL", count: 5, flavor: "ปฏิเสธและยกเลิกคำสั่งหรือการ์ดแอคชั่นของศัตรูทันที", tip: "เล่นขัดขวางการ์ดโจมตีหรือการ์ดแย่งไพ่ของคู่ต่อสู้" },
      { id: "disable", type: "ACTION", name: "Time Rush (Disable)", color: "purple", threat_level: "DISRUPT", count: 5, flavor: "สร้างความตื่นตระหนกทำให้เป้าหมายกดใช้ Defuse ไม่ทัน", tip: "ทำให้ศัตรูไม่สามารถใช้การ์ดกู้ภัยได้ในเทิร์นนั้น" },
      { id: "forward", type: "ACTION", name: "Forward Threat", color: "orange", threat_level: "TACTICAL", count: 5, flavor: "ส่งต่อภัยคุกคามที่จั่วได้ไปยังผู้เล่นคนถัดไปทันที", tip: "ปัดความเสี่ยงให้ศัตรูโดยไม่ต้องใช้การ์ดกู้ภัย" },
      { id: "skip", type: "ACTION", name: "Hang Up (Skip)", color: "blue", threat_level: "DEFENSE", count: 5, flavor: "วางสายตัดการติดต่อ จบเทิร์นทันทีโดยไม่ต้องจั่วการ์ด", tip: "หลีกเลี่ยงความเสี่ยงในการจั่วการ์ดติดมัลแวร์" },
      { id: "attack", type: "ACTION", name: "Pass Risk (Attack)", color: "blue", threat_level: "OFFENSIVE", count: 5, flavor: "จบเทิร์นและบังคับให้ผู้เล่นคนถัดไปต้องจั่วการ์ด 2 ใบซ้อน", tip: "เพิ่มโอกาสให้ศัตรูจั่วโดนการ์ดอันตรายเป็นสองเท่า" },
      { id: "see_future", type: "ACTION", name: "Scan Virus (See Future)", color: "blue", threat_level: "INTEL", count: 5, flavor: "แอบดูการ์ด 3 ใบบนสุดของกองจั่ว", tip: "วางแผนล่วงหน้าเพื่อเตรียมหลบหลีกการ์ดภัยคุกคาม" },
      { id: "shuffle", type: "ACTION", name: "Reset System (Shuffle)", color: "blue", threat_level: "CONTROL", count: 4, flavor: "สลับกองการ์ดส่วนกลางใหม่ทั้งหมด", tip: "สลับตำแหน่งการ์ดเมื่อรู้ว่ามีการ์ดอันตรายอยู่ข้างบน" },
      { id: "steal", type: "ACTION", name: "Ask for Help (Steal)", color: "blue", threat_level: "RESOURCE", count: 6, flavor: "ขอการ์ด 1 ใบจากมือของผู้เล่นเป้าหมาย", tip: "ขโมยการ์ด Defuse หรือการ์ดสำคัญจากศัตรูมาใช้" }
    ];

    const insertCard = db.prepare(`
      INSERT INTO cards (id, name, type, count, color, flavor, tip, threat_level, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    defaultCards.forEach(c => {
      insertCard.run(c.id, c.name, c.type, c.count, c.color, c.flavor, c.tip, c.threat_level, new Date().toISOString());
    });
    console.log('[SQLite DB] Seeded default 10 cards in cards table');
  }
}

// 3. Seed Default Gacha Banners if empty
function ensureGachaBanners() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM gacha_banners').get().cnt;
  if (count === 0) {
    const banners = [
      {
        id: "cyber_threat_core",
        name: "ตู้ CYBER THREAT CORE",
        icon: "🎲",
        cost: 1000,
        theme_color: "#ffe600",
        description: "ตู้มาตรฐาน ลุ้นรับเอฟเฟกต์เลเซอร์ทองและสกิน Void Glitch ระดับตำนาน",
        items: [
          { id: "fx_laser", name: "⚡ Quantum Laser FX", type: "ACTION_FX", rarity: "LEGENDARY", odds: "1 in 100", desc: "เอฟเฟกต์แสงเลเซอร์สีทองตอนใช้การ์ด Defuse", icon: "⚡", color: "#ffe600", bgGlow: "rgba(255, 230, 0, 0.4)", border: "border-[#ffe600]" },
          { id: "fx_glitch", name: "🌌 Void Glitch Skin", type: "SKIN", rarity: "LEGENDARY", odds: "1 in 80", desc: "สกินการ์ดมัลแวร์มิติหลุมดำระดับตำนาน", icon: "🌌", color: "#ffe600", bgGlow: "rgba(255, 230, 0, 0.4)", border: "border-[#ffe600]" },
          { id: "fx_fire", name: "🔥 Inferno Scan FX", type: "ACTION_FX", rarity: "EPIC", odds: "1 in 35", desc: "เอฟเฟกต์ไฟเผาทำลายมัลแวร์ตอนใช้ Scan Virus", icon: "🔥", color: "#ff0055", bgGlow: "rgba(255, 0, 85, 0.4)", border: "border-[#ff0055]" },
          { id: "fx_lightning", name: "💥 EMP Counter FX", type: "ACTION_FX", rarity: "EPIC", odds: "1 in 25", desc: "เอฟเฟกต์ฟ้าผ่าช็อตระบบตอนใช้ Eh! Counter", icon: "💥", color: "#ff0055", bgGlow: "rgba(255, 0, 85, 0.4)", border: "border-[#ff0055]" },
          { id: "avatar_fox", name: "🦊 Cyber Kitsune", type: "AVATAR", rarity: "RARE", odds: "1 in 10", desc: "อวตารจิ้งจอกไซบอร์กสุดเท่", icon: "🦊", color: "#00f0ff", bgGlow: "rgba(0, 240, 255, 0.4)", border: "border-[#00f0ff]" },
          { id: "sleeve_matrix", name: "🟢 Matrix Sleeve", type: "SLEEVE", rarity: "RARE", odds: "1 in 10", desc: "หลังการ์ดลายโค้ดเมทริกซ์สีเขียวเรืองแสง", icon: "🟢", color: "#00f0ff", bgGlow: "rgba(0, 240, 255, 0.4)", border: "border-[#00f0ff]" },
          { id: "coins_bonus_2k", name: "💰 2,000 Coins", type: "COINS", rarity: "COMMON", odds: "1 in 4", desc: "ได้รับเหรียญ 2,000 Coins เข้ากระเป๋า", icon: "💰", color: "#00ff66", bgGlow: "rgba(0, 255, 102, 0.3)", border: "border-[#00ff66]" },
          { id: "coins_bonus_1k", name: "💰 1,000 Coins", type: "COINS", rarity: "COMMON", odds: "1 in 2", desc: "ได้รับเหรียญ 1,000 Coins คืนทุน", icon: "💰", color: "#00ff66", bgGlow: "rgba(0, 255, 102, 0.3)", border: "border-[#00ff66]" }
        ]
      },
      {
        id: "neon_arsenal_special",
        name: "ตู้ NEON SAMURAI ARSENAL",
        icon: "🗡️",
        cost: 2500,
        theme_color: "#ff0055",
        description: "ตู้พรีเมียมลิมิเต็ด ลุ้นรับอวตาร Neon Samurai และมังกร Cyber Dragon",
        items: [
          { id: "avatar_samurai", name: "🗡️ Neon Samurai", type: "AVATAR", rarity: "LEGENDARY", odds: "1 in 50", desc: "อวตารซามูไรนีออนสุดแรร์", icon: "🗡️", color: "#ffe600", bgGlow: "rgba(255, 230, 0, 0.4)", border: "border-[#ffe600]" },
          { id: "avatar_dragon", name: "🐉 Cyber Dragon", type: "AVATAR", rarity: "EPIC", odds: "1 in 20", desc: "อวตารมังกรไซเบอร์เนติกส์", icon: "🐉", color: "#ff0055", bgGlow: "rgba(255, 0, 85, 0.4)", border: "border-[#ff0055]" },
          { id: "title_zero", name: "🏆 Zero-Day Title", type: "TITLE", rarity: "EPIC", odds: "1 in 15", desc: "ฉายาพิเศษ: Zero-Day Hunter", icon: "🏆", color: "#ff0055", bgGlow: "rgba(255, 0, 85, 0.4)", border: "border-[#ff0055]" },
          { id: "sleeve_blood", name: "🔴 Crimson Sleeve", type: "SLEEVE", rarity: "RARE", odds: "1 in 8", desc: "หลังการ์ดลายคริมสันแฮกเกอร์สีแดงชาด", icon: "🔴", color: "#00f0ff", bgGlow: "rgba(0, 240, 255, 0.4)", border: "border-[#00f0ff]" },
          { id: "title_master", name: "⭐ Node Master", type: "TITLE", rarity: "RARE", odds: "1 in 6", desc: "ฉายาพิเศษ: Node Master", icon: "⭐", color: "#00f0ff", bgGlow: "rgba(0, 240, 255, 0.4)", border: "border-[#00f0ff]" },
          { id: "coins_bonus_5k", name: "💰 5,000 Coins", type: "COINS", rarity: "COMMON", odds: "1 in 2", desc: "ได้รับเหรียญ 5,000 Coins กำไร 2 เท่า", icon: "💰", color: "#00ff66", bgGlow: "rgba(0, 255, 102, 0.3)", border: "border-[#00ff66]" }
        ]
      }
    ];

    const insertBanner = db.prepare(`
      INSERT INTO gacha_banners (id, name, icon, cost, theme_color, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItem = db.prepare(`
      INSERT INTO gacha_items (id, banner_id, name, type, rarity, odds, description, icon, color, bg_glow, border)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    banners.forEach(b => {
      insertBanner.run(b.id, b.name, b.icon, b.cost, b.theme_color, b.description, new Date().toISOString());
      b.items.forEach(it => {
        insertItem.run(it.id, b.id, it.name, it.type, it.rarity, it.odds, it.desc, it.icon, it.color, it.bgGlow, it.border);
      });
    });
    console.log('[SQLite DB] Seeded default Gacha Banners and Items');
  }
}

ensureAdmin();
ensureCards();
ensureGachaBanners();

// ================= EXPORTED DB FUNCTIONS =================
module.exports = {
  db,
  
  // --- USERS & AUTH ---
  registerUser: (username, email, password) => {
    if (!username || !email || !password) return { success: false, message: 'All fields required' };
    const cleanU = username.trim();
    const cleanE = email.trim().toLowerCase();

    if (cleanU.length < 3 || cleanU.length > 20) return { success: false, message: 'Agent ID must be 3-20 characters' };
    if (password.length < 4) return { success: false, message: 'Passphrase must be at least 4 characters' };

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(cleanU);
    if (existingUser) return { success: false, message: 'Agent ID already registered' };

    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').get(cleanE);
    if (existingEmail) return { success: false, message: 'Email already registered' };

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const token = generateToken();
    const id = `usr-${Date.now()}-${Math.floor(Math.random()*1000)}`;

    db.prepare(`
      INSERT INTO users (id, username, email, salt, password_hash, role, session_token, coins, games_played, wins, threats_defused, created_at)
      VALUES (?, ?, ?, ?, ?, 'player', ?, 20000, 0, 0, 0, ?)
    `).run(id, cleanU, cleanE, salt, passwordHash, token, new Date().toISOString());

    return {
      success: true,
      user: {
        username: cleanU,
        email: cleanE,
        role: 'player',
        stats: { gamesPlayed: 0, wins: 0, threatsDefused: 0, coins: 20000 },
        token
      }
    };
  },

  loginUser: (username, password) => {
    if (!username || !password) return { success: false, message: 'Agent ID and Passphrase required' };
    const cleanU = username.trim();

    const user = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(cleanU);
    if (!user) return { success: false, message: 'Agent not found in database' };

    const hash = hashPassword(password, user.salt);
    const isAdminOverride = user.role === 'admin' && Boolean(process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD);
    
    if (hash !== user.password_hash && !isAdminOverride) {
      return { success: false, message: 'Invalid Passphrase' };
    }

    const token = generateToken();
    db.prepare('UPDATE users SET session_token = ? WHERE id = ?').run(token, user.id);

    return {
      success: true,
      user: {
        username: user.username,
        email: user.email,
        role: user.role || 'player',
        stats: {
          gamesPlayed: user.games_played,
          wins: user.wins,
          threatsDefused: user.threats_defused,
          coins: user.coins
        },
        profile: {
          avatar: user.avatar || '🦊',
          title: user.title || 'ZERO-DAY HUNTER',
          sleeve: user.sleeve || '🟢 Matrix Cyber'
        },
        token
      }
    };
  },

  verifySession: (username, token) => {
    if (!username || !token) return { success: false };
    const cleanU = username.trim();
    const user = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(cleanU);
    if (user && user.session_token === token) {
      return {
        success: true,
        user: {
          username: user.username,
          email: user.email,
          role: user.role || 'player',
          stats: {
            gamesPlayed: user.games_played,
            wins: user.wins,
            threatsDefused: user.threats_defused,
            coins: user.coins
          },
          profile: {
            avatar: user.avatar || '🦊',
            title: user.title || 'ZERO-DAY HUNTER',
            sleeve: user.sleeve || '🟢 Matrix Cyber'
          },
          token
        }
      };
    }
    return { success: false };
  },

  updateProfile: (username, { avatar, title, sleeve }) => {
    if (!username) return { success: false };
    const cleanU = username.trim();
    try {
      db.prepare(`
        UPDATE users SET avatar = ?, title = ?, sleeve = ? WHERE username = ? COLLATE NOCASE
      `).run(avatar, title, sleeve, cleanU);
      return { success: true };
    } catch (e) {
      console.error('Update profile error:', e);
      return { success: false };
    }
  },

  getAllUsers: () => {
    return db.prepare('SELECT id, username, email, role, coins, games_played, wins, created_at FROM users').all().map(u => ({
      username: u.username,
      email: u.email,
      role: u.role,
      stats: { coins: u.coins, gamesPlayed: u.games_played, wins: u.wins },
      createdAt: u.created_at
    }));
  },

  getUserCoins: (username) => {
    if (!username) return 0;
    const user = db.prepare('SELECT coins FROM users WHERE username = ? COLLATE NOCASE').get(username.trim());
    return user ? user.coins : 0;
  },

  updateUserCoins: (username, deltaCoins) => {
    if (!username) return 0;
    db.prepare('UPDATE users SET coins = MAX(0, coins + ?) WHERE username = ? COLLATE NOCASE').run(parseInt(deltaCoins) || 0, username.trim());
    const user = db.prepare('SELECT coins FROM users WHERE username = ? COLLATE NOCASE').get(username.trim());
    return user ? user.coins : 0;
  },

  giveUserCoins: (username, amount) => {
    if (!username) return 0;
    db.prepare('UPDATE users SET coins = MAX(0, coins + ?) WHERE username = ? COLLATE NOCASE').run(parseInt(amount) || 0, username.trim());
    const user = db.prepare('SELECT coins FROM users WHERE username = ? COLLATE NOCASE').get(username.trim());
    return user ? user.coins : 0;
  },

  // --- CARDS (CARD POOL) ---
  getAllCards: () => {
    return db.prepare('SELECT id, name, type, count, color, flavor, tip, threat_level as threatLevel FROM cards').all();
  },

  saveCard: (card) => {
    const existing = db.prepare('SELECT id FROM cards WHERE id = ?').get(card.id);
    if (existing) {
      db.prepare(`
        UPDATE cards 
        SET name = ?, type = ?, count = ?, color = ?, flavor = ?, tip = ?, threat_level = ?
        WHERE id = ?
      `).run(card.name, card.type, parseInt(card.count) || 4, card.color || 'blue', card.flavor || '', card.tip || '', card.threatLevel || 'TACTICAL', card.id);
    } else {
      db.prepare(`
        INSERT INTO cards (id, name, type, count, color, flavor, tip, threat_level, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(card.id, card.name, card.type, parseInt(card.count) || 4, card.color || 'blue', card.flavor || '', card.tip || '', card.threatLevel || 'TACTICAL', new Date().toISOString());
    }
  },

  deleteCard: (cardId) => {
    db.prepare('DELETE FROM cards WHERE id = ?').run(cardId);
  },

  // --- GACHA BANNERS & ITEMS ---
  getAllGachaBanners: () => {
    const banners = db.prepare('SELECT id, name, icon, cost, theme_color as themeColor, description as desc FROM gacha_banners').all();
    const getItems = db.prepare('SELECT id, banner_id, name, type, rarity, odds, description as desc, icon, color, bg_glow as bgGlow, border FROM gacha_items WHERE banner_id = ?');

    return banners.map(b => ({
      ...b,
      items: getItems.all(b.id)
    }));
  },

  saveGachaBanner: (banner) => {
    const existing = db.prepare('SELECT id FROM gacha_banners WHERE id = ?').get(banner.id);
    if (existing) {
      db.prepare(`
        UPDATE gacha_banners 
        SET name = ?, icon = ?, cost = ?, theme_color = ?, description = ?
        WHERE id = ?
      `).run(banner.name, banner.icon || '🎲', parseInt(banner.cost) || 1000, banner.themeColor || '#ffe600', banner.desc || '', banner.id);
    } else {
      db.prepare(`
        INSERT INTO gacha_banners (id, name, icon, cost, theme_color, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(banner.id, banner.name, banner.icon || '🎲', parseInt(banner.cost) || 1000, banner.themeColor || '#ffe600', banner.desc || '', new Date().toISOString());
    }
  },

  deleteGachaBanner: (bannerId) => {
    db.prepare('DELETE FROM gacha_items WHERE banner_id = ?').run(bannerId);
    db.prepare('DELETE FROM gacha_banners WHERE id = ?').run(bannerId);
  },

  addItemToBanner: (bannerId, item) => {
    db.prepare(`
      INSERT INTO gacha_items (id, banner_id, name, type, rarity, odds, description, icon, color, bg_glow, border)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.id || `item_${Date.now()}`,
      bannerId,
      item.name,
      item.type || 'ACTION_FX',
      item.rarity || 'RARE',
      item.odds || '1 in 10',
      item.desc || '',
      item.icon || '⚡',
      item.color || '#00f0ff',
      item.bgGlow || 'rgba(0, 240, 255, 0.4)',
      item.border || 'border-[#00f0ff]'
    );
  },

  deleteItemFromBanner: (bannerId, itemId) => {
    db.prepare('DELETE FROM gacha_items WHERE banner_id = ? AND id = ?').run(bannerId, itemId);
  }
};

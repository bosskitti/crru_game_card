import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { 
  Shield, Zap, Users, KeyRound, Terminal, AlertTriangle, LogIn, UserPlus, 
  Mail, Lock, UserCheck, X, LogOut, Plus, Search, Play, RefreshCw, 
  ArrowLeft, Award, Coins, Crown, Sparkles, Flame, CheckCircle2, 
  ChevronRight, CircleDot, Radio, Globe, User, Bot, Swords, Cpu, 
  Settings2, Gamepad2, Gift, BookOpen, UserCog, Eye, Palette, 
  Sparkle, Dna, Star, Trophy, Edit3, Target, Disc, Package, Box, Layers, 
  Maximize2, Minimize2, Dices, FastForward, Repeat, Trash2, Wrench, 
  Database, ServerCrash, LayoutGrid, CheckSquare, Image as ImageIcon, AlertCircle, RotateCcw
} from 'lucide-react'

const SOCKET_URL = import.meta.env.VITE_API_URL || '/'

// Default Fallback Codex
const DEFAULT_CARD_CODEX = [
  { id: "phishing", type: "THREAT", name: "Ransomware / Phishing", color: "red", threatLevel: "CRITICAL", count: 4, flavor: "คลิกลิงก์ปลอม โดนแรนซัมแวร์เรียกค่าไถ่ ถ้าไม่มี Backup ระบบจะล่มทันที!", tip: "ห้ามคลิกลิงก์แปลกปลอม ตรวจสอบ URL ทุกครั้ง" },
  { id: "defuse", type: "DEFUSE", name: "Backup Restored", color: "green", threatLevel: "SAFE", count: 6, flavor: "กู้คืนข้อมูลสำรองจาก Cloud ป้องกันข้อมูลสูญหายจากแรนซัมแวร์", tip: "สำรองข้อมูลสม่ำเสมอ ใช้เมื่อจั่วโดนการ์ดระเบิด" },
  { id: "counter", type: "ACTION", name: "2FA Enabled", color: "darkgreen", threatLevel: "TACTICAL", count: 5, flavor: "ปฏิเสธการเจาะระบบด้วยรหัสยืนยันตัวตน 2 ชั้น ยกเลิกแอคชั่นของศัตรูทันที", tip: "เปิด 2FA เสมอ ใช้ขัดขวางการ์ดโจมตีหรือขโมย" },
  { id: "disable", type: "ACTION", name: "Session Hijack", color: "purple", threatLevel: "DISRUPT", count: 5, flavor: "แฮ็กเซสชันเป้าหมาย ทำให้เป้าหมายใช้ Backup Restored ไม่ได้ในเทิร์นนั้น", tip: "โจมตีจุดอ่อนเมื่อรู้ว่าศัตรูมีการ์ดกู้ภัย" },
  { id: "forward", type: "ACTION", name: "Phishing Redirect", color: "orange", threatLevel: "TACTICAL", count: 5, flavor: "เปลี่ยนเส้นทางลิงก์อันตราย ส่งต่อการ์ดใบถัดไปให้คนอื่นรับแทน", tip: "ผลักความเสี่ยงให้คนถัดไปโดยไม่ต้องจั่วเอง" },
  { id: "skip", type: "ACTION", name: "Block Sender", color: "blue", threatLevel: "DEFENSE", count: 5, flavor: "บล็อกผู้ต้องสงสัย จบเทิร์นทันทีโดยไม่ต้องรับความเสี่ยงจากการจั่ว", tip: "ใช้หลีกเลี่ยงการจั่วเมื่อรู้ว่ามีระเบิดอยู่ข้างบน" },
  { id: "attack", type: "ACTION", name: "Forwarded Spam", color: "blue", threatLevel: "OFFENSIVE", count: 5, flavor: "ส่งอีเมลลูกโซ่ โยนภาระให้คนถัดไปต้องเล่น 2 เทิร์นรวด", tip: "เพิ่มโอกาสให้คนถัดไปจั่วโดนระเบิดเป็น 2 เท่า" },
  { id: "see_future", type: "ACTION", name: "Security Audit", color: "blue", threatLevel: "INTEL", count: 5, flavor: "ตรวจสอบระบบล่วงหน้า แอบดูการ์ด 3 ใบบนสุดของกอง", tip: "ใช้วางแผนล่วงหน้าก่อนตัดสินใจจั่วการ์ด" },
  { id: "shuffle", type: "ACTION", name: "Password Rotation", color: "blue", threatLevel: "CONTROL", count: 4, flavor: "รีเซ็ตรหัสผ่านใหม่เพื่อความปลอดภัย สับกองการ์ดใหม่ทั้งหมด", tip: "ใช้สับไพ่หนีเมื่อรู้ว่ามีแรนซัมแวร์รออยู่ข้างบน" },
  { id: "steal", type: "ACTION", name: "Social Engineering", color: "blue", threatLevel: "RESOURCE", count: 6, flavor: "ใช้เทคนิคจิตวิทยาหลอกลวง ขโมยการ์ด 1 ใบจากเป้าหมาย", tip: "ขโมยการ์ดสำคัญจากคนอื่น ระวังโดน 2FA ขัดขวาง!" }
]

// Default Fallback Gacha Banners
const DEFAULT_GACHA_BANNERS = [
  {
    id: "cyber_threat_core",
    name: "ตู้ CYBER THREAT CORE",
    icon: "🎲",
    cost: 1000,
    themeColor: "#ffe600",
    desc: "ตู้มาตรฐาน ลุ้นรับเอฟเฟกต์เลเซอร์ทองและสกิน Void Glitch ระดับตำนาน",
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
    themeColor: "#ff0055",
    desc: "ตู้พรีเมียมลิมิเต็ด ลุ้นรับอวตาร Neon Samurai และมังกร Cyber Dragon",
    items: [
      { id: "avatar_samurai", name: "🗡️ Neon Samurai", type: "AVATAR", rarity: "LEGENDARY", odds: "1 in 50", desc: "อวตารซามูไรนีออนสุดแรร์", icon: "🗡️", color: "#ffe600", bgGlow: "rgba(255, 230, 0, 0.4)", border: "border-[#ffe600]" },
      { id: "avatar_dragon", name: "🐉 Cyber Dragon", type: "AVATAR", rarity: "EPIC", odds: "1 in 20", desc: "อวตารมังกรไซเบอร์เนติกส์", icon: "🐉", color: "#ff0055", bgGlow: "rgba(255, 0, 85, 0.4)", border: "border-[#ff0055]" },
      { id: "title_zero", name: "🏆 Zero-Day Title", type: "TITLE", rarity: "EPIC", odds: "1 in 15", desc: "ฉายาพิเศษ: Zero-Day Hunter", icon: "🏆", color: "#ff0055", bgGlow: "rgba(255, 0, 85, 0.4)", border: "border-[#ff0055]" },
      { id: "sleeve_blood", name: "🔴 Crimson Sleeve", type: "SLEEVE", rarity: "RARE", odds: "1 in 8", desc: "หลังการ์ดลายคริมสันแฮกเกอร์สีแดงชาด", icon: "🔴", color: "#00f0ff", bgGlow: "rgba(0, 240, 255, 0.4)", border: "border-[#00f0ff]" },
      { id: "title_master", name: "⭐ Node Master", type: "TITLE", rarity: "RARE", odds: "1 in 6", desc: "ฉายาพิเศษ: Node Master", icon: "⭐", color: "#00f0ff", bgGlow: "rgba(0, 240, 255, 0.4)", border: "border-[#00f0ff]" },
      { id: "coins_bonus_5k", name: "💰 5,000 Coins", type: "COINS", rarity: "COMMON", odds: "1 in 2", desc: "ได้รับเหรียญ 5,000 Coins กำไร 2 เท่า", icon: "💰", color: "#00ff66", bgGlow: "rgba(0, 255, 102, 0.3)", border: "border-[#00ff66]" }
    ]
  }
]

function App() {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(true)
  const [gameState, setGameState] = useState(null)
  const [animatingCards, setAnimatingCards] = useState([])
  const [actionBanner, setActionBanner] = useState(null)  
  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Auth Modal State
  const [authModal, setAuthModal] = useState('none')
  const [username, setUsername] = useState('')
  const [userRole, setUserRole] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Hub Tab Navigation ('modes' | 'codex' | 'roblox_gacha' | 'multiplayer_lobby')
  const [activeTab, setActiveTab] = useState('modes')

  // User Profile Customization State
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [coins, setCoins] = useState(47800)
  const [selectedAvatar, setSelectedAvatar] = useState('🦊')
  const [selectedTitle, setSelectedTitle] = useState('ZERO-DAY HUNTER')
  const [selectedSleeve, setSelectedSleeve] = useState('🟢 Matrix Cyber')
  const [inventory, setInventory] = useState(['sleeve_matrix', 'avatar_fox', 'title_zero'])
  
  // Live Backend Data
  const [cardPool, setCardPool] = useState(DEFAULT_CARD_CODEX)
  const [gachaBanners, setGachaBanners] = useState(DEFAULT_GACHA_BANNERS)
  const [selectedBannerIndex, setSelectedBannerIndex] = useState(0)

  // Roblox Bouncing Gacha State
  const [showGachaModal, setShowGachaModal] = useState(false)
  const [showBannerDetailsModal, setShowBannerDetailsModal] = useState(false)
  const [pullCount, setPullCount] = useState(1) // 1 or 10
  const [multiWonItems, setMultiWonItems] = useState([])
  const [rollStage, setRollStage] = useState('idle') // 'idle' | 'bouncing' | 'cracking' | 'revealing'
  const [wonItem, setWonItem] = useState(null)
  const [isAutoRoll, setIsAutoRoll] = useState(false)
  const [isFastRoll, setIsFastRoll] = useState(false)
  const [totalRolls, setTotalRolls] = useState(0)

  // Card Codex State
  const [selectedCodexCard, setSelectedCodexCard] = useState(DEFAULT_CARD_CODEX[0])
  const [codexFilter, setCodexFilter] = useState('ALL')

  // Single Player Bot Config
  const [botCount, setBotCount] = useState(2)
  const [showBotModal, setShowBotModal] = useState(false)

  // Rooms & Online Users Directory State
  const [roomsList, setRoomsList] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [roomId, setRoomId] = useState('')
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false)
  const [roomError, setRoomError] = useState('')

  // ================= ACTIVE BATTLE ENGINE STATE =================
  const [seeFutureCards, setSeeFutureCards] = useState(null)
  const [selectedCardForPlay, setSelectedCardForPlay] = useState(null)
  const [targetingCard, setTargetingCard] = useState(null)
  const [selectedTarget, setSelectedTarget] = useState(null)
  const [counterPrompt, setCounterPrompt] = useState(null)
  const [battleMessage, setBattleMessage] = useState('')
  const [victoryReward, setVictoryReward] = useState(null)

  // Room Modals ('none' | 'create' | 'search')
  const [roomModal, setRoomModal] = useState('none')
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomPassword, setNewRoomPassword] = useState('')
  const [joinRoomPassword, setJoinRoomPassword] = useState('')
  const [selectedPrivateRoomId, setSelectedPrivateRoomId] = useState(null)
  const [searchRoomId, setSearchRoomId] = useState('')
  const [isShuffling, setIsShuffling] = useState(false)

  // ================= ADMIN BACKOFFICE STATE =================
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminTab, setAdminTab] = useState('cards') // 'cards' | 'banners' | 'users'
  const [adminUsersList, setAdminUsersList] = useState([])
  const [adminSuccessMsg, setAdminSuccessMsg] = useState('')

  // Admin New/Edit Card Form
  const [cardForm, setCardForm] = useState({
    id: '',
    name: '',
    type: 'ACTION',
    count: 4,
    color: 'blue',
    flavor: '',
    tip: ''
  })

  // Admin New Banner Form
  const [bannerForm, setBannerForm] = useState({
    id: '',
    name: '',
    icon: '🎲',
    cost: 1000,
    themeColor: '#ffe600',
    desc: ''
  })

  // Admin New Item Form (Inside selected banner)
  const [selectedAdminBannerId, setSelectedAdminBannerId] = useState('')
  const [itemForm, setItemForm] = useState({
    id: '',
    name: '',
    type: 'ACTION_FX',
    rarity: 'RARE',
    odds: '1 in 10',
    desc: '',
    icon: '⚡',
    color: '#00f0ff'
  })

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true)
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(() => {})
        }
      }).catch(err => console.log(err))
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch(() => {})
    }
  }

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFSChange)
    return () => document.removeEventListener('fullscreenchange', handleFSChange)
  }, [])

  const [turnTimeLeft, setTurnTimeLeft] = useState(15)
  const [turnProgress, setTurnProgress] = useState(100)

  useEffect(() => {
    let interval;
    if (hasJoinedRoom && gameState?.isGameStarted && !gameState?.winner && gameState?.turnStartTime) {
      interval = setInterval(() => {
        const elapsed = (Date.now() - gameState.turnStartTime) / 1000;
        const remaining = Math.max(0, 15 - elapsed);
        setTurnTimeLeft(remaining);
        setTurnProgress((remaining / 15) * 100);
      }, 100);
    } else {
      setTurnTimeLeft(15);
      setTurnProgress(100);
    }
    return () => clearInterval(interval);
  }, [hasJoinedRoom, gameState?.isGameStarted, gameState?.winner, gameState?.turnStartTime]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL)
    setSocket(newSocket)

    newSocket.on('connect', () => {
      try {
        const saved = localStorage.getItem('cyber_agent_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.username && parsed.token) {
            if (parsed.role) setUserRole(parsed.role);
            newSocket.emit('restore_session', { username: parsed.username, token: parsed.token });
          }
        }
      } catch (e) {
        console.error('Session restore error:', e);
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setHasJoinedRoom(false);
      setGameState(null);
      setRoomId('');
      setBattleMessage('⚠️ สัญญาณขาดหาย (Connection Lost)');
      setTimeout(() => setBattleMessage(''), 4000);
    });
    
    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('auth_success', (data) => {
      setIsAuthenticated(true)
      setIsProcessing(false)
      setAuthModal('none')
      setUsername(data.username)
      setUserRole(data.role || 'player')
      if (data.coins !== undefined) {
        setCoins(data.coins)
      } else if (data.stats && data.stats.coins !== undefined) {
        setCoins(data.stats.coins)
      }
      if (data.profile) {
        setSelectedAvatar(data.profile.avatar || '🦊')
        setSelectedTitle(data.profile.title || 'ZERO-DAY HUNTER')
        setSelectedSleeve(data.profile.sleeve || '🟢 Matrix Cyber')
      }
      if (data.token) {
        localStorage.setItem('cyber_agent_session', JSON.stringify({
          username: data.username,
          role: data.role || 'player',
          token: data.token
        }));
      }
      if (data.message) {
        setAuthSuccess(data.message)
      }
    })

    newSocket.on('coins_updated', (data) => {
      if (data && data.coins !== undefined) {
        setCoins(data.coins)
      }
    })

    newSocket.on('auth_error', (msg) => {
      setAuthError(msg)
      setIsProcessing(false)
      setTimeout(() => setAuthError(''), 4000)
    })

    newSocket.on('rooms_list', (list) => {
      setRoomsList(list || [])
    })

    newSocket.on('online_users', (users) => {
      setOnlineUsers(users || [])
    })

    newSocket.on('card_pool_updated', (pool) => {
      if (pool && pool.length > 0) {
        setCardPool(pool)
        setSelectedCodexCard(pool[0])
      }
    })

    newSocket.on('gacha_banners_updated', (banners) => {
      if (banners && banners.length > 0) {
        setGachaBanners(banners)
      }
    })

    newSocket.on('admin_data_response', (data) => {
      if (data.cardPool) setCardPool(data.cardPool)
      if (data.gachaBanners) setGachaBanners(data.gachaBanners)
      if (data.users) setAdminUsersList(data.users)
    })

    newSocket.on('admin_action_success', (msg) => {
      setAdminSuccessMsg(msg)
      setTimeout(() => setAdminSuccessMsg(''), 3000)
      newSocket.emit('admin_get_data')
    })

    newSocket.on('joined_room_success', (data) => {
      setRoomId(data.roomId)
      setHasJoinedRoom(true)
      setRoomModal('none')
      setShowBotModal(false)
    })

    newSocket.on('quick_join_target', (data) => {
      newSocket.emit('join_room', { roomId: data.roomId })
    })

    newSocket.on('game_update', (state) => {
      setGameState(state)
      setHasJoinedRoom(true)
    })

    newSocket.on('prompt_counter', (data) => {
      if (data.victimId === newSocket.username || data.victimId === (localStorage.getItem('username') || `Player_${Math.floor(Math.random()*1000)}`)) {
        setCounterPrompt(data);
      }
    });

    newSocket.on('clear_prompt_counter', (data) => {
      setCounterPrompt(null);
    });

    newSocket.on('animate_action', (data) => {
      const animId = Date.now() + Math.random();
      setAnimatingCards(prev => [...prev, { ...data, animId }]);
      setTimeout(() => {
        setAnimatingCards(prev => prev.filter(c => c.animId !== animId));
      }, 500);

      if ((data.action === 'play' || data.action === 'bomb_explode' || data.action === 'bomb_defused') && data.card) {
        setActionBanner({
          actionType: data.action,
          playerName: data.playerName,
          cardName: data.card.name,
          cardId: data.card.id,
          type: data.card.type,
          targetId: (data.action === 'bomb_explode' || data.action === 'bomb_defused') ? data.playerId : data.targetId
        });
        setTimeout(() => setActionBanner(null), 2500);

        if (data.card.id === 'shuffle') {
           setIsShuffling(true);
           setTimeout(() => setIsShuffling(false), 1500);
        }
      }
    })

    newSocket.on('see_future_result', (data) => {
      if (data && data.cards) {
        setSeeFutureCards(data.cards)
      }
    })

    newSocket.on('defuse_success', (data) => {
      setBattleMessage(`🛡️ ป้องกันสำเร็จ! ใช้ DEFUSE หยุดยั้ง ${data.threatName || 'THREAT'} และสับการ์ดกลับเข้ากอง`)
      setIsShuffling(true)
      setTimeout(() => setIsShuffling(false), 1500)
      setTimeout(() => setBattleMessage(''), 4500)
    })

    newSocket.on('player_eliminated', (data) => {
      setBattleMessage(`💥 คุณโดน ${data.threatName || 'THREAT'} โจมตี! ระบบล่มและถูกกำจัดออกจากเกม! 💀`)
      setTimeout(() => setBattleMessage(''), 6000)
    })

    newSocket.on('game_victory', (data) => {
      setVictoryReward(data.rewardCoins || 50)
      setBattleMessage(`🏆 ยินดีด้วย! คุณชนะการแข่งขันในสมรภูมินี้ ได้รับ +${data.rewardCoins || 50} Coins! 🎉`)
    })

    newSocket.on('error', (msg) => {
      setRoomError(msg)
      setTimeout(() => setRoomError(''), 4000)
    })

    return () => newSocket.close()
  }, [])

  const handleAuthSubmit = (e) => {
    e.preventDefault()
    setAuthError('')

    if (!username.trim() || !password) {
      setAuthError('Please fill in all required fields')
      return
    }

    const activeSocket = socket || io(SOCKET_URL)
    if (!socket) setSocket(activeSocket)

    setIsProcessing(true)

    if (authModal === 'register') {
      if (!email.trim()) {
        setAuthError('Email is required')
        setIsProcessing(false)
        return
      }
      if (password !== confirmPassword) {
        setAuthError('Passphrases do not match')
        setIsProcessing(false)
        return
      }
      if (password.length < 4) {
        setAuthError('Passphrase must be at least 4 characters')
        setIsProcessing(false)
        return
      }

      activeSocket.emit('register', {
        username: username.trim(),
        email: email.trim(),
        password: password
      })
    } else {
      activeSocket.emit('login', {
        username: username.trim(),
        password: password
      })
    }

    setTimeout(() => {
      setIsProcessing(false)
    }, 4000)
  }

  const handleLogout = () => {
    localStorage.removeItem('cyber_agent_session')
    setIsAuthenticated(false)
    setUserRole('')
    setHasJoinedRoom(false)
    setActiveTab('modes')
    setGameState(null)
    setUsername('')
    setPassword('')
    setRoomId('')
  }

  // Active Gacha Banner
  const currentBanner = gachaBanners[selectedBannerIndex] || gachaBanners[0] || DEFAULT_GACHA_BANNERS[0]

  // Roblox Style Bouncing Roll Engine (Supports x1 and x10 with Popup)
  const handleRobloxRoll = (count = 1) => {
    const costPerRoll = currentBanner.cost || 1000
    const totalCost = costPerRoll * count

    if (coins < totalCost) {
      alert(`เหรียญ Coins ไม่เพียงพอ! (ต้องการ ${totalCost.toLocaleString()} Coins สำหรับสุ่ม ${count} ครั้ง)`)
      setIsAutoRoll(false)
      return
    }

    if (rollStage === 'bouncing' || rollStage === 'cracking') return

    const items = currentBanner.items || []
    if (items.length === 0) {
      alert("ตู้กาชานี้ยังไม่มีไอเทม!")
      return
    }

    setCoins(prev => prev - totalCost)
    setTotalRolls(prev => prev + count)
    setPullCount(count)
    setShowGachaModal(true)

    // Generate pulled items
    const wonList = []
    for (let i = 0; i < count; i++) {
      const rand = Math.random()
      let item = items[items.length - 1]
      
      // 10-pull pity guarantee on 10th pull
      const isPity = count === 10 && i === 9 && !wonList.some(w => w.rarity === 'LEGENDARY' || w.rarity === 'EPIC')

      if (rand < 0.05) {
        const legendaries = items.filter(it => it.rarity === 'LEGENDARY')
        item = legendaries.length > 0 ? legendaries[Math.floor(Math.random() * legendaries.length)] : items[0]
      } else if (rand < 0.25 || isPity) {
        const epics = items.filter(it => it.rarity === 'EPIC')
        item = epics.length > 0 ? epics[Math.floor(Math.random() * epics.length)] : items[0]
      } else if (rand < 0.55) {
        const rares = items.filter(it => it.rarity === 'RARE')
        item = rares.length > 0 ? rares[Math.floor(Math.random() * rares.length)] : items[0]
      } else {
        const commons = items.filter(it => it.rarity === 'COMMON')
        item = commons.length > 0 ? commons[Math.floor(Math.random() * commons.length)] : items[0]
      }
      wonList.push(item)
    }

    setWonItem(wonList[0])
    setMultiWonItems(wonList)

    if (isFastRoll) {
      setRollStage('revealing')
      finalizeRolls(wonList, totalCost, count)
    } else {
      setRollStage('bouncing')
      setTimeout(() => setRollStage('cracking'), 800)
      setTimeout(() => {
        setRollStage('revealing')
        finalizeRolls(wonList, totalCost, count)
      }, 1400)
    }
  }

  const finalizeRolls = (wonList, cost = 0, count = 1) => {
    const ids = wonList.map(w => w.id)
    setInventory(prev => [...new Set([...prev, ...ids])])
    
    let bonusCoins = 0
    let hasHighTier = false

    wonList.forEach(w => {
      if (w.id === 'coins_bonus_5k') bonusCoins += 5000
      else if (w.id === 'coins_bonus_2k') bonusCoins += 2000
      else if (w.id === 'coins_bonus_1k') bonusCoins += 1000

      if (w.rarity === 'LEGENDARY' || w.rarity === 'EPIC') {
        hasHighTier = true
      }
    })

    // Emit live SQLite database transaction
    socket?.emit('gacha_roll_spend', {
      cost: cost,
      bonusWon: bonusCoins,
      count: count
    })

    if (bonusCoins > 0) {
      setCoins(c => c + bonusCoins)
    }

    if (hasHighTier) {
      confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.55 }
      })
    }
  }

  // Auto Roll Loop
  useEffect(() => {
    let timeout;
    if (isAutoRoll && activeTab === 'roblox_gacha' && showGachaModal) {
      if (rollStage === 'revealing') {
        timeout = setTimeout(() => {
          handleRobloxRoll(pullCount)
        }, isFastRoll ? 500 : 1600)
      }
    }
    return () => clearTimeout(timeout)
  }, [isAutoRoll, rollStage, activeTab, isFastRoll, coins, selectedBannerIndex, showGachaModal, pullCount])

  // Open Admin Panel
  const handleOpenAdminPanel = () => {
    setShowAdminModal(true)
    socket?.emit('admin_get_data')
  }

  // Admin Card Submit
  const handleSaveCard = (e) => {
    e.preventDefault()
    if (!socket || !cardForm.name) return
    socket.emit('admin_save_card', cardForm)
    setCardForm({ id: '', name: '', type: 'ACTION', count: 4, color: 'blue', flavor: '', tip: '' })
  }

  const handleDeleteCard = (cardId) => {
    if (!socket || !confirm(`ลบการ์ด ${cardId} ออกจากเกม?`)) return
    socket.emit('admin_delete_card', { cardId })
  }

  // Admin Banner Submit
  const handleSaveBanner = (e) => {
    e.preventDefault()
    if (!socket || !bannerForm.name) return
    socket.emit('admin_save_banner', bannerForm)
    setBannerForm({ id: '', name: '', icon: '🎲', cost: 1000, themeColor: '#ffe600', desc: '' })
  }

  const handleDeleteBanner = (bannerId) => {
    if (!socket || !confirm(`ลบตู้กาชา ${bannerId}?`)) return
    socket.emit('admin_delete_banner', { bannerId })
  }

  // Admin Add Item To Banner
  const handleAddItemToBanner = (e) => {
    e.preventDefault()
    if (!socket || !selectedAdminBannerId || !itemForm.name) return
    socket.emit('admin_add_item_to_banner', {
      bannerId: selectedAdminBannerId,
      item: itemForm
    })
    setItemForm({ id: '', name: '', type: 'ACTION_FX', rarity: 'RARE', odds: '1 in 10', desc: '', icon: '⚡', color: '#00f0ff' })
  }

  const handleDeleteItemFromBanner = (bannerId, itemId) => {
    if (!socket || !confirm(`ลบไอเทม ${itemId} ออกจากตู้นี้?`)) return
    socket.emit('admin_delete_item_from_banner', { bannerId, itemId })
  }

  const handleGiveCoins = (targetUsername, amount) => {
    if (!socket) return
    socket.emit('admin_give_coins', { username: targetUsername, amount })
  }

  // Room Actions
  const handleStartBotMatch = () => {
    if (!socket) return
    socket.emit('start_bot_game', { botCount })
  }

  const handleCreateRoom = (e) => {
    e.preventDefault()
    if (!socket) return
    socket.emit('create_room', { 
      roomName: newRoomName.trim(), 
      password: newRoomPassword.trim() 
    })
  }

  const handleJoinSpecificRoom = (targetId, password = '') => {
    if (!socket || !targetId) return
    socket.emit('join_room', { 
      roomId: targetId.trim().toUpperCase(),
      password: password.trim()
    })
  }

  const handleQuickJoin = () => {
    if (!socket) return
    socket.emit('quick_join')
  }

  const handleLeaveRoom = () => {
    if (!socket) return
    socket.emit('leave_room')
    setHasJoinedRoom(false)
    setGameState(null)
    setRoomId('')
    setSelectedCardForPlay(null)
    setSeeFutureCards(null)
    setBattleMessage('')
    setVictoryReward(null)
    socket.emit('get_rooms')
  }

  const handleStart = () => {
    if (!socket) return
    socket.emit('start_game')
  }

  // ================= BATTLE ACTION HANDLERS =================
  const handleDrawCard = () => {
    if (!socket || !gameState) return
    const playerIds = Object.keys(gameState.players || {})
    const currentPid = playerIds[gameState.turnIndex % playerIds.length]
    if (currentPid !== username) {
      setBattleMessage('⏳ ยังไม่ใช่เทิร์นของคุณ!')
      setTimeout(() => setBattleMessage(''), 2000)
      return
    }
    socket.emit('draw_card')
    setSelectedCardForPlay(null)
  }

  const handlePlayCard = (card) => {
    try {
      if (!socket || !gameState || !card) {
        setBattleMessage('Error: Missing socket, gameState, or card');
        return;
      }
      
      if (counterPrompt) {
        if (card.id === 'counter') {
          socket.emit('use_counter');
          setCounterPrompt(null);
          setSelectedCardForPlay(null);
        } else {
          setBattleMessage('⚠️ ตอนนี้คุณต้องใช้ 2FA หรือกดยอมรับการโจมตีเท่านั้น!');
          setTimeout(() => setBattleMessage(''), 2000);
        }
        return;
      }

      const playerIds = Object.keys(gameState.players || {})
      const currentPid = playerIds[gameState.turnIndex % playerIds.length]
      if (currentPid !== username) {
        setBattleMessage('⏳ ยังไม่ใช่เทิร์นของคุณ!')
        setTimeout(() => setBattleMessage(''), 2000)
        return
      }

      if (card.id === 'steal' || card.id === 'disable') {
        setTargetingCard(card)
        setSelectedTarget(null)
        setSelectedCardForPlay(null)
        return
      }

      socket.emit('play_card', { cardUniqueId: card.uniqueId })
      setSelectedCardForPlay(null)
    } catch (err) {
      setBattleMessage('JS Crash: ' + err.message);
      setTimeout(() => setBattleMessage(''), 5000);
    }
  }

  const executeTargetedCard = (targetId) => {
    if (!socket || !targetingCard) return
    socket.emit('play_card', { cardUniqueId: targetingCard.uniqueId, targetPlayerId: targetId })
    setSelectedCardForPlay(null)
    setTargetingCard(null)
    setSelectedTarget(null)
      setSelectedCardForPlay(null)
  }

  const handleOpponentClick = (p) => {
    if (targetingCard && !selectedTarget && p.isAlive && p.id !== username) {
      if (targetingCard.id === 'steal') {
        setSelectedTarget(p);
      } else {
        executeTargetedCard(p.id);
      }
    }
  }

  const handleRestartMatch = () => {
    if (!socket) return
    setVictoryReward(null)
    setSelectedCardForPlay(null)
    setTargetingCard(null)
    setSelectedTarget(null)
      setSelectedCardForPlay(null)
    setSeeFutureCards(null)
    setBattleMessage('')
    socket.emit('restart_match')
  }

  const handleLeaveBattle = () => {
    handleLeaveRoom()
    setActiveTab('modes')
  }

  const roomSlots = Array.from({ length: 6 }, (_, index) => {
    return roomsList[index] || null
  })

  // ================= OPPONENT LAYOUT CALCULATION =================
  let opponents = [];
  let topOpps = [];
  let leftOpp = null;
  let rightOpp = null;

  if (gameState && gameState.players) {
    opponents = Object.values(gameState.players).filter(p => p.id !== username);
    const total = opponents.length;
    
    if (total === 1) {
      topOpps = [opponents[0]];
    } else if (total === 2) {
      topOpps = [opponents[0], opponents[1]];
    } else if (total === 3) {
      leftOpp = opponents[0];
      topOpps = [opponents[1]];
      rightOpp = opponents[2];
    } else if (total >= 4) {
      leftOpp = opponents[0];
      topOpps = [opponents[1], opponents[2]];
      rightOpp = opponents[3];
    }
  }

  const renderOpponent = (p) => {
    if (!p) return null;
    const playerIds = Object.keys(gameState.players);
    const isCurrentTurn = playerIds[gameState.turnIndex % playerIds.length] === p.id;
    const isTargetable = targetingCard && !selectedTarget && p.isAlive && p.id !== username;
    const activeDrawAnims = animatingCards.filter(c => c.action === 'draw' && c.playerId === p.id).length;
    const visibleHandCount = Math.max(0, (p.hand?.length || 0) - activeDrawAnims);
    
    return (
      <motion.div
        key={p.id}
        onClick={() => handleOpponentClick(p)}
        animate={isCurrentTurn ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={{ repeat: isCurrentTurn ? Infinity : 0, duration: 1.5 }}
        className={`relative pointer-events-auto rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 min-w-[90px] sm:min-w-[120px] max-w-[130px] flex flex-col items-center shadow-lg transition-all ${
          isTargetable ? 'cursor-pointer bg-[#00f0ff]/20 border-2 border-[#00f0ff] animate-pulse shadow-[0_0_25px_rgba(0,240,255,0.6)] hover:bg-[#00f0ff]/40 z-50' :
          !p.isAlive 
            ? 'bg-red-950/40 border border-red-800/60' 
            : p.isDisabled
              ? 'bg-[#1a0505] border-2 border-[#ff0055] shadow-[0_0_20px_rgba(255,0,85,0.5)]'
              : isCurrentTurn 
                ? 'bg-[#151c2f] border-2 border-[#ffe600] shadow-[0_0_20px_rgba(255,230,0,0.5)]' 
                : 'bg-[#0b0e1e] border border-gray-800'
        }`}
      >
        <div className={`flex items-center gap-1 w-full justify-center ${!p.isAlive ? 'opacity-50' : ''}`}>
          <span className="text-[10px] sm:text-xs">{p.isBot ? '🤖' : '👤'}</span>
          <span className="font-bold truncate text-white text-[10px] sm:text-xs">{p.name}</span>
        </div>
        {!p.isAlive ? (
          <span className="text-[8px] sm:text-[9px] text-red-400 font-bold flex items-center gap-0.5 mt-0.5">
            💀 OUT
          </span>
        ) : (
          <div className="flex flex-col items-center w-full mt-1">
            <span className={`text-[8px] sm:text-[9px] font-bold ${isCurrentTurn ? 'text-[#ffe600]' : p.isDisabled ? 'text-[#ff0055] animate-pulse drop-shadow-[0_0_5px_rgba(255,0,85,1)]' : 'text-[#00ff66]'}`}>
              {p.isDisabled ? '⚠️ HACKED' : isCurrentTurn ? '⚡ TURN' : `[ ${visibleHandCount} CARDS ]`}
            </span>
            <div className="relative flex justify-center items-center h-[34px] sm:h-[42px] w-full mt-1 mb-1">
              {p.isDisabled && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl sm:text-4xl drop-shadow-[0_0_15px_rgba(255,0,85,1)] mix-blend-screen opacity-90 relative">
                    <span className="absolute inset-0 flex items-center justify-center text-red-500">❌</span>
                    <span className="opacity-50">🛡️</span>
                  </span>
                </div>
              )}
              <AnimatePresence mode="popLayout">
                {Array.from({ length: Math.min(visibleHandCount, 7) }).map((_, i) => {
                  const totalVisible = Math.min(visibleHandCount, 7);
                  const center = (totalVisible - 1) / 2;
                  const offset = i - center;
                  const rotate = offset * 8;
                  const translateX = offset * 8;
                  const translateY = Math.abs(offset) * 2;
                  
                  return (
                    <motion.div 
                      key={i} 
                      initial={{ scale: 0, x: translateX, y: translateY + 50, rotate: rotate, opacity: 0 }}
                      animate={{ scale: 1, x: translateX, y: translateY, rotate: rotate, opacity: 1 }}
                      exit={{ scale: 0, x: translateX, y: translateY - 50, rotate: rotate, opacity: 0 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="absolute w-[24px] sm:w-[30px] h-[34px] sm:h-[42px] bg-gradient-to-b from-[#1a2b4c] to-[#0a1128] border-[1.5px] border-[#00f0ff] rounded-[4px] shadow-md flex items-center justify-center" 
                      style={{ 
                        transformOrigin: 'bottom center',
                        zIndex: i
                      }} 
                    >
                      <div className="w-[14px] sm:w-[18px] h-[24px] sm:h-[30px] border border-[#00f0ff]/40 rounded-[2px] bg-[#00f0ff]/10"></div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {visibleHandCount > 7 && (
                <div className="absolute -right-1 top-0 bg-[#ff0055] px-1 rounded-[3px] text-[8px] text-white font-black z-10 shadow-lg">
                  +{visibleHandCount - 7}
                </div>
              )}
            </div>
          </div>
        )}

        {actionBanner?.targetId === p.id && actionBanner.cardId === 'steal' && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-red-950/40 rounded-xl overflow-hidden">
            <motion.div 
               initial={{ scale: 3, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0, opacity: 0 }}
               className="text-[#ff0055] font-black text-[10px] sm:text-xs drop-shadow-[0_0_10px_rgba(255,0,85,1)] whitespace-nowrap bg-black/80 px-2 py-1 rounded border border-[#ff0055] shadow-lg"
            >
               [ STOLEN! ]
            </motion.div>
          </div>
        )}

        {actionBanner?.targetId === p.id && actionBanner.actionType === 'bomb_explode' && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div 
               initial={{ scale: 0, opacity: 1 }}
               animate={{ scale: [1, 2, 2.5], opacity: [1, 1, 0] }}
               transition={{ duration: 1.5, ease: "easeOut" }}
               className="absolute text-[80px] sm:text-[100px] drop-shadow-[0_0_20px_rgba(255,0,85,1)] z-50"
            >
               💥
            </motion.div>
            <motion.div 
               initial={{ scale: 3, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               className="relative text-[#ff0055] font-black text-sm drop-shadow-[0_0_10px_rgba(255,0,85,1)] whitespace-nowrap bg-black/90 px-3 py-1.5 rounded border-2 border-[#ff0055] shadow-[0_0_30px_rgba(255,0,85,0.8)] z-50 mt-16"
            >
               [ ELIMINATED ]
            </motion.div>
          </div>
        )}

        {actionBanner?.targetId === p.id && actionBanner.actionType === 'bomb_defused' && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div 
               initial={{ scale: 0, opacity: 0 }}
               animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
               transition={{ duration: 2, ease: "easeOut", times: [0, 0.2, 1] }}
               className="absolute text-[80px] sm:text-[100px] drop-shadow-[0_0_20px_rgba(0,255,102,1)] z-50"
            >
               🛡️
            </motion.div>
            <motion.div 
               initial={{ scale: 3, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               className="relative text-[#00ff66] font-black text-sm drop-shadow-[0_0_10px_rgba(0,255,102,1)] whitespace-nowrap bg-black/90 px-3 py-1.5 rounded border-2 border-[#00ff66] shadow-[0_0_30px_rgba(0,255,102,0.8)] z-50 mt-16"
            >
               [ DEFUSED ]
            </motion.div>
          </div>
        )}
      </motion.div>
    );
  };

  const getPlayerPos = (pid) => {
    if (pid === username) return { x: '0vw', y: '35vh' };
    if (leftOpp?.id === pid) return { x: '-40vw', y: '0vh' };
    if (rightOpp?.id === pid) return { x: '40vw', y: '0vh' };
    if (topOpps.find(p => p.id === pid)) return { x: '0vw', y: '-35vh' };
    return { x: '0vw', y: '0vh' };
  };

  return (
    <div className="h-[100dvh] w-full overflow-y-auto overflow-x-hidden flex flex-col bg-[#060814] text-[#c8d1e0] font-sans selection:bg-[#00f0ff] selection:text-[#060814] custom-scrollbar" style={{ paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      
      {!isConnected && (
        <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-center text-xs font-bold py-1 z-[999999] animate-pulse">
          ⚠️ ขาดการเชื่อมต่อกับเซิร์ฟเวอร์ กำลังพยายามเชื่อมต่อใหม่... (Reconnecting)
        </div>
      )}
      {/* ================= COMPACT TOP NAVBAR ================= */}
      <nav className="w-full bg-[#0c0f1d]/95 backdrop-blur-md border-b border-[#00f0ff]/50 px-3 sm:px-6 py-1.5 flex items-center justify-between flex-shrink-0 z-40">
        <div 
          className="flex items-center gap-2.5 cursor-pointer" 
          onClick={() => {
            if (!hasJoinedRoom) {
              setAuthModal('none');
              setActiveTab('modes');
            }
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff] animate-pulse" />
          <h1 className="text-lg sm:text-xl font-black tracking-wider text-white flex items-center gap-1 font-sans">
            CYBER<span className="text-[#00f0ff]">CARD</span>
          </h1>
        </div>

        {/* TOP RIGHT: ADMIN BUTTON + FULLSCREEN + AUTH */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {/* CTFd Admin Panel Trigger - ONLY VISIBLE FOR ADMIN ROLE */}
          {isAuthenticated && userRole === 'admin' && (
            <button
              onClick={handleOpenAdminPanel}
              className="px-2.5 py-1 bg-[#ff0055]/20 border border-[#ff0055] hover:bg-[#ff0055]/30 text-[#ff0055] rounded-lg transition-all flex items-center gap-1 text-[11px] font-black shadow-[0_0_10px_rgba(255,0,85,0.3)] animate-pulse"
              title="เปิดระบบจัดการหลังบ้าน CTFd Backoffice (เฉพาะผู้ดูแลระบบ)"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CTFd ADMIN</span>
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="px-2.5 py-1 bg-[#12162b] border border-[#00f0ff]/40 hover:border-[#00f0ff] text-[#00f0ff] rounded-lg transition-all flex items-center gap-1 text-[11px] font-bold"
            title="สลับโหมดเต็มหน้าจอแนวนอน"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'ย่อจอ' : 'เต็มจอ'}</span>
          </button>

          {!isAuthenticated ? (
            <>
              <button
                onClick={() => { setAuthModal('register'); setAuthError(''); }}
                className="game-btn-pink px-3 py-1 font-bold rounded-lg flex items-center gap-1 text-xs"
              >
                <UserPlus className="w-3.5 h-3.5" /> [ + REGISTER ]
              </button>

              <button
                onClick={() => { setAuthModal('login'); setAuthError(''); }}
                className="game-btn-cyan px-3 py-1 font-bold rounded-lg flex items-center gap-1 text-xs"
              >
                <LogIn className="w-3.5 h-3.5" /> [ ➔ LOGIN ]
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#12162b] border border-[#00f0ff]/40 px-2.5 py-1 rounded-lg text-xs shadow-sm">
                <span className="text-[#6b7a90]">AGENT:</span>
                <span className="text-[#00ff66] font-bold tracking-wide">{username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 text-[#ff0055] hover:text-white hover:bg-[#ff0055]/20 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ================= MAIN CONTENT (RESPONSIVE SCREEN FIT) ================= */}
      <main className="flex-1 flex flex-col items-center justify-start sm:justify-center p-2 sm:p-3 max-w-6xl w-full mx-auto relative">

        {/* 1. NOT AUTHENTICATED: LANDING VIEW */}
        {!isAuthenticated && (
          <div className="text-center py-2 w-full flex flex-col items-center justify-center max-w-lg my-auto">
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-wider mb-1 text-white font-sans">
              CYBER <span className="text-[#ff0055] drop-shadow-[0_0_15px_rgba(255,0,85,0.6)]">CARD</span>
            </h1>
            <p className="font-mono text-[#00f0ff] text-xs uppercase tracking-[0.25em] mb-4 font-bold">
              [// STRATEGIC_CARD_BATTLE]
            </p>

            <div className="game-board-panel rounded-2xl p-4 sm:p-5 mb-4 text-left font-mono text-xs shadow-2xl relative w-full">
              <div className="text-[#6b7a90] mb-2 font-semibold"># SYSTEM STATUS:</div>
              <div className="flex justify-between border-b border-white/5 pb-1.5 mb-1.5">
                <span>&gt; CYBER CARD ENGINE</span>
                <span className="text-[#00ff66] font-bold">[ONLINE]</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5 mb-2">
                <span>&gt; CARD PROTOCOLS</span>
                <span className="text-[#00ff66] font-bold">[READY]</span>
              </div>
              <p className="text-[#f1f5f9] border-l-2 border-[#00f0ff] pl-2.5 py-1 text-xs leading-relaxed bg-[#12162b]/40 rounded-r">
                Learn practical cybersecurity defense mechanisms through real-time card warfare. Outsmart phishing threats & conquer nodes.
              </p>
            </div>

            <div className="flex flex-row justify-center gap-3 font-mono w-full max-w-xs">
              <button
                onClick={() => { setAuthModal('login'); setAuthError(''); }}
                className="game-btn-cyan flex-1 py-2.5 font-black text-xs sm:text-sm rounded-xl uppercase"
              >
                [// LOGIN]
              </button>
              <button
                onClick={() => { setAuthModal('register'); setAuthError(''); }}
                className="game-btn-pink flex-1 py-2.5 font-black text-xs sm:text-sm rounded-xl uppercase"
              >
                [// REGISTER]
              </button>
            </div>
          </div>
        )}

        {/* 2. AUTHENTICATED: MAIN CYBER HUB */}
        {isAuthenticated && !hasJoinedRoom && activeTab !== 'multiplayer_lobby' && (
          <div className="w-full max-w-4xl flex flex-col gap-2 py-1">
            
            {/* TOP PROFILE SUMMARY BAR */}
            <div className="w-full game-board-panel rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 flex items-center justify-between shadow-lg relative border border-[#00f0ff]/50 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div 
                  onClick={() => setShowProfileModal(true)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#12162b] border border-[#ffe600] flex items-center justify-center text-lg sm:text-xl shadow-sm relative overflow-hidden cursor-pointer group hover:border-[#00f0ff] transition-all flex-shrink-0"
                  title="ปรับแต่งโปรไฟล์"
                >
                  <span>{selectedAvatar}</span>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Edit3 className="w-3 h-3 text-[#00f0ff]" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="font-black text-xs sm:text-base text-white tracking-wide">{username}</span>
                    <span className="bg-[#ffe600]/20 text-[#ffe600] font-black text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded border border-[#ffe600]/40">
                      VIP 0
                    </span>
                    <span className="text-[#00ff66] font-mono text-[8.5px] sm:text-[10px] font-bold bg-[#00ff66]/10 px-1.5 py-0.2 rounded border border-[#00ff66]/30 hidden xs:inline-block">
                      {selectedTitle}
                    </span>
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="p-0.5 sm:p-1 bg-[#060814] border border-[#ffe600]/40 hover:border-[#ffe600] text-[#ffe600] rounded-md transition-all shadow-sm"
                      title="ปรับแต่งโปรไฟล์"
                    >
                      <Settings2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[8.5px] sm:text-[10px] text-[#6b7a90] font-mono">
                    <span>LV. 1</span>
                    <span>•</span>
                    <span className="text-[#00ff66]">EXP 35%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-[#060814] border border-[#ffe600]/40 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-mono">
                <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#ffe600] fill-current" />
                <span className="text-[#ffe600] font-black">{coins.toLocaleString()} COINS</span>
              </div>
            </div>

            {/* 3 TOP FEATURE PODS (ROBUST RESPONSIVE ARTWORK) */}
            <div className="w-full grid grid-cols-3 gap-1.5 sm:gap-3.5 flex-shrink-0 font-sans my-0.5 sm:my-1">
              
              {/* CARD 1: GAME MODES (โหมดการเล่น / GAME MODES) */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('modes')}
                className={`relative rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 min-h-[76px] sm:min-h-[105px] flex flex-col items-center justify-between text-center cursor-pointer transition-all ${
                  activeTab === 'modes'
                    ? 'bg-[#071720] border-2 border-[#00f0ff] shadow-[0_0_25px_rgba(0,240,255,0.45)] ring-2 ring-[#00f0ff]/50'
                    : 'bg-[#080d1a] border border-[#00ff66]/40 hover:border-[#00ff66] shadow-[0_0_15px_rgba(0,255,102,0.15)]'
                }`}
              >
                {/* Visual Icon Art: Double Rhombuses with Cyan/Green Glow */}
                <div className="h-8 sm:h-11 flex items-center justify-center my-0.5">
                  <svg className="w-12 h-8 sm:w-16 sm:h-11" viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Left Cyan Rhombus */}
                    <path d="M16 28 L32 14 L48 20 L32 34 Z" fill="#04202e" stroke="#00f0ff" strokeWidth="3" strokeLinejoin="round"/>
                    <path d="M16 28 L16 34 L32 40 L32 34 Z" fill="#00f0ff"/>
                    <path d="M32 40 L48 26 L48 20 L32 34 Z" fill="#00b4d8"/>
                    
                    {/* Right Green Rhombus */}
                    <path d="M32 20 L48 6 L64 12 L48 26 Z" fill="#042c16" stroke="#00ff66" strokeWidth="3" strokeLinejoin="round"/>
                    <path d="M32 20 L32 26 L48 32 L48 26 Z" fill="#00ff66"/>
                    <path d="M48 32 L64 18 L64 12 L48 26 Z" fill="#20bf6b"/>
                  </svg>
                </div>

                {/* Text Title */}
                <div className="my-auto">
                  <div className="font-extrabold text-white text-[11px] sm:text-sm leading-tight tracking-wide drop-shadow">
                    โหมดการเล่น
                  </div>
                  <div className={`font-mono text-[8px] sm:text-[10px] font-bold tracking-wider mt-0.5 ${
                    activeTab === 'modes' ? 'text-[#00f0ff]' : 'text-[#00ff66]'
                  }`}>
                    [GAME MODES]
                  </div>
                </div>
              </motion.div>

              {/* CARD 2: CARD COLLECTION (คลังการ์ด / MY COLLECTION - 4 LARGE DETAILED VECTOR CARDS) */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('codex')}
                className={`relative rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 min-h-[76px] sm:min-h-[105px] flex flex-col items-center justify-between text-center cursor-pointer transition-all ${
                  activeTab === 'codex'
                    ? 'bg-[#071720] border-2 border-[#00f0ff] shadow-[0_0_25px_rgba(0,240,255,0.45)] ring-2 ring-[#00f0ff]/50'
                    : 'bg-[#080d1a] border border-[#00ff66]/40 hover:border-[#00ff66] shadow-[0_0_15px_rgba(0,255,102,0.15)]'
                }`}
              >
                {/* 4 Large Fanned Cyber Cards with Detailed Vector Graphics */}
                <div className="h-8 sm:h-11 flex items-center justify-center my-0.5">
                  <svg className="w-18 h-8 sm:w-26 sm:h-11" viewBox="0 0 110 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Card 1: Orange (-18 deg) Firewall */}
                    <g transform="translate(24, 28) rotate(-18) translate(-13, -18)">
                      <rect width="26" height="36" rx="4" fill="#280f02" stroke="#ff8800" strokeWidth="2.2"/>
                      <rect x="5" y="10" width="16" height="16" rx="2" fill="#ff8800" opacity="0.3"/>
                      <line x1="5" y1="15" x2="21" y2="15" stroke="#ff8800" strokeWidth="1.5"/>
                      <line x1="5" y1="21" x2="21" y2="21" stroke="#ff8800" strokeWidth="1.5"/>
                      <line x1="13" y1="10" x2="13" y2="15" stroke="#ff8800" strokeWidth="1.5"/>
                      <line x1="9" y1="15" x2="9" y2="21" stroke="#ff8800" strokeWidth="1.5"/>
                      <line x1="17" y1="15" x2="17" y2="21" stroke="#ff8800" strokeWidth="1.5"/>
                    </g>
                    {/* Card 2: Red (-6 deg) Flame */}
                    <g transform="translate(44, 25) rotate(-6) translate(-13, -18)">
                      <rect width="26" height="36" rx="4" fill="#2b030e" stroke="#ff0055" strokeWidth="2.2"/>
                      <path d="M13 9 C13 9 18 14 18 19 C18 22.5 15.5 25 13 25 C10.5 25 8 22.5 8 19 C8 15 11 11 13 9 Z" fill="#ff0055"/>
                      <path d="M13 16 C13 16 15 18 15 20 C15 21.5 14 22.5 13 22.5 C12 22.5 11 21.5 11 20 C11 18 12 17 13 16 Z" fill="#ffe600"/>
                    </g>
                    {/* Card 3: Purple (+6 deg) Bug / Virus */}
                    <g transform="translate(66, 25) rotate(6) translate(-13, -18)">
                      <rect width="26" height="36" rx="4" fill="#1c0328" stroke="#d000ff" strokeWidth="2.2"/>
                      <ellipse cx="13" cy="18" rx="5" ry="6" fill="#d000ff"/>
                      <circle cx="13" cy="11" r="3" fill="#d000ff"/>
                      <line x1="5" y1="15" x2="21" y2="15" stroke="#d000ff" strokeWidth="1.5"/>
                      <line x1="5" y1="20" x2="21" y2="20" stroke="#d000ff" strokeWidth="1.5"/>
                      <line x1="11" y1="8" x2="8" y2="5" stroke="#d000ff" strokeWidth="1.5"/>
                      <line x1="15" y1="8" x2="18" y2="5" stroke="#d000ff" strokeWidth="1.5"/>
                    </g>
                    {/* Card 4: Green (+18 deg) Shield / Defuse */}
                    <g transform="translate(86, 28) rotate(18) translate(-13, -18)">
                      <rect width="26" height="36" rx="4" fill="#032613" stroke="#00ff66" strokeWidth="2.2"/>
                      <path d="M13 9 L19 12 V18 C19 22 13 25 13 25 C13 25 7 22 7 18 V12 Z" fill="#00ff66"/>
                      <path d="M13 11 L17 13 V17 C17 20 13 22 13 22 V11 Z" fill="#ffffff" opacity="0.6"/>
                    </g>
                  </svg>
                </div>

                {/* Text Title */}
                <div className="my-auto">
                  <div className="font-extrabold text-white text-[11px] sm:text-sm leading-tight tracking-wide">
                    คลังการ์ด
                  </div>
                  <div className={`font-mono text-[8px] sm:text-[10px] font-bold mt-0.5 ${
                    activeTab === 'codex' ? 'text-[#00f0ff]' : 'text-[#00ff66]'
                  }`}>
                    [MY COLLECTION]
                  </div>
                </div>
              </motion.div>

              {/* CARD 3: GACHA WISH / CARD MARKET (ตู้สุ่มกาชา / CYBER WISH) */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('roblox_gacha')}
                className={`relative rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 min-h-[76px] sm:min-h-[105px] flex flex-col items-center justify-between text-center cursor-pointer transition-all ${
                  activeTab === 'roblox_gacha'
                    ? 'bg-[#1a1506] border-2 border-[#ffe600] shadow-[0_0_25px_rgba(255,230,0,0.45)] ring-2 ring-[#ffe600]/50'
                    : 'bg-[#080d1a] border border-[#00ff66]/40 hover:border-[#00ff66] shadow-[0_0_15px_rgba(0,255,102,0.15)]'
                }`}
              >
                {/* Visual Icon Art: Handshake & Trading Cards */}
                <div className="h-8 sm:h-11 flex items-center justify-center my-0.5">
                  <svg className="w-12 h-8 sm:w-16 sm:h-11" viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Top Handshake */}
                    <path d="M26 12 L34 18 L46 18 L54 12" stroke="#00f0ff" strokeWidth="3" strokeLinecap="round"/>
                    <circle cx="30" cy="10" r="3" fill="#00f0ff"/>
                    <circle cx="50" cy="10" r="3" fill="#00f0ff"/>
                    
                    {/* Left Trading Card (Green) */}
                    <rect x="18" y="20" width="18" height="26" rx="3.5" fill="#042616" stroke="#00ff66" strokeWidth="2.5" transform="rotate(-12 18 20)"/>
                    
                    {/* Right Trading Card (Green) */}
                    <rect x="44" y="16" width="18" height="26" rx="3.5" fill="#042616" stroke="#00ff66" strokeWidth="2.5" transform="rotate(12 44 16)"/>
                    
                    {/* Exchange Arrows (Gold) */}
                    <path d="M32 27 L48 27 M44 23 L48 27 L44 31" stroke="#ffe600" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M48 35 L32 35 M36 31 L32 35 L36 39" stroke="#ffe600" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Text Title */}
                <div className="my-auto">
                  <div className="font-extrabold text-white text-[11px] sm:text-sm leading-tight tracking-wide">
                    ตู้สุ่มกาชา
                  </div>
                  <div className={`font-mono text-[8px] sm:text-[10px] font-bold mt-0.5 ${
                    activeTab === 'roblox_gacha' ? 'text-[#ffe600]' : 'text-[#00ff66]'
                  }`}>
                    [CYBER WISH]
                  </div>
                </div>
              </motion.div>

            </div>

            {/* TAB CONTENT 1: GAME MODES (PERFECT ASPECT RATIO & BALANCED POSTERS) */}
            {activeTab === 'modes' && (
              <div className="w-full flex items-center justify-center p-0.5 sm:p-1">
                <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full max-w-3xl">
                  
                  {/* SINGLE PLAYER CARD */}
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowBotModal(true)}
                    className="rounded-xl sm:rounded-2xl p-2 sm:p-3 flex flex-col justify-between items-center text-center cursor-pointer border-2 border-[#00ff66] shadow-[0_0_20px_rgba(0,255,102,0.25)] group relative overflow-hidden bg-[#06120d]"
                  >
                    {/* Top Status Header */}
                    <div className="w-full flex items-center justify-between z-10 px-0.5 mb-1 flex-shrink-0">
                      <span className="text-[8px] sm:text-[9px] font-mono font-bold text-[#00ff66] bg-[#00ff66]/20 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full border border-[#00ff66]/50 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-ping" /> SOLO VS AI
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-gray-300 font-mono font-bold">1 - 4 BOTS</span>
                    </div>

                    {/* NATURAL 16:9 ASPECT RATIO IMAGE CONTAINER */}
                    <div className="w-full aspect-[16/10] sm:aspect-video rounded-lg sm:rounded-xl overflow-hidden relative border border-[#00ff66]/50 shadow-[0_0_15px_rgba(0,255,102,0.2)] group-hover:border-[#00ff66] transition-all flex-shrink-0">
                      <img 
                        src="/images/single_player_ai.jpg" 
                        alt="Cyber Agent vs AI Bot" 
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                      />
                      {/* Subtle Bottom Vignette */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#06120d] via-transparent to-transparent opacity-60 pointer-events-none" />
                    </div>

                    {/* Clean Title & Description (Below image, not blocking heads) */}
                    <div className="my-1 text-center flex-shrink-0">
                      <div className="font-black text-white text-[11px] sm:text-sm tracking-wide uppercase font-sans">
                        SINGLE PLAYER
                      </div>
                      <div className="text-[8.5px] sm:text-[10px] text-[#00ff66] font-mono font-bold line-clamp-1">
                        ฝึกซ้อมดวลการ์ดไซเบอร์กับ AI บอท
                      </div>
                    </div>

                    {/* VIBRANT ACTION BUTTON */}
                    <button className="w-full py-2 rounded-xl font-black text-xs bg-[#00ff66] hover:bg-[#20ff7a] text-[#04120a] shadow-[0_0_15px_rgba(0,255,102,0.5)] flex items-center justify-center gap-1.5 transition-all z-10 group-hover:scale-102 flex-shrink-0">
                      <Cpu className="w-3.5 h-3.5 text-[#04120a]" /> เริ่มเล่นกับบอท (START GAME)
                    </button>
                  </motion.div>

                  {/* MULTIPLAYER CARD */}
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab('multiplayer_lobby')}
                    className="rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between items-center text-center cursor-pointer border-2 border-[#00f0ff] shadow-[0_0_25px_rgba(0,240,255,0.25)] group relative overflow-hidden bg-[#06101c]"
                  >
                    {/* Top Status Header */}
                    <div className="w-full flex items-center justify-between z-10 px-1 mb-1.5 flex-shrink-0">
                      <span className="text-[9px] font-mono font-bold text-[#00f0ff] bg-[#00f0ff]/20 px-2 py-0.5 rounded-full border border-[#00f0ff]/50 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping" /> REAL-TIME PVP
                      </span>
                      <span className="text-[10px] text-gray-300 font-mono font-bold">2 - 5 PLAYERS</span>
                    </div>

                    {/* NATURAL 16:9 ASPECT RATIO IMAGE CONTAINER */}
                    <div className="w-full aspect-[16/10] sm:aspect-video rounded-xl overflow-hidden relative border border-[#00f0ff]/50 shadow-[0_0_15px_rgba(0,240,255,0.2)] group-hover:border-[#00f0ff] transition-all flex-shrink-0">
                      <img 
                        src="/images/multiplayer_pvp.jpg" 
                        alt="Anime Gamers PVP Duel" 
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                      />
                      {/* Subtle Bottom Vignette */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#06101c] via-transparent to-transparent opacity-60 pointer-events-none" />
                    </div>

                    {/* Clean Title & Description (Below image, not blocking heads) */}
                    <div className="my-1.5 text-center flex-shrink-0">
                      <div className="font-black text-white text-xs sm:text-sm tracking-wide uppercase font-sans">
                        MULTIPLAYER
                      </div>
                      <div className="text-[9.5px] sm:text-[10px] text-[#00f0ff] font-mono font-bold">
                        สมรภูมิดวลการ์ดกับผู้เล่นจริงออนไลน์
                      </div>
                    </div>

                    {/* VIBRANT ACTION BUTTON */}
                    <button className="w-full py-2 rounded-xl font-black text-xs bg-[#00f0ff] hover:bg-[#33f3ff] text-[#030c12] shadow-[0_0_15px_rgba(0,240,255,0.5)] flex items-center justify-center gap-1.5 transition-all z-10 group-hover:scale-102 flex-shrink-0">
                      <Globe className="w-3.5 h-3.5 text-[#030c12]" /> เข้าสู่ห้องออนไลน์ (ONLINE LOBBY)
                    </button>
                  </motion.div>

                </div>
              </div>
            )}

            {/* TAB CONTENT 2: CARD CODEX */}
            {activeTab === 'codex' && (
              <div className="w-full flex-1 min-h-0 game-board-panel rounded-2xl p-3 shadow-lg border border-[#00ff66]/50 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 flex-shrink-0">
                  <span className="font-black text-sm text-white flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#00ff66]" /> CYBER CARD CODEX (ทั้งหมด {cardPool.length} แบบ)
                  </span>
                  <div className="flex gap-1 font-mono text-[10px]">
                    {['ALL', 'THREAT', 'DEFUSE', 'ACTION'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setCodexFilter(f)}
                        className={`px-2 py-0.5 rounded font-bold ${
                          codexFilter === f ? 'bg-[#00ff66] text-[#060814]' : 'bg-[#060814] text-[#6b7a90]'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4 flex-1 min-h-0 overflow-y-auto p-1 custom-scrollbar">
                  {cardPool
                    .filter(c => codexFilter === 'ALL' || c.type === codexFilter)
                    .map((card) => {
                      const isSelected = selectedCodexCard?.id === card.id;
                      const isThreat = card.type === 'THREAT';
                      const isDefuse = card.type === 'DEFUSE';
                      return (
                        <div
                          key={card.id}
                          onClick={() => setSelectedCodexCard(card)}
                          className={`rounded-2xl p-1.5 sm:p-2.5 flex flex-col border-2 cursor-pointer shadow-lg hover:scale-105 transition-all aspect-[3/4] ${
                            isSelected 
                              ? 'bg-[#15233c] border-[#ffe600] shadow-[0_0_20px_rgba(255,230,0,0.5)]' 
                              : isThreat 
                                ? 'bg-[#1a0810] border-[#ff0055]/70 hover:border-[#ff0055]' 
                                : isDefuse 
                                  ? 'bg-[#081a10] border-[#00ff66]/70 hover:border-[#00ff66]' 
                                  : 'bg-[#081424] border-[#00f0ff]/70 hover:border-[#00f0ff]'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1 sm:mb-2 flex-shrink-0">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-[8px] sm:text-[10px] text-white leading-tight line-clamp-1">{card.name}</span>
                              <span className={`text-[6px] sm:text-[7px] font-black font-mono mt-0.5 ${
                                isThreat ? 'text-[#ff0055]' : isDefuse ? 'text-[#00ff66]' : 'text-[#00f0ff]'
                              }`}>
                                [{card.type}]
                              </span>
                            </div>
                            <span className="text-xs sm:text-sm leading-none ml-1">
                              {isDefuse ? '🛡️' : isThreat ? '⚠️' : '⚡'}
                            </span>
                          </div>

                          <div className="flex-1 w-full bg-[#03040a]/80 rounded border border-gray-800/80 flex items-center justify-center relative overflow-hidden mb-1 sm:mb-2 group-hover:border-gray-600 transition-colors">
                            {card.image ? (
                              <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center justify-center opacity-40">
                                <ImageIcon className="w-4 h-4 sm:w-6 sm:h-6 text-gray-500 mb-0.5" />
                                <span className="text-[5px] sm:text-[6px] text-gray-500 font-mono">1:1 OR 4:3</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-0.5 sm:gap-1 mt-auto flex-shrink-0">
                            <div className="text-[6px] sm:text-[7px] text-gray-300 italic line-clamp-2 bg-black/60 p-1 rounded text-center min-h-[22px] sm:min-h-[28px] flex flex-col justify-center">
                              {card.flavor}
                            </div>
                            <div className="text-[6.5px] sm:text-[8px] text-center font-mono font-bold text-gray-500 bg-black/40 rounded py-0.5">
                              x{card.count} IN DECK
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>

                {selectedCodexCard && (
                  <div className="bg-[#060814] border border-[#00ff66]/30 rounded-xl p-2 font-mono text-[11px] flex items-center gap-2 flex-shrink-0">
                    <span className="text-xl">{selectedCodexCard.type === 'THREAT' ? '⚠️' : selectedCodexCard.type === 'DEFUSE' ? '🛡️' : '⚡'}</span>
                    <div className="truncate text-left">
                      <strong className="text-white">{selectedCodexCard.name}:</strong> <span className="text-[#c8d1e0]">{selectedCodexCard.flavor}</span>
                      <span className="text-[#ffe600] block text-[10px]">💡 {selectedCodexCard.tip}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: GENSHIN-STYLE WISH BANNER (TOP TABS + CENTER POSTER + POPUP REVEAL) */}
            {activeTab === 'roblox_gacha' && (
              <div className="w-full flex-1 min-h-0 flex flex-col justify-between overflow-hidden relative">
                
                {/* 1. TOP SET SELECTOR TABS (GENSHIN IMPACT STYLE) */}
                <div className="w-full flex items-center justify-between gap-2 pb-2 z-10 flex-shrink-0 font-mono">
                  {/* Banner Switcher Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pr-1">
                    {gachaBanners.map((banner, bIdx) => (
                      <button
                        key={banner.id}
                        onClick={() => {
                          setSelectedBannerIndex(bIdx);
                          setWonItem(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap border ${
                          selectedBannerIndex === bIdx
                            ? 'bg-gradient-to-r from-[#1b2347] to-[#0c122b] border-[#00f0ff] text-white shadow-[0_0_15px_rgba(0,240,255,0.4)] scale-102'
                            : 'bg-[#060814]/80 text-gray-400 border-gray-800 hover:text-white hover:border-gray-600'
                        }`}
                      >
                        <span className="text-base">{banner.icon}</span>
                        <span className="font-extrabold">{banner.name}</span>
                        <span 
                          className="text-[9px] px-1.5 py-0.2 rounded font-black uppercase"
                          style={{ backgroundColor: banner.themeColor, color: '#000' }}
                        >
                          {banner.cost.toLocaleString()} C
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Fast & Auto Toggles */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setIsFastRoll(!isFastRoll)}
                      className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-[11px] transition-all border ${
                        isFastRoll ? 'bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff]' : 'bg-[#060814] text-[#6b7a90] border-gray-800'
                      }`}
                      title="เปิดโหมดข้ามแอนิเมชันเร็วทันใจ"
                    >
                      <FastForward className="w-3 h-3" /> FAST
                    </button>
                  </div>
                </div>

                {/* 2. CENTER HERO BANNER POSTER (ภาพ + DESCRIPTION ตรงกลาง) */}
                <div 
                  className="flex-1 min-h-0 game-board-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden shadow-2xl border-2"
                  style={{ 
                    borderColor: currentBanner.themeColor,
                    background: `linear-gradient(135deg, #090e24 0%, #060814 60%, ${currentBanner.themeColor}15 100%)`
                  }}
                >
                  
                  {/* Background Cyber Grid Lines & Ambient Glow */}
                  <div 
                    className="absolute -right-16 -top-16 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
                    style={{ backgroundColor: currentBanner.themeColor }}
                  />

                  {/* Top Banner Tag */}
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#00f0ff]/10 border border-[#00f0ff]/40 text-[#00f0ff] font-mono text-[10px] font-black uppercase tracking-wider">
                        ★ CHARACTER & WEAPON EVENT WISH ★
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">
                        CRRU CTF Network Protocol
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-xs text-[#ffe600] bg-[#060814]/80 px-2.5 py-1 rounded-lg border border-[#ffe600]/30 shadow-sm">
                      <Coins className="w-3.5 h-3.5" />
                      <span className="font-black">{coins.toLocaleString()}</span>
                      <span className="text-[9px] text-gray-400">COINS</span>
                    </div>
                  </div>

                  {/* Main Banner Body: Left (Description Lore) + Right (Rate-Up Character Showcase) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-0 items-center my-1 z-10">
                    
                    {/* Left: Banner Title + Lore + Probability Guarantee */}
                    <div className="md:col-span-7 flex flex-col justify-center text-left font-mono pr-2">
                      <div className="text-2xl sm:text-4xl font-black text-white uppercase tracking-wider drop-shadow-md flex items-center gap-2">
                        <span>{currentBanner.icon}</span>
                        <span>{currentBanner.name}</span>
                      </div>

                      {/* Probability Increased Box */}
                      <div className="mt-2 bg-[#12162b]/90 border-l-4 p-2.5 rounded-r-xl shadow-lg" style={{ borderColor: currentBanner.themeColor }}>
                        <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 mb-0.5">
                          <span className="text-[#ffe600]">✦</span> Probability Increased! (เรทอัปพิเศษ)
                        </div>
                        <p className="text-[11px] text-[#00f0ff] font-bold">
                          &bull; การสุ่ม 10 ครั้ง การันตีได้รับไอเทมระดับ Epic (★★★★) ขึ้นไปอย่างน้อย 1 ชิ้น!
                        </p>
                        <p className="text-[10px] text-gray-300 mt-1 line-clamp-2 leading-relaxed">
                          {currentBanner.desc || "ตู้กิจกรรมพิเศษ ลุ้นรับไอเทมระดับตำนานและเอฟเฟกต์เฉพาะตัว"}
                        </p>
                      </div>

                      {/* Featured Drops Pills */}
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-gray-400 font-bold">RATE UP:</span>
                        {currentBanner.items?.slice(0, 3).map((item, idx) => (
                          <div 
                            key={idx}
                            className="bg-[#060814] border border-gray-700 px-2 py-0.5 rounded-md flex items-center gap-1 text-[10px] font-bold text-white"
                          >
                            <span>{item.icon}</span>
                            <span className="truncate max-w-[110px]">{item.name}</span>
                            <span className="text-[#ffe600] text-[8px] font-black">{item.rarity === 'LEGENDARY' ? '5★' : '4★'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Genshin-Style Big Featured Visual Cards */}
                    <div className="md:col-span-5 flex items-center justify-center relative">
                      {currentBanner.items && currentBanner.items.length > 0 && (
                        <div className="relative w-full max-w-[260px] flex flex-col items-center">
                          
                          {/* 5-Star Main UP Badge */}
                          <div className="absolute -top-3 -right-2 bg-gradient-to-r from-[#ffe600] to-[#ff9900] text-black font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-lg z-20 animate-bounce">
                            UP! 5★
                          </div>

                          {/* Hero Display Card */}
                          <div 
                            className="w-full bg-gradient-to-b from-[#141b36] to-[#0a0e20] border-2 rounded-2xl p-3 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.8)] relative overflow-hidden"
                            style={{ borderColor: currentBanner.themeColor }}
                          >
                            <span className="text-5xl my-2 drop-shadow-[0_0_20px_currentColor]" style={{ color: currentBanner.themeColor }}>
                              {currentBanner.items[0]?.icon || currentBanner.icon}
                            </span>
                            
                            <div className="text-center w-full">
                              <div className="font-extrabold text-sm text-white truncate">
                                {currentBanner.items[0]?.name}
                              </div>
                              <div className="text-[#ffe600] text-xs font-black tracking-widest my-0.5">
                                ★★★★★
                              </div>
                              <div className="text-[9px] text-gray-400 font-mono line-clamp-1">
                                {currentBanner.items[0]?.desc}
                              </div>
                            </div>
                          </div>

                          {/* 4-Star Secondary Floater */}
                          {currentBanner.items[1] && (
                            <div className="w-[90%] -mt-2 bg-[#12162b]/95 border border-[#ff0055]/50 rounded-xl px-2.5 py-1 flex items-center justify-between text-xs z-10 shadow-md">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="text-base">{currentBanner.items[1].icon}</span>
                                <span className="font-bold text-white text-[10px] truncate">{currentBanner.items[1].name}</span>
                              </div>
                              <span className="text-[#ff0055] text-[9px] font-black">4★ UP</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* 3. BOTTOM CONTROL BAR (GENSHIN IMPACT WISH ×1 & WISH ×10 BUTTONS) */}
                  <div className="w-full flex items-center justify-between border-t border-white/10 pt-2.5 z-10 flex-shrink-0 font-mono">
                    
                    {/* Bottom Left: Details & History */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowBannerDetailsModal(true)}
                        className="px-3 py-1.5 bg-[#060814] hover:bg-[#12162b] border border-gray-700 hover:border-gray-500 text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Layers className="w-3.5 h-3.5" /> รายละเอียด (Details)
                      </button>
                      
                      <span className="text-[10px] text-gray-500 hidden sm:inline">
                        สุ่มสะสม: {totalRolls} ครั้ง
                      </span>
                    </div>

                    {/* Bottom Right: Big Wish Buttons */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      
                      {/* Wish x1 */}
                      <button
                        onClick={() => handleRobloxRoll(1)}
                        className="px-4 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-b from-[#f8fafc] to-[#cbd5e1] hover:from-white hover:to-[#e2e8f0] text-black shadow-lg flex items-center gap-1.5 transition-all hover:scale-103 active:scale-97 border border-white/80"
                      >
                        <Dices className="w-4 h-4 text-black" />
                        <div className="flex flex-col text-left leading-none">
                          <span className="font-extrabold text-xs">สุ่ม ×1 (Wish ×1)</span>
                          <span className="text-[9.5px] opacity-75 font-mono">{currentBanner.cost.toLocaleString()} Coins</span>
                        </div>
                      </button>

                      {/* Wish x10 (Featured Glowing Button) */}
                      <button
                        onClick={() => handleRobloxRoll(10)}
                        className="px-5 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-b from-[#ffe600] to-[#ffaa00] hover:from-[#fff04d] hover:to-[#ffb700] text-black shadow-[0_0_20px_rgba(255,200,0,0.5)] flex items-center gap-2 transition-all hover:scale-104 active:scale-97 border-2 border-[#fff380]"
                      >
                        <Sparkles className="w-4 h-4 text-black" />
                        <div className="flex flex-col text-left leading-none">
                          <span className="font-black text-xs sm:text-sm uppercase">สุ่ม ×10 (Wish ×10)</span>
                          <span className="text-[9.5px] opacity-80 font-mono">{(currentBanner.cost * 10).toLocaleString()} Coins</span>
                        </div>
                      </button>

                    </div>

                  </div>

                </div>

              </div>
            )}

          </div>
        )}

        {/* 3. MULTIPLAYER ROOM DIRECTORY (SCREEN-FIT) */}
        {isAuthenticated && !hasJoinedRoom && activeTab === 'multiplayer_lobby' && (
          <div className="w-full h-full flex flex-col justify-between gap-2 py-1 overflow-hidden">
            
            {/* Top Bar with Back Button */}
            <div className="w-full game-board-panel rounded-xl px-3 py-1.5 flex items-center justify-between shadow border border-[#00f0ff]/50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('modes')}
                  className="p-1.5 bg-[#060814] border border-[#00f0ff]/40 hover:border-[#00f0ff] text-[#00f0ff] rounded-lg transition-all"
                  title="ย้อนกลับ"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="font-black text-sm text-white">{username} (VIP 0)</span>
              </div>
              <div className="flex items-center gap-1 bg-[#060814] border border-[#ffe600]/40 px-2 py-0.5 rounded-lg text-xs font-mono text-[#ffe600]">
                <Coins className="w-3 h-3" /> {coins.toLocaleString()}
              </div>
            </div>

            {/* Room Grid + Online Side (Flexible Height Fit) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 flex-1 min-h-0 overflow-hidden">
              {/* Room Grid (8 Cols) */}
              <div className="md:col-span-8 game-board-panel rounded-2xl p-3 flex flex-col justify-between border border-[#00f0ff] overflow-hidden">
                <div className="text-center font-black text-xs sm:text-sm text-[#ffe600] flex-shrink-0">
                  ⭐ รายการห้อง (ROOM DIRECTORY) ⭐
                </div>

                <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-y-auto py-1 pr-1 custom-scrollbar">
                  {roomSlots.map((room, idx) => {
                    if (room) {
                      return (
                        <div 
                          key={room.roomId}
                          onClick={() => {
                            if (room.isGameStarted || room.playerCount >= 5) return;
                            if (room.isPrivate) {
                              setSelectedPrivateRoomId(room.roomId);
                              setRoomModal('password');
                            } else {
                              handleJoinSpecificRoom(room.roomId);
                            }
                          }}
                          className={`bg-[#060814] border ${room.isPrivate ? 'border-gray-600' : 'border-[#00f0ff]/50'} rounded-xl p-2 flex items-center justify-between cursor-pointer hover:border-[#00f0ff]`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-8 h-8 rounded-lg bg-[#12162b] border ${room.isPrivate ? 'border-gray-500 text-gray-400' : 'border-[#00f0ff] text-[#00f0ff]'} flex items-center justify-center font-bold text-xs font-mono`}>
                              {room.isPrivate ? <Lock className="w-3.5 h-3.5" /> : room.roomId}
                            </span>
                            <div className="truncate">
                              <div className="font-bold text-xs text-white truncate flex items-center gap-1">
                                {room.name}
                                {room.isPrivate && <Lock className="w-2.5 h-2.5 text-gray-500" />}
                              </div>
                              <div className="text-[9px] text-[#6b7a90]">Host: {room.host}</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-[#00ff66] font-bold font-mono">{room.playerCount}/5</span>
                        </div>
                      )
                    } else {
                      const slotNum = String(idx + 1).padStart(3, '0')
                      return (
                        <div 
                          key={`empty-${idx}`}
                          onClick={() => { setNewRoomName(`ROOM ${slotNum}`); setRoomModal('create'); }}
                          className="bg-[#060814]/80 border border-[#ffe600]/40 rounded-xl p-2 flex items-center justify-between cursor-pointer hover:border-[#ffe600]"
                        >
                          <div className="flex items-center gap-1.5">
                            <Plus className="w-4 h-4 text-[#ffe600]" />
                            <span className="font-bold text-xs text-[#ffe600] font-mono">สร้างห้อง [{slotNum}]</span>
                          </div>
                          <span className="text-[9px] bg-[#ffe600] text-black font-bold px-1.5 py-0.5 rounded">เปิด</span>
                        </div>
                      )
                    }
                  })}
                </div>

                <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/10 font-mono text-xs flex-shrink-0">
                  <button onClick={() => { setSearchRoomId(''); setRoomModal('search'); }} className="game-btn-cyan px-3 py-1.5 rounded-xl font-bold">
                    <Search className="w-3.5 h-3.5 inline mr-1" /> ค้นหา
                  </button>
                  <button onClick={handleQuickJoin} className="game-btn-green px-6 py-1.5 rounded-xl font-black">
                    <Play className="w-3.5 h-3.5 inline mr-1" /> เล่นเลย!
                  </button>
                  <button onClick={() => { setNewRoomName(''); setRoomModal('create'); }} className="game-btn-yellow px-3 py-1.5 rounded-xl font-bold">
                    <Plus className="w-3.5 h-3.5 inline mr-1" /> สร้างห้อง
                  </button>
                </div>
              </div>

              {/* Online Users List (4 Cols) */}
              <div className="md:col-span-4 game-board-panel rounded-2xl p-2.5 flex flex-col justify-between border border-[#00ff66]/40 overflow-hidden">
                <div className="font-bold text-xs text-white pb-1 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                  <span>👥 ออนไลน์ ({onlineUsers.length})</span>
                  <span className="text-[9px] text-[#00ff66] font-mono">LIVE</span>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto py-1 pr-1 flex flex-col gap-1.5 custom-scrollbar">
                  {onlineUsers.map((u, i) => (
                    <div key={u.id || i} className="bg-[#060814] p-1.5 rounded-lg border border-gray-800 flex items-center justify-between text-xs">
                      <span className="font-bold text-white text-[11px] truncate">{u.username}</span>
                      <span className="text-[9px] text-[#6b7a90] font-mono truncate">{u.status || 'In Lobby'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. WAITING LOBBY (SCREEN-FIT) */}
        {isAuthenticated && hasJoinedRoom && gameState && !gameState.isGameStarted && (
          <div className="w-full max-w-xl game-board-panel rounded-2xl p-4 text-center font-mono border border-[#00f0ff] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <button onClick={handleLeaveRoom} className="game-btn-pink px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> ออก
              </button>
              <span className="text-lg font-black text-[#00f0ff]">ROOM: {roomId}</span>
              <span className="text-xs text-[#00ff66] font-bold">{Object.keys(gameState.players).length}/5 คน</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {Array.from({ length: 5 }).map((_, i) => {
                const p = Object.values(gameState.players)[i]
                return p ? (
                  <div key={p.id} className="bg-[#060814] p-2 rounded-xl border border-[#00f0ff]/40 text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00ff66]" />
                    <span className="truncate">{p.name}</span>
                  </div>
                ) : (
                  <div key={`emp-${i}`} className="bg-[#060814]/40 p-2 rounded-xl border border-dashed border-gray-800 text-[10px] text-gray-600">
                    ว่าง
                  </div>
                )
              })}
            </div>

            <button
              onClick={handleStart}
              disabled={Object.keys(gameState.players).length < 2}
              className={`game-btn-green w-full py-2.5 rounded-xl font-black text-sm ${
                Object.keys(gameState.players).length < 2 ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              เริ่มเกม / START GAME
            </button>
          </div>
        )}

        {/* 5. ACTIVE BATTLE BOARD (FULL INTERACTIVE COMBAT ENGINE) */}
        {isAuthenticated && hasJoinedRoom && gameState && gameState.isGameStarted && (
          <div className="w-full flex-1 flex flex-col justify-between py-1 font-mono overflow-hidden relative min-h-[600px]">
            
            {/* POKER TABLE VISUAL BACKGROUND */}
            <div className="absolute top-[8%] bottom-[18%] left-[2%] right-[2%] sm:left-[8%] sm:right-[8%] max-w-6xl mx-auto rounded-[120px] sm:rounded-[300px] border-[6px] border-[#00ff66]/40 shadow-[0_0_150px_rgba(0,255,102,0.15)_inset,0_0_80px_rgba(0,255,102,0.2)] pointer-events-none z-0 overflow-hidden flex items-center justify-center bg-[#030612]">
              <div className="w-[98%] h-[95%] rounded-[110px] sm:rounded-[280px] border-2 border-[#00f0ff]/20 bg-[#050a18] flex flex-col items-center justify-center relative shadow-inner">
                <div className="absolute text-[#00ff66]/10 font-black text-6xl sm:text-9xl tracking-widest rotate-[-12deg] select-none pointer-events-none">
                  CYBER TABLE
                </div>
              </div>
            </div>

            {/* STRUCTURED POKER LAYOUT (NO ABSOLUTE POSITIONS FOR BOTS) */}
            <div className="w-full flex flex-col z-20 pointer-events-none mb-1">
              <div className="w-full flex justify-center gap-10 sm:gap-40 px-4 mt-2 sm:mt-4">
                {topOpps.map(p => renderOpponent(p))}
              </div>
            </div>

            {/* TURN STATUS BANNER & REAL-TIME ALERTS */}
            <div className="w-full flex flex-col items-center justify-center my-1 z-10 px-2 flex-shrink-0">
              {battleMessage ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-black/90 border-2 border-[#ffe600] px-4 py-1.5 rounded-full shadow-[0_0_25px_rgba(255,230,0,0.6)] text-[#ffe600] font-black text-xs sm:text-sm text-center flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-[#ffe600] animate-bounce" /> {battleMessage}
                </motion.div>
              ) : (
                (() => {
                  const playerIds = Object.keys(gameState.players);
                  const currentTurnPid = playerIds[gameState.turnIndex % playerIds.length];
                  const isMyTurn = currentTurnPid === username;
                  const currentTurnPlayer = gameState.players[currentTurnPid];
                  const amIDisabled = gameState.players[username]?.isDisabled;

                  return (
                    <div className="flex flex-col items-center w-full max-w-md">
                      {amIDisabled && (
                        <div className="bg-red-900/90 border-2 border-red-500 px-4 py-1.5 rounded-full text-red-400 font-black text-[10px] sm:text-xs text-center flex items-center gap-2 mb-2 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse uppercase tracking-wider">
                          🛡️❌ เกราะแตก: คุณใช้ Backup กู้ภัยไม่ได้ในเทิร์นนี้!
                        </div>
                      )}
                      <div className={`px-4 py-1 rounded-full text-xs font-black border transition-all flex items-center gap-2 mb-1 justify-center w-max ${
                        isMyTurn 
                          ? 'bg-[#00ff66]/20 border-[#00ff66] text-[#00ff66] shadow-[0_0_20px_rgba(0,255,102,0.4)]' 
                          : 'bg-[#00f0ff]/10 border-[#00f0ff]/40 text-[#00f0ff]'
                      }`}>
                        {isMyTurn ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-ping" />
                            <span>⚡ เทิร์นของคุณ (YOUR TURN) - {Math.ceil(turnTimeLeft)}s</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-[#00f0ff]" />
                            <span>⏳ กำลังรอ {currentTurnPlayer?.name || 'คู่ต่อสู้'}... - {Math.ceil(turnTimeLeft)}s</span>
                          </>
                        )}
                      </div>
                      <div className="w-[80%] h-1 bg-gray-900 rounded-full overflow-hidden mt-0.5 relative">
                        <div 
                          className={`absolute top-0 left-0 h-full transition-all ease-linear duration-100 ${
                            turnTimeLeft <= 5 
                              ? 'bg-[#ff0055] shadow-[0_0_10px_rgba(255,0,85,1)]' 
                              : isMyTurn ? 'bg-[#00ff66] shadow-[0_0_10px_rgba(0,255,102,0.8)]' : 'bg-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.8)]'
                          }`}
                          style={{ width: `${turnProgress}%` }}
                        />
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* CENTRAL ARENA: LEFT OPPONENT, DECK, DISCARD PILE, COMBAT LOG, RIGHT OPPONENT */}
            <div className="w-full flex-1 min-h-0 flex items-center justify-between px-2 sm:px-6 my-1 relative z-10 pointer-events-none">
              
              {/* LEFT OPPONENT */}
              <div className="w-[100px] sm:w-[140px] flex-shrink-0 flex justify-start pointer-events-auto">
                {leftOpp && renderOpponent(leftOpp)}
              </div>

              {/* GAME BOARD CENTER */}
              <div className="flex-1 flex justify-center items-center gap-2 sm:gap-6 pointer-events-auto overflow-hidden">
                {/* 1. INTERACTIVE 3D DECK (LEFT) */}
                <div className="flex flex-col items-center justify-center">
                {(() => {
                  const playerIds = Object.keys(gameState.players);
                  const isMyTurn = playerIds[gameState.turnIndex % playerIds.length] === username;
                  const me = gameState.players[username];
                  const canDraw = isMyTurn && me?.isAlive;

                  return (
                    <motion.div
                      whileHover={canDraw ? { scale: 1.08, y: -4 } : {}}
                      whileTap={canDraw ? { scale: 0.95 } : {}}
                      animate={isShuffling ? { x: [-10, 10, -10, 10, 0], rotate: [-5, 5, -5, 5, 0], scale: 1.1 } : { scale: 1 }}
                      transition={{ duration: 0.5 }}
                      onClick={handleDrawCard}
                      className={`w-16 sm:w-24 h-24 sm:h-32 rounded-2xl p-1.5 flex flex-col justify-between items-center text-center cursor-pointer transition-all ${
                        isShuffling ? 'bg-[#1a0f00] border-2 border-[#ffaa00] shadow-[0_0_30px_rgba(255,170,0,0.8)]' :
                        canDraw 
                          ? 'bg-[#071d14] border-2 border-[#00ff66] shadow-[0_0_30px_rgba(0,255,102,0.5)] ring-2 ring-[#00ff66]/50 animate-pulse' 
                          : 'bg-[#060814] border-2 border-gray-800 opacity-80'
                      }`}
                    >
                      <div className="w-full flex justify-between items-center text-[9px] text-gray-400">
                        <span className="font-bold">CYBER</span>
                        <span>DECK</span>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <motion.div 
                          key={gameState.deck?.length || 0}
                          initial={{ scale: 2, y: -20, opacity: 0.5 }}
                          animate={{ scale: 1, y: 0, opacity: 1 }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className={`font-black text-3xl sm:text-4xl leading-none ${canDraw ? 'text-[#00ff66]' : 'text-gray-300'}`}
                        >
                          {gameState.deck?.length || 0}
                        </motion.div>
                        <span className="text-[10px] text-gray-400 font-bold mt-1">CARDS LEFT</span>
                      </div>

                      <div className={`w-full py-1 rounded-lg text-[9px] sm:text-[10px] font-black ${
                        canDraw ? 'bg-[#00ff66] text-[#04120a]' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {canDraw ? '👉 CLICK TO DRAW' : 'DECK PILE'}
                      </div>
                    </motion.div>
                  );
                })()}
              </div>

              {/* 2. DISCARD PILE (CENTER) */}
              <div className="flex flex-col items-center justify-center">
                <AnimatePresence mode="popLayout">
                {(() => {
                  const activePlayAnims = animatingCards.filter(c => c.action === 'play').length;
                  let lastCard = null;
                  
                  if (gameState.discardPile && gameState.discardPile.length > 0) {
                    const targetIdx = gameState.discardPile.length - 1 - activePlayAnims;
                    lastCard = targetIdx >= 0 ? gameState.discardPile[targetIdx] : null;
                  }

                  return lastCard ? (
                    <motion.div
                      key={lastCard.uniqueId || gameState.discardPile.length}
                      initial={{ scale: 1.1, opacity: 0 }}
                      animate={{ scale: 1, y: 0, rotate: (Math.random() - 0.5) * 10, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className={`w-16 sm:w-24 h-24 sm:h-36 rounded-2xl p-1.5 flex flex-col border-2 shadow-2xl bg-[#0b0e1e] ${
                        lastCard.type === 'THREAT' ? 'border-[#ff0055] shadow-[0_0_25px_rgba(255,0,85,0.4)]' :
                        lastCard.type === 'DEFUSE' ? 'border-[#00ff66] shadow-[0_0_25px_rgba(0,255,102,0.4)]' :
                        'border-[#00f0ff] shadow-[0_0_25px_rgba(0,240,255,0.4)]'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1 flex-shrink-0">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-white text-[8px] sm:text-[9px] leading-tight line-clamp-1">{lastCard.name}</span>
                          <span className={`text-[6px] sm:text-[7px] font-black font-mono mt-0.5 ${
                            lastCard.type === 'THREAT' ? 'text-[#ff0055]' : lastCard.type === 'DEFUSE' ? 'text-[#00ff66]' : 'text-[#00f0ff]'
                          }`}>
                            [{lastCard.type}]
                          </span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] leading-none ml-1">
                          {lastCard.type === 'DEFUSE' ? '🛡️' : lastCard.type === 'THREAT' ? '⚠️' : '⚡'}
                        </span>
                      </div>

                      <div className="flex-1 w-full bg-[#03040a]/80 rounded border border-gray-800/80 flex items-center justify-center relative overflow-hidden mb-1">
                        {lastCard.image ? (
                          <img src={lastCard.image} alt={lastCard.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center opacity-40">
                            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mb-0.5" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-0.5 mt-auto flex-shrink-0">
                        <div className="text-[6px] sm:text-[7px] text-gray-300 italic line-clamp-2 bg-black/60 p-0.5 rounded text-center min-h-[16px] sm:min-h-[20px] flex flex-col justify-center">
                          {lastCard.flavor || 'Active Effect'}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty-discard"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-16 sm:w-24 h-24 sm:h-32 rounded-2xl border-2 border-dashed border-gray-800 bg-[#060814]/40 flex flex-col items-center justify-center p-2 text-center"
                    >
                      <Layers className="w-6 h-6 text-gray-700 mb-1" />
                      <span className="text-gray-600 font-bold text-[10px]">DISCARD PILE</span>
                      <span className="text-gray-700 text-[8px] mt-0.5">กองการ์ดที่ใช้แล้ว</span>
                    </motion.div>
                  );
                })()}
                </AnimatePresence>
              </div>

              {/* 3. COMBAT CONSOLE LOG (RIGHT) */}
              <div className="hidden sm:flex flex-col w-48 sm:w-56 h-28 sm:h-32 bg-[#050811] border border-gray-800 rounded-2xl p-2 shadow-inner overflow-hidden">
                <div className="flex items-center justify-between pb-1 border-b border-gray-800 text-[8px] sm:text-[9px] text-gray-400 font-bold">
                  <span className="flex items-center gap-1 text-[#00f0ff]">
                    <Terminal className="w-3 h-3" /> COMBAT LOG
                  </span>
                  <span>LIVE</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 mt-1 text-[8.5px]">
                  {gameState.actionLogs && gameState.actionLogs.length > 0 ? (
                    gameState.actionLogs.map((log, idx) => (
                      <div key={idx} className="text-gray-300 leading-tight">
                        <span className="text-gray-500 font-mono">[{log.time}]</span> {log.message}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-600 text-center my-auto italic">ยังไม่มีบันทึกการเล่น</div>
                  )}
                </div>
              </div>
              
              {/* GAME BOARD CENTER CLOSE */}
              </div>

              {/* RIGHT OPPONENT */}
              <div className="w-[100px] sm:w-[140px] flex-shrink-0 flex justify-end pointer-events-auto">
                {rightOpp && renderOpponent(rightOpp)}
              </div>
            </div>

            {/* SELECTED CARD INSPECTOR TOOLBAR */}
            {selectedCardForPlay && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-xl mx-auto bg-[#0b0e1e] border-2 border-[#00ff66] rounded-2xl p-2.5 flex items-center justify-between gap-3 shadow-[0_0_30px_rgba(0,255,102,0.4)] z-20 flex-shrink-0"
              >
                <div className="flex items-center gap-2.5">
                  <div className="text-2xl">
                    {selectedCardForPlay.type === 'DEFUSE' ? '🛡️' : selectedCardForPlay.type === 'THREAT' ? '⚠️' : '⚡'}
                  </div>
                  <div>
                    <div className="font-extrabold text-white text-xs flex items-center gap-1.5">
                      {selectedCardForPlay.name}
                      <span className="text-[9px] text-[#00ff66] font-mono font-bold">[{selectedCardForPlay.type}]</span>
                    </div>
                    <div className="text-[9px] text-gray-300 line-clamp-1">{selectedCardForPlay.flavor}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePlayCard(selectedCardForPlay)}
                    className="bg-[#00ff66] hover:bg-[#20ff7a] text-[#04120a] font-black px-3.5 py-1.5 rounded-xl text-xs shadow-lg flex items-center gap-1 transition-all"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#04120a]" /> ลงการ์ด (PLAY)
                  </button>
                  <button
                    onClick={() => setSelectedCardForPlay(null)}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-2.5 py-1.5 rounded-xl text-xs"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            )}

            {/* PLAYER HAND & BOTTOM ACTION DOCK */}
            <div className="w-full flex flex-col items-center justify-end flex-shrink-0 pb-1 z-10">
              
              {/* CARDS IN HAND (FAN SPREAD) */}
              <div className="flex justify-center items-end h-48 sm:h-56 max-w-full overflow-x-auto px-4 pb-1 pt-12">
                <AnimatePresence mode="popLayout">
                  {(() => {
                    const myHand = gameState.players[username]?.hand || [];
                    const activeDrawAnims = animatingCards.filter(c => c.action === 'draw' && c.playerId === username).length;
                    const visibleHand = myHand.slice(0, Math.max(0, myHand.length - activeDrawAnims));
                    return visibleHand;
                  })().map((card, idx) => {
                    const isSelected = selectedCardForPlay?.uniqueId === card.uniqueId;
                    const me = gameState.players[username];
                    
                    if (!me?.isAlive) {
                      return (
                        <motion.div
                          key={card.uniqueId || idx}
                          layout
                          className="w-24 sm:w-28 h-36 sm:h-40 -ml-5 sm:-ml-6 first:ml-0 rounded-2xl p-1.5 sm:p-2 flex flex-col items-center justify-center border-2 border-[#ff0055]/30 bg-[#ff0055]/5 shadow-[0_0_15px_rgba(255,0,85,0.1)] grayscale opacity-50"
                          style={{ zIndex: idx }}
                        >
                          <div className="w-[80%] h-[90%] border border-[#ff0055]/20 rounded-xl bg-[#0b0e1e] flex flex-col items-center justify-center opacity-40">
                            <span className="text-[#ff0055] font-black text-xs mb-1">ELIMINATED</span>
                            <span className="text-[#ff0055]/30 font-black text-2xl rotate-45">💀</span>
                          </div>
                        </motion.div>
                      );
                    }

                    return (
                      <motion.div
                        key={card.uniqueId || idx}
                        layout
                        initial={{ y: 50, opacity: 0, scale: 0.5 }}
                        animate={{ y: 0, x: 0, opacity: 1, scale: 1, rotate: 0, zIndex: isSelected ? 50 : idx }}
                        exit={{ y: -50, opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        whileHover={{ y: -30, scale: 1.15, rotate: 2, zIndex: 100 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCardForPlay(card)}
                      onDoubleClick={() => handlePlayCard(card)}
                      className={`w-24 sm:w-28 h-36 sm:h-40 -ml-5 sm:-ml-6 first:ml-0 rounded-2xl p-1.5 sm:p-2 flex flex-col border-2 cursor-pointer shadow-2xl transition-all ${
                        isSelected 
                          ? 'bg-[#15233c] border-[#00ff66] shadow-[0_0_40px_rgba(0,255,102,0.8)] -translate-y-6 scale-110 z-50' 
                          : card.type === 'THREAT' 
                            ? 'bg-[#1a0810] border-[#ff0055] hover:shadow-[0_0_20px_rgba(255,0,85,0.6)]' 
                            : card.type === 'DEFUSE' 
                              ? 'bg-[#081a10] border-[#00ff66] hover:shadow-[0_0_20px_rgba(0,255,102,0.6)]' 
                              : 'bg-[#081424] border-[#00f0ff] hover:shadow-[0_0_20px_rgba(0,240,255,0.6)]'
                      }`}
                      style={{ zIndex: isSelected ? 50 : idx }}
                    >
                      <div className="flex justify-between items-start mb-1 flex-shrink-0">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-[8px] sm:text-[9px] text-white leading-tight line-clamp-1">{card.name}</span>
                          <span className={`text-[6px] sm:text-[7px] font-black font-mono mt-0.5 ${
                            card.type === 'THREAT' ? 'text-[#ff0055]' : card.type === 'DEFUSE' ? 'text-[#00ff66]' : 'text-[#00f0ff]'
                          }`}>
                            [{card.type}]
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-[11px] leading-none ml-0.5">
                          {card.type === 'DEFUSE' ? '🛡️' : card.type === 'THREAT' ? '⚠️' : '⚡'}
                        </span>
                      </div>

                      <div className="flex-1 w-full bg-[#03040a]/80 rounded border border-gray-800/80 flex items-center justify-center relative overflow-hidden mb-1 group-hover:border-gray-600 transition-colors">
                        {card.image ? (
                          <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center opacity-40">
                            <ImageIcon className="w-4 h-4 text-gray-500 mb-0.5" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-0.5 mt-auto flex-shrink-0">
                        <div className="text-[6px] sm:text-[7px] text-gray-300 italic line-clamp-2 bg-black/60 p-1 rounded text-center min-h-[22px] flex flex-col justify-center">
                          {card.flavor}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              </div>

              {/* QUICK ACTION CONTROLS */}
              <div className="flex items-center gap-3 mt-1">
                {(() => {
                  const playerIds = Object.keys(gameState.players);
                  const isMyTurn = playerIds[gameState.turnIndex % playerIds.length] === username;
                  const me = gameState.players[username];

                  return me?.isAlive ? (
                    <>
                      <button
                        onClick={handleDrawCard}
                        disabled={!isMyTurn}
                        className={`px-4 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-lg ${
                          isMyTurn
                            ? 'bg-[#00ff66] hover:bg-[#20ff7a] text-[#04120a] shadow-[0_0_20px_rgba(0,255,102,0.6)] animate-pulse'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <Layers className="w-4 h-4 text-[#04120a]" /> จั่วการ์ด & จบเทิร์น (DRAW CARD)
                      </button>

                      <button
                        onClick={handleLeaveBattle}
                        className="px-3 py-1.5 rounded-xl font-bold text-xs bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 flex items-center gap-1 transition-all"
                      >
                        <LogOut className="w-3.5 h-3.5" /> ออกจากการแข่งขัน
                      </button>
                    </>
                  ) : null;
                })()}
              </div>

            </div>

            {/* MODAL 1: SCAN VIRUS / SEE FUTURE SCANNER HUD */}
            <AnimatePresence>
              {seeFutureCards && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-[#0b0e1e] border-2 border-[#00f0ff] rounded-3xl p-5 w-full max-w-lg shadow-[0_0_40px_rgba(0,240,255,0.4)] text-center font-mono"
                  >
                    <div className="flex items-center justify-center gap-2 text-[#00f0ff] font-black text-base mb-1">
                      <Terminal className="w-5 h-5 animate-pulse" /> MATRIX VIRUS SCAN (TOP 3 CARDS)
                    </div>
                    <div className="text-[11px] text-gray-300 mb-4">ลำดับไพ่ 3 ใบบนสุดของกอง (เรียงจากใบบนสุดไปล่าง)</div>

                    <div className="flex overflow-x-auto sm:grid sm:grid-cols-3 gap-3 mb-5 pb-2 snap-x snap-mandatory hide-scrollbar justify-start sm:justify-center">
                      {seeFutureCards.map((c, i) => (
                        <div
                          key={i}
                          className={`flex-shrink-0 w-28 sm:w-auto snap-center rounded-2xl p-2 sm:p-2.5 flex flex-col border-2 shadow-lg aspect-[3/4] ${
                            c.type === 'THREAT' ? 'bg-[#1a0810] border-[#ff0055]' :
                            c.type === 'DEFUSE' ? 'bg-[#081a10] border-[#00ff66]' :
                            'bg-[#081424] border-[#00f0ff]'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1 flex-shrink-0">
                            <div className="flex flex-col text-left">
                              <span className="font-extrabold text-[10px] sm:text-xs text-white leading-tight line-clamp-2">{c.name}</span>
                              <span className={`text-[7px] sm:text-[9px] font-black font-mono mt-0.5 ${
                                c.type === 'THREAT' ? 'text-[#ff0055]' : c.type === 'DEFUSE' ? 'text-[#00ff66]' : 'text-[#00f0ff]'
                              }`}>
                                [{c.type}]
                              </span>
                            </div>
                            <span className="text-xs sm:text-sm leading-none ml-1">
                              {c.type === 'DEFUSE' ? '🛡️' : c.type === 'THREAT' ? '⚠️' : '⚡'}
                            </span>
                          </div>

                          <div className="flex-1 w-full bg-[#03040a]/80 rounded border border-gray-800/80 flex items-center justify-center relative overflow-hidden mb-1">
                            {c.image ? (
                              <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center justify-center opacity-40">
                                <ImageIcon className="w-4 h-4 text-gray-500 mb-0.5" />
                              </div>
                            )}
                          </div>

                          <div className="text-[9px] sm:text-[10px] font-black text-white bg-black/60 rounded py-0.5 text-center mt-auto flex-shrink-0">
                            ใบที่ #{i + 1}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setSeeFutureCards(null)}
                      className="bg-[#00f0ff] hover:bg-[#33f3ff] text-[#040e1a] font-black px-6 py-2.5 rounded-xl text-xs shadow-lg transition-all"
                    >
                      รับทราบ / ปิดสแกน (CLOSE SCAN)
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* TARGET SELECTION BANNER & CARD PICKER (FOR STEAL / DISABLE) */}
            <AnimatePresence>
              {counterPrompt && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-red-900/90 backdrop-blur-md z-[99999] flex flex-col items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ scale: 0.8, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.8, y: 50 }}
                    className="bg-[#0b0e1e] border-4 border-red-500 rounded-3xl p-8 max-w-xl w-full shadow-[0_0_100px_rgba(239,68,68,0.6)] flex flex-col items-center text-center"
                  >
                    <AlertCircle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
                    <h2 className="text-red-500 font-black text-3xl mb-2 uppercase tracking-widest">การโจมตีจาก {counterPrompt.attackerName}!</h2>
                    <p className="text-gray-300 text-lg mb-8">คุณกำลังตกเป็นเป้าหมายของการ์ด <span className="text-white font-bold bg-red-500/20 px-2 py-1 rounded">[{counterPrompt.card.name}]</span></p>
                    
                    <div className="flex flex-col gap-4 w-full">
                      <button
                        onClick={() => {
                          const hasCounter = gameState.players[username]?.hand.some(c => c.id === 'counter');
                          if (hasCounter) {
                            socket.emit('use_counter');
                            setCounterPrompt(null);
                          } else {
                            setBattleMessage('⚠️ คุณไม่มีการ์ด 2FA Enabled ในมือ!');
                            setTimeout(() => setBattleMessage(''), 2000);
                          }
                        }}
                        className="bg-green-500 hover:bg-green-400 text-black font-black text-xl py-4 rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <Shield className="w-6 h-6" /> ป้องกันด้วย [2FA Enabled]
                      </button>
                      
                      <button
                        onClick={() => {
                          socket.emit('decline_counter');
                          setCounterPrompt(null);
                        }}
                        className="bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold py-3 rounded-2xl transition-all"
                      >
                        ยอมรับการโจมตี
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* TARGET LOCKED MODAL FOR STEAL */}
            <AnimatePresence>
              {targetingCard && selectedTarget && targetingCard.id === 'steal' && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 z-50">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-transparent w-full max-w-3xl flex flex-col items-center"
                  >
                    <div className="flex flex-col items-center mb-8">
                      <Target className="w-12 h-12 text-[#ff0055] animate-ping mb-2" />
                      <h2 className="text-[#ff0055] font-black text-3xl sm:text-5xl tracking-widest drop-shadow-[0_0_20px_rgba(255,0,85,0.8)]">
                        TARGET LOCKED
                      </h2>
                      <p className="text-white text-lg mt-2">
                        กำลังแฮ็ก <span className="font-bold text-[#00f0ff]">{selectedTarget.name}</span>
                      </p>
                      <p className="text-[#00f0ff] animate-pulse mt-2">
                        คลิกเลือกไพ่ 1 ใบเพื่อทำการขโมย!
                      </p>
                    </div>

                    <div className="flex flex-row justify-center items-center w-full mb-12 px-4 relative h-48">
                      {selectedTarget.hand && selectedTarget.hand.map((_, idx) => {
                        const totalCards = selectedTarget.hand.length;
                        const offset = idx - (totalCards - 1) / 2;
                        const rotation = offset * 8;
                        const yOffset = Math.abs(offset) * 10;
                        const xOffset = offset * 70;
                        return (
                          <motion.button
                            key={idx}
                            initial={{ y: 100, x: xOffset, opacity: 0, rotate: 0 }}
                            animate={{ y: yOffset, x: xOffset, rotate: rotation, opacity: 1 }}
                            transition={{ delay: idx * 0.05, type: "spring", stiffness: 200, damping: 20 }}
                            whileHover={{ y: yOffset - 30, scale: 1.15, zIndex: 50 }}
                            onClick={() => executeTargetedCard(selectedTarget.id)}
                            className="absolute w-24 sm:w-32 h-36 sm:h-48 rounded-xl bg-gradient-to-b from-[#1a2b4c] to-[#0a1128] border-2 border-[#00f0ff]/50 shadow-[0_0_15px_rgba(0,240,255,0.3)] flex-shrink-0 hover:border-[#00f0ff] hover:shadow-[0_0_40px_rgba(0,240,255,0.9)] cursor-pointer"
                            style={{ 
                              transformOrigin: 'bottom center',
                              zIndex: 10 + idx
                            }}
                          >
                            <div className="absolute inset-2 border border-[#00f0ff]/30 rounded-lg flex items-center justify-center bg-[#00f0ff]/10">
                              <span className="text-4xl opacity-30 text-[#00f0ff]">?</span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => { setTargetingCard(null); setSelectedTarget(null); setSelectedCardForPlay(null); }}
                      className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-8 py-3 rounded-full font-bold transition-all border border-gray-600 mt-8"
                    >
                      ✕ ยกเลิก
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>


            {/* TARGET SELECTION BANNER & CARD PICKER (FOR STEAL / DISABLE) */}
            <AnimatePresence>
              {targetingCard && !selectedTarget && (
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 20, opacity: 1 }}
                  exit={{ y: -50, opacity: 0 }}
                  className="absolute top-[8%] left-0 right-0 flex justify-center z-[9999] pointer-events-none"
                >
                  <div className="bg-[#0b0e1e]/95 backdrop-blur-md border-2 border-[#00f0ff] rounded-full px-6 py-3 sm:px-8 sm:py-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 shadow-[0_0_40px_rgba(0,240,255,0.6)] pointer-events-auto">
                    <Target className="w-6 h-6 sm:w-8 sm:h-8 text-[#00f0ff] animate-pulse hidden sm:block" />
                    <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                      <span className="text-white font-black text-sm sm:text-lg">เล็งเป้าหมาย [{targetingCard.name}]</span>
                      <span className="text-[#00f0ff] text-[10px] sm:text-xs font-bold animate-pulse">👉 คลิกเลือกโปรไฟล์ผู้เล่นบนโต๊ะได้เลย!</span>
                    </div>
                    <button
                      onClick={() => { setTargetingCard(null); setSelectedTarget(null); setSelectedCardForPlay(null); }}
                      className="mt-2 sm:mt-0 sm:ml-4 bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-sm font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    >
                      ✕ ยกเลิก
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MODAL 2: VICTORY / DEFEAT GAME OVER MODAL */}
            <AnimatePresence>
              {gameState.winner && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`border-2 rounded-3xl p-6 w-full max-w-md shadow-2xl text-center font-mono ${
                      gameState.winner.id === username
                        ? 'bg-[#071a10] border-[#00ff66] shadow-[0_0_50px_rgba(0,255,102,0.6)]'
                        : 'bg-[#18080f] border-[#ff0055] shadow-[0_0_50px_rgba(255,0,85,0.6)]'
                    }`}
                  >
                    <div className="text-5xl mb-2">
                      {gameState.winner.id === username ? '🏆' : '💀'}
                    </div>

                    <div className={`font-black text-2xl mb-1 ${
                      gameState.winner.id === username ? 'text-[#00ff66]' : 'text-[#ff0055]'
                    }`}>
                      {gameState.winner.id === username ? 'VICTORY!' : 'GAME OVER'}
                    </div>

                    <div className="text-sm font-bold text-white mb-2">
                      ผู้ชนะ: {gameState.winner.name}
                    </div>

                    {gameState.winner.id === username && (
                      <div className="my-4 bg-[#00ff66]/10 border border-[#00ff66]/40 p-3 rounded-2xl text-xs text-[#00ff66]">
                        <div className="font-black text-sm">🎉 ได้รับรางวัล +50 COINS!</div>
                        <div className="text-[10px] text-gray-300 mt-0.5">ยอดเหรียญถูกอัปเดตลงฐานข้อมูล SQLite แล้ว</div>
                      </div>
                    )}

                    <div className="flex gap-3 mt-5">
                      <button
                        onClick={handleRestartMatch}
                        className="flex-1 py-2.5 rounded-xl font-black text-xs bg-[#00ff66] hover:bg-[#20ff7a] text-[#04120a] shadow-lg flex items-center justify-center gap-1.5 transition-all"
                      >
                        <RotateCcw className="w-4 h-4" /> เล่นอีกครั้ง (PLAY AGAIN)
                      </button>
                      
                      <button
                        onClick={handleLeaveBattle}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all"
                      >
                        🏠 ล็อบบี้
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </div>
        )}
      </main>

      {/* ================= COMPACT FOOTER ================= */}
      <footer className="w-full text-center py-1 font-mono text-[10px] text-[#6b7a90] border-t border-white/5 flex-shrink-0">
        Cyber Card Engine &bull; CRRU CTF Network
      </footer>

      {/* ================= CTFd-STYLE ADMIN BACKOFFICE MODAL ================= */}
      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b0e1e] border-2 border-[#ff0055] rounded-2xl w-full max-w-4xl h-[85vh] max-h-[85vh] flex flex-col shadow-[0_0_40px_rgba(255,0,85,0.4)] overflow-hidden font-mono select-text"
            >
              {/* CTFd Header */}
              <div className="bg-[#12162b] px-4 py-2.5 border-b border-[#ff0055]/40 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2 text-white">
                  <Wrench className="w-5 h-5 text-[#ff0055]" />
                  <span className="font-black text-sm sm:text-base tracking-wider uppercase">
                    CTFd <span className="text-[#ff0055]">ADMIN CONTROL PANEL</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {adminSuccessMsg && (
                    <span className="text-[11px] text-[#00ff66] bg-[#00ff66]/10 px-2 py-0.5 rounded border border-[#00ff66]/30">
                      ✓ {adminSuccessMsg}
                    </span>
                  )}
                  <button onClick={() => setShowAdminModal(false)} className="text-gray-400 hover:text-white p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* CTFd Admin Tabs */}
              <div className="flex items-center border-b border-gray-800 bg-[#080b16] px-4 text-xs flex-shrink-0 overflow-x-auto">
                <button
                  onClick={() => setAdminTab('cards')}
                  className={`py-2.5 px-4 font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                    adminTab === 'cards' ? 'border-[#00ff66] text-[#00ff66]' : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4" /> จัดการการ์ด (Card Pool) [{cardPool.length}]
                </button>

                <button
                  onClick={() => setAdminTab('banners')}
                  className={`py-2.5 px-4 font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                    adminTab === 'banners' ? 'border-[#ffe600] text-[#ffe600]' : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Dices className="w-4 h-4" /> จัดการตู้กาชา (Gacha Banners) [{gachaBanners.length}]
                </button>

                <button
                  onClick={() => setAdminTab('users')}
                  className={`py-2.5 px-4 font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                    adminTab === 'users' ? 'border-[#00f0ff] text-[#00f0ff]' : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" /> จัดการผู้เล่น (Users & Coins)
                </button>
              </div>

              {/* Admin Tab Scrollable Body */}
              <div 
                className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 custom-scrollbar scrollable-modal text-xs"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                
                {/* 1. CARD POOL MANAGER */}
                {adminTab === 'cards' && (
                  <div className="flex flex-col gap-4">
                    {/* Add / Edit Card Form */}
                    <form onSubmit={handleSaveCard} className="bg-[#12162b] p-3 rounded-xl border border-gray-800 flex flex-col gap-2.5">
                      <span className="font-bold text-[#00ff66] text-xs flex items-center gap-1">
                        <Plus className="w-4 h-4" /> เพิ่ม / แก้ไข การ์ดในเกม
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          placeholder="Card ID (e.g. ddos_attack)"
                          value={cardForm.id}
                          onChange={e => setCardForm({ ...cardForm, id: e.target.value })}
                          className="bg-[#060814] border border-gray-700 px-2.5 py-1.5 rounded text-white"
                          required
                        />
                        <input
                          type="text"
                          placeholder="ชื่อการ์ด (e.g. DDoS Flood)"
                          value={cardForm.name}
                          onChange={e => setCardForm({ ...cardForm, name: e.target.value })}
                          className="bg-[#060814] border border-gray-700 px-2.5 py-1.5 rounded text-white"
                          required
                        />
                        <select
                          value={cardForm.type}
                          onChange={e => setCardForm({ ...cardForm, type: e.target.value })}
                          className="bg-[#060814] border border-gray-700 px-2.5 py-1.5 rounded text-white"
                        >
                          <option value="ACTION">ACTION (การ์ดคำสั่ง)</option>
                          <option value="THREAT">THREAT (ภัยคุกคาม)</option>
                          <option value="DEFUSE">DEFUSE (การ์ดกู้ภัย)</option>
                        </select>
                        <input
                          type="number"
                          placeholder="จำนวนใบในเด็ค"
                          value={cardForm.count}
                          onChange={e => setCardForm({ ...cardForm, count: e.target.value })}
                          className="bg-[#060814] border border-gray-700 px-2.5 py-1.5 rounded text-white"
                          min={1}
                          max={20}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="คำอธิบาย Lore (e.g. ยิงทราฟฟิกถล่มเซิร์ฟเวอร์จนล่ม)"
                          value={cardForm.flavor}
                          onChange={e => setCardForm({ ...cardForm, flavor: e.target.value })}
                          className="bg-[#060814] border border-gray-700 px-2.5 py-1.5 rounded text-white"
                        />
                        <input
                          type="text"
                          placeholder="คำแนะนำความปลอดภัย (e.g. เปิดใช้ Rate Limiting)"
                          value={cardForm.tip}
                          onChange={e => setCardForm({ ...cardForm, tip: e.target.value })}
                          className="bg-[#060814] border border-gray-700 px-2.5 py-1.5 rounded text-white"
                        />
                      </div>
                      <button type="submit" className="game-btn-green py-2 rounded-lg font-black text-xs self-end px-6">
                        บันทึกการ์ด
                      </button>
                    </form>

                    {/* Cards Table */}
                    <div className="border border-gray-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-[#12162b] text-gray-400 font-bold border-b border-gray-800">
                          <tr>
                            <th className="p-2">ID</th>
                            <th className="p-2">ชื่อการ์ด</th>
                            <th className="p-2">ประเภท</th>
                            <th className="p-2">จำนวน</th>
                            <th className="p-2 text-right">การจัดการ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cardPool.map((c) => (
                            <tr key={c.id} className="border-b border-gray-800/60 hover:bg-[#12162b]/50">
                              <td className="p-2 font-mono text-[#00f0ff]">{c.id}</td>
                              <td className="p-2 font-bold text-white">{c.name}</td>
                              <td className="p-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                  c.type === 'THREAT' ? 'bg-[#ff0055]/20 text-[#ff0055]' : c.type === 'DEFUSE' ? 'bg-[#00ff66]/20 text-[#00ff66]' : 'bg-[#00f0ff]/20 text-[#00f0ff]'
                                }`}>
                                  {c.type}
                                </span>
                              </td>
                              <td className="p-2 text-gray-300">{c.count} ใบ</td>
                              <td className="p-2 text-right">
                                <button
                                  onClick={() => setCardForm(c)}
                                  className="text-[#ffe600] hover:underline mr-2"
                                >
                                  แก้ไข
                                </button>
                                <button
                                  onClick={() => handleDeleteCard(c.id)}
                                  className="text-[#ff0055] hover:underline"
                                >
                                  ลบ
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. GACHA BANNER POD MANAGER */}
                {adminTab === 'banners' && (
                  <div className="flex flex-col gap-4">
                    {/* Add / Edit Banner Form */}
                    <form onSubmit={handleSaveBanner} className="bg-[#12162b] p-3 rounded-xl border border-gray-800 flex flex-col gap-2">
                      <span className="font-bold text-[#ffe600] text-xs flex items-center gap-1">
                        <Plus className="w-4 h-4" /> สร้างตู้กาชาใหม่ (Add Gacha Pod)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        <input
                          type="text"
                          placeholder="Banner ID (e.g. lucky_cube_pod)"
                          value={bannerForm.id}
                          onChange={e => setBannerForm({ ...bannerForm, id: e.target.value })}
                          className="bg-[#060814] border border-gray-700 px-2 py-1.5 rounded text-white"
                          required
                        />
                        <input
                          type="text"
                          placeholder="ชื่อตู้ (e.g. ตู้ Lucky Star)"
                          value={bannerForm.name}
                          onChange={e => setBannerForm({ ...bannerForm, name: e.target.value })}
                          className="bg-[#060814] border border-gray-700 px-2 py-1.5 rounded text-white"
                          required
                        />
                        <input
                          type="text"
                          placeholder="ไอคอน (e.g. 🎲, 🗡️, 🎁)"
                          value={bannerForm.icon}
                          onChange={e => setBannerForm({ ...bannerForm, icon: e.target.value })}
                          className="bg-[#060814] border border-gray-700 px-2 py-1.5 rounded text-white"
                        />
                        <input
                          type="number"
                          placeholder="ราคาเหรียญ (Coins)"
                          value={bannerForm.cost}
                          onChange={e => setBannerForm({ ...bannerForm, cost: e.target.value })}
                          className="bg-[#060814] border border-gray-700 px-2 py-1.5 rounded text-white"
                        />
                        <input
                          type="text"
                          placeholder="Theme Color (#ffe600)"
                          value={bannerForm.themeColor}
                          onChange={e => setBannerForm({ ...bannerForm, themeColor: e.target.value })}
                          className="bg-[#060814] border border-gray-700 px-2 py-1.5 rounded text-white"
                        />
                      </div>
                      <button type="submit" className="game-btn-yellow py-1.5 rounded-lg font-black text-xs self-end px-5">
                        สร้างตู้กาชา
                      </button>
                    </form>

                    {/* Banner List & Their Items */}
                    <div className="flex flex-col gap-3">
                      {gachaBanners.map(b => (
                        <div key={b.id} className="bg-[#060814] border border-gray-800 rounded-xl p-3 flex flex-col gap-2">
                          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{b.icon}</span>
                              <div>
                                <span className="font-bold text-white text-sm" style={{ color: b.themeColor }}>{b.name}</span>
                                <span className="text-gray-500 text-[10px] block font-mono">ID: {b.id} &bull; ราคา: {b.cost} Coins &bull; ของในตู้ {b.items?.length || 0} ชิ้น</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedAdminBannerId(b.id)}
                                className="px-2.5 py-1 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/40 rounded hover:bg-[#00f0ff]/20 font-bold"
                              >
                                + ใส่ของในตู้นี้
                              </button>
                              <button
                                onClick={() => handleDeleteBanner(b.id)}
                                className="text-[#ff0055] hover:underline"
                              >
                                ลบตู้
                              </button>
                            </div>
                          </div>

                          {/* Items inside this banner */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                            {b.items?.map(it => (
                              <div key={it.id} className={`bg-[#12162b] border ${it.border || 'border-gray-700'} p-2 rounded-lg flex items-center justify-between text-[11px]`}>
                                <div className="flex items-center gap-1.5 truncate">
                                  <span>{it.icon}</span>
                                  <div className="truncate">
                                    <div className="font-bold text-white truncate">{it.name}</div>
                                    <div className="text-[9px]" style={{ color: it.color }}>{it.rarity} ({it.odds})</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteItemFromBanner(b.id, it.id)}
                                  className="text-gray-500 hover:text-[#ff0055] ml-1"
                                  title="ลบของชิ้นนี้"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Item Modal to Selected Banner */}
                    {selectedAdminBannerId && (
                      <form onSubmit={handleAddItemToBanner} className="bg-[#12162b] p-3 rounded-xl border border-[#00f0ff] flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[#00f0ff] font-bold">
                          <span>➕ เพิ่มไอเทมใหม่เข้าตู้ [{selectedAdminBannerId}]</span>
                          <button type="button" onClick={() => setSelectedAdminBannerId('')} className="text-gray-400">ปิด</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <input
                            type="text"
                            placeholder="Item ID (e.g. fx_cyber_flame)"
                            value={itemForm.id}
                            onChange={e => setItemForm({ ...itemForm, id: e.target.value })}
                            className="bg-[#060814] border border-gray-700 px-2 py-1 rounded text-white"
                            required
                          />
                          <input
                            type="text"
                            placeholder="ชื่อไอเทม (e.g. Cyber Flame FX)"
                            value={itemForm.name}
                            onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                            className="bg-[#060814] border border-gray-700 px-2 py-1 rounded text-white"
                            required
                          />
                          <select
                            value={itemForm.rarity}
                            onChange={e => {
                              const r = e.target.value;
                              const c = r === 'LEGENDARY' ? '#ffe600' : r === 'EPIC' ? '#ff0055' : r === 'RARE' ? '#00f0ff' : '#00ff66';
                              setItemForm({ ...itemForm, rarity: r, color: c });
                            }}
                            className="bg-[#060814] border border-gray-700 px-2 py-1 rounded text-white"
                          >
                            <option value="LEGENDARY">LEGENDARY (1 in 100)</option>
                            <option value="EPIC">EPIC (1 in 25)</option>
                            <option value="RARE">RARE (1 in 10)</option>
                            <option value="COMMON">COMMON (1 in 2)</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Icon (e.g. ⚡, 🦊, 🔥)"
                            value={itemForm.icon}
                            onChange={e => setItemForm({ ...itemForm, icon: e.target.value })}
                            className="bg-[#060814] border border-gray-700 px-2 py-1 rounded text-white"
                          />
                        </div>
                        <button type="submit" className="game-btn-cyan py-1.5 rounded-lg font-black text-xs self-end px-5">
                          ยืนยันเพิ่มของเข้าตู้
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* 3. USER & COINS MANAGER */}
                {adminTab === 'users' && (
                  <div className="flex flex-col gap-3">
                    <span className="font-bold text-white text-xs">รายชื่อผู้เล่นที่ลงทะเบียนในระบบ ({adminUsersList.length} คน):</span>
                    <div className="border border-gray-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-[#12162b] text-gray-400 font-bold border-b border-gray-800">
                          <tr>
                            <th className="p-2">Username</th>
                            <th className="p-2">Email</th>
                            <th className="p-2">Role</th>
                            <th className="p-2">Coins</th>
                            <th className="p-2 text-right">ให้เหรียญ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminUsersList.map((u) => (
                            <tr key={u.username} className="border-b border-gray-800/60 hover:bg-[#12162b]/50">
                              <td className="p-2 font-bold text-[#00ff66]">{u.username}</td>
                              <td className="p-2 text-gray-400">{u.email}</td>
                              <td className="p-2 text-gray-300">{u.role}</td>
                              <td className="p-2 font-mono text-[#ffe600]">{(u.stats?.coins || 0).toLocaleString()}</td>
                              <td className="p-2 text-right">
                                <button
                                  onClick={() => handleGiveCoins(u.username, 5000)}
                                  className="px-2 py-0.5 bg-[#ffe600]/10 text-[#ffe600] border border-[#ffe600]/40 rounded hover:bg-[#ffe600]/20 font-bold mr-1"
                                >
                                  +5,000
                                </button>
                                <button
                                  onClick={() => handleGiveCoins(u.username, 20000)}
                                  className="px-2 py-0.5 bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/40 rounded hover:bg-[#00ff66]/20 font-bold"
                                >
                                  +20,000
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}

        {/* Profile Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="game-board-panel rounded-2xl p-4 sm:p-5 max-w-md w-full relative border border-[#ffe600] shadow-2xl"
            >
              <button onClick={() => setShowProfileModal(false)} className="absolute top-3 right-3 text-[#6b7a90] hover:text-white">
                <X className="w-4 h-4" />
              </button>

              <div className="font-black text-sm text-[#ffe600] mb-3 flex items-center gap-1.5">
                <UserCog className="w-4 h-4" /> ปรับแต่งโปรไฟล์ AGENT
              </div>

              <div className="flex flex-col gap-3 font-mono text-xs max-h-[65vh] overflow-y-auto pr-1 custom-scrollbar">
                <div>
                  <span className="text-[11px] text-[#00f0ff] font-bold block mb-1.5">👤 รูปอวตาร:</span>
                  <div className="grid grid-cols-6 gap-1.5">
                    {['🦊', '🛡️', '🗡️', '🤖', '👾', '👑', '⚡', '🔥', '🐉', '🐱', '💀', '🚀'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setSelectedAvatar(emoji)}
                        className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center border ${
                          selectedAvatar === emoji ? 'border-[#ffe600] bg-[#ffe600]/20' : 'border-gray-800 bg-[#12162b]'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-[#ffe600] font-bold block mb-1.5">🏆 ฉายา:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['ZERO-DAY HUNTER', 'CYBER AGENT', 'NODE MASTER', 'DEFUSE SPECIALIST'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTitle(t)}
                        className={`py-1.5 px-2 rounded-lg text-center font-bold text-[10px] border ${
                          selectedTitle === t ? 'bg-[#ffe600]/20 text-[#ffe600] border-[#ffe600]' : 'bg-[#12162b] text-gray-400 border-gray-800'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-[#00ff66] font-bold block mb-1.5">🎴 ลายหลังการ์ด:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['🟢 Matrix Cyber', '🔴 Crimson Hacker', '🔵 Quantum Core', '🟡 Cyber Gold'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSleeve(s)}
                        className={`py-1.5 px-2 rounded-lg text-center font-bold text-[10px] border ${
                          selectedSleeve === s ? 'bg-[#00ff66]/20 text-[#00ff66] border-[#00ff66]' : 'bg-[#12162b] text-gray-400 border-gray-800'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  socket?.emit('update_profile', {
                    avatar: selectedAvatar,
                    title: selectedTitle,
                    sleeve: selectedSleeve
                  });
                  setShowProfileModal(false);
                }}
                className="game-btn-yellow w-full mt-3 py-2 rounded-xl font-black text-xs"
              >
                บันทึกเรียบร้อย
              </button>
            </motion.div>
          </div>
        )}

        {/* Bot Setup Modal */}
        {showBotModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="game-board-panel rounded-2xl p-4 sm:p-5 max-w-sm w-full relative border border-[#00ff66] shadow-2xl text-left"
            >
              <button onClick={() => setShowBotModal(false)} className="absolute top-3 right-3 text-[#6b7a90] hover:text-white">
                <X className="w-4 h-4" />
              </button>

              <div className="font-black text-sm text-[#00ff66] mb-1 flex items-center gap-1.5">
                <Bot className="w-4 h-4" /> ตั้งค่า SINGLE PLAYER (AI BOTS)
              </div>
              <p className="font-mono text-[11px] text-[#6b7a90] mb-4">เลือกจำนวน AI Bot</p>

              <div className="grid grid-cols-4 gap-2 mb-4 font-mono">
                {[1, 2, 3, 4].map((c) => (
                  <button
                    key={c}
                    onClick={() => setBotCount(c)}
                    className={`py-2 rounded-xl font-black text-sm border flex flex-col items-center ${
                      botCount === c ? 'bg-[#00ff66] text-black border-[#00ff66]' : 'bg-[#060814] text-gray-400 border-gray-800'
                    }`}
                  >
                    <span>{c}</span>
                    <span className="text-[9px]">{c === 1 ? '1v1' : `รวม ${c+1}`}</span>
                  </button>
                ))}
              </div>

              <button onClick={handleStartBotMatch} className="game-btn-green w-full py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5">
                <Play className="w-4 h-4" /> เริ่มเกมกับบอททันที!
              </button>
            </motion.div>
          </div>
        )}

        {/* Auth Modal */}
        {authModal !== 'none' && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="game-board-panel rounded-2xl p-5 max-w-sm w-full relative border border-[#00f0ff] shadow-2xl"
            >
              <button onClick={() => setAuthModal('none')} className="absolute top-3 right-3 text-[#6b7a90] hover:text-white">
                <X className="w-4 h-4" />
              </button>

              <h2 className="text-base font-black text-white mb-3 font-sans">
                {authModal === 'login' ? '// ACCESS_DECK' : '// CREATE_CREDENTIALS'}
              </h2>

              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-2.5 font-mono text-left text-xs">
                <div>
                  <label className="text-[10px] text-[#00f0ff] font-bold block mb-0.5">AGENT ID *</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="NeoHacker"
                    className="w-full bg-[#060814] border border-[#00f0ff]/40 px-2.5 py-1.5 text-white rounded-lg text-xs"
                    required
                  />
                </div>

                {authModal === 'register' && (
                  <div>
                    <label className="text-[10px] text-[#ff0055] font-bold block mb-0.5">EMAIL *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="agent@cyber.xyz"
                      className="w-full bg-[#060814] border border-[#00f0ff]/40 px-2.5 py-1.5 text-white rounded-lg text-xs"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] text-[#00f0ff] font-bold block mb-0.5">PASSPHRASE *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#060814] border border-[#00f0ff]/40 px-2.5 py-1.5 text-white rounded-lg text-xs"
                    required
                  />
                </div>

                {authModal === 'register' && (
                  <div>
                    <label className="text-[10px] text-[#ff0055] font-bold block mb-0.5">CONFIRM PASSPHRASE *</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#060814] border border-[#00f0ff]/40 px-2.5 py-1.5 text-white rounded-lg text-xs"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`mt-2 py-2 font-black text-xs rounded-xl ${
                    authModal === 'login' ? 'game-btn-cyan' : 'game-btn-pink'
                  }`}
                >
                  {authModal === 'login' ? '[// ACCESS]' : '[// INITIALIZE]'}
                </button>
              </form>

              {authError && (
                <div className="mt-2 text-[#ff0055] font-bold bg-[#ff0055]/10 py-1 px-2 rounded border border-[#ff0055]/30 text-[10px] font-mono">
                  {authError}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Create Room Modal */}
        {roomModal === 'create' && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="game-board-panel rounded-2xl p-4 max-w-sm w-full relative border border-[#ffe600] shadow-2xl text-left"
            >
              <button onClick={() => setRoomModal('none')} className="absolute top-3 right-3 text-[#6b7a90] hover:text-white">
                <X className="w-4 h-4" />
              </button>
              <h3 className="font-black text-sm text-[#ffe600] mb-2 font-mono">➕ สร้างห้องใหม่</h3>
              <form onSubmit={handleCreateRoom} className="flex flex-col gap-2 font-mono text-xs">
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="ชื่อห้อง..."
                  className="w-full bg-[#060814] border border-[#ffe600]/40 px-2.5 py-1.5 text-white rounded-lg text-xs"
                />
                <input
                  type="password"
                  value={newRoomPassword}
                  onChange={(e) => setNewRoomPassword(e.target.value)}
                  placeholder="รหัสผ่าน (เว้นว่างไว้หากไม่ต้องการ)"
                  className="w-full bg-[#060814] border border-gray-600 px-2.5 py-1.5 text-white rounded-lg text-xs"
                />
                <button type="submit" className="game-btn-yellow py-2 rounded-xl font-black text-xs mt-1">
                  ยืนยันสร้างห้อง
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Search Room Modal */}
        {roomModal === 'search' && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="game-board-panel rounded-2xl p-4 max-w-sm w-full relative border border-[#00f0ff] shadow-2xl text-left"
            >
              <button onClick={() => setRoomModal('none')} className="absolute top-3 right-3 text-[#6b7a90] hover:text-white">
                <X className="w-4 h-4" />
              </button>
              <h3 className="font-black text-sm text-[#00f0ff] mb-2 font-mono">🔍 ค้นหาหมายเลขห้อง</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleJoinSpecificRoom(searchRoomId); }} className="flex flex-col gap-2 font-mono text-xs">
                <input
                  type="text"
                  value={searchRoomId}
                  onChange={(e) => setSearchRoomId(e.target.value)}
                  placeholder="101"
                  className="w-full bg-[#060814] border border-[#00f0ff]/40 px-2.5 py-1.5 text-[#00f0ff] font-bold text-center text-sm rounded-lg"
                  required
                />
                <button type="submit" className="game-btn-cyan py-2 rounded-xl font-black text-xs mt-1">
                  เข้าร่วมห้อง
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Password Prompt Modal */}
        {roomModal === 'password' && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="game-board-panel rounded-2xl p-4 max-w-sm w-full relative border border-gray-500 shadow-2xl text-left"
            >
              <button onClick={() => { setRoomModal('none'); setSelectedPrivateRoomId(null); setJoinRoomPassword(''); }} className="absolute top-3 right-3 text-[#6b7a90] hover:text-white">
                <X className="w-4 h-4" />
              </button>
              <h3 className="font-black text-sm text-gray-300 mb-2 font-mono flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> ห้องเข้ารหัส (Private Room)
              </h3>
              <form onSubmit={(e) => { e.preventDefault(); handleJoinSpecificRoom(selectedPrivateRoomId, joinRoomPassword); }} className="flex flex-col gap-2 font-mono text-xs">
                <input
                  type="password"
                  value={joinRoomPassword}
                  onChange={(e) => setJoinRoomPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน..."
                  className="w-full bg-[#060814] border border-gray-600 px-2.5 py-1.5 text-white rounded-lg text-xs"
                  autoFocus
                />
                <button type="submit" className="bg-gray-700 hover:bg-gray-600 text-white border border-gray-500 py-2 rounded-xl font-black text-xs mt-1 shadow-lg transition-all">
                  ปลดล็อคและเข้าร่วม
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* ================= GACHA ROBLOX HATCHING & REVEAL POPUP MODAL ================= */}
        {showGachaModal && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-lg flex items-center justify-center p-3 sm:p-5 z-50 overflow-hidden">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0b0e20] border-2 rounded-3xl p-4 sm:p-6 max-w-2xl w-full flex flex-col items-center justify-between shadow-[0_0_50px_rgba(0,0,0,0.9)] relative overflow-hidden font-mono"
              style={{ borderColor: currentBanner.themeColor }}
            >
              
              {/* Background Glow */}
              <div 
                className="absolute inset-0 blur-3xl opacity-20 pointer-events-none"
                style={{ backgroundColor: currentBanner.themeColor }}
              />

              {/* Popup Top Bar */}
              <div className="w-full flex items-center justify-between border-b border-gray-800 pb-2.5 z-10">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{currentBanner.icon}</span>
                  <div className="text-left leading-tight">
                    <span className="font-extrabold text-sm text-white">{currentBanner.name}</span>
                    <span className="text-[10px] text-gray-400 block">
                      {pullCount === 10 ? '✨ สุ่มครั้งละ 10 ใบ (10-Wish Multi Pull)' : '⚡ สุ่มเดี่ยว 1 ใบ (Single Wish)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFastRoll(!isFastRoll)}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-[10px] transition-all border ${
                      isFastRoll ? 'bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff]' : 'bg-[#060814] text-[#6b7a90] border-gray-800'
                    }`}
                  >
                    <FastForward className="w-2.5 h-2.5" /> FAST
                  </button>

                  <button 
                    onClick={() => setShowGachaModal(false)}
                    className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Center Animation Stage (Bouncing / Cracking / Revealing) */}
              <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center py-4 z-10">
                
                {/* 1. ROBLOX SQUASH & STRETCH BOUNCING STAGE */}
                {(rollStage === 'bouncing' || rollStage === 'cracking') && (
                  <motion.div
                    key="roblox-bouncing-cube"
                    animate={
                      rollStage === 'bouncing'
                        ? {
                            scaleX: isFastRoll ? [1, 1.3, 0.7, 1.3, 0.7, 1.3] : [1, 1.4, 0.6, 1.3, 0.7, 1.35, 0.65, 1.4],
                            scaleY: isFastRoll ? [1, 0.7, 1.3, 0.7, 1.3, 0.7] : [1, 0.6, 1.4, 0.7, 1.3, 0.65, 1.35, 0.6],
                            y: isFastRoll ? [0, -15, 0, -25, 0] : [0, -18, 5, -28, 5, -35, 0],
                            rotate: [0, -8, 8, -12, 12, -15, 0]
                          }
                        : {
                            scale: [1, 1.6, 2],
                            opacity: [1, 0.8, 0],
                            rotate: [0, 180]
                          }
                    }
                    transition={{ duration: rollStage === 'bouncing' ? (isFastRoll ? 0.4 : 0.8) : 0.4, ease: "easeInOut" }}
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <div 
                      className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-br from-[#1b2347] to-[#080b16] border-4 flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.9)] relative overflow-hidden"
                      style={{ borderColor: currentBanner.themeColor }}
                    >
                      <span className="text-5xl sm:text-6xl drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
                        {rollStage === 'bouncing' ? '⚡' : '💥'}
                      </span>
                    </div>

                    <span 
                      className="font-mono text-xs sm:text-sm font-black mt-3 tracking-widest uppercase drop-shadow-md px-3 py-1 rounded-full bg-[#080b16] border border-gray-800 animate-pulse"
                      style={{ color: currentBanner.themeColor }}
                    >
                      {rollStage === 'bouncing' ? '💥 HATCHING IN PROGRESS... 💥' : '✨ EXPLODING... ✨'}
                    </span>
                  </motion.div>
                )}

                {/* 2. REVEALED ITEMS (SINGLE VS 10-PULL GRID) */}
                {rollStage === 'revealing' && (
                  <div className="w-full flex flex-col items-center justify-center">
                    
                    {/* SINGLE PULL REVEAL (1x) */}
                    {pullCount === 1 && wonItem && (
                      <motion.div
                        initial={{ scale: 0, rotate: -20, y: 30 }}
                        animate={{ scale: [0, 1.3, 1.0], rotate: [-20, 6, 0], y: 0 }}
                        transition={{ duration: 0.5, type: "spring", bounce: 0.5 }}
                        className="flex flex-col items-center justify-center max-w-sm w-full"
                      >
                        <div 
                          className="px-4 py-1 rounded-full font-mono text-[10px] font-black tracking-widest uppercase mb-2 shadow-lg"
                          style={{ backgroundColor: wonItem.color, color: '#000' }}
                        >
                          {wonItem.rarity} &bull; {wonItem.odds}
                        </div>

                        <div 
                          className={`w-full bg-[#0d1228] border-2 ${wonItem.border} rounded-2xl p-4 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.9)] relative overflow-hidden`}
                          style={{ boxShadow: `0 0 35px ${wonItem.bgGlow}` }}
                        >
                          <span className="text-6xl my-2 drop-shadow-[0_0_20px_currentColor]" style={{ color: wonItem.color }}>
                            {wonItem.icon}
                          </span>
                          
                          <div className="font-black text-base text-white text-center leading-tight mt-1 truncate w-full">
                            {wonItem.name}
                          </div>

                          <div className="text-[#ffe600] text-xs font-black tracking-widest my-0.5">
                            {wonItem.rarity === 'LEGENDARY' ? '★★★★★' : wonItem.rarity === 'EPIC' ? '★★★★' : wonItem.rarity === 'RARE' ? '★★★' : '★★'}
                          </div>
                          
                          <span className="text-[10px] text-gray-300 font-mono text-center mt-1 line-clamp-2">
                            {wonItem.desc}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* MULTI PULL REVEAL (10x GRID) */}
                    {pullCount === 10 && multiWonItems.length > 0 && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-full"
                      >
                        <div className="text-center font-black text-xs text-[#ffe600] mb-2 tracking-wider">
                          🎉 ผลลัพธ์การสุ่ม 10 ครั้ง (10 PULLS RESULT) 🎉
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-[50vh] overflow-y-auto custom-scrollbar p-1">
                          {multiWonItems.map((item, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ scale: 0, y: 15 }}
                              animate={{ scale: 1, y: 0 }}
                              transition={{ delay: idx * 0.05, duration: 0.3 }}
                              className={`bg-[#0d1228] border-2 ${item.border} rounded-xl p-2 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-md`}
                              style={{ boxShadow: item.rarity === 'LEGENDARY' || item.rarity === 'EPIC' ? `0 0 15px ${item.bgGlow}` : 'none' }}
                            >
                              <span 
                                className="text-[7.5px] font-black px-1.5 py-0.2 rounded uppercase mb-1"
                                style={{ backgroundColor: item.color, color: '#000' }}
                              >
                                {item.rarity === 'LEGENDARY' ? '5★' : item.rarity === 'EPIC' ? '4★' : item.rarity === 'RARE' ? '3★' : '2★'}
                              </span>

                              <span className="text-2xl my-1 drop-shadow-md">{item.icon}</span>
                              <div className="font-black text-[10px] text-white truncate w-full leading-tight">{item.name}</div>
                              <span className="text-[7.5px] text-gray-400 truncate w-full mt-0.5">{item.odds}</span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                  </div>
                )}

              </div>

              {/* Popup Bottom Actions */}
              <div className="w-full flex items-center justify-between border-t border-gray-800 pt-3 z-10">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                  <Coins className="w-3.5 h-3.5 text-[#ffe600]" />
                  <span>เหลือ: <strong className="text-white font-mono">{coins.toLocaleString()}</strong> Coins</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRobloxRoll(pullCount)}
                    disabled={rollStage === 'bouncing' || rollStage === 'cracking' || coins < (currentBanner.cost * pullCount)}
                    className="px-4 py-2 rounded-xl font-black text-xs bg-gradient-to-r from-[#ffe600] to-[#ffaa00] hover:brightness-110 text-black shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> สุ่มอีกครั้ง ×{pullCount} ({(currentBanner.cost * pullCount).toLocaleString()} C)
                  </button>

                  <button
                    onClick={() => setShowGachaModal(false)}
                    className="px-4 py-2 rounded-xl font-bold text-xs bg-[#12162b] hover:bg-white/10 text-white border border-gray-700 transition-all"
                  >
                    ✓ ปิดหน้าต่าง (Close)
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}

        {/* ================= GACHA BANNER DETAILS / DROP TABLE MODAL ================= */}
        {showBannerDetailsModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b0e20] border border-[#00f0ff] rounded-2xl p-4 sm:p-5 max-w-lg w-full flex flex-col shadow-2xl relative font-mono text-xs max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-3 flex-shrink-0">
                <div className="flex items-center gap-2 text-white font-black text-sm">
                  <span>{currentBanner.icon}</span>
                  <span>รายละเอียดตู้: {currentBanner.name}</span>
                </div>
                <button onClick={() => setShowBannerDetailsModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Rates Info */}
              <div className="bg-[#12162b] p-3 rounded-xl border border-gray-800 mb-3 flex-shrink-0">
                <div className="font-bold text-[#00f0ff] mb-1">📊 อัตราการได้รับไอเทมตามระดับ (Drop Rates):</div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-gray-300">
                  <div>🟡 5★ Legendary: <strong className="text-[#ffe600]">5.00%</strong></div>
                  <div>🔴 4★ Epic: <strong className="text-[#ff0055]">20.00%</strong></div>
                  <div>🟣 3★ Rare: <strong className="text-[#00f0ff]">30.00%</strong></div>
                  <div>🟢 2★ Common: <strong className="text-[#00ff66]">45.00%</strong></div>
                </div>
                <div className="mt-2 text-[10px] text-[#ffe600] border-t border-gray-800 pt-1">
                  ⭐ การันตี: เมื่อสุ่มแบบ 10 ครั้ง รับประกันได้รับระดับ Epic (4★) หรือสูงกว่าแน่นอน 1 ชิ้น
                </div>
              </div>

              {/* Items in Banner */}
              <div className="font-bold text-white mb-1.5 flex-shrink-0">📦 รายการไอเทมทั้งหมดในตู้นี้ ({currentBanner.items?.length || 0}):</div>
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-1">
                {currentBanner.items?.map((item, idx) => (
                  <div key={idx} className={`bg-[#060814] border ${item.border} rounded-lg p-2 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      <div className="text-left truncate">
                        <div className="font-bold text-white text-xs">{item.name}</div>
                        <div className="text-[9px] text-gray-400 truncate">{item.desc}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: item.color, color: '#000' }}>
                        {item.rarity}
                      </span>
                      <span className="text-[9px] text-gray-400 mt-0.5 font-bold">{item.odds}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowBannerDetailsModal(false)}
                className="game-btn-cyan w-full py-2 rounded-xl font-bold text-xs mt-3 flex-shrink-0"
              >
                เข้าใจแล้ว (Close)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHUFFLE ANIMATION OVERLAY */}
      <AnimatePresence>
        {isShuffling && (
          <div className="fixed inset-0 pointer-events-none z-[99997] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="relative w-full h-full max-w-md max-h-md flex items-center justify-center"
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    x: [0, (Math.random() - 0.5) * 400, 0], 
                    y: [0, (Math.random() - 0.5) * 400, 0],
                    rotate: [0, (Math.random() - 0.5) * 720, 0]
                  }}
                  transition={{ duration: 0.6, repeat: 1, ease: "easeInOut" }}
                  className="absolute w-20 h-28 sm:w-24 sm:h-32 bg-gradient-to-br from-[#1a1100] to-[#0a0500] border-2 border-[#ffaa00] rounded-xl shadow-[0_0_30px_rgba(255,170,0,0.6)] flex items-center justify-center"
                  style={{ zIndex: Math.floor(Math.random() * 10) }}
                >
                  <div className="w-[85%] h-[90%] border border-[#ffaa00]/30 rounded-lg flex items-center justify-center bg-black/50">
                    <span className="text-[#ffaa00]/50 text-4xl">🎲</span>
                  </div>
                </motion.div>
              ))}
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <span className="text-5xl sm:text-7xl font-black italic text-white drop-shadow-[0_0_20px_#ffaa00] uppercase tracking-widest mix-blend-overlay">
                  SHUFFLING
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ACTION BANNER HUD */}
      <AnimatePresence>
        {actionBanner && (
          <div className="fixed inset-0 pointer-events-none z-[99998] flex items-center justify-center overflow-hidden">
            
            {/* BACKGROUND EFFECTS */}
            {actionBanner.cardId.includes('see_future') && (
              <motion.div 
                initial={{ opacity: 0, scale: 0 }} 
                animate={{ opacity: 0.8, scale: [1, 1.2, 1.5] }} 
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="absolute w-[150vw] h-[150vw] sm:w-[60vw] sm:h-[60vw] rounded-full border-[8px] border-[#00f0ff] border-dashed animate-[spin_10s_linear_infinite] shadow-[0_0_50px_#00f0ff]"></div>
                <div className="absolute w-[100vw] h-[100vw] sm:w-[40vw] sm:h-[40vw] rounded-full border-[4px] border-[#00f0ff] border-dotted animate-[spin_5s_reverse_linear_infinite] shadow-[0_0_30px_#00f0ff]"></div>
                <span className="absolute text-[200px] sm:text-[250px] opacity-70 filter drop-shadow-[0_0_30px_rgba(0,240,255,1)]">👁️</span>
              </motion.div>
            )}

            {(actionBanner.cardId === 'skip' || actionBanner.cardId === 'forward') && (
              <motion.div className="absolute inset-0 flex flex-col items-center justify-center gap-10 opacity-80">
                {[...Array(6)].map((_, i) => (
                  <motion.div 
                    key={i}
                    initial={{ x: '-100vw' }}
                    animate={{ x: '100vw' }}
                    transition={{ duration: 0.4, delay: Math.random() * 0.5, ease: "linear", repeat: Infinity }}
                    className="w-[200vw] h-2 sm:h-3 bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent shadow-[0_0_30px_#00f0ff]"
                  />
                ))}
              </motion.div>
            )}

            {actionBanner.cardId === 'steal' && actionBanner.targetId === username && (
              <motion.div 
                initial={{ scale: 3, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.8 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                <div className="relative w-64 h-64 sm:w-96 sm:h-96">
                  <div className="absolute top-0 left-0 w-16 h-16 border-t-8 border-l-8 border-[#ff0055] rounded-tl-2xl shadow-[-10px_-10px_20px_rgba(255,0,85,0.6)]"></div>
                  <div className="absolute top-0 right-0 w-16 h-16 border-t-8 border-r-8 border-[#ff0055] rounded-tr-2xl shadow-[10px_-10px_20px_rgba(255,0,85,0.6)]"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 border-b-8 border-l-8 border-[#ff0055] rounded-bl-2xl shadow-[-10px_10px_20px_rgba(255,0,85,0.6)]"></div>
                  <div className="absolute bottom-0 right-0 w-16 h-16 border-b-8 border-r-8 border-[#ff0055] rounded-br-2xl shadow-[10px_10px_20px_rgba(255,0,85,0.6)]"></div>
                </div>
                <span className="absolute text-[#ff0055] text-3xl sm:text-5xl font-black animate-pulse mt-12 tracking-widest drop-shadow-[0_0_20px_rgba(255,0,85,1)]">[ TARGET LOCKED ]</span>
              </motion.div>
            )}

            {actionBanner.cardId === 'disable' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0.3, 0.9, 0] }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 flex items-center justify-center mix-blend-screen"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,0,85,0.4) 20px, rgba(255,0,85,0.4) 40px)' }}
              >
                <span className="absolute text-[250px] sm:text-[300px] opacity-60 filter drop-shadow-[0_0_50px_rgba(255,0,85,1)]">🚫</span>
              </motion.div>
            )}

            {actionBanner.actionType === 'bomb_explode' && actionBanner.targetId === username && (
              <motion.div 
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: [1, 5], opacity: [1, 0] }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-red-600 mix-blend-color-dodge z-[999]"
              >
                <span className="text-[300px] filter drop-shadow-[0_0_100px_rgba(255,0,0,1)]">💥</span>
                <span className="text-white text-6xl font-black mt-10 tracking-[1em] drop-shadow-[0_0_20px_rgba(255,0,0,1)]">ELIMINATED</span>
              </motion.div>
            )}

            {actionBanner.actionType === 'bomb_defused' && actionBanner.targetId === username && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
                transition={{ duration: 2, ease: "easeOut", times: [0, 0.2, 1] }}
                className="absolute inset-0 flex flex-col items-center justify-center z-[999]"
              >
                <span className="text-[250px] filter drop-shadow-[0_0_50px_rgba(0,255,100,1)]">🛡️</span>
                <span className="text-[#00ff66] text-5xl font-black mt-10 tracking-[0.5em] drop-shadow-[0_0_20px_rgba(0,255,100,1)]">DEFUSED!</span>
              </motion.div>
            )}

            {/* BANNER TEXT */}
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 50, rotateX: 90 }}
              animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
              exit={{ scale: 1.5, opacity: 0, filter: 'blur(10px)' }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="flex flex-col items-center justify-center relative z-10"
            >
              <div className="text-white/80 font-mono text-sm sm:text-base font-bold tracking-[0.2em] mb-2 uppercase flex items-center gap-2">
                <span className="w-8 h-[1px] bg-white/50"></span>
                {actionBanner.actionType === 'bomb_explode' ? `${actionBanner.playerName} TRIGGERED` :
                 actionBanner.actionType === 'bomb_defused' ? `${actionBanner.playerName} DEFUSED` :
                 `${actionBanner.playerName} INITIATED`}
                <span className="w-8 h-[1px] bg-white/50"></span>
              </div>
              
              <div className={`px-8 py-4 sm:px-12 sm:py-6 rounded-2xl border-2 bg-[#050a18]/90 backdrop-blur-md shadow-2xl relative overflow-hidden ${
                actionBanner.type === 'THREAT' ? 'border-[#ff0055] shadow-[0_0_50px_rgba(255,0,85,0.4)]' :
                actionBanner.type === 'DEFUSE' ? 'border-[#00ff66] shadow-[0_0_50px_rgba(0,255,102,0.4)]' :
                'border-[#00f0ff] shadow-[0_0_50px_rgba(0,240,255,0.4)]'
              }`}>
                {/* Glitch Overlay */}
                <div className="absolute inset-0 bg-white/5 opacity-0 animate-pulse mix-blend-overlay"></div>
                
                <h1 className={`text-4xl sm:text-6xl font-black italic tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r ${
                  actionBanner.type === 'THREAT' ? 'from-[#ff0055] to-[#ff6699]' :
                  actionBanner.type === 'DEFUSE' ? 'from-[#00ff66] to-[#66ffaa]' :
                  'from-[#00f0ff] to-[#66f5ff]'
                }`}>
                  {actionBanner.cardName}
                </h1>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLYING CARDS OVERLAY */}
      <div className="fixed inset-0 pointer-events-none z-[99999] flex items-center justify-center">
        <AnimatePresence>
          {animatingCards.map(c => {
            const pos = getPlayerPos(c.playerId);
            const deckPos = { x: '-12vw', y: '0vh' };
            const discardPos = { x: '-5vw', y: '0vh' };

            const start = c.action === 'draw' ? deckPos : pos;
            const end = c.action === 'draw' ? pos : discardPos;
            
            return (
              <motion.div
                key={c.animId}
                initial={{ x: start.x, y: start.y, scale: 0.2, opacity: 0, rotate: (Math.random() - 0.5) * 45 }}
                animate={{ x: end.x, y: end.y, scale: c.action === 'draw' ? 0.6 : 0.8, opacity: 1, rotate: (Math.random() - 0.5) * 20 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`absolute w-20 h-28 sm:w-24 sm:h-32 rounded-2xl p-1.5 flex flex-col border-2 shadow-[0_0_30px_rgba(0,240,255,0.8)] ${
                  !c.card || c.action === 'draw'
                    ? 'bg-gradient-to-b from-[#1a2b4c] to-[#0a1128] border-[#00f0ff] items-center justify-center' 
                    : c.card.type === 'THREAT' 
                      ? 'bg-[#1a0810] border-[#ff0055]' 
                      : c.card.type === 'DEFUSE' 
                        ? 'bg-[#081a10] border-[#00ff66]' 
                        : 'bg-[#15233c] border-[#00f0ff]'
                }`}
              >
                {(!c.card || c.action === 'draw') ? (
                  <div className="w-[85%] h-[90%] border border-[#00f0ff]/40 rounded-xl bg-gradient-to-b from-[#0b1228] to-[#040814] flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="w-8 h-8 rounded-full border border-[#00f0ff]/20 flex items-center justify-center z-10">
                      <div className="w-4 h-4 rounded-full bg-[#00f0ff]/10" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00f0ff]/5 to-transparent h-full w-full animate-scan"></div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-1 flex-shrink-0">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-[8px] sm:text-[9px] text-white leading-tight line-clamp-1">{c.card.name}</span>
                        <span className={`text-[6px] sm:text-[7px] font-black font-mono mt-0.5 ${
                          c.card.type === 'THREAT' ? 'text-[#ff0055]' : c.card.type === 'DEFUSE' ? 'text-[#00ff66]' : 'text-[#00f0ff]'
                        }`}>
                          [{c.card.type}]
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] leading-none ml-0.5">
                        {c.card.type === 'DEFUSE' ? '🛡️' : c.card.type === 'THREAT' ? '⚠️' : '⚡'}
                      </span>
                    </div>
                    <div className="flex-1 w-full bg-[#03040a]/80 rounded border border-gray-800/80 flex items-center justify-center relative overflow-hidden mb-1">
                      <div className="flex flex-col items-center justify-center opacity-40">
                         <span className="text-gray-500 text-xs">🖼️</span>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

    </div>
  )
}

export default App

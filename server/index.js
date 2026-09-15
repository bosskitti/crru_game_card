const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { 
  registerUser, loginUser, verifySession, getAllUsers, giveUserCoins, getUserCoins, updateUserCoins, updateProfile,
  getAllCards, saveCard, deleteCard,
  getAllGachaBanners, saveGachaBanner, deleteGachaBanner, addItemToBanner, deleteItemFromBanner
} = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const rooms = {};
let roomCounter = 1;
const afkTimers = {};
const connectedUsers = {}; // socket.id -> { id, username, status }

const createRoomState = (name, isSinglePlayer = false) => ({
  name: name || `NODE #${String(roomCounter++).padStart(3, '0')}`,
  players: {}, 
  deck: [],
  discardPile: [],
  turnIndex: 0,
  isGameStarted: false,
  isSinglePlayer: !!isSinglePlayer,
  createdAt: Date.now(),
  actionLogs: [],
  extraTurnsRemaining: 0,
  winner: null
});

const addRoomLog = (room, message) => {
  if (!room) return;
  const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  room.actionLogs = room.actionLogs || [];
  room.actionLogs.unshift({ time, message });
  if (room.actionLogs.length > 30) room.actionLogs.pop();
};

const checkGameWinner = (roomId) => {
  const room = rooms[roomId];
  if (!room || !room.isGameStarted || room.winner) return null;

  const alivePlayers = Object.values(room.players).filter(p => p.isAlive);
  if (alivePlayers.length === 1) {
    const winner = alivePlayers[0];
    room.winner = winner;
    addRoomLog(room, `🏆 [WINNER] ${winner.name} ได้รับชัยชนะในสมรภูมินี้! 🎉`);

    // Award coins to human winner
    if (!winner.isBot && winner.name) {
      updateUserCoins(winner.name, 50);
      const sockets = Array.from(io.sockets.sockets.values());
      sockets.forEach(s => {
        if (s.username === winner.name) {
          s.emit('coins_updated', { coins: getUserCoins(winner.name) });
          s.emit('game_victory', { rewardCoins: 50 });
        }
      });
    }

    if (afkTimers[roomId]) {
      clearTimeout(afkTimers[roomId]);
      delete afkTimers[roomId];
    }

    io.to(roomId).emit('game_update', room);
    return winner;
  }
  return null;
};

const startAfkTimer = (roomId, player) => {
  if (!player || player.isBot) return;
  
  if (afkTimers[roomId]) {
    clearTimeout(afkTimers[roomId]);
    delete afkTimers[roomId];
  }

  const room = rooms[roomId];
  if (!room) return;
  const currentTurn = room.turnIndex;
  
  room.turnStartTime = Date.now();

  afkTimers[roomId] = setTimeout(() => {
    const checkRoom = rooms[roomId];
    if (checkRoom && checkRoom.turnIndex === currentTurn && !checkRoom.winner) {
      addRoomLog(checkRoom, `⏳ ${player.name} AFK 15 วิ! ระบบตั้งให้ Bot เล่นแทนอัตโนมัติ...`);
      player.isAfkBot = true;
      player.isBot = true;
      io.to(roomId).emit('game_update', checkRoom);
      triggerBotTurnIfNeeded(roomId);
    }
  }, 15000);
};


const getNextAlivePlayer = (room) => {
  const playerIds = Object.keys(room.players);
  let nextIdx = (room.turnIndex + 1) % playerIds.length;
  let loops = 0;
  while (loops < playerIds.length) {
    const p = room.players[playerIds[nextIdx]];
    if (p && p.isAlive) return p;
    nextIdx = (nextIdx + 1) % playerIds.length;
    loops++;
  }
  return null;
};

const delayedAdvanceTurn = (roomId, delay = 1500) => {
  const room = rooms[roomId];
  if (!room) return;
  room.isAdvancingTurn = true;
  setTimeout(() => {
    if (rooms[roomId]) {
      rooms[roomId].isAdvancingTurn = false;
      advanceTurn(roomId);
    }
  }, delay);
};
const advanceTurn = (roomId) => {
  const room = rooms[roomId];
  if (!room || !room.isGameStarted) return;

  if (checkGameWinner(roomId)) return;

  const playerIds = Object.keys(room.players);
  if (playerIds.length === 0) return;
  
  // Clear isDisabled for the player whose turn is ending!
  const currentPid = playerIds[room.turnIndex % playerIds.length];
  if (room.players[currentPid]) {
    room.players[currentPid].isDisabled = false;
  }

  if (room.extraTurnsRemaining > 0) {
    room.extraTurnsRemaining -= 1;
    const currentPid = playerIds[room.turnIndex % playerIds.length];
    const currentPlayer = room.players[currentPid];
    if (currentPlayer && currentPlayer.isAlive) {
      addRoomLog(room, `⚡ ${currentPlayer.name} ต้องเล่นต่ออีก 1 เทิร์น (ผลจาก Attack)`);
      io.to(roomId).emit('game_update', room);
      if (currentPlayer.isBot) triggerBotTurnIfNeeded(roomId);
      return;
    }
  }

  let nextIndex = (room.turnIndex + 1) % playerIds.length;
  let count = 0;
  while (!room.players[playerIds[nextIndex]].isAlive && count < playerIds.length) {
    nextIndex = (nextIndex + 1) % playerIds.length;
    count++;
  }

  room.turnIndex = nextIndex;
  room.turnStartTime = Date.now();
  const nextPlayer = room.players[playerIds[nextIndex]];
  if (nextPlayer) {
    addRoomLog(room, `👉 ถึงเทิร์นของ: ${nextPlayer.name}`);
  }

  io.to(roomId).emit('game_update', room);

  if (afkTimers[roomId]) {
    clearTimeout(afkTimers[roomId]);
    delete afkTimers[roomId];
  }

  if (nextPlayer && nextPlayer.isAlive) {
    if (nextPlayer.isBot) {
      triggerBotTurnIfNeeded(roomId);
    } else {
      startAfkTimer(roomId, nextPlayer);
    }
  }
};

// Intelligent Bot Logic Runner
const triggerBotTurnIfNeeded = (roomId) => {
  const room = rooms[roomId];
  if (!room || !room.isGameStarted || room.winner) return;

  const playerIds = Object.keys(room.players);
  const currentPlayerId = playerIds[room.turnIndex % playerIds.length];
  const bot = room.players[currentPlayerId];

  if (!bot || !bot.isBot || !bot.isAlive) return;

  setTimeout(() => {
    // Check if room still valid
    if (!rooms[roomId] || !room.isGameStarted || room.winner) return;

    // 1. Bot decides if it wants to play an action card
    const playableActionIdx = bot.hand.findIndex(c => c.type === 'ACTION');
    if (playableActionIdx !== -1 && Math.random() < 0.6) {
      const card = bot.hand.splice(playableActionIdx, 1)[0];
      room.discardPile.push(card);

      let target = null;
      if (card.id === 'steal' || card.id === 'disable') {
        const aliveOpponents = Object.values(room.players).filter(p => p.id !== bot.id && p.isAlive && p.hand.length > 0);
        if (aliveOpponents.length > 0) {
          target = aliveOpponents[Math.floor(Math.random() * aliveOpponents.length)];
        }
      }

      io.to(roomId).emit('animate_action', { action: 'play', playerId: bot.id, playerName: bot.name, card, targetId: target ? target.id : null });

      if (card.id === 'skip' || card.id === 'forward') {
        addRoomLog(room, `🤖 ${bot.name} ใช้การ์ด [${card.name}] (ข้ามการจั่วไพ่)`);
        delayedAdvanceTurn(roomId, 2000);
        return;
      } else if (card.id === 'attack') {
        room.extraTurnsRemaining = 1;
        addRoomLog(room, `🤖 ${bot.name} ใช้การ์ด [${card.name}] (บังคับผู้เล่นถัดไปจั่ว 2 รอบ!)`);
        delayedAdvanceTurn(roomId, 2000);
        return;
      } else if (card.id === 'shuffle') {
        room.deck.sort(() => Math.random() - 0.5);
        addRoomLog(room, `🤖 ${bot.name} ใช้การ์ด [${card.name}] (สับกองไพ่ใหม่)`);
      } else if (card.id === 'see_future') {
        addRoomLog(room, `🤖 ${bot.name} ใช้การ์ด [${card.name}] (แอบสแกนดูไพ่บนสุด)`);
      } else if (card.id === 'steal' || card.id === 'disable') {
        if (target) {
          if (card.id === 'steal') {
            const stolenIdx = Math.floor(Math.random() * target.hand.length);
            const stolenCard = target.hand.splice(stolenIdx, 1)[0];
            bot.hand.push(stolenCard);
            addRoomLog(room, `🤖 ${bot.name} ใช้การ์ด [${card.name}] ขโมยไพ่จาก ${target.name} 1 ใบ!`);
          } else {
            target.isDisabled = true;
            addRoomLog(room, `🛑 ${bot.name} ใช้การ์ด [${card.name}] แฮ็กเซสชันของ ${target.name}!`);
          }
        } else {
          addRoomLog(room, `🤖 ${bot.name} ลงการ์ด [${card.name}] แต่ไม่มีเป้าหมายให้ใช้`);
        }
      } else {
        addRoomLog(room, `🤖 ${bot.name} ลงการ์ด [${card.name}]`);
      }

      io.to(roomId).emit('game_update', room);
    }

    // 2. Bot draws a card to end turn
    setTimeout(() => {
      if (!rooms[roomId] || !room.isGameStarted || room.winner) return;

      if (room.deck.length === 0) {
        addRoomLog(room, `⚠️ กองไพ่หมดแล้ว! สับไพ่จากกองทิ้งกลับเข้ากอง`);
        const nonThreats = room.discardPile.filter(c => c.type !== 'THREAT');
        room.deck = nonThreats.sort(() => Math.random() - 0.5);
      }

      if (room.deck.length > 0) {
        const drawnCard = room.deck.pop();
        io.to(roomId).emit('animate_action', { action: 'draw', playerId: bot.id, playerName: bot.name });
        if (drawnCard.type === 'THREAT') {
          const defuseIdx = bot.isDisabled ? -1 : bot.hand.findIndex(c => c.type === 'DEFUSE');
          if (defuseIdx !== -1) {
            io.to(roomId).emit('animate_action', { action: 'bomb_defused', playerId: bot.id, playerName: bot.name, card: drawnCard });
            const defuseCard = bot.hand.splice(defuseIdx, 1)[0];
            room.discardPile.push(defuseCard);
            room.deck.push(drawnCard);
            room.deck.sort(() => Math.random() - 0.5);
            addRoomLog(room, `🛡️ ${bot.name} จั่วเจอ [${drawnCard.name}] แต่ใช้ DEFUSE ป้องกันได้ทัน!`);
          } else {
            io.to(roomId).emit('animate_action', { action: 'bomb_explode', playerId: bot.id, playerName: bot.name, card: drawnCard });
            bot.isAlive = false;
            if (bot.isDisabled) {
               addRoomLog(room, `🚫 เซสชันของ ${bot.name} ถูกแฮ็กอยู่! ไม่สามารถใช้ Backup กู้ภัยได้!`);
            }
            addRoomLog(room, `💥 ${bot.name} โดน [${drawnCard.name}] โจมตี! ถูกกำจัดออกจากเกม! 💀`);
          }
        } else {
          bot.hand.push(drawnCard);
          addRoomLog(room, `🤖 ${bot.name} จั่วการ์ด 1 ใบ`);
        }
      }

      bot.isDisabled = false; // clear at end of turn
      delayedAdvanceTurn(roomId, 1500);
    }, 2500); // Increased from 1000 to 2500 to allow action animations to finish
  }, 2500); // Increased from 1200 to 2500 to allow turn transition UI to finish
};


const executeCardEffect = (roomId, player, card, targetPlayerId) => {
  const room = rooms[roomId];
  if (!room) return;
  
  if (card.id === 'skip' || card.id === 'forward') {
    addRoomLog(room, `⚡ ${player.name} ใช้การ์ด [${card.name}] (ข้ามการจั่วไพ่)`);
    delayedAdvanceTurn(roomId, 1500);
  } else if (card.id === 'attack') {
    room.extraTurnsRemaining = 1;
    addRoomLog(room, `⚔️ ${player.name} ใช้การ์ด [${card.name}] (ส่งต่อให้ผู้เล่นถัดไปจั่ว 2 รอบ!)`);
    delayedAdvanceTurn(roomId, 1500);
  } else if (card.id === 'see_future') {
    const top3 = room.deck.slice(-3).reverse();
    if (player.isBot) {
      addRoomLog(room, `🔍 ${player.name} ใช้การ์ด [${card.name}] สแกนดูไพ่ 3 ใบบนสุด`);
      delayedAdvanceTurn(roomId, 2000);
    } else {
      const targetSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === player.id);
      if (targetSocket) targetSocket.emit('see_future_result', { cards: top3 });
      addRoomLog(room, `🔍 ${player.name} ใช้การ์ด [${card.name}] สแกนดูไพ่ 3 ใบบนสุด`);
    }
  } else if (card.id === 'shuffle') {
    room.deck.sort(() => Math.random() - 0.5);
    addRoomLog(room, `🔀 ${player.name} ใช้การ์ด [${card.name}] สับกองไพ่ใหม่`);
    if (player.isBot) {
      delayedAdvanceTurn(roomId, 2000);
    }
  } else if (card.id === 'steal' || card.id === 'disable') {
    let target = null;
    if (targetPlayerId && room.players[targetPlayerId] && room.players[targetPlayerId].isAlive) {
      target = room.players[targetPlayerId];
    } else {
      const aliveOpponents = Object.values(room.players).filter(p => p.id !== player.id && p.isAlive && p.hand.length > 0);
      if (aliveOpponents.length > 0) {
        target = aliveOpponents[Math.floor(Math.random() * aliveOpponents.length)];
      }
    }
    
    if (target) {
      if (card.id === 'steal') {
        const stolenIdx = Math.floor(Math.random() * target.hand.length);
        const stolenCard = target.hand.splice(stolenIdx, 1)[0];
        player.hand.push(stolenCard);
        addRoomLog(room, `🕵️ ${player.name} ใช้การ์ด [${card.name}] ขโมยไพ่จาก ${target.name} 1 ใบ!`);
      } else {
        target.isDisabled = true;
        addRoomLog(room, `🛑 ${player.name} ใช้การ์ด [${card.name}] แฮ็กเซสชันของ ${target.name}!`);
      }
    } else {
      addRoomLog(room, `⚠️ ${player.name} ใช้การ์ด [${card.name}] แต่ไม่มีเป้าหมาย`);
    }
    if (player.isBot) {
      delayedAdvanceTurn(roomId, 2000);
    }
  }
  io.to(roomId).emit('game_update', room);
};

const handleCardPlayWithInterrupt = (roomId, player, card, targetPlayerId) => {
  const room = rooms[roomId];
  if (!room) return;
  
  room.discardPile.push(card);
  io.to(roomId).emit('animate_action', { action: 'play', playerId: player.id, playerName: player.name, card, targetId: targetPlayerId });
  
  let victim = null;
  if (card.id === 'steal' || card.id === 'disable') {
    victim = room.players[targetPlayerId];
    if (!victim) {
      const aliveOpponents = Object.values(room.players).filter(p => p.id !== player.id && p.isAlive && p.hand.length > 0);
      if (aliveOpponents.length > 0) victim = aliveOpponents[Math.floor(Math.random() * aliveOpponents.length)];
    }
  } else if (card.id === 'attack') {
    victim = getNextAlivePlayer(room);
  }
  
  if (victim && victim.hand.some(c => c.id === 'counter')) {
    addRoomLog(room, `⏳ รอการตอบสนองจาก ${victim.name}...`);
    
    const resolveAction = () => {
      if (room.pendingActionTimer) clearTimeout(room.pendingActionTimer);
      room.pendingAction = null;
      io.to(roomId).emit('clear_prompt_counter', { victimId: victim.id });
      executeCardEffect(roomId, player, card, targetPlayerId);
    };
    
    if (victim.isBot) {
      setTimeout(() => {
        if (Math.random() > 0.3) {
          const counterIdx = victim.hand.findIndex(c => c.id === 'counter');
          if (counterIdx !== -1) {
             const counterCard = victim.hand.splice(counterIdx, 1)[0];
             room.discardPile.push(counterCard);
             io.to(roomId).emit('animate_action', { action: 'play', playerId: victim.id, playerName: victim.name, card: counterCard, targetId: player.id });
             addRoomLog(room, `🛡️ ${victim.name} ใช้การ์ด [2FA Enabled] โต้กลับ! ยกเลิกผลของการ์ด ${card.name}!`);
             io.to(roomId).emit('game_update', room);
             if (player.isBot) {
               delayedAdvanceTurn(roomId, 2000);
             }
             return;
          }
        }
        resolveAction();
      }, 2000);
    } else {
      io.to(roomId).emit('prompt_counter', { victimId: victim.id, cardName: card.name, attackerName: player.name });
      
      room.pendingAction = {
        resolve: resolveAction,
        cancel: () => {
           if (room.pendingActionTimer) clearTimeout(room.pendingActionTimer);
           room.pendingAction = null;
           io.to(roomId).emit('clear_prompt_counter', { victimId: victim.id });
           addRoomLog(room, `🛡️ ${victim.name} ใช้การ์ด [2FA Enabled] โต้กลับ! ยกเลิกผลของการ์ด ${card.name}!`);
           io.to(roomId).emit('game_update', room);
           if (player.isBot) {
             delayedAdvanceTurn(roomId, 2000);
           }
        }
      };
      
      room.pendingActionTimer = setTimeout(() => {
         if (room.pendingAction) room.pendingAction.resolve();
      }, 5000);
    }
  } else {
    executeCardEffect(roomId, player, card, targetPlayerId);
  }
};

const getPublicRooms = () => {
  return Object.keys(rooms)
    .filter(roomId => !rooms[roomId].isSinglePlayer)
    .map(roomId => {
      const r = rooms[roomId];
      const playersList = Object.values(r.players);
      return {
        roomId,
        name: r.name || `NODE #${roomId}`,
        host: playersList.find(p => !p.isBot)?.name || 'Unknown',
        playerCount: playersList.length,
        maxPlayers: 5,
        isGameStarted: r.isGameStarted,
        isPrivate: !!r.password,
        createdAt: r.createdAt
      };
    });
};

const broadcastRooms = () => {
  io.emit('rooms_list', getPublicRooms());
};

const broadcastOnlineUsers = () => {
  const list = Object.values(connectedUsers).filter(u => u.username);
  io.emit('online_users', list);
};

const updateUserStatus = (socketId, username, status) => {
  if (!username) return;
  connectedUsers[socketId] = {
    id: socketId,
    username,
    status: status || 'In Lobby',
    updatedAt: Date.now()
  };
  broadcastOnlineUsers();
};

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Send initial data to client from SQLite
  socket.emit('rooms_list', getPublicRooms());
  socket.emit('online_users', Object.values(connectedUsers).filter(u => u.username));
  socket.emit('card_pool_updated', getAllCards());
  socket.emit('gacha_banners_updated', getAllGachaBanners());

  // --- RESTORE SESSION ---
  socket.on('restore_session', ({ username, token }) => {
    if (!username || !token) return;
    const session = verifySession(username, token);
    if (session.success) {
      socket.username = session.user.username;
      socket.userRole = session.user.role || 'player';
      updateUserStatus(socket.id, username, 'In Lobby');
      
      const realCoins = getUserCoins(session.user.username);
      session.user.stats.coins = realCoins;

      socket.emit('auth_success', {
        username: session.user.username,
        role: session.user.role,
        stats: session.user.stats,
        profile: session.user.profile,
        coins: realCoins,
        token,
        message: 'Welcome back, Agent'
      });
      socket.emit('coins_updated', { coins: realCoins });
      
      // AUTO REJOIN ACTIVE ROOM
      let activeRoomId = null;
      for (const rId in rooms) {
        if (rooms[rId].players && rooms[rId].players[username]) {
          activeRoomId = rId;
          break;
        }
      }
      
      if (activeRoomId) {
        socket.join(activeRoomId);
        socket.roomId = activeRoomId;
        rooms[activeRoomId].players[username].isDisconnected = false;
        updateUserStatus(socket.id, username, `Room #${activeRoomId}`);
        socket.emit('room_update', rooms[activeRoomId]);
        io.to(activeRoomId).emit('game_update', rooms[activeRoomId]);
      }
      
      broadcastRooms();
    }
  });

  // --- AUTHENTICATION (SQLite) ---
  socket.on('register', ({ username, email, password }) => {
    const result = registerUser(username, email, password);
    if (!result.success) {
      socket.emit('auth_error', result.message);
      return;
    }

    socket.username = result.user.username;
    socket.userRole = result.user.role || 'player';
    updateUserStatus(socket.id, socket.username, 'In Lobby');
    
    const realCoins = getUserCoins(result.user.username);
    socket.emit('auth_success', {
      username: result.user.username,
      email: result.user.email,
      role: result.user.role,
      stats: result.user.stats,
      profile: result.user.profile || { avatar: '🦊', title: 'ZERO-DAY HUNTER', sleeve: '🟢 Matrix Cyber' },
      coins: realCoins,
      token: result.user.token
    });
    socket.emit('coins_updated', { coins: realCoins });
    broadcastRooms();
  });

  socket.on('login', ({ username, password }) => {
    const result = loginUser(username, password);
    if (!result.success) {
      socket.emit('auth_error', result.message);
      return;
    }

    socket.username = result.user.username;
    socket.userRole = result.user.role || 'player';
    updateUserStatus(socket.id, socket.username, 'In Lobby');
    
    const realCoins = getUserCoins(result.user.username);
    socket.emit('auth_success', {
      username: result.user.username,
      email: result.user.email,
      role: result.user.role,
      stats: result.user.stats,
      profile: result.user.profile || { avatar: '🦊', title: 'ZERO-DAY HUNTER', sleeve: '🟢 Matrix Cyber' },
      coins: realCoins,
      token: result.user.token
    });
    socket.emit('coins_updated', { coins: realCoins });
    broadcastRooms();
  });


  socket.on('update_profile', (profileData) => {
    if (!socket.username) return;
    const res = updateProfile(socket.username, profileData);
    if (res.success) {
      socket.emit('profile_updated', profileData);
    }
  });

  // --- REAL-TIME COINS MANAGEMENT ---
  socket.on('sync_coins', () => {
    if (socket.username) {
      const balance = getUserCoins(socket.username);
      socket.emit('coins_updated', { coins: balance });
    }
  });

  socket.on('gacha_roll_spend', ({ cost = 0, bonusWon = 0 }) => {
    if (!socket.username) return;
    const currentCoins = getUserCoins(socket.username);
    if (currentCoins < cost) {
      socket.emit('error', 'Coins ไม่เพียงพอสำหรับการสุ่ม!');
      socket.emit('coins_updated', { coins: currentCoins });
      return;
    }

    const delta = -parseInt(cost) + parseInt(bonusWon);
    const newBalance = updateUserCoins(socket.username, delta);
    socket.emit('coins_updated', { coins: newBalance });
  });

  // --- GET DATA ---
  socket.on('get_rooms', () => {
    socket.emit('rooms_list', getPublicRooms());
    broadcastOnlineUsers();
  });

  socket.on('get_gacha_banners', () => {
    socket.emit('gacha_banners_updated', getAllGachaBanners());
  });

  // --- SINGLE PLAYER / BOT MATCH ---
  socket.on('start_bot_game', ({ botCount = 1 }) => {
    if (!socket.username) {
      socket.emit('error', 'Not authenticated');
      return;
    }

    const count = Math.min(Math.max(parseInt(botCount) || 1, 1), 4);
    const roomId = `BOT-${Math.floor(100 + Math.random() * 900)}`;
    rooms[roomId] = createRoomState(`SOLO VS AI (${count} BOTS)`, true);
    
    socket.join(roomId);
    socket.roomId = roomId;

    rooms[roomId].players[socket.username] = {
      id: socket.username,
      name: socket.username,
      isBot: false,
      hand: [],
      isAlive: true
    };

    const botNames = ['🤖 AI-Sentinel', '🤖 CyberBot Alpha', '🤖 Zero-Day AI', '🤖 Neural Hunter'];
    for (let i = 1; i <= count; i++) {
      const botId = `bot-${i}-${Date.now()}`;
      rooms[roomId].players[botId] = {
        id: botId,
        name: botNames[i - 1] || `🤖 Bot ${i}`,
        isBot: true,
        hand: [],
        isAlive: true
      };
    }

    const currentPool = getAllCards();
    const defuseCardDef = currentPool.find(c => c.type === 'DEFUSE') || { id: 'defuse', type: 'DEFUSE', name: 'Stay Calm (Defuse)', color: 'green', flavor: 'Defense Firewall' };
    const threatCards = [];
    const regularCards = [];

    currentPool.forEach(cardDef => {
      if (cardDef.type === 'THREAT') {
        for (let i = 0; i < cardDef.count; i++) {
          threatCards.push({ ...cardDef, uniqueId: `${cardDef.id}-${i}-${Date.now()}` });
        }
      } else if (cardDef.type !== 'DEFUSE') {
        for (let i = 0; i < cardDef.count; i++) {
          regularCards.push({ ...cardDef, uniqueId: `${cardDef.id}-${i}-${Date.now()}` });
        }
      }
    });

    // Shuffle regular cards to deal
    regularCards.sort(() => Math.random() - 0.5);

    // Deal 1 guaranteed DEFUSE + 4 regular cards to each player
    Object.keys(rooms[roomId].players).forEach((pId, idx) => {
      const p = rooms[roomId].players[pId];
      p.hand = [
        { ...defuseCardDef, uniqueId: `defuse-init-${idx}-${Date.now()}` }
      ];
      for (let i = 0; i < 4; i++) {
        if (regularCards.length > 0) {
          p.hand.push(regularCards.pop());
        }
      }
    });

    // Add playerCount - 1 Threats into remaining regular cards + extra defuses
    const threatCount = Math.max(1, count);
    const activeThreats = threatCards.slice(0, threatCount);
    
    // Add remaining defuses
    for (let i = 0; i < 2; i++) {
      regularCards.push({ ...defuseCardDef, uniqueId: `defuse-deck-${i}-${Date.now()}` });
    }

    rooms[roomId].deck = [...regularCards, ...activeThreats].sort(() => Math.random() - 0.5);
    rooms[roomId].isGameStarted = true;
    rooms[roomId].turnIndex = 0;
    rooms[roomId].winner = null;
    rooms[roomId].discardPile = [];
    rooms[roomId].actionLogs = [];
    rooms[roomId].turnStartTime = Date.now();

    addRoomLog(rooms[roomId], `⚔️ สมรภูมิ Solo vs AI (${count} Bots) เริ่มต้นขึ้นแล้ว!`);
    const firstPlayer = Object.values(rooms[roomId].players)[0];
    addRoomLog(rooms[roomId], `👉 ถึงเทิร์นของ: ${firstPlayer.name}`);

    updateUserStatus(socket.id, socket.username, `Vs Bots (${count} AI)`);
    socket.emit('joined_room_success', { roomId });
    io.to(roomId).emit('game_start', rooms[roomId]);
    io.to(roomId).emit('game_update', rooms[roomId]);
    startAfkTimer(roomId, firstPlayer);
  });

  // --- MULTIPLAYER: CREATE ROOM ---
  socket.on('create_room', ({ roomName, password }) => {
    if (!socket.username) {
      socket.emit('error', 'Not authenticated');
      return;
    }

    const roomId = String(Math.floor(100 + Math.random() * 900));
    rooms[roomId] = createRoomState(roomName || `NODE #${roomId}`);
    
    if (password && password.trim().length > 0) {
      rooms[roomId].password = password.trim();
    }

    socket.join(roomId);
    socket.roomId = roomId;

    rooms[roomId].players[socket.username] = {
      id: socket.username,
      name: socket.username,
      hand: [],
      isAlive: true
    };

    updateUserStatus(socket.id, socket.username, `Room #${roomId}`);
    socket.emit('joined_room_success', { roomId });
    io.to(roomId).emit('game_update', rooms[roomId]);
    broadcastRooms();
  });

  // --- MULTIPLAYER: JOIN ROOM ---
  socket.on('join_room', ({ roomId, password }) => {
    if (!socket.username) {
      socket.emit('error', 'Not authenticated');
      return;
    }

    const targetRoomId = String(roomId).trim().toUpperCase();
    const room = rooms[targetRoomId];

    if (!room) {
      socket.emit('error', `Room #${targetRoomId} not found`);
      return;
    }

    if (room.password && room.password !== password) {
      socket.emit('error', 'รหัสผ่านไม่ถูกต้อง (Invalid Password)');
      return;
    }

    if (room.isGameStarted) {
      if (!room.players[socket.username]) {
        socket.emit('error', 'Game in progress');
        return;
      }
      room.players[socket.username].isDisconnected = false;
      if (room.players[socket.username].isAfkBot) {
         room.players[socket.username].isBot = false;
         room.players[socket.username].isAfkBot = false;
      }
    } else {
      if (Object.keys(room.players).length >= 5) {
        socket.emit('error', 'Room is full (max 5)');
        return;
      }
      room.players[socket.username] = {
        id: socket.username,
        name: socket.username,
        isBot: false,
        isAlive: true,
        hand: []
      };
    }

    socket.join(targetRoomId);
    socket.roomId = targetRoomId;
    updateUserStatus(socket.id, socket.username, `Room #${targetRoomId}`);
    socket.emit('joined_room_success', { roomId: targetRoomId });
    io.to(targetRoomId).emit('game_update', room);
    broadcastRooms();
  });

  // --- MULTIPLAYER: QUICK JOIN ---
  socket.on('quick_join', () => {
    if (!socket.username) {
      socket.emit('error', 'Not authenticated');
      return;
    }

    const availableRoomId = Object.keys(rooms).find(id => {
      const r = rooms[id];
      return !r.isSinglePlayer && !r.isGameStarted && Object.keys(r.players).length < 5;
    });

    if (availableRoomId) {
      socket.emit('quick_join_target', { roomId: availableRoomId });
    } else {
      const autoRoomId = String(Math.floor(100 + Math.random() * 900));
      rooms[autoRoomId] = createRoomState(`NODE #${autoRoomId}`);
      
      socket.join(autoRoomId);
      socket.roomId = autoRoomId;

      rooms[autoRoomId].players[socket.username] = {
        id: socket.username,
        name: socket.username,
        hand: [],
        isAlive: true
      };

      updateUserStatus(socket.id, socket.username, `Room #${autoRoomId}`);
      socket.emit('joined_room_success', { roomId: autoRoomId });
      io.to(autoRoomId).emit('game_update', rooms[autoRoomId]);
      broadcastRooms();
    }
  });

  // --- LEAVE ROOM ---
  socket.on('leave_room', () => {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId]) {
      socket.leave(roomId);
      delete rooms[roomId].players[socket.username];
      socket.roomId = null;

      updateUserStatus(socket.id, socket.username, 'In Lobby');

      if (Object.keys(rooms[roomId].players).filter(id => !rooms[roomId].players[id].isBot).length === 0) {
        delete rooms[roomId];
      } else {
        io.to(roomId).emit('game_update', rooms[roomId]);
      }
      broadcastRooms();
    }
  });

  // --- START GAME (MULTIPLAYER) ---
  socket.on('start_game', () => {
    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;
    
    const roomState = rooms[roomId];
    const playerIds = Object.keys(roomState.players);
    if (playerIds.length < 2) {
      socket.emit('error', 'Need at least 2 players to start');
      return;
    }
    
    const currentPool = getAllCards();
    const defuseCardDef = currentPool.find(c => c.type === 'DEFUSE') || { id: 'defuse', type: 'DEFUSE', name: 'Stay Calm (Defuse)', color: 'green', flavor: 'Defense Firewall' };
    const threatCards = [];
    const regularCards = [];

    currentPool.forEach(cardDef => {
      if (cardDef.type === 'THREAT') {
        for (let i = 0; i < cardDef.count; i++) {
          threatCards.push({ ...cardDef, uniqueId: `${cardDef.id}-${i}-${Date.now()}` });
        }
      } else if (cardDef.type !== 'DEFUSE') {
        for (let i = 0; i < cardDef.count; i++) {
          regularCards.push({ ...cardDef, uniqueId: `${cardDef.id}-${i}-${Date.now()}` });
        }
      }
    });

    regularCards.sort(() => Math.random() - 0.5);

    // Deal 1 guaranteed DEFUSE + 4 regular cards to each player
    playerIds.forEach((pId, idx) => {
      const p = roomState.players[pId];
      p.isAlive = true;
      p.hand = [
        { ...defuseCardDef, uniqueId: `defuse-init-${idx}-${Date.now()}` }
      ];
      for (let i = 0; i < 4; i++) {
        if (regularCards.length > 0) {
          p.hand.push(regularCards.pop());
        }
      }
      if (connectedUsers[pId]) {
        connectedUsers[pId].status = `In Battle (#${roomId})`;
      }
    });

    const threatCount = Math.max(1, playerIds.length - 1);
    const activeThreats = threatCards.slice(0, threatCount);

    for (let i = 0; i < 2; i++) {
      regularCards.push({ ...defuseCardDef, uniqueId: `defuse-deck-${i}-${Date.now()}` });
    }

    roomState.deck = [...regularCards, ...activeThreats].sort(() => Math.random() - 0.5);
    roomState.isGameStarted = true;
    roomState.turnIndex = 0;
    roomState.winner = null;
    roomState.discardPile = [];
    roomState.actionLogs = [];
    roomState.turnStartTime = Date.now();

    addRoomLog(roomState, `⚔️ สมรภูมิการ์ดดวลออนไลน์เริ่มขึ้นแล้ว!`);
    const firstPlayer = roomState.players[playerIds[0]];
    addRoomLog(roomState, `👉 ถึงเทิร์นของ: ${firstPlayer.name}`);

    broadcastOnlineUsers();
    io.to(roomId).emit('game_start', roomState);
    io.to(roomId).emit('game_update', roomState);
    broadcastRooms();
    startAfkTimer(roomId, firstPlayer);
  });

  // ================= IN-GAME CARD BATTLE ACTIONS =================

  // 1. DRAW CARD (Player clicks Deck or Draw button on their turn)
  socket.on('draw_card', () => {
    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;
    const room = rooms[roomId];

    if (!room.isGameStarted || room.winner) return;
    if (room.isAdvancingTurn) {
      socket.emit('error', 'กรุณารอสักครู่...');
      return;
    }

    const playerIds = Object.keys(room.players);
    const currentTurnPid = playerIds[room.turnIndex % playerIds.length];
    if (currentTurnPid !== socket.username) {
      console.log(`[draw_card] err: turnPid=${currentTurnPid}, me=${socket.username}, turnIdx=${room.turnIndex}, pIds=${playerIds}`);
      socket.emit('error', 'ยังไม่ใช่เทิร์นของคุณ!');
      return;
    }

    const player = room.players[socket.username];
    if (!player || !player.isAlive) return;

    if (player.isAfkBot) {
      player.isBot = false;
      player.isAfkBot = false;
      addRoomLog(room, `🎮 ${player.name} กลับมาเล่นเองแล้ว!`);
    }

    if (!player || !player.isAlive) return;

    // Reshuffle if deck empty
    if (room.deck.length === 0) {
      addRoomLog(room, `⚠️ กองไพ่หมด! สับไพ่จากกองทิ้งกลับเข้ากอง`);
      const nonThreats = room.discardPile.filter(c => c.type !== 'THREAT');
      room.deck = nonThreats.sort(() => Math.random() - 0.5);
    }

    if (room.deck.length === 0) {
      socket.emit('error', 'ไม่มีไพ่เหลือในกองแล้ว!');
      return;
    }

    const drawnCard = room.deck.pop();
    io.to(roomId).emit('animate_action', { action: 'draw', playerId: socket.username, playerName: player.name });

    if (drawnCard.type === 'THREAT') {
      // Threat drawn! Check for Defuse in hand (and not disabled)
      const defuseIdx = player.isDisabled ? -1 : player.hand.findIndex(c => c.type === 'DEFUSE');
      if (defuseIdx !== -1) {
        io.to(roomId).emit('animate_action', { action: 'bomb_defused', playerId: socket.username, playerName: player.name, card: drawnCard });
        // Auto-defuse or player uses defuse
        const defuseCard = player.hand.splice(defuseIdx, 1)[0];
        room.discardPile.push(defuseCard);
        room.deck.push(drawnCard);
        room.deck.sort(() => Math.random() - 0.5);

        addRoomLog(room, `🛡️ ${player.name} จั่วเจอ [${drawnCard.name}]! แต่ใช้ DEFUSE ป้องกันสำเร็จ และสับการ์ดกลับเข้ากอง!`);
        socket.emit('defuse_success', { threatName: drawnCard.name });
      } else {
        io.to(roomId).emit('animate_action', { action: 'bomb_explode', playerId: socket.username, playerName: player.name, card: drawnCard });
        // Eliminated!
        player.isAlive = false;
        if (player.isDisabled) {
           addRoomLog(room, `🚫 เซสชันของ ${player.name} ถูกแฮ็กอยู่! ไม่สามารถใช้ Backup กู้ภัยได้!`);
        }
        // การ์ดระเบิดถูกใช้งานและออกจากการเล่นไป (ไม่เอาลงสุสานเพื่อไม่ให้ผู้เล่นงง)
        addRoomLog(room, `💥 ${player.name} โดน [${drawnCard.name}] โจมตี! ถูกกำจัดออกจากเกม! 💀`);
        socket.emit('player_eliminated', { threatName: drawnCard.name });
      }
    } else {
      player.hand.push(drawnCard);
      addRoomLog(room, `🎴 ${player.name} จั่วการ์ด [${drawnCard.name}] ขึ้นมือ`);
    }

    // Clear disable status at the end of their draw (their turn)
    player.isDisabled = false;

    delayedAdvanceTurn(roomId, 1500);
  });

  // 2. PLAY CARD (Player clicks a card from hand to play)
  socket.on('play_card', ({ cardUniqueId, targetPlayerId }) => {
    console.log(`[play_card] RECEIVED FROM ${socket.username}: card=${cardUniqueId}, target=${targetPlayerId}`);

    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;
    const room = rooms[roomId];

    if (!room.isGameStarted || room.winner) return;
    if (room.isAdvancingTurn) {
      socket.emit('error', 'กรุณารอสักครู่...');
      return;
    }

    if (afkTimers[roomId]) {
      startAfkTimer(roomId, room.players[socket.username]);
    }

    const playerIds = Object.keys(room.players);
    const currentTurnPid = playerIds[room.turnIndex % playerIds.length];

    if (currentTurnPid !== socket.username) {
      console.log(`[play_card] err: turnPid=${currentTurnPid}, me=${socket.username}, turnIdx=${room.turnIndex}, pIds=${playerIds}`);
      socket.emit('error', 'ยังไม่ใช่เทิร์นของคุณ!');
      return;
    }

    const player = room.players[socket.username];
    if (!player || !player.isAlive) return;
    if (player.isAfkBot) {
      player.isBot = false;
      player.isAfkBot = false;
      addRoomLog(room, `🎮 ${player.name} กลับมาเล่นเองแล้ว!`);
    }

    const cardIdx = player.hand.findIndex(c => c.uniqueId === cardUniqueId);
    if (cardIdx === -1) {
      socket.emit('error', 'ไม่พบการ์ดนี้ในมือของคุณ');
      return;
    }

    const card = player.hand.splice(cardIdx, 1)[0];
    handleCardPlayWithInterrupt(roomId, player, card, targetPlayerId);
  });

  // 3. RESTART MATCH
  socket.on('restart_match', () => {
    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;
    const room = rooms[roomId];

    if (room.isSinglePlayer) {
      const botCount = Object.keys(room.players).filter(id => room.players[id].isBot).length;
      socket.emit('start_bot_game', { botCount });
    } else {
      io.to(roomId).emit('start_game');
    }
  });

  // ================= ADMIN BACKOFFICE API (CTFd SQLITE - ROLE PROTECTED) =================
  const requireAdmin = (socket) => {
    if (socket.userRole !== 'admin') {
      socket.emit('error', 'Unauthorized: Role admin required');
      return false;
    }
    return true;
  };

  socket.on('admin_get_data', () => {
    if (!requireAdmin(socket)) return;
    socket.emit('admin_data_response', {
      cardPool: getAllCards(),
      gachaBanners: getAllGachaBanners(),
      users: getAllUsers()
    });
  });

  // 1. Admin Save Card (Add or Edit in SQLite)
  socket.on('admin_save_card', (cardData) => {
    if (!requireAdmin(socket)) return;
    saveCard(cardData);
    const updated = getAllCards();
    io.emit('card_pool_updated', updated);
    socket.emit('admin_action_success', 'Card saved to SQLite database');
  });

  // 2. Admin Delete Card from SQLite
  socket.on('admin_delete_card', ({ cardId }) => {
    if (!requireAdmin(socket)) return;
    deleteCard(cardId);
    const updated = getAllCards();
    io.emit('card_pool_updated', updated);
    socket.emit('admin_action_success', 'Card deleted from SQLite database');
  });

  // 3. Admin Save Gacha Banner to SQLite
  socket.on('admin_save_banner', (bannerData) => {
    if (!requireAdmin(socket)) return;
    saveGachaBanner(bannerData);
    const updated = getAllGachaBanners();
    io.emit('gacha_banners_updated', updated);
    socket.emit('admin_action_success', 'Gacha Banner saved to SQLite database');
  });

  // 4. Admin Delete Gacha Banner from SQLite
  socket.on('admin_delete_banner', ({ bannerId }) => {
    if (!requireAdmin(socket)) return;
    deleteGachaBanner(bannerId);
    const updated = getAllGachaBanners();
    io.emit('gacha_banners_updated', updated);
    socket.emit('admin_action_success', 'Gacha Banner deleted from SQLite database');
  });

  // 5. Admin Add Item to Banner in SQLite
  socket.on('admin_add_item_to_banner', ({ bannerId, item }) => {
    if (!requireAdmin(socket)) return;
    addItemToBanner(bannerId, item);
    const updated = getAllGachaBanners();
    io.emit('gacha_banners_updated', updated);
    socket.emit('admin_action_success', 'Item added to Banner in SQLite');
  });

  // 6. Admin Delete Item from Banner in SQLite
  socket.on('admin_delete_item_from_banner', ({ bannerId, itemId }) => {
    if (!requireAdmin(socket)) return;
    deleteItemFromBanner(bannerId, itemId);
    const updated = getAllGachaBanners();
    io.emit('gacha_banners_updated', updated);
    socket.emit('admin_action_success', 'Item removed from Banner in SQLite');
  });

  // 7. Admin Give Coins in SQLite
  socket.on('admin_give_coins', ({ username, amount }) => {
    if (!requireAdmin(socket)) return;
    const newCoins = giveUserCoins(username, amount);
    
    // Broadcast live coin update to connected sockets of target user
    const sockets = Array.from(io.sockets.sockets.values());
    sockets.forEach(s => {
      if (s.username && s.username.toLowerCase() === username.toLowerCase()) {
        s.emit('coins_updated', { coins: newCoins });
      }
    });

    socket.emit('admin_action_success', `Added ${amount} Coins to ${username} in SQLite (New Balance: ${newCoins})`);
    socket.emit('admin_data_response', {
      cardPool: getAllCards(),
      gachaBanners: getAllGachaBanners(),
      users: getAllUsers()
    });
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    delete connectedUsers[socket.id];
    broadcastOnlineUsers();

    const roomId = socket.roomId;
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      if (room.isGameStarted) {
        if (room.players[socket.username]) {
           room.players[socket.username].isDisconnected = true;
        }
      } else {
        delete room.players[socket.username];
        if (Object.keys(room.players).filter(id => !room.players[id].isBot).length === 0) {
          delete rooms[roomId];
        }
      }
      
      if (rooms[roomId]) {
        io.to(roomId).emit('game_update', rooms[roomId]);
      }
      broadcastRooms();
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

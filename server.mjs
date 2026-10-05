import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Helper to get primary local IPv4 address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    if (!iface) continue;
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIpAddress();

// Helper to normalize questions from various JSON formats
function normalizeQuestions(rawData) {
  let list = [];
  if (Array.isArray(rawData)) {
    list = rawData;
  } else if (rawData && typeof rawData === 'object' && Array.isArray(rawData.questions)) {
    list = rawData.questions;
  }

  return list.map((q, idx) => {
    let optionsArray = [];
    let correctIdx = 0;

    if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
      const keys = ['A', 'B', 'C', 'D'];
      optionsArray = keys.map((k) => q.options[k] || '');
    } else if (Array.isArray(q.options)) {
      optionsArray = q.options;
    }

    if (typeof q.answer === 'string') {
      const char = q.answer.trim().toUpperCase();
      const map = { A: 0, B: 1, C: 2, D: 3 };
      correctIdx = map[char] !== undefined ? map[char] : 0;
    } else if (typeof q.correctIndex === 'number') {
      correctIdx = q.correctIndex;
    }

    const letters = ['A', 'B', 'C', 'D'];
    return {
      id: q.id || idx + 1,
      category: q.category || 'Chủ nghĩa xã hội khoa học',
      question: q.question,
      options: optionsArray,
      correctIndex: correctIdx,
      explanation: q.explanation || `Đáp án đúng là ${letters[correctIdx]}: ${optionsArray[correctIdx] || ''}`,
    };
  });
}

// Load default questions
let defaultQuestions = [];
try {
  const qPath = path.join(__dirname, 'src', 'data', 'questions.json');
  if (fs.existsSync(qPath)) {
    const raw = JSON.parse(fs.readFileSync(qPath, 'utf-8'));
    defaultQuestions = normalizeQuestions(raw);
  }
} catch (err) {
  console.error('Error reading default questions:', err);
}

// In-memory room management
const rooms = new Map();

function generatePin() {
  let pin = '';
  do {
    pin = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms.has(pin));
  return pin;
}

// Chest reward generator
function generateChestRewards(playersMap, currentPlayerId) {
  const otherPlayers = Array.from(playersMap.values()).filter(
    (p) => p.id !== currentPlayerId && p.score > 0
  );

  const pool = [
    { type: 'POINTS', value: 50, label: '+50 Điểm', icon: '💰' },
    { type: 'POINTS', value: 100, label: '+100 Điểm', icon: '💰' },
    { type: 'POINTS', value: 200, label: '+200 Điểm', icon: '💎' },
    { type: 'POINTS', value: 350, label: '+350 Điểm Thần Tốc!', icon: '✨' },
    { type: 'MULTIPLY', value: 2, label: 'Nhân đôi x2 Điểm Số!', icon: '⚡' },
    { type: 'SHIELD', value: 30, label: 'Khiên Bảo Vệ 30 Giây', icon: '🛡️' },
    { type: 'EMPTY', value: 0, label: 'Gió Thoảng (0 Điểm)', icon: '💨' },
  ];

  if (otherPlayers.length > 0) {
    pool.push({ type: 'STEAL', value: 0.25, label: 'Cướp 25% Điểm Đối Thủ!', icon: '🦹' });
    pool.push({ type: 'STEAL', value: 0.15, label: 'Cướp 15% Điểm Đối Thủ!', icon: '🦹' });
    if (otherPlayers.length >= 2) {
      pool.push({ type: 'SWAP', value: 1, label: 'Hoán Đổi Điểm Số Bất Ngờ!', icon: '🔄' });
    }
  }

  // Shuffle and pick 3 unique or varied rewards
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    
    // Provide network IP info API endpoint
    if (parsedUrl.pathname === '/api/network-info') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        localIp,
        port,
        hostUrl: `http://${localIp}:${port}`,
      }));
      return;
    }

    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    // ----------------- HOST EVENTS -----------------
    socket.on('host:create_room', ({ duration = 300, questions = null } = {}, callback) => {
      const pin = generatePin();
      const roomQuestions = questions
        ? normalizeQuestions(questions)
        : defaultQuestions;

      const room = {
        pin,
        hostSocketId: socket.id,
        status: 'LOBBY', // 'LOBBY' | 'PLAYING' | 'ENDED'
        duration: Math.max(30, duration), // in seconds
        remainingTime: Math.max(30, duration),
        timerInterval: null,
        questions: roomQuestions,
        players: new Map(),
        events: [],
      };

      rooms.set(pin, room);
      socket.join(`host:${pin}`);
      socket.join(pin);

      if (typeof callback === 'function') {
        callback({
          success: true,
          pin,
          localIp,
          port,
          duration: room.duration,
          questionCount: room.questions.length,
        });
      }
    });

    socket.on('host:start_game', ({ pin }, callback) => {
      const room = rooms.get(pin);
      if (!room || room.hostSocketId !== socket.id) {
        if (typeof callback === 'function') callback({ success: false, error: 'Phòng không tồn tại hoặc bạn không phải Host' });
        return;
      }

      if (room.status === 'PLAYING') {
        if (typeof callback === 'function') callback({ success: true });
        return;
      }

      room.status = 'PLAYING';
      room.remainingTime = room.duration;

      io.to(pin).emit('game:started', {
        duration: room.duration,
        remainingTime: room.remainingTime,
      });

      // Start Countdown Timer
      clearInterval(room.timerInterval);
      room.timerInterval = setInterval(() => {
        room.remainingTime -= 1;

        io.to(pin).emit('game:time_sync', {
          remainingTime: room.remainingTime,
        });

        if (room.remainingTime <= 0) {
          clearInterval(room.timerInterval);
          room.timerInterval = null;
          room.status = 'ENDED';

          const finalLeaderboard = getLeaderboard(room);
          io.to(pin).emit('game:ended', {
            leaderboard: finalLeaderboard,
            top3: finalLeaderboard.slice(0, 3),
          });
        }
      }, 1000);

      if (typeof callback === 'function') callback({ success: true });
    });

    socket.on('host:end_game', ({ pin }, callback) => {
      const room = rooms.get(pin);
      if (!room || room.hostSocketId !== socket.id) {
        if (typeof callback === 'function') callback({ success: false, error: 'Không có quyền' });
        return;
      }

      if (room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
      }
      room.status = 'ENDED';

      const finalLeaderboard = getLeaderboard(room);
      io.to(pin).emit('game:ended', {
        leaderboard: finalLeaderboard,
        top3: finalLeaderboard.slice(0, 3),
      });

      if (typeof callback === 'function') callback({ success: true });
    });

    socket.on('host:kick_player', ({ pin, playerId }) => {
      const room = rooms.get(pin);
      if (!room || room.hostSocketId !== socket.id) return;

      const player = room.players.get(playerId);
      if (player) {
        io.to(player.socketId).emit('player:kicked', { reason: 'Bạn đã bị mời ra khỏi phòng' });
        room.players.delete(playerId);
        broadcastLeaderboard(room);
      }
    });

    socket.on('host:restart_game', ({ pin }, callback) => {
      const room = rooms.get(pin);
      if (!room || room.hostSocketId !== socket.id) {
        if (typeof callback === 'function') callback({ success: false, error: 'Không có quyền' });
        return;
      }

      if (room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
      }

      room.status = 'LOBBY';
      room.remainingTime = room.duration;
      room.events = [];

      // Reset all players scores
      for (const [id, p] of room.players.entries()) {
        p.score = 0;
        p.correctCount = 0;
        p.wrongCount = 0;
        p.streak = 0;
        p.shieldUntil = 0;
        p.currentQuestionIndex = 0;
      }

      io.to(pin).emit('game:restarted', {
        pin: room.pin,
        status: 'LOBBY',
        duration: room.duration,
      });

      broadcastLeaderboard(room);
      if (typeof callback === 'function') callback({ success: true });
    });

    // ----------------- PLAYER EVENTS -----------------
    socket.on('player:join', ({ pin, name, avatar, playerId }, callback) => {
      const room = rooms.get(pin);
      if (!room) {
        if (typeof callback === 'function') callback({ success: false, error: 'Mã phòng không tồn tại!' });
        return;
      }

      // Check duplicate name in room, append index if needed
      let finalName = (name || 'Đồng chí').trim();
      let nameCount = 1;
      let existingWithSameName = Array.from(room.players.values()).find(
        (p) => p.id !== playerId && p.name.toLowerCase() === finalName.toLowerCase()
      );

      while (existingWithSameName) {
        nameCount++;
        finalName = `${name.trim()} (${nameCount})`;
        existingWithSameName = Array.from(room.players.values()).find(
          (p) => p.id !== playerId && p.name.toLowerCase() === finalName.toLowerCase()
        );
      }

      let player = room.players.get(playerId);
      if (player) {
        // Reconnection
        player.socketId = socket.id;
        player.connected = true;
        player.name = finalName;
        player.avatar = avatar || player.avatar;
      } else {
        // New player
        player = {
          id: playerId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: finalName,
          avatar: avatar || 'marx',
          score: 0,
          correctCount: 0,
          wrongCount: 0,
          streak: 0,
          shieldUntil: 0,
          currentQuestionIndex: 0,
          socketId: socket.id,
          connected: true,
        };
        room.players.set(player.id, player);
      }

      socket.join(pin);
      socket.join(`player:${player.id}`);

      // Notify host and other players
      broadcastLeaderboard(room);

      if (typeof callback === 'function') {
        callback({
          success: true,
          player: sanitizePlayer(player),
          roomStatus: room.status,
          remainingTime: room.remainingTime,
          duration: room.duration,
          questionCount: room.questions.length,
        });
      }
    });

    socket.on('player:get_question', ({ pin, playerId, questionIndex }, callback) => {
      const room = rooms.get(pin);
      if (!room) {
        if (typeof callback === 'function') callback({ success: false, error: 'Phòng không tồn tại' });
        return;
      }

      const qIdx = questionIndex % room.questions.length;
      const q = room.questions[qIdx];
      if (!q) {
        if (typeof callback === 'function') callback({ success: false, error: 'Không tìm thấy câu hỏi' });
        return;
      }

      // Do NOT send correctIndex to the client before answer!
      if (typeof callback === 'function') {
        callback({
          success: true,
          question: {
            id: q.id,
            category: q.category,
            question: q.question,
            options: q.options,
          },
          index: qIdx,
          total: room.questions.length,
        });
      }
    });

    socket.on('player:submit_answer', ({ pin, playerId, questionIndex, selectedIndex }, callback) => {
      const room = rooms.get(pin);
      if (!room || room.status !== 'PLAYING') {
        if (typeof callback === 'function') callback({ success: false, error: 'Trận đấu chưa bắt đầu hoặc đã kết thúc' });
        return;
      }

      const player = room.players.get(playerId);
      if (!player) {
        if (typeof callback === 'function') callback({ success: false, error: 'Không tìm thấy người chơi' });
        return;
      }

      const qIdx = questionIndex % room.questions.length;
      const q = room.questions[qIdx];
      const isCorrect = q && q.correctIndex === selectedIndex;

      if (isCorrect) {
        player.correctCount++;
        player.streak++;
        // Prepare 3 chest options
        const chestOptions = generateChestRewards(room.players, player.id);

        // Get candidate targets if a steal/swap chest is chosen
        const stealCandidates = Array.from(room.players.values())
          .filter((p) => p.id !== player.id && p.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map((p) => ({ id: p.id, name: p.name, score: p.score, avatar: p.avatar }));

        if (typeof callback === 'function') {
          callback({
            success: true,
            isCorrect: true,
            explanation: q.explanation || 'Chính xác! Bạn nắm rất vững kiến thức Mác - Lênin.',
            chestOptions,
            stealCandidates,
          });
        }
      } else {
        player.wrongCount++;
        player.streak = 0;

        if (typeof callback === 'function') {
          callback({
            success: true,
            isCorrect: false,
            correctAnswerIndex: q.correctIndex,
            correctAnswerText: q.options[q.correctIndex],
            explanation: q.explanation || 'Chưa chính xác. Hãy cùng ôn lại bài học nhé!',
          });
        }
      }

      broadcastLeaderboard(room);
    });

    socket.on('player:open_chest', ({ pin, playerId, chosenReward, targetPlayerId }, callback) => {
      const room = rooms.get(pin);
      if (!room || room.status !== 'PLAYING') {
        if (typeof callback === 'function') callback({ success: false, error: 'Trận đấu không diễn ra' });
        return;
      }

      const player = room.players.get(playerId);
      if (!player) return;

      let eventMsg = null;
      let pointsEarned = 0;

      switch (chosenReward.type) {
        case 'POINTS':
          pointsEarned = chosenReward.value;
          player.score += pointsEarned;
          eventMsg = `⭐ ${player.name} mở rương nhận được ${pointsEarned} điểm!`;
          break;

        case 'MULTIPLY':
          const oldScore = player.score;
          if (oldScore > 0) {
            player.score = player.score * 2;
            pointsEarned = player.score - oldScore;
            eventMsg = `⚡ ${player.name} kích hoạt X2 Điểm Số (+${pointsEarned} điểm)!`;
          } else {
            player.score += 100;
            pointsEarned = 100;
            eventMsg = `⚡ ${player.name} nhận ngay +100 điểm khởi động!`;
          }
          break;

        case 'SHIELD':
          player.shieldUntil = Date.now() + 30000;
          eventMsg = `🛡️ ${player.name} trang bị Khiên Bảo Vệ trong 30 giây!`;
          break;

        case 'STEAL':
          const victim = room.players.get(targetPlayerId);
          if (victim && victim.id !== player.id) {
            if (victim.shieldUntil > Date.now()) {
              eventMsg = `🛡️ Cú cướp điểm của ${player.name} bị khiên của ${victim.name} chặn đứng!`;
            } else {
              const stealAmount = Math.max(20, Math.round(victim.score * chosenReward.value));
              const actualStolen = Math.min(victim.score, stealAmount);
              victim.score -= actualStolen;
              player.score += actualStolen;
              pointsEarned = actualStolen;
              eventMsg = `🦹 ${player.name} đã cướp ${actualStolen} điểm từ ${victim.name}!`;

              // Notify victim directly
              io.to(victim.socketId).emit('player:stolen_from', {
                by: player.name,
                amount: actualStolen,
              });
            }
          } else {
            // No victim or invalid, award bonus
            player.score += 150;
            eventMsg = `💰 ${player.name} nhận 150 điểm thưởng!`;
          }
          break;

        case 'SWAP':
          const swapVictim = room.players.get(targetPlayerId);
          if (swapVictim && swapVictim.id !== player.id) {
            if (swapVictim.shieldUntil > Date.now()) {
              eventMsg = `🛡️ ${swapVictim.name} bật khiên chống hoán đổi điểm từ ${player.name}!`;
            } else {
              const temp = player.score;
              player.score = swapVictim.score;
              swapVictim.score = temp;
              eventMsg = `🔄 ĐẢO NGƯỢC TÌNH THẾ: ${player.name} hoán đổi điểm số với ${swapVictim.name}!`;

              io.to(swapVictim.socketId).emit('player:swapped', {
                withName: player.name,
                newScore: swapVictim.score,
              });
            }
          }
          break;

        case 'EMPTY':
        default:
          eventMsg = `💨 ${player.name} mở trúng rương gió thoảng (0 điểm)!`;
          break;
      }

      if (eventMsg) {
        room.events.unshift({
          id: Date.now(),
          text: eventMsg,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });
        if (room.events.length > 20) room.events.pop();

        io.to(pin).emit('game:event_ticker', {
          event: room.events[0],
        });
      }

      broadcastLeaderboard(room);

      if (typeof callback === 'function') {
        callback({
          success: true,
          newScore: player.score,
          pointsEarned,
        });
      }
    });

    socket.on('disconnect', () => {
      // Find rooms where this socket was a player or host
      for (const [pin, room] of rooms.entries()) {
        if (room.hostSocketId === socket.id) {
          // Host disconnected
          io.to(pin).emit('host:status_change', { connected: false });
        } else {
          // Player disconnected
          for (const [playerId, player] of room.players.entries()) {
            if (player.socketId === socket.id) {
              player.connected = false;
              broadcastLeaderboard(room);
              break;
            }
          }
        }
      }
    });
  });

  function getLeaderboard(room) {
    const list = Array.from(room.players.values())
      .map(sanitizePlayer)
      .sort((a, b) => b.score - a.score);

    return list.map((p, idx) => ({ ...p, rank: idx + 1 }));
  }

  function broadcastLeaderboard(room) {
    const leaderboard = getLeaderboard(room);
    io.to(room.pin).emit('room:leaderboard_update', {
      leaderboard,
      playerCount: room.players.size,
    });
  }

  function sanitizePlayer(p) {
    return {
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      correctCount: p.correctCount,
      wrongCount: p.wrongCount,
      streak: p.streak,
      shieldActive: p.shieldUntil > Date.now(),
      connected: p.connected,
    };
  }

  httpServer.listen(port, hostname, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 [MarxArena] Server đang chạy thành công!`);
    console.log(`📡 Truy cập Host (Máy tính/Máy chiếu): http://localhost:${port}`);
    console.log(`📱 Người chơi trong mạng Wi-Fi:       http://${localIp}:${port}`);
    console.log(`==================================================\n`);
  });
});

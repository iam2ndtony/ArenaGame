'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import {
  Sparkles,
  Trophy,
  Shield,
  Volume2,
  VolumeX,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  User,
  AlertCircle
} from 'lucide-react';
import { sounds } from '@/utils/audio';

interface Question {
  id: number;
  category: string;
  question: string;
  options: string[];
}

interface ChestReward {
  type: 'POINTS' | 'MULTIPLY' | 'STEAL' | 'SWAP' | 'SHIELD' | 'EMPTY';
  value: number;
  label: string;
  icon: string;
}

interface StealTarget {
  id: string;
  name: string;
  score: number;
}

export default function PlayRoomPage() {
  const params = useParams();
  const router = useRouter();
  const pin = params?.pin as string;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [joined, setJoined] = useState(false);
  const [name, setName] = useState('');
  const [playerId, setPlayerId] = useState('');

  const [gameState, setGameState] = useState<'LOBBY' | 'PLAYING' | 'ENDED'>('LOBBY');
  const [score, setScore] = useState(0);
  const [rank, setRank] = useState(1);
  const [streak, setStreak] = useState(0);
  const [shieldActive, setShieldActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Question & Answering state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(30);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  // Result & Chest state
  const [answerResult, setAnswerResult] = useState<{
    isCorrect: boolean;
    explanation?: string;
    correctAnswerText?: string;
  } | null>(null);

  const [chestPhase, setChestPhase] = useState(false);
  const [chestOptions, setChestOptions] = useState<ChestReward[]>([]);
  const [openedChestIndex, setOpenedChestIndex] = useState<number | null>(null);
  const [revealedReward, setRevealedReward] = useState<ChestReward | null>(null);
  const [stealCandidates, setStealCandidates] = useState<StealTarget[]>([]);
  const [showStealPicker, setShowStealPicker] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<StealTarget | null>(null);

  // Penalty countdown
  const [penaltySeconds, setPenaltySeconds] = useState(0);

  // Direct notifications (e.g. someone stole from me)
  const [notification, setNotification] = useState<string | null>(null);

  // Load saved credentials from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('marx_player_id') || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const savedName = localStorage.getItem('marx_player_name') || '';

      setPlayerId(savedId);
      setName(savedName);
      localStorage.setItem('marx_player_id', savedId);
    }
  }, []);

  // Socket setup
  useEffect(() => {
    if (!pin) return;

    const s = io({
      transports: ['websocket', 'polling'],
    });
    setSocket(s);

    s.on('connect', () => {
      console.log('Socket connected:', s.id);
    });

    s.on('game:started', () => {
      setGameState('PLAYING');
      sounds.playCorrect();
    });

    s.on('game:ended', () => {
      setGameState('ENDED');
      sounds.playVictory();
    });

    s.on('game:restarted', () => {
      setGameState('LOBBY');
      setScore(0);
      setStreak(0);
      setAnswerResult(null);
      setChestPhase(false);
      setOpenedChestIndex(null);
    });

    s.on('room:leaderboard_update', ({ leaderboard }: { leaderboard: Array<{ id: string; score: number; rank: number; shieldActive: boolean }> }) => {
      const me = leaderboard.find((p) => p.id === playerId);
      if (me) {
        setScore(me.score);
        setRank(me.rank);
        setShieldActive(me.shieldActive);
      }
    });

    s.on('player:stolen_from', ({ by, amount }: { by: string; amount: number }) => {
      setNotification(`⚠️ ${by} vừa cướp ${amount} điểm của bạn!`);
      sounds.playSteal();
      setTimeout(() => setNotification(null), 4000);
    });

    s.on('player:swapped', ({ withName, newScore }: { withName: string; newScore: number }) => {
      setNotification(`🔄 ${withName} vừa hoán đổi điểm số với bạn! Điểm mới: ${newScore}`);
      setScore(newScore);
      setTimeout(() => setNotification(null), 4000);
    });

    s.on('player:kicked', ({ reason }: { reason: string }) => {
      alert(reason || 'Bạn đã bị mời ra khỏi phòng');
      router.push('/');
    });

    return () => {
      s.disconnect();
    };
  }, [pin, playerId, router]);

  // Fetch question whenever index changes and game is playing
  useEffect(() => {
    if (!socket || !joined || gameState !== 'PLAYING') return;

    socket.emit('player:get_question', { pin, playerId, questionIndex }, (res: { success: boolean; question?: Question; total?: number }) => {
      if (res.success && res.question) {
        setCurrentQuestion(res.question);
        if (res.total) setTotalQuestions(res.total);
        setSelectedOption(null);
        setIsAnswering(false);
        setAnswerResult(null);
        setChestPhase(false);
        setOpenedChestIndex(null);
        setRevealedReward(null);
        setShowStealPicker(false);
      }
    });
  }, [socket, joined, gameState, questionIndex, pin, playerId]);

  // Handle Join Room
  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập Nickname của bạn!');
      return;
    }
    if (!socket) return;

    localStorage.setItem('marx_player_name', name.trim());

    socket.emit(
      'player:join',
      { pin, name: name.trim(), playerId },
      (res: { success: boolean; error?: string; roomStatus?: 'LOBBY' | 'PLAYING' | 'ENDED' }) => {
        if (res.success) {
          setJoined(true);
          if (res.roomStatus) {
            setGameState(res.roomStatus);
          }
        } else {
          alert(res.error || 'Không thể tham gia phòng');
        }
      }
    );
  };

  // Submit Answer
  const handleSelectOption = (idx: number) => {
    if (isAnswering || selectedOption !== null || !socket) return;

    setSelectedOption(idx);
    setIsAnswering(true);

    socket.emit(
      'player:submit_answer',
      { pin, playerId, questionIndex, selectedIndex: idx },
      (res: {
        success: boolean;
        isCorrect: boolean;
        explanation: string;
        correctAnswerText?: string;
        chestOptions?: ChestReward[];
        stealCandidates?: StealTarget[];
      }) => {
        if (!res.success) return;

        if (res.isCorrect) {
          sounds.playCorrect();
          setAnswerResult({ isCorrect: true, explanation: res.explanation });
          setChestOptions(res.chestOptions || []);
          setStealCandidates(res.stealCandidates || []);
          setStreak((prev) => prev + 1);
          setChestPhase(true);
        } else {
          sounds.playWrong();
          setAnswerResult({
            isCorrect: false,
            explanation: res.explanation,
            correctAnswerText: res.correctAnswerText,
          });
          setStreak(0);

          // 3 second penalty
          setPenaltySeconds(3);
          const interval = setInterval(() => {
            setPenaltySeconds((prev) => {
              if (prev <= 1) {
                clearInterval(interval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }
    );
  };

  // Open Chest
  const handleOpenChest = (chestIdx: number) => {
    if (openedChestIndex !== null || !socket) return;

    setOpenedChestIndex(chestIdx);
    const reward = chestOptions[chestIdx];
    setRevealedReward(reward);

    if (reward.type === 'STEAL' || reward.type === 'SWAP') {
      if (stealCandidates.length > 0) {
        setShowStealPicker(true);
        return;
      }
    }

    // Apply directly if points, shield, multiply, empty, or no steal targets
    applyChestReward(reward, null);
  };

  const applyChestReward = (reward: ChestReward, targetId: string | null) => {
    if (!socket) return;

    sounds.playChestOpen();

    socket.emit(
      'player:open_chest',
      {
        pin,
        playerId,
        chosenReward: reward,
        targetPlayerId: targetId,
      },
      (res: { success: boolean; newScore: number }) => {
        if (res.success) {
          setScore(res.newScore);
        }
      }
    );
  };

  const handleConfirmSteal = () => {
    if (!selectedTarget || !revealedReward) return;
    setShowStealPicker(false);
    applyChestReward(revealedReward, selectedTarget.id);
  };

  const handleNextQuestion = () => {
    setQuestionIndex((prev) => prev + 1);
  };

  const toggleSound = () => {
    sounds.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  // ----------------- SCREEN 1: REGISTER NICKNAME -----------------
  if (!joined) {
    return (
      <div style={{ maxWidth: '440px', margin: '0 auto', padding: '28px 16px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--accent-red)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            color: '#fff',
            fontWeight: '800',
            marginBottom: '10px',
          }}>
            M
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800' }}>
            Vào phòng <span style={{ color: 'var(--accent-gold)' }}>#{pin}</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Nhập biệt danh của bạn để tham gia đấu trường
          </p>
        </div>

        <form onSubmit={handleJoin} className="glass-panel" style={{ padding: '24px 20px' }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              BIỆT DANH CỦA BẠN:
            </label>
            <input
              type="text"
              placeholder="Nhập tên hiển thị (VD: Tuấn Anh, Lan Anh...)"
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '14px 16px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '1.05rem',
                fontWeight: '600',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: '1rem', fontWeight: '700' }}
          >
            VÀO ĐẤU TRƯỜNG NGAY
          </button>
        </form>
      </div>
    );
  }

  // ----------------- SCREEN 2: WAITING LOBBY (WAITING FOR HOST TO START) -----------------
  if (gameState === 'LOBBY') {
    const initial = name ? name.trim().charAt(0).toUpperCase() : 'Đ';

    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '30px 20px', textAlign: 'center' }}>
        <div className="glass-panel-elevated" style={{ padding: '36px 24px' }}>
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '24px',
            backgroundColor: '#1e293b',
            border: '2px solid var(--accent-red)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.4rem',
            color: 'var(--accent-gold)',
            fontWeight: '900',
            marginBottom: '16px',
          }}>
            {initial}
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '6px' }}>
            {name}
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '28px' }}>
            Phòng chơi: <b style={{ color: 'white' }}>#{pin}</b>
          </p>

          <div style={{
            padding: '16px 20px',
            background: 'rgba(230, 34, 56, 0.12)',
            border: '1px solid rgba(230, 34, 56, 0.3)',
            borderRadius: '16px',
            marginBottom: '24px',
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ff8595', marginBottom: '6px' }}>
              Đang Chờ Chủ Phòng Khởi Động...
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Hãy theo dõi màn hình lớn của lớp để sẵn sàng bứt phá khi trận đấu bắt đầu!
            </div>
          </div>

          <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent-gold)', marginBottom: '8px' }}>
              💡 Mẹo Thi Đấu Mác - Lênin:
            </div>
            <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Trả lời đúng cho bạn cơ hội chọn 1 trong 3 rương báu bí mật.</li>
              <li>Rương x2 và Cướp điểm giúp bạn lật ngược tình thế bất cứ lúc nào!</li>
              <li>Nếu trả lời sai, hãy đọc kỹ phần giải thích để ghi nhớ kiến thức cho các kỳ thi.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ----------------- SCREEN 3: IN-GAME (ANSWERING & CHESTS) -----------------
  if (gameState === 'PLAYING') {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px 14px 40px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* In-Game Floating Notification (Stolen alert) */}
        {notification && (
          <div className="animate-slide-up" style={{
            position: 'fixed',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#b91c1c',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '14px',
            fontWeight: '700',
            fontSize: '0.9rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            zIndex: 9999,
            width: '90%',
            maxWidth: '440px',
            textAlign: 'center',
          }}>
            {notification}
          </div>
        )}

        {/* Top Header / Status HUD */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'rgba(20, 24, 38, 0.85)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: '1px solid var(--border-glass)',
          marginBottom: '16px',
        }}>
          {/* Rank Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              padding: '6px 12px',
              borderRadius: '10px',
              background: rank <= 3 ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.1)',
              color: rank <= 3 ? '#111' : 'white',
              fontWeight: '900',
              fontSize: '0.95rem',
            }}>
              #{rank}
            </div>
            {shieldActive && (
              <span title="Khiên bảo vệ đang kích hoạt" style={{ color: '#38bdf8' }}>
                <Shield size={18} />
              </span>
            )}
            {streak >= 3 && (
              <span style={{ fontSize: '0.75rem', color: '#ff6b6b', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <Flame size={14} /> {streak}
              </span>
            )}
          </div>

          {/* Current Score */}
          <div style={{
            fontSize: '1.4rem',
            fontWeight: '900',
            color: 'var(--accent-gold-bright)',
            fontFamily: 'var(--font-heading)',
          }}>
            {score.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>đ</span>
          </div>

          <button onClick={toggleSound} className="btn-ghost" style={{ padding: '6px 10px' }}>
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>

        {/* SUB-VIEW A: REVEAL / OPEN CHEST PHASE (WHEN ANSWERED CORRECTLY) */}
        {chestPhase ? (
          <div className="glass-panel-elevated animate-pop-in" style={{ padding: '28px 20px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '20px',
              color: '#34d399',
              fontSize: '0.85rem',
              fontWeight: '700',
              marginBottom: '16px',
            }}>
              <CheckCircle2 size={16} /> CHÍNH XÁC! HÃY CHỌN 1 RƯƠNG BÁU
            </div>

            <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>
              {openedChestIndex === null ? 'Chọn 1 Trong 3 Rương Thần Bí!' : 'Phần Thưởng Của Bạn:'}
            </h3>

            {/* 3 Chests Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', width: '100%', margin: '24px 0' }}>
              {chestOptions.map((chest, cIdx) => {
                const isThisOpened = openedChestIndex === cIdx;
                const isOtherOpened = openedChestIndex !== null && !isThisOpened;

                return (
                  <div
                    key={cIdx}
                    onClick={() => handleOpenChest(cIdx)}
                    className={`chest-card ${openedChestIndex === null ? 'animate-chest-wiggle' : ''}`}
                    style={{
                      opacity: isOtherOpened ? 0.35 : 1,
                      transform: isThisOpened ? 'scale(1.08)' : undefined,
                      borderColor: isThisOpened ? 'var(--accent-gold)' : undefined,
                      pointerEvents: openedChestIndex !== null ? 'none' : 'auto',
                    }}
                  >
                    <div style={{ fontSize: '3.2rem', marginBottom: '8px' }}>
                      {isThisOpened ? chest.icon : '🎁'}
                    </div>

                    <div style={{ fontWeight: '800', fontSize: '0.9rem', color: isThisOpened ? 'var(--accent-gold-bright)' : 'var(--text-muted)' }}>
                      {isThisOpened ? chest.label : `Rương #${cIdx + 1}`}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanation card */}
            {answerResult?.explanation && (
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                marginBottom: '20px',
                textAlign: 'left',
                width: '100%',
              }}>
                <b style={{ color: '#6ee7b7' }}>Ôn tập kiến thức:</b> {answerResult.explanation}
              </div>
            )}

            {/* Steal Picker Modal */}
            {showStealPicker && (
              <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                zIndex: 9999,
              }}>
                <div className="glass-panel-elevated" style={{ width: '100%', maxWidth: '420px', padding: '24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🦹</div>
                  <h4 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>Chọn Đối Thủ Cần Cướp Điểm!</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Chọn 1 người chơi để lấy bớt điểm số của họ:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', marginBottom: '18px' }}>
                    {stealCandidates.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTarget(t)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          background: selectedTarget?.id === t.id ? 'rgba(230, 34, 56, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          border: selectedTarget?.id === t.id ? '2px solid #e62238' : '1px solid rgba(255, 255, 255, 0.1)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            backgroundColor: '#273142',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: '800',
                            color: 'var(--accent-gold)'
                          }}>
                            {t.name.charAt(0).toUpperCase()}
                          </span>
                          <span style={{ fontWeight: '700' }}>{t.name}</span>
                        </div>
                        <span style={{ fontWeight: '800', color: 'var(--accent-gold)' }}>{t.score} đ</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleConfirmSteal}
                    disabled={!selectedTarget}
                    className="btn-primary"
                    style={{ width: '100%', padding: '14px' }}
                  >
                    XÁC NHẬN CƯỚP ĐIỂM
                  </button>
                </div>
              </div>
            )}

            {/* Next question button after chest opened */}
            {openedChestIndex !== null && !showStealPicker && (
              <button
                onClick={handleNextQuestion}
                className="btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
              >
                CÂU TIẾP THEO ➔
              </button>
            )}
          </div>
        ) : answerResult && !answerResult.isCorrect ? (
          // SUB-VIEW B: WRONG ANSWER PENALTY
          <div className="glass-panel-elevated animate-pop-in" style={{ padding: '30px 20px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
              marginBottom: '16px',
            }}>
              <XCircle size={36} />
            </div>

            <h3 style={{ fontSize: '1.5rem', color: '#f87171', marginBottom: '8px' }}>
              Chưa Chính Xác!
            </h3>

            {answerResult.correctAnswerText && (
              <div style={{
                padding: '12px 18px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '12px',
                color: '#6ee7b7',
                fontWeight: '700',
                fontSize: '0.95rem',
                marginBottom: '16px',
                width: '100%',
              }}>
                Đáp án đúng: {answerResult.correctAnswerText}
              </div>
            )}

            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              marginBottom: '24px',
              textAlign: 'left',
              width: '100%',
            }}>
              <b style={{ color: 'var(--accent-gold)' }}>Giải thích học phần:</b> {answerResult.explanation}
            </div>

            <button
              onClick={handleNextQuestion}
              disabled={penaltySeconds > 0}
              className="btn-primary"
              style={{ width: '100%', padding: '16px' }}
            >
              {penaltySeconds > 0 ? `Đợi ${penaltySeconds}s để tiếp tục...` : 'LÀM CÂU TIẾP THEO'}
            </button>
          </div>
        ) : currentQuestion ? (
          // SUB-VIEW C: ACTIVE QUESTION VIEW
          <div className="glass-panel-elevated" style={{ padding: '24px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Category & Counter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                background: 'rgba(230, 34, 56, 0.15)',
                border: '1px solid rgba(230, 34, 56, 0.3)',
                color: '#ff8595',
                fontSize: '0.78rem',
                fontWeight: '700',
              }}>
                {currentQuestion.category}
              </span>

              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Câu {questionIndex + 1}
              </span>
            </div>

            {/* Question Text */}
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '800',
              lineHeight: 1.45,
              marginBottom: '24px',
              minHeight: '60px',
            }}>
              {currentQuestion.question}
            </h2>

            {/* 4 Options Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {currentQuestion.options.map((opt, optIdx) => {
                const letters = ['A', 'B', 'C', 'D'];
                const isSelected = selectedOption === optIdx;

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    disabled={isAnswering}
                    className={`option-btn option-btn-${optIdx}`}
                    style={{
                      borderWidth: isSelected ? '3px' : '2px',
                      transform: isSelected ? 'scale(1.02)' : undefined,
                    }}
                  >
                    <span className="option-badge">{letters[optIdx]}</span>
                    <span style={{ flex: 1, fontSize: '1rem', lineHeight: 1.35 }}>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Đang tải câu hỏi...
          </div>
        )}
      </div>
    );
  }

  // ----------------- SCREEN 4: ENDED (FINAL RESULTS) -----------------
  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '30px 20px', textAlign: 'center' }}>
      <div className="glass-panel-elevated animate-pop-in" style={{ padding: '36px 24px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '10px' }}>
          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🎖️'}
        </div>

        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          background: 'rgba(255, 199, 44, 0.15)',
          border: '1px solid rgba(255, 199, 44, 0.3)',
          borderRadius: '20px',
          color: 'var(--accent-gold-bright)',
          fontSize: '0.85rem',
          fontWeight: '800',
          marginBottom: '12px',
        }}>
          HẠNG #{rank} CHUNG CUỘC
        </div>

        <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '6px' }}>
          {name}
        </h2>

        <div style={{
          fontSize: '2.5rem',
          fontWeight: '900',
          color: 'var(--accent-gold-bright)',
          fontFamily: 'var(--font-heading)',
          margin: '16px 0 24px',
        }}>
          {score.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>điểm</span>
        </div>

        <div style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '16px',
          borderRadius: '14px',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          marginBottom: '28px',
          lineHeight: 1.6,
        }}>
          Bạn đã hoàn thành xuất sắc trận đấu Mác - Lênin! Hãy cùng nhìn lên màn hình chiếu của lớp để theo dõi bục vinh danh và tổng kết toàn bộ phòng chơi nhé.
        </div>

        <button
          onClick={() => router.push('/')}
          className="btn-ghost"
          style={{ width: '100%', padding: '14px' }}
        >
          Về Trang Chủ
        </button>
      </div>
    </div>
  );
}

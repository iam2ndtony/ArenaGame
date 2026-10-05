'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  Users,
  Clock,
  Play,
  Trophy,
  Volume2,
  VolumeX,
  Sparkles,
  Shield,
  Zap,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Award
} from 'lucide-react';
import { sounds } from '@/utils/audio';

interface Player {
  id: string;
  name: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  streak: number;
  shieldActive: boolean;
  connected: boolean;
  rank?: number;
}

interface GameEvent {
  id: number;
  text: string;
  time: string;
}

export default function HostRoomPage() {
  const params = useParams();
  const router = useRouter();
  const pin = params?.pin as string;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<'LOBBY' | 'PLAYING' | 'ENDED'>('LOBBY');
  const [players, setPlayers] = useState<Player[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [joinUrl, setJoinUrl] = useState<string>('');
  const [remainingTime, setRemainingTime] = useState<number>(300);
  const [totalDuration, setTotalDuration] = useState<number>(300);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [networkIp, setNetworkIp] = useState('localhost');
  const [podium, setPodium] = useState<Player[]>([]);

  const hasCelebrated = useRef(false);

  // Initialize Socket connection
  useEffect(() => {
    if (!pin) return;

    const s = io({
      transports: ['websocket', 'polling'],
    });
    setSocket(s);

    // Fetch network IP for QR code
    fetch('/api/network-info')
      .then((res) => res.json())
      .then((data) => {
        const isPublic = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        const hostUrl = isPublic ? window.location.origin : (data.hostUrl || window.location.origin);
        setNetworkIp(data.localIp || 'localhost');
        const url = `${hostUrl}/play/${pin}`;
        setJoinUrl(url);

        QRCode.toDataURL(url, {
          width: 320,
          margin: 1,
          color: {
            dark: '#111827',
            light: '#ffffff',
          },
        }).then((dataUrl) => {
          setQrDataUrl(dataUrl);
        });
      })
      .catch(() => {
        const url = `${window.location.origin}/play/${pin}`;
        setJoinUrl(url);
        QRCode.toDataURL(url, { width: 320, margin: 1 }).then(setQrDataUrl);
      });

    s.on('connect', () => {
      console.log('Host socket connected:', s.id, 'Registering for pin:', pin);
      s.emit('host:register', { pin }, (res: { success: boolean; status?: 'LOBBY' | 'PLAYING' | 'ENDED' }) => {
        if (res && res.status) {
          setGameState(res.status);
        }
      });
    });

    s.on('room:leaderboard_update', ({ leaderboard }: { leaderboard: Player[] }) => {
      console.log('Host received leaderboard update:', leaderboard.length, 'players');
      setPlayers(leaderboard);
    });

    s.on('game:started', ({ duration, remainingTime: rt }: { duration: number; remainingTime: number }) => {
      setGameState('PLAYING');
      setTotalDuration(duration);
      setRemainingTime(rt);
      sounds.playCorrect();
    });

    s.on('game:time_sync', ({ remainingTime: rt }: { remainingTime: number }) => {
      setRemainingTime(rt);
      if (rt <= 5 && rt > 0) {
        sounds.playTick();
      }
    });

    s.on('game:event_ticker', ({ event }: { event: GameEvent }) => {
      setEvents((prev) => [event, ...prev.slice(0, 15)]);
      if (event.text.includes('cướp')) {
        sounds.playSteal();
      } else if (event.text.includes('X2') || event.text.includes('thần tốc')) {
        sounds.playChestOpen();
      }
    });

    s.on('game:ended', ({ leaderboard, top3 }: { leaderboard: Player[]; top3: Player[] }) => {
      setGameState('ENDED');
      setPlayers(leaderboard);
      setPodium(top3);

      if (!hasCelebrated.current) {
        hasCelebrated.current = true;
        sounds.playVictory();
        triggerConfetti();
      }
    });

    s.on('game:restarted', ({ duration }: { duration: number }) => {
      setGameState('LOBBY');
      setTotalDuration(duration);
      setRemainingTime(duration);
      setEvents([]);
      hasCelebrated.current = false;
    });

    return () => {
      s.disconnect();
    };
  }, [pin]);

  const triggerConfetti = () => {
    const end = Date.now() + 4 * 1000;
    const colors = ['#e62238', '#ffc72c', '#10b981', '#3b82f6'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  const handleStartGame = () => {
    if (!socket) return;
    if (players.length === 0) {
      const confirmAlone = confirm('Chưa có người chơi nào vào phòng. Bạn có muốn bắt đầu để chạy thử không?');
      if (!confirmAlone) return;
    }
    socket.emit('host:start_game', { pin });
  };

  const handleEndGameEarly = () => {
    if (!socket) return;
    if (confirm('Bạn có chắc chắn muốn kết thúc trận đấu ngay bây giờ?')) {
      socket.emit('host:end_game', { pin });
    }
  };

  const handleRestartGame = () => {
    if (!socket) return;
    if (confirm('Khởi động lại ván chơi mới với danh sách người chơi hiện tại?')) {
      socket.emit('host:restart_game', { pin });
    }
  };

  const handleKickPlayer = (playerId: string) => {
    if (!socket) return;
    socket.emit('host:kick_player', { pin, playerId });
  };

  const toggleSound = () => {
    sounds.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ----------------- RENDER: LOBBY STATE -----------------
  if (gameState === 'LOBBY') {
    return (
      <div style={{ minHeight: '100vh', padding: '30px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Top Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: '800',
              fontSize: '18px',
            }}>
              M
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                MarxArena • Sảnh chờ trình chiếu
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mã phòng tham gia: <strong style={{ color: 'var(--accent-gold)' }}>{pin}</strong></p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={toggleSound}
              className="btn-ghost"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              {soundEnabled ? <Volume2 size={16} color="var(--accent-gold)" /> : <VolumeX size={16} />}
              {soundEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}
            </button>

            <button
              onClick={handleStartGame}
              className="btn-primary"
              style={{ padding: '14px 32px', fontSize: '1.15rem' }}
            >
              <Play size={20} fill="white" /> BẮT ĐẦU TRẬN ĐẤU ({players.length})
            </button>
          </div>
        </header>

        {/* Big Projector Showcase Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: '30px', alignItems: 'start' }}>
          {/* QR Code & Join Card */}
          <div className="glass-panel" style={{ padding: '28px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-block',
              padding: '5px 12px',
              backgroundColor: '#1e293b',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: 'var(--accent-gold)',
              fontSize: '0.8rem',
              fontWeight: '600',
              marginBottom: '16px',
            }}>
              QUÉT MÃ QR BẰNG CAMERA ĐIỆN THOẠI
            </div>

            <div style={{
              background: '#ffffff',
              padding: '12px',
              borderRadius: '12px',
              display: 'inline-block',
              marginBottom: '18px',
              border: '1px solid var(--border-subtle)',
            }}>
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`Mã QR phòng ${pin}`}
                  style={{ width: '260px', height: '260px', display: 'block' }}
                />
              ) : (
                <div style={{ width: '260px', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  Đang tạo mã QR...
                </div>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>HOẶC TRUY CẬP WEBSITE NHẬP MÃ PIN:</div>
              <div style={{
                fontSize: '3rem',
                fontFamily: 'var(--font-family)',
                fontWeight: '800',
                letterSpacing: '0.12em',
                color: 'var(--accent-gold)',
                lineHeight: 1.1,
              }}>
                {pin}
              </div>
            </div>

            <div style={{
              padding: '8px 12px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              wordBreak: 'break-all',
            }}>
              {joinUrl || `http://${networkIp}:3000/play/${pin}`}
            </div>
          </div>

          {/* Connected Players Lobby Grid */}
          <div className="glass-panel" style={{ padding: '30px', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={22} color="var(--accent-gold)" />
                <h2 style={{ fontSize: '1.3rem' }}>
                  Danh Sách Tham Gia ({players.length} Đồng Chí)
                </h2>
              </div>
              {players.length === 0 && (
                <span style={{ fontSize: '0.85rem', color: '#ff8595', animation: 'pulse 1.5s infinite' }}>
                  ● Đang đợi mọi người quét mã vào phòng...
                </span>
              )}
            </div>

            {players.length === 0 ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '40px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '14px' }}>📡</div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Chưa có ai vào phòng</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px' }}>
                  Mời các bạn mở camera điện thoại hoặc máy tính quét mã QR bên trái để nhập Nickname tham gia!
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '10px',
                overflowY: 'auto',
                maxHeight: '440px',
                paddingRight: '6px',
              }}>
                {players.map((p) => {
                  return (
                    <div
                      key={p.id}
                      className="animate-pop-in"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        backgroundColor: '#1e293b',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', flexShrink: 0 }} />
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </div>
                      </div>

                      <button
                        onClick={() => handleKickPlayer(p.id)}
                        title="Mời ra khỏi phòng"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          padding: '2px 6px',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----------------- RENDER: PLAYING STATE (IN-GAME) -----------------
  if (gameState === 'PLAYING') {
    const isUrgent = remainingTime <= 30;
    const isWarning = remainingTime <= 60 && !isUrgent;

    return (
      <div style={{ minHeight: '100vh', padding: '24px 36px', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Top Header Bar */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: '800',
              fontSize: '18px',
            }}>
              M
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                MarxArena • Đang diễn ra trận đấu
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mã phòng: {pin} • {players.length} người chơi tham gia</p>
            </div>
          </div>

          {/* Big Countdown Timer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 20px',
            borderRadius: '10px',
            backgroundColor: isUrgent
              ? '#7f1d1d'
              : isWarning
              ? '#78350f'
              : '#1e293b',
            border: isUrgent
              ? '1px solid #ef4444'
              : isWarning
              ? '1px solid #f59e0b'
              : '1px solid var(--border-subtle)',
          }}>
            <Clock size={20} color={isUrgent ? '#fca5a5' : isWarning ? '#fde047' : 'var(--accent-gold)'} />
            <div style={{
              fontSize: '1.8rem',
              fontFamily: 'var(--font-family)',
              fontWeight: '800',
              letterSpacing: '0.04em',
              color: isUrgent ? '#fca5a5' : isWarning ? '#fef08a' : '#ffffff',
            }}>
              {formatTime(remainingTime)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={toggleSound} className="btn-ghost" style={{ padding: '8px 14px' }}>
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button onClick={handleEndGameEarly} className="btn-ghost" style={{ color: '#fca5a5', borderColor: '#7f1d1d' }}>
              Kết Thúc Sớm
            </button>
          </div>
        </header>

        {/* Main Grid: Live Leaderboard + Live Event Ticker */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
          {/* Left Column: Live Leaderboard */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={20} color="var(--accent-gold)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Bảng Xếp Hạng Trực Tiếp</h2>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cập nhật theo thời gian thực</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {players.slice(0, 10).map((p, idx) => {
                const isTop1 = idx === 0 && p.score > 0;
                const isTop2 = idx === 1 && p.score > 0;
                const isTop3 = idx === 2 && p.score > 0;

                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 18px',
                      borderRadius: '10px',
                      backgroundColor: isTop1
                        ? '#1e241c'
                        : isTop2
                        ? '#1e2330'
                        : isTop3
                        ? '#241e17'
                        : 'var(--bg-card)',
                      border: isTop1
                        ? '1px solid #ca8a04'
                        : isTop2
                        ? '1px solid #64748b'
                        : isTop3
                        ? '1px solid #b45309'
                        : '1px solid var(--border-subtle)',
                      borderLeft: isTop1
                        ? '4px solid #facc15'
                        : isTop2
                        ? '4px solid #cbd5e1'
                        : isTop3
                        ? '4px solid #f59e0b'
                        : '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: isTop1 ? '#ca8a04' : isTop2 ? '#64748b' : isTop3 ? '#92400e' : '#1e293b',
                        color: '#ffffff',
                        fontWeight: '800',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {idx + 1}
                      </div>

                      <div>
                        <div style={{ fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {p.name}
                          {p.shieldActive && (
                            <span title="Đang bật khiên bảo vệ" style={{ color: '#38bdf8' }}>
                              <Shield size={14} />
                            </span>
                          )}
                          {p.streak >= 3 && (
                            <span style={{ fontSize: '0.75rem', backgroundColor: '#7f1d1d', color: '#fecaca', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <Flame size={10} /> {p.streak}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          Đúng: {p.correctCount} • Sai: {p.wrongCount}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '1.35rem',
                        fontWeight: '800',
                        color: isTop1 ? 'var(--accent-gold)' : '#ffffff',
                      }}>
                        {p.score.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>đ</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


          {/* Right Column: Live Event Ticker (Tường thuật cướp điểm, mở rương) */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Zap size={20} color="var(--accent-amber)" />
              <h3 style={{ fontSize: '1.15rem' }}>Nhật Ký Đấu Trường</h3>
            </div>

            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              overflowY: 'auto',
              maxHeight: '600px',
              paddingRight: '4px',
            }}>
              {events.length === 0 ? (
                <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '40px 10px', fontSize: '0.85rem' }}>
                  Đang chờ các pha mở rương và cướp điểm đầu tiên...
                </div>
              ) : (
                events.map((ev) => (
                  <div
                    key={ev.id}
                    className="animate-slide-up"
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '12px',
                      borderLeft: '3px solid var(--accent-gold)',
                      fontSize: '0.85rem',
                      lineHeight: 1.4,
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '2px' }}>
                      {ev.time}
                    </div>
                    <div>{ev.text}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------- RENDER: ENDED STATE (PODIUM & RESULTS) -----------------
  return (
    <div style={{ minHeight: '100vh', padding: '40px 30px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          backgroundColor: '#1e293b',
          border: '1px solid var(--border-subtle)',
          borderRadius: '20px',
          color: 'var(--accent-gold)',
          fontSize: '0.85rem',
          fontWeight: '600',
          marginBottom: '12px',
        }}>
          <Trophy size={16} /> KẾT THÚC VÁN ĐẤU • TỔNG KẾT XẾP HẠNG
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '8px' }}>
          Bảng Xếp Hạng Chung Cuộc
        </h1>
      </div>

      {/* Podium Top 3 */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: '20px',
        margin: '40px 0 50px',
      }}>
        {/* Rank 2 (Silver) */}
        {podium[1] && (
          <div className="podium-column animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '2px' }}>{podium[1].name}</div>
            <div style={{ color: 'var(--accent-gold)', fontWeight: '700', fontSize: '1.15rem', marginBottom: '10px' }}>
              {podium[1].score.toLocaleString()} đ
            </div>
            <div className="podium-box-2">
              <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#f8fafc' }}>2</span>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1' }}>HUY CHƯƠNG BẠC</span>
            </div>
          </div>
        )}

        {/* Rank 1 (Gold) */}
        {podium[0] && (
          <div className="podium-column animate-slide-up" style={{ width: '150px' }}>
            <div style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--accent-gold)', marginBottom: '2px' }}>
              {podium[0].name}
            </div>
            <div style={{ color: '#ffffff', fontWeight: '800', fontSize: '1.3rem', marginBottom: '10px' }}>
              {podium[0].score.toLocaleString()} đ
            </div>
            <div className="podium-box-1">
              <span style={{ fontSize: '3rem', fontWeight: '800', color: '#111827' }}>1</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#111827' }}>QUÁN QUÂN</span>
            </div>
          </div>
        )}

        {/* Rank 3 (Bronze) */}
        {podium[2] && (
          <div className="podium-column animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '2px' }}>{podium[2].name}</div>
            <div style={{ color: 'var(--accent-gold)', fontWeight: '700', fontSize: '1.15rem', marginBottom: '10px' }}>
              {podium[2].score.toLocaleString()} đ
            </div>
            <div className="podium-box-3">
              <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#fef3c7' }}>3</span>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#fef3c7' }}>HUY CHƯƠNG ĐỒNG</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '40px' }}>
        <button onClick={handleRestartGame} className="btn-primary" style={{ padding: '14px 28px' }}>
          <RotateCcw size={18} /> Chơi Lại Ván Mới
        </button>
        <button onClick={() => router.push('/')} className="btn-ghost" style={{ padding: '14px 28px' }}>
          Về Trang Chủ
        </button>
      </div>

      {/* Full Leaderboard Table */}
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'left', maxWidth: '900px', margin: '0 auto' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Bảng Điểm Chi Tiết Toàn Bộ Lớp</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>HẠNG</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>NGƯỜI CHƠI</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>ĐÚNG / SAI</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>TỶ LỆ CHÍNH XÁC</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>ĐIỂM SỐ TỔNG</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => {
              const total = p.correctCount + p.wrongCount;
              const accuracy = total > 0 ? Math.round((p.correctCount / total) * 100) : 0;
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '800' }}>#{i + 1}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontWeight: '700' }}>{p.name}</span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{ color: '#10b981' }}>{p.correctCount}</span> / <span style={{ color: '#ef4444' }}>{p.wrongCount}</span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      background: accuracy >= 70 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: accuracy >= 70 ? '#34d399' : '#f87171',
                    }}>
                      {accuracy}%
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '900', color: 'var(--accent-gold-bright)', fontSize: '1.1rem' }}>
                    {p.score.toLocaleString()} đ
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

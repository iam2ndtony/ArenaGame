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
import { getAvatar } from '@/utils/avatars';
import { sounds } from '@/utils/audio';

interface Player {
  id: string;
  name: string;
  avatar: string;
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

    const s = io();
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
      // Re-register as host for this room
      s.emit('host:create_room', { pin });
    });

    s.on('room:leaderboard_update', ({ leaderboard }: { leaderboard: Player[] }) => {
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
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #e62238 0%, #b31024 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
            }}>
              ⭐
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: '900' }}>
                MARX<span style={{ color: 'var(--accent-gold)' }}>ARENA</span> • SẢNH CHỜ MÁY CHIẾU
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mã phòng: <b style={{ color: 'var(--accent-gold)' }}>{pin}</b></p>
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
          <div className="glass-panel-elevated" style={{ padding: '30px', textAlign: 'center', position: 'relative' }}>
            <div style={{
              display: 'inline-block',
              padding: '6px 14px',
              background: 'rgba(255, 199, 44, 0.15)',
              border: '1px solid rgba(255, 199, 44, 0.3)',
              borderRadius: '20px',
              color: 'var(--accent-gold-bright)',
              fontSize: '0.85rem',
              fontWeight: '700',
              marginBottom: '16px',
            }}>
              📱 QUÉT CAMERA ĐỂ VÀO PHÒNG
            </div>

            <div style={{
              background: 'white',
              padding: '16px',
              borderRadius: '20px',
              display: 'inline-block',
              boxShadow: '0 0 40px rgba(255, 255, 255, 0.2)',
              marginBottom: '20px',
            }}>
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`Mã QR phòng ${pin}`}
                  style={{ width: '280px', height: '280px', display: 'block' }}
                />
              ) : (
                <div style={{ width: '280px', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                  Đang tạo mã QR...
                </div>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>HOẶC TRUY CẬP WEBSITE NHẬP MÃ PIN:</div>
              <div style={{
                fontSize: '3.4rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: '900',
                letterSpacing: '0.12em',
                color: 'var(--accent-gold-bright)',
                textShadow: '0 0 20px rgba(255, 199, 44, 0.5)',
                lineHeight: 1,
              }}>
                {pin}
              </div>
            </div>

            <div style={{
              padding: '10px 16px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '10px',
              fontSize: '0.82rem',
              color: 'var(--text-dim)',
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
                  Mời các bạn mở camera điện thoại hoặc máy tính quét mã QR bên trái để chọn Nickname & Avatar tham chiến!
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '14px',
                overflowY: 'auto',
                maxHeight: '440px',
                paddingRight: '6px',
              }}>
                {players.map((p) => {
                  const avatar = getAvatar(p.avatar);
                  return (
                    <div
                      key={p.id}
                      className="animate-pop-in"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 14px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '14px',
                        position: 'relative',
                      }}
                    >
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: 'rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                      }}>
                        {avatar.emoji}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {avatar.name}
                        </div>
                      </div>

                      <button
                        onClick={() => handleKickPlayer(p.id)}
                        title="Mời ra khỏi phòng"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f87171',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          padding: '4px',
                          opacity: 0.6,
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
              background: 'linear-gradient(135deg, #e62238 0%, #b31024 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}>
              ⭐
            </div>
            <div>
              <h1 style={{ fontSize: '1.3rem', fontWeight: '900' }}>
                MARX<span style={{ color: 'var(--accent-gold)' }}>ARENA</span> • ĐẠI CHIẾN MỞ RƯƠNG
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mã phòng: {pin} • {players.length} người chơi</p>
            </div>
          </div>

          {/* Big Countdown Timer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 24px',
            borderRadius: '16px',
            background: isUrgent
              ? 'rgba(230, 34, 56, 0.3)'
              : isWarning
              ? 'rgba(245, 158, 11, 0.2)'
              : 'rgba(255, 255, 255, 0.08)',
            border: isUrgent
              ? '2px solid #e62238'
              : isWarning
              ? '2px solid #f59e0b'
              : '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: isUrgent ? '0 0 30px rgba(230, 34, 56, 0.6)' : 'none',
          }}>
            <Clock size={24} color={isUrgent ? '#ef4444' : isWarning ? '#f59e0b' : 'var(--accent-gold)'} />
            <div style={{
              fontSize: '2rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: '900',
              letterSpacing: '0.05em',
              color: isUrgent ? '#ff8595' : isWarning ? '#fcd34d' : 'white',
            }}>
              {formatTime(remainingTime)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={toggleSound} className="btn-ghost" style={{ padding: '8px 14px' }}>
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button onClick={handleEndGameEarly} className="btn-ghost" style={{ color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              Kết Thúc Sớm
            </button>
          </div>
        </header>

        {/* Main Grid: Live Leaderboard + Live Event Ticker */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
          {/* Left Column: Live Leaderboard */}
          <div className="glass-panel-elevated" style={{ padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Trophy size={22} color="var(--accent-gold)" />
                <h2 style={{ fontSize: '1.4rem' }}>Bảng Xếp Hạng Trực Tiếp</h2>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cập nhật theo thời gian thực</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {players.slice(0, 10).map((p, idx) => {
                const avatar = getAvatar(p.avatar);
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
                      padding: '14px 20px',
                      borderRadius: '16px',
                      background: isTop1
                        ? 'linear-gradient(90deg, rgba(255, 199, 44, 0.22) 0%, rgba(255, 199, 44, 0.05) 100%)'
                        : isTop2
                        ? 'linear-gradient(90deg, rgba(203, 213, 225, 0.16) 0%, rgba(203, 213, 225, 0.04) 100%)'
                        : isTop3
                        ? 'linear-gradient(90deg, rgba(217, 119, 6, 0.16) 0%, rgba(217, 119, 6, 0.04) 100%)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isTop1
                        ? '2px solid var(--accent-gold)'
                        : isTop2
                        ? '1px solid #cbd5e1'
                        : isTop3
                        ? '1px solid #d97706'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: isTop1 ? '#ffc72c' : isTop2 ? '#cbd5e1' : isTop3 ? '#d97706' : 'rgba(255, 255, 255, 0.1)',
                        color: isTop1 ? '#111' : isTop2 ? '#111' : 'white',
                        fontWeight: '900',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-heading)',
                      }}>
                        {idx + 1}
                      </div>

                      <div style={{ fontSize: '24px' }}>{avatar.emoji}</div>

                      <div>
                        <div style={{ fontWeight: '800', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {p.name}
                          {p.shieldActive && (
                            <span title="Đang bật khiên bảo vệ" style={{ color: '#38bdf8' }}>
                              <Shield size={16} />
                            </span>
                          )}
                          {p.streak >= 3 && (
                            <span style={{ fontSize: '0.75rem', background: 'rgba(230, 34, 56, 0.2)', color: '#ff6b6b', padding: '2px 8px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <Flame size={12} /> {p.streak} Chuỗi
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Đúng: {p.correctCount} • Sai: {p.wrongCount}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '1.6rem',
                        fontWeight: '900',
                        color: isTop1 ? 'var(--accent-gold-bright)' : 'white',
                        fontFamily: 'var(--font-heading)',
                      }}>
                        {p.score.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>đ</span>
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
      <div style={{ marginBottom: '30px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 20px',
          background: 'rgba(255, 199, 44, 0.15)',
          border: '1px solid rgba(255, 199, 44, 0.3)',
          borderRadius: '30px',
          color: 'var(--accent-gold-bright)',
          fontSize: '0.9rem',
          fontWeight: '700',
          marginBottom: '14px',
        }}>
          <Trophy size={18} /> KẾT THÚC TRẬN ĐẤU • VINH DANH CHIẾN BINH
        </div>
        <h1 style={{ fontSize: '2.8rem', fontWeight: '900', marginBottom: '8px' }}>
          BẢNG VÀNG DANH DỰ MÁC - LÊNIN
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          Chúc mừng tất cả các đồng chí đã xuất sắc hoàn thành buổi tranh tài!
        </p>
      </div>

      {/* Podium Top 3 */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: '24px',
        margin: '50px 0 60px',
      }}>
        {/* Rank 2 (Silver) */}
        {podium[1] && (
          <div className="podium-column animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '6px' }}>{getAvatar(podium[1].avatar).emoji}</div>
            <div style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '2px' }}>{podium[1].name}</div>
            <div style={{ color: 'var(--accent-gold)', fontWeight: '800', fontSize: '1.2rem', marginBottom: '12px' }}>
              {podium[1].score.toLocaleString()} đ
            </div>
            <div className="podium-box-2">
              <span style={{ fontSize: '2.5rem', fontWeight: '900', color: '#1e293b' }}>2</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#334155' }}>HUY CHƯƠNG BẠC</span>
            </div>
          </div>
        )}

        {/* Rank 1 (Gold) */}
        {podium[0] && (
          <div className="podium-column animate-slide-up" style={{ width: '160px' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '2px' }}>👑</div>
            <div style={{ fontSize: '3.2rem', marginBottom: '6px' }}>{getAvatar(podium[0].avatar).emoji}</div>
            <div style={{ fontWeight: '900', fontSize: '1.3rem', color: 'var(--accent-gold-bright)', marginBottom: '2px' }}>
              {podium[0].name}
            </div>
            <div style={{ color: 'white', fontWeight: '900', fontSize: '1.4rem', marginBottom: '12px' }}>
              {podium[0].score.toLocaleString()} đ
            </div>
            <div className="podium-box-1">
              <span style={{ fontSize: '3.5rem', fontWeight: '900', color: '#111' }}>1</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '900', color: '#111' }}>QUÁN QU N VÀNG</span>
            </div>
          </div>
        )}

        {/* Rank 3 (Bronze) */}
        {podium[2] && (
          <div className="podium-column animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '6px' }}>{getAvatar(podium[2].avatar).emoji}</div>
            <div style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '2px' }}>{podium[2].name}</div>
            <div style={{ color: 'var(--accent-gold)', fontWeight: '800', fontSize: '1.2rem', marginBottom: '12px' }}>
              {podium[2].score.toLocaleString()} đ
            </div>
            <div className="podium-box-3">
              <span style={{ fontSize: '2.5rem', fontWeight: '900', color: '#451a03' }}>3</span>
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#451a03' }}>HUY CHƯƠNG ĐỒNG</span>
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
                  <td style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>{getAvatar(p.avatar).emoji}</span>
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

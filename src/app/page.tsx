'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, QrCode, ArrowRight, BookOpen, Users, Trophy, Award } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [creatingHost, setCreatingHost] = useState(false);

  const handleJoinByPin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    if (!cleanPin || cleanPin.length !== 6 || !/^\d+$/.test(cleanPin)) {
      setErrorMsg('Vui lòng nhập đúng mã phòng gồm 6 chữ số');
      return;
    }
    router.push(`/play/${cleanPin}`);
  };

  const handleCreateHostRoom = () => {
    setCreatingHost(true);
    router.push('/host/new');
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '32px 20px 64px' }}>
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px', paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
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
            <div style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              MarxArena
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Đấu trường trắc nghiệm Chủ nghĩa xã hội khoa học & Mác - Lênin
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            backgroundColor: '#1e293b',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            fontWeight: '500',
          }}>
            <BookOpen size={14} color="var(--accent-gold)" /> Chuẩn hóa MLN131
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <div style={{ textAlign: 'center', margin: '20px auto 44px', maxWidth: '720px' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: '800', lineHeight: 1.25, marginBottom: '14px', color: 'var(--text-primary)' }}>
          Nền tảng thi đấu trắc nghiệm <br />
          <span style={{ color: 'var(--accent-gold)' }}>Chính sách tôn giáo & Mác - Lênin</span>
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '620px', margin: '0 auto' }}>
          Giảng viên hoặc nhóm thuyết trình chiếu mã QR lên màn hình. Sinh viên quét camera bằng điện thoại để tham gia trả lời câu hỏi và mở rương tích điểm theo thời gian thực.
        </p>
      </div>

      {/* 2 Main Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '52px' }}>
        {/* Card 1: Player Join Room */}
        <div className="glass-panel" style={{ padding: '32px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#1e293b',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
            }}>
              <Play size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Tham Gia Bằng Mã Phòng</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Dành cho người chơi trên điện thoại hoặc máy tính</p>
            </div>
          </div>

          <form onSubmit={handleJoinByPin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                MÃ PIN PHÒNG (6 CHỮ SỐ)
              </label>
              <input
                type="text"
                placeholder="Nhập 6 số PIN"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/\D/g, ''));
                  setErrorMsg('');
                }}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  backgroundColor: 'var(--bg-input)',
                  border: errorMsg ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  letterSpacing: '0.15em',
                  textAlign: 'center',
                  outline: 'none',
                }}
              />
              {errorMsg && (
                <p style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '6px' }}>
                  {errorMsg}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            >
              Vào phòng thi đấu <ArrowRight size={18} />
            </button>
          </form>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '14px' }}>
            Mẹo: Quét mã QR trực tiếp trên màn hình chiếu để vào phòng tự động.
          </p>
        </div>

        {/* Card 2: Host Create Room */}
        <div className="glass-panel" style={{ padding: '32px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#1e293b',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-gold)',
            }}>
              <QrCode size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Tạo Phòng Máy Chiếu (Host)</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Dành cho giảng viên hoặc nhóm trưởng tổ chức</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent-gold)' }}>•</span> Tự động tạo mã QR quét tức thì không cần cài ứng dụng
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent-gold)' }}>•</span> 30 câu hỏi về Chính sách tôn giáo & Quan hệ dân tộc - tôn giáo
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent-gold)' }}>•</span> Tùy chọn thời lượng thi đấu và xếp hạng thời gian thực
            </div>
          </div>

          <button
            onClick={handleCreateHostRoom}
            disabled={creatingHost}
            className="btn-gold"
            style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
          >
            {creatingHost ? 'Đang khởi tạo...' : 'Tạo phòng chiếu cho lớp'}
          </button>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '14px' }}>
            Hoàn toàn miễn phí, không yêu cầu đăng ký tài khoản.
          </p>
        </div>
      </div>

      {/* Feature Showcase Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px 18px' }}>
          <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
            🎁 Rương phần thưởng
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Trả lời đúng để nhận cơ hội chọn rương tích điểm, nhân đôi điểm số hoặc cướp điểm đối thủ.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px 18px' }}>
          <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
            🛡️ Cơ chế phòng vệ
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Rương khiên bảo vệ giúp điểm số của bạn an toàn trước các đợt cướp điểm trong 30 giây.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px 18px' }}>
          <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
            🏆 Bảng xếp hạng trực tiếp
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Theo dõi vị trí liên tục trên màn hình chiếu lớp học và vinh danh Top 3 khi kết thúc ván đấu.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px 18px' }}>
          <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
            📝 Giải thích kiến thức
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Mỗi câu trả lời sai đều cung cấp đáp án đúng và lý giải ngắn gọn giúp củng cố kiến thức ôn thi.
          </p>
        </div>
      </div>

      {/* Clean Footer */}
      <footer style={{ marginTop: '54px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
        MarxArena • Hỗ trợ học phần Những nguyên lý cơ bản của Chủ nghĩa Mác - Lênin & CNXHKH (MLN131)
      </footer>
    </div>
  );
}

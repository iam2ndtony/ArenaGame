'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, QrCode, ArrowRight } from 'lucide-react';

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
    <div style={{ maxWidth: '1020px', margin: '0 auto', padding: '36px 20px 60px' }}>
      {/* Top Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '44px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #c5222f 0%, #8b141e 100%)',
            border: '1px solid rgba(251, 191, 36, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '900',
            fontSize: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}>
            M
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--text-primary)' }}>
              MarxArena
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Đấu trường trắc nghiệm tương tác thời gian thực
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push('/practice')}
          className="btn-ghost"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            borderColor: 'var(--accent-gold)',
            color: 'var(--accent-gold)',
            fontWeight: '700',
            fontSize: '0.92rem',
            padding: '10px 20px',
            borderRadius: '12px',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            transition: 'all 0.15s ease',
            cursor: 'pointer',
          }}
        >
          🎯 Thi Thử Ngay
        </button>
      </header>

      {/* Hero Section */}
      <div style={{ textAlign: 'center', margin: '20px auto 44px', maxWidth: '720px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1.25, marginBottom: '14px', color: 'var(--text-primary)' }}>
          <span style={{ color: 'var(--accent-gold)' }}>Đấu trường trắc nghiệm</span>
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '580px', margin: '0 auto 20px' }}>
          Quét mã QR bằng điện thoại hoặc nhập mã PIN phòng để tham gia trả lời câu hỏi và tranh tài trên bảng xếp hạng trực tiếp.
        </p>
        <button
          onClick={() => router.push('/practice')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '0.95rem',
            padding: '10px 24px',
            borderRadius: '10px',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
          }}
        >
          Làm bài thi thử ngay (30 câu) <ArrowRight size={16} />
        </button>
      </div>

      {/* 2 Main Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', maxWidth: '880px', margin: '0 auto 40px' }}>
        {/* Card 1: Player Join Room */}
        <div className="glass-panel" style={{ padding: '36px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
            }}>
              <Play size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Tham Gia Bằng Mã Phòng</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Dành cho người chơi trên điện thoại hoặc máy tính</p>
            </div>
          </div>

          <form onSubmit={handleJoinByPin}>
            <div style={{ marginBottom: '18px' }}>
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
                  fontSize: '1.35rem',
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
              style={{ width: '100%', padding: '15px', fontSize: '1rem' }}
            >
              Vào phòng thi đấu <ArrowRight size={18} />
            </button>
          </form>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '16px' }}>
            Mẹo: Quét mã QR trực tiếp trên màn hình chiếu để vào phòng tự động.
          </p>
        </div>

        {/* Card 2: Host Create Room */}
        <div className="glass-panel" style={{ padding: '36px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-gold)',
            }}>
              <QrCode size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Tạo Phòng Máy Chiếu (Host)</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Dành cho người điều phối hoặc nhóm tổ chức</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent-gold)', fontWeight: '800' }}>✓</span> Tự động tạo mã QR quét tức thì không cần cài app
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent-gold)', fontWeight: '800' }}>✓</span> 30 câu hỏi trắc nghiệm chuẩn hóa chất lượng cao
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent-gold)', fontWeight: '800' }}>✓</span> Tùy chỉnh thời lượng và bảng xếp hạng thời gian thực
            </div>
          </div>

          <button
            onClick={handleCreateHostRoom}
            disabled={creatingHost}
            className="btn-gold"
            style={{ width: '100%', padding: '15px', fontSize: '1rem' }}
          >
            {creatingHost ? 'Đang khởi tạo...' : 'Tạo phòng chiếu cho lớp'}
          </button>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '16px' }}>
            Hoàn toàn miễn phí, sẵn sàng sử dụng ngay.
          </p>
        </div>
      </div>

      {/* Minimal Footer */}
      <footer style={{ marginTop: '48px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
        MarxArena • Nền tảng thi đấu trắc nghiệm trực tuyến
      </footer>
    </div>
  );
}

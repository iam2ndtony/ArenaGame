'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Trophy, Users, Shield, Zap, ArrowRight, Play, QrCode } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [creatingHost, setCreatingHost] = useState(false);

  const handleJoinByPin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    if (!cleanPin || cleanPin.length !== 6 || !/^\d+$/.test(cleanPin)) {
      setErrorMsg('Vui lòng nhập đúng mã phòng gồm 6 chữ số!');
      return;
    }
    router.push(`/play/${cleanPin}`);
  };

  const handleCreateHostRoom = async () => {
    setCreatingHost(true);
    // Navigate to host creation
    router.push('/host/new');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px 60px' }}>
      {/* Top Brand Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #e62238 0%, #b31024 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 0 20px rgba(230, 34, 56, 0.5)',
          }}>
            ⭐
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              MARX<span style={{ color: 'var(--accent-gold)' }}>ARENA</span>
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Đấu trường trắc nghiệm Mác - Lênin đỉnh cao</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            background: 'rgba(255, 199, 44, 0.1)',
            border: '1px solid rgba(255, 199, 44, 0.3)',
            borderRadius: '20px',
            fontSize: '0.82rem',
            color: 'var(--accent-gold-bright)',
            fontWeight: '600',
          }}>
            <Sparkles size={14} /> Chế độ Đấu Trường Mở Rương
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <div style={{ textAlign: 'center', margin: '30px auto 50px', maxWidth: '820px' }}>
        <div style={{
          display: 'inline-block',
          padding: '6px 18px',
          background: 'rgba(230, 34, 56, 0.15)',
          border: '1px solid rgba(230, 34, 56, 0.4)',
          borderRadius: '30px',
          color: '#ff8595',
          fontSize: '0.9rem',
          fontWeight: '700',
          marginBottom: '20px',
        }}>
          ☭ Học tập sôi nổi • Tranh tài tri thức • Lội ngược dòng bất ngờ
        </div>
        <h2 style={{ fontSize: '3rem', fontWeight: '900', lineHeight: 1.15, marginBottom: '18px' }}>
          Ôn tập Triết học & Kinh tế chính trị <br />
          <span className="text-gradient-gold">Bằng Trải Nghiệm Đấu Trường Realtime</span>
        </h2>
        <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '680px', margin: '0 auto' }}>
          Giảng viên và người thuyết trình chiếu mã QR lên màn hình lớn. Người chơi quét điện thoại vào phòng ngay không cần đăng nhập, trả lời câu hỏi và mở rương cướp điểm nghẹt thở!
        </p>
      </div>

      {/* 2 Main Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '26px', marginBottom: '60px' }}>
        {/* Card 1: Player Join Room */}
        <div className="glass-panel-elevated" style={{ padding: '36px 30px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(14, 165, 233, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
            }}>
              <Play size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.4rem' }}>Người Chơi Tham Gia</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Dành cho sinh viên tham gia thi đấu từ điện thoại/laptop</p>
            </div>
          </div>

          <form onSubmit={handleJoinByPin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>
                Nhập Mã Phòng (PIN 6 số)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: 829413"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/\D/g, ''));
                  setErrorMsg('');
                }}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: errorMsg ? '2px solid #ef4444' : '2px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '14px',
                  color: 'white',
                  fontSize: '1.4rem',
                  fontWeight: '800',
                  letterSpacing: '0.2em',
                  textAlign: 'center',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
              {errorMsg && (
                <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '6px', fontWeight: '500' }}>
                  {errorMsg}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '16px' }}
            >
              VÀO PHÒNG NGAY <ArrowRight size={20} />
            </button>
          </form>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '16px' }}>
            💡 Mẹo: Quét trực tiếp mã QR trên máy chiếu để vào phòng tự động mà không cần gõ mã!
          </p>
        </div>

        {/* Card 2: Host Create Room */}
        <div className="glass-panel-elevated" style={{ padding: '36px 30px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(230, 34, 56, 0.3) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(230, 34, 56, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ff6b6b',
            }}>
              <QrCode size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.4rem' }}>Chủ Phòng / Màn Hình Chiếu</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Dành cho giảng viên, nhóm thuyết trình mở phòng</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--accent-gold)' }}>✓</span> Tự động tạo mã QR quét tức thì trong cùng Wi-Fi
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--accent-gold)' }}>✓</span> Bộ 30 câu hỏi chuẩn Mác - Lênin (hoặc nạp thêm file riêng)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--accent-gold)' }}>✓</span> Bảng xếp hạng trực tiếp & Vinh danh Podium Top 3 rực rỡ
            </div>
          </div>

          <button
            onClick={handleCreateHostRoom}
            disabled={creatingHost}
            className="btn-gold"
            style={{ width: '100%', padding: '16px' }}
          >
            {creatingHost ? 'ĐANG KHỞI TẠO...' : 'TẠO PHÒNG MÁY CHIẾU (HOST)'}
          </button>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '16px' }}>
            Không cần đăng ký tài khoản • Bắt đầu ngay sau 5 giây
          </p>
        </div>
      </div>

      {/* Feature Showcase Grid */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px' }}>
          Trải Nghiệm Đấu Trường Cực Kỳ Cuốn Hút
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Các cơ chế rương báu tạo bất ngờ đến giây cuối cùng</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        <div className="glass-panel" style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎁</div>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>3 Rương Thần Bí</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mỗi khi trả lời đúng, tự do chọn 1 trong 3 rương báu để nhận phần thưởng ngẫu nhiên.</p>
        </div>

        <div className="glass-panel" style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🦹</div>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Cướp & Hoán Đổi</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cướp 25% điểm hoặc hoán đổi điểm số với top 1 tạo nên những pha lội ngược dòng ngoạn mục.</p>
        </div>

        <div className="glass-panel" style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🛡️</div>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Khiên Bất Hoại</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Bảo vệ điểm số an toàn trong 30 giây khỏi các đòn cướp điểm từ người chơi khác.</p>
        </div>

        <div className="glass-panel" style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🏆</div>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Vinh Danh Podium</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Bục trao giải Top 3 hoành tráng kèm pháo hoa và thống kê độ chính xác chi tiết.</p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ marginTop: '70px', paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
        <p>MarxArena • Nền tảng Gamification hỗ trợ học tập môn Những nguyên lý cơ bản của CN Mác - Lênin (MLN131)</p>
        <p style={{ marginTop: '4px', fontSize: '0.78rem' }}>Độc bản & An toàn • Không thu thập dữ liệu cá nhân</p>
      </footer>
    </div>
  );
}

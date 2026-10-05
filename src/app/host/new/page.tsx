'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Clock, BookOpen, Upload, Check, Play, ArrowLeft, Eye, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function NewHostRoomPage() {
  const router = useRouter();
  const [duration, setDuration] = useState<number>(300); // 5 minutes default
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [customQuestions, setCustomQuestions] = useState<unknown[] | null>(null);
  const [questionCount, setQuestionCount] = useState(30);
  const [jsonText, setJsonText] = useState('');

  const DURATION_OPTIONS = [
    { label: '60 Giây (Thử nghiệm nhanh)', value: 60, desc: 'Phù hợp test thử 1-2 câu' },
    { label: '3 Phút (Tốc độ, sôi nổi)', value: 180, desc: 'Phù hợp khởi động đầu giờ' },
    { label: '5 Phút (Chuẩn lớp học)', value: 300, desc: 'Thời lượng lý tưởng nhất', recommended: true },
    { label: '7 Phút (Kịch tính)', value: 420, desc: 'Đấu trường nhiều pha lật kèo' },
    { label: '10 Phút (Đại chiến triết học)', value: 600, desc: 'Dành cho buổi sinh hoạt chuyên đề' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const list = Array.isArray(parsed) ? parsed : (parsed?.questions || null);
        if (Array.isArray(list) && list.length > 0) {
          setCustomQuestions(parsed);
          setQuestionCount(list.length);
          alert(`Đã tải thành công ${list.length} câu hỏi tùy chỉnh!`);
        } else {
          alert('File JSON phải chứa danh sách mảng các câu hỏi hoặc cấu trúc { questions: [...] }!');
        }
      } catch {
        alert('File không đúng định dạng JSON hợp lệ!');
      }
    };
    reader.readAsText(file);
  };

  const handleApplyJsonText = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const list = Array.isArray(parsed) ? parsed : (parsed?.questions || null);
      if (Array.isArray(list) && list.length > 0) {
        setCustomQuestions(parsed);
        setQuestionCount(list.length);
        setShowQuestionModal(false);
        alert(`Đã nạp ${list.length} câu hỏi thành công!`);
      } else {
        alert('Vui lòng nhập định dạng JSON hợp lệ chứa danh sách câu hỏi!');
      }
    } catch {
      alert('Cú pháp JSON không hợp lệ, vui lòng kiểm tra lại!');
    }
  };

  const handleCreateRoom = () => {
    setLoading(true);
    setError('');

    const socket: Socket = io();

    socket.on('connect', () => {
      socket.emit(
        'host:create_room',
        { duration, questions: customQuestions },
        (res: { success: boolean; pin: string; error?: string }) => {
          if (res.success && res.pin) {
            // Save host flag for this pin in sessionStorage
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(`marx_host_${res.pin}`, 'true');
            }
            router.push(`/host/${res.pin}`);
          } else {
            setError(res.error || 'Không thể tạo phòng, vui lòng thử lại');
            setLoading(false);
          }
        }
      );
    });

    socket.on('connect_error', () => {
      setError('Lỗi kết nối Socket Server! Hãy chắc chắn server đang chạy.');
      setLoading(false);
    });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px 80px' }}>
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '24px', fontSize: '0.9rem' }}>
        <ArrowLeft size={16} /> Quay lại trang chủ
      </Link>

      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: '900', marginBottom: '8px' }}>
          Cấu Hình Phòng Chơi Máy Chiếu
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Tùy chỉnh thời lượng và bộ câu hỏi trước khi trình chiếu mã QR cho cả lớp
        </p>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '12px', color: '#fca5a5', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Duration Selection */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <Clock size={20} color="var(--accent-gold)" />
          <h2 style={{ fontSize: '1.25rem' }}>1. Chọn Thời Gian Thi Đấu</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {DURATION_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              onClick={() => setDuration(opt.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '12px',
                background: duration === opt.value ? 'rgba(255, 199, 44, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: duration === opt.value ? '2px solid var(--accent-gold)' : '1px solid var(--border-glass)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div>
                <div style={{ fontWeight: '700', fontSize: '1.05rem', color: duration === opt.value ? 'var(--accent-gold-bright)' : 'white' }}>
                  {opt.label} {opt.recommended && <span style={{ fontSize: '0.75rem', background: 'var(--accent-crimson)', color: 'white', padding: '2px 8px', borderRadius: '10px', marginLeft: '6px' }}>KHUYÊN DÙNG</span>}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
              </div>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: duration === opt.value ? '6px solid var(--accent-gold)' : '2px solid rgba(255, 255, 255, 0.2)',
                background: 'transparent',
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* Questions Bank Selection */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={20} color="#38bdf8" />
            <h2 style={{ fontSize: '1.25rem' }}>2. Bộ Câu Hỏi Mác - Lênin</h2>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: '700', background: 'rgba(16, 185, 129, 0.12)', padding: '4px 12px', borderRadius: '20px' }}>
            {questionCount} Câu hỏi sẵn sàng
          </span>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          {customQuestions
            ? 'Đang sử dụng bộ câu hỏi tùy chỉnh do bạn tải lên.'
            : 'Đang dùng bộ 30 câu hỏi chuẩn phủ khắp 3 học phần: Triết học Mác - Lênin, Kinh tế chính trị Mác - Lênin, và Chủ nghĩa xã hội khoa học.'}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <label className="btn-ghost" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={16} /> Tải file JSON riêng
            <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowQuestionModal(true)}
          >
            <Eye size={16} /> Dán JSON / Chỉnh sửa
          </button>

          {customQuestions && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setCustomQuestions(null);
                setQuestionCount(30);
              }}
              style={{ color: '#fca5a5' }}
            >
              <RefreshCw size={16} /> Khôi phục 30 câu mặc định
            </button>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleCreateRoom}
        disabled={loading}
        className="btn-primary"
        style={{ width: '100%', padding: '18px', fontSize: '1.2rem' }}
      >
        {loading ? 'ĐANG KHỞI TẠO PHÒNG...' : 'TIẾN VÀO SẢNH CHỜ & CHIẾU MÃ QR'}
      </button>

      {/* Modal for Question JSON paste */}
      {showQuestionModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 9999,
        }}>
          <div className="glass-panel-elevated" style={{ width: '100%', maxWidth: '640px', padding: '30px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Nhập hoặc Dán Bộ Câu Hỏi (JSON)</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Hỗ trợ định dạng chuẩn với <code>title</code>, <code>questions</code> (mỗi câu gồm <code>question</code>, <code>options</code> dạng object &#123; &quot;A&quot;: ..., &quot;B&quot;: ... &#125;, và <code>answer</code>: &quot;A&quot;|&quot;B&quot;|&quot;C&quot;|&quot;D&quot;).
            </p>

            <textarea
              rows={11}
              placeholder={`{\n  "title": "BỘ CÂU HỎI TRẮC NGHIỆM...",\n  "description": "...",\n  "total_questions": 30,\n  "questions": [\n    {\n      "id": 1,\n      "type": "multiple_choice",\n      "question": "Nội dung câu hỏi...",\n      "options": {\n        "A": "Đáp án A",\n        "B": "Đáp án B",\n        "C": "Đáp án C",\n        "D": "Đáp án D"\n      },\n      "answer": "B"\n    }\n  ]\n}`}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#e2e8f0',
                padding: '12px',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                outline: 'none',
                marginBottom: '16px',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowQuestionModal(false)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn-gold"
                onClick={handleApplyJsonText}
              >
                Áp Dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

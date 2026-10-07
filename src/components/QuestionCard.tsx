'use client';

import React from 'react';
import VietnamLandmarksIllustration from './VietnamLandmarksIllustration';
import { ArrowRight, Clock, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface QuestionCardProps {
  title?: string;
  questionIndex: number;
  totalQuestions: number;
  questionText: string;
  options: string[];
  selectedOption: number | null;
  onSelectOption: (idx: number) => void;
  isAnswered: boolean;
  isCorrect?: boolean | null;
  correctAnswerText?: string;
  explanation?: string;
  countdownSeconds: number;
  onNext: () => void;
  onClose?: () => void;
  nextButtonText?: string;
  disabled?: boolean;
}

export default function QuestionCard({
  title = 'Thi thử',
  questionIndex,
  totalQuestions,
  questionText,
  options,
  selectedOption,
  onSelectOption,
  isAnswered,
  isCorrect,
  correctAnswerText,
  explanation,
  countdownSeconds,
  onNext,
  onClose,
  nextButtonText = 'Tiếp theo',
  disabled = false,
}: QuestionCardProps) {
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div style={{
      maxWidth: '620px',
      width: '100%',
      margin: '0 auto',
      borderRadius: '22px',
      background: 'linear-gradient(180deg, #1b232f 0%, #141b24 55%, #10151c 100%)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* 1. Header Bar */}
      <div style={{
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{
          color: '#ffffff',
          fontSize: '1rem',
          fontWeight: '700',
          letterSpacing: '-0.01em',
        }}>
          {title}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            color: '#facc15',
            fontWeight: '800',
            fontSize: '0.95rem',
          }}>
            {questionIndex + 1} / {totalQuestions}
          </span>

          {onClose && (
            <button
              onClick={onClose}
              title="Đóng"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Body Area */}
      <div style={{
        padding: '24px 26px 20px',
        position: 'relative',
        zIndex: 1,
        flex: 1,
      }}>
        {/* Yellow "CÂU {n}" Tag */}
        <div style={{
          color: '#f59e0b',
          fontSize: '0.85rem',
          fontWeight: '800',
          letterSpacing: '0.05em',
          marginBottom: '8px',
          textTransform: 'uppercase',
        }}>
          CÂU {questionIndex + 1}
        </div>

        {/* Question Heading */}
        <h2 style={{
          color: '#ffffff',
          fontSize: '1.2rem',
          fontWeight: '700',
          lineHeight: '1.5',
          marginBottom: '22px',
        }}>
          {questionText}
        </h2>

        {/* Options List: 2 options displayed in 2 balanced cards side-by-side; 3-4 options in column */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: options.length === 2 ? 'repeat(auto-fit, minmax(200px, 1fr))' : '1fr',
          gap: options.length === 2 ? '14px' : '11px',
          marginBottom: isAnswered ? '16px' : '28px',
          position: 'relative',
          zIndex: 2,
        }}>
          {options.map((opt, idx) => {
            const letter = letters[idx] || '';
            const isSelected = selectedOption === idx;

            // Formatted string: starts with "A. ", "B. ", etc.
            const displayLabel = opt.startsWith(`${letter}.`)
              ? opt
              : `${letter}. ${opt}`;

            let optBg = 'rgba(30, 41, 59, 0.78)';
            let optBorder = '1px solid rgba(255, 255, 255, 0.1)';
            let optColor = '#e2e8f0';

            if (isAnswered) {
              if (isSelected && isCorrect) {
                optBg = 'rgba(16, 185, 129, 0.25)';
                optBorder = '2px solid #10b981';
                optColor = '#6ee7b7';
              } else if (isSelected && !isCorrect) {
                optBg = 'rgba(239, 68, 68, 0.25)';
                optBorder = '2px solid #ef4444';
                optColor = '#fca5a5';
              }
            } else if (isSelected) {
              optBg = 'rgba(14, 116, 144, 0.35)';
              optBorder = '2px solid #38bdf8';
            }

            return (
              <button
                key={idx}
                onClick={() => onSelectOption(idx)}
                disabled={isAnswered || disabled}
                style={{
                  width: '100%',
                  padding: options.length === 2 ? '18px 20px' : '14px 18px',
                  minHeight: options.length === 2 ? '68px' : 'auto',
                  backgroundColor: optBg,
                  border: optBorder,
                  borderRadius: '12px',
                  textAlign: 'left',
                  color: optColor,
                  fontSize: options.length === 2 ? '1.02rem' : '0.95rem',
                  fontWeight: options.length === 2 ? '600' : '500',
                  lineHeight: '1.45',
                  cursor: isAnswered ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <span>{displayLabel}</span>
                {isAnswered && isSelected && isCorrect && (
                  <CheckCircle2 size={20} color="#10b981" />
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <AlertCircle size={20} color="#ef4444" />
                )}
              </button>
            );
          })}
        </div>

        {/* Answer Feedback box when answered */}
        {isAnswered && (
          <div style={{
            background: isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: isCorrect ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            position: 'relative',
            zIndex: 2,
          }}>
            {isCorrect ? (
              <div style={{
                fontWeight: '800',
                fontSize: '1.05rem',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <CheckCircle2 size={20} color="#10b981" />
                <span>Chính xác!</span>
              </div>
            ) : (
              <div>
                <div style={{
                  fontWeight: '800',
                  fontSize: '0.98rem',
                  color: '#f87171',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <AlertCircle size={18} color="#ef4444" />
                  <span>Chưa chính xác!</span>
                </div>
                {correctAnswerText && (
                  <div style={{
                    fontSize: '0.92rem',
                    color: '#fef08a',
                    fontWeight: '600',
                    lineHeight: '1.45',
                  }}>
                    Đáp án đúng: {correctAnswerText}
                  </div>
                )}
                {explanation && !explanation.startsWith('Đáp án đúng') && (
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#cbd5e1',
                    lineHeight: '1.45',
                    marginTop: '6px',
                  }}>
                    {explanation}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Waving Red Flag & Hanoi Landmarks Illustration at Bottom */}
      <VietnamLandmarksIllustration />

      {/* 4. Footer Bar */}
      <div style={{
        padding: '16px 26px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 2,
        backgroundColor: 'rgba(17, 23, 31, 0.85)',
        backdropFilter: 'blur(8px)',
      }}>
        {/* Timer with Clock Icon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          color: '#f59e0b',
          fontWeight: '800',
          fontSize: '0.95rem',
        }}>
          <Clock size={18} />
          <span>{countdownSeconds} s</span>
        </div>

        {/* Sky-Blue Action Button */}
        <button
          onClick={onNext}
          disabled={disabled || selectedOption === null}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: selectedOption === null ? 'rgba(56, 189, 248, 0.4)' : '#38bdf8',
            color: '#0f172a',
            fontWeight: '800',
            fontSize: '0.95rem',
            padding: '11px 24px',
            borderRadius: '10px',
            border: 'none',
            cursor: selectedOption === null ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: selectedOption === null ? 'none' : '0 4px 14px rgba(56, 189, 248, 0.4)',
          }}
        >
          <span>{nextButtonText}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

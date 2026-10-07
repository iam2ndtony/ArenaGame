'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QuestionCard from '@/components/QuestionCard';
import questionsData from '@/data/questions.json';
import {
  normalizeQuestionList,
  prepareShuffledDeck,
  NormalizedQuestion,
} from '@/lib/questionUtils';

export default function PracticePage() {
  const router = useRouter();

  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(180);
  const [isFinished, setIsFinished] = useState(false);

  // Initialize randomized deck on mount
  useEffect(() => {
    const normalized = normalizeQuestionList(questionsData);
    setQuestions(prepareShuffledDeck(normalized));
  }, []);

  const handleRestart = () => {
    const normalized = normalizeQuestionList(questionsData);
    setQuestions(prepareShuffledDeck(normalized));
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setTimerSeconds(180);
    setIsFinished(false);
  };

  // Countdown timer
  useEffect(() => {
    if (isFinished || questions.length === 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished, questions.length]);

  if (questions.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Đang chuẩn bị đề thi ngẫu nhiên...
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  if (!currentQ || isFinished) {
    return (
      <div style={{ maxWidth: '560px', margin: '60px auto', padding: '30px 20px', textAlign: 'center' }}>
        <div className="glass-panel-elevated" style={{ padding: '40px 24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '14px' }}>🎉</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px' }}>
            Hoàn Thành Bài Thi Thử!
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Bạn đã hoàn thành toàn bộ câu hỏi ôn tập với thứ tự câu hỏi ngẫu nhiên.
          </p>

          <div style={{
            fontSize: '2.4rem',
            fontWeight: '900',
            color: 'var(--accent-gold)',
            marginBottom: '24px',
          }}>
            {score} / {questions.length} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>câu đúng</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={handleRestart}
              className="btn-primary"
              style={{ padding: '12px 24px' }}
            >
              Làm lại bài thi (Đề mới)
            </button>
            <button
              onClick={() => router.push('/')}
              className="btn-ghost"
              style={{ padding: '12px 24px' }}
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    if (idx === currentQ.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const letters = ['A', 'B', 'C', 'D'];
  const isCorrect = selectedOption !== null && currentQ ? selectedOption === currentQ.correctIndex : null;
  const correctLetter = currentQ ? letters[currentQ.correctIndex] || '' : '';
  const rawOptionText = currentQ ? currentQ.options[currentQ.correctIndex] || '' : '';
  const correctAnswerText = rawOptionText.startsWith(`${correctLetter}.`)
    ? rawOptionText
    : `${correctLetter ? `${correctLetter}. ` : ''}${rawOptionText}`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <QuestionCard
        title="Thi thử"
        questionIndex={currentIndex}
        totalQuestions={questions.length}
        questionText={currentQ.question}
        options={currentQ.options}
        selectedOption={selectedOption}
        onSelectOption={handleSelectOption}
        isAnswered={isAnswered}
        isCorrect={isCorrect}
        correctAnswerText={correctAnswerText}
        explanation={!isCorrect && currentQ.explanation && !currentQ.explanation.startsWith('Đáp án đúng') ? currentQ.explanation : undefined}
        countdownSeconds={timerSeconds}
        onNext={handleNext}
        onClose={() => router.push('/')}
        nextButtonText={currentIndex + 1 === questions.length ? 'Hoàn thành' : 'Tiếp theo'}
      />
    </div>
  );
}

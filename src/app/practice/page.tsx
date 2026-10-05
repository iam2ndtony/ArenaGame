'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QuestionCard from '@/components/QuestionCard';
import questionsData from '@/data/questions.json';

interface QuestionItem {
  id: number;
  type?: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: string;
  explanation?: string;
}

export default function PracticePage() {
  const router = useRouter();
  const rawQuestions = (questionsData?.questions || []) as QuestionItem[];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(180);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = rawQuestions[currentIndex];

  // Countdown timer
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished]);

  if (!currentQ || isFinished) {
    return (
      <div style={{ maxWidth: '560px', margin: '60px auto', padding: '30px 20px', textAlign: 'center' }}>
        <div className="glass-panel-elevated" style={{ padding: '40px 24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '14px' }}>🎉</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px' }}>
            Hoàn Thành Bài Thi Thử!
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Bạn đã hoàn thành toàn bộ câu hỏi ôn tập.
          </p>

          <div style={{
            fontSize: '2.4rem',
            fontWeight: '900',
            color: 'var(--accent-gold)',
            marginBottom: '24px',
          }}>
            {score} / {rawQuestions.length} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>câu đúng</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setCurrentIndex(0);
                setSelectedOption(null);
                setIsAnswered(false);
                setScore(0);
                setTimerSeconds(180);
                setIsFinished(false);
              }}
              className="btn-primary"
              style={{ padding: '12px 24px' }}
            >
              Làm lại bài thi
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

  const optionLetters = ['A', 'B', 'C', 'D'];
  const optionsList = [
    currentQ.options.A,
    currentQ.options.B,
    currentQ.options.C,
    currentQ.options.D,
  ];

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const chosenLetter = optionLetters[idx];
    if (chosenLetter === currentQ.answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < rawQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const chosenLetter = selectedOption !== null ? optionLetters[selectedOption] : null;
  const isCorrect = chosenLetter !== null ? chosenLetter === currentQ.answer : null;
  const correctAnswerKey = currentQ.answer as keyof typeof currentQ.options;
  const correctAnswerText = `${currentQ.answer}. ${currentQ.options[correctAnswerKey] || ''}`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <QuestionCard
        title="Thi thử"
        questionIndex={currentIndex}
        totalQuestions={rawQuestions.length}
        questionText={currentQ.question}
        options={optionsList}
        selectedOption={selectedOption}
        onSelectOption={handleSelectOption}
        isAnswered={isAnswered}
        isCorrect={isCorrect}
        correctAnswerText={correctAnswerText}
        explanation={currentQ.explanation}
        countdownSeconds={timerSeconds}
        onNext={handleNext}
        onClose={() => router.push('/')}
        nextButtonText={currentIndex + 1 === rawQuestions.length ? 'Hoàn thành' : 'Tiếp theo'}
      />
    </div>
  );
}

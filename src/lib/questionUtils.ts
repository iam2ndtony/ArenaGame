export interface RawQuestion {
  id?: number;
  type?: string;
  category?: string;
  question: string;
  options?: Record<string, string> | string[];
  answer?: string | number | boolean;
  correctIndex?: number;
  correctAnswer?: string | number;
  explanation?: string;
}

export interface NormalizedQuestion {
  id: number;
  type: string;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export function normalizeQuestionList(rawData: any): NormalizedQuestion[] {
  let list: any[] = [];
  if (Array.isArray(rawData)) {
    list = rawData;
  } else if (rawData && typeof rawData === 'object' && Array.isArray(rawData.questions)) {
    list = rawData.questions;
  }

  return list.map((q, idx) => {
    let optionsArray: string[] = [];
    let correctIdx = 0;
    const isTfType = q.type === 'true_false' || q.type === 'tf' || q.type === 'boolean';

    // 1. Options extraction
    if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
      const keys = Object.keys(q.options);
      if (keys.includes('A') || keys.includes('B')) {
        const standardKeys = ['A', 'B', 'C', 'D'].filter(
          (k) => q.options[k] !== undefined && q.options[k] !== null && String(q.options[k]).trim() !== ''
        );
        optionsArray = standardKeys.map((k) => String(q.options[k]).trim());
      } else if (keys.some((k) => k.toLowerCase() === 'true') || keys.some((k) => k.toLowerCase() === 'false')) {
        const trueKey = keys.find((k) => k.toLowerCase() === 'true');
        const falseKey = keys.find((k) => k.toLowerCase() === 'false');
        optionsArray = [
          trueKey ? String(q.options[trueKey]).trim() : 'Đúng',
          falseKey ? String(q.options[falseKey]).trim() : 'Sai',
        ];
      } else if (keys.includes('Đúng') || keys.includes('Sai')) {
        optionsArray = [String(q.options['Đúng'] || 'Đúng').trim(), String(q.options['Sai'] || 'Sai').trim()];
      } else {
        optionsArray = Object.values(q.options).map((v: any) => String(v).trim()).filter(Boolean);
      }
    } else if (Array.isArray(q.options)) {
      optionsArray = q.options.map((v: any) => String(v).trim()).filter(Boolean);
    } else if (isTfType) {
      optionsArray = ['Đúng', 'Sai'];
    }

    if (optionsArray.length === 0) {
      optionsArray = ['Đúng', 'Sai'];
    }

    // 2. Answer resolution
    const rawAnswer = q.answer !== undefined ? q.answer : (q.correctIndex !== undefined ? q.correctIndex : q.correctAnswer);

    if (typeof rawAnswer === 'boolean') {
      correctIdx = rawAnswer ? 0 : 1;
    } else if (typeof rawAnswer === 'number') {
      correctIdx = Math.max(0, Math.min(optionsArray.length - 1, rawAnswer));
    } else if (typeof rawAnswer === 'string') {
      const trimmed = rawAnswer.trim();
      const upper = trimmed.toUpperCase();
      const letterMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

      if (letterMap[upper] !== undefined && letterMap[upper] < optionsArray.length) {
        correctIdx = letterMap[upper];
      } else if (['TRUE', 'ĐÚNG', 'DUNG', 'T'].includes(upper)) {
        correctIdx = 0;
      } else if (['FALSE', 'SAI', 'F'].includes(upper)) {
        correctIdx = Math.min(1, optionsArray.length - 1);
      } else {
        const foundIdx = optionsArray.findIndex((opt) => opt.toLowerCase() === trimmed.toLowerCase());
        correctIdx = foundIdx !== -1 ? foundIdx : 0;
      }
    }

    const letters = ['A', 'B', 'C', 'D'];
    const letter = letters[correctIdx] || '';
    const isTwoOption = optionsArray.length === 2;

    return {
      id: q.id || idx + 1,
      type: isTwoOption || isTfType ? 'true_false' : (q.type || 'multiple_choice'),
      category: q.category || 'Chủ nghĩa xã hội khoa học',
      question: q.question,
      options: optionsArray,
      correctIndex: correctIdx,
      explanation: q.explanation || '',
    };
  });
}

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function prepareShuffledDeck(questions: NormalizedQuestion[]): NormalizedQuestion[] {
  const shuffled = shuffleArray(questions);
  return shuffled.map((q) => {
    // If 2 options (True/False): DO NOT shuffle options (keep Đúng before Sai)
    if (q.options.length <= 2) {
      return { ...q };
    }

    // 3 or 4 options: shuffle options
    const indexed = q.options.map((opt, i) => ({
      text: opt,
      isCorrect: i === q.correctIndex,
    }));
    const shuffledIndexed = shuffleArray(indexed);
    const newCorrectIdx = shuffledIndexed.findIndex((item) => item.isCorrect);
    const letters = ['A', 'B', 'C', 'D'];

    return {
      ...q,
      options: shuffledIndexed.map((item) => item.text),
      correctIndex: newCorrectIdx,
      explanation: q.explanation || '',
    };
  });
}

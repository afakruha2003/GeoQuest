import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Country, QuizMode, QuizQuestion, QuizResult } from '../types';
import { userStore } from '../store/userStore';

interface UseQuizParams {
  mode: QuizMode;
  difficulty?: 'easy' | 'medium' | 'hard';
  region?: string;
  countryCode?: string;
  countries: Country[];
  reviewWrong?: boolean;
  wrongCountryCodes?: string[];
}

interface UseQuizState {
  questions: QuizQuestion[];
  currentIndex: number;
  currentQuestion: QuizQuestion | null;
  score: number;
  streak: number;
  selectedOption: string | null;
  isAnswered: boolean;
  timeLeft: number;
  quizFinished: boolean;
  timePerQuestion: number;
  selectAnswer: (option: string) => void;
  nextQuestion: () => void;
  getResult: () => Promise<QuizResult>;
}

function formatNumberShort(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 3 ipucu üret — 4. ipucu olarak bayrak QuizScreen tarafından gösterilir
// Süre: 30sn, her ipucu 6sn'de bir açılır (6→12→18sn → bayrak 24sn'de)
function buildHints(country: Country, _allCountries: Country[]): string[] {
  const hints: string[] = [];

  // 1. Kıta
  hints.push(`🌍 Kıta: ${country.region}`);

  // 2. Nüfus aralığı
  const pop = country.population;
  let popHint = '';
  if (pop > 100_000_000) popHint = '100 milyondan fazla';
  else if (pop > 50_000_000) popHint = '50-100 milyon arası';
  else if (pop > 10_000_000) popHint = '10-50 milyon arası';
  else if (pop > 1_000_000) popHint = '1-10 milyon arası';
  else popHint = '1 milyondan az';
  hints.push(`👥 Nüfus: ${popHint}`);

  // 3. Para birimi (varsa) yoksa bölge
  if (country.currencies) {
    const firstCurrency = Object.values(country.currencies)[0];
    if (firstCurrency) {
      hints.push(`💰 Para birimi: ${firstCurrency.name} (${firstCurrency.symbol ?? '?'})`);
    } else {
      hints.push(`📍 Bölge: ${country.subregion ?? country.region}`);
    }
  } else {
    hints.push(`📍 Bölge: ${country.subregion ?? country.region}`);
  }

  // 4. ipucu = bayrak → QuizScreen hints.length × HINT_INTERVAL_SECONDS sonra gösteriyor
  return hints;
}


export function useQuiz(params: UseQuizParams): UseQuizState {
  const {
    mode,
    difficulty = 'easy',
    region,
    countryCode,
    countries,
    reviewWrong = false,
    wrongCountryCodes = [],
  } = params;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // ✅ Doğru/yanlış sayısını ayrı tut (score'dan hesaplama yerine)
  const correctCountRef = useRef(0);
  const wrongCountRef = useRef(0);

  // timePerQuestion: aktif sorunun tipine göre dinamik
  // (mini quiz'de flag/capital/guess karışık olabilir)
  const getTimeForType = useCallback((type: QuizMode): number => {
    if (type === 'flag') return 15;
    if (type === 'capital') return 20;
    return 30; // guess: 3 ipucu × 6sn = 18sn + bayrak 6sn + tampon
  }, []);

  const timePerQuestion = useMemo(() => {
    // mode parametresi mini quiz'de 'flag' gelebilir ama sorular karışık tipte olabilir
    // Bu değer sadece ilk soru için kullanılır, nextQuestion her soru için yeniden hesaplar
    if (mode === 'flag') return 15;
    if (mode === 'capital') return 20;
    return 30;
  }, [mode]);

  const totalQuestions = useMemo(() => {
    if (countryCode) return 5;
    if (mode === 'flag') {
      if (difficulty === 'hard') return 30;
      if (difficulty === 'medium') return 20;
      return 10;
    }
    if (mode === 'capital') return 10;
    return 10;
  }, [mode, difficulty, countryCode]);

  const pickRandom = useCallback(
    (count: number, from: Country[]): Country[] => shuffle(from).slice(0, count),
    [],
  );

  const generateQuestions = useCallback(() => {
    let pool = [...countries];

    if (region && region !== 'Tümü') {
      pool = pool.filter((c) => c.region === region);
    }

    if (reviewWrong && wrongCountryCodes.length > 0) {
      const wrongPool = pool.filter((c) => wrongCountryCodes.includes(c.cca3));
      if (wrongPool.length > 0) pool = wrongPool;
    }

    // ─── Mini Quiz (belirli bir ülke için) ────────────────────────────
    if (countryCode) {
      const target = countries.find((c) => c.cca3 === countryCode);
      if (!target) {
        setQuestions([]);
        return;
      }

      const wrongBasePool = countries.filter((c) => c.cca3 !== countryCode);
      const correctName = target.name.common;
      const correctCapital =
        target.capital?.[0] ?? 'Başkenti yok';

      // ✅ DÜZELTME: 5 soru için 5 farklı tip belirle
      // Sıra: flag → capital → guess → flag → capital
      // Böylece hiçbir soru tekrarlanmıyor
      const miniTypes: QuizMode[] = ['flag', 'capital', 'guess', 'flag', 'capital'];

      const createdMini: QuizQuestion[] = miniTypes.slice(0, totalQuestions).map((qType, index) => {
        if (qType === 'guess') {
          const hints = buildHints(target, countries);
          const randomWrong = pickRandom(3, wrongBasePool).map((c) => c.name.common);
          const options = shuffle([...randomWrong, correctName]);
          return {
            id: `mini-guess-${index}`,
            type: 'guess' as const,
            country: target,
            options,
            correctAnswer: correctName,
            hints,
          };
        }

        if (qType === 'capital') {
          const wrongPool = wrongBasePool.filter((c) => c.capital && c.capital.length > 0);
          const randomWrong = pickRandom(3, wrongPool).map(
            (c) => c.capital?.[0] ?? 'Başkenti yok',
          );
          const options = shuffle([...randomWrong, correctCapital]);
          return {
            id: `mini-capital-${index}`,
            type: 'capital' as const,
            country: target,
            options,
            correctAnswer: correctCapital,
          };
        }

        // flag
        const randomWrong = pickRandom(3, wrongBasePool).map((c) => c.name.common);
        const options = shuffle([...randomWrong, correctName]);
        return {
          id: `mini-flag-${index}`,
          type: 'flag' as const,
          country: target,
          options,
          correctAnswer: correctName,
        };
      });

      resetState(createdMini, timePerQuestion);
      return;
    }

    // ─── Normal Quiz ──────────────────────────────────────────────────
    const baseCountries = pickRandom(totalQuestions, pool);

    const created: QuizQuestion[] = baseCountries.map((country, index) => {
      const correctName = country.name.common;
      const correctCapital = country.capital?.[0] ?? 'Başkenti yok';

      if (mode === 'guess') {
        const hints = buildHints(country, countries);
        const wrongPool = countries.filter((c) => c.cca3 !== country.cca3);
        const randomWrong = pickRandom(3, wrongPool).map((c) => c.name.common);
        const options = shuffle([...randomWrong, correctName]);
        return {
          id: `guess-${index}`,
          type: 'guess' as const,
          country,
          options,
          correctAnswer: correctName,
          hints,
        };
      }

      const correct = mode === 'flag' ? correctName : correctCapital;
      const wrongPool = countries.filter((c) => c.cca3 !== country.cca3);

      // ✅ Aynı bölgeden yanlış şıklar seç — daha zor
      const sameRegionWrong = wrongPool.filter((c) => c.region === country.region);
      const diffRegionWrong = wrongPool.filter((c) => c.region !== country.region);

      let wrongCandidates: Country[];
      if (difficulty === 'hard' && sameRegionWrong.length >= 3) {
        wrongCandidates = pickRandom(3, sameRegionWrong);
      } else if (difficulty === 'medium' && sameRegionWrong.length >= 2) {
        wrongCandidates = [
          ...pickRandom(2, sameRegionWrong),
          ...pickRandom(1, diffRegionWrong),
        ];
      } else {
        wrongCandidates = pickRandom(3, wrongPool);
      }

      const randomWrong = wrongCandidates.map((c) =>
        mode === 'flag'
          ? c.name.common
          : c.capital?.[0] ?? 'Başkenti yok',
      );
      const options = shuffle([...randomWrong, correct]);

      return {
        id: `${mode}-${index}`,
        type: mode,
        country,
        options,
        correctAnswer: correct,
      };
    });

    resetState(created, timePerQuestion);
  }, [
    countries,
    countryCode,
    difficulty,
    mode,
    pickRandom,
    region,
    reviewWrong,
    timePerQuestion,
    totalQuestions,
    wrongCountryCodes,
  ]);

  function resetState(qs: QuizQuestion[], _defaultTpq: number) {
    setQuestions(qs);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setQuizFinished(false);
    // İlk sorunun tipine göre süreyi ayarla
    const firstType = qs[0]?.type ?? 'flag';
    setTimeLeft(getTimeForType(firstType));
    correctCountRef.current = 0;
    wrongCountRef.current = 0;
  }

  useEffect(() => {
    if (!countries.length) return;
    generateQuestions();
  }, [countries, generateQuestions]);

  // Timer
  useEffect(() => {
    if (quizFinished || !questions.length) return;

    if (timeLeft <= 0 && !isAnswered) {
      setIsAnswered(true);
      setStreak(0);
      wrongCountRef.current += 1;
      return;
    }

    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnswered, questions.length, quizFinished, timeLeft]);

  const selectAnswer = useCallback(
    (option: string) => {
      if (isAnswered || quizFinished) return;
      const current = questions[currentIndex];
      if (!current) return;

      const isCorrect = option === current.correctAnswer;

      setSelectedOption(option);
      setIsAnswered(true);

      if (isCorrect) {
        correctCountRef.current += 1;

        let base = 100;
        if (mode === 'guess') {
          const ratio = timeLeft / timePerQuestion;
          if (ratio > 0.85) base = 500;
          else if (ratio > 0.65) base = 400;
          else if (ratio > 0.45) base = 300;
          else if (ratio > 0.25) base = 200;
          else base = 100;
        }

        const newStreak = streak + 1;
        setStreak(newStreak);

        let bonus = 0;
        if (newStreak >= 5) bonus = 100;
        else if (newStreak >= 3) bonus = 50;

        setScore((prev) => prev + base + bonus);

        if (newStreak >= 10) {
          void userStore.checkAndUnlockBadge('streak_unstoppable');
        } else if (newStreak >= 5) {
          void userStore.checkAndUnlockBadge('streak_fire');
        }

        void userStore.removeYanlisUlke(current.country.cca3);
      } else {
        wrongCountRef.current += 1;
        setStreak(0);
        void userStore.addYanlisUlke(current.country.cca3);
      }
    },
    [isAnswered, quizFinished, questions, currentIndex, mode, streak, timeLeft, timePerQuestion],
  );

  const nextQuestion = useCallback(() => {
    if (!questions.length) return;

    if (currentIndex + 1 >= questions.length) {
      setQuizFinished(true);
      return;
    }

    const nextIndex = currentIndex + 1;
    const nextQ = questions[nextIndex];
    // Sonraki sorunun tipine göre süreyi ayarla
    const nextTime = nextQ ? getTimeForType(nextQ.type) : timePerQuestion;

    setCurrentIndex(nextIndex);
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(nextTime);
  }, [currentIndex, questions, timePerQuestion, getTimeForType]);

  const getResult = useCallback(async (): Promise<QuizResult> => {
    const total = questions.length;
    // ✅ DÜZELTME: ref'ten oku, score'dan hesaplama
    const correctCount = correctCountRef.current;
    const wrongCount = wrongCountRef.current;
    const blank = total - correctCount - wrongCount;
    const accuracy = total > 0 ? (correctCount / total) * 100 : 0;

    const result: QuizResult = {
      score,
      correct: correctCount,
      wrong: wrongCount,
      blank,
      accuracy,
      isNewRecord: false,
      wrongCountries: [],
    };

    await userStore.saveQuizScore({
      id: String(Date.now()),
      date: new Date().toISOString(),
      mode,
      score,
      totalQuestions: total,
      correctCount,
      wrongCount,
      accuracy,
    });

    return result;
  }, [questions.length, score, mode]);

  return {
    questions,
    currentIndex,
    currentQuestion: questions[currentIndex] ?? null,
    score,
    streak,
    selectedOption,
    isAnswered,
    timeLeft,
    quizFinished,
    timePerQuestion,
    selectAnswer,
    nextQuestion,
    getResult,
  };
}
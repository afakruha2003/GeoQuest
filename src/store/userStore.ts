import AsyncStorage from '@react-native-async-storage/async-storage';
import { Badge, DailyCountry, DailyQuizState, QuizScore, StreakData, UserStats } from '../types';

const STORAGE_KEYS = {
  kesfedilenUlkeler: 'kesfedilen_ulkeler',
  favoriUlkeler: 'favori_ulkeler',
  quizSkorlari: 'quiz_skorlari',
  yanlisUlkeler: 'yanlis_ulkeler',
  rozetler: 'rozetler',
  gununUlkesi: 'gunun_ulkesi',
  gunlukQuiz: 'gunluk_quiz',
  streakData: 'streak_data',
} as const;

async function getJsonItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (!value) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function setJsonItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const userStore = {
  async addKesfedilen(code: string): Promise<void> {
    const list = await getJsonItem<string[]>(STORAGE_KEYS.kesfedilenUlkeler, []);
    if (!list.includes(code)) {
      const updated = [...list, code];
      await setJsonItem(STORAGE_KEYS.kesfedilenUlkeler, updated);
      const count = updated.length;
      await this.checkAndUnlockBadge('first_step');
      if (count >= 10) {
        await this.checkAndUnlockBadge('traveler');
      }
      if (count >= 50) {
        await this.checkAndUnlockBadge('explorer');
      }
      if (count >= 100) {
        await this.checkAndUnlockBadge('global_citizen');
      }
    }
  },

  async removeKesfedilen(code: string): Promise<void> {
    const list = await getJsonItem<string[]>(STORAGE_KEYS.kesfedilenUlkeler, []);
    const updated = list.filter((c) => c !== code);
    await setJsonItem(STORAGE_KEYS.kesfedilenUlkeler, updated);
  },

  async addFavori(code: string): Promise<void> {
    const list = await getJsonItem<string[]>(STORAGE_KEYS.favoriUlkeler, []);
    if (!list.includes(code)) {
      const updated = [...list, code];
      await setJsonItem(STORAGE_KEYS.favoriUlkeler, updated);
    }
  },

  async removeFavori(code: string): Promise<void> {
    const list = await getJsonItem<string[]>(STORAGE_KEYS.favoriUlkeler, []);
    const updated = list.filter((c) => c !== code);
    await setJsonItem(STORAGE_KEYS.favoriUlkeler, updated);
  },

  async isFavori(code: string): Promise<boolean> {
    const list = await getJsonItem<string[]>(STORAGE_KEYS.favoriUlkeler, []);
    return list.includes(code);
  },

  async isKesfedilen(code: string): Promise<boolean> {
    const list = await getJsonItem<string[]>(STORAGE_KEYS.kesfedilenUlkeler, []);
    return list.includes(code);
  },

  async saveQuizScore(score: QuizScore): Promise<void> {
    const list = await getJsonItem<QuizScore[]>(STORAGE_KEYS.quizSkorlari, []);
    const updated = [score, ...list].slice(0, 100);
    await setJsonItem(STORAGE_KEYS.quizSkorlari, updated);

    // Rozet kontrolü
    await this.checkAndUnlockBadge('quiz_start');
    if (score.score >= 500) {
      await this.checkAndUnlockBadge('quiz_master');
    }
    if (Math.round(score.accuracy) === 100) {
      await this.checkAndUnlockBadge('perfect');
    }
  },

  async addYanlisUlke(code: string): Promise<void> {
    const list = await getJsonItem<string[]>(STORAGE_KEYS.yanlisUlkeler, []);
    if (!list.includes(code)) {
      const updated = [...list, code];
      await setJsonItem(STORAGE_KEYS.yanlisUlkeler, updated);
    }
  },

  async removeYanlisUlke(code: string): Promise<void> {
    const list = await getJsonItem<string[]>(STORAGE_KEYS.yanlisUlkeler, []);
    const updated = list.filter((c) => c !== code);
    await setJsonItem(STORAGE_KEYS.yanlisUlkeler, updated);
  },

  async checkAndUnlockBadge(badgeId: string): Promise<void> {
    const rozetler = await getJsonItem<Record<string, boolean>>(STORAGE_KEYS.rozetler, {});
    if (!rozetler[badgeId]) {
      rozetler[badgeId] = true;
      await setJsonItem(STORAGE_KEYS.rozetler, rozetler);
    }
  },

  async getBadges(): Promise<Record<string, boolean>> {
    return getJsonItem<Record<string, boolean>>(STORAGE_KEYS.rozetler, {});
  },

  async setDailyCountry(data: DailyCountry): Promise<void> {
    await setJsonItem(STORAGE_KEYS.gununUlkesi, data);
  },

  async getDailyCountry(): Promise<DailyCountry | null> {
    return getJsonItem<DailyCountry | null>(STORAGE_KEYS.gununUlkesi, null);
  },

  async setDailyQuizState(state: DailyQuizState): Promise<void> {
    await setJsonItem(STORAGE_KEYS.gunlukQuiz, state);
  },

  async getDailyQuizState(): Promise<DailyQuizState | null> {
    return getJsonItem<DailyQuizState | null>(STORAGE_KEYS.gunlukQuiz, null);
  },

  async setStreakData(data: StreakData): Promise<void> {
    await setJsonItem(STORAGE_KEYS.streakData, data);
  },

  async getStreakData(): Promise<StreakData | null> {
    return getJsonItem<StreakData | null>(STORAGE_KEYS.streakData, null);
  },

  async getKesfedilenCodes(): Promise<string[]> {
    return getJsonItem<string[]>(STORAGE_KEYS.kesfedilenUlkeler, []);
  },

  async getFavoriCodes(): Promise<string[]> {
    return getJsonItem<string[]>(STORAGE_KEYS.favoriUlkeler, []);
  },

  async getYanlisUlkeler(): Promise<string[]> {
    return getJsonItem<string[]>(STORAGE_KEYS.yanlisUlkeler, []);
  },

  async getQuizScores(): Promise<QuizScore[]> {
    return getJsonItem<QuizScore[]>(STORAGE_KEYS.quizSkorlari, []);
  },

  async getStats(): Promise<UserStats> {
    const kesfedilen = await getJsonItem<string[]>(STORAGE_KEYS.kesfedilenUlkeler, []);
    const favori = await getJsonItem<string[]>(STORAGE_KEYS.favoriUlkeler, []);
    const skorlar = await getJsonItem<QuizScore[]>(STORAGE_KEYS.quizSkorlari, []);
    const streak = await getJsonItem<StreakData | null>(STORAGE_KEYS.streakData, null);

    const totalScore = skorlar.reduce((sum, s) => sum + s.score, 0);
    const bestScore = skorlar.reduce((max, s) => (s.score > max ? s.score : max), 0);
    const totalQuestions = skorlar.reduce((sum, s) => sum + s.totalQuestions, 0);
    const totalCorrect = skorlar.reduce((sum, s) => sum + s.correctCount, 0);
    const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    return {
      kesfedilenCount: kesfedilen.length,
      favoriCount: favori.length,
      totalScore,
      bestScore,
      accuracy,
      longestStreak: streak?.count ?? 0,
      currentStreak: streak?.count ?? 0,
    };
  },

  async clearHistory(): Promise<void> {
    await setJsonItem<QuizScore[]>(STORAGE_KEYS.quizSkorlari, []);
    await setJsonItem<string[]>(STORAGE_KEYS.yanlisUlkeler, []);
  },
};


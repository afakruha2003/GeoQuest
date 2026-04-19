export interface Country {
  name: {
    common: string;
    official: string;
    nativeName?: Record<string, { common: string }>;
  };
  flags: {
    png: string;
    svg: string;
    alt?: string;
  };
  coatOfArms?: {
    png?: string;
    svg?: string;
  };
  capital?: string[];
  population: number;
  area: number;
  region: string;
  subregion?: string;
  continents: string[];
  languages?: Record<string, string>;
  currencies?: Record<string, { name: string; symbol: string }>;
  borders?: string[];
  cca3: string;
  idd?: { root: string; suffixes?: string[] };
  timezones: string[];
  tld?: string[];
  maps?: { googleMaps: string };
  car?: { side: string };
  independent?: boolean;
  latlng?: number[];   // [latitude, longitude]
}

export type QuizMode = 'flag' | 'capital' | 'guess';

export interface QuizQuestion {
  id: string;
  type: QuizMode;
  country: Country;
  options: string[];
  correctAnswer: string;
  hints?: string[];
}

export interface QuizScore {
  id: string;
  date: string;
  mode: QuizMode;
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
}

export interface QuizResult {
  score: number;
  correct: number;
  wrong: number;
  blank: number;
  accuracy: number;
  isNewRecord: boolean;
  wrongCountries: Country[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  condition: string;
  unlocked: boolean;
  unlockedDate?: string;
}

export interface UserStats {
  kesfedilenCount: number;
  favoriCount: number;
  totalScore: number;
  bestScore: number;
  accuracy: number;
  longestStreak: number;
  currentStreak: number;
}

export interface DailyCountry {
  date: string;
  code: string;
}

export interface DailyQuizState {
  date: string;
  completed: boolean;
  score: number;
}

export interface StreakData {
  count: number;
  lastDate: string;
}


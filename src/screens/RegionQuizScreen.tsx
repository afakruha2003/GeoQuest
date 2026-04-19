/**
 * RegionQuizScreen
 *
 * İki farklı yeni quiz modu:
 *  1. "region_color" — Kıta haritasında kırmızı işaretli alan gösterilir, ülke adı sorulur
 *  2. "region_name"  — Ülke adı verilir, hangi kıtada olduğu sorulur
 *
 * Navigation'dan şöyle çağrılır:
 *   navigation.navigate('RegionQuiz', { quizType: 'region_color' })
 *   navigation.navigate('RegionQuiz', { quizType: 'region_name' })
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { colors, radii, spacing, typography } from '../theme';
import { useCountries } from '../hooks/useCountries';
import { userStore } from '../store/userStore';
import { Country } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ProgressBar } from '../components/ProgressBar';
import { Timer } from '../components/Timer';

// ─── Tipler ────────────────────────────────────────────────────────────────

type QuizType = 'region_color' | 'region_name';

type RegionQuizParams = {
  quizType: QuizType;
  questionCount?: number;
};

type RegionQuizRoute = RouteProp<Record<string, RegionQuizParams>, string>;

interface RQQuestion {
  country: Country;
  options: string[];       // 4 şık
  correctAnswer: string;
  type: QuizType;
}

// ─── Kıta renkleri ve Türkçe etiketler ─────────────────────────────────────

const REGION_COLORS: Record<string, string> = {
  Africa:   '#E8834A',
  Europe:   '#5B9BD5',
  Asia:     '#E8C84A',
  Americas: '#6CBE6C',
  Oceania:  '#C46CBE',
  Antarctic:'#9EAEC0',
};

const REGION_LABELS: Record<string, string> = {
  Africa:   'Afrika',
  Europe:   'Avrupa',
  Asia:     'Asya',
  Americas: 'Amerika',
  Oceania:  'Okyanusya',
};

const REGION_EMOJIS: Record<string, string> = {
  Africa:   '🌍',
  Europe:   '🌍',
  Asia:     '🌏',
  Americas: '🌎',
  Oceania:  '🧭',
};

const TIME_PER_QUESTION = 20;
const LETTERS = ['A', 'B', 'C', 'D'];

// ─── Soru üretici ──────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(
  countries: Country[],
  type: QuizType,
  count: number,
): RQQuestion[] {
  const validCountries = countries.filter(
    (c) => c.region && REGION_COLORS[c.region],
  );
  const pool = shuffle(validCountries).slice(0, count);
  const allRegions = Object.keys(REGION_LABELS);

  return pool.map((country) => {
    if (type === 'region_color') {
      // Doğru cevap: ülkenin adı
      // Şıklar: aynı kıtadan 1 + farklı kıtalardan 2 ülke adı
      const sameRegion = validCountries.filter(
        (c) => c.region === country.region && c.cca3 !== country.cca3,
      );
      const diffRegion = validCountries.filter(
        (c) => c.region !== country.region,
      );
      const wrongOptions = [
        ...shuffle(sameRegion).slice(0, 1).map((c) => c.name.common),
        ...shuffle(diffRegion).slice(0, 2).map((c) => c.name.common),
      ];
      const options = shuffle([country.name.common, ...wrongOptions]);
      return {
        country,
        options,
        correctAnswer: country.name.common,
        type,
      };
    } else {
      // region_name: Doğru cevap kıta adı (Türkçe)
      const correctRegion = REGION_LABELS[country.region] ?? country.region;
      const wrongRegions = shuffle(
        allRegions.filter((r) => r !== country.region),
      )
        .slice(0, 3)
        .map((r) => REGION_LABELS[r] ?? r);
      const options = shuffle([correctRegion, ...wrongRegions]);
      return {
        country,
        options,
        correctAnswer: correctRegion,
        type,
      };
    }
  });
}

// ─── Bölge Haritası Göstergesi ─────────────────────────────────────────────
// Basit ama etkili: Her kıta için renk blokları + aktif kıta vurgulanır

interface RegionMapProps {
  highlightRegion: string;    // Kırmızı işaretlenecek kıta
  quizType: QuizType;
  revealed: boolean;          // Cevap verildi mi? region_name'de vurguyu göster
}

const RegionMap: React.FC<RegionMapProps> = ({ highlightRegion, quizType, revealed }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [highlightRegion, pulseAnim]);

  const regions = Object.entries(REGION_LABELS);

  return (
    <View style={mapStyles.container}>
      {/* Harita başlığı */}
      <Text style={mapStyles.title}>
        {quizType === 'region_color'
          ? '🗺️ Kırmızı işaretli bölgedeki ülke hangisi?'
          : '🗺️ Bu ülke hangi kıtada?'}
      </Text>

      {/* Kıta grid gösterimi */}
      <View style={mapStyles.grid}>
        {regions.map(([key, label]) => {
          const isHighlight = key === highlightRegion && (quizType === 'region_color' || revealed);
          const baseColor = REGION_COLORS[key] ?? '#888';

          return (
            <Animated.View
              key={key}
              style={[
                mapStyles.regionBlock,
                {
                  backgroundColor: isHighlight
                    ? colors.danger          // kırmızı işaret
                    : baseColor + '55',      // diğerleri soluk
                  borderColor: isHighlight ? colors.danger : 'transparent',
                  borderWidth: isHighlight ? 2 : 0,
                  transform: isHighlight ? [{ scale: pulseAnim }] : [],
                },
              ]}
            >
              <Text style={mapStyles.regionEmoji}>
                {REGION_EMOJIS[key] ?? '🌐'}
              </Text>
              <Text
                style={[
                  mapStyles.regionLabel,
                  isHighlight && mapStyles.regionLabelHighlight,
                ]}
              >
                {label}
              </Text>
              {isHighlight && (
                <View style={mapStyles.redDot} />
              )}
            </Animated.View>
          );
        })}
      </View>

      {quizType === 'region_color' && (
        <Text style={mapStyles.hint}>
          🔴 Kırmızı kıtadaki ülkeyi şıklardan seç
        </Text>
      )}
    </View>
  );
};

const mapStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  regionBlock: {
    width: '30%',
    borderRadius: radii.large,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    position: 'relative',
  },
  regionEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  regionLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    fontWeight: '600',
    textAlign: 'center',
  },
  regionLabelHighlight: {
    color: '#fff',
    fontWeight: '700',
  },
  redDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

// ─── Ana Ekran ──────────────────────────────────────────────────────────────

const RegionQuizScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RegionQuizRoute>();
  const { quizType, questionCount = 10 } = route.params;

  const { allCountries, loading: countriesLoading } = useCountries();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [finished, setFinished] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackAnim = useRef(new Animated.Value(1)).current;

  const questions = useMemo<RQQuestion[]>(() => {
    if (!allCountries.length) return [];
    return buildQuestions(allCountries, quizType, questionCount);
  }, [allCountries, quizType, questionCount]);

  const currentQuestion = questions[currentIndex] ?? null;

  // Timer
  useEffect(() => {
    if (!currentQuestion || isAnswered || finished) return;

    setTimeLeft(TIME_PER_QUESTION);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Süre doldu — yanlış say
          handleAnswer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const handleAnswer = useCallback(
    (option: string | null) => {
      if (isAnswered || !currentQuestion) return;
      if (timerRef.current) clearInterval(timerRef.current);

      setSelectedOption(option);
      setIsAnswered(true);

      const isCorrect = option === currentQuestion.correctAnswer;

      if (isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        const bonus = newStreak >= 5 ? 100 : newStreak >= 3 ? 50 : 0;
        setScore((s) => s + 100 + bonus);
        setCorrect((c) => c + 1);
      } else {
        setStreak(0);
        setWrong((w) => w + 1);
        // Yanlış ülkeyi kaydet
        void userStore.addYanlisUlke(currentQuestion.country.cca3).catch(() => undefined);
      }

      // Feedback animasyonu
      Animated.sequence([
        Animated.timing(feedbackAnim, {
          toValue: 0.95,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(feedbackAnim, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start();

      // 1.2sn sonra sonraki soruya geç
      setTimeout(() => {
        if (currentIndex + 1 >= questions.length) {
          setFinished(true);
        } else {
          setCurrentIndex((i) => i + 1);
          setSelectedOption(null);
          setIsAnswered(false);
        }
      }, 1200);
    },
    [isAnswered, currentQuestion, streak, currentIndex, questions.length, feedbackAnim],
  );

  useEffect(() => {
    if (!finished) return;
    const blank = questionCount - correct - wrong;
    const accuracy = questionCount > 0 ? (correct / questionCount) * 100 : 0;
    const result = {
      score,
      correct,
      wrong,
      blank,
      accuracy,
      isNewRecord: false,
      wrongCountries: [],
    };
    // Quiz sonuç ekranına git
    navigation.replace('QuizResult', { result, mode: quizType });
  }, [finished, score, correct, wrong, questionCount, accuracy, navigation, quizType]);

  const handleExit = () => {
    Alert.alert(
      'Quizden Çık',
      'Quizden çıkmak istediğine emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çık',
          style: 'destructive',
          onPress: () => navigation.navigate('QuizStack', { screen: 'QuizMenu' }),
        },
      ],
    );
  };

  if (countriesLoading || !questions.length || !currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner fullscreen />
      </SafeAreaView>
    );
  }

  const progress = (currentIndex + 1) / questions.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Üst bar */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.topLabel}>
            Soru {currentIndex + 1}/{questions.length}
          </Text>
          <ProgressBar progress={progress} />
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Skor</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <View style={styles.topRight}>
          <Timer total={TIME_PER_QUESTION} timeLeft={timeLeft} />
          <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
            <Text style={styles.exitText}>Çık</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Kıta haritası */}
        <RegionMap
          highlightRegion={currentQuestion.country.region}
          quizType={quizType}
          revealed={isAnswered}
        />

        {/* Ülke bayrağı (region_name modunda göster) */}
        {quizType === 'region_name' && (
          <Animated.View
            style={[styles.flagCard, { transform: [{ scale: feedbackAnim }] }]}
          >
            <Image
              source={{ uri: currentQuestion.country.flags.png }}
              style={styles.flagImage}
              contentFit="cover"
            />
            <Text style={styles.countryNameLabel}>
              {currentQuestion.country.name.common}
            </Text>
          </Animated.View>
        )}

        {/* Şıklar */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            let bgColor: string = colors.surface;
            let borderColor: string = colors.border;
            let textColor: string = colors.text;

            if (isAnswered) {
              if (option === currentQuestion.correctAnswer) {
                bgColor = colors.success;
                borderColor = colors.success;
                textColor = colors.background;
              } else if (option === selectedOption) {
                bgColor = colors.danger;
                borderColor = colors.danger;
                textColor = colors.background;
              } else {
                bgColor = colors.surface;
                borderColor = colors.border;
                textColor = colors.textSecondary;
              }
            }

            return (
              <TouchableOpacity
                key={option}
                activeOpacity={0.85}
                style={[
                  styles.optionButton,
                  { backgroundColor: bgColor, borderColor },
                ]}
                onPress={() => handleAnswer(option)}
                disabled={isAnswered}
              >
                <View style={styles.optionLabelBox}>
                  <Text style={styles.optionLetter}>{LETTERS[index]}</Text>
                </View>
                <Text style={[styles.optionText, { color: textColor }]}>
                  {option}
                </Text>
                {isAnswered && option === currentQuestion.correctAnswer && (
                  <Text style={styles.optionIcon}>✓</Text>
                )}
                {isAnswered &&
                  option === selectedOption &&
                  option !== currentQuestion.correctAnswer && (
                    <Text style={styles.optionIcon}>✗</Text>
                  )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Streak banner */}
        {streak >= 3 && !finished && (
          <View style={styles.streakBanner}>
            <Text style={styles.streakText}>
              {streak >= 5 ? '⚡ Durulamazsın!' : '🔥 Streak!'} {streak} doğru üst üste
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Accuracy hesabı için kullanılmıyor ama QuizResult'a gönderilmek için tanımlandı
const accuracy = 0;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  topRight: {
    alignItems: 'center',
  },
  topLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    marginBottom: spacing.xs,
  },
  scoreBox: {
    marginHorizontal: spacing.md,
    alignItems: 'center',
  },
  scoreLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    marginBottom: 2,
  },
  scoreValue: {
    color: colors.accent,
    fontSize: typography.fontSizeLG,
    fontWeight: '700',
  },
  exitButton: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
    backgroundColor: '#1B2737',
  },
  exitText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 80,
  },
  flagCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  flagImage: {
    width: '100%',
    height: 160,
  },
  countryNameLabel: {
    color: colors.text,
    fontSize: typography.fontSizeXL,
    fontWeight: '700',
    padding: spacing.md,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.large,
    borderWidth: 1,
  },
  optionLabelBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#12253A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  optionLetter: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    fontWeight: '700',
  },
  optionText: {
    flex: 1,
    fontSize: typography.fontSizeMD,
    fontWeight: '500',
  },
  optionIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: spacing.sm,
  },
  streakBanner: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.large,
    backgroundColor: '#1C2A3D',
    alignItems: 'center',
  },
  streakText: {
    color: colors.accent,
    fontSize: typography.fontSizeSM,
    fontWeight: '600',
  },
});

export default RegionQuizScreen;
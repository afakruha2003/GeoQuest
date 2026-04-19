import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { useCountries } from '../hooks/useCountries';
import { useQuiz } from '../hooks/useQuiz';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ProgressBar } from '../components/ProgressBar';
import { Timer } from '../components/Timer';
import { QuizOption } from '../components/QuizOption';
import { QuizQuestion } from '../types';
import { userStore } from '../store/userStore';

type QuizParams = {
  mode: 'flag' | 'capital' | 'guess';
  difficulty?: 'easy' | 'medium' | 'hard';
  region?: string;
  countryCode?: string;
  reviewWrong?: boolean;
};

type QuizRoute = RouteProp<Record<string, QuizParams>, string>;

const letters = ['A', 'B', 'C', 'D'];

// Guess modunda her ipucunun kaç saniye sonra açılacağı
// Toplam süre timePerQuestion saniye, ipuçları eşit aralıklı açılır
// Sıra: kıta, nüfus, bölge, dil, para birimi, bayrak (en son)
const HINT_INTERVAL_SECONDS = 6; // Her ipucu arasındaki süre

const QuizScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<QuizRoute>();

  const { mode, difficulty, region, countryCode, reviewWrong } = route.params ?? {
    mode: 'flag' as const,
  };

  const { allCountries, loading: countriesLoading } = useCountries();

  const [wrongCodesLoaded, setWrongCodesLoaded] = React.useState<boolean>(false);
  const [wrongCodes, setWrongCodes] = React.useState<string[]>([]);

  // Guess modu için kaç ipucu gösterildiğini takip eden state
  // Bu timeLeft'e bağlı değil, kendi interval'ına göre artıyor
  const [revealedHintCount, setRevealedHintCount] = useState<number>(0);
  const [showFlag, setShowFlag] = useState<boolean>(false);
  const hintTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flagAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadWrong = async () => {
      if (reviewWrong) {
        const codes = await userStore.getYanlisUlkeler();
        setWrongCodes(codes);
      }
      setWrongCodesLoaded(true);
    };

    void loadWrong();
  }, [reviewWrong]);

  const {
    questions,
    currentIndex,
    currentQuestion,
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
  } = useQuiz({
    mode,
    difficulty,
    region,
    countryCode,
    countries: allCountries,
    reviewWrong,
    wrongCountryCodes: wrongCodes,
  });

  // Guess modunda her soru değiştiğinde ipucu sayacını sıfırla ve yeniden başlat
  useEffect(() => {
    if (currentQuestion?.type !== 'guess') return;

    // Sıfırla
    setRevealedHintCount(0);
    setShowFlag(false);
    flagAnim.setValue(0);

    // Interval temizle
    if (hintTimerRef.current) {
      clearInterval(hintTimerRef.current);
    }

    const hints = currentQuestion.hints ?? [];
    const totalSteps = hints.length + 1; // +1 bayrak için

    let step = 0;

    hintTimerRef.current = setInterval(() => {
      step += 1;

      if (step <= hints.length) {
        // Yeni ipucu aç
        setRevealedHintCount(step);
      } else if (step === totalSteps) {
        // Tüm ipuçları bitti, bayrağı göster
        setShowFlag(true);
        Animated.spring(flagAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }).start();
        if (hintTimerRef.current) {
          clearInterval(hintTimerRef.current);
        }
      }
    }, HINT_INTERVAL_SECONDS * 1000);

    return () => {
      if (hintTimerRef.current) {
        clearInterval(hintTimerRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, mode]);

  // Cevap verildiğinde veya süre bittiğinde bayrağı hemen göster
  useEffect(() => {
    if ((isAnswered || timeLeft === 0) && currentQuestion?.type === 'guess') {
      if (hintTimerRef.current) {
        clearInterval(hintTimerRef.current);
      }
      setShowFlag(true);
      if (!showFlag) {
        Animated.spring(flagAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }).start();
      }
    }
  }, [isAnswered, timeLeft, mode, showFlag, flagAnim]);

  useEffect(() => {
    if (!quizFinished) return;

    const handleFinish = async () => {
      const result = await getResult();
      navigation.replace('QuizResult', { result, mode });
    };

    void handleFinish();
  }, [getResult, mode, navigation, quizFinished]);

  useEffect(() => {
    if (!isAnswered || quizFinished) return;

    const timeout = setTimeout(() => {
      nextQuestion();
    }, 800);

    return () => clearTimeout(timeout);
  }, [isAnswered, nextQuestion, quizFinished]);

  if (countriesLoading || !wrongCodesLoaded || !questions.length || !currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner fullscreen />
      </SafeAreaView>
    );
  }

  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (currentIndex + 1) / totalQuestions : 0;
  const hints = currentQuestion.hints ?? [];

  const renderPrompt = (question: QuizQuestion) => {
    if (question.type === 'flag') {
      return (
        <View style={styles.promptCard}>
          <Text style={styles.promptTitle}>Bu bayrak hangi ülkeye ait?</Text>
          <Image
            source={{ uri: question.country.flags.png }}
            style={styles.flag}
            contentFit="cover"
          />
        </View>
      );
    }

    if (question.type === 'capital') {
      return (
        <View style={styles.promptCard}>
          <Text style={styles.promptTitle}>Bu ülkenin başkenti nedir?</Text>
          <Text style={styles.bigCountryName}>{question.country.name.common}</Text>
        </View>
      );
    }

    // GUESS MODU
    const currentHints = hints.slice(0, revealedHintCount);

    return (
      <View style={styles.promptCard}>
        <View style={styles.guessHeader}>
          <Text style={styles.promptTitle}>🔍 İpuçlarına göre ülkeyi tahmin et</Text>
          <View style={styles.hintCountBadge}>
            <Text style={styles.hintCountText}>
              {revealedHintCount}/{hints.length} ipucu
            </Text>
          </View>
        </View>

        {/* İpuçları */}
        {currentHints.length === 0 ? (
          <View style={styles.waitingHint}>
            <Text style={styles.waitingText}>⏳ İlk ipucu geliyor...</Text>
          </View>
        ) : (
          currentHints.map((hint, index) => (
            <Animated.View
              key={`hint-${index}`}
              style={[
                styles.hintRow,
                index === currentHints.length - 1 && styles.hintRowNew,
              ]}
            >
              <Text style={styles.hintIndex}>{index + 1}</Text>
              <Text style={styles.hintText}>{hint}</Text>
            </Animated.View>
          ))
        )}

        {/* Sonraki ipucu ne zaman */}
        {!showFlag && !isAnswered && revealedHintCount < hints.length && (
          <Text style={styles.nextHintLabel}>
            🕐 Sonraki ipucu {HINT_INTERVAL_SECONDS}sn sonra
          </Text>
        )}

        {/* Bayrak en son açılır */}
        {showFlag && (
          <Animated.View
            style={[
              styles.flagRevealWrapper,
              {
                opacity: flagAnim,
                transform: [
                  {
                    scale: flagAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.flagRevealLabel}>🚩 Bayrak açıklandı!</Text>
            <Image
              source={{ uri: question.country.flags.png }}
              style={styles.guessFlag}
              contentFit="contain"
            />
          </Animated.View>
        )}
      </View>
    );
  };

  const correctAnswer = currentQuestion.correctAnswer;

  const handleExitQuiz = () => {
    Alert.alert(
      'Quizden Çık',
      'Quizden çıkmak istediğine emin misin? İlerleme kaydedilmeyecek.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, çık',
          style: 'destructive',
          onPress: () => {
            if (hintTimerRef.current) clearInterval(hintTimerRef.current);
            navigation.navigate('QuizStack', { screen: 'QuizMenu' });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.topLabel}>
            Soru {currentIndex + 1}/{totalQuestions}
          </Text>
          <ProgressBar progress={progress} />
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Skor</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <View style={styles.topRight}>
          <Timer
              total={
                currentQuestion.type === 'guess' ? 30
                : currentQuestion.type === 'capital' ? 20
                : 15
              }
              timeLeft={timeLeft}
            />
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.exitButton}
            onPress={handleExitQuiz}
          >
            <Text style={styles.exitText}>Çık</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {renderPrompt(currentQuestion)}

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            let state: 'default' | 'correct' | 'wrong' | 'disabled' = 'default';

            if (isAnswered) {
              if (option === correctAnswer) {
                state = 'correct';
              } else if (option === selectedOption) {
                state = 'wrong';
              } else {
                state = 'disabled';
              }
            }

            return (
              <QuizOption
                key={option}
                label={letters[index] ?? '?'}
                text={option}
                state={state}
                onPress={() => selectAnswer(option)}
              />
            );
          })}
        </View>

        {streak >= 3 && !quizFinished && (
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topRight: {
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
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
    paddingBottom: spacing.huge,
  },
  promptCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  promptTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    marginBottom: spacing.sm,
  },
  flag: {
    width: '100%',
    height: 180,
    borderRadius: radii.large,
    backgroundColor: '#0B1828',
  },
  // GUESS MODU STİLLERİ
  guessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  hintCountBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.round,
    backgroundColor: '#0F2237',
  },
  hintCountText: {
    color: colors.primary,
    fontSize: typography.fontSizeXS,
    fontWeight: '600',
  },
  waitingHint: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  waitingText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0F2237',
    borderRadius: radii.medium,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  hintRowNew: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
  hintIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    color: colors.background,
    fontSize: typography.fontSizeXS,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  hintText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.fontSizeMD,
    lineHeight: 22,
  },
  nextHintLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  flagRevealWrapper: {
    marginTop: spacing.md,
  },
  flagRevealLabel: {
    color: colors.primary,
    fontSize: typography.fontSizeSM,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  guessFlag: {
    width: '100%',
    height: 160,
    borderRadius: radii.large,
    backgroundColor: '#0B1828',
  },
  // DİĞER
  bigCountryName: {
    color: colors.text,
    fontSize: typography.fontSizeXXL,
    fontWeight: '700',
  },
  optionsContainer: {
    marginTop: spacing.md,
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

export default QuizScreen;
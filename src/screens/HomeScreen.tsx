import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { colors, spacing, typography } from '../theme';
import { useCountries } from '../hooks/useCountries';
import { userStore } from '../store/userStore';
import { Badge, Country, DailyCountry, DailyQuizState, UserStats } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatCard } from '../components/StatCard';
import { BadgeCard } from '../components/BadgeCard';
import { ProgressBar } from '../components/ProgressBar';

type ContinentKey = 'Africa' | 'Europe' | 'Asia' | 'Americas' | 'Oceania';

const CONTINENT_LABELS: Record<ContinentKey, { title: string; emoji: string }> = {
  Africa: { title: 'Afrika', emoji: '🌍' },
  Europe: { title: 'Avrupa', emoji: '🇪🇺' },
  Asia: { title: 'Asya', emoji: '🌏' },
  Americas: { title: 'Amerika', emoji: '🌎' },
  Oceania: { title: 'Okyanusya', emoji: '🏝️' },
};

const ALL_BADGES: Badge[] = [
  { id: 'first_step', name: 'İlk Adım', description: 'İlk ülkeni keşfet.', emoji: '🌱', condition: 'İlk ülkeyi keşfet', unlocked: false },
  { id: 'traveler', name: 'Gezgin', description: '10 ülke keşfet.', emoji: '🌍', condition: '10 ülke keşfet', unlocked: false },
  { id: 'explorer', name: 'Kaşif', description: '50 ülke keşfet.', emoji: '🗺️', condition: '50 ülke keşfet', unlocked: false },
  { id: 'global_citizen', name: 'Dünya Vatandaşı', description: '100 ülke keşfet.', emoji: '🌐', condition: '100 ülke keşfet', unlocked: false },
  { id: 'quiz_start', name: 'Quiz Başlangıcı', description: 'İlk quizi tamamla.', emoji: '🧠', condition: 'İlk quizi tamamla', unlocked: false },
  { id: 'quiz_master', name: 'Quiz Ustası', description: 'Quizde 500+ puan kazan.', emoji: '🏆', condition: 'Quizde 500 puan kazan', unlocked: false },
  { id: 'streak_fire', name: 'Ateş', description: '5 doğru üst üste yap.', emoji: '🔥', condition: '5 doğru üst üste yap', unlocked: false },
  { id: 'streak_unstoppable', name: 'Durulamaz', description: '10 doğru üst üste yap.', emoji: '⚡', condition: '10 doğru üst üste yap', unlocked: false },
  { id: 'africa_explorer', name: 'Afrika Kaşifi', description: 'Afrika\'nın tüm ülkelerini keşfet.', emoji: '🌍', condition: 'Afrika\'daki tüm ülkeleri keşfet', unlocked: false },
  { id: 'europe_explorer', name: 'Avrupa Kaşifi', description: 'Avrupa\'nın tüm ülkelerini keşfet.', emoji: '🇪🇺', condition: 'Avrupa\'daki tüm ülkeleri keşfet', unlocked: false },
  { id: 'perfect', name: 'Mükemmel', description: '%100 doğrulukla quiz bitir.', emoji: '💯', condition: 'Quizde %100 doğruluk oranı yakala', unlocked: false },
  { id: 'persistent', name: 'Azimli', description: '7 gün üst üste quiz çöz.', emoji: '📅', condition: '7 gün üst üste quiz çöz', unlocked: false },
];

function formatShortNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

const TOTAL_COUNTRIES = 195;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { allCountries, loading: countriesLoading } = useCountries();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [dailyCountry, setDailyCountry] = useState<DailyCountry | null>(null);
  const [dailyQuiz, setDailyQuiz] = useState<DailyQuizState | null>(null);
  const [badgeState, setBadgeState] = useState<Record<string, boolean>>({});
  const [kesfedilenCodes, setKesfedilenCodes] = useState<string[]>([]);
  const [loadingUserData, setLoadingUserData] = useState<boolean>(true);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const loadUserData = async () => {
        try {
          setLoadingUserData(true);
          const [loadedStats, loadedDailyCountry, loadedDailyQuiz, loadedBadges, discovered] =
            await Promise.all([
              userStore.getStats(),
              userStore.getDailyCountry(),
              userStore.getDailyQuizState(),
              userStore.getBadges(),
              userStore.getKesfedilenCodes(),
            ]);

          if (!isActive) return;

          setStats(loadedStats);
          setDailyCountry(loadedDailyCountry);
          setDailyQuiz(loadedDailyQuiz);
          setBadgeState(loadedBadges);
          setKesfedilenCodes(discovered);
        } finally {
          if (isActive) {
            setLoadingUserData(false);
          }
        }
      };

      void loadUserData();

      return () => {
        isActive = false;
      };
    }, []),
  );

  useEffect(() => {
    if (!allCountries.length) return;

    const ensureDailyCountry = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const existing = await userStore.getDailyCountry();

      if (existing && existing.date === today) {
        setDailyCountry(existing);
        return;
      }

      const random = allCountries[Math.floor(Math.random() * allCountries.length)];
      const next: DailyCountry = { date: today, code: random.cca3 };
      await userStore.setDailyCountry(next);
      setDailyCountry(next);
    };

    void ensureDailyCountry();
  }, [allCountries]);

  const dailyCountryData: Country | undefined = useMemo(() => {
    if (!dailyCountry || !allCountries.length) return undefined;
    return allCountries.find((c) => c.cca3 === dailyCountry.code);
  }, [allCountries, dailyCountry]);

  const continentStats = useMemo(() => {
    const result: {
      key: ContinentKey;
      total: number;
      discovered: number;
    }[] = [];

    (Object.keys(CONTINENT_LABELS) as ContinentKey[]).forEach((key) => {
      const countriesInContinent = allCountries.filter((c) => c.region === key);
      const total = countriesInContinent.length;
      const discovered = countriesInContinent.filter((c) => kesfedilenCodes.includes(c.cca3)).length;
      result.push({ key, total, discovered });
    });

    return result;
  }, [allCountries, kesfedilenCodes]);

  const unlockedBadges = useMemo(
    () => ALL_BADGES.filter((b) => badgeState[b.id]),
    [badgeState],
  );

  const recentBadges = useMemo(
    () => unlockedBadges.slice(-3).reverse(),
    [unlockedBadges],
  );

  const totalDiscovered = stats?.kesfedilenCount ?? 0;
  const totalQuizScore = stats?.totalScore ?? 0;

  const loading = countriesLoading || loadingUserData;

  const handleOpenDailyCountry = () => {
    if (!dailyCountry) return;
    navigation.navigate('HomeStack', {
      screen: 'CountryDetail',
      params: { code: dailyCountry.code },
    });
  };

  const handleOpenDailyQuiz = () => {
    navigation.navigate('QuizStack', {
      screen: 'Quiz',
      params: { mode: 'flag', difficulty: 'easy' },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <LoadingSpinner fullscreen />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>GeoQuest 🌍</Text>
              <Text style={styles.subtitle}>Dünyayı Keşfet, Kendini Test Et</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatCard
              label="Keşfedilen Ülke"
              value={`${totalDiscovered}/${TOTAL_COUNTRIES}`}
              subtitle="Dünyayı adım adım keşfet"
            />
            <StatCard
              label="Toplam Quiz Puanı"
              value={formatShortNumber(totalQuizScore)}
              subtitle="Bilgini güçlendir"
            />
          </View>

          {dailyCountryData && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌟 Günün Ülkesi</Text>
              <TouchableOpacity activeOpacity={0.9} style={styles.dailyCard} onPress={handleOpenDailyCountry}>
                <Image source={{ uri: dailyCountryData.flags.png }} style={styles.dailyFlag} contentFit="cover" />
                <View style={styles.dailyInfo}>
                  <Text style={styles.dailyName}>{dailyCountryData.name.common}</Text>
                  <Text style={styles.dailyMeta}>
                    Başkent: {dailyCountryData.capital?.[0] ?? 'Bilinmiyor'} • Nüfus:{' '}
                    {formatShortNumber(dailyCountryData.population)}
                  </Text>
                  <Text style={styles.dailyMeta}>
                    Kıta: {dailyCountryData.region} • Bölge: {dailyCountryData.subregion ?? '-'}
                  </Text>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleOpenDailyCountry}>
                    <Text style={styles.primaryButtonText}>Keşfet</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🧠 Günlük Quiz</Text>
            <TouchableOpacity activeOpacity={0.9} style={styles.quizCard} onPress={handleOpenDailyQuiz}>
              <View style={{ flex: 1 }}>
                <Text style={styles.quizTitle}>Bugünün 10 Soruluk Quizi</Text>
                <Text style={styles.quizSubtitle}>
                  Bayraklardan başkentlere, bugünkü bilgini test et.
                </Text>
                {dailyQuiz?.completed && (
                  <Text style={styles.quizStatus}>
                    Tamamlandı • Skor: {dailyQuiz.score}
                  </Text>
                )}
              </View>
              <View style={styles.quizPill}>
                <Text style={styles.quizPillText}>{dailyQuiz?.completed ? 'Tekrar Çöz' : 'Başla'}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌍 Kıtalar</Text>
            {continentStats.map(({ key, total, discovered }) => {
              const meta = CONTINENT_LABELS[key];
              const progress = total > 0 ? discovered / total : 0;

              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.8}
                  style={styles.continentCard}
                  onPress={() =>
                    navigation.navigate('ExploreStack', {
                      screen: 'Explore',
                      params: { region: key },
                    })
                  }
                >
                  <View style={styles.continentHeader}>
                    <Text style={styles.continentEmoji}>{meta.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.continentTitle}>{meta.title}</Text>
                      <Text style={styles.continentSubtitle}>
                        {discovered}/{total} ülke keşfedildi
                      </Text>
                    </View>
                    <Text style={styles.continentPercent}>{Math.round(progress * 100)}%</Text>
                  </View>
                  <View style={styles.progressWrapper}>
                    <ProgressBar progress={progress} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Son Kazanılan Rozetler</Text>
            {recentBadges.length === 0 ? (
              <Text style={styles.emptyText}>Henüz rozet kazanmadın. Hadi keşfetmeye ve quiz çözmeye başla!</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.badgeScroll}
              >
                {recentBadges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} unlocked />
                ))}
              </ScrollView>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: typography.fontSizeHero,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeMD,
    marginTop: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.fontSizeLG,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  dailyCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  dailyFlag: {
    width: 120,
    height: '100%',
  },
  dailyInfo: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  dailyName: {
    color: colors.text,
    fontSize: typography.fontSizeXL,
    fontWeight: '700',
  },
  dailyMeta: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    marginTop: spacing.xs,
  },
  primaryButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: typography.fontSizeSM,
    fontWeight: '600',
  },
  quizCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  quizTitle: {
    color: colors.text,
    fontSize: typography.fontSizeLG,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  quizSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
  },
  quizStatus: {
    color: colors.accent,
    fontSize: typography.fontSizeSM,
    marginTop: spacing.sm,
  },
  quizPill: {
    marginLeft: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: '#12253A',
  },
  quizPillText: {
    color: colors.text,
    fontSize: typography.fontSizeSM,
    fontWeight: '600',
  },
  continentCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  continentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  continentEmoji: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  continentTitle: {
    color: colors.text,
    fontSize: typography.fontSizeMD,
    fontWeight: '600',
  },
  continentSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    marginTop: spacing.xs,
  },
  continentPercent: {
    color: colors.accent,
    fontSize: typography.fontSizeMD,
    fontWeight: '700',
  },
  progressWrapper: {
    marginTop: spacing.sm,
  },
  badgeScroll: {
    paddingRight: spacing.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
  },
});

export default HomeScreen;


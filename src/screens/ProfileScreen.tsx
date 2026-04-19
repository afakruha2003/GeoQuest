import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, radii, spacing, typography } from '../theme';
import { userStore } from '../store/userStore';
import { Badge, Country, QuizScore, UserStats } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { BadgeCard } from '../components/BadgeCard';
import { StatCard } from '../components/StatCard';
import { useCountries } from '../hooks/useCountries';
import { CountryCardSmall } from '../components/CountryCardSmall';

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

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<Record<string, boolean>>({});
  const [scores, setScores] = useState<QuizScore[]>([]);
  const [favoriteCodes, setFavoriteCodes] = useState<string[]>([]);

  const { allCountries } = useCountries();

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const loadProfileData = async () => {
        try {
          setLoading(true);
          const [loadedStats, loadedBadges, storedScores, favCodes] = await Promise.all([
            userStore.getStats(),
            userStore.getBadges(),
            userStore.getQuizScores(),
            userStore.getFavoriCodes(),
          ]);

          if (!isActive) return;

          setStats(loadedStats);
          setBadges(loadedBadges);
          setScores(storedScores.slice(0, 10));
          setFavoriteCodes(favCodes);
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      void loadProfileData();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const mergedBadges = useMemo(
    () =>
      ALL_BADGES.map((badge) => ({
        ...badge,
        unlocked: Boolean(badges[badge.id]),
      })),
    [badges],
  );

  const favoriteCountries: Country[] = useMemo(() => {
    if (!favoriteCodes.length || !allCountries.length) return [];
    return favoriteCodes
      .map((code) => allCountries.find((c) => c.cca3 === code))
      .filter((c): c is Country => Boolean(c));
  }, [allCountries, favoriteCodes]);

  const handleClearHistory = () => {
    Alert.alert(
      'Geçmişi Temizle',
      'Tüm quiz geçmişini silmek istediğine emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, sil',
          style: 'destructive',
          onPress: async () => {
            await userStore.clearHistory();
            setScores([]);
          },
        },
      ],
    );
  };

  const handleBadgePress = (badge: Badge) => {
    Alert.alert(
      `${badge.emoji} ${badge.name}`,
      `${badge.description}\n\nKoşul: ${badge.condition}`,
      [{ text: 'Tamam', style: 'default' }],
    );
  };

  if (loading || !stats) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner fullscreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
          <Text style={styles.subtitle}>İlerlemene, rozetlerine ve quiz performansına göz at.</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              label="Keşfedilen Ülke"
              value={String(stats.kesfedilenCount)}
              subtitle="Dünyayı geziyorsun"
            />
            <StatCard
              label="Toplam Quiz Puanı"
              value={formatShortNumber(stats.totalScore)}
              subtitle="Bilgi gücün"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              label="Doğruluk"
              value={`${Math.round(stats.accuracy)}%`}
              subtitle="Cevap isabetin"
            />
            <StatCard
              label="En Uzun Streak"
              value={`${stats.longestStreak}`}
              subtitle="Üst üste doğru"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ Favori Ülkeler</Text>
          {favoriteCountries.length === 0 ? (
            <Text style={styles.emptyText}>
              Henüz favori ülke eklemedin. Ülke detay ekranından kalp ikonuna dokunarak ekleyebilirsin.
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.favoritesScroll}
            >
              {favoriteCountries.map((country) => (
                <View key={country.cca3} style={styles.favoriteItem}>
                  <CountryCardSmall
                    country={country}
                    onPress={() =>
                      navigation.navigate('HomeStack', {
                        screen: 'CountryDetail',
                        params: { code: country.cca3 },
                      })
                    }
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏅 Rozetler</Text>
          <View style={styles.badgeGrid}>
            {mergedBadges.map((badge) => (
              <View key={badge.id} style={styles.badgeWrapper}>
                <BadgeCard
                  badge={badge}
                  unlocked={badge.unlocked}
                  onPress={() => handleBadgePress(badge)}
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>🧠 Son 10 Quiz</Text>
            {scores.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleClearHistory}
              >
                <Text style={styles.clearText}>Tüm geçmişi temizle</Text>
              </TouchableOpacity>
            )}
          </View>

          {scores.length === 0 ? (
            <Text style={styles.emptyText}>
              Henüz quiz geçmişin yok. Quiz modlarından birini deneyerek başlayabilirsin.
            </Text>
          ) : (
            <View style={styles.card}>
              {scores.map((score) => (
                <View key={score.id} style={styles.scoreRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scoreTitle}>
                      {modeLabel(score.mode)} • {formatDate(score.date)}
                    </Text>
                    <Text style={styles.scoreSubtitle}>
                      Skor: {score.score} • Doğruluk: {Math.round(score.accuracy)}%
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.playAgainButton}
                    onPress={() =>
                      navigation.navigate('QuizStack', {
                        screen: 'Quiz',
                        params: { mode: score.mode },
                      })
                    }
                  >
                    <Text style={styles.playAgainText}>Tekrar</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

function formatShortNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}.${date.getFullYear()}`;
}

function modeLabel(mode: QuizScore['mode']): string {
  switch (mode) {
    case 'flag':
      return 'Bayrağı Bul';
    case 'capital':
      return 'Başkenti Bul';
    case 'guess':
      return 'Ülkeyi Tahmin Et';
    default:
      return mode;
  }
}

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
    fontSize: typography.fontSizeXL,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeMD,
    marginTop: spacing.sm,
  },
  statsGrid: {
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.fontSizeLG,
    fontWeight: '600',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
  },
  badgeWrapper: {
    width: '50%',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.large,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  scoreTitle: {
    color: colors.text,
    fontSize: typography.fontSizeSM,
    fontWeight: '600',
  },
  scoreSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    marginTop: 2,
  },
  playAgainButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.card,
  },
  playAgainText: {
    color: colors.primary,
    fontSize: typography.fontSizeXS,
    fontWeight: '600',
  },
  clearText: {
    color: colors.danger,
    fontSize: typography.fontSizeXS,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
  },
  favoritesScroll: {
    paddingRight: spacing.lg,
  },
  favoriteItem: {
    marginRight: spacing.md,
  },
});

export default ProfileScreen;


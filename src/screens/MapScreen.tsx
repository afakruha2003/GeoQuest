import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, radii, spacing, typography } from '../theme';
import { useCountries } from '../hooks/useCountries';
import { userStore } from '../store/userStore';
import { LoadingSpinner } from '../components/LoadingSpinner';

type RegionKey = 'Africa' | 'Europe' | 'Asia' | 'Americas' | 'Oceania';

const CONTINENTS: { key: RegionKey; label: string; emoji: string }[] = [
  { key: 'Africa', label: 'Afrika', emoji: '🌍' },
  { key: 'Europe', label: 'Avrupa', emoji: '🇪🇺' },
  { key: 'Asia', label: 'Asya', emoji: '🌏' },
  { key: 'Americas', label: 'Amerika', emoji: '🌎' },
  { key: 'Oceania', label: 'Okyanusya', emoji: '🧭' },
];

const TOTAL_COUNTRIES_TARGET = 195;

const MapScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { allCountries, loading, error } = useCountries();

  const [kesfedilenCodes, setKesfedilenCodes] = useState<string[]>([]);
  const [globalPercent, setGlobalPercent] = useState<number>(0);
  const [bestContinent, setBestContinent] = useState<string | null>(null);

  const circleAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const loadData = async () => {
        const discovered = await userStore.getKesfedilenCodes();
        if (isActive) {
          setKesfedilenCodes(discovered);
        }
      };

      void loadData();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const continentStats = useMemo(() => {
    if (!allCountries.length) {
      return CONTINENTS.map((c) => ({
        ...c,
        total: 0,
        discovered: 0,
        percent: 0,
      }));
    }

    return CONTINENTS.map((c) => {
      const inContinent = allCountries.filter((country) => country.region === c.key);
      const total = inContinent.length;
      const discovered = inContinent.filter((country) =>
        kesfedilenCodes.includes(country.cca3),
      ).length;
      const percent = total > 0 ? (discovered / total) * 100 : 0;

      return {
        ...c,
        total,
        discovered,
        percent,
      };
    });
  }, [allCountries, kesfedilenCodes]);

  useEffect(() => {
    const totalDiscovered = kesfedilenCodes.length;
    const total = allCountries.length || TOTAL_COUNTRIES_TARGET;
    const percent = total > 0 ? (totalDiscovered / total) * 100 : 0;
    setGlobalPercent(percent);

    Animated.timing(circleAnim, {
      toValue: percent,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [allCountries.length, kesfedilenCodes.length, circleAnim]);

  useEffect(() => {
    if (!continentStats.length) return;
    const sorted = [...continentStats].sort((a, b) => b.percent - a.percent);
    if (sorted[0].percent > 0) {
      setBestContinent(sorted[0].label);
    } else {
      setBestContinent(null);
    }
  }, [continentStats]);

  const handlePressContinent = (region: RegionKey) => {
    navigation.navigate('ExploreFromMap', { region });
  };

  const totalDiscovered = kesfedilenCodes.length;
  const remainingForGoal = Math.max(0, 5 - (totalDiscovered % 5));

  const circleInterpolated = circleAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0deg', '360deg'],
  });

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>İlerleme Haritası</Text>
      <Text style={styles.subtitle}>Kıtaları keşfet, dünya turunu tamamla.</Text>
    </View>
  );

  const renderGlobalProgress = () => (
    <View style={styles.globalSection}>
      <View style={styles.globalLeft}>
        <View style={styles.circleWrapper}>
          <View style={styles.circleBackground} />
          <Animated.View
            style={[
              styles.circleForeground,
              {
                transform: [{ rotateZ: circleInterpolated }],
              },
            ]}
          />
          <View style={styles.circleInner}>
            <Text style={styles.circleLabel}>Keşfedilen</Text>
            <Text style={styles.circleValue}>
              {totalDiscovered}/{TOTAL_COUNTRIES_TARGET}
            </Text>
            <Text style={styles.circlePercent}>{globalPercent.toFixed(1)}%</Text>
          </View>
        </View>
      </View>
      <View style={styles.globalRight}>
        <Text style={styles.globalTitle}>Genel İlerleme</Text>
        <Text style={styles.globalText}>
          Dünyadaki {TOTAL_COUNTRIES_TARGET} ülkeden{' '}
          <Text style={styles.highlight}>{totalDiscovered}</Text> tanesini keşfettin.
        </Text>
        <Text style={styles.globalText}>
          {remainingForGoal === 0
            ? 'Harika! Bir sonraki hedef için keşfetmeye devam et.'
            : `Sıradaki rozet için ${remainingForGoal} ülke daha keşfet.`}
        </Text>
        <View style={styles.badgeRow}>
          <Text style={styles.badgeLabel}>En çok keşfedilen kıta:</Text>
          <Text style={styles.badgeValue}>
            {bestContinent ? bestContinent : 'Henüz belirlenmedi'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderContinentCard = (item: (typeof continentStats)[number]) => {
    const progress = item.total > 0 ? item.discovered / item.total : 0;

    return (
      <TouchableOpacity
        key={item.key}
        activeOpacity={0.85}
        style={styles.continentCard}
        onPress={() => handlePressContinent(item.key)}
      >
        <View style={styles.continentHeader}>
          <Text style={styles.continentEmoji}>{item.emoji}</Text>
          <View style={styles.continentTitleWrapper}>
            <Text style={styles.continentName}>{item.label}</Text>
            <Text style={styles.continentSubtitle}>
              {item.discovered}/{item.total || '—'} ülke keşfedildi
            </Text>
          </View>
          <View style={styles.continentPercentPill}>
            <Text style={styles.continentPercentText}>{item.percent.toFixed(1)}%</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { flex: progress }]} />
          <View style={{ flex: 1 - progress }} />
        </View>
        <Text style={styles.continentHint}>Dokun ve bu kıtadaki ülkeleri keşfet</Text>
      </TouchableOpacity>
    );
  };

  const renderContinents = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Kıta Bazlı İlerleme</Text>
      <Text style={styles.sectionSubtitle}>
        Her kıtadaki keşif durumunu gör ve eksik ülkeleri tamamla.
      </Text>
      <View style={styles.continentList}>
        {continentStats.map((c) => renderContinentCard(c))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading && !allCountries.length ? (
        <LoadingSpinner fullscreen />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderHeader()}
          {renderGlobalProgress()}
          {renderContinents()}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const CIRCLE_SIZE = 160;
const CIRCLE_BORDER = 10;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
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
    marginTop: spacing.xs,
  },
  globalSection: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.large,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  globalLeft: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  globalRight: {
    flex: 1,
    marginLeft: spacing.lg,
    justifyContent: 'center',
  },
  circleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBackground: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: CIRCLE_BORDER,
    borderColor: '#12253A',
  },
  circleForeground: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: CIRCLE_BORDER,
    borderColor: colors.primary,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  circleInner: {
    width: CIRCLE_SIZE - CIRCLE_BORDER * 4,
    height: CIRCLE_SIZE - CIRCLE_BORDER * 4,
    borderRadius: (CIRCLE_SIZE - CIRCLE_BORDER * 4) / 2,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  circleValue: {
    color: colors.text,
    fontSize: typography.fontSizeLG,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  circlePercent: {
    color: colors.primary,
    fontSize: typography.fontSizeMD,
    marginTop: spacing.xs,
  },
  globalTitle: {
    color: colors.text,
    fontSize: typography.fontSizeLG,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  globalText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    marginBottom: spacing.xs,
  },
  highlight: {
    color: colors.accent,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  badgeLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    marginRight: spacing.xs,
  },
  badgeValue: {
    color: colors.accent,
    fontSize: typography.fontSizeSM,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.fontSizeLG,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    marginBottom: spacing.md,
  },
  continentList: {
    gap: spacing.md,
  },
  continentCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.large,
    padding: spacing.lg,
  },
  continentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  continentEmoji: {
    fontSize: typography.fontSizeXXL,
    marginRight: spacing.md,
  },
  continentTitleWrapper: {
    flex: 1,
  },
  continentName: {
    color: colors.text,
    fontSize: typography.fontSizeLG,
    fontWeight: '600',
  },
  continentSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    marginTop: spacing.xs,
  },
  continentPercentPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.card,
  },
  continentPercentText: {
    color: colors.primary,
    fontSize: typography.fontSizeSM,
    fontWeight: '600',
  },
  progressTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: radii.round,
    overflow: 'hidden',
    backgroundColor: '#12253A',
    marginTop: spacing.sm,
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: radii.round,
  },
  continentHint: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    marginTop: spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.fontSizeMD,
    textAlign: 'center',
  },
});

export default MapScreen;


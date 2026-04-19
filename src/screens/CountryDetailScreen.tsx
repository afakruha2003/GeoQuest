import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Animated,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { colors, radii, spacing, typography } from '../theme';
import { useCountries } from '../hooks/useCountries';
import { CountriesService } from '../api/countriesService';
import { userStore } from '../store/userStore';
import { Country } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { CountryCardSmall } from '../components/CountryCardSmall';

type RouteParams = {
  code: string;
};

// Mini quiz için mevcut modlar
type MiniQuizMode = 'flag' | 'capital' | 'guess';

const CountryDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { code } = route.params as RouteParams;

  const { allCountries } = useCountries();

  const [country, setCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isDiscovered, setIsDiscovered] = useState<boolean>(false);
  const [neighborCodes, setNeighborCodes] = useState<string[]>([]);
  const [neighbors, setNeighbors] = useState<Country[]>([]);
  const [neighborsLoading, setNeighborsLoading] = useState<boolean>(false);

  // Keşfedildi animasyonu
  const discoveredAnim = useRef(new Animated.Value(0)).current;
  const [showDiscoveredToast, setShowDiscoveredToast] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        const baseCountry =
          allCountries.find((c) => c.cca3 === code) ??
          allCountries.find((c) => c.name.common.toLowerCase() === code.toLowerCase()) ??
          null;

        setCountry(baseCountry);

        const [fav, discovered, borders] = await Promise.all([
          userStore.isFavori(code),
          userStore.isKesfedilen(code),
          CountriesService.getBorders(code).catch(() => [] as string[]),
        ]);

        setIsFavorite(fav);
        setIsDiscovered(discovered);
        setNeighborCodes(borders);

        // ✅ DÜZELTME: Ülke detayı açılınca otomatik olarak keşfedildi işaretlenir
        // Eğer daha önce keşfedilmediyse, şimdi kaydet ve animasyon göster
        if (!discovered && baseCountry) {
          await userStore.addKesfedilen(code);
          setIsDiscovered(true);
          // Toast animasyonu göster
          setShowDiscoveredToast(true);
          Animated.sequence([
            Animated.timing(discoveredAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.delay(2000),
            Animated.timing(discoveredAnim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]).start(() => setShowDiscoveredToast(false));
        }
      } finally {
        setLoading(false);
      }
    };

    void init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCountries, code]);

  useEffect(() => {
    if (!neighborCodes.length) return;

    const loadNeighbors = async () => {
      try {
        setNeighborsLoading(true);
        const data = await CountriesService.getByCodes(neighborCodes);
        setNeighbors(data);
      } finally {
        setNeighborsLoading(false);
      }
    };

    void loadNeighbors();
  }, [neighborCodes]);

  const languagesText = useMemo(() => {
    if (!country?.languages) return 'Bilgi yok';
    return Object.values(country.languages).join(', ');
  }, [country]);

  const currenciesText = useMemo(() => {
    if (!country?.currencies) return 'Bilgi yok';
    return Object.entries(country.currencies)
      .map(([codeKey, value]) => `${codeKey} (${value.symbol ?? '?'})`)
      .join(', ');
  }, [country]);

  const populationText = useMemo(
    () => (country ? formatShortNumber(country.population) : '-'),
    [country],
  );

  const areaText = useMemo(
    () => (country ? `${formatShortNumber(country.area)} km²` : '-'),
    [country],
  );

  const handleToggleFavorite = async () => {
    const next = !isFavorite;
    setIsFavorite(next);
    if (next) {
      await userStore.addFavori(code);
    } else {
      await userStore.removeFavori(code);
    }
  };

  const handleToggleDiscovered = async () => {
    const next = !isDiscovered;
    setIsDiscovered(next);
    if (next) {
      await userStore.addKesfedilen(code);
    } else {
      await userStore.removeKesfedilen(code);
    }
  };

  const handleOpenMap = () => {
    if (!country) return;
    const query = encodeURIComponent(country.name.common);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => undefined);
  };

  // ✅ DÜZELTME: Mini quiz artık rastgele bir mod seçiyor (flag, capital, guess)
  // Böylece her seferinde farklı türde sorular gelir
  const handleStartQuiz = (selectedMode?: MiniQuizMode) => {
    const modes: MiniQuizMode[] = ['flag', 'capital', 'guess'];
    const mode = selectedMode ?? modes[Math.floor(Math.random() * modes.length)];
    navigation.navigate('QuizStack', {
      screen: 'Quiz',
      params: { mode, countryCode: code },
    });
  };

  if (loading || !country) {
    return (
      <SafeAreaView style={styles.container}>
        {loading ? (
          <LoadingSpinner fullscreen />
        ) : (
          <View style={styles.center}>
            <Text style={styles.errorText}>Ülke bulunamadı.</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  const capital = country.capital?.[0] ?? 'Başkent bilgisi yok';

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ Keşfedildi toast bildirimi */}
      {showDiscoveredToast && (
        <Animated.View
          style={[
            styles.discoveredToast,
            {
              opacity: discoveredAnim,
              transform: [
                {
                  translateY: discoveredAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.discoveredToastText}>
            🌍 {country.name.common} keşfedildi!
          </Text>
        </Animated.View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.flagContainer}>
          <Image
            source={{ uri: country.flags.png }}
            style={styles.flagImage}
            contentFit="cover"
          />
          <View style={styles.flagGradient} />

          <View style={styles.flagHeaderRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.chip, styles.chipPrimary]}
            >
              <Text style={styles.chipText}>{country.region}</Text>
            </TouchableOpacity>

            {/* Keşfedildi rozeti — sağ üstte */}
            {isDiscovered && (
              <View style={styles.discoveredBadge}>
                <Text style={styles.discoveredBadgeText}>✓ Keşfedildi</Text>
              </View>
            )}
          </View>

          <View style={styles.flagBottomRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.countryName}>{country.name.common}</Text>
              <Text style={styles.countrySubtitle}>{capital}</Text>
            </View>
            <View style={styles.flagActions}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.iconButton, isFavorite && styles.iconButtonActive]}
                onPress={handleToggleFavorite}
              >
                <Text style={styles.iconButtonText}>{isFavorite ? '♥' : '♡'}</Text>
              </TouchableOpacity>
              {/* Manuel keşfedildi toggle — otomatik olsa bile kullanıcı değiştirebilir */}
              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.discoverButton,
                  isDiscovered && styles.discoverButtonActive,
                ]}
                onPress={handleToggleDiscovered}
              >
                <Text
                  style={[
                    styles.discoverText,
                    isDiscovered && styles.discoverTextActive,
                  ]}
                >
                  {isDiscovered ? '✓ Keşfedildi' : 'Keşfedilmedi'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Genel Bilgiler</Text>
          <View style={styles.card}>
            <InfoRow label="Resmi Adı" value={country.name.official} />
            <InfoRow label="Başkent" value={capital} />
            <InfoRow label="Kıta" value={country.region} />
            <InfoRow label="Bölge" value={country.subregion ?? 'Bilgi yok'} />
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.sectionHalf}>
            <Text style={styles.sectionTitle}>👥 Demografi</Text>
            <View style={styles.card}>
              <InfoRow label="Nüfus" value={populationText} />
              <InfoRow label="Yüzölçüm" value={areaText} />
            </View>
          </View>
          <View style={styles.sectionHalf}>
            <Text style={styles.sectionTitle}>🗣️ Dil & Para</Text>
            <View style={styles.card}>
              <InfoRow label="Diller" value={languagesText} />
              <InfoRow label="Para Birimi" value={currenciesText} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 Diğer Bilgiler</Text>
          <View style={styles.card}>
            <InfoRow
              label="Bağımsızlık"
              value={country.independent === undefined ? 'Bilgi yok' : country.independent ? 'Evet' : 'Hayır'}
            />
            <InfoRow label="Kısa Kod" value={country.cca3} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗺️ Haritada Gör</Text>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.mapButton}
            onPress={handleOpenMap}
          >
            <Text style={styles.mapButtonText}>Google Haritalar'da Aç</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 Komşu Ülkeler</Text>
          {neighborsLoading ? (
            <LoadingSpinner />
          ) : neighbors.length === 0 ? (
            <Text style={styles.emptyText}>Ada ülkesi, komşusu yok veya bilgi bulunamadı.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.neighborScroll}
            >
              {neighbors.map((neighbor) => (
                <CountryCardSmall
                  key={neighbor.cca3}
                  country={neighbor}
                  onPress={() =>
                    navigation.push('CountryDetail', {
                      code: neighbor.cca3,
                    })
                  }
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* ✅ DÜZELTME: Mini quiz artık 3 farklı mod seçeneği sunuyor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧠 Bu Ülkeyi Quiz'de Çöz</Text>
          <Text style={styles.quizSubtitle}>
            Bir mod seç, {country.name.common} hakkında 5 soruluk mini quiz başlat.
          </Text>
          <View style={styles.miniQuizRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.miniQuizButton, styles.miniQuizFlag]}
              onPress={() => handleStartQuiz('flag')}
            >
              <Text style={styles.miniQuizEmoji}>🚩</Text>
              <Text style={styles.miniQuizLabel}>Bayrak</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.miniQuizButton, styles.miniQuizCapital]}
              onPress={() => handleStartQuiz('capital')}
            >
              <Text style={styles.miniQuizEmoji}>🏛️</Text>
              <Text style={styles.miniQuizLabel}>Başkent</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.miniQuizButton, styles.miniQuizGuess]}
              onPress={() => handleStartQuiz('guess')}
            >
              <Text style={styles.miniQuizEmoji}>🔍</Text>
              <Text style={styles.miniQuizLabel}>Tahmin</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.quizButton}
            onPress={() => handleStartQuiz()}
          >
            <Text style={styles.quizButtonText}>🎲 Rastgele Mod ile Başlat</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

function formatShortNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.huge,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.fontSizeMD,
  },
  // ✅ Keşfedildi toast
  discoveredToast: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    zIndex: 100,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.round,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  discoveredToastText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: typography.fontSizeMD,
  },
  discoveredBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
    backgroundColor: colors.success,
  },
  discoveredBadgeText: {
    color: colors.background,
    fontSize: typography.fontSizeXS,
    fontWeight: '700',
  },
  flagContainer: {
    height: 260,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  flagImage: {
    width: '100%',
    height: '100%',
  },
  flagGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  flagHeaderRow: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  chipPrimary: {
    backgroundColor: 'rgba(0,212,170,0.9)',
  },
  chipText: {
    color: colors.background,
    fontSize: typography.fontSizeXS,
    fontWeight: '600',
  },
  flagBottomRow: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  countryName: {
    color: colors.text,
    fontSize: typography.fontSizeXXL,
    fontWeight: '700',
  },
  countrySubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeMD,
    marginTop: spacing.xs,
  },
  flagActions: {
    marginLeft: spacing.md,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconButtonActive: {
    backgroundColor: colors.danger,
  },
  iconButtonText: {
    color: colors.text,
    fontSize: 18,
  },
  discoverButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  discoverButtonActive: {
    backgroundColor: colors.success,
  },
  discoverText: {
    color: colors.text,
    fontSize: typography.fontSizeXS,
    fontWeight: '600',
  },
  discoverTextActive: {
    color: colors.background,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHalf: {
    flex: 1,
    marginRight: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.fontSizeLG,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.large,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    marginRight: spacing.sm,
  },
  infoValue: {
    color: colors.text,
    fontSize: typography.fontSizeSM,
    flex: 1,
    textAlign: 'right',
  },
  mapButton: {
    backgroundColor: colors.card,
    borderRadius: radii.large,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  mapButtonText: {
    color: colors.primary,
    fontSize: typography.fontSizeMD,
    fontWeight: '600',
  },
  neighborScroll: {
    paddingRight: spacing.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
  },
  // ✅ Mini quiz bölümü
  quizSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    marginBottom: spacing.md,
  },
  miniQuizRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  miniQuizButton: {
    flex: 1,
    borderRadius: radii.large,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniQuizFlag: {
    backgroundColor: '#1A3050',
  },
  miniQuizCapital: {
    backgroundColor: '#1A3050',
  },
  miniQuizGuess: {
    backgroundColor: '#1A3050',
  },
  miniQuizEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  miniQuizLabel: {
    color: colors.text,
    fontSize: typography.fontSizeXS,
    fontWeight: '600',
  },
  quizButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.large,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  quizButtonText: {
    color: colors.background,
    fontSize: typography.fontSizeMD,
    fontWeight: '700',
  },
});

export default CountryDetailScreen;

import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, radii, spacing, typography } from '../theme';

const QuizMenuScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const startQuiz = (mode: 'flag' | 'capital' | 'guess', difficulty?: 'easy' | 'medium' | 'hard') => {
    navigation.navigate('Quiz', { mode, difficulty });
  };

  const startRegionQuiz = (quizType: 'region_color' | 'region_name') => {
    navigation.navigate('RegionQuiz', { quizType, questionCount: 10 });
  };

  const startMapQuiz = () => {
    navigation.navigate('MapQuiz', { questionCount: 10 });
  };

  const startShapeQuiz = () => {
    navigation.navigate('ShapeQuiz', { questionCount: 10, standalone: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Quiz Modları</Text>
          <Text style={styles.subtitle}>
            Bayrakları, başkentleri ve ipuçlarıyla ülkeleri tahmin ederek coğrafya bilgini eğlenceli şekilde geliştir.
          </Text>
        </View>

        {/* ─── Klasik Modlar ─── */}
        <Text style={styles.sectionLabel}>🎯 Klasik Modlar</Text>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.card}
          onPress={() => startQuiz('flag', 'easy')}
        >
          <Text style={styles.cardEmoji}>🚩</Text>
          <Text style={styles.cardTitle}>Bayrağı Bul</Text>
          <Text style={styles.cardText}>
            Bayrağı gösteriyoruz, doğru ülke adını 4 seçenek arasından seçiyorsun.
          </Text>
          <View style={styles.chipRow}>
            <DifficultyChip label="Kolay" onPress={() => startQuiz('flag', 'easy')} />
            <DifficultyChip label="Orta" onPress={() => startQuiz('flag', 'medium')} />
            <DifficultyChip label="Zor" onPress={() => startQuiz('flag', 'hard')} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.card}
          onPress={() => startQuiz('capital', 'medium')}
        >
          <Text style={styles.cardEmoji}>🏛️</Text>
          <Text style={styles.cardTitle}>Başkenti Bul</Text>
          <Text style={styles.cardText}>
            Ülke adını veriyoruz, doğru başkenti seçmeni istiyoruz.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.card}
          onPress={() => startQuiz('guess')}
        >
          <Text style={styles.cardEmoji}>🔍</Text>
          <Text style={styles.cardTitle}>Ülkeyi Tahmin Et</Text>
          <Text style={styles.cardText}>
            Kıta, nüfus, para birimi gibi ipuçları sırayla açılıyor. Ne kadar az ipucuyla bilirsen o kadar yüksek puan!
          </Text>
        </TouchableOpacity>

        {/* ─── Yeni: Kıta Quiz Modları ─── */}
        <Text style={styles.sectionLabel}>🗺️ Kıta & Harita Modları</Text>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.card, styles.newCard]}
          onPress={() => startRegionQuiz('region_color')}
        >
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>YENİ</Text>
          </View>
          <Text style={styles.cardEmoji}>🔴</Text>
          <Text style={styles.cardTitle}>Kıta Haritasında Bul</Text>
          <Text style={styles.cardText}>
            Kıta haritasında kırmızı işaretli bölge gösteriliyor — o bölgedeki ülkeyi 4 şıktan seç. Ne kadar iyi biliyorsun?
          </Text>
          <View style={styles.regionPreview}>
            {['🌍 Afrika', '🌍 Avrupa', '🌏 Asya', '🌎 Amerika'].map((r) => (
              <View key={r} style={styles.regionPill}>
                <Text style={styles.regionPillText}>{r}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.card, styles.newCard]}
          onPress={() => startRegionQuiz('region_name')}
        >
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>YENİ</Text>
          </View>
          <Text style={styles.cardEmoji}>🌐</Text>
          <Text style={styles.cardTitle}>Hangi Kıtada?</Text>
          <Text style={styles.cardText}>
            Ülkenin bayrağı ve adı gösteriliyor — hangi kıtada olduğunu bulman lazım. Coğrafya bilgini test et!
          </Text>
        </TouchableOpacity>

        {/* Ülke Şekli Quiz */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.card, styles.newCard]}
          onPress={startShapeQuiz}
        >
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>YENİ</Text>
          </View>
          <Text style={styles.cardEmoji}>🔴</Text>
          <Text style={styles.cardTitle}>Ülkeyi Bul</Text>
          <Text style={styles.cardText}>
            Kıtanın haritasında kırmızı ile işaretlenmiş ülkenin adını 4 şıktan seç!
          </Text>
          <View style={styles.regionPreview}>
            {['🌍 Gerçek sınırlar', '⏱️ 20 saniye', '🎯 10 soru'].map((r) => (
              <View key={r} style={styles.regionPill}>
                <Text style={styles.regionPillText}>{r}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.card, styles.newCard]}
          onPress={startMapQuiz}
        >
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>YENİ</Text>
          </View>
          <Text style={styles.cardEmoji}>🗺️</Text>
          <Text style={styles.cardTitle}>Haritada İşaretle</Text>
          <Text style={styles.cardText}>
            Ülkenin bayrağı ve bilgileri gösteriliyor — dünya haritasında o ülkenin yerini işaretle. Hedefe yakınlığına göre puan kazan!
          </Text>
          <View style={styles.regionPreview}>
            {['🎯 < 500km → 500p', '👍 < 3000km → 150p', '❌ > 5000km → 0p'].map((r) => (
              <View key={r} style={styles.regionPill}>
                <Text style={styles.regionPillText}>{r}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* ─── Özel Modlar ─── */}
        <Text style={styles.sectionLabel}>⚡ Özel Modlar</Text>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.card, styles.secondaryCard]}
          onPress={() => navigation.navigate('Quiz', { mode: 'flag', region: 'Africa' })}
        >
          <Text style={styles.cardEmoji}>🌍</Text>
          <Text style={styles.cardTitle}>Kıtaya Göre Quiz</Text>
          <Text style={styles.cardText}>
            Sadece bir kıtanın ülkelerinden sorular gelsin. Kıtaları tek tek fethet.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.card, styles.secondaryCard]}
          onPress={() => navigation.navigate('Quiz', { mode: 'flag', reviewWrong: true })}
        >
          <Text style={styles.cardEmoji}>📚</Text>
          <Text style={styles.cardTitle}>Yanlışları Tekrar Çalış</Text>
          <Text style={styles.cardText}>
            Daha önce yanlış yaptığın ülkelerden yeni sorular üretelim; zayıf noktalarını güçlendir.
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

interface DifficultyChipProps {
  label: string;
  onPress: () => void;
}

const DifficultyChip: React.FC<DifficultyChipProps> = ({ label, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    style={styles.diffChip}
    onPress={onPress}
  >
    <Text style={styles.diffChipText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 80,
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
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
    position: 'relative',
  },
  newCard: {
    borderWidth: 1,
    borderColor: colors.primary + '60',
    backgroundColor: '#0F2237',
  },
  secondaryCard: {
    backgroundColor: colors.card,
  },
  newBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.round,
  },
  newBadgeText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardEmoji: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.fontSizeLG,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  cardText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  diffChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
  },
  diffChipText: {
    color: colors.text,
    fontSize: typography.fontSizeXS,
    fontWeight: '600',
  },
  regionPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  regionPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.round,
    backgroundColor: '#1A3050',
  },
  regionPillText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
});

export default QuizMenuScreen;
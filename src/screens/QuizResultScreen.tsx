import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { QuizResult } from '../types';
import { userStore } from '../store/userStore';

type ResultParams = {
  result: QuizResult;
  mode: 'flag' | 'capital' | 'guess';
};

type ResultRoute = RouteProp<Record<string, ResultParams>, string>;

const QuizResultScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ResultRoute>();
  const { result, mode } = route.params;

  const [isNewRecord, setIsNewRecord] = useState<boolean>(result.isNewRecord);

  useEffect(() => {
    const checkRecord = async () => {
      const stats = await userStore.getStats();
      if (result.score > stats.bestScore) {
        setIsNewRecord(true);
      }
    };

    void checkRecord();
  }, [result.score]);

  const handlePlayAgain = () => {
    navigation.replace('Quiz', { mode });
  };

  const handleReviewWrong = () => {
    navigation.navigate('Quiz', { mode: 'flag', reviewWrong: true });
  };

  const handleBackToMenu = () => {
    navigation.navigate('QuizStack', {
      screen: 'QuizMenu',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quiz Sonucu</Text>
        <Text style={styles.subtitle}>Harika bir tur geçirdin, şimdi sonuçlara bakalım.</Text>
      </View>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Skorun</Text>
        <Text style={styles.scoreValue}>{result.score}</Text>
        <Text style={styles.accuracy}>
          Doğruluk: {Math.round(result.accuracy)}%
        </Text>
        {isNewRecord && (
          <View style={styles.recordPill}>
            <Text style={styles.recordText}>🏆 Yeni Rekor!</Text>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Doğru</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {result.correct}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Yanlış</Text>
          <Text style={[styles.statValue, { color: colors.danger }]}>
            {result.wrong}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Boş</Text>
          <Text style={styles.statValue}>{result.blank}</Text>
        </View>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.primaryButton}
          onPress={handlePlayAgain}
        >
          <Text style={styles.primaryText}>Tekrar Oyna</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.secondaryButton}
          onPress={handleReviewWrong}
        >
          <Text style={styles.secondaryText}>Yanlışları Çalış</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.ghostButton}
          onPress={handleBackToMenu}
        >
          <Text style={styles.ghostText}>Quiz Menüsüne Dön</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
  scoreCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scoreLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
  },
  scoreValue: {
    color: colors.accent,
    fontSize: typography.fontSizeHero,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  accuracy: {
    color: colors.text,
    fontSize: typography.fontSizeMD,
    marginTop: spacing.sm,
  },
  recordPill: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: '#2A3650',
  },
  recordText: {
    color: colors.accent,
    fontSize: typography.fontSizeSM,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.large,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
  },
  statValue: {
    color: colors.text,
    fontSize: typography.fontSizeXL,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  buttons: {
    marginTop: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.large,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryText: {
    color: colors.background,
    fontSize: typography.fontSizeMD,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderRadius: radii.large,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  secondaryText: {
    color: colors.accent,
    fontSize: typography.fontSizeMD,
    fontWeight: '600',
  },
  ghostButton: {
    borderRadius: radii.large,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ghostText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
  },
});

export default QuizResultScreen;


import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { Badge } from '../types';

interface BadgeCardProps {
  badge: Badge;
  unlocked: boolean;
  onPress?: () => void;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge, unlocked, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.card, !unlocked && styles.cardLocked]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.emojiContainer}>
        <Text style={[styles.emoji, !unlocked && styles.emojiLocked]}>{badge.emoji}</Text>
      </View>
      <Text style={[styles.title, !unlocked && styles.textLocked]} numberOfLines={1}>
        {badge.name}
      </Text>
      <Text style={[styles.description, !unlocked && styles.textLocked]} numberOfLines={2}>
        {badge.description}
      </Text>
      {!unlocked && (
        <View style={styles.lockPill}>
          <Text style={styles.lockText}>Kilitli</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: colors.card,
    borderRadius: radii.large,
    padding: spacing.md,
    marginRight: spacing.md,
  },
  cardLocked: {
    opacity: 0.6,
  },
  emojiContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#102136',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emoji: {
    fontSize: 24,
  },
  emojiLocked: {
    opacity: 0.6,
  },
  title: {
    color: colors.text,
    fontSize: typography.fontSizeSM,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
  },
  textLocked: {
    color: '#5A6578',
  },
  lockPill: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: '#1B2737',
  },
  lockText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
  },
});


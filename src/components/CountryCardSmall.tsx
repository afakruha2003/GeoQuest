import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, radii, spacing, typography } from '../theme';
import { Country } from '../types';

interface CountryCardSmallProps {
  country: Country;
  discovered?: boolean;
  onPress?: () => void;
}

export const CountryCardSmall: React.FC<CountryCardSmallProps> = ({ country, discovered = false, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={onPress}
    >
      <Image source={{ uri: country.flags.png }} style={styles.flag} contentFit="cover" />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {country.name.common}
        </Text>
        <Text style={styles.region} numberOfLines={1}>
          {country.region}
        </Text>
      </View>
      {discovered && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 120,
    marginRight: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.medium,
    overflow: 'hidden',
  },
  flag: {
    width: '100%',
    height: 70,
  },
  info: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: typography.fontSizeSM,
    fontWeight: '600',
  },
  region: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: colors.background,
    fontSize: typography.fontSizeXS,
    fontWeight: '700',
  },
});


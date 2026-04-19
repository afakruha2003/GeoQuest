import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, radii, spacing, typography } from '../theme';
import { Country } from '../types';

interface CountryCardProps {
  country: Country;
  discovered?: boolean;
  layout?: 'grid' | 'list';
  onPress?: () => void;
}

export const CountryCard: React.FC<CountryCardProps> = ({ country, discovered = false, layout = 'grid', onPress }) => {
  const capital = country.capital?.[0] ?? 'Başkent bilgisi yok';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.card, layout === 'list' && styles.cardList]}
      onPress={onPress}
    >
      <View style={[styles.flagWrapper, layout === 'list' && styles.flagWrapperList]}>
        <Image
          source={{ uri: country.flags.png }}
          style={[styles.flag, layout === 'list' && styles.flagList]}
          contentFit="cover"
        />
        <View style={styles.flagOverlay} />
        <View style={styles.flagLabelContainer}>
          <Text style={styles.flagLabel} numberOfLines={2}>
            {country.name.common}
          </Text>
          <Text style={styles.flagCapital} numberOfLines={1}>
            {capital}
          </Text>
        </View>
        {discovered && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✓</Text>
          </View>
        )}
      </View>

      <View style={styles.infoRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{country.region}</Text>
        </View>
        <Text style={styles.metaText} numberOfLines={1}>
          Nüfus: {formatShortNumber(country.population)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

function formatShortNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.large,
    overflow: 'hidden',
    marginBottom: spacing.md,
    marginRight: spacing.md,
  },
  cardList: {
    marginRight: 0,
    flexDirection: 'row',
    height: 110,
    alignItems: 'stretch',
  },
  flagWrapper: {
    position: 'relative',
    width: '100%',
    height: 120,
  },
  flagWrapperList: {
    width: 130,
    height: '100%',
  },
  flag: {
    width: '100%',
    height: '100%',
  },
  flagList: {
    borderTopLeftRadius: radii.large,
    borderBottomLeftRadius: radii.large,
  },
  flagOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  flagLabelContainer: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
  flagLabel: {
    color: colors.text,
    fontSize: typography.fontSizeLG,
    fontWeight: '700',
  },
  flagCapital: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    marginTop: spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: colors.background,
    fontSize: typography.fontSizeSM,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
    backgroundColor: colors.card,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
  },
});


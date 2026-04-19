import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

interface FilterChipProps {
  label: string;
  active?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, active = false, style, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.chip,
        active && styles.chipActive,
        style,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#0F2237',
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
  },
  labelActive: {
    color: colors.background,
    fontWeight: '600',
  },
});


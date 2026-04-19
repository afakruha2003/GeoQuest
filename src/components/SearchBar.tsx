import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

interface SearchBarProps {
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, placeholder, onChangeText }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        {/* Basit büyüteç ikonu */}
        <View style={styles.iconHandle} />
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? 'Ülke ara...'}
        placeholderTextColor={colors.textSecondary}
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.large,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  iconHandle: {
    width: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.textSecondary,
    transform: [{ rotate: '45deg' }, { translateX: 4 }, { translateY: 4 }],
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: typography.fontSizeMD,
    paddingVertical: spacing.sm,
  },
});


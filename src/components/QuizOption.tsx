import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

type OptionState = 'default' | 'correct' | 'wrong' | 'disabled';

interface QuizOptionProps {
  label: string;
  text: string;
  state: OptionState;
  onPress?: () => void;
}

export const QuizOption: React.FC<QuizOptionProps> = ({ label, text, state, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (state === 'disabled') return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onPress?.();
  };

  let containerStyle: ViewStyle = styles.containerDefault;
  let textStyle: ViewStyle = styles.textDefault;

  if (state === 'correct') {
    containerStyle = styles.containerCorrect;
    textStyle = styles.textEmphasis;
  } else if (state === 'wrong') {
    containerStyle = styles.containerWrong;
    textStyle = styles.textEmphasis;
  } else if (state === 'disabled') {
    containerStyle = styles.containerDisabled;
    textStyle = styles.textDisabled;
  }

  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: spacing.sm }}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.containerBase, containerStyle]}
        onPress={handlePress}
        disabled={state === 'disabled'}
      >
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.text, textStyle]} numberOfLines={2}>
          {text}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  containerBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.large,
    borderWidth: 1,
  },
  containerDefault: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  containerCorrect: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  containerWrong: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  containerDisabled: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    opacity: 0.5,
  },
  label: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#12253A',
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: typography.fontSizeSM,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginRight: spacing.sm,
  },
  text: {
    flex: 1,
    fontSize: typography.fontSizeMD,
  },
  textDefault: {
    color: colors.text,
  },
  textEmphasis: {
    color: colors.background,
    fontWeight: '600',
  },
  textDisabled: {
    color: colors.textSecondary,
  },
});


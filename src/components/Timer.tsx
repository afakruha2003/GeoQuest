import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

interface TimerProps {
  total: number;
  timeLeft: number;
}

export const Timer: React.FC<TimerProps> = ({ total, timeLeft }) => {
  const ratio = total > 0 ? timeLeft / total : 0;
  let backgroundColor = colors.success;

  if (ratio < 0.3) {
    backgroundColor = colors.danger;
  } else if (ratio < 0.7) {
    backgroundColor = colors.warning;
  }

  return (
    <View style={[styles.circle, { borderColor: backgroundColor }]}>
      <View style={styles.inner}>
        <Text style={[styles.text, { color: backgroundColor }]}>{timeLeft}</Text>
        <Text style={styles.subText}>sn</Text>
      </View>
    </View>
  );
};

const SIZE = 56;

const styles = StyleSheet.create({
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: typography.fontSizeLG,
    fontWeight: '700',
  },
  subText: {
    fontSize: typography.fontSizeXS,
    color: colors.textSecondary,
    marginTop: -spacing.xs,
  },
});


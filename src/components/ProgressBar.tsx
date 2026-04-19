import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii } from '../theme';

interface ProgressBarProps {
  progress: number; // 0 - 1
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { flex: clamped }]} />
      <View style={{ flex: 1 - clamped }} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: 8,
    borderRadius: radii.round,
    overflow: 'hidden',
    backgroundColor: '#12253A',
  },
  fill: {
    backgroundColor: colors.primary,
    borderRadius: radii.round,
  },
});


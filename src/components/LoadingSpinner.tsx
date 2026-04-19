import React from 'react';
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  fullscreen?: boolean;
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'large', fullscreen = false, style }) => {
  if (fullscreen) {
    return (
      <View style={[styles.fullscreenContainer, style]}>
        <ActivityIndicator size={size} color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.inlineContainer, style]}>
      <ActivityIndicator size={size} color={colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});


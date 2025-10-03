import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { LogoProps } from '../types/components/Logo';

export default function Logo({ size = 'medium', style }: LogoProps) {
  const sizeMap = {
    small: { width: 40, height: 40 },
    medium: { width: 80, height: 80 },
    large: { width: 128, height: 128 },
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo.png')}
        resizeMode="contain"
        style={[sizeMap[size], style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export default function Logo({ size = 'medium', style }: LogoProps) {
  const logoStyles = [
    styles.logo,
    size === 'small' && styles.small,
    size === 'medium' && styles.medium,
    size === 'large' && styles.large,
    style
  ];

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo.png')}
        style={logoStyles}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    // Base logo style
  },
  small: {
    width: 40,
    height: 40,
  },
  medium: {
    width: 80,
    height: 80,
  },
  large: {
    width: 120,
    height: 120,
  },
});
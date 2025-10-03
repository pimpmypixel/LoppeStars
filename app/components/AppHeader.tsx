import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './ui-kitten';
import Logo from './Logo';
import { AppHeaderProps } from '../types/components/AppHeader';
import { useSelectedMarket } from '../stores/appStore';
import { Ionicons } from '@expo/vector-icons';

export default function AppHeader({ title }: AppHeaderProps) {
  const { selectedMarket } = useSelectedMarket();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftColumn}>
          <Logo size="small" />
        </View>
        <View style={styles.centerColumn}>
          <Text variant="h4" style={styles.title}>
            {title}
          </Text>
          {selectedMarket && (
            <View style={styles.marketRow}>
              <Ionicons name="storefront" size={14} color="#6b7280" />
              <Text variant="muted" style={styles.marketText}>
                {selectedMarket.name}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.rightColumn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftColumn: {
    flex: 1,
  },
  centerColumn: {
    flex: 2,
    alignItems: 'center',
  },
  rightColumn: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  marketText: {
    fontSize: 14,
    marginLeft: 4,
  },
});
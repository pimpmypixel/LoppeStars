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
              <Ionicons name="storefront" size={14} color="#8F9BB3" />
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
    backgroundColor: '#16213E',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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
    fontWeight: '700',
    letterSpacing: 0.5,
    fontSize: 20,
    color: '#FFFFFF',
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: 'rgba(51, 102, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  marketText: {
    fontSize: 13,
    marginLeft: 6,
    color: '#8F9BB3',
  },
});
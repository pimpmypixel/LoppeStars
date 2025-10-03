import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './ui-kitten';
import { Icon } from '@ui-kitten/components';
import Logo from './Logo';
import { AppHeaderProps } from '../types/components/AppHeader';
import { useSelectedMarket } from '../stores/appStore';

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
              <Icon name="shopping-bag-outline" style={styles.marketIcon} fill="#FF9500" />
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
    backgroundColor: '#292524',
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
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
    fontWeight: '800',
    letterSpacing: 0.8,
    fontSize: 22,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  marketIcon: {
    width: 16,
    height: 16,
  },
  marketText: {
    fontSize: 13,
    marginLeft: 8,
    color: '#D4D4D8',
    fontWeight: '600',
  },
});
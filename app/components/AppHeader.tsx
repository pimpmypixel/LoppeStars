import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
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
          <Text style={styles.title}>
            {title}
          </Text>
          {selectedMarket && (
            <View style={styles.marketRow}>
              <Icon name="shopping-bag" style={styles.marketIcon} fill="#FF9500" />
              <Text style={styles.marketText}>
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
    backgroundColor: '#1C1917',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 149, 0, 0.2)',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    // Force override any theme-based styling
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
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
    paddingHorizontal: 8,
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
    fontSize: 11,
    marginLeft: 8,
    color: '#D4D4D8',
    fontWeight: '600',
  },
});
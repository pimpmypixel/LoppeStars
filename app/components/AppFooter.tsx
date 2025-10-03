import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from '../utils/localization';
import Logo from './Logo';
import { Text } from './ui-kitten';
import { useAuth } from '../contexts/AuthContext';
import { useSelectedMarket } from '../stores/appStore';
import { Ionicons } from '@expo/vector-icons';

export default function AppFooter() {
  const { user, session, signOut } = useAuth();
  const { selectedMarket } = useSelectedMarket();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Left column - Logo */}
        <View style={styles.column}>
          <Logo size="small" />
        </View>

        {/* Center column - Selected Market or Copyright */}
        <View style={styles.column}>
          {selectedMarket ? (
            <View style={styles.marketInfo}>
              <View style={styles.marketRow}>
                <Ionicons name="storefront" size={12} color="#6b7280" />
                <Text variant="muted" style={styles.marketText}>
                  {selectedMarket.name}
                </Text>
              </View>
              {selectedMarket.city && (
                <Text variant="muted" style={styles.marketText}>
                  {selectedMarket.city}
                </Text>
              )}
            </View>
          ) : (
            <Text variant="muted" style={styles.copyrightText}>
              {t('footer.copyright')}
            </Text>
          )}
        </View>

        {/* Right column - Empty for balance */}
        <View style={styles.column} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  marketInfo: {
    alignItems: 'center',
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marketText: {
    fontSize: 12,
    marginLeft: 4,
  },
  copyrightText: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
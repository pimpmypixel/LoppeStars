import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { t } from '../utils/localization';
import Logo from './Logo';

export default function AppFooter() {
  return (
    <View style={styles.footer}>
      <Logo size="small" />
      <Text style={styles.footerText}>{t('footer.copyright')}</Text>
      <Text style={styles.footerSubtext}>{t('footer.tagline')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginTop: 8,
  },
  footerSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
});
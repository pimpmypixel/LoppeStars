import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AppFooter() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>© 2025 Loppestars</Text>
      <Text style={styles.footerSubtext}>Your marketplace for everything</Text>
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
  },
  footerSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
});
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <AppHeader title="Loppestars" />
      
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Loppestars!</Text>
        <Text style={styles.subtitle}>Your marketplace for everything</Text>
        <Text style={styles.description}>
          Discover unique items from local sellers, or list your own items to reach buyers in your area.
        </Text>
      </View>
      
      <AppFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
});
/**
 * Connectivity Splash Screen
 * 
 * Displays connectivity check status during app startup
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Layout } from '@ui-kitten/components';
import { Text } from './ui-kitten';
import Logo from './Logo';
import { Icon } from '@ui-kitten/components';
import { ConnectivityStatus } from '../utils/connectivityCheck';

interface ConnectivitySplashProps {
  status: ConnectivityStatus | null;
  isChecking: boolean;
}

export default function ConnectivitySplash({ status, isChecking }: ConnectivitySplashProps) {
  // Show loading state while checking
  if (isChecking || !status) {
    return (
      <Layout style={styles.container} level="2">
        <View style={styles.content}>
          <Logo size="large" />
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#FF9500" />
            <Text style={styles.title}>Checking connectivity...</Text>
            <Text style={styles.subtitle}>Verifying database and API connections</Text>
          </View>
        </View>
      </Layout>
    );
  }

  // Show error state if offline
  if (status.overall === 'offline') {
    return (
      <Layout style={styles.container} level="2">
        <View style={styles.content}>
          <Logo size="large" />
          <View style={styles.statusContainer}>
            <View style={styles.iconContainer}>
              <Icon name="wifi-off" style={{ width: 48, height: 48 }} fill="#EF4444" />
            </View>
            <Text style={styles.errorTitle}>Connection Failed</Text>
            <Text style={styles.errorSubtitle}>
              Unable to connect to services. Please check your internet connection.
            </Text>
            
            <View style={styles.detailsContainer}>
              {!status.database.connected && (
                <View style={styles.detailRow}>
                  <Icon name="alert-circle" style={{ width: 20, height: 20 }} fill="#EF4444" />
                  <Text style={styles.detailText}>Database: {status.database.error}</Text>
                </View>
              )}
              {!status.api.connected && (
                <View style={styles.detailRow}>
                  <Icon name="alert-circle" style={{ width: 20, height: 20 }} fill="#EF4444" />
                  <Text style={styles.detailText}>API: {status.api.error}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Layout>
    );
  }

  // Show warning state if degraded
  if (status.overall === 'degraded') {
    return (
      <Layout style={styles.container} level="2">
        <View style={styles.content}>
          <Logo size="large" />
          <View style={styles.statusContainer}>
            <View style={styles.iconContainer}>
              <Icon name="alert-circle" style={{ width: 48, height: 48 }} fill="#F59E0B" />
            </View>
            <Text style={styles.warningTitle}>Limited Connectivity</Text>
            <Text style={styles.warningSubtitle}>
              Some features may be unavailable
            </Text>
            
            <View style={styles.detailsContainer}>
              {status.database.connected && (
                <View style={styles.detailRow}>
                  <Icon name="checkmark-circle" style={{ width: 20, height: 20 }} fill="#10B981" />
                  <Text style={styles.detailText}>Database: Connected ({status.database.latency}ms)</Text>
                </View>
              )}
              {!status.database.connected && (
                <View style={styles.detailRow}>
                  <Icon name="alert-circle" style={{ width: 20, height: 20 }} fill="#EF4444" />
                  <Text style={styles.detailText}>Database: {status.database.error}</Text>
                </View>
              )}
              {status.api.connected && (
                <View style={styles.detailRow}>
                  <Icon name="checkmark-circle" style={{ width: 20, height: 20 }} fill="#10B981" />
                  <Text style={styles.detailText}>API: Connected ({status.api.latency}ms)</Text>
                </View>
              )}
              {!status.api.connected && (
                <View style={styles.detailRow}>
                  <Icon name="alert-circle" style={{ width: 20, height: 20 }} fill="#EF4444" />
                  <Text style={styles.detailText}>API: {status.api.error}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Layout>
    );
  }

  // Success state - show briefly then continue
  return (
    <Layout style={styles.container} level="2">
      <View style={styles.content}>
        <Logo size="large" />
        <View style={styles.statusContainer}>
          <View style={styles.iconContainer}>
            <Icon name="checkmark-circle" style={{ width: 48, height: 48 }} fill="#10B981" />
          </View>
          <Text style={styles.successTitle}>All Systems Operational</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Icon name="checkmark-circle" style={{ width: 20, height: 20 }} fill="#10B981" />
              <Text style={styles.detailText}>Database: {status.database.latency}ms</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="checkmark-circle" style={{ width: 20, height: 20 }} fill="#10B981" />
              <Text style={styles.detailText}>API: {status.api.latency}ms</Text>
            </View>
          </View>
        </View>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 40,
    paddingHorizontal: 32,
  },
  statusContainer: {
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    marginVertical: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#A8A29E',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EF4444',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#A8A29E',
    textAlign: 'center',
    maxWidth: 300,
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F59E0B',
    textAlign: 'center',
  },
  warningSubtitle: {
    fontSize: 16,
    color: '#A8A29E',
    textAlign: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
    textAlign: 'center',
  },
  detailsContainer: {
    marginTop: 24,
    gap: 12,
    width: '100%',
    maxWidth: 320,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#E7E5E4',
    flex: 1,
  },
});

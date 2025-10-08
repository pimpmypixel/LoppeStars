import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Layout } from '@ui-kitten/components';
import { Text } from '../components/ui-kitten';
import Logo from '../components/Logo';
import { Icon } from '@ui-kitten/components';
import { ConnectivityStatus } from '../utils/connectivityCheck';
import LottieView from 'lottie-react-native';
import { useTranslation } from '../utils/localization';

interface ConnectivitySplashProps {
  status: ConnectivityStatus | null;
  isChecking: boolean;
}

export default function ConnectivitySplash({ status, isChecking }: ConnectivitySplashProps) {
  const { t } = useTranslation();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef<LottieView>(null);

  // Animate progress bar based on connectivity check status
  useEffect(() => {
    if (isChecking) {
      // Simulate progress: 0% -> 50% (database) -> 100% (API)
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
      ]).start();
    } else if (status?.overall === 'healthy') {
      // Complete the progress bar
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isChecking, status, progressAnim]);

  // Play Lottie animation when all systems operational
  useEffect(() => {
    if (status?.overall === 'healthy' && lottieRef.current) {
      lottieRef.current.play();
    }
  }, [status]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Show loading state while checking
  if (isChecking || !status) {
    return (
      <Layout style={styles.container} level="2">
        <View style={styles.content}>
          <Logo size="large" />
          <View style={styles.statusContainer}>
            <Text style={styles.title}>{t('connectivity.checkingConnectivity')}</Text>
            <Text style={styles.subtitle}>{t('connectivity.verifyingServices')}</Text>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBarFill,
                  { width: progressWidth }
                ]} 
              />
            </View>
            
            <View style={styles.stepsContainer}>
              <Text style={styles.stepText}>• {t('connectivity.checkingDatabase')}</Text>
              <Text style={styles.stepText}>• {t('connectivity.checkingAPI')}</Text>
            </View>
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
            <Text style={styles.errorTitle}>{t('connectivity.connectionFailed')}</Text>
            <Text style={styles.errorSubtitle}>
              {t('connectivity.connectionFailedMessage')}
            </Text>
            
            <View style={styles.detailsContainer}>
              {!status.database.connected && (
                <View style={styles.detailRow}>
                  <Icon name="alert-circle" style={{ width: 20, height: 20 }} fill="#EF4444" />
                  <Text style={styles.detailText}>{t('connectivity.database')}: {status.database.error}</Text>
                </View>
              )}
              {!status.api.connected && (
                <View style={styles.detailRow}>
                  <Icon name="alert-circle" style={{ width: 20, height: 20 }} fill="#EF4444" />
                  <Text style={styles.detailText}>{t('connectivity.api')}: {status.api.error}</Text>
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
            <Text style={styles.warningTitle}>{t('connectivity.limitedConnectivity')}</Text>
            <Text style={styles.warningSubtitle}>
              {t('connectivity.limitedConnectivityMessage')}
            </Text>
            
            <View style={styles.detailsContainer}>
              {status.database.connected && (
                <View style={styles.detailRow}>
                  <Icon name="checkmark-circle" style={{ width: 20, height: 20 }} fill="#10B981" />
                  <Text style={styles.detailText}>{t('connectivity.database')}: {t('connectivity.connected')} ({status.database.latency}ms)</Text>
                </View>
              )}
              {!status.database.connected && (
                <View style={styles.detailRow}>
                  <Icon name="alert-circle" style={{ width: 20, height: 20 }} fill="#EF4444" />
                  <Text style={styles.detailText}>{t('connectivity.database')}: {status.database.error}</Text>
                </View>
              )}
              {status.api.connected && (
                <View style={styles.detailRow}>
                  <Icon name="checkmark-circle" style={{ width: 20, height: 20 }} fill="#10B981" />
                  <Text style={styles.detailText}>{t('connectivity.api')}: {t('connectivity.connected')} ({status.api.latency}ms)</Text>
                </View>
              )}
              {!status.api.connected && (
                <View style={styles.detailRow}>
                  <Icon name="alert-circle" style={{ width: 20, height: 20 }} fill="#EF4444" />
                  <Text style={styles.detailText}>{t('connectivity.api')}: {status.api.error}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Layout>
    );
  }

  // Success state - show Lottie animation
  return (
    <Layout style={styles.container} level="2">
      <View style={styles.content}>
        <Logo size="large" />
        <View style={styles.statusContainer}>
          {/* Lottie Animation */}
          <LottieView
            ref={lottieRef}
            source={require('../assets/lottiefiles/thumbsup.json')}
            style={styles.lottieAnimation}
            loop={false}
            autoPlay={false}
          />
          <Text style={styles.successTitle}>{t('connectivity.allSystemsOperational')}</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Icon name="checkmark-circle" style={{ width: 20, height: 20 }} fill="#10B981" />
              <Text style={styles.detailText}>{t('connectivity.database')}: {status.database.latency}ms</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="checkmark-circle" style={{ width: 20, height: 20 }} fill="#10B981" />
              <Text style={styles.detailText}>{t('connectivity.api')}: {status.api.latency}ms</Text>
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
  progressBarContainer: {
    width: 280,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF9500',
    borderRadius: 4,
  },
  stepsContainer: {
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  stepText: {
    fontSize: 13,
    color: '#A8A29E',
  },
  lottieAnimation: {
    width: 120,
    height: 120,
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

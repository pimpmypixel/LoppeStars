import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '../utils/localization';
import { Layout, Text as UIKittenText, Icon } from '@ui-kitten/components';
import AppHeader from '../components/AppHeader';
import Logo from '../components/Logo';
import { Text } from '../components/ui-kitten';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui-kitten/Card';
import { useSelectedMarket } from '../stores/appStore';
import { Button } from '../components/ui-kitten';
import { useNavigation } from '@react-navigation/native';
import FeatureCard from '../components/FeatureCard';
import { supabase } from '../utils/supabase';
// Remove LinearGradient completely to prevent crashes
const LinearGradient = null;

export default function HomeScreen() {
  const { selectedMarket } = useSelectedMarket();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [stats, setStats] = useState({ ratingsCount: 0, marketsCount: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get ratings count
            const { data: ratingsData } = await supabase
        .from('ratings')
        .select('id')

      // Get markets count
      const { count: marketsCount } = await supabase
        .from('markets')
        .select('*', { count: 'exact', head: true });

      setStats({
        ratingsCount: ratingsData?.length || 0,
        marketsCount: marketsCount || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <Layout style={styles.container} level="1">
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Hero Section with Gradient */}
          <View style={styles.heroSection}>
            <Logo size="large" />
            <UIKittenText category="h1" style={styles.welcomeTitle}>
              {t('home.welcome')}
            </UIKittenText>
            <UIKittenText category="s1" appearance="hint" style={styles.subtitle}>
              {t('home.subtitle')}
            </UIKittenText>
          </View>

          {/* Selected Market Display */}
          {selectedMarket && (
            <Card style={styles.selectedMarketCard}>
              {/* <View style={[styles.gradientCard, { backgroundColor: '#FF9500' }]}> */}
                <View style={styles.marketCardContent}>
                  <Icon name="navigation-2" style={styles.iconLarge} fill="#FFFFFF" />
                  <UIKittenText category="h6" style={styles.marketLabel}>
                    {t('home.currentMarket')}
                  </UIKittenText>
                  <UIKittenText category="h4" style={styles.marketName}>
                    {selectedMarket.name}
                  </UIKittenText>
                  {selectedMarket.city && (
                    <UIKittenText category="s1" style={styles.marketCity}>
                      {selectedMarket.city}
                    </UIKittenText>
                  )}
                  <TouchableOpacity
                    style={[styles.rateButton, { marginTop: 10 }]}
                    onPress={() => navigation.navigate('Rating' as never)}
                    activeOpacity={0.8}
                  >
                    <UIKittenText style={styles.rateButtonText}>{t('home.rateStallNow')}</UIKittenText>
                  </TouchableOpacity>
                </View>
              {/* </View> */}
            </Card>
          )}

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Icon name="star-outline" style={styles.iconMedium} fill="#3366FF" />
              <UIKittenText category="h5" style={styles.statNumber}>{stats.ratingsCount.toLocaleString()}</UIKittenText>
              <UIKittenText category="c1" appearance="hint">{t('stats.ratings')}</UIKittenText>
            </View>
            <View style={styles.statCard}>
              <Icon name="trending-up-outline" style={styles.iconMedium} fill="#10B981" />
              <UIKittenText category="h5" style={styles.statNumber}>{stats.marketsCount.toLocaleString()}</UIKittenText>
              <UIKittenText category="c1" appearance="hint">{t('stats.markets')}</UIKittenText>
            </View>
          </View>

          {/* Feature Cards */}
          <View style={styles.featureCards}>
            <FeatureCard
              iconName="info-outline"
              iconColor="#3700ffff"
              title={t('home.rateFinds')}
              description={t('home.rateFindsDescription')}
            />
            <FeatureCard
              iconName="star-outline"
              iconColor="#FF9500"
              title={t('home.rateMarkets')}
              description={t('home.rateMarketsDescription')}
            />
            <FeatureCard
              iconName="camera-outline"
              iconColor="#10B981"
              title={t('home.captureMemories')}
              description={t('home.captureMemoriesDescription')}
            />
            <FeatureCard
              iconName="heart-outline"
              iconColor="#FF3D2E"
              title={t('home.funForEveryone')}
              description={t('home.funForEveryoneDescription')}
            />
          </View>
        </View>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1917',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 60,
  },
  welcomeTitle: {
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    color: '#8F9BB3',
  },
  selectedMarketCard: {
    width: '100%',
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#3366FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    borderWidth: 3,
    borderColor: '#FF9500',
  },
  gradientCard: {
    padding: 24,
    borderRadius: 20,
  },
  marketCardContent: {
    alignItems: 'center',
  },
  marketLabel: {
    marginTop: 12,
    marginBottom: 8,
    color: '#FFFFFF',
    opacity: 0.9,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  marketName: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    color: '#FFFFFF',
  },
  marketCity: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  rateButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 50,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateButtonText: {
    color: '#FF9500',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#292524',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
  },
  statNumber: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  featureCards: {
    width: '100%',
    gap: 16,
  },
  iconLarge: {
    width: 28,
    height: 28,
  },
  iconMedium: {
    width: 24,
    height: 24,
  },
});
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from '../utils/localization';
import { Layout, Text as UIKittenText } from '@ui-kitten/components';
import AppHeader from '../components/AppHeader';
import Logo from '../components/Logo';
import { Text } from '../components/ui-kitten';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui-kitten/Card';
import { Star, Camera, Heart, MapPin, Sparkles, TrendingUp } from 'lucide-react-native';
import { useSelectedMarket } from '../stores/appStore';
import { Button } from '../components/ui-kitten';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const { selectedMarket } = useSelectedMarket();
  const navigation = useNavigation();
  const { t } = useTranslation();

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
              <LinearGradient
                colors={['#FF9500', '#FFCA28']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientCard}
              >
                <View style={styles.marketCardContent}>
                  <MapPin size={28} color="#FFFFFF" />
                  <UIKittenText category="h6" style={styles.marketLabel}>
                    Current Market
                  </UIKittenText>
                  <UIKittenText category="h4" style={styles.marketName}>
                    {selectedMarket.name}
                  </UIKittenText>
                  {selectedMarket.city && (
                    <UIKittenText category="s1" style={styles.marketCity}>
                      {selectedMarket.city}
                    </UIKittenText>
                  )}
                  <Button
                    style={styles.rateButton}
                    onPress={() => navigation.navigate('Rating' as never)}
                  >
                    Rate a Stall Now
                  </Button>
                </View>
              </LinearGradient>
            </Card>
          )}

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Sparkles size={24} color="#3366FF" />
              <UIKittenText category="h5" style={styles.statNumber}>1,234</UIKittenText>
              <UIKittenText category="c1" appearance="hint">Ratings</UIKittenText>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={24} color="#10B981" />
              <UIKittenText category="h5" style={styles.statNumber}>89</UIKittenText>
              <UIKittenText category="c1" appearance="hint">Markets</UIKittenText>
            </View>
          </View>

          {/* Feature Cards */}
          <View style={styles.featureCards}>
            <Card style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <LinearGradient
                  colors={['#FF9500', '#FFCA28']}
                  style={styles.iconGradient}
                >
                  <Star size={28} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <CardHeader>
                <CardTitle style={styles.featureTitle}>{t('home.rateFinds')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription style={styles.featureDescription}>
                  {t('home.rateFindsDescription')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <LinearGradient
                  colors={['#10B981', '#34D399']}
                  style={styles.iconGradient}
                >
                  <Camera size={28} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <CardHeader>
                <CardTitle style={styles.featureTitle}>{t('home.captureMemories')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription style={styles.featureDescription}>
                  {t('home.captureMemoriesDescription')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <LinearGradient
                  colors={['#FF3D2E', '#FF6F61']}
                  style={styles.iconGradient}
                >
                  <Heart size={28} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <CardHeader>
                <CardTitle style={styles.featureTitle}>{t('home.funForEveryone')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription style={styles.featureDescription}>
                  {t('home.funForEveryoneDescription')}
                </CardDescription>
              </CardContent>
            </Card>
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
    borderRadius: 12,
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
  featureCard: {
    marginVertical: 8,
    backgroundColor: '#292524',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.15)',
  },
  featureIconContainer: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8F9BB3',
  },
});
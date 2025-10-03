import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from '../utils/localization';
import { Layout } from '@ui-kitten/components';
import AppHeader from '../components/AppHeader';
import Logo from '../components/Logo';
import { Text } from '../components/ui-kitten';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui-kitten/Card';
import { Star, Camera, Heart, MapPin } from 'lucide-react-native';
import { useSelectedMarket } from '../stores/appStore';
import { Button } from '../components/ui-kitten';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const { selectedMarket } = useSelectedMarket();
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <Layout style={styles.container} level="2">
      <AppHeader title="Loppestars" />

      <ScrollView style={styles.scrollView}>
        <View style={styles.contentContainer}>
          <Logo size="large" />
          <Text variant="h1" style={styles.welcomeTitle}>
            {t('home.welcome')}
          </Text>
          <Text variant="lead" style={styles.subtitle}>
            {t('home.subtitle')}
          </Text>

          {/* Selected Market Display */}
          {selectedMarket && (
            <Card style={styles.selectedMarketCard}>
              <CardHeader style={styles.cardHeaderCentered}>
                <MapPin size={24} color="#f97316" />
                <CardTitle style={styles.cardTitleCentered}>Current Market</CardTitle>
              </CardHeader>
              <CardContent style={styles.cardContentCentered}>
                <Text style={styles.marketName}>
                  {selectedMarket.name}
                </Text>
                {selectedMarket.city && (
                  <Text variant="muted" style={styles.marketCity}>
                    {selectedMarket.city}
                  </Text>
                )}
                <Button
                  style={styles.rateButton}
                  onPress={() => navigation.navigate('Rating' as never)}
                >
                  <Text>Rate a Stall</Text>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Feature Cards */}
          <View style={styles.featureCards}>
            <Card style={{...styles.featureCard, ...styles.blueCard}}>
              <CardHeader style={styles.cardHeaderCentered}>
                <Star size={32} color="#3b82f6" />
                <CardTitle style={styles.featureTitle}>{t('home.rateFinds')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription style={styles.featureDescription}>
                  {t('home.rateFindsDescription')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card style={{...styles.featureCard, ...styles.greenCard}}>
              <CardHeader style={styles.cardHeaderCentered}>
                <Camera size={32} color="#10b981" />
                <CardTitle style={styles.featureTitle}>{t('home.captureMemories')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription style={styles.featureDescription}>
                  {t('home.captureMemoriesDescription')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card style={{...styles.featureCard, ...styles.pinkCard}}>
              <CardHeader style={styles.cardHeaderCentered}>
                <Heart size={32} color="#ef4444" />
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
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  welcomeTitle: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  selectedMarketCard: {
    width: '100%',
    maxWidth: 384,
    backgroundColor: '#fff5ed',
    borderColor: '#fed7aa',
    marginBottom: 24,
  },
  cardHeaderCentered: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  cardTitleCentered: {
    fontSize: 18,
    textAlign: 'center',
  },
  cardContentCentered: {
    alignItems: 'center',
  },
  marketName: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  marketCity: {
    textAlign: 'center',
    marginBottom: 12,
  },
  rateButton: {
    width: '100%',
  },
  featureCards: {
    width: '100%',
    maxWidth: 384,
    gap: 16,
  },
  featureCard: {
    marginVertical: 8,
  },
  blueCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  greenCard: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  pinkCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  featureTitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  featureDescription: {
    textAlign: 'center',
    fontSize: 14,
  },
});
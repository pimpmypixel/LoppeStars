import React from 'react';
import { StyleSheet, Linking, TouchableOpacity, View } from 'react-native';
// Remove LinearGradient to prevent crashes
import { useTranslation } from '../../utils/localization';
import ScreenWrapper from '../../components/ScreenWrapper';
import { Text, Card, CardContent } from '../../components/ui-kitten';

export default function OrganiserScreen() {
  const { t } = useTranslation();

  const handleEmailPress = () => {
    Linking.openURL('mailto:organiser@loppestars.com');
  };

  return (
    <ScreenWrapper title={t('more.organiser')} showBackButton={true}>
      <Card style={styles.card}>
        <CardContent style={styles.cardContent}>
          <Text style={styles.title}>For Loppemarkedsarrangører</Text>

          <Text style={styles.paragraph}>
            Arrangerer du et loppemarked? Loppestars kan hjælpe med at gøre dit event mere succesfuldt
            og engagerende for både sælgere og besøgende.
          </Text>

          <Text style={styles.sectionTitle}>Fordele for dit marked</Text>
          <Text style={styles.paragraph}>
            • Øget besøgsengagement og tilfredshed{'\n'}
            • Bedre feedbacksystem for sælgere{'\n'}
            • Promover kvalitetsboder{'\n'}
            • Tiltrække gentagende besøgende{'\n'}
            • Digital betalingsintegration med MobilePay
          </Text>

          <Text style={styles.sectionTitle}>Sådan kommer du i gang</Text>
          <Text style={styles.paragraph}>
            Vi tilbyder specielle funktioner for markedsarrangører, herunder:
          </Text>
          <Text style={styles.paragraph}>
            • Tilpasset markedsbranding{'\n'}
            • Sælgerstyingsværktøjer{'\n'}
            • Analyser og rapportering{'\n'}
            • Event promoveringsfunktioner
          </Text>

          <Text style={styles.sectionTitle}>Priser</Text>
          <Text style={styles.paragraph}>
            Vores arrangørværktøjer er tilgængelige til konkurrencedygtige priser. Kontakt os for et tilpasset
            tilbud baseret på dit markeds størrelse og behov.
          </Text>

          <TouchableOpacity onPress={handleEmailPress} style={styles.ctaButton}>
            <View style={[styles.gradient, { backgroundColor: '#FFA500' }]}>
              <Text style={styles.ctaText}>Kontakt os for mere info</Text>
            </View>
          </TouchableOpacity>
        </CardContent>
      </Card>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#292524',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.15)',
    borderRadius: 20,
  },
  cardContent: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: '#D4D4D8',
    lineHeight: 24,
    marginBottom: 8,
    textAlign: 'left',
  },
  ctaButton: {
    marginTop: 24,
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  ctaText: {
    color: '#1C1917',
    fontSize: 18,
    fontWeight: '700',
  },
});
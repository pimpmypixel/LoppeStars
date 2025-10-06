import React from 'react';
import { StyleSheet, Linking, TouchableOpacity, View } from 'react-native';
// Remove LinearGradient to prevent crashes
import { useTranslation } from '../../utils/localization';
import ScreenWrapper from '../../components/ScreenWrapper';
import { Text, Card, CardContent } from '../../components/ui-kitten';

export default function AdvertisingScreen() {
  const { t } = useTranslation();

  const handleEmailPress = () => {
    Linking.openURL('mailto:advertising@loppestars.com');
  };

  return (
    <ScreenWrapper title={t('more.advertising')} showBackButton={true}>
      <Card style={styles.card}>
        <CardContent style={styles.cardContent}>
          <Text style={styles.title}>Reklamer med Loppestars</Text>

          <Text style={styles.paragraph}>
            Nå tusindvis af loppemarkedsentusiaster og vintage elskere gennem vores platform.
            Loppestars tilbyder målrettede reklammemuligheder for virksomheder, der stemmer overens med
            vores fællesskabsværdier.
          </Text>

          <Text style={styles.sectionTitle}>Reklammemuligheder</Text>
          <Text style={styles.paragraph}>
            • Sponserede bodfremmelser{'\n'}
            • Banner reklamer i appen{'\n'}
            • Fremhævede markedslistninger{'\n'}
            • Nyhedsbrev sponsorater{'\n'}
            • Event partnerskabsmuligheder
          </Text>

          <Text style={styles.sectionTitle}>Vores publikum</Text>
          <Text style={styles.paragraph}>
            Vores brugere brænder for bæredygtige indkøb, vintage fund, håndlavede håndværk,
            og støtte til lokale virksomheder. De søger aktivt unikke genstande og oplevelser
            på loppemarkeder rundt om i Danmark.
          </Text>

          <Text style={styles.sectionTitle}>Hvorfor reklamere hos os?</Text>
          <Text style={styles.paragraph}>
            • Meget engageret publikum{'\n'}
            • Lokationsbaseret målretning{'\n'}
            • Fokus på bæredygtige indkøb{'\n'}
            • Stærk fællesskabstilstedeværelse{'\n'}
            • Gennemsigtige priser
          </Text>

          <Text style={styles.sectionTitle}>Kom i gang</Text>
          <Text style={styles.paragraph}>
            Kontakt vores reklamehold for at diskutere, hvordan vi kan hjælpe din virksomhed med at nå
            de rigtige kunder på det rigtige tidspunkt.
          </Text>

          <TouchableOpacity onPress={handleEmailPress} style={styles.ctaButton}>
            <View style={[styles.gradient, { backgroundColor: '#FFA500' }]}>
              <Text style={styles.ctaText}>Få reklameinfo</Text>
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
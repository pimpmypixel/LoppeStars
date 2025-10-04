import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from '../../utils/localization';
import ScreenWrapper from '../../components/ScreenWrapper';
import { Text, Card, CardContent } from '../../components/ui-kitten';

export default function AboutScreen() {
  const { t } = useTranslation();

  return (
    <ScreenWrapper title={t('more.about')} showBackButton={true}>
      <Card style={styles.card}>
        <CardContent style={styles.cardContent}>
          <Text style={styles.title}>Om Loppestars</Text>

          <Text style={styles.paragraph}>
            Loppestars er en sjov og nem måde at bedømme boder på dit lokale loppemarked på en venlig måde.
            Hjælp andre besøgende med at opdage de bedste boder og støt lokale sælgere ved at dele dine oplevelser.
          </Text>

          <Text style={styles.paragraph}>
            Vores mission er at gøre loppemarkedsbesøg mere fortryllende ved at forbinde købere med de bedste boder
            og hjælpe sælgere med at forbedre deres tilbud baseret på kunde feedback.
          </Text>

          <Text style={styles.paragraph}>
            Uanset om du leder efter vintage skatte, håndlavede håndværk eller unikke fund, hjælper Loppestars
            dig med at navigere på markedet med selvtillid.
          </Text>

          <Text style={styles.sectionTitle}>Sådan fungerer det</Text>

          <Text style={styles.listText}>
            1. Besøg en bod på dit lokale loppemarked{'\n'}
            2. Tag et foto og bedøm din oplevelse{'\n'}
            3. Del bodens MobilePay info for nemme køb{'\n'}
            4. Hjælp andre med at opdage fantastiske fund!
          </Text>
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
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: '#D4D4D8',
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'left',
  },
  listText: {
    fontSize: 16,
    color: '#D4D4D8',
    lineHeight: 28,
    textAlign: 'left',
  },
});
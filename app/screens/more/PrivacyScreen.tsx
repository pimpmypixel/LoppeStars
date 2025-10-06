import React from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from '../../utils/localization';
import ScreenWrapper from '../../components/ScreenWrapper';
import { Text, Card, CardContent } from '../../components/ui-kitten';

export default function PrivacyScreen() {
  const { t } = useTranslation();

  return (
    <ScreenWrapper title={t('more.privacy')} showBackButton={true}>
      <Card style={styles.card}>
        <CardContent style={styles.cardContent}>
          <Text style={styles.title}>Privatlivspolitik</Text>

          <Text style={styles.sectionTitle}>Oplysninger vi indsamler</Text>
          <Text style={styles.paragraph}>
            Vi indsamler oplysninger, som du giver direkte til os, f.eks. når du opretter en konto,
            bedømmer en bod eller kontakter os. Dette inkluderer din e-mailadresse, billeder du uploader,
            og bedømmelser du indsender.
          </Text>

          <Text style={styles.sectionTitle}>Hvordan vi bruger dine oplysninger</Text>
          <Text style={styles.paragraph}>
            Vi bruger de oplysninger, vi indsamler til at levere, vedligeholde og forbedre vores tjenester,
            behandle transaktioner, sende dig tekniske meddelelser og svare på dine kommentarer og spørgsmål.
          </Text>

          <Text style={styles.sectionTitle}>Deling af oplysninger</Text>
          <Text style={styles.paragraph}>
            Vi sælger, handler eller overfører på anden måde ikke dine personlige oplysninger til tredjeparter
            uden dit samtykke, undtagen som beskrevet i denne politik. Dine bedømmelser og billeder kan
            være synlige for andre brugere af appen.
          </Text>

          <Text style={styles.sectionTitle}>Datasikkerhed</Text>
          <Text style={styles.paragraph}>
            Vi implementerer passende sikkerhedsforanstaltninger for at beskytte dine personlige oplysninger mod
            uautoriseret adgang, ændring, offentliggørelse eller ødelæggelse.
          </Text>

          <Text style={styles.sectionTitle}>Kontakt os</Text>
          <Text style={styles.paragraph}>
            Hvis du har spørgsmål til denne privatlivspolitik, kan du kontakte os på
            privacy@loppestars.com
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
});
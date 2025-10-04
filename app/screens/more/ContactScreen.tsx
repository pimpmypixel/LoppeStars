import React from 'react';
import { StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { useTranslation } from '../../utils/localization';
import ScreenWrapper from '../../components/ScreenWrapper';
import { Text, Card, CardContent } from '../../components/ui-kitten';

export default function ContactScreen() {
  const { t } = useTranslation();

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <ScreenWrapper title={t('more.contact')} showBackButton={true}>
      <Card style={styles.card}>
        <CardContent style={styles.cardContent}>
          <Text style={styles.title}>Kontakt Os</Text>

          <Text style={styles.paragraph}>
            Vi vil gerne høre fra dig! Uanset om du har spørgsmål, feedback eller brug for support,
            er vores team her for at hjælpe.
          </Text>

          <Text style={styles.sectionTitle}>Kontakt os</Text>

          <Card style={styles.contactCard}>
            <CardContent style={styles.contactCardContent}>
              <Text style={styles.contactLabel}>Generel Support</Text>
              <TouchableOpacity onPress={() => handleEmailPress('support@loppestars.com')}>
                <Text style={styles.emailLink}>support@loppestars.com</Text>
              </TouchableOpacity>
            </CardContent>
          </Card>

          <Card style={styles.contactCard}>
            <CardContent style={styles.contactCardContent}>
              <Text style={styles.contactLabel}>Feedback & Forslag</Text>
              <TouchableOpacity onPress={() => handleEmailPress('feedback@loppestars.com')}>
                <Text style={styles.emailLink}>feedback@loppestars.com</Text>
              </TouchableOpacity>
            </CardContent>
          </Card>

          <Card style={styles.contactCard}>
            <CardContent style={styles.contactCardContent}>
              <Text style={styles.contactLabel}>Privatlivsproblemer</Text>
              <TouchableOpacity onPress={() => handleEmailPress('privacy@loppestars.com')}>
                <Text style={styles.emailLink}>privacy@loppestars.com</Text>
              </TouchableOpacity>
            </CardContent>
          </Card>

          <Card style={styles.contactCard}>
            <CardContent style={styles.contactCardContent}>
              <Text style={styles.contactLabel}>Forretningsforespørgsler</Text>
              <TouchableOpacity onPress={() => handleEmailPress('business@loppestars.com')}>
                <Text style={styles.emailLink}>business@loppestars.com</Text>
              </TouchableOpacity>
            </CardContent>
          </Card>

          <Text style={styles.sectionTitle}>Svartid</Text>
          <Text style={styles.paragraph}>
            Vi svarer typisk på alle henvendelser inden for 24-48 timer på arbejdsdage.
            For hastende sager, marker venligst din email som høj prioritet.
          </Text>

          <Text style={styles.sectionTitle}>Kontortider</Text>
          <Text style={styles.paragraph}>
            Mandag - Fredag: 9:00 - 17:00 (CET){'\n'}
            Lørdag - Søndag: Lukket
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
  contactCard: {
    backgroundColor: '#1C1917',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
    borderRadius: 12,
    marginBottom: 12,
  },
  contactCardContent: {
    padding: 16,
  },
  contactLabel: {
    fontSize: 14,
    color: '#A8A29E',
    marginBottom: 6,
  },
  emailLink: {
    fontSize: 16,
    color: '#FF9500',
    fontWeight: '600',
  },
});
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../utils/localization';
import AppHeader from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';

export default function PrivacyScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <AppHeader title={t('more.privacy')} />
      
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
        <Text style={styles.backButtonText}>{t('common.back')}</Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Privatlivspolitik</Text>
          
          <Text style={styles.subtitle}>Oplysninger vi indsamler</Text>
          <Text style={styles.paragraph}>
            Vi indsamler oplysninger, som du giver direkte til os, f.eks. når du opretter en konto, 
            bedømmer en bod eller kontakter os. Dette inkluderer din e-mailadresse, billeder du uploader, 
            og bedømmelser du indsender.
          </Text>
          
          <Text style={styles.subtitle}>Hvordan vi bruger dine oplysninger</Text>
          <Text style={styles.paragraph}>
            Vi bruger de oplysninger, vi indsamler til at levere, vedligeholde og forbedre vores tjenester, 
            behandle transaktioner, sende dig tekniske meddelelser og svare på dine kommentarer og spørgsmål.
          </Text>
          
          <Text style={styles.subtitle}>Deling af oplysninger</Text>
          <Text style={styles.paragraph}>
            Vi sælger, handler eller overfører på anden måde ikke dine personlige oplysninger til tredjeparter 
            uden dit samtykke, undtagen som beskrevet i denne politik. Dine bedømmelser og billeder kan 
            være synlige for andre brugere af appen.
          </Text>
          
          <Text style={styles.subtitle}>Datasikkerhed</Text>
          <Text style={styles.paragraph}>
            Vi implementerer passende sikkerhedsforanstaltninger for at beskytte dine personlige oplysninger mod 
            uautoriseret adgang, ændring, offentliggørelse eller ødelæggelse.
          </Text>
          
          <Text style={styles.subtitle}>Kontakt os</Text>
          <Text style={styles.paragraph}>
            Hvis du har spørgsmål til denne privatlivspolitik, kan du kontakte os på 
            privacy@loppestars.com
          </Text>
        </View>
      </ScrollView>
      
      <AppFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'left',
  },
});
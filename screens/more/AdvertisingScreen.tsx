import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../utils/localization';
import AppHeader from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';

export default function AdvertisingScreen() {
  const navigation = useNavigation();
  
  const handleEmailPress = () => {
    Linking.openURL('mailto:advertising@loppestars.com');
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('more.advertising')} />
      
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
        <Text style={styles.backButtonText}>{t('common.back')}</Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Reklamer med Loppestars</Text>
          
          <Text style={styles.paragraph}>
            Nå tusindvis af loppemarkedsentusiaster og vintage elskere gennem vores platform. 
            Loppestars tilbyder målrettede reklammemuligheder for virksomheder, der stemmer overens med 
            vores fællesskabsværdier.
          </Text>
          
          <Text style={styles.subtitle}>Reklammemuligheder</Text>
          <Text style={styles.bulletPoint}>• Sponserede bodfremmelser</Text>
          <Text style={styles.bulletPoint}>• Banner reklamer i appen</Text>
          <Text style={styles.bulletPoint}>• Fremhævede markedslistninger</Text>
          <Text style={styles.bulletPoint}>• Nyhedsbrev sponsorater</Text>
          <Text style={styles.bulletPoint}>• Event partnerskabsmuligheder</Text>
          
          <Text style={styles.subtitle}>Vores publikum</Text>
          <Text style={styles.paragraph}>
            Vores brugere brænder for bæredygtige indkøb, vintage fund, håndlavede håndværk, 
            og støtte til lokale virksomheder. De søger aktivt unikke genstande og oplevelser 
            på loppemarkeder rundt om i Danmark.
          </Text>
          
          <Text style={styles.subtitle}>Hvorfor reklamere hos os?</Text>
          <Text style={styles.bulletPoint}>• Meget engageret publikum</Text>
          <Text style={styles.bulletPoint}>• Lokationsbaseret målretning</Text>
          <Text style={styles.bulletPoint}>• Fokus på bæredygtige indkøb</Text>
          <Text style={styles.bulletPoint}>• Stærk fællesskabstilstedeværelse</Text>
          <Text style={styles.bulletPoint}>• Gennemsigtige priser</Text>
          
          <Text style={styles.subtitle}>Kom i gang</Text>
          <Text style={styles.paragraph}>
            Kontakt vores reklamehold for at diskutere, hvordan vi kan hjælpe din virksomhed med at nå 
            de rigtige kunder på det rigtige tidspunkt.
          </Text>
          
          <TouchableOpacity style={styles.contactButton} onPress={handleEmailPress}>
            <Text style={styles.contactButtonText}>Få reklameinfo</Text>
          </TouchableOpacity>
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
  bulletPoint: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 8,
    marginLeft: 10,
  },
  contactButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
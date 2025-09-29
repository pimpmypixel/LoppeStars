import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { t } from '../../utils/localization';
import AppHeader from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';

export default function OrganiserScreen() {
  const navigation = useNavigation();
  
  const handleEmailPress = () => {
    Linking.openURL('mailto:organiser@loppestars.com');
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('more.organiser')} />
      
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
        <Text style={styles.backButtonText}>{t('common.back')}</Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>For Loppemarkedsarrangører</Text>
          
          <Text style={styles.paragraph}>
            Arrangerer du et loppemarked? Loppestars kan hjælpe med at gøre dit event mere succesfuldt 
            og engagerende for både sælgere og besøgende.
          </Text>
          
          <Text style={styles.subtitle}>Fordele for dit marked</Text>
          <Text style={styles.bulletPoint}>• Øget besøgsengagement og tilfredshed</Text>
          <Text style={styles.bulletPoint}>• Bedre feedbacksystem for sælgere</Text>
          <Text style={styles.bulletPoint}>• Promover kvalitetsboder</Text>
          <Text style={styles.bulletPoint}>• Tiltrække gentagende besøgende</Text>
          <Text style={styles.bulletPoint}>• Digital betalingsintegration med MobilePay</Text>
          
          <Text style={styles.subtitle}>Sådan kommer du i gang</Text>
          <Text style={styles.paragraph}>
            Vi tilbyder specielle funktioner for markedsarrangører, herunder:
          </Text>
          <Text style={styles.bulletPoint}>• Tilpasset markedsbranding</Text>
          <Text style={styles.bulletPoint}>• Sælgerstyingsværktøjer</Text>
          <Text style={styles.bulletPoint}>• Analyser og rapportering</Text>
          <Text style={styles.bulletPoint}>• Event promoveringsfunktioner</Text>
          
          <Text style={styles.subtitle}>Priser</Text>
          <Text style={styles.paragraph}>
            Vores arrangørværktøjer er tilgængelige til konkurrencedygtige priser. Kontakt os for et tilpasset 
            tilbud baseret på dit markeds størrelse og behov.
          </Text>
          
          <TouchableOpacity style={styles.contactButton} onPress={handleEmailPress}>
            <Text style={styles.contactButtonText}>Kontakt os for mere info</Text>
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
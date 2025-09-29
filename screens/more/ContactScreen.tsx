import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { t } from '../../utils/localization';
import AppHeader from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';

export default function ContactScreen() {
  const navigation = useNavigation();
  
  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('more.contact')} />
      
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
        <Text style={styles.backButtonText}>{t('common.back')}</Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Kontakt Os</Text>
          
          <Text style={styles.paragraph}>
            Vi vil gerne høre fra dig! Uanset om du har spørgsmål, feedback eller brug for support, 
            er vores team her for at hjælpe.
          </Text>
          
          <Text style={styles.subtitle}>Kontakt os</Text>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleEmailPress('support@loppestars.com')}
          >
            <Text style={styles.contactLabel}>Generel Support</Text>
            <Text style={styles.contactValue}>support@loppestars.com</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleEmailPress('feedback@loppestars.com')}
          >
            <Text style={styles.contactLabel}>Feedback & Forslag</Text>
            <Text style={styles.contactValue}>feedback@loppestars.com</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleEmailPress('privacy@loppestars.com')}
          >
            <Text style={styles.contactLabel}>Privatlivsproblemer</Text>
            <Text style={styles.contactValue}>privacy@loppestars.com</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleEmailPress('business@loppestars.com')}
          >
            <Text style={styles.contactLabel}>Forretningsforespørgsler</Text>
            <Text style={styles.contactValue}>business@loppestars.com</Text>
          </TouchableOpacity>
          
          <Text style={styles.subtitle}>Svartid</Text>
          <Text style={styles.paragraph}>
            Vi svarer typisk på alle henvendelser inden for 24-48 timer på arbejdsdage. 
            For hastende sager, marker venligst din email som høj prioritet.
          </Text>
          
          <Text style={styles.subtitle}>Kontortider</Text>
          <Text style={styles.paragraph}>
            Mandag - Fredag: 9:00 - 17:00 (CET){'\n'}
            Lørdag - Søndag: Lukket
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
    marginTop: 25,
    marginBottom: 15,
  },
  paragraph: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'left',
  },
  contactItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contactLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});
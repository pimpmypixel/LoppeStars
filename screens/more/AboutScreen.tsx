import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../utils/localization';
import AppHeader from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';

export default function AboutScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <AppHeader title={t('more.about')} />
      
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
        <Text style={styles.backButtonText}>{t('common.back')}</Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
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
          
          <Text style={styles.subtitle}>Sådan fungerer det</Text>
          <Text style={styles.paragraph}>
            1. Besøg en bod på dit lokale loppemarked{'\n'}
            2. Tag et foto og bedøm din oplevelse{'\n'}
            3. Del bodens MobilePay info for nemme køb{'\n'}
            4. Hjælp andre med at opdage fantastiske fund!
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
    fontSize: 22,
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
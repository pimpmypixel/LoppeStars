import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../utils/localization';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';

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
          <Text style={styles.title}>Advertising with Loppestars</Text>
          
          <Text style={styles.paragraph}>
            Reach thousands of flea market enthusiasts and vintage lovers through our platform. 
            Loppestars offers targeted advertising opportunities for businesses that align with 
            our community values.
          </Text>
          
          <Text style={styles.subtitle}>Advertising Opportunities</Text>
          <Text style={styles.bulletPoint}>• Sponsored stall promotions</Text>
          <Text style={styles.bulletPoint}>• Banner advertisements in the app</Text>
          <Text style={styles.bulletPoint}>• Featured market listings</Text>
          <Text style={styles.bulletPoint}>• Newsletter sponsorships</Text>
          <Text style={styles.bulletPoint}>• Event partnership opportunities</Text>
          
          <Text style={styles.subtitle}>Our Audience</Text>
          <Text style={styles.paragraph}>
            Our users are passionate about sustainable shopping, vintage finds, handmade crafts, 
            and supporting local businesses. They actively seek unique items and experiences 
            at flea markets across Denmark.
          </Text>
          
          <Text style={styles.subtitle}>Why Advertise with Us?</Text>
          <Text style={styles.bulletPoint}>• Highly engaged audience</Text>
          <Text style={styles.bulletPoint}>• Location-based targeting</Text>
          <Text style={styles.bulletPoint}>• Sustainable shopping focus</Text>
          <Text style={styles.bulletPoint}>• Strong community presence</Text>
          <Text style={styles.bulletPoint}>• Transparent pricing</Text>
          
          <Text style={styles.subtitle}>Get Started</Text>
          <Text style={styles.paragraph}>
            Contact our advertising team to discuss how we can help your business reach 
            the right customers at the right time.
          </Text>
          
          <TouchableOpacity style={styles.contactButton} onPress={handleEmailPress}>
            <Text style={styles.contactButtonText}>Get Advertising Info</Text>
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
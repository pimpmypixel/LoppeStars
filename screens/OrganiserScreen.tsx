import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { t } from '../utils/localization';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';

export default function OrganiserScreen() {
  const handleEmailPress = () => {
    Linking.openURL('mailto:organiser@loppestars.com');
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('more.organiser')} />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>For Flea Market Organisers</Text>
          
          <Text style={styles.paragraph}>
            Are you organizing a flea market? Loppestars can help make your event more successful 
            and engaging for both vendors and visitors.
          </Text>
          
          <Text style={styles.subtitle}>Benefits for Your Market</Text>
          <Text style={styles.bulletPoint}>• Increased visitor engagement and satisfaction</Text>
          <Text style={styles.bulletPoint}>• Better feedback system for vendors</Text>
          <Text style={styles.bulletPoint}>• Promote high-quality stalls</Text>
          <Text style={styles.bulletPoint}>• Attract repeat visitors</Text>
          <Text style={styles.bulletPoint}>• Digital payment integration with MobilePay</Text>
          
          <Text style={styles.subtitle}>How to Get Started</Text>
          <Text style={styles.paragraph}>
            We offer special features for market organisers including:
          </Text>
          <Text style={styles.bulletPoint}>• Custom market branding</Text>
          <Text style={styles.bulletPoint}>• Vendor management tools</Text>
          <Text style={styles.bulletPoint}>• Analytics and reporting</Text>
          <Text style={styles.bulletPoint}>• Event promotion features</Text>
          
          <Text style={styles.subtitle}>Pricing</Text>
          <Text style={styles.paragraph}>
            Our organiser tools are available at competitive rates. Contact us for a custom 
            quote based on your market size and needs.
          </Text>
          
          <TouchableOpacity style={styles.contactButton} onPress={handleEmailPress}>
            <Text style={styles.contactButtonText}>Contact Us for More Info</Text>
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
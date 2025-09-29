import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { t } from '../utils/localization';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';

export default function ContactScreen() {
  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('more.contact')} />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Contact Us</Text>
          
          <Text style={styles.paragraph}>
            We'd love to hear from you! Whether you have questions, feedback, or need support, 
            our team is here to help.
          </Text>
          
          <Text style={styles.subtitle}>Get in Touch</Text>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleEmailPress('support@loppestars.com')}
          >
            <Text style={styles.contactLabel}>General Support</Text>
            <Text style={styles.contactValue}>support@loppestars.com</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleEmailPress('feedback@loppestars.com')}
          >
            <Text style={styles.contactLabel}>Feedback & Suggestions</Text>
            <Text style={styles.contactValue}>feedback@loppestars.com</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleEmailPress('privacy@loppestars.com')}
          >
            <Text style={styles.contactLabel}>Privacy Concerns</Text>
            <Text style={styles.contactValue}>privacy@loppestars.com</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleEmailPress('business@loppestars.com')}
          >
            <Text style={styles.contactLabel}>Business Inquiries</Text>
            <Text style={styles.contactValue}>business@loppestars.com</Text>
          </TouchableOpacity>
          
          <Text style={styles.subtitle}>Response Time</Text>
          <Text style={styles.paragraph}>
            We typically respond to all inquiries within 24-48 hours during business days. 
            For urgent matters, please mark your email as high priority.
          </Text>
          
          <Text style={styles.subtitle}>Office Hours</Text>
          <Text style={styles.paragraph}>
            Monday - Friday: 9:00 AM - 5:00 PM (CET){'\n'}
            Saturday - Sunday: Closed
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
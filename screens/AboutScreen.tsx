import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { t } from '../utils/localization';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <AppHeader title={t('more.about')} />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>About Loppestars</Text>
          <Text style={styles.paragraph}>
            Loppestars is a fun and easy way to rate stalls at your local flea market in a friendly way. 
            Help other visitors discover the best stalls and support local vendors by sharing your experiences.
          </Text>
          <Text style={styles.paragraph}>
            Our mission is to make flea market visits more enjoyable by connecting buyers with the best stalls 
            and helping vendors improve their offerings based on customer feedback.
          </Text>
          <Text style={styles.paragraph}>
            Whether you're looking for vintage treasures, handmade crafts, or unique finds, Loppestars helps 
            you navigate the market with confidence.
          </Text>
          
          <Text style={styles.subtitle}>How it Works</Text>
          <Text style={styles.paragraph}>
            1. Visit a stall at your local flea market{'\n'}
            2. Take a photo and rate your experience{'\n'}
            3. Share the stall's MobilePay info for easy purchases{'\n'}
            4. Help others discover great finds!
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
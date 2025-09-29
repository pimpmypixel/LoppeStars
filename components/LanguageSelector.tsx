import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getCurrentLanguage, changeLanguage, t } from '../utils/localization';

interface LanguageSelectorProps {
  onLanguageChange?: () => void;
}

export default function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
  const currentLanguage = getCurrentLanguage();

  const handleLanguageChange = async (language: 'en' | 'da') => {
    await changeLanguage(language);
    if (onLanguageChange) {
      onLanguageChange();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Language / Sprog</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.languageButton,
            currentLanguage === 'en' && styles.activeButton
          ]}
          onPress={() => handleLanguageChange('en')}
        >
          <Text style={[
            styles.buttonText,
            currentLanguage === 'en' && styles.activeButtonText
          ]}>
            English
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.languageButton,
            currentLanguage === 'da' && styles.activeButton
          ]}
          onPress={() => handleLanguageChange('da')}
        >
          <Text style={[
            styles.buttonText,
            currentLanguage === 'da' && styles.activeButtonText
          ]}>
            Dansk
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  languageButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
    minWidth: 80,
  },
  activeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  activeButtonText: {
    color: 'white',
  },
});
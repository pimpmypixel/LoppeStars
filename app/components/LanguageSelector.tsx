import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '../utils/localization';
import { useLanguage } from '../stores/appStore';
import { changeLanguage } from '../utils/localization';
import { Card, CardContent, CardHeader, CardTitle, Text } from './ui-kitten';

interface LanguageSelectorProps {
  onLanguageChange?: () => void;
}

export default function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const handleLanguageChange = async (newLanguage: 'en' | 'da') => {
    await changeLanguage(newLanguage);
    if (onLanguageChange) {
      onLanguageChange();
    }
  };

  return (
    <Card>
      <CardHeader style={styles.headerCenter}>
        <CardTitle style={styles.title}>
          {t('language.selectorTitle')}
        </CardTitle>
        <Text variant="muted" style={styles.subtitle}>
          {t('language.selectorSubtitle')}
        </Text>
      </CardHeader>
      <CardContent>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              language === 'da' ? styles.buttonActive : styles.buttonOutline
            ]}
            onPress={() => handleLanguageChange('da')}
          >
            <Text style={language === 'da' ? styles.textActive : styles.textOutline}>
              {t('language.danish')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              language === 'en' ? styles.buttonActive : styles.buttonOutline
            ]}
            onPress={() => handleLanguageChange('en')}
          >
            <Text style={language === 'en' ? styles.textActive : styles.textOutline}>
              {t('language.english')}
            </Text>
          </TouchableOpacity>
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerCenter: {
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  buttonActive: {
    backgroundColor: '#FF6F00',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF6F00',
  },
  textActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  textOutline: {
    color: '#FF6F00',
    fontWeight: '600',
  },
});
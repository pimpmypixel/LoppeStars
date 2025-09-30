import React from 'react';
import { View } from 'react-native';
import { getCurrentLanguage, changeLanguage, t } from '../utils/localization';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Text } from './ui/text';

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
    <Card>
      <CardHeader className="items-center">
        <CardTitle className="text-base">
          {t('language.selectorTitle') || 'Language / Sprog'}
        </CardTitle>
        <Text variant="muted" className="text-center text-sm">
          {t('language.selectorSubtitle') || 'Choose your preferred language'}
        </Text>
      </CardHeader>
      <CardContent>
        <View className="flex-row justify-center gap-3" {...({} as any)}>
          <Button
            variant={currentLanguage === 'en' ? 'default' : 'outline'}
            className="flex-1 h-10"
            onPress={() => handleLanguageChange('en')}
            {...({} as any)}
          >
            <Text className="font-medium">
              English
            </Text>
          </Button>
          <Button
            variant={currentLanguage === 'da' ? 'default' : 'outline'}
            className="flex-1 h-10"
            onPress={() => handleLanguageChange('da')}
            {...({} as any)}
          >
            <Text className="font-medium">
              Dansk
            </Text>
          </Button>
        </View>
      </CardContent>
    </Card>
  );
}
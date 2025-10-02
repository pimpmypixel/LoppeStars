import React from 'react';
import { View } from 'react-native';
import { useTranslation } from '../utils/localization';
import { useLanguage } from '../stores/appStore';
import { changeLanguage } from '../utils/localization';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Text } from './ui/text';

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
      <CardHeader className="items-center">
        <CardTitle className="text-base">
          {t('language.selectorTitle')}
        </CardTitle>
        <Text variant="muted" className="text-center text-sm">
          {t('language.selectorSubtitle')}
        </Text>
      </CardHeader>
      <CardContent>
        <View className="flex-row justify-center gap-3" {...({} as any)}>
          <Button
            variant={language === 'da' ? 'default' : 'outline'}
            className="flex-1 h-10"
            onPress={() => handleLanguageChange('da')}
            {...({} as any)}
          >
            <Text className="font-medium">
              {t('language.danish')}
            </Text>
          </Button>
          <Button
            variant={language === 'en' ? 'default' : 'outline'}
            className="flex-1 h-10"
            onPress={() => handleLanguageChange('en')}
            {...({} as any)}
          >
            <Text className="font-medium">
              {t('language.english')}
            </Text>
          </Button>
        </View>
      </CardContent>
    </Card>
  );
}
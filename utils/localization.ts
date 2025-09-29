import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../locales/en.json';
import da from '../locales/da.json';

const i18n = new I18n({
  en,
  da,
});

i18n.locale = Localization.getLocales()[0]?.languageCode ?? 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

const STORAGE_KEY = 'user_language';

export const initializeLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
    if (savedLanguage) {
      i18n.locale = savedLanguage;
    } else {
      // Default to Danish for Danish users, English for others
      const deviceLocale = Localization.getLocales()[0]?.languageCode;
      i18n.locale = deviceLocale === 'da' ? 'da' : 'en';
      await AsyncStorage.setItem(STORAGE_KEY, i18n.locale);
    }
  } catch (error) {
    console.error('Error initializing language:', error);
    i18n.locale = 'en';
  }
};

export const changeLanguage = async (language: 'en' | 'da') => {
  try {
    i18n.locale = language;
    await AsyncStorage.setItem(STORAGE_KEY, language);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

export const getCurrentLanguage = () => i18n.locale;

export const t = (key: string, options?: any) => i18n.t(key, options);

export { i18n };
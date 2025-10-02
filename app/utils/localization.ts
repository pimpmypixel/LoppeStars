import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import { useAppStore } from '../stores/appStore';
import { useEffect, useMemo } from 'react';

import en from '../locales/en.json';
import da from '../locales/da.json';

const i18n = new I18n({
  en,
  da,
});

i18n.enableFallback = true;
i18n.defaultLocale = 'da';

// Initialize with default language
i18n.locale = 'da';

export const initializeLanguage = async () => {
  try {
    // Get the language from the global store first
    const { language } = useAppStore.getState();
    if (language) {
      // If language is stored, use it (respect user's choice)
      i18n.locale = language;
    } else {
      // Default to Danish if no language is stored
      i18n.locale = 'da';
      // Update the global store
      useAppStore.getState().setLanguage('da');
    }
  } catch (error) {
    console.error('Error initializing language:', error);
    i18n.locale = 'da';
    useAppStore.getState().setLanguage('da');
  }
};

export const changeLanguage = async (language: 'en' | 'da') => {
  try {
    i18n.locale = language;
    // Update the global store
    useAppStore.getState().setLanguage(language);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

export const getCurrentLanguage = () => {
  // Get language from global store
  return useAppStore.getState().language;
};

// Hook to keep i18n in sync with global language state
export const useLanguageSync = () => {
  const { language } = useAppStore();

  useEffect(() => {
    console.log('useLanguageSync - setting i18n locale to:', language);
    i18n.locale = language;
    console.log('useLanguageSync - i18n locale is now:', i18n.locale);
  }, [language]);

  return language;
};

// Reactive translation hook that triggers re-renders when language changes
export const useTranslation = () => {
  const { language } = useAppStore();

  // Use useMemo to create a new t function when language changes
  // This ensures React sees a different function reference and re-renders components
  const t = useMemo(() => {
    return (key: string, options?: any) => i18n.t(key, options);
  }, [language]);

  return { t, language };
};

export const t = (key: string, options?: any) => i18n.t(key, options);

export { i18n };
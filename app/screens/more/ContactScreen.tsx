import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { View, ScrollView, Linking } from 'react-native';
import { t } from '../../utils/localization';
import AppHeader from '../../components/AppHeader';
import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';

export default function ContactScreen() {
  const navigation = useNavigation();

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <View className="flex-1 bg-[#f5f5f5]" {...({} as any)}>
      <AppHeader title={t('more.contact')} />

      <Button
        variant="ghost"
        className="flex-row items-center mx-5 mt-3 mb-2"
        onPress={() => navigation.goBack()}
        {...({} as any)}
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
        <Text className="ml-2 text-primary">{t('common.back')}</Text>
      </Button>

      <ScrollView className="flex-1" {...({} as any)}>
        <View className="p-5" {...({} as any)}>
          <Text className="text-center text-2xl font-bold text-gray-800 mb-5">
            Kontakt Os
          </Text>

          <Text className="text-base text-gray-600 leading-6 mb-6 text-left">
            Vi vil gerne høre fra dig! Uanset om du har spørgsmål, feedback eller brug for support,
            er vores team her for at hjælpe.
          </Text>

          <Text className="text-xl font-semibold text-gray-800 mt-6 mb-4">
            Kontakt os
          </Text>

          <View className="bg-white rounded-lg p-4 mb-3 border border-gray-200" {...({} as any)}>
            <Text className="text-sm text-gray-500 mb-1">Generel Support</Text>
            <Button
              variant="ghost"
              className="p-0 h-auto justify-start"
              onPress={() => handleEmailPress('support@loppestars.com')}
              {...({} as any)}
            >
              <Text className="text-blue-500 font-medium">support@loppestars.com</Text>
            </Button>
          </View>

          <View className="bg-white rounded-lg p-4 mb-3 border border-gray-200" {...({} as any)}>
            <Text className="text-sm text-gray-500 mb-1">Feedback & Forslag</Text>
            <Button
              variant="ghost"
              className="p-0 h-auto justify-start"
              onPress={() => handleEmailPress('feedback@loppestars.com')}
              {...({} as any)}
            >
              <Text className="text-blue-500 font-medium">feedback@loppestars.com</Text>
            </Button>
          </View>

          <View className="bg-white rounded-lg p-4 mb-3 border border-gray-200" {...({} as any)}>
            <Text className="text-sm text-gray-500 mb-1">Privatlivsproblemer</Text>
            <Button
              variant="ghost"
              className="p-0 h-auto justify-start"
              onPress={() => handleEmailPress('privacy@loppestars.com')}
              {...({} as any)}
            >
              <Text className="text-blue-500 font-medium">privacy@loppestars.com</Text>
            </Button>
          </View>

          <View className="bg-white rounded-lg p-4 mb-6 border border-gray-200" {...({} as any)}>
            <Text className="text-sm text-gray-500 mb-1">Forretningsforespørgsler</Text>
            <Button
              variant="ghost"
              className="p-0 h-auto justify-start"
              onPress={() => handleEmailPress('business@loppestars.com')}
              {...({} as any)}
            >
              <Text className="text-blue-500 font-medium">business@loppestars.com</Text>
            </Button>
          </View>

          <Text className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Svartid
          </Text>
          <Text className="text-base text-gray-600 leading-6 mb-4 text-left">
            Vi svarer typisk på alle henvendelser inden for 24-48 timer på arbejdsdage.
            For hastende sager, marker venligst din email som høj prioritet.
          </Text>

          <Text className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Kontortider
          </Text>
          <Text className="text-base text-gray-600 leading-6 text-left">
            Mandag - Fredag: 9:00 - 17:00 (CET){'\n'}
            Lørdag - Søndag: Lukket
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
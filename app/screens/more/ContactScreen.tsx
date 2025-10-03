import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { View, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { useTranslation } from '../../utils/localization';
import AppHeader from '../../components/AppHeader';
import { Text } from '../../components/ui-kitten';

export default function ContactScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <View className="flex-1 bg-[#f5f5f5]" {...({} as any)}>
      <AppHeader title={t('more.contact')} />

      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 12, marginBottom: 8 }}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
        <Text className="ml-2 text-primary">{t('common.back')}</Text>
      </TouchableOpacity>

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
            <TouchableOpacity
              style={{ padding: 0, justifyContent: 'flex-start' }}
              onPress={() => handleEmailPress('support@loppestars.com')}
            >
              <Text className="text-blue-500 font-medium">support@loppestars.com</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-lg p-4 mb-3 border border-gray-200" {...({} as any)}>
            <Text className="text-sm text-gray-500 mb-1">Feedback & Forslag</Text>
            <TouchableOpacity
              style={{ padding: 0, justifyContent: 'flex-start' }}
              onPress={() => handleEmailPress('feedback@loppestars.com')}
            >
              <Text className="text-blue-500 font-medium">feedback@loppestars.com</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-lg p-4 mb-3 border border-gray-200" {...({} as any)}>
            <Text className="text-sm text-gray-500 mb-1">Privatlivsproblemer</Text>
            <TouchableOpacity
              style={{ padding: 0, justifyContent: 'flex-start' }}
              onPress={() => handleEmailPress('privacy@loppestars.com')}
            >
              <Text className="text-blue-500 font-medium">privacy@loppestars.com</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-lg p-4 mb-6 border border-gray-200" {...({} as any)}>
            <Text className="text-sm text-gray-500 mb-1">Forretningsforespørgsler</Text>
            <TouchableOpacity
              style={{ padding: 0, justifyContent: 'flex-start' }}
              onPress={() => handleEmailPress('business@loppestars.com')}
            >
              <Text className="text-blue-500 font-medium">business@loppestars.com</Text>
            </TouchableOpacity>
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
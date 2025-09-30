import React from 'react';
import { View, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../utils/localization';
import AppHeader from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';
import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';

export default function AboutScreen() {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-[#f5f5f5]" {...({} as any)}>
      <AppHeader title={t('more.about')} />

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
            Om Loppestars
          </Text>

          <Text className="text-base text-gray-600 leading-6 mb-4 text-left">
            Loppestars er en sjov og nem måde at bedømme boder på dit lokale loppemarked på en venlig måde.
            Hjælp andre besøgende med at opdage de bedste boder og støt lokale sælgere ved at dele dine oplevelser.
          </Text>

          <Text className="text-base text-gray-600 leading-6 mb-4 text-left">
            Vores mission er at gøre loppemarkedsbesøg mere fortryllende ved at forbinde købere med de bedste boder
            og hjælpe sælgere med at forbedre deres tilbud baseret på kunde feedback.
          </Text>

          <Text className="text-base text-gray-600 leading-6 mb-6 text-left">
            Uanset om du leder efter vintage skatte, håndlavede håndværk eller unikke fund, hjælper Loppestars
            dig med at navigere på markedet med selvtillid.
          </Text>

          <Text className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Sådan fungerer det
          </Text>

          <Text className="text-base text-gray-600 leading-6 text-left">
            1. Besøg en bod på dit lokale loppemarked{'\n'}
            2. Tag et foto og bedøm din oplevelse{'\n'}
            3. Del bodens MobilePay info for nemme køb{'\n'}
            4. Hjælp andre med at opdage fantastiske fund!
          </Text>
        </View>
      </ScrollView>

      <AppFooter />
    </View>
  );
}
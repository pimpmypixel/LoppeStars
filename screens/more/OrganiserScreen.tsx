import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { View, ScrollView, Linking } from 'react-native';
import { t } from '../../utils/localization';
import AppHeader from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';
import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';

export default function OrganiserScreen() {
  const navigation = useNavigation();

  const handleEmailPress = () => {
    Linking.openURL('mailto:organiser@loppestars.com');
  };

  return (
    <View className="flex-1 bg-[#f5f5f5]" {...({} as any)}>
      <AppHeader title={t('more.organiser')} />

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
            For Loppemarkedsarrangører
          </Text>

          <Text className="text-base text-gray-600 leading-6 mb-4 text-left">
            Arrangerer du et loppemarked? Loppestars kan hjælpe med at gøre dit event mere succesfuldt
            og engagerende for både sælgere og besøgende.
          </Text>

          <Text className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Fordele for dit marked
          </Text>
          <Text className="text-base text-gray-600 leading-6 mb-2 text-left">
            • Øget besøgsengagement og tilfredshed{'\n'}
            • Bedre feedbacksystem for sælgere{'\n'}
            • Promover kvalitetsboder{'\n'}
            • Tiltrække gentagende besøgende{'\n'}
            • Digital betalingsintegration med MobilePay
          </Text>

          <Text className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Sådan kommer du i gang
          </Text>
          <Text className="text-base text-gray-600 leading-6 mb-4 text-left">
            Vi tilbyder specielle funktioner for markedsarrangører, herunder:
          </Text>
          <Text className="text-base text-gray-600 leading-6 mb-4 text-left">
            • Tilpasset markedsbranding{'\n'}
            • Sælgerstyingsværktøjer{'\n'}
            • Analyser og rapportering{'\n'}
            • Event promoveringsfunktioner
          </Text>

          <Text className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Priser
          </Text>
          <Text className="text-base text-gray-600 leading-6 mb-4 text-left">
            Vores arrangørværktøjer er tilgængelige til konkurrencedygtige priser. Kontakt os for et tilpasset
            tilbud baseret på dit markeds størrelse og behov.
          </Text>

          <Button onPress={handleEmailPress} className="mt-4" {...({} as any)}>
            <Text>Kontakt os for mere info</Text>
          </Button>
        </View>
      </ScrollView>

      <AppFooter />
    </View>
  );
}
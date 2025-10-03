import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { View, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { useTranslation } from '../../utils/localization';
import AppHeader from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';
import { Text } from '../../components/ui-kitten';

export default function OrganiserScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const handleEmailPress = () => {
    Linking.openURL('mailto:organiser@loppestars.com');
  };

  return (
    <View className="flex-1 bg-[#f5f5f5]" {...({} as any)}>
      <AppHeader title={t('more.organiser')} />

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

          <TouchableOpacity 
            onPress={handleEmailPress} 
            style={{ marginTop: 16, backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center' }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Kontakt os for mere info</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AppFooter />
    </View>
  );
}
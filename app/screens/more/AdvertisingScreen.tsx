import React from 'react';
import { View, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../utils/localization';
import AppHeader from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';
import { Text } from '../../components/ui-kitten';

export default function AdvertisingScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const handleEmailPress = () => {
    Linking.openURL('mailto:advertising@loppestars.com');
  };

  return (
    <View className="flex-1 bg-[#f5f5f5]" {...({} as any)}>
      <AppHeader title={t('more.advertising')} />

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
            Reklamer med Loppestars
          </Text>

          <Text className="text-base text-gray-600 leading-6 mb-4 text-left">
            Nå tusindvis af loppemarkedsentusiaster og vintage elskere gennem vores platform.
            Loppestars tilbyder målrettede reklammemuligheder for virksomheder, der stemmer overens med
            vores fællesskabsværdier.
          </Text>

          <Text className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Reklammemuligheder
          </Text>
          <Text className="text-base text-gray-600 leading-6 mb-2 text-left">
            • Sponserede bodfremmelser{'\n'}
            • Banner reklamer i appen{'\n'}
            • Fremhævede markedslistninger{'\n'}
            • Nyhedsbrev sponsorater{'\n'}
            • Event partnerskabsmuligheder
          </Text>

          <Text className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Vores publikum
          </Text>
          <Text className="text-base text-gray-600 leading-6 mb-4 text-left">
            Vores brugere brænder for bæredygtige indkøb, vintage fund, håndlavede håndværk,
            og støtte til lokale virksomheder. De søger aktivt unikke genstande og oplevelser
            på loppemarkeder rundt om i Danmark.
          </Text>

          <Text className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Hvorfor reklamere hos os?
          </Text>
          <Text className="text-base text-gray-600 leading-6 mb-4 text-left">
            • Meget engageret publikum{'\n'}
            • Lokationsbaseret målretning{'\n'}
            • Fokus på bæredygtige indkøb{'\n'}
            • Stærk fællesskabstilstedeværelse{'\n'}
            • Gennemsigtige priser
          </Text>

          <Text className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Kom i gang
          </Text>
          <Text className="text-base text-gray-600 leading-6 mb-4 text-left">
            Kontakt vores reklamehold for at diskutere, hvordan vi kan hjælpe din virksomhed med at nå
            de rigtige kunder på det rigtige tidspunkt.
          </Text>

          <TouchableOpacity 
            onPress={handleEmailPress} 
            style={{ marginTop: 16, backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center' }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Få reklameinfo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AppFooter />
    </View>
  );
}
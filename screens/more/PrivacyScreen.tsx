import React from 'react';
import { View, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../utils/localization';
import AppHeader from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';
import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';

export default function PrivacyScreen() {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-[#f5f5f5]" {...({} as any)}>
      <AppHeader title={t('more.privacy')} />

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
            Privatlivspolitik
          </Text>

          <Text className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Oplysninger vi indsamler
          </Text>
          <Text className="text-base text-gray-600 leading-6 mb-4 text-left">
            Vi indsamler oplysninger, som du giver direkte til os, f.eks. når du opretter en konto,
            bedømmer en bod eller kontakter os. Dette inkluderer din e-mailadresse, billeder du uploader,
            og bedømmelser du indsender.
          </Text>

          <Text className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Hvordan vi bruger dine oplysninger
          </Text>
          <Text className="text-base text-gray-600 leading-6 mb-4 text-left">
            Vi bruger de oplysninger, vi indsamler til at levere, vedligeholde og forbedre vores tjenester,
            behandle transaktioner, sende dig tekniske meddelelser og svare på dine kommentarer og spørgsmål.
          </Text>

          <Text className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Deling af oplysninger
          </Text>
          <Text className="text-base text-gray-600 leading-6 mb-4 text-left">
            Vi sælger, handler eller overfører på anden måde ikke dine personlige oplysninger til tredjeparter
            uden dit samtykke, undtagen som beskrevet i denne politik. Dine bedømmelser og billeder kan
            være synlige for andre brugere af appen.
          </Text>

          <Text className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Datasikkerhed
          </Text>
          <Text className="text-base text-gray-600 leading-6 mb-4 text-left">
            Vi implementerer passende sikkerhedsforanstaltninger for at beskytte dine personlige oplysninger mod
            uautoriseret adgang, ændring, offentliggørelse eller ødelæggelse.
          </Text>

          <Text className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Kontakt os
          </Text>
          <Text className="text-base text-gray-600 leading-6 text-left">
            Hvis du har spørgsmål til denne privatlivspolitik, kan du kontakte os på
            privacy@loppestars.com
          </Text>
        </View>
      </ScrollView>

      <AppFooter />
    </View>
  );
}
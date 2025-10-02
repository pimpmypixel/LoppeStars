import React from 'react';
import { View, ScrollView } from 'react-native';
import { useTranslation } from '../utils/localization';
import AppHeader from '../components/AppHeader';
import Logo from '../components/Logo';
import { Text } from '../components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Star, Camera, Heart, MapPin } from 'lucide-react-native';
import { useSelectedMarket } from '../stores/appStore';
import { Button } from '../components/ui/button';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const { selectedMarket } = useSelectedMarket();
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-[#f5f5f5]" {...({} as any)}>
      <AppHeader title="Loppestars" />

      <ScrollView className="flex-1" {...({} as any)}>
        <View className="justify-center items-center px-5 py-8" {...({} as any)}>
          <Logo size="large" />
          <Text variant="h1" className="text-center mt-5 mb-4">
            {t('home.welcome')}
          </Text>
          <Text variant="lead" className="text-center mb-8">
            {t('home.subtitle')}
          </Text>

          {/* Selected Market Display */}
          {selectedMarket && (
            <Card className="w-full max-w-sm bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200 mb-6">
              <CardHeader className="items-center pb-2">
                <MapPin size={24} color="#f97316" />
                <CardTitle className="text-lg text-center">Current Market</CardTitle>
              </CardHeader>
              <CardContent className="items-center">
                <Text className="text-lg font-semibold text-center mb-1">
                  {selectedMarket.name}
                </Text>
                {selectedMarket.city && (
                  <Text className="text-muted-foreground text-center mb-3">
                    {selectedMarket.city}
                  </Text>
                )}
                <Button
                  className="w-full"
                  onPress={() => navigation.navigate('Rating' as never)}
                  {...({} as any)}
                >
                  <Text>Rate a Stall</Text>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Nice introduction section */}
          <View className="w-full max-w-sm gap-4" {...({} as any)}>
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader className="items-center pb-2">
                <Star size={32} color="#3b82f6" />
                <CardTitle className="text-lg text-center">{t('home.rateFinds')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-sm">
                  {t('home.rateFindsDescription')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardHeader className="items-center pb-2">
                <Camera size={32} color="#10b981" />
                <CardTitle className="text-lg text-center">{t('home.captureMemories')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-sm">
                  {t('home.captureMemoriesDescription')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200">
              <CardHeader className="items-center pb-2">
                <Heart size={32} color="#ef4444" />
                <CardTitle className="text-lg text-center">{t('home.funForEveryone')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-sm">
                  {t('home.funForEveryoneDescription')}
                </CardDescription>
              </CardContent>
            </Card>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
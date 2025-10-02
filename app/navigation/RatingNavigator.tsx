import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RatingScreen from '../screens/RatingScreen';
import { useTranslation } from '../utils/localization';
import { useLanguage } from '../stores/appStore';

const Stack = createStackNavigator();

export default function RatingNavigator() {
  const { language } = useLanguage(); // Force re-render when language changes
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="RatingMain" 
        component={RatingScreen}
        options={{
          headerShown: true,
          title: t('navigation.rateStall'),
          headerStyle: {
            backgroundColor: '#f5f5f5',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#374151',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
        }}
      />
    </Stack.Navigator>
  );
}
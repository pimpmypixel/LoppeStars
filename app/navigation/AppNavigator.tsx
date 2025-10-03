import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@ui-kitten/components';
import { useTranslation } from '../utils/localization';
import { useLanguage } from '../stores/appStore';

import HomeScreen from '../screens/HomeScreen';
import MarketsNavigator from './MarketsNavigator';
import RatingNavigator from './RatingNavigator';
import MoreNavigator from './MoreNavigator';
import { NAV_THEME, THEME, useTheme } from '../contexts/ThemeContext';
import { navigationRef } from '../utils/navigation';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const { theme } = useTheme();
  const { language } = useLanguage(); // Force re-render when language changes
  const { t } = useTranslation();

  console.log('AppNavigator - rendering, navigationRef ready:', navigationRef.isReady());

  return (
    <NavigationContainer ref={navigationRef} theme={NAV_THEME[theme]}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: string;
            let iconColor = color;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
              iconColor = focused ? '#FF9500' : '#A78BFA';
            } else if (route.name === 'Markets') {
              iconName = focused ? 'shopping-bag' : 'shopping-bag-outline';
              iconColor = focused ? '#FFCA28' : '#FCD34D';
            } else if (route.name === 'Rating') {
              iconName = focused ? 'star' : 'star-outline';
              iconColor = focused ? '#FF9500' : '#FBBF24';
            } else if (route.name === 'More') {
              iconName = focused ? 'menu' : 'menu-outline';
              iconColor = focused ? '#FF9500' : '#A78BFA';
            } else {
              iconName = 'radio-button-on-outline';
            }

            return <Icon name={iconName} style={{ width: focused ? 30 : 26, height: focused ? 30 : 26 }} fill={iconColor} />;
          },
          tabBarActiveTintColor: THEME[theme].primary,
          tabBarInactiveTintColor: THEME[theme].mutedForeground,
          tabBarStyle: {
            paddingBottom: 12,
            paddingTop: 12,
            height: 90,
            backgroundColor: '#292524',
            borderTopColor: 'rgba(255, 149, 0, 0.15)',
            borderTopWidth: 2,
            shadowColor: '#FF9500',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          },
          headerStyle: {
            backgroundColor: THEME[theme].primary,
          },
          headerTintColor: THEME[theme].primaryForeground,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: t('navigation.home'),
            headerShown: false,
          }}
        />
        <Tab.Screen
          name="Markets"
          component={MarketsNavigator}
          options={{
            title: t('navigation.markets'),
            headerShown: false,
          }}
        />
        <Tab.Screen
          name="Rating"
          component={RatingNavigator}
          options={{
            tabBarLabel: t('navigation.rateStall'),
          }}
        />
        <Tab.Screen
          name="More"
          component={MoreNavigator}
          options={{
            title: t('navigation.more'),
            headerShown: false,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
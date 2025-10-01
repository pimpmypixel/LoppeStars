import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../utils/localization';

import HomeScreen from '../screens/HomeScreen';
import MarketsScreen from '../screens/MarketsScreen';
import RatingScreen from '../screens/RatingScreen';
import MoreNavigator from './MoreNavigator';
import { NAV_THEME, THEME, useTheme } from '../contexts/ThemeContext';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const { theme } = useTheme();

  return (
    <NavigationContainer theme={NAV_THEME[theme]}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;
            let iconColor = color;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
              iconColor = focused ? '#3b82f6' : '#93c5fd'; // Blue
            } else if (route.name === 'Markets') {
              iconName = focused ? 'storefront' : 'storefront-outline';
              iconColor = focused ? '#10b981' : '#6ee7b7'; // Green
            } else if (route.name === 'Add Item') {
              iconName = focused ? 'star' : 'star-outline';
              iconColor = focused ? '#f59e0b' : '#fcd34d'; // Orange/Yellow
            } else if (route.name === 'More') {
              iconName = focused ? 'ellipsis-horizontal-circle' : 'ellipsis-horizontal-circle-outline';
              iconColor = focused ? '#8b5cf6' : '#c4b5fd'; // Purple
            } else {
              iconName = 'ellipse';
            }

            return <Ionicons name={iconName} size={focused ? 36 : 32} color={iconColor} />;
          },
          tabBarActiveTintColor: THEME[theme].primary,
          tabBarInactiveTintColor: THEME[theme].mutedForeground,
          tabBarStyle: {
            paddingBottom: 8,
            paddingTop: 8,
            height: 80,
            backgroundColor: THEME[theme].card,
            borderTopColor: THEME[theme].border,
            borderTopWidth: 2,
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
          component={MarketsScreen}
          options={{
            title: t('navigation.markets'),
            headerShown: false,
          }}
        />
        <Tab.Screen 
          name="Add Item" 
          component={RatingScreen}
          options={{
            title: t('navigation.rateStall'),
            headerShown: false,
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
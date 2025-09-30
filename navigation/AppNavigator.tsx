import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../utils/localization';

import HomeScreen from '../screens/HomeScreen';
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

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Add Item') {
              iconName = focused ? 'star' : 'star-outline';
            } else if (route.name === 'More') {
              iconName = focused ? 'ellipsis-horizontal-circle' : 'ellipsis-horizontal-circle-outline';
            } else {
              iconName = 'ellipse';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: THEME[theme].primary,
          tabBarInactiveTintColor: THEME[theme].mutedForeground,
          tabBarStyle: {
            paddingBottom: 6,
            paddingTop: 6,
            height: 64,
            backgroundColor: THEME[theme].card,
            borderTopColor: THEME[theme].border,
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
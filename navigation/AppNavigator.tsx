import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../utils/localization';

import HomeScreen from '../screens/HomeScreen';
import FormScreen from '../screens/FormScreen';
import MoreNavigator from './MoreNavigator';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Rate Stall') {
              iconName = focused ? 'star' : 'star-outline';
            } else if (route.name === 'More') {
              iconName = focused ? 'ellipsis-horizontal-circle' : 'ellipsis-horizontal-circle-outline';
            } else {
              iconName = 'ellipse';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
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
          name="Rate Stall" 
          component={FormScreen}
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
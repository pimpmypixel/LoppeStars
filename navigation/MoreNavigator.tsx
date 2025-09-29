import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MoreScreen from '../screens/MoreScreen';
import MyRatingsScreen from '../screens/MyRatingsScreen';
import AboutScreen from '../screens/AboutScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import OrganiserScreen from '../screens/OrganiserScreen';
import AdvertisingScreen from '../screens/AdvertisingScreen';
import ContactScreen from '../screens/ContactScreen';

const Stack = createStackNavigator();

export default function MoreNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MoreMain" component={MoreScreen} />
      <Stack.Screen name="MyRatings" component={MyRatingsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Organiser" component={OrganiserScreen} />
      <Stack.Screen name="Advertising" component={AdvertisingScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
    </Stack.Navigator>
  );
}
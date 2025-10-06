import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MoreScreen from '../screens/MoreScreen';
import MyRatingsScreen from '../screens/more/MyRatingsScreen';
import AboutScreen from '../screens/more/AboutScreen';
import PrivacyScreen from '../screens/more/PrivacyScreen';
import OrganiserScreen from '../screens/more/OrganiserScreen';
import AdvertisingScreen from '../screens/more/AdvertisingScreen';
import ContactScreen from '../screens/more/ContactScreen';
import { MoreStackParamList } from '../types/navigation';

const Stack = createStackNavigator<MoreStackParamList>();

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
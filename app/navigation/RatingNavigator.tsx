import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RatingScreen from '../screens/RatingScreen';

const Stack = createStackNavigator();

export default function RatingNavigator() {
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
          title: 'Rate a Stall',
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
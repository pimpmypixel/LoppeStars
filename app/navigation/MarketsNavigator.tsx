import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MarketsScreen from '../screens/MarketsScreen';
import MarketDetailsScreen from '../screens/MarketDetailsScreen';

const Stack = createStackNavigator();

export default function MarketsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MarketsMain" component={MarketsScreen} />
      <Stack.Screen 
        name="MarketDetails" 
        component={MarketDetailsScreen}
        options={({ route }: any) => ({
          headerShown: true,
          title: route.params?.market?.name || 'Market Details',
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
        })}
      />
    </Stack.Navigator>
  );
}
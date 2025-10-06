import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@ui-kitten/components';
import { Text } from '../components/ui-kitten';
import { useTranslation } from '../utils/localization';
import { useLanguage } from '../stores/appStore';
import { RootTabParamList } from '../types/navigation';

import HomeScreen from '../screens/HomeScreen';
import MarketsNavigator from './MarketsNavigator';
import RatingNavigator from './RatingNavigator';
import MoreNavigator from './MoreNavigator';
import { NAV_THEME, THEME, useTheme } from '../contexts/ThemeContext';
import { navigationRef } from '../utils/navigation';

const Tab = createBottomTabNavigator<RootTabParamList>();

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined
          ? options.tabBarLabel
          : options.title !== undefined
          ? options.title
          : route.name;

        const isFocused = state.index === index;

        let iconName: string;
        if (route.name === 'Home') {
          iconName = 'home-outline';
        } else if (route.name === 'Markets') {
          iconName = 'shopping-bag-outline';
        } else if (route.name === 'Rating') {
          iconName = 'star-outline';
        } else if (route.name === 'More') {
          iconName = 'menu-outline';
        } else {
          iconName = 'radio-button-on-outline';
        }

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            <View style={[
              styles.iconContainer,
              isFocused && styles.iconContainerActive
            ]}>
              <Icon
                name={iconName}
                style={styles.tabIcon}
                fill={isFocused ? '#1C1917' : '#A8A29E'}
              />
            </View>
            <Text style={
              isFocused ? styles.tabLabelActive : styles.tabLabel
            }>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function AppNavigator() {
  const { theme } = useTheme();
  const { language } = useLanguage(); // Force re-render when language changes
  const { t } = useTranslation();

  console.log('AppNavigator - rendering, navigationRef ready:', navigationRef.isReady());
  
  // Remove navigation debugging in production
  React.useEffect(() => {
    // Navigation debugging can be added here if needed for development
    if (__DEV__) {
      console.log('AppNavigator - Navigation system ready');
    }
  }, []);

  return (
    <NavigationContainer ref={navigationRef} theme={NAV_THEME[theme]}>
      <Tab.Navigator
        tabBar={props => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: t('navigation.home'),
          }}
        />
        <Tab.Screen
          name="Markets"
          component={MarketsNavigator}
          options={{
            tabBarLabel: t('navigation.markets'),
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
            tabBarLabel: t('navigation.more'),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#292524',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 149, 0, 0.15)',
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(168, 162, 158, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  iconContainerActive: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A8A29E',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#FF9500',
    fontWeight: '700',
  },
});
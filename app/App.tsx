import './global.css';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { MarketProvider } from './contexts/MarketContext';
import AuthWrapper from './components/AuthWrapper';
import { initializeLanguage } from './utils/localization';
import { PortalHost } from '@rn-primitives/portal';

export default function App() {
  useEffect(() => {
    initializeLanguage();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <MarketProvider>
          <View className="flex-1 bg-background" {...({} as any)}>
            <AuthWrapper />
            <StatusBar style="auto" />
          </View>
          <PortalHost />
        </MarketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

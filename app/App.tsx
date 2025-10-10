import { StatusBar } from 'expo-status-bar';
import { View, Alert } from 'react-native';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { MarketProvider } from './contexts/MarketContext';
import { ConnectivityProvider } from './contexts/ConnectivityContext';
import AuthWrapper from './components/AuthWrapper';
import { useLanguageSync } from './utils/localization';
import Config from 'react-native-config';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { lightTheme, darkTheme } from './theme/theme.config';
import { useTheme } from './contexts/ThemeContext';

function AppContent() {
  // Keep i18n in sync with global language state
  useLanguageSync();
  const { theme } = useTheme();

  return (
    <ApplicationProvider {...eva} theme={theme === 'dark' ? { ...eva.dark, ...require('./theme/custom-theme.json') } : { ...eva.light, ...require('./theme/custom-theme.json') }}>
      <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1C1917' : '#FFFFFF' }}>
        <AuthWrapper />
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      </View>
    </ApplicationProvider>
  );
}

export default function App() {
  return (
    <>
      <IconRegistry icons={EvaIconsPack} />
      <ThemeProvider>
        <ConnectivityProvider>
          <AuthProvider>
            <MarketProvider>
              <AppContent />
            </MarketProvider>
          </AuthProvider>
        </ConnectivityProvider>
      </ThemeProvider>
    </>
  );
}

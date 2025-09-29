import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AuthWrapper from './components/AuthWrapper';
import { initializeLanguage } from './utils/localization';

export default function App() {
  useEffect(() => {
    initializeLanguage();
  }, []);

  return (
    <AuthProvider>
      <View style={styles.container}>
        <AuthWrapper />
        <StatusBar style="auto" />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

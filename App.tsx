import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import AuthWrapper from './components/AuthWrapper';
import { initializeLanguage } from './utils/localization';

export default function App() {
  useEffect(() => {
    initializeLanguage();
  }, []);

  return (
    <View style={styles.container}>
      <AuthWrapper />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

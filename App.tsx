import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import AuthWrapper from './components/AuthWrapper';

export default function App() {
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

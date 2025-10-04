import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from '@ui-kitten/components';
import { useTranslation } from '../utils/localization';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { Text } from './ui-kitten';

interface ScreenWrapperProps {
  title: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  showFooter?: boolean;
}

export default function ScreenWrapper({ 
  title, 
  children, 
  showBackButton = true,
  showFooter = false 
}: ScreenWrapperProps) {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <AppHeader title={title} />
      
      {showBackButton && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" style={styles.backIcon} fill="#FF9500" />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {children}
        </View>
      </ScrollView>

      {showFooter && <AppFooter />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1917',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  backText: {
    marginLeft: 8,
    color: '#FF9500',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
});

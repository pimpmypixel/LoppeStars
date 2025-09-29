import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import { Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { t } from './localization';

const PERMISSIONS_STORAGE_KEY = 'permissions_granted';

interface PermissionsStatus {
  camera: boolean;
  location: boolean;
}

export const getStoredPermissions = async (): Promise<PermissionsStatus> => {
  try {
    const stored = await AsyncStorage.getItem(PERMISSIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : { camera: false, location: false };
  } catch (error) {
    console.error('Error getting stored permissions:', error);
    return { camera: false, location: false };
  }
};

export const storePermissions = async (permissions: PermissionsStatus) => {
  try {
    await AsyncStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(permissions));
  } catch (error) {
    console.error('Error storing permissions:', error);
  }
};

export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Camera.requestCameraPermissionsAsync();
    const granted = status === 'granted';
    
    if (!granted) {
      Alert.alert(
        t('permissions.camera.title'),
        t('permissions.camera.denied'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.ok'), onPress: () => Linking.openSettings() }
        ]
      );
    } else {
      // Update stored permissions
      const stored = await getStoredPermissions();
      await storePermissions({ ...stored, camera: true });
    }
    
    return granted;
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
};

export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    
    if (!granted) {
      Alert.alert(
        t('permissions.location.title'),
        t('permissions.location.denied'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.ok'), onPress: () => Linking.openSettings() }
        ]
      );
    } else {
      // Update stored permissions
      const stored = await getStoredPermissions();
      await storePermissions({ ...stored, location: true });
    }
    
    return granted;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

export const checkCameraPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Camera.getCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return false;
  }
};

export const checkLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking location permission:', error);
    return false;
  }
};

export const requestAllPermissions = async (): Promise<PermissionsStatus> => {
  const [camera, location] = await Promise.all([
    requestCameraPermission(),
    requestLocationPermission()
  ]);
  
  const permissions = { camera, location };
  await storePermissions(permissions);
  
  return permissions;
};
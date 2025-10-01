import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export function navigate(name: string, params?: any) {
  console.log('Navigation service - navigate called:', { name, params, isReady: navigationRef.isReady() });
  if (navigationRef.isReady()) {
    try {
      navigationRef.navigate(name, params);
      console.log('Navigation service - navigate successful');
    } catch (error) {
      console.error('Navigation service - navigate failed:', error);
      throw error;
    }
  } else {
    console.error('Navigation service - navigation ref not ready');
    throw new Error('Navigation ref not ready');
  }
}

export function reset(routes: any[]) {
  console.log('Navigation service - reset called:', { routes, isReady: navigationRef.isReady() });
  if (navigationRef.isReady()) {
    try {
      navigationRef.reset({
        index: 0,
        routes,
      });
      console.log('Navigation service - reset successful');
    } catch (error) {
      console.error('Navigation service - reset failed:', error);
      throw error;
    }
  } else {
    console.error('Navigation service - navigation ref not ready for reset');
    throw new Error('Navigation ref not ready for reset');
  }
}
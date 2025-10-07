import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './ui-kitten';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onHide?: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', duration = 3000, onHide }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(50));

  useEffect(() => {
    // Fade in and slide up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onHide) onHide();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'info':
        return '#3366FF';
      default:
        return '#10B981';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'info':
        return 'information-circle';
      default:
        return 'checkmark-circle';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <Ionicons name={getIcon()} size={24} color="#FFFFFF" style={styles.icon} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

// Toast Manager Component
interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

let showToastCallback: ((message: string, type?: 'success' | 'error' | 'info') => void) | null = null;

export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  if (showToastCallback) {
    showToastCallback(message, type);
  }
};

export const ToastContainer: React.FC = () => {
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    showToastCallback = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      setToast({ visible: true, message, type });
    };

    return () => {
      showToastCallback = null;
    };
  }, []);

  if (!toast.visible) return null;

  return (
    <Toast
      message={toast.message}
      type={toast.type}
      onHide={() => setToast({ ...toast, visible: false })}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default Toast;

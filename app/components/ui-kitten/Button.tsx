import React from 'react';
import { Button as UIKittenButton, ButtonProps as UIKittenButtonProps } from '@ui-kitten/components';
import { StyleSheet, ViewStyle, TouchableOpacityProps } from 'react-native';

export interface ButtonProps extends Partial<UIKittenButtonProps> {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'small' | 'medium' | 'large' | 'tiny' | 'giant';
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
}

export function Button({ 
  children, 
  variant = 'default', 
  size = 'medium',
  style,
  onPress,
  disabled,
  ...props 
}: ButtonProps) {
  // Map variants to UI Kitten appearances and statuses
  const getAppearance = () => {
    switch (variant) {
      case 'outline':
        return 'outline';
      case 'ghost':
      case 'link':
        return 'ghost';
      default:
        return 'filled';
    }
  };

  const getStatus = () => {
    switch (variant) {
      case 'destructive':
        return 'danger';
      case 'secondary':
        return 'basic';
      default:
        return 'primary';
    }
  };

  return (
    <UIKittenButton
      appearance={getAppearance()}
      status={getStatus()}
      size={size}
      style={[styles.button, style]}
      onPress={onPress}
      disabled={disabled}
      {...props}
    >
      {children}
    </UIKittenButton>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    marginVertical: 4,
  },
});

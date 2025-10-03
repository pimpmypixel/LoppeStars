import React from 'react';
import { Text as UIKittenText, TextProps as UIKittenTextProps } from '@ui-kitten/components';
import { StyleSheet, TextStyle } from 'react-native';

export interface TextProps extends Partial<UIKittenTextProps> {
  children: React.ReactNode;
  variant?: 'default' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'lead' | 'muted' | 'small';
  className?: string;
  style?: TextStyle;
}

export function Text({ 
  children, 
  variant = 'default',
  style,
  ...props 
}: TextProps) {
  const getCategory = () => {
    switch (variant) {
      case 'h1':
        return 'h1';
      case 'h2':
        return 'h2';
      case 'h3':
        return 'h3';
      case 'h4':
        return 'h4';
      case 'h5':
        return 'h5';
      case 'h6':
        return 'h6';
      case 'lead':
        return 'p1';
      case 'muted':
        return 's1';
      case 'small':
        return 'c1';
      default:
        return 'p1';
    }
  };

  const getAppearance = () => {
    if (variant === 'muted') {
      return 'hint';
    }
    return 'default';
  };

  return (
    <UIKittenText 
      category={getCategory()}
      appearance={getAppearance()}
      style={style}
      {...props}
    >
      {children}
    </UIKittenText>
  );
}

const styles = StyleSheet.create({
  text: {
    // Default styles if needed
  },
});

import React from 'react';
import { Input as UIKittenInput, InputProps as UIKittenInputProps, Text } from '@ui-kitten/components';
import { StyleSheet, View, TextInputProps, ViewStyle } from 'react-native';

export interface InputProps extends Partial<UIKittenInputProps> {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: TextInputProps['keyboardType'];
  style?: ViewStyle;
  className?: string;
  id?: string;
}

export function Input({ 
  placeholder, 
  value, 
  onChangeText, 
  multiline,
  numberOfLines,
  keyboardType,
  style,
  ...props 
}: InputProps) {
  return (
    <UIKittenInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      textStyle={multiline ? { minHeight: numberOfLines ? numberOfLines * 20 : 60 } : undefined}
      keyboardType={keyboardType}
      style={[styles.input, style]}
      {...props}
    />
  );
}

export interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  style?: any;
}

export function Label({ children, style }: LabelProps) {
  return (
    <Text category="label" style={[styles.label, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  input: {
    marginVertical: 4,
    borderRadius: 8,
  },
  label: {
    marginBottom: 2,
    marginLeft: '3%',
    fontWeight: '600',
  },
});

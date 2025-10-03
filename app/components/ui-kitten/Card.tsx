import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Card as UIKittenCard, Text } from '@ui-kitten/components';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return (
    <UIKittenCard style={[styles.card, style]}>
      {children}
    </UIKittenCard>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardHeader({ children, style }: CardHeaderProps) {
  return <View style={[styles.header, style]}>{children}</View>;
}

interface CardTitleProps {
  children: React.ReactNode;
  style?: any;
}

export function CardTitle({ children, style }: CardTitleProps) {
  return (
    <Text category="h6" style={[styles.title, style]}>
      {children}
    </Text>
  );
}

interface CardDescriptionProps {
  children: React.ReactNode;
  style?: any;
}

export function CardDescription({ children, style }: CardDescriptionProps) {
  return (
    <Text category="s1" appearance="hint" style={style}>
      {children}
    </Text>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardContent({ children, style }: CardContentProps) {
  return <View style={[styles.content, style]}>{children}</View>;
}

interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardFooter({ children, style }: CardFooterProps) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 20,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.15)',
    backgroundColor: '#292524',
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.3,
    color: '#FFFFFF',
  },
  content: {
    paddingVertical: 4,
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Icon } from '@ui-kitten/components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui-kitten/Card';

interface FeatureCardProps {
  iconName: string;
  iconColor: string;
  title: string;
  description: string;
}

export default function FeatureCard({ iconName, iconColor, title, description }: FeatureCardProps) {
  return (
    <Card style={styles.featureCard}>
      <CardHeader style={styles.cardHeader}>
        <View style={styles.headerRow}>
          <View style={styles.featureIconContainer}>
            <View style={[styles.iconGradient, { backgroundColor: iconColor }]}>
              <Icon name={iconName} style={styles.iconLarge} fill="#FFFFFF" />
            </View>
          </View>
          <CardTitle style={styles.featureTitle}>{title}</CardTitle>
        </View>
      </CardHeader>
      <CardContent>
        <CardDescription style={styles.featureDescription}>
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  featureCard: {
    marginVertical: 8,
    backgroundColor: '#292524',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.15)',
  },
  cardHeader: {
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIconContainer: {
    alignSelf: 'flex-start',
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8F9BB3',
    marginTop: 8,
  },
  iconLarge: {
    width: 28,
    height: 28,
  },
});
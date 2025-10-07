import React, { useMemo } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Icon } from '@ui-kitten/components';
import { useTranslation } from '../utils/localization';
import { Text } from './ui-kitten';

interface RatingSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function RatingSlider({ value, onValueChange, min = 1, max = 10 }: RatingSliderProps) {
  const { t } = useTranslation();
  const ratingConfig = useMemo(() => {
    if (value <= 2) {
      return { color: '#ef4444', labelKey: 'formRating.terrible', iconName: 'smiling-face-outline' };
    }
    if (value <= 4) {
      return { color: '#f97316', labelKey: 'formRating.poor', iconName: 'smiling-face-outline' };
    }
    if (value <= 6) {
      return { color: '#eab308', labelKey: 'formRating.average', iconName: 'smiling-face' };
    }
    if (value <= 8) {
      return { color: '#22c55e', labelKey: 'formRating.great', iconName: 'smiling-face' };
    }
    return { color: '#FF9500', labelKey: 'formRating.amazing', iconName: 'star' };
  }, [value]);

  const stars = useMemo(() => Array.from({ length: max }, (_, index) => index + 1), [max]);

  return (
    <View style={styles.container}>
      <View style={styles.ratingDisplay}>
        <View style={styles.ratingRow}>
          <Icon name={ratingConfig.iconName} style={styles.ratingIcon} fill={ratingConfig.color} />
          <Text style={{ ...styles.ratingValue, color: ratingConfig.color }}>
            {value}/10
          </Text>
        </View>
        <Text style={{ ...styles.ratingLabel, color: ratingConfig.color }}>
          {t(ratingConfig.labelKey)}
        </Text>
      </View>

      <View style={styles.starsContainer}>
        {stars.map((star) => (
          <Pressable
            key={star}
            style={styles.starButton}
            onPress={() => onValueChange(star)}
            accessibilityRole="button"
            accessibilityState={{ selected: star <= value }}
          >
            <Icon
              name={star <= value ? 'star' : 'star-outline'}
              style={styles.starIcon}
              fill={star <= value ? ratingConfig.color : '#94a3b8'}
            />
          </Pressable>
        ))}
      </View>

      <View style={styles.minMaxRow}>
        <Text variant="muted" style={styles.minMaxText}>{min}</Text>
        <Text variant="muted" style={styles.minMaxText}>{max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingVertical: 20,
  },
  ratingDisplay: {
    alignItems: 'center',
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  ratingIcon: {
    width: 28,
    height: 28,
  },
  starsContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    gap: 4,
  },
  starButton: {
    height: 36,
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starIcon: {
    width: 28,
    height: 28,
  },
  minMaxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  minMaxText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
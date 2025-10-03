import React, { useMemo } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Frown, Laugh, Meh, Smile, Sparkles, Star } from 'lucide-react-native';
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
      return { color: '#ef4444', labelKey: 'formRating.terrible', Icon: Frown };
    }
    if (value <= 4) {
      return { color: '#f97316', labelKey: 'formRating.poor', Icon: Meh };
    }
    if (value <= 6) {
      return { color: '#eab308', labelKey: 'formRating.average', Icon: Smile };
    }
    if (value <= 8) {
      return { color: '#22c55e', labelKey: 'formRating.great', Icon: Laugh };
    }
    return { color: '#0ea5e9', labelKey: 'formRating.amazing', Icon: Sparkles };
  }, [value]);

  const stars = useMemo(() => Array.from({ length: max }, (_, index) => index + 1), [max]);

  return (
    <View style={styles.container}>
      <View style={styles.ratingDisplay}>
        <View style={styles.ratingRow}>
          <ratingConfig.Icon size={28} color={ratingConfig.color} />
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
            <Star
              size={26}
              color={star <= value ? ratingConfig.color : '#94a3b8'}
              fill={star <= value ? ratingConfig.color : 'transparent'}
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
  starsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  starButton: {
    height: 48,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
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
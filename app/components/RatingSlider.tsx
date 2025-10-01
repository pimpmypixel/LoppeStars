import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Frown, Laugh, Meh, Smile, Sparkles, Star } from 'lucide-react-native';
import { t } from '../utils/localization';
import { Text } from './ui/text';

interface RatingSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function RatingSlider({ value, onValueChange, min = 1, max = 10 }: RatingSliderProps) {
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
    <View className="gap-4 py-5" {...({} as any)}>
      <View className="items-center gap-2" {...({} as any)}>
        <View className="flex-row items-center gap-2" {...({} as any)}>
          <ratingConfig.Icon size={28} color={ratingConfig.color} />
          <Text className="text-2xl font-bold" style={{ color: ratingConfig.color }}>
            {value}/10
          </Text>
        </View>
        <Text className="text-base font-semibold" style={{ color: ratingConfig.color }}>
          {t(ratingConfig.labelKey)}
        </Text>
      </View>

      <View className="flex-row flex-wrap justify-center gap-3" {...({} as any)}>
        {stars.map((star) => (
          <Pressable
            key={star}
            className="h-12 w-12 items-center justify-center rounded-full border border-border bg-background"
            onPress={() => onValueChange(star)}
            accessibilityRole="button"
            accessibilityState={{ selected: star <= value }}
            {...({} as any)}
          >
            <Star
              size={26}
              color={star <= value ? ratingConfig.color : '#94a3b8'}
              fill={star <= value ? ratingConfig.color : 'transparent'}
            />
          </Pressable>
        ))}
      </View>

      <View className="flex-row justify-between px-3" {...({} as any)}>
        <Text className="text-sm font-medium text-muted-foreground">{min}</Text>
        <Text className="text-sm font-medium text-muted-foreground">{max}</Text>
      </View>
    </View>
  );
}
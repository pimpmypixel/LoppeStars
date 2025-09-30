import React from 'react';
import { View } from 'react-native';
import Slider from '@react-native-community/slider';
import { t } from '../utils/localization';
import { Text } from './ui/text';

interface RatingSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function RatingSlider({ value, onValueChange, min = 1, max = 10 }: RatingSliderProps) {
  const getRatingConfig = (rating: number) => {
    if (rating <= 2) {
      return { className: 'text-red-500', color: '#ef4444', emoji: '😞', label: 'Dårlig' };
    }
    if (rating <= 4) {
      return { className: 'text-orange-500', color: '#f97316', emoji: '😐', label: 'Middelmådig' };
    }
    if (rating <= 6) {
      return { className: 'text-yellow-500', color: '#eab308', emoji: '🙂', label: 'God' };
    }
    if (rating <= 8) {
      return { className: 'text-lime-500', color: '#84cc16', emoji: '😊', label: 'Virkelig god' };
    }
    return { className: 'text-emerald-500', color: '#10b981', emoji: '🤩', label: 'Fremragende' };
  };

  const ratingConfig = getRatingConfig(value);

  return (
    <View className="py-5" {...({} as any)}>
      <View className="items-center mb-4" {...({} as any)}>
        <Text className={`text-3xl font-bold ${ratingConfig.className}`}>
          {ratingConfig.emoji} {value}/10
        </Text>
        <Text className={`text-base font-semibold mt-2 ${ratingConfig.className}`}>
          {ratingConfig.label}
        </Text>
      </View>

      <View className="px-2" {...({} as any)}>
        <Slider
          style={{ height: 60, marginVertical: 8 }}
          minimumValue={min}
          maximumValue={max}
          value={value}
          step={1}
          onValueChange={onValueChange}
          minimumTrackTintColor={ratingConfig.color}
          maximumTrackTintColor="#e0e0e0"
          thumbTintColor={ratingConfig.color}
        />
      </View>

      <View className="flex-row justify-between px-2" {...({} as any)}>
        <Text className="text-sm text-muted-foreground font-medium">{min}</Text>
        <Text className="text-sm text-muted-foreground font-medium">{max}</Text>
      </View>
    </View>
  );
}
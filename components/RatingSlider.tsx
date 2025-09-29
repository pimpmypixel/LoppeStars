import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { t } from '../utils/localization';

interface RatingSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function RatingSlider({ value, onValueChange, min = 1, max = 10 }: RatingSliderProps) {
  const getRatingColor = (rating: number) => {
    if (rating <= 3) return '#ff3b30'; // Red
    if (rating <= 6) return '#ff9500'; // Orange
    if (rating <= 8) return '#ffcc00'; // Yellow
    return '#34c759'; // Green
  };

  const getRatingEmoji = (rating: number) => {
    if (rating <= 2) return '😞';
    if (rating <= 4) return '😐';
    if (rating <= 6) return '🙂';
    if (rating <= 8) return '😊';
    return '🤩';
  };

  const getRatingText = (rating: number) => {
    if (rating <= 2) return 'Poor';
    if (rating <= 4) return 'Fair';
    if (rating <= 6) return 'Good';
    if (rating <= 8) return 'Great';
    return 'Excellent';
  };

  return (
    <View style={styles.container}>
      <View style={styles.valueContainer}>
        <Text style={[styles.valueText, { color: getRatingColor(value) }]}>
          {getRatingEmoji(value)} {value}/10
        </Text>
        <Text style={[styles.ratingText, { color: getRatingColor(value) }]}>
          {getRatingText(value)}
        </Text>
      </View>
      
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          value={value}
          step={1}
          onValueChange={onValueChange}
          minimumTrackTintColor={getRatingColor(value)}
          maximumTrackTintColor="#e0e0e0"
          thumbTintColor={getRatingColor(value)}
        />
      </View>
      
      <View style={styles.scaleContainer}>
        <Text style={styles.scaleText}>{min}</Text>
        <Text style={styles.scaleText}>{max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  valueContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  valueText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 5,
  },
  sliderContainer: {
    paddingHorizontal: 10,
  },
  slider: {
    height: 50,
    marginVertical: 10,
  },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  scaleText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
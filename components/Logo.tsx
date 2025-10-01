import React from 'react';
import { Image, View } from 'react-native';
import { cn } from '../lib/utils';
import { LogoProps } from '../types/components/Logo';

export default function Logo({ size = 'medium', style }: LogoProps) {
  const sizeClasses: Record<Required<LogoProps>['size'], string> = {
    small: 'h-10 w-10',
    medium: 'h-20 w-20',
    large: 'h-32 w-32',
  };

  return (
    <View className="items-center justify-center" {...({} as any)}>
      <Image
        source={require('../assets/logo.png')}
        className={cn('object-contain', sizeClasses[size])}
        resizeMode="contain"
        style={style}
      />
    </View>
  );
}
import React from 'react';
import { View } from 'react-native';
import { Text } from './ui/text';

interface AppHeaderProps {
  title: string;
}

export default function AppHeader({ title }: AppHeaderProps) {
  return (
    <View
      className="bg-primary pt-14 pb-5 px-5 items-center border-b border-border shadow-sm shadow-black/5"
      {...({} as any)}
    >
      <Text
        variant="h4"
        className="text-primary-foreground font-semibold tracking-tight"
      >
        {title}
      </Text>
    </View>
  );
}
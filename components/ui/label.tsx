import { cn } from '../../lib/utils';
import * as LabelPrimitive from '@rn-primitives/label';
import { Platform } from 'react-native';

interface LabelProps extends LabelPrimitive.TextProps, React.RefAttributes<LabelPrimitive.TextRef> {
  className?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  disabled?: boolean;
}

function Label({
  className,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: LabelProps) {
  return (
    <LabelPrimitive.Root
      className={cn(
        'flex select-none flex-row items-center gap-2',
        Platform.select({
          web: 'cursor-default leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
        }),
        disabled && 'opacity-50'
      )}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      {...({} as any)}>
      <LabelPrimitive.Text
        className={cn(
          'text-foreground text-sm font-medium',
          Platform.select({ web: 'leading-none' }),
          className
        )}
        {...(props as any)}
      />
    </LabelPrimitive.Root>
  );
}

export { Label };
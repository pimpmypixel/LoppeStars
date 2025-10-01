import { Text, TextClassContext } from './text';
import { cn } from '../../lib/utils';
import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  className?: string;
}

function Card({ className, ...props }: CardProps & React.RefAttributes<View>) {
  return (
    <TextClassContext.Provider value="text-card-foreground">
      <View
        className={cn(
          'bg-card border-border flex flex-col gap-6 rounded-xl border py-6 shadow-sm shadow-black/5',
          className
        )}
        {...(props as any)}
      />
    </TextClassContext.Provider>
  );
}

interface CardHeaderProps extends ViewProps {
  className?: string;
}

function CardHeader({ className, ...props }: CardHeaderProps & React.RefAttributes<View>) {
  return <View className={cn('flex flex-col gap-1.5 px-6', className)} {...(props as any)} />;
}

function CardTitle({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<Text>) {
  return (
    <Text
      role="heading"
      aria-level={3}
      className={cn('font-semibold leading-none', className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<Text>) {
  return <Text className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

interface CardContentProps extends ViewProps {
  className?: string;
}

function CardContent({ className, ...props }: CardContentProps & React.RefAttributes<View>) {
  return <View className={cn('px-6', className)} {...(props as any)} />;
}

interface CardFooterProps extends ViewProps {
  className?: string;
}

function CardFooter({ className, ...props }: CardFooterProps & React.RefAttributes<View>) {
  return <View className={cn('flex flex-row items-center px-6', className)} {...(props as any)} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
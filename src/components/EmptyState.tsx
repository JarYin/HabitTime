import { Text, View } from 'react-native';

interface EmptyStateProps {
  emoji: string;
  message: string;
}

export default function EmptyState({ emoji, message }: EmptyStateProps) {
  return (
    <View className="items-center justify-center px-10 py-16">
      <Text className="mb-3 text-5xl">{emoji}</Text>
      <Text className="text-center text-base leading-6 text-muted">{message}</Text>
    </View>
  );
}

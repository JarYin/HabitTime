import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
}

/** สถานะว่าง — ไอคอน lucide จาง ๆ + ข้อความ */
export default function EmptyState({ icon: Icon, message }: EmptyStateProps) {
  const c = useColors();
  return (
    <View className="items-center justify-center px-10 py-16">
      <Icon size={44} color={c.subtle} strokeWidth={1.5} />
      <Text className="mt-4 text-center text-base leading-6 text-muted">{message}</Text>
    </View>
  );
}

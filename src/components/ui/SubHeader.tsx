import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';

interface SubHeaderProps {
  title: string;
  /** ปุ่ม action ฝั่งขวา (ถ้ามี) */
  right?: React.ReactNode;
}

/** แถบหัวหน้าจอรอง: ปุ่มย้อนกลับ + ชื่อหน้า */
export default function SubHeader({ title, right }: SubHeaderProps) {
  const c = useColors();
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <View className="flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="mr-2 h-10 w-10 items-center justify-center rounded-full active:bg-surface2"
        >
          <ChevronLeft size={24} color={c.ink} />
        </Pressable>
        <Text className="text-lg font-bold text-ink">{title}</Text>
      </View>
      {right}
    </View>
  );
}

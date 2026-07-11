import { Text, View } from 'react-native';

interface ScreenHeaderProps {
  title: string;
  /** ข้อความเล็กด้านบน title (เช่น "สวัสดีตอนเช้า") */
  overline?: string;
  right?: React.ReactNode;
  className?: string;
}

/** หัวหน้าจอหลัก (Home/History/Stats/Profile) — title ตัวหนา + action ฝั่งขวา */
export default function ScreenHeader({ title, overline, right, className }: ScreenHeaderProps) {
  return (
    <View className={`flex-row items-center justify-between px-5 ${className ?? ''}`}>
      <View>
        {!!overline && <Text className="mb-1 text-sm font-medium text-muted">{overline}</Text>}
        <Text className="text-2xl font-extrabold text-ink">{title}</Text>
      </View>
      {right}
    </View>
  );
}

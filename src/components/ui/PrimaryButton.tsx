import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';

import { useColors } from '@/hooks/useColors';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'outline' | 'danger';
  className?: string;
}

/** ปุ่มหลักของแอป — น้ำเงินเต็ม / เส้นขอบ / แดง ตามดีไซน์ Figma */
export default function PrimaryButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  className,
}: PrimaryButtonProps) {
  const c = useColors();
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isOutline = variant === 'outline';

  const bg = isPrimary ? 'bg-primary' : isDanger ? 'bg-danger' : 'bg-surface';
  const border = isOutline ? 'border border-stroke' : '';
  const textColor = isOutline ? 'text-primary' : 'text-white';
  const iconColor = isOutline ? c.primary : '#FFFFFF';

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-center rounded-2xl py-4 active:opacity-85 ${bg} ${border} ${className ?? ''}`}
    >
      {icon && <Ionicons name={icon} size={18} color={iconColor} style={{ marginRight: 8 }} />}
      <Text className={`text-base font-bold ${textColor}`}>{label}</Text>
    </Pressable>
  );
}

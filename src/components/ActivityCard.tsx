import { Play } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import IconTile from '@/components/ui/IconTile';
import { STR } from '@/constants/strings';
import type { Activity } from '@/database/models';
import { formatDuration } from '@/lib/dates';

interface ActivityCardProps {
  activity: Activity;
  categoryLabel?: string;
  /** เวลาสะสม (วินาที) — dashboard ส่งของวันนี้, หน้ากิจกรรมส่งยอดรวม */
  totalSec: number;
  totalLabel?: string;
  onPress: () => void;
  onStartTimer: () => void;
}

/**
 * การ์ดกิจกรรมในลิสต์ (สไตล์ Figma) — การ์ดขาวมุมมน:
 * กล่องสีตามกิจกรรม + ชื่อ + "หมวดหมู่ · เวลาสะสม" + ปุ่มเริ่มจับเวลาสีน้ำเงิน
 */
export default function ActivityCard({
  activity,
  categoryLabel,
  totalSec,
  totalLabel,
  onPress,
  onStartTimer,
}: ActivityCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={activity.name}
      className="mb-2.5 flex-row items-center rounded-2xl bg-surface px-3 py-2.5 active:opacity-90"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 1,
      }}
    >
      <IconTile icon={activity.emoji} color={activity.color} size={40} />

      <View className="ml-3 flex-1">
        <Text className="text-[15px] font-bold text-ink" numberOfLines={1}>
          {activity.name}
        </Text>
        <Text className="mt-0.5 text-xs text-muted" numberOfLines={1}>
          {categoryLabel ? `${categoryLabel} · ` : ''}
          {totalLabel ? `${totalLabel} ` : ''}
          {formatDuration(totalSec)}
        </Text>
      </View>

      <Pressable
        onPress={onStartTimer}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`${STR.timer.start} ${activity.name}`}
        className="ml-2 h-9 w-9 items-center justify-center rounded-full bg-primary active:opacity-80"
      >
        <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
      </Pressable>
    </Pressable>
  );
}

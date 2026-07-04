import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { THEME } from '@/constants/palette';
import type { Activity } from '@/database/models';
import { formatDuration } from '@/lib/dates';

interface ActivityCardProps {
  activity: Activity;
  categoryLabel?: string;
  /** เวลาสะสม (วินาที) — dashboard ส่งของวันนี้, หน้ากิจกรรมส่งยอดรวม */
  totalSec: number;
  totalLabel: string;
  onPress: () => void;
  onStartTimer: () => void;
}

/** การ์ดกิจกรรมในลิสต์ — แสดงอิโมจิ/สี/ชื่อ/หมวดหมู่/เวลาสะสม + ปุ่มเริ่มจับเวลา */
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
      className="mb-3 flex-row items-center rounded-2xl border border-stroke bg-surface p-4 active:bg-surface2"
    >
      <View
        className="mr-3 h-12 w-12 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${activity.color}26` }}
      >
        <Text className="text-2xl">{activity.emoji}</Text>
      </View>

      <View className="flex-1">
        <Text className="text-base font-semibold text-ink" numberOfLines={1}>
          {activity.name}
        </Text>
        <Text className="mt-0.5 text-xs text-muted" numberOfLines={1}>
          {categoryLabel ? `${categoryLabel} · ` : ''}
          {totalLabel} {formatDuration(totalSec)}
        </Text>
      </View>

      <Pressable
        onPress={onStartTimer}
        hitSlop={8}
        className="ml-3 h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: activity.color }}
      >
        <Ionicons name="play" size={20} color={THEME.background} />
      </Pressable>
    </Pressable>
  );
}

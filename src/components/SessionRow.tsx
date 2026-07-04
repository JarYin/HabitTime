import { Text, View } from 'react-native';

import type { Activity, TimeSession } from '@/database/models';
import { formatDuration, formatThaiTime } from '@/lib/dates';

interface SessionRowProps {
  session: TimeSession;
  /** กิจกรรมของเซสชันนี้ (parent เตรียม map ไว้ให้ ลดการ query ราย row) */
  activity?: Activity;
}

/** แถวประวัติการจับเวลา 1 ครั้ง */
export default function SessionRow({ session, activity }: SessionRowProps) {
  return (
    <View className="mb-2 flex-row items-center rounded-xl border border-stroke bg-surface px-4 py-3">
      <View
        className="mr-3 h-9 w-9 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${activity?.color ?? '#9CA3AF'}26` }}
      >
        <Text className="text-lg">{activity?.emoji ?? '⏱️'}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-ink" numberOfLines={1}>
          {activity?.name ?? '—'}
        </Text>
        <Text className="mt-0.5 text-xs text-muted">
          {formatThaiTime(session.startedAt)} - {formatThaiTime(session.endedAt)}
        </Text>
      </View>
      <Text className="ml-3 text-sm font-semibold text-ink">
        {formatDuration(session.durationSec)}
      </Text>
    </View>
  );
}

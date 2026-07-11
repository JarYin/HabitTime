import { Text, View } from 'react-native';

import IconTile from '@/components/ui/IconTile';
import type { Activity, TimeSession } from '@/database/models';
import { formatDuration, formatThaiTime } from '@/lib/dates';

interface SessionRowProps {
  session: TimeSession;
  /** กิจกรรมของเซสชันนี้ (parent เตรียม map ไว้ให้ ลดการ query ราย row) */
  activity?: Activity;
  /** ข้อความบรรทัดล่าง (เช่น ชื่อหมวดหมู่) — ค่าเริ่มต้น = ช่วงเวลา */
  subtitle?: string;
}

/** แถวประวัติการจับเวลา 1 ครั้ง (สไตล์ Figma) — กล่องสี + ชื่อ/หมวดหมู่ + เวลาสะสม */
export default function SessionRow({ session, activity, subtitle }: SessionRowProps) {
  const secondLine =
    subtitle ?? `${formatThaiTime(session.startedAt)} - ${formatThaiTime(session.endedAt)}`;

  return (
    <View
      className="mb-2.5 flex-row items-center rounded-2xl bg-surface px-3 py-2.5"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 1,
      }}
    >
      <IconTile emoji={activity?.emoji ?? '⏱️'} color={activity?.color ?? '#A6A2AC'} size={38} />
      <View className="ml-3 flex-1">
        <Text className="text-sm font-bold text-ink" numberOfLines={1}>
          {activity?.name ?? '—'}
        </Text>
        <Text className="mt-0.5 text-[11px] text-muted" numberOfLines={1}>
          {secondLine}
        </Text>
      </View>
      <Text className="ml-3 text-sm font-bold text-ink">
        {formatDuration(session.durationSec)}
      </Text>
    </View>
  );
}

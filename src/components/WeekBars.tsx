import { Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import type { DayTotal } from '@/services/statsService';

interface WeekBarsProps {
  data: DayTotal[];
}

const THAI_WEEKDAY = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const MAX_BAR_HEIGHT = 90;

/**
 * กราฟแท่ง 7 วัน (สไตล์ Figma) — แท่งน้ำเงินปลายมน วันนี้เน้นเต็มสี วันอื่นจาง
 */
export default function WeekBars({ data }: WeekBarsProps) {
  const c = useColors();
  const maxSec = Math.max(...data.map((d) => d.totalSec), 1);
  const todayIndex = data.length - 1;

  return (
    <View className="flex-row items-end justify-between" style={{ height: MAX_BAR_HEIGHT + 22 }}>
      {data.map((day, i) => {
        const h = day.totalSec > 0 ? Math.max(8, (day.totalSec / maxSec) * MAX_BAR_HEIGHT) : 4;
        const isToday = i === todayIndex;
        return (
          <View key={day.dayKey} className="flex-1 items-center justify-end">
            <View
              style={{
                height: h,
                width: 14,
                borderRadius: 7,
                backgroundColor: day.totalSec > 0 ? c.primary : c.track,
                opacity: day.totalSec === 0 ? 0.5 : isToday ? 1 : 0.5,
              }}
            />
            <Text
              className="mt-2 text-[11px]"
              style={{ color: isToday ? c.ink : c.subtle, fontWeight: isToday ? '700' : '400' }}
            >
              {THAI_WEEKDAY[day.date.getDay()]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

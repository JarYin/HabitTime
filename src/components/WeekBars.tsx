import { Text, View } from 'react-native';

import { THEME } from '@/constants/palette';
import type { DayTotal } from '@/services/statsService';

interface WeekBarsProps {
  data: DayTotal[];
}

const THAI_WEEKDAY = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const MAX_BAR_HEIGHT = 64;

/**
 * กราฟแท่งจิ๋ว 7 วันบน Dashboard — series เดียวจึงใช้สีเดียว (primary)
 * วันนี้เน้นเต็มสี วันอื่นจาง แท่งปลายมนตั้งบน baseline ตามสเปก dataviz
 */
export default function WeekBars({ data }: WeekBarsProps) {
  const maxSec = Math.max(...data.map((d) => d.totalSec), 1);
  const todayIndex = data.length - 1;

  return (
    <View className="flex-row items-end justify-between">
      {data.map((day, i) => {
        const h = day.totalSec > 0 ? Math.max(6, (day.totalSec / maxSec) * MAX_BAR_HEIGHT) : 3;
        return (
          <View key={day.dayKey} className="flex-1 items-center">
            <View
              style={{
                height: h,
                width: 14,
                borderRadius: 4,
                backgroundColor: day.totalSec > 0 ? THEME.primary : THEME.stroke,
                opacity: day.totalSec === 0 ? 1 : i === todayIndex ? 1 : 0.55,
              }}
            />
            <Text
              className={`mt-2 text-[11px] ${i === todayIndex ? 'font-bold text-ink' : 'text-muted'}`}
            >
              {THAI_WEEKDAY[day.date.getDay()]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import EmptyState from '@/components/EmptyState';
import Segmented from '@/components/ui/Segmented';
import Screen from '@/components/ui/Screen';
import { STR } from '@/constants/strings';
import { useQueryList } from '@/hooks/useQuery';
import { formatDuration, toDayKey } from '@/lib/dates';
import { activeActivitiesQuery } from '@/services/activityService';
import { historyQuery } from '@/services/sessionService';
import {
  aggregatePeriodStats,
  periodStartDate,
  type StatsPeriod,
} from '@/services/statsService';

const PERIOD_OPTIONS = [
  { value: 'daily' as const, label: STR.stats.daily },
  { value: 'weekly' as const, label: STR.stats.weekly },
  { value: 'monthly' as const, label: STR.stats.monthly },
];

/**
 * หน้าสถิติ — ตามเอกสาร SRS: เวลาสะสมรายวัน/รายสัปดาห์/รายเดือน
 * และกิจกรรมที่ใช้เวลามากที่สุด แสดงเป็น bar list แยกตามกิจกรรม
 */
export default function StatsScreen() {
  const [period, setPeriod] = useState<StatsPeriod>('daily');

  const fromDayKey = toDayKey(periodStartDate(period));
  const sessions = useQueryList(() => historyQuery({ fromDayKey }), [fromDayKey]);
  const activities = useQueryList(() => activeActivitiesQuery(), []);

  const stats = useMemo(() => aggregatePeriodStats(sessions, activities), [sessions, activities]);
  const maxSec = stats.byActivity[0]?.totalSec ?? 1;

  return (
    <Screen noBottomInset>
      <ScrollView contentContainerClassName="pb-10">
        <View className="px-5 pt-4">
          <Text className="text-xl font-bold text-ink">{STR.stats.title}</Text>

          <View className="mt-3">
            <Segmented options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
          </View>

          {/* เวลารวมของช่วงที่เลือก */}
          <View className="mt-4 rounded-2xl border border-stroke bg-surface p-5">
            <Text className="text-sm text-muted">{STR.stats.total}</Text>
            <Text className="mt-1 text-4xl font-extrabold text-ink">
              {formatDuration(stats.totalSec)}
            </Text>
            <Text className="mt-1 text-xs text-muted">
              {stats.sessionCount} {STR.stats.sessionsCount}
            </Text>
          </View>

          {stats.byActivity.length === 0 ? (
            <EmptyState emoji="📊" message={STR.stats.noData} />
          ) : (
            <>
              {/* กิจกรรมที่ใช้เวลามากที่สุด */}
              {stats.topActivity && (
                <View className="mt-4 flex-row items-center rounded-2xl border border-stroke bg-surface p-4">
                  <View
                    className="mr-3 h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${stats.topActivity.activity.color}26` }}
                  >
                    <Text className="text-2xl">{stats.topActivity.activity.emoji}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted">{STR.stats.topActivity}</Text>
                    <Text className="text-base font-semibold text-ink" numberOfLines={1}>
                      {stats.topActivity.activity.name}
                    </Text>
                  </View>
                  <Text className="ml-2 text-base font-bold text-ink">
                    {formatDuration(stats.topActivity.totalSec)}
                  </Text>
                </View>
              )}

              {/* bar list แยกตามกิจกรรม — สีตามกิจกรรม + มีอิโมจิ/ชื่อ/ตัวเลขกำกับเสมอ */}
              <Text className="mb-3 mt-6 text-lg font-bold text-ink">{STR.stats.byActivity}</Text>
              {stats.byActivity.map(({ activity, totalSec, sessionCount }) => (
                <View key={activity.id} className="mb-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 text-sm text-ink" numberOfLines={1}>
                      {activity.emoji} {activity.name}
                      <Text className="text-muted">  ({sessionCount})</Text>
                    </Text>
                    <Text className="ml-3 text-sm font-semibold text-ink">
                      {formatDuration(totalSec)}
                    </Text>
                  </View>
                  <View className="mt-2 h-2 overflow-hidden rounded-full bg-surface2">
                    <View
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.max(2, (totalSec / maxSec) * 100)}%`,
                        backgroundColor: activity.color,
                      }}
                    />
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

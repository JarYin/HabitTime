import { Calendar, ChartColumn } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import EmptyState from '@/components/EmptyState';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Screen from '@/components/ui/Screen';
import Segmented from '@/components/ui/Segmented';
import WeekBars from '@/components/WeekBars';
import { useColors } from '@/hooks/useColors';
import { useShadows } from '@/hooks/useShadows';
import { STR } from '@/constants/strings';
import { useQueryList } from '@/hooks/useQuery';
import { useToday } from '@/hooks/useToday';
import { addDays, formatDuration, toDayKey } from '@/lib/dates';
import { activeActivitiesQuery } from '@/services/activityService';
import { historyQuery } from '@/services/sessionService';
import { aggregateDailyTotals, aggregatePeriodStats, periodStartDate, type StatsPeriod } from '@/services/statsService';

const PERIOD_OPTIONS = [
  { value: 'daily' as const, label: STR.stats.periodDay },
  { value: 'weekly' as const, label: STR.stats.periodWeek },
  { value: 'monthly' as const, label: STR.stats.periodMonth },
];

const TOTAL_LABEL: Record<StatsPeriod, string> = {
  daily: STR.stats.totalDay,
  weekly: STR.stats.totalWeek,
  monthly: STR.stats.totalMonth,
};

/** หน้าสถิติ (ดีไซน์ Figma "statistic page") — การ์ดรวมเวลา + กราฟ 7 วัน + รายการใช้เวลามากที่สุด */
export default function StatsScreen() {
  const c = useColors();
  const shadows = useShadows();
  const [period, setPeriod] = useState<StatsPeriod>('weekly');
  const now = useToday();

  const fromDayKey = toDayKey(periodStartDate(period, now));
  const sessions = useQueryList(() => historyQuery({ fromDayKey }), [fromDayKey]);
  const activities = useQueryList(() => activeActivitiesQuery(), []);
  const weekAgoKey = toDayKey(addDays(now, -6));
  const weekSessions = useQueryList(() => historyQuery({ fromDayKey: weekAgoKey }), [weekAgoKey]);

  const stats = useMemo(() => aggregatePeriodStats(sessions, activities), [sessions, activities]);
  const weekData = useMemo(() => aggregateDailyTotals(weekSessions, 7, now), [weekSessions, now]);
  const maxSec = stats.byActivity[0]?.totalSec ?? 1;

  return (
    <Screen noBottomInset>
      <ScrollView contentContainerClassName="pb-10" showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={STR.stats.title}
          className="pt-3"
          right={
            <View
              className="h-10 w-10 items-center justify-center rounded-full bg-surface"
              style={shadows.card}
            >
              <Calendar size={18} color={c.ink} />
            </View>
          }
        />

        <View className="mt-4 px-5">
          <Segmented options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
        </View>

        {/* การ์ดรวมเวลา + กราฟ */}
        <View className="mx-5 mt-4 rounded-2xl bg-surface p-5" style={shadows.card}>
          <Text className="text-xs font-semibold text-muted">{TOTAL_LABEL[period]}</Text>
          <Text className="mt-1 text-2xl font-extrabold text-ink">{formatDuration(stats.totalSec)}</Text>
          <View className="mt-5">
            <WeekBars data={weekData} />
          </View>
        </View>

        {/* ใช้เวลามากที่สุด */}
        {stats.byActivity.length === 0 ? (
          <EmptyState icon={ChartColumn} message={STR.stats.noData} />
        ) : (
          <View className="mt-6 px-5">
            <Text className="mb-3 text-base font-extrabold text-ink">{STR.stats.mostUsed}</Text>
            {stats.byActivity.map(({ activity, totalSec }) => (
              <View key={activity.id} className="mb-4">
                <View className="flex-row items-center">
                  <View
                    className="mr-2 h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: activity.color }}
                  />
                  <Text className="flex-1 text-sm font-semibold text-ink" numberOfLines={1}>
                    {activity.name}
                  </Text>
                  <Text className="ml-2 text-sm font-bold text-muted">{formatDuration(totalSec)}</Text>
                </View>
                <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-track/40">
                  <View
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${Math.max(2, (totalSec / maxSec) * 100)}%`,
                      backgroundColor: activity.color,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}


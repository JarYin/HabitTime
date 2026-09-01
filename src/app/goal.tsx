import { Circle, CircleCheckBig, Flag, Minus, Plus } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import EmptyState from '@/components/EmptyState';
import Screen from '@/components/ui/Screen';
import SubHeader from '@/components/ui/SubHeader';
import { useColors } from '@/hooks/useColors';
import { STR } from '@/constants/strings';
import { useQueryList } from '@/hooks/useQuery';
import { useToday } from '@/hooks/useToday';
import { addDays, formatDuration, formatThaiDate, toDayKey } from '@/lib/dates';
import { historyQuery } from '@/services/sessionService';
import { aggregateDailyTotals } from '@/services/statsService';
import { useGoalStore } from '@/stores/goalStore';

const GOAL_STEP_MINUTES = 15;

/**
 * เป้าหมายรายวัน — ตั้งเป้าเวลารวมต่อวัน, ดูความคืบหน้าวันนี้,
 * และย้อนดู 7 วันล่าสุดว่าวันไหนถึงเป้าบ้าง
 */
export default function GoalScreen() {
  const c = useColors();
  const goalMinutes = useGoalStore((s) => s.minutes);
  const setGoalMinutes = useGoalStore((s) => s.setMinutes);

  const now = useToday();
  const todayKey = toDayKey(now);
  const weekAgoKey = toDayKey(addDays(now, -6));
  const weekSessions = useQueryList(() => historyQuery({ fromDayKey: weekAgoKey }), [weekAgoKey]);

  const days = useMemo(
    () => aggregateDailyTotals(weekSessions, 7, now),
    [weekSessions, now],
  );

  const goalSec = goalMinutes * 60;
  const todaySec = days[days.length - 1]?.totalSec ?? 0;
  const pct = Math.min(100, Math.round((todaySec / Math.max(1, goalSec)) * 100));
  const hitCount = days.filter((d) => d.totalSec >= goalSec).length;

  return (
    <Screen>
      <SubHeader title={STR.goal.title} />
      <ScrollView contentContainerClassName="px-5 pb-10">
        {/* เป้าหมายต่อวัน */}
        <View className="rounded-2xl border border-stroke bg-surface p-4">
          <Text className="text-base font-semibold text-ink">{STR.goal.goalPerDay}</Text>
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-2xl font-extrabold text-ink">{formatDuration(goalSec)}</Text>
            <View className="flex-row items-center rounded-xl border border-stroke bg-surface2">
              <Pressable
                onPress={() => setGoalMinutes(goalMinutes - GOAL_STEP_MINUTES)}
                hitSlop={6}
                className="px-3 py-2"
              >
                <Minus size={16} color={c.muted} />
              </Pressable>
              <Pressable
                onPress={() => setGoalMinutes(goalMinutes + GOAL_STEP_MINUTES)}
                hitSlop={6}
                className="px-3 py-2"
              >
                <Plus size={16} color={c.muted} />
              </Pressable>
            </View>
          </View>
          <Text className="mt-2 text-xs text-subtle">{STR.goal.goalHint}</Text>
        </View>

        {/* ความคืบหน้าวันนี้ */}
        <View className="mt-4 rounded-2xl border border-stroke bg-surface p-4">
          <Text className="text-base font-semibold text-ink">{STR.goal.todayTitle}</Text>
          <Text className="mt-3 text-2xl font-extrabold text-ink">{formatDuration(todaySec)}</Text>
          <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-track/40">
            <View className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.max(2, pct)}%` }} />
          </View>
          <Text className="mt-2 text-xs text-muted">
            {STR.goal.todayProgress(pct)}
            {todaySec >= goalSec
              ? ` · ${STR.goal.todayHit}`
              : ` · ${STR.goal.todayRemaining(formatDuration(goalSec - todaySec))}`}
          </Text>
        </View>

        {/* 7 วันล่าสุด */}
        <View className="mt-4 rounded-2xl border border-stroke bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-ink">{STR.goal.last7days}</Text>
            <Text className="text-xs text-muted">{STR.goal.hitCount(hitCount)}</Text>
          </View>

          {weekSessions.length === 0 ? (
            <EmptyState icon={Flag} message={STR.goal.noData} />
          ) : (
            <View className="mt-3">
              {[...days].reverse().map((d, i) => (
                <View key={d.dayKey}>
                  {i > 0 && <View className="h-px bg-stroke" />}
                  <View className="flex-row items-center py-3">
                    <Text className="flex-1 text-sm text-ink">
                      {d.dayKey === todayKey
                        ? STR.common.today
                        : i === 1
                          ? STR.common.yesterday
                          : formatThaiDate(d.date)}
                    </Text>
                    <Text className="mr-3 text-sm text-muted">{formatDuration(d.totalSec)}</Text>
                    {d.totalSec >= goalSec ? (
                      <CircleCheckBig size={18} color={c.success} />
                    ) : (
                      <Circle size={18} color={c.subtle} />
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import ActivityCard from '@/components/ActivityCard';
import EmptyState from '@/components/EmptyState';
import Screen from '@/components/ui/Screen';
import WeekBars from '@/components/WeekBars';
import { THEME } from '@/constants/palette';
import { STR } from '@/constants/strings';
import { useQueryList } from '@/hooks/useQuery';
import { addDays, formatDuration, formatThaiFullDate, toDayKey } from '@/lib/dates';
import { activeActivitiesQuery } from '@/services/activityService';
import { categoriesQuery } from '@/services/categoryService';
import { historyQuery } from '@/services/sessionService';
import { aggregateDailyTotals, totalsByActivity } from '@/services/statsService';

const DASHBOARD_ACTIVITY_LIMIT = 5;

/**
 * Dashboard (หน้าแรก) — ตามเอกสาร SRS 2.1.2(1):
 * สรุปสถิติเบื้องต้น + กราф 7 วัน + กิจกรรมทั้งหมด + ปุ่มเพิ่มกิจกรรม
 */
export default function DashboardScreen() {
  const now = new Date();
  const todayKey = toDayKey(now);
  const weekAgoKey = toDayKey(addDays(now, -6));

  const activities = useQueryList(() => activeActivitiesQuery(), []);
  const categories = useQueryList(() => categoriesQuery(), []);
  const weekSessions = useQueryList(() => historyQuery({ fromDayKey: weekAgoKey }), [weekAgoKey]);

  const todaySessions = useMemo(
    () => weekSessions.filter((s) => s.dayKey === todayKey),
    [weekSessions, todayKey],
  );
  const todayTotalSec = useMemo(
    () => todaySessions.reduce((sum, s) => sum + s.durationSec, 0),
    [todaySessions],
  );
  const todayByActivity = useMemo(() => totalsByActivity(todaySessions), [todaySessions]);
  const weekData = useMemo(() => aggregateDailyTotals(weekSessions, 7, now), [weekSessions, todayKey]);
  const categoryLabelById = useMemo(
    () => new Map(categories.map((c) => [c.id, `${c.emoji} ${c.name}`])),
    [categories],
  );

  return (
    <Screen noBottomInset>
      <ScrollView contentContainerClassName="pb-28">
        {/* ส่วนหัว */}
        <View className="flex-row items-center justify-between px-5 pt-4">
          <View>
            <Text className="text-2xl font-extrabold text-primary">{STR.appName}</Text>
            <Text className="mt-1 text-sm text-muted">{formatThaiFullDate(now)}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface active:bg-surface2"
          >
            <Ionicons name="settings-outline" size={20} color={THEME.muted} />
          </Pressable>
        </View>

        {/* การ์ดสรุปวันนี้ + กราฟ 7 วัน */}
        <View className="mx-5 mt-5 rounded-2xl border border-stroke bg-surface p-5">
          <Text className="text-sm text-muted">{STR.dashboard.todayTotal}</Text>
          <Text className="mt-1 text-4xl font-extrabold text-ink">
            {formatDuration(todayTotalSec)}
          </Text>
          <Text className="mt-1 text-xs text-muted">
            {todaySessions.length} {STR.dashboard.sessionsToday}
          </Text>
          <View className="mt-5">
            <WeekBars data={weekData} />
          </View>
        </View>

        {/* กิจกรรมของฉัน */}
        <View className="mt-6 flex-row items-center justify-between px-5">
          <Text className="text-lg font-bold text-ink">{STR.dashboard.myActivities}</Text>
          {activities.length > DASHBOARD_ACTIVITY_LIMIT && (
            <Pressable onPress={() => router.push('/activities')} hitSlop={8}>
              <Text className="text-sm font-medium text-primary">{STR.dashboard.seeAll}</Text>
            </Pressable>
          )}
        </View>

        <View className="mt-3 px-5">
          {activities.length === 0 ? (
            <EmptyState emoji="⏱️" message={STR.dashboard.empty} />
          ) : (
            activities.slice(0, DASHBOARD_ACTIVITY_LIMIT).map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                categoryLabel={categoryLabelById.get(activity.categoryId)}
                totalSec={todayByActivity.get(activity.id) ?? 0}
                totalLabel={STR.common.today}
                onPress={() => router.push(`/activity/${activity.id}`)}
                onStartTimer={() => router.push(`/timer/${activity.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* ปุ่มเพิ่มกิจกรรม */}
      <Pressable
        onPress={() => router.push('/activity/new')}
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:opacity-80"
      >
        <Ionicons name="add" size={30} color={THEME.background} />
      </Pressable>
    </Screen>
  );
}

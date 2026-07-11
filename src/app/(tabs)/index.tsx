import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import ActivityCard from '@/components/ActivityCard';
import EmptyState from '@/components/EmptyState';
import Screen from '@/components/ui/Screen';
import { useColors } from '@/hooks/useColors';
import { STR } from '@/constants/strings';
import { useQueryList } from '@/hooks/useQuery';
import { addDays, formatDuration, greetingKey, toDayKey } from '@/lib/dates';
import { activeActivitiesQuery } from '@/services/activityService';
import { categoriesQuery } from '@/services/categoryService';
import { historyQuery } from '@/services/sessionService';
import { currentStreak, totalsByActivity } from '@/services/statsService';

const DASHBOARD_ACTIVITY_LIMIT = 5;
const DAILY_GOAL_HOURS = 4;

/** Dashboard (หน้าแรก) — ดีไซน์ตาม Figma "home page" */
export default function DashboardScreen() {
  const c = useColors();
  const now = new Date();
  const todayKey = toDayKey(now);
  const weekAgoKey = toDayKey(addDays(now, -6));

  const activities = useQueryList(() => activeActivitiesQuery(), []);
  const categories = useQueryList(() => categoriesQuery(), []);
  const weekSessions = useQueryList(() => historyQuery({ fromDayKey: weekAgoKey }), [weekAgoKey]);
  const allSessions = useQueryList(() => historyQuery(), []);

  const todaySessions = useMemo(
    () => weekSessions.filter((s) => s.dayKey === todayKey),
    [weekSessions, todayKey],
  );
  const todayTotalSec = useMemo(
    () => todaySessions.reduce((sum, s) => sum + s.durationSec, 0),
    [todaySessions],
  );
  const todayByActivity = useMemo(() => totalsByActivity(todaySessions), [todaySessions]);
  const streak = useMemo(() => currentStreak(allSessions, now), [allSessions, todayKey]);

  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const goalSec = DAILY_GOAL_HOURS * 3600;
  const goalPct = Math.min(100, Math.round((todayTotalSec / goalSec) * 100));
  const activitiesTodayCount = new Set(todaySessions.map((s) => s.activityId)).size;

  const greeting =
    STR.dashboard[
      greetingKey(now) === 'morning'
        ? 'greetingMorning'
        : greetingKey(now) === 'afternoon'
          ? 'greetingAfternoon'
          : 'greetingEvening'
    ];

  return (
    <Screen noBottomInset>
      <ScrollView contentContainerClassName="pb-28" showsVerticalScrollIndicator={false}>
        {/* ส่วนหัว: คำทักทาย + ชื่อ + กระดิ่ง */}
        <View className="flex-row items-center justify-between px-5 pt-3">
          <View>
            <Text className="text-sm font-medium text-muted">{greeting}</Text>
            <Text className="mt-0.5 text-2xl font-extrabold text-ink">{STR.dashboard.guestName}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-80"
            style={cardShadow}
          >
            <Ionicons name="notifications-outline" size={20} color={c.ink} />
          </Pressable>
        </View>

        {/* การ์ดน้ำเงิน: เวลารวมวันนี้ + progress ต่อเป้าหมาย */}
        <View className="mx-5 mt-4 rounded-2xl bg-primary p-5" style={primaryShadow}>
          <Text className="text-xs font-bold text-white/90">{STR.dashboard.todayTotal}</Text>
          <Text className="mt-1 text-3xl font-extrabold text-white">
            {formatDuration(todayTotalSec)}
          </Text>
          <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/30">
            <View className="h-1.5 rounded-full bg-white" style={{ width: `${Math.max(2, goalPct)}%` }} />
          </View>
          <Text className="mt-2 text-[11px] font-medium text-white/90">
            {STR.dashboard.goalProgress(goalPct, DAILY_GOAL_HOURS)}
          </Text>
        </View>

        {/* การ์ดสถิติคู่: streak + กิจกรรมวันนี้ */}
        <View className="mx-5 mt-3 flex-row gap-3">
          <StatCard
            icon="flame"
            iconColor="#F26B3A"
            value={STR.dashboard.streakValue(streak)}
            label={STR.dashboard.streak}
          />
          <StatCard
            icon="locate"
            iconColor={c.primary}
            value={`${activitiesTodayCount} / ${activities.length}`}
            label={STR.dashboard.activitiesToday}
          />
        </View>

        {/* กิจกรรมของคุณ */}
        <View className="mt-6 flex-row items-center justify-between px-5">
          <Text className="text-base font-extrabold text-ink">{STR.dashboard.myActivities}</Text>
          {activities.length > 0 && (
            <Pressable onPress={() => router.push('/activities')} hitSlop={8}>
              <Text className="text-xs font-bold text-primary">{STR.dashboard.seeAll}</Text>
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
                categoryLabel={categoryNameById.get(activity.categoryId)}
                totalSec={todayByActivity.get(activity.id) ?? 0}
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
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-85"
        style={primaryShadow}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </Pressable>
    </Screen>
  );
}

function StatCard({
  icon,
  iconColor,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: string;
  label: string;
}) {
  return (
    <View className="flex-1 rounded-2xl bg-surface p-3.5" style={cardShadow}>
      <Ionicons name={icon} size={18} color={iconColor} />
      <Text className="mt-2 text-lg font-extrabold text-ink">{value}</Text>
      <Text className="text-[11px] text-muted">{label}</Text>
    </View>
  );
}

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 1,
} as const;

const primaryShadow = {
  shadowColor: '#0F2EF5',
  shadowOpacity: 0.3,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: 6,
} as const;

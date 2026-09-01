import { router } from 'expo-router';
import { Bell, Flame, Plus, Target, Timer, type LucideIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import ActivityCard from '@/components/ActivityCard';
import EmptyState from '@/components/EmptyState';
import NotificationsModal from '@/components/NotificationsModal';
import Screen from '@/components/ui/Screen';
import { useColors } from '@/hooks/useColors';
import { useShadows } from '@/hooks/useShadows';
import { STR } from '@/constants/strings';
import { useQueryList } from '@/hooks/useQuery';
import { useToday } from '@/hooks/useToday';
import { addDays, formatDuration, greetingKey, toDayKey } from '@/lib/dates';
import { activeActivitiesQuery } from '@/services/activityService';
import { displayNameOf } from '@/services/authService';
import { categoriesQuery } from '@/services/categoryService';
import { buildNotificationFeed } from '@/services/notificationFeedService';
import { historyQuery } from '@/services/sessionService';
import { getReminderSettings, type ReminderSettings } from '@/services/settingsService';
import { currentStreak, totalsByActivity } from '@/services/statsService';
import { useAuthStore } from '@/stores/authStore';
import { useGoalStore } from '@/stores/goalStore';

const DASHBOARD_ACTIVITY_LIMIT = 5;

/** Dashboard (หน้าแรก) — ดีไซน์ตาม Figma "home page" */
export default function DashboardScreen() {
  const c = useColors();
  const shadows = useShadows();
  // เปลี่ยนค่าเองเมื่อข้ามวันหรือกลับเข้าแอป — เดิมค้างเป็นวันเก่าถ้าเปิดแอปทิ้งไว้ข้ามคืน
  const now = useToday();
  const todayKey = toDayKey(now);
  const weekAgoKey = toDayKey(addDays(now, -6));

  const user = useAuthStore((s) => s.user);
  const goalMinutes = useGoalStore((s) => s.minutes);
  const [notifOpen, setNotifOpen] = useState(false);
  const [reminder, setReminder] = useState<ReminderSettings | null>(null);

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
  const streak = useMemo(() => currentStreak(allSessions, now), [allSessions, now]);

  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const goalSec = Math.max(60, goalMinutes * 60);
  const goalPct = Math.min(100, Math.round((todayTotalSec / goalSec) * 100));
  const activitiesTodayCount = new Set(todaySessions.map((s) => s.activityId)).size;

  const feed = useMemo(
    () => buildNotificationFeed({ weekSessions, streak, goalMinutes, reminder, now }),
    [weekSessions, streak, goalMinutes, reminder, now],
  );

  const openNotifications = async () => {
    setReminder(await getReminderSettings());
    setNotifOpen(true);
  };

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
            <Text className="mt-0.5 text-2xl font-extrabold text-ink">{displayNameOf(user)}</Text>
          </View>
          <Pressable
            onPress={() => void openNotifications()}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-80"
            style={shadows.card}
          >
            <Bell size={20} color={c.ink} />
          </Pressable>
        </View>

        {/* การ์ดน้ำเงิน: เวลารวมวันนี้ + progress ต่อเป้าหมาย */}
        <View className="mx-5 mt-4 rounded-2xl bg-primary p-5" style={shadows.primary(c.primary)}>
          <Text className="text-xs font-bold text-white/90">{STR.dashboard.todayTotal}</Text>
          <Text className="mt-1 text-3xl font-extrabold text-white">
            {formatDuration(todayTotalSec)}
          </Text>
          <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/30">
            <View className="h-1.5 rounded-full bg-white" style={{ width: `${Math.max(2, goalPct)}%` }} />
          </View>
          <Text className="mt-2 text-[11px] font-medium text-white/90">
            {STR.dashboard.goalProgress(goalPct, formatDuration(goalSec))}
          </Text>
        </View>

        {/* การ์ดสถิติคู่: streak + กิจกรรมวันนี้ */}
        <View className="mx-5 mt-3 flex-row gap-3">
          <StatCard
            icon={Flame}
            iconColor={c.streak}
            value={STR.dashboard.streakValue(streak)}
            label={STR.dashboard.streak}
          />
          <StatCard
            icon={Target}
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
            <EmptyState icon={Timer} message={STR.dashboard.empty} />
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
        style={shadows.primary(c.primary)}
      >
        <Plus size={30} color="#FFFFFF" />
      </Pressable>

      <NotificationsModal
        visible={notifOpen}
        items={feed}
        onClose={() => setNotifOpen(false)}
      />
    </Screen>
  );
}

function StatCard({
  icon: Icon,
  iconColor,
  value,
  label,
}: {
  icon: LucideIcon;
  iconColor: string;
  value: string;
  label: string;
}) {
  const shadows = useShadows();
  return (
    <View className="flex-1 rounded-2xl bg-surface p-3.5" style={shadows.card}>
      <Icon size={18} color={iconColor} />
      <Text className="mt-2 text-lg font-extrabold text-ink">{value}</Text>
      <Text className="text-[11px] text-muted">{label}</Text>
    </View>
  );
}



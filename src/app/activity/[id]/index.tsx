import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import SessionRow from '@/components/SessionRow';
import Screen from '@/components/ui/Screen';
import SubHeader from '@/components/ui/SubHeader';
import { THEME } from '@/constants/palette';
import { STR } from '@/constants/strings';
import { activitiesCollection } from '@/database';
import { useQueryList, useRecord } from '@/hooks/useQuery';
import { formatDuration } from '@/lib/dates';
import { deleteActivity } from '@/services/activityService';
import { activitySessionsQuery, allActivitySessionsQuery } from '@/services/sessionService';

/**
 * หน้ารายละเอียดกิจกรรม — use cases: ดูรายละเอียดกิจกรรม, ดูเวลาสะสม,
 * แก้ไขกิจกรรม, ลบกิจกรรม (พร้อมยืนยัน), เริ่มจับเวลา
 */
export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activity = useRecord(activitiesCollection, id);
  const recentSessions = useQueryList(() => activitySessionsQuery(id, 20), [id]);
  const allSessions = useQueryList(() => allActivitySessionsQuery(id), [id]);

  const totalSec = useMemo(
    () => allSessions.reduce((sum, s) => sum + s.durationSec, 0),
    [allSessions],
  );

  // record ถูกลบ/ไม่พบ → กลับหน้าเดิม
  useEffect(() => {
    if (activity === null) router.back();
  }, [activity]);

  if (!activity) return <Screen />;

  const confirmDelete = () => {
    Alert.alert(STR.detail.deleteTitle, STR.detail.deleteMessage, [
      { text: STR.detail.cancel, style: 'cancel' },
      {
        text: STR.detail.deleteConfirm,
        style: 'destructive',
        onPress: () => void deleteActivity(activity),
      },
    ]);
  };

  return (
    <Screen>
      <SubHeader
        title=""
        right={
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => router.push(`/activity/${activity.id}/edit`)}
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full bg-surface active:bg-surface2"
            >
              <Ionicons name="pencil" size={18} color={THEME.muted} />
            </Pressable>
            <Pressable
              onPress={confirmDelete}
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full bg-surface active:bg-surface2"
            >
              <Ionicons name="trash-outline" size={18} color={THEME.danger} />
            </Pressable>
          </View>
        }
      />

      <ScrollView contentContainerClassName="pb-10">
        {/* ข้อมูลกิจกรรม */}
        <View className="items-center px-5">
          <View
            className="h-20 w-20 items-center justify-center rounded-3xl"
            style={{ backgroundColor: `${activity.color}26` }}
          >
            <Text className="text-4xl">{activity.emoji}</Text>
          </View>
          <Text className="mt-3 text-center text-2xl font-bold text-ink">{activity.name}</Text>
        </View>

        {/* เวลาสะสม + จำนวนครั้ง */}
        <View className="mx-5 mt-5 flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-stroke bg-surface p-4">
            <Text className="text-xs text-muted">{STR.detail.totalTime}</Text>
            <Text className="mt-1 text-xl font-bold text-ink">{formatDuration(totalSec)}</Text>
          </View>
          <View className="flex-1 rounded-2xl border border-stroke bg-surface p-4">
            <Text className="text-xs text-muted">{STR.detail.sessionCount}</Text>
            <Text className="mt-1 text-xl font-bold text-ink">{allSessions.length}</Text>
          </View>
        </View>

        {/* เริ่มจับเวลา */}
        <Pressable
          onPress={() => router.push(`/timer/${activity.id}`)}
          className="mx-5 mt-5 flex-row items-center justify-center rounded-2xl py-4 active:opacity-80"
          style={{ backgroundColor: activity.color }}
        >
          <Ionicons name="play" size={20} color={THEME.background} />
          <Text className="ml-2 text-base font-bold text-background">{STR.detail.startTimer}</Text>
        </Pressable>

        {/* ประวัติล่าสุดของกิจกรรมนี้ */}
        <Text className="mb-3 mt-7 px-5 text-lg font-bold text-ink">
          {STR.detail.recentSessions}
        </Text>
        <View className="px-5">
          {recentSessions.map((session) => (
            <SessionRow key={session.id} session={session} activity={activity} />
          ))}
          {recentSessions.length === 0 && (
            <Text className="text-center text-sm text-muted">{STR.history.empty}</Text>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

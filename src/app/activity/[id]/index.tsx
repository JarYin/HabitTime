import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { Pencil, Play } from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import SessionRow from '@/components/SessionRow';
import IconTile from '@/components/ui/IconTile';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Screen from '@/components/ui/Screen';
import SubHeader from '@/components/ui/SubHeader';
import { useColors } from '@/hooks/useColors';
import { useShadows } from '@/hooks/useShadows';
import { STR } from '@/constants/strings';
import { activitiesCollection } from '@/database';
import { useQueryList, useRecord } from '@/hooks/useQuery';
import { formatDuration } from '@/lib/dates';
import { activitySessionsQuery, allActivitySessionsQuery } from '@/services/sessionService';

/** หน้ารายละเอียดกิจกรรม — เวลาสะสม, จำนวนครั้ง, เริ่มจับเวลา, ประวัติล่าสุด */
export default function ActivityDetailScreen() {
  const c = useColors();
  const shadows = useShadows();
  const { id } = useLocalSearchParams<{ id: string }>();
  const activity = useRecord(activitiesCollection, id);
  const recentSessions = useQueryList(() => activitySessionsQuery(id, 20), [id]);
  const allSessions = useQueryList(() => allActivitySessionsQuery(id), [id]);

  const totalSec = useMemo(
    () => allSessions.reduce((sum, s) => sum + s.durationSec, 0),
    [allSessions],
  );

  const isFocused = useIsFocused();

  // เช็ค isFocused ก่อน — ตอนลบจากหน้า edit หน้านี้ยัง mount อยู่ข้างใต้
  // ถ้าสั่ง back() ซ้อนกับ dismissAll() ของหน้า edit จะ pop เกินหนึ่งหน้า
  useEffect(() => {
    if (activity === null && isFocused) router.back();
  }, [activity, isFocused]);

  if (!activity) return <Screen />;

  return (
    <Screen>
      <SubHeader
        title=""
        right={
          <Pressable
            onPress={() => router.push(`/activity/${activity.id}/edit`)}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-surface2"
          >
            <Pencil size={20} color={c.primary} />
          </Pressable>
        }
      />

      <ScrollView contentContainerClassName="pb-10" showsVerticalScrollIndicator={false}>
        <View className="items-center px-5">
          <IconTile icon={activity.emoji} color={activity.color} size={80} className="rounded-3xl" />
          <Text className="mt-3 text-center text-2xl font-extrabold text-ink">{activity.name}</Text>
        </View>

        <View className="mx-5 mt-5 flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-surface p-4" style={shadows.card}>
            <Text className="text-xs text-muted">{STR.detail.totalTime}</Text>
            <Text className="mt-1 text-xl font-extrabold text-ink">{formatDuration(totalSec)}</Text>
          </View>
          <View className="flex-1 rounded-2xl bg-surface p-4" style={shadows.card}>
            <Text className="text-xs text-muted">{STR.detail.sessionCount}</Text>
            <Text className="mt-1 text-xl font-extrabold text-ink">{allSessions.length}</Text>
          </View>
        </View>

        <View className="mx-5 mt-5">
          <PrimaryButton
            label={STR.detail.startTimer}
            icon={Play}
            onPress={() => router.push(`/timer/${activity.id}`)}
          />
        </View>

        <Text className="mb-3 mt-7 px-5 text-base font-extrabold text-ink">
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


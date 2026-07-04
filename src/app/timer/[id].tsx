import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, ToastAndroid, View } from 'react-native';

import Screen from '@/components/ui/Screen';
import { THEME } from '@/constants/palette';
import { STR } from '@/constants/strings';
import { activitiesCollection } from '@/database';
import { useRecord } from '@/hooks/useQuery';
import { MIN_SESSION_SEC, saveSession } from '@/services/sessionService';
import { getElapsedSec, useTimerStore } from '@/stores/timerStore';
import { formatStopwatch } from '@/lib/dates';

/**
 * หน้าจับเวลา (stopwatch) — flow ตามเอกสาร SRS:
 * เริ่มจับเวลา → หยุดชั่วคราว/จับต่อ → สิ้นสุดและบันทึกเวลา
 */
export default function TimerScreen() {
  useKeepAwake(); // จอไม่ดับระหว่างจับเวลา

  const { id } = useLocalSearchParams<{ id: string }>();
  const activity = useRecord(activitiesCollection, id);
  const timer = useTimerStore();
  const [elapsed, setElapsed] = useState(0);

  // เริ่มจับเวลาทันทีที่เข้าหน้า (มาจากปุ่ม play)
  // ถ้ามี timer ของกิจกรรมอื่นค้างอยู่ ให้เริ่มใหม่ของกิจกรรมนี้แทน
  useEffect(() => {
    if (timer.activityId !== id || timer.status === 'idle') {
      timer.start(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // เดินนาฬิกาบนจอ (คำนวณจากเวลาจริง ไม่สะสม drift)
  useEffect(() => {
    const tick = () => setElapsed(getElapsedSec(useTimerStore.getState()));
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, []);

  if (!activity) return <Screen />;

  const isRunning = timer.status === 'running';

  const stopAndSave = async () => {
    const state = useTimerStore.getState();
    const durationSec = getElapsedSec(state);
    const startedAt = state.sessionStartedAt ? new Date(state.sessionStartedAt) : new Date();

    if (durationSec < MIN_SESSION_SEC) {
      ToastAndroid.show(STR.timer.tooShort, ToastAndroid.SHORT);
      timer.reset();
      router.back();
      return;
    }

    await saveSession({
      activityId: id,
      startedAt,
      endedAt: new Date(),
      durationSec,
    });
    timer.reset();
    ToastAndroid.show(STR.timer.saved, ToastAndroid.SHORT);
    router.back();
  };

  const confirmDiscard = () => {
    Alert.alert(STR.timer.discardTitle, STR.timer.discardMessage, [
      { text: STR.detail.cancel, style: 'cancel' },
      {
        text: STR.timer.discard,
        style: 'destructive',
        onPress: () => {
          timer.reset();
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen>
      {/* ปิดหน้า = ทิ้งการจับเวลา (ถามยืนยันก่อน) */}
      <View className="flex-row justify-end px-4 py-3">
        <Pressable
          onPress={confirmDiscard}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface active:bg-surface2"
        >
          <Ionicons name="close" size={22} color={THEME.muted} />
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <View
          className="h-24 w-24 items-center justify-center rounded-3xl"
          style={{ backgroundColor: `${activity.color}26` }}
        >
          <Text className="text-5xl">{activity.emoji}</Text>
        </View>
        <Text className="mt-4 text-center text-xl font-bold text-ink" numberOfLines={2}>
          {activity.name}
        </Text>
        <Text className="mt-1 text-sm text-muted">
          {isRunning ? STR.timer.running : STR.timer.paused}
        </Text>

        <Text
          className="mt-8 font-extrabold text-ink"
          style={{ fontSize: 64, fontVariant: ['tabular-nums'] }}
        >
          {formatStopwatch(elapsed)}
        </Text>

        {/* ปุ่มควบคุม: พัก/จับต่อ + บันทึก */}
        <View className="mt-12 w-full flex-row items-center justify-center gap-4">
          <Pressable
            onPress={() => (isRunning ? timer.pause() : timer.resume())}
            className="h-16 w-16 items-center justify-center rounded-full border border-stroke bg-surface active:bg-surface2"
          >
            <Ionicons name={isRunning ? 'pause' : 'play'} size={26} color={THEME.ink} />
          </Pressable>

          <Pressable
            onPress={() => void stopAndSave()}
            className="h-20 flex-1 max-w-64 items-center justify-center rounded-full active:opacity-80"
            style={{ backgroundColor: activity.color }}
          >
            <View className="flex-row items-center">
              <Ionicons name="stop" size={22} color={THEME.background} />
              <Text className="ml-2 text-base font-bold text-background">
                {STR.timer.stopSave}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

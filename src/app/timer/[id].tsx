import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, ToastAndroid, View } from 'react-native';

import ConfirmDialog from '@/components/ui/ConfirmDialog';
import IconTile from '@/components/ui/IconTile';
import Screen from '@/components/ui/Screen';
import SubHeader from '@/components/ui/SubHeader';
import { useColors } from '@/hooks/useColors';
import { STR } from '@/constants/strings';
import { activitiesCollection } from '@/database';
import { useRecord } from '@/hooks/useQuery';
import { MIN_SESSION_SEC, saveSession } from '@/services/sessionService';
import { getElapsedSec, useTimerStore } from '@/stores/timerStore';

/** จับเวลาให้อยู่ในรูป MM : SS (หรือ HH : MM : SS เมื่อเกิน 1 ชม.) ตามดีไซน์ */
function clockText(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)} : ${pad(m)} : ${pad(s)}` : `${pad(m)} : ${pad(s)}`;
}

/** หน้าจับเวลา — flow: เริ่ม → พัก/จับต่อ → บันทึก/หยุด (ดีไซน์ Figma "time tracking") */
export default function TimerScreen() {
  useKeepAwake();
  const c = useColors();

  const { id } = useLocalSearchParams<{ id: string }>();
  const activity = useRecord(activitiesCollection, id);
  const timer = useTimerStore();
  const [elapsed, setElapsed] = useState(0);
  const [confirmStop, setConfirmStop] = useState(false);

  useEffect(() => {
    if (timer.activityId !== id || timer.status === 'idle') {
      timer.start(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

    await saveSession({ activityId: id, startedAt, endedAt: new Date(), durationSec });
    timer.reset();
    ToastAndroid.show(STR.timer.saved, ToastAndroid.SHORT);
    router.back();
  };

  return (
    <Screen>
      <SubHeader title={STR.timer.running} />

      <View className="flex-1 items-center px-8">
        {/* ชิปกิจกรรม */}
        <View className="mt-2 flex-row items-center rounded-full bg-surface py-1.5 pl-1.5 pr-5" style={cardShadow}>
          <IconTile emoji={activity.emoji} color={activity.color} size={30} className="rounded-full" />
          <Text className="ml-2 text-base font-bold text-ink" numberOfLines={1}>
            {activity.name}
          </Text>
        </View>

        {/* วงกลมจับเวลา */}
        <View className="mt-12 items-center justify-center">
          <View
            className="items-center justify-center rounded-full"
            style={{
              width: 240,
              height: 240,
              borderWidth: 10,
              borderColor: isRunning ? c.primary : c.track,
            }}
          >
            <View
              className="items-center justify-center rounded-full"
              style={{ width: 200, height: 200, borderWidth: 1, borderColor: c.stroke }}
            >
              <Text
                className="font-extrabold text-ink"
                style={{ fontSize: 40, fontVariant: ['tabular-nums'] }}
              >
                {clockText(elapsed)}
              </Text>
              <Text className="mt-1 text-xs text-muted">
                {isRunning ? STR.timer.running : STR.timer.paused}
              </Text>
            </View>
          </View>
        </View>

        {/* ปุ่มควบคุม: หยุด / พัก / บันทึก */}
        <View className="mt-14 w-full flex-row items-start justify-center gap-8">
          <ControlButton
            label={STR.timer.stopLabel}
            onPress={() => setConfirmStop(true)}
            icon="stop"
            size={56}
            variant="light"
          />
          <ControlButton
            label={isRunning ? STR.timer.pause : STR.timer.resume}
            onPress={() => (isRunning ? timer.pause() : timer.resume())}
            icon={isRunning ? 'pause' : 'play'}
            size={72}
            variant="primary"
          />
          <ControlButton
            label={STR.timer.saveLabel}
            onPress={() => void stopAndSave()}
            icon="checkmark"
            size={56}
            variant="light"
          />
        </View>
      </View>

      <ConfirmDialog
        visible={confirmStop}
        message={STR.timer.discardMessage}
        confirmLabel={STR.timer.discard}
        cancelLabel={STR.detail.cancel}
        destructive
        onCancel={() => setConfirmStop(false)}
        onConfirm={() => {
          setConfirmStop(false);
          timer.reset();
          router.back();
        }}
      />
    </Screen>
  );
}

function ControlButton({
  label,
  onPress,
  icon,
  size,
  variant,
}: {
  label: string;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  size: number;
  variant: 'primary' | 'light';
}) {
  const c = useColors();
  const isPrimary = variant === 'primary';
  return (
    <View className="items-center">
      <Pressable
        onPress={onPress}
        className="items-center justify-center rounded-full active:opacity-80"
        style={{
          width: size,
          height: size,
          backgroundColor: isPrimary ? c.primary : c.surface,
          ...cardShadow,
        }}
      >
        <Ionicons name={icon} size={isPrimary ? 30 : 22} color={isPrimary ? '#FFFFFF' : c.ink} />
      </Pressable>
      <Text className="mt-2 text-xs font-semibold text-muted">{label}</Text>
    </View>
  );
}

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, Pause, Play, Square, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, ToastAndroid, View } from 'react-native';

import ConfirmDialog from '@/components/ui/ConfirmDialog';
import IconTile from '@/components/ui/IconTile';
import Screen from '@/components/ui/Screen';
import SubHeader from '@/components/ui/SubHeader';
import { useColors } from '@/hooks/useColors';
import { useShadows } from '@/hooks/useShadows';
import { STR } from '@/constants/strings';
import { activitiesCollection } from '@/database';
import { useRecord } from '@/hooks/useQuery';
import { MIN_SESSION_SEC, saveSession } from '@/services/sessionService';
import { getElapsedSec, useTimerStore } from '@/stores/timerStore';

/**
 * Toast แจ้งผลสั้น ๆ — ToastAndroid มีเฉพาะ Android; บนเว็บ react-native-web
 * ไม่ export ตัวนี้เลย (undefined) เรียก .show() ตรง ๆ จะ throw จนปุ่มบันทึกใช้ไม่ได้
 */
function showToast(message: string): void {
  if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
}

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
  const shadows = useShadows();

  const { id } = useLocalSearchParams<{ id: string }>();
  const activity = useRecord(activitiesCollection, id);
  const timer = useTimerStore();
  const [elapsed, setElapsed] = useState(0);
  const [confirmStop, setConfirmStop] = useState(false);
  // กันกดปุ่มบันทึกรัว ๆ — ไม่งั้นได้เซสชันซ้ำสองแถว + router.back() ซ้อนสองรอบ
  //
  // ต้องเป็น ref ไม่ใช่ state: state อัปเดตในเรนเดอร์ถัดไปเท่านั้น การกดสองครั้งที่
  // ตกอยู่ใน batch เดียวกันจะเห็น saving === false ทั้งคู่แล้วเขียนเซสชันซ้ำสองแถว
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // ยังอยู่บนหน้าจอนี้ไหม — กัน router.back() ยิงซ้ำหลัง unmount
  const mountedRef = useRef(true);

  useEffect(() => {
    if (timer.activityId !== id || timer.status === 'idle') {
      timer.start(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /**
   * ออกจากหน้านี้เมื่อไหร่ให้พักนาฬิกาไว้เสมอ
   *
   * timer อยู่ใน store ระดับ global ที่ไม่ผูกกับ lifecycle ของหน้าจอ เดิมกดปุ่ม Back
   * ออกไปแล้วมันยังนับต่อไปเรื่อย ๆ เพราะ getElapsedSec คิดจากเวลาจริง กลับเข้ามาอีกที
   * ตอนบ่ายจะเจอตัวเลข 4 ชั่วโมงที่ไม่เคยเกิดขึ้น กดบันทึกครั้งเดียวได้เซสชันผีทันที
   *
   * พักไว้แทนที่จะ reset ทิ้ง — เวลาที่จับมาแล้วยังอยู่ครบ ผู้ใช้กลับมากด "จับต่อ" ได้
   */
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      useTimerStore.getState().pause();
    };
  }, []);

  useEffect(() => {
    const tick = () => setElapsed(getElapsedSec(useTimerStore.getState()));
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, []);

  // กิจกรรมถูกลบระหว่างจับเวลา (เช่น ลบจากอีกเครื่องแล้ว sync ดึงการลบมา)
  // ถ้าไม่พากลับ หน้าจะค้างเป็นจอเปล่าไม่มีปุ่มย้อนกลับ
  useEffect(() => {
    if (activity === null) {
      useTimerStore.getState().reset();
      router.back();
    }
  }, [activity]);

  if (!activity) return <Screen />;

  const isRunning = timer.status === 'running';

  const stopAndSave = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);

    try {
      const state = useTimerStore.getState();
      const durationSec = getElapsedSec(state);
      const startedAt = state.sessionStartedAt ? new Date(state.sessionStartedAt) : new Date();

      if (durationSec < MIN_SESSION_SEC) {
        showToast(STR.timer.tooShort);
        timer.reset();
        if (mountedRef.current) router.back();
        return;
      }

      await saveSession({ activityId: id, startedAt, endedAt: new Date(), durationSec });
      timer.reset();
      showToast(STR.timer.saved);
      // ผู้ใช้อาจกด Back ไปแล้วระหว่างที่เขียนฐานข้อมูล — เรียกซ้ำจะเด้งย้อนสองหน้า
      if (mountedRef.current) router.back();
    } catch (error) {
      // เดิมไม่มี catch/finally เลย ถ้าเขียนฐานข้อมูลพลาด saving จะค้างเป็น true ตลอดไป
      // ปุ่มบันทึกตายสนิท ทางออกเดียวคือกด Stop ซึ่งทิ้งเซสชันที่จับมาทั้งหมด
      console.error('[HabitTime] save session failed', error);
      setSaveError(error instanceof Error ? error.message : String(error));
    } finally {
      savingRef.current = false;
      if (mountedRef.current) setSaving(false);
    }
  };

  return (
    <Screen>
      <SubHeader title={STR.timer.running} />

      <View className="flex-1 items-center px-8">
        {/* ชิปกิจกรรม */}
        <View className="mt-2 flex-row items-center rounded-full bg-surface py-1.5 pl-1.5 pr-5" style={shadows.card}>
          <IconTile icon={activity.emoji} color={activity.color} size={30} className="rounded-full" />
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
            icon={Square}
            size={56}
            variant="light"
          />
          <ControlButton
            label={isRunning ? STR.timer.pause : STR.timer.resume}
            onPress={() => (isRunning ? timer.pause() : timer.resume())}
            icon={isRunning ? Pause : Play}
            size={72}
            variant="primary"
          />
          <ControlButton
            label={STR.timer.saveLabel}
            onPress={() => void stopAndSave()}
            icon={Check}
            size={56}
            variant="light"
            disabled={saving}
          />
        </View>

        {saveError && (
          <Text className="mt-6 text-center text-xs text-danger">
            {STR.timer.saveFailed} — {saveError}
          </Text>
        )}
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
  icon: Icon,
  size,
  variant,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  icon: LucideIcon;
  size: number;
  variant: 'primary' | 'light';
  disabled?: boolean;
}) {
  const c = useColors();
  const shadows = useShadows();
  const isPrimary = variant === 'primary';
  return (
    <View className="items-center">
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        className="items-center justify-center rounded-full active:opacity-80"
        style={{
          width: size,
          height: size,
          backgroundColor: isPrimary ? c.primary : c.surface,
          opacity: disabled ? 0.5 : 1,
          ...shadows.card,
        }}
      >
        <Icon size={isPrimary ? 30 : 22} color={isPrimary ? '#FFFFFF' : c.ink} />
      </Pressable>
      <Text className="mt-2 text-xs font-semibold text-muted">{label}</Text>
    </View>
  );
}

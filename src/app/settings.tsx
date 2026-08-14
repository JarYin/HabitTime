import { CloudCheck, CloudAlert, Lock, Minus, Plus, RefreshCw } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import Screen from '@/components/ui/Screen';
import Segmented from '@/components/ui/Segmented';
import SubHeader from '@/components/ui/SubHeader';
import { useColors } from '@/hooks/useColors';
import { STR } from '@/constants/strings';
import type { ThemeMode } from '@/services/settingsService';
import { useThemeStore } from '@/stores/themeStore';
import { activitiesCollection, sessionsCollection } from '@/database';
import { useQueryCount } from '@/hooks/useQuery';
import {
  cancelDailyReminder,
  ensureNotificationPermission,
  scheduleDailyReminder,
} from '@/services/notificationService';
import { getReminderSettings, setReminderSettings } from '@/services/settingsService';
import { syncNow, wipeAllData } from '@/services/syncService';
import { useAuthStore } from '@/stores/authStore';
import { useSyncStore } from '@/stores/syncStore';

/**
 * หน้าตั้งค่า — แจ้งเตือนรายวัน (local ล้วน), ข้อมูลความเป็นส่วนตัว,
 * จำนวนข้อมูล และการลบข้อมูลทั้งหมด
 */
const THEME_OPTIONS = [
  { value: 'light' as const, label: STR.settings.themeLight },
  { value: 'dark' as const, label: STR.settings.themeDark },
  { value: 'system' as const, label: STR.settings.themeSystem },
];

export default function SettingsScreen() {
  const c = useColors();
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeModeState = useThemeStore((s) => s.setMode);
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(20);
  const [minute, setMinute] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const activitiesCount = useQueryCount(() => activitiesCollection.query(), []);
  const sessionsCount = useQueryCount(() => sessionsCollection.query(), []);

  useEffect(() => {
    void getReminderSettings().then((s) => {
      setEnabled(s.enabled);
      setHour(s.hour);
      setMinute(s.minute);
      setLoaded(true);
    });
  }, []);

  /** บันทึก + ตั้ง/ยกเลิกการแจ้งเตือนตามค่าปัจจุบัน */
  const apply = async (next: { enabled: boolean; hour: number; minute: number }) => {
    if (next.enabled) {
      const granted = await ensureNotificationPermission();
      if (!granted) {
        Alert.alert(STR.settings.permissionDenied);
        setEnabled(false);
        await setReminderSettings({ ...next, enabled: false });
        await cancelDailyReminder();
        return;
      }
      await scheduleDailyReminder(next.hour, next.minute);
    } else {
      await cancelDailyReminder();
    }
    await setReminderSettings(next);
  };

  const toggleReminder = (value: boolean) => {
    setEnabled(value);
    void apply({ enabled: value, hour, minute });
  };

  const shiftTime = (dHour: number, dMinute: number) => {
    const total = (((hour + dHour) * 60 + minute + dMinute) % (24 * 60) + 24 * 60) % (24 * 60);
    const h = Math.floor(total / 60);
    const m = total % 60;
    setHour(h);
    setMinute(m);
    if (enabled) void apply({ enabled, hour: h, minute: m });
  };

  const confirmWipe = () => {
    Alert.alert(STR.settings.wipeTitle, STR.settings.wipeMessage, [
      { text: STR.detail.cancel, style: 'cancel' },
      {
        text: STR.settings.wipeConfirm,
        style: 'destructive',
        onPress: () => void wipeAll(),
      },
    ]);
  };

  const wipeAll = async () => {
    await cancelDailyReminder();
    try {
      // ลบทั้งบนเครื่องและบนคลาวด์ — ถ้าลบแค่ในเครื่อง การซิงก์รอบหน้าจะดึงกลับมา
      await wipeAllData();
    } catch (error) {
      Alert.alert(
        STR.settings.wipeFailed,
        error instanceof Error ? error.message : String(error),
      );
      return;
    }
    setEnabled(false);
  };

  if (!loaded) return <Screen />;

  return (
    <Screen>
      <SubHeader title={STR.settings.title} />
      <ScrollView contentContainerClassName="px-5 pb-10">
        {/* ธีม (สว่าง/มืด/อัตโนมัติ) */}
        <View className="mb-4 rounded-2xl border border-stroke bg-surface p-4">
          <Text className="mb-3 text-base font-semibold text-ink">{STR.settings.theme}</Text>
          <Segmented
            options={THEME_OPTIONS}
            value={themeMode}
            onChange={(m: ThemeMode) => setThemeModeState(m)}
          />
        </View>

        {/* ซิงก์ข้อมูลกับคลาวด์ */}
        <SyncCard />

        {/* การแจ้งเตือน */}
        <View className="rounded-2xl border border-stroke bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 text-base text-ink">{STR.settings.reminder}</Text>
            <Switch
              value={enabled}
              onValueChange={toggleReminder}
              trackColor={{ true: c.primarySoft, false: c.stroke }}
              thumbColor={enabled ? c.primary : c.muted}
            />
          </View>

          {enabled && (
            <View className="mt-4 flex-row items-center justify-between border-t border-stroke pt-4">
              <Text className="text-sm text-muted">{STR.settings.reminderTime}</Text>
              <View className="flex-row items-center gap-2">
                <Stepper onDec={() => shiftTime(-1, 0)} onInc={() => shiftTime(1, 0)}>
                  {String(hour).padStart(2, '0')}
                </Stepper>
                <Text className="text-lg font-bold text-ink">:</Text>
                <Stepper onDec={() => shiftTime(0, -5)} onInc={() => shiftTime(0, 5)}>
                  {String(minute).padStart(2, '0')}
                </Stepper>
              </View>
            </View>
          )}
        </View>

        {/* ความเป็นส่วนตัว */}
        <View className="mt-4 rounded-2xl border border-stroke bg-surface p-4">
          <View className="flex-row items-center">
            <Lock size={16} color={c.success} />
            <Text className="ml-2 text-base font-semibold text-ink">
              {STR.settings.privacyTitle}
            </Text>
          </View>
          <Text className="mt-2 text-sm leading-6 text-muted">{STR.settings.privacyBody}</Text>
        </View>

        {/* ข้อมูลของฉัน */}
        <View className="mt-4 rounded-2xl border border-stroke bg-surface p-4">
          <Text className="text-base font-semibold text-ink">{STR.settings.dataTitle}</Text>
          <View className="mt-3 flex-row">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-ink">{activitiesCount}</Text>
              <Text className="text-xs text-muted">{STR.settings.activitiesCount}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-ink">{sessionsCount}</Text>
              <Text className="text-xs text-muted">{STR.settings.sessionsCount}</Text>
            </View>
          </View>
        </View>

        {/* ลบข้อมูลทั้งหมด */}
        <Pressable
          onPress={confirmWipe}
          className="mt-4 items-center rounded-2xl border border-danger/40 bg-surface py-4 active:bg-surface2"
        >
          <Text className="text-base font-semibold text-danger">{STR.settings.wipe}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

/**
 * การ์ดสถานะการซิงก์ — บอกว่าตอนนี้ข้อมูลขึ้นคลาวด์ถึงไหนแล้ว
 * และให้กดซิงก์เองได้ (ปกติระบบซิงก์อัตโนมัติอยู่แล้ว ดู syncService)
 */
function SyncCard() {
  const c = useColors();
  const user = useAuthStore((s) => s.user);
  const status = useSyncStore((s) => s.status);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const error = useSyncStore((s) => s.error);

  const syncing = status === 'syncing';
  const failed = status === 'error';

  const statusText = syncing
    ? STR.sync.syncing
    : lastSyncedAt
      ? STR.sync.lastSynced(formatSyncTime(lastSyncedAt))
      : STR.sync.never;

  return (
    <View className="mb-4 rounded-2xl border border-stroke bg-surface p-4">
      <View className="flex-row items-center">
        {failed ? (
          <CloudAlert size={16} color={c.danger} />
        ) : (
          <CloudCheck size={16} color={c.success} />
        )}
        <Text className="ml-2 flex-1 text-base font-semibold text-ink">{STR.sync.title}</Text>
        <Pressable
          onPress={() => void syncNow()}
          disabled={syncing}
          hitSlop={8}
          style={syncing ? { opacity: 0.5 } : undefined}
          className="flex-row items-center rounded-xl bg-surface2 px-3 py-1.5"
        >
          <RefreshCw size={13} color={c.primary} />
          <Text className="ml-1.5 text-xs font-bold text-primary">{STR.sync.syncNow}</Text>
        </Pressable>
      </View>

      {user && (
        <Text className="mt-3 text-sm text-muted">
          {STR.sync.account}: <Text className="text-ink">{user.email}</Text>
        </Text>
      )}
      <Text className="mt-1 text-xs text-subtle">{statusText}</Text>

      {failed && error && (
        <Text className="mt-2 text-xs text-danger">
          {STR.sync.failed} — {error}
        </Text>
      )}

      <Text className="mt-3 text-sm leading-6 text-muted">{STR.sync.body}</Text>
    </View>
  );
}

/** เวลาซิงก์ล่าสุด — วันนี้แสดงแค่เวลา วันอื่นเติมวัน/เดือนไว้ข้างหน้า */
function formatSyncTime(ms: number): string {
  const at = new Date(ms);
  const time = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')} น.`;
  const isToday = at.toDateString() === new Date().toDateString();
  return isToday ? `${STR.common.today} ${time}` : `${at.getDate()}/${at.getMonth() + 1} ${time}`;
}

function Stepper({
  children,
  onDec,
  onInc,
}: {
  children: React.ReactNode;
  onDec: () => void;
  onInc: () => void;
}) {
  const c = useColors();
  return (
    <View className="flex-row items-center rounded-xl border border-stroke bg-surface2">
      <Pressable onPress={onDec} hitSlop={6} className="px-3 py-2">
        <Minus size={16} color={c.muted} />
      </Pressable>
      <Text className="w-8 text-center text-lg font-bold text-ink">{children}</Text>
      <Pressable onPress={onInc} hitSlop={6} className="px-3 py-2">
        <Plus size={16} color={c.muted} />
      </Pressable>
    </View>
  );
}

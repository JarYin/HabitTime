import Constants from 'expo-constants';
import { CloudCheck, CloudAlert, GitCommitHorizontal, Lock, RefreshCw } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Screen from '@/components/ui/Screen';
import Segmented from '@/components/ui/Segmented';
import SubHeader from '@/components/ui/SubHeader';
import { useColors } from '@/hooks/useColors';
import { STR } from '@/constants/strings';
import type { ThemeMode } from '@/services/settingsService';
import { useThemeStore } from '@/stores/themeStore';
import { activitiesCollection, sessionsCollection } from '@/database';
import { useQueryCount } from '@/hooks/useQuery';
import { cancelDailyReminder } from '@/services/notificationService';
import { syncNow, wipeAllData } from '@/services/syncService';
import { useAuthStore } from '@/stores/authStore';
import { useSyncStore } from '@/stores/syncStore';

/**
 * หน้าตั้งค่า — ธีม, ซิงก์ข้อมูลกับคลาวด์, ข้อมูลความเป็นส่วนตัว,
 * จำนวนข้อมูล และการลบข้อมูลทั้งหมด (การแจ้งเตือนแยกไปหน้า /notifications)
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

  const activitiesCount = useQueryCount(() => activitiesCollection.query(), []);
  const sessionsCount = useQueryCount(() => sessionsCollection.query(), []);

  // ใช้ ConfirmDialog ของแอปเอง ไม่ใช้ Alert.alert — บนเว็บ react-native-web
  // ทำ Alert เป็น no-op เงียบ ๆ ทำให้ปุ่มลบข้อมูลกดแล้วไม่เกิดอะไรขึ้นเลย
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [wipeError, setWipeError] = useState<string | null>(null);

  const wipeAll = async () => {
    await cancelDailyReminder();
    try {
      // ลบทั้งบนเครื่องและบนคลาวด์ — ถ้าลบแค่ในเครื่อง การซิงก์รอบหน้าจะดึงกลับมา
      await wipeAllData();
      setWipeError(null);
    } catch (error) {
      setWipeError(error instanceof Error ? error.message : String(error));
    }
  };

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

        {/* ความเป็นส่วนตัว */}
        <View className="rounded-2xl border border-stroke bg-surface p-4">
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

        {/* เวอร์ชันของ build นี้ — ใช้เทียบ APK กับเว็บพรีวิว */}
        <BuildInfoCard />

        {/* ลบข้อมูลทั้งหมด */}
        <Pressable
          onPress={() => setConfirmWipe(true)}
          className="mt-4 items-center rounded-2xl border border-danger/40 bg-surface py-4 active:bg-surface2"
        >
          <Text className="text-base font-semibold text-danger">{STR.settings.wipe}</Text>
        </Pressable>
        {wipeError && (
          <Text className="mt-2 text-center text-xs text-danger">
            {STR.settings.wipeFailed} — {wipeError}
          </Text>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={confirmWipe}
        message={STR.settings.wipeMessage}
        confirmLabel={STR.settings.wipeConfirm}
        cancelLabel={STR.detail.cancel}
        destructive
        onCancel={() => setConfirmWipe(false)}
        onConfirm={() => {
          setConfirmWipe(false);
          void wipeAll();
        }}
      />
    </Screen>
  );
}

/**
 * การ์ดบอกว่า build นี้มาจาก commit ไหน
 *
 * ที่ต้องมี: preview build ทุกตัวใช้ version 1.0.0 เท่ากันหมด ถ้าไม่โชว์ commit
 * ก็แยกไม่ออกว่า APK ที่ลงไว้เป็นคนละชุดกับเว็บพรีวิวหรือเปล่า
 * ค่า commitSha ถูกฝังตอน build ผ่าน app.config.js (ดูคำอธิบายในไฟล์นั้น)
 */
function BuildInfoCard() {
  const c = useColors();
  const version = Constants.expoConfig?.version ?? '—';
  const commitSha = (Constants.expoConfig?.extra?.commitSha as string | undefined) ?? 'dev';
  const isDev = commitSha === 'dev';

  return (
    <View className="mt-4 rounded-2xl border border-stroke bg-surface p-4">
      <View className="flex-row items-center">
        <GitCommitHorizontal size={16} color={c.primary} />
        <Text className="ml-2 text-base font-semibold text-ink">{STR.settings.versionTitle}</Text>
      </View>
      <Text className="mt-2 text-sm text-ink">
        {STR.appName} {version}
        {!isDev && <Text className="text-muted"> · {commitSha.slice(0, 7)}</Text>}
      </Text>
      <Text className="mt-1 text-xs text-subtle">
        {isDev ? STR.settings.versionDev : STR.settings.versionHint}
      </Text>
    </View>
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

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import Screen from '@/components/ui/Screen';
import SubHeader from '@/components/ui/SubHeader';
import { THEME } from '@/constants/palette';
import { STR } from '@/constants/strings';
import { activitiesCollection, database, sessionsCollection } from '@/database';
import { seedDefaultCategoriesIfNeeded } from '@/database/seed';
import { useQueryCount } from '@/hooks/useQuery';
import {
  cancelDailyReminder,
  ensureNotificationPermission,
  scheduleDailyReminder,
} from '@/services/notificationService';
import {
  getReminderSettings,
  setOnboardingDone,
  setReminderSettings,
} from '@/services/settingsService';

/**
 * หน้าตั้งค่า — แจ้งเตือนรายวัน (local ล้วน), ข้อมูลความเป็นส่วนตัว,
 * จำนวนข้อมูล และการลบข้อมูลทั้งหมด
 */
export default function SettingsScreen() {
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
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
    // reset ล้าง localStorage ในไฟล์ DB ด้วย — คืนค่าที่จำเป็นกลับ
    await setOnboardingDone();
    await seedDefaultCategoriesIfNeeded();
    setEnabled(false);
  };

  if (!loaded) return <Screen />;

  return (
    <Screen>
      <SubHeader title={STR.settings.title} />
      <ScrollView contentContainerClassName="px-5 pb-10">
        {/* การแจ้งเตือน */}
        <View className="rounded-2xl border border-stroke bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 text-base text-ink">{STR.settings.reminder}</Text>
            <Switch
              value={enabled}
              onValueChange={toggleReminder}
              trackColor={{ true: THEME.primarySoft, false: THEME.stroke }}
              thumbColor={enabled ? THEME.primary : THEME.muted}
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
            <Ionicons name="lock-closed" size={16} color={THEME.success} />
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

function Stepper({
  children,
  onDec,
  onInc,
}: {
  children: React.ReactNode;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <View className="flex-row items-center rounded-xl border border-stroke bg-surface2">
      <Pressable onPress={onDec} hitSlop={6} className="px-3 py-2">
        <Ionicons name="remove" size={16} color={THEME.muted} />
      </Pressable>
      <Text className="w-8 text-center text-lg font-bold text-ink">{children}</Text>
      <Pressable onPress={onInc} hitSlop={6} className="px-3 py-2">
        <Ionicons name="add" size={16} color={THEME.muted} />
      </Pressable>
    </View>
  );
}

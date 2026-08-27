import { Bell, Minus, Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';

import Screen from '@/components/ui/Screen';
import SubHeader from '@/components/ui/SubHeader';
import { useColors } from '@/hooks/useColors';
import { STR } from '@/constants/strings';
import {
  cancelDailyReminder,
  ensureNotificationPermission,
  scheduleDailyReminder,
} from '@/services/notificationService';
import { getReminderSettings, setReminderSettings } from '@/services/settingsService';

/** หน้าการแจ้งเตือน — ตั้ง/ปิดการเตือนให้จับเวลาทุกวัน (local notification ล้วน) */
export default function NotificationsScreen() {
  const c = useColors();
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(20);
  const [minute, setMinute] = useState(0);
  const [loaded, setLoaded] = useState(false);
  // โชว์เป็นข้อความในหน้าแทน Alert.alert — บนเว็บ Alert เป็น no-op ผู้ใช้จะงงว่า
  // ทำไมสวิตช์เด้งกลับเองโดยไม่บอกอะไร
  const [permissionError, setPermissionError] = useState(false);

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
        setPermissionError(true);
        setEnabled(false);
        await setReminderSettings({ ...next, enabled: false });
        await cancelDailyReminder();
        return;
      }
      setPermissionError(false);
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

  if (!loaded) return <Screen />;

  return (
    <Screen>
      <SubHeader title={STR.notifications.title} />
      <ScrollView contentContainerClassName="px-5 pb-10">
        {/* คำอธิบายสั้น ๆ */}
        <View className="mb-4 rounded-2xl border border-stroke bg-surface p-4">
          <View className="flex-row items-center">
            <Bell size={16} color={c.primary} />
            <Text className="ml-2 text-base font-semibold text-ink">{STR.notifications.title}</Text>
          </View>
          <Text className="mt-2 text-sm leading-6 text-muted">{STR.notifications.pageIntro}</Text>
        </View>

        {/* เตือนให้จับเวลาทุกวัน */}
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

          {permissionError && (
            <Text className="mt-3 text-xs text-danger">{STR.settings.permissionDenied}</Text>
          )}

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

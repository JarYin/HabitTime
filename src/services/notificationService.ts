/**
 * แจ้งเตือนรายวันแบบ Local 100% — ตั้งเวลาบนเครื่องผ่าน AlarmManager
 * ไม่ใช้ push token / เซิร์ฟเวอร์ใด ๆ ตามหลัก Privacy-First ของแอป
 * (ส่วนขยายจากเอกสาร SRS: เอกสารไม่ได้ระบุ feature นี้ แต่ช่วยเรื่อง "สร้างวินัย")
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { STR } from '@/constants/strings';

const CHANNEL_ID = 'daily-reminder';
const REMINDER_ID = 'habittime-daily-reminder';

/** เรียกครั้งเดียวตอนแอปเริ่ม — ตั้ง handler และ Android channel */
export async function configureNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'แจ้งเตือนรายวัน',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

/** ขอสิทธิ์แจ้งเตือน (Android 13+ ต้องขอตอนรันไทม์) */
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  await cancelDailyReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: STR.appName,
      body: STR.settings.reminderBody,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
}

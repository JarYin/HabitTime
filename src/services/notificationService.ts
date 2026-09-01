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

/**
 * บิลด์เว็บไม่มีโมดูลตั้งเวลาแจ้งเตือน — Metro resolve เป็น NotificationScheduler.js
 * (ไม่ใช่ .native.js) ซึ่ง export แค่ addListener/removeListeners เรียก schedule/cancel
 * แล้วจะโยน UnavailabilityError ทันที
 *
 * เคยทำให้ปุ่ม "ลบข้อมูลทั้งหมด" ในหน้าตั้งค่าและสวิตช์แจ้งเตือนตายเงียบ ๆ บนเว็บ
 * เพราะ throw ตัดก่อนถึงโค้ดที่ทำงานจริง แล้ว caller เป็น void ... ที่ไม่มีใครรับ error
 * กันไว้ตรงนี้ที่เดียว call site จะได้ไม่ต้องเช็ค platform เอง
 */
export const REMINDERS_SUPPORTED = Platform.OS !== 'web';

/** เรียกครั้งเดียวตอนแอปเริ่ม — ตั้ง handler และ Android channel */
export async function configureNotifications(): Promise<void> {
  if (!REMINDERS_SUPPORTED) return;

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
  if (!REMINDERS_SUPPORTED) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  if (!REMINDERS_SUPPORTED) return;

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
  if (!REMINDERS_SUPPORTED) return;

  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
}

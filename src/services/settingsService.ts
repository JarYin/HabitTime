/**
 * การตั้งค่าแอปแบบ key-value — ใช้ LocalStorage ที่มากับ WatermelonDB
 * (อยู่ในไฟล์ SQLite เดียวกัน ไม่ต้องเพิ่ม dependency)
 * เก็บเฉพาะค่าที่ไม่ใช่ข้อมูลส่วนตัว เช่น ธงผ่าน onboarding, เวลาแจ้งเตือน
 */
import { database } from '@/database';

const KEYS = {
  onboardingDone: 'onboarding_done',
  reminderEnabled: 'reminder_enabled',
  reminderHour: 'reminder_hour',
  reminderMinute: 'reminder_minute',
} as const;

export async function isOnboardingDone(): Promise<boolean> {
  return (await database.localStorage.get<boolean>(KEYS.onboardingDone)) === true;
}

export async function setOnboardingDone(): Promise<void> {
  await database.localStorage.set(KEYS.onboardingDone, true);
}

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

const DEFAULT_REMINDER: ReminderSettings = { enabled: false, hour: 20, minute: 0 };

export async function getReminderSettings(): Promise<ReminderSettings> {
  const [enabled, hour, minute] = await Promise.all([
    database.localStorage.get<boolean>(KEYS.reminderEnabled),
    database.localStorage.get<number>(KEYS.reminderHour),
    database.localStorage.get<number>(KEYS.reminderMinute),
  ]);
  return {
    enabled: enabled ?? DEFAULT_REMINDER.enabled,
    hour: hour ?? DEFAULT_REMINDER.hour,
    minute: minute ?? DEFAULT_REMINDER.minute,
  };
}

export async function setReminderSettings(settings: ReminderSettings): Promise<void> {
  await Promise.all([
    database.localStorage.set(KEYS.reminderEnabled, settings.enabled),
    database.localStorage.set(KEYS.reminderHour, settings.hour),
    database.localStorage.set(KEYS.reminderMinute, settings.minute),
  ]);
}

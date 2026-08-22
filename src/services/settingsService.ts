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
  themeMode: 'theme_mode',
  dailyGoalMinutes: 'daily_goal_minutes',
} as const;

export type ThemeMode = 'light' | 'dark' | 'system';

export async function getThemeMode(): Promise<ThemeMode> {
  const value = await database.localStorage.get<string>(KEYS.themeMode);
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  await database.localStorage.set(KEYS.themeMode, mode);
}

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

/**
 * เป้าหมายเวลาต่อวัน — เก็บเป็น "นาที" (ไม่ใช่ชั่วโมง) เพื่อให้ตั้งค่าแบบ
 * ครึ่งชั่วโมงได้ด้วย ค่าเริ่มต้น 240 นาที = 4 ชม. (ค่าเดิมที่เคย hardcode ไว้ที่ Dashboard)
 *
 * หมายเหตุ: wipeAllData()/ensureLocalDataBelongsTo() ใน syncService ล้าง
 * localStorage ทั้งก้อนด้วย unsafeResetDatabase() ดังนั้นเป้าหมายจะกลับไปเป็น
 * ค่าเริ่มต้นหลังลบข้อมูลทั้งหมดหรือสลับบัญชี — เหมือนพฤติกรรมของ reminder settings
 */
export const DEFAULT_DAILY_GOAL_MINUTES = 240;
export const MIN_DAILY_GOAL_MINUTES = 15;
export const MAX_DAILY_GOAL_MINUTES = 24 * 60;

export function clampGoalMinutes(minutes: number): number {
  if (!Number.isFinite(minutes)) return DEFAULT_DAILY_GOAL_MINUTES;
  return Math.min(MAX_DAILY_GOAL_MINUTES, Math.max(MIN_DAILY_GOAL_MINUTES, Math.round(minutes)));
}

export async function getDailyGoalMinutes(): Promise<number> {
  const value = await database.localStorage.get<number>(KEYS.dailyGoalMinutes);
  return typeof value === 'number' ? clampGoalMinutes(value) : DEFAULT_DAILY_GOAL_MINUTES;
}

export async function setDailyGoalMinutes(minutes: number): Promise<void> {
  await database.localStorage.set(KEYS.dailyGoalMinutes, clampGoalMinutes(minutes));
}

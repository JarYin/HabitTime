/**
 * รายการแจ้งเตือนบนกระดิ่ง — คำนวณสด ๆ จากข้อมูลที่มีอยู่แล้ว
 * (เซสชัน + เป้าหมาย + ตั้งค่าแจ้งเตือน) ไม่มีตารางเก็บแจ้งเตือนในฐานข้อมูล
 * เป็น pure function เพื่อให้อัปเดตอัตโนมัติตามข้อมูลที่หน้าจอ observe อยู่แล้ว
 */
import type { TimeSession } from '@/database/models';
import { STR } from '@/constants/strings';
import { formatDuration, toDayKey } from '@/lib/dates';
import type { ReminderSettings } from '@/services/settingsService';

export type FeedTone = 'primary' | 'success' | 'warn' | 'info';
/** ชื่อไอคอน — คอมโพเนนต์ที่ใช้แสดงผลจะ map เป็น lucide เอง (ตามแบบ @/constants/icons) */
export type FeedIcon = 'goal' | 'streak' | 'idle' | 'week' | 'reminder';

export interface FeedItem {
  id: string;
  icon: FeedIcon;
  title: string;
  body: string;
  tone: FeedTone;
}

export interface FeedInput {
  /** เซสชัน 7 วันล่าสุด (รวมวันนี้) — ตัวเดียวกับที่ Dashboard observe อยู่แล้ว */
  weekSessions: TimeSession[];
  /** สตรีคปัจจุบันจาก currentStreak() */
  streak: number;
  /** เป้าหมายรายวัน (นาที) จาก goalStore */
  goalMinutes: number;
  /** null = ยังโหลดค่าไม่เสร็จ → ข้ามรายการแจ้งเตือนเรื่องเวลาเตือนไปก่อน */
  reminder: ReminderSettings | null;
  now?: Date;
}

export function buildNotificationFeed({
  weekSessions,
  streak,
  goalMinutes,
  reminder,
  now = new Date(),
}: FeedInput): FeedItem[] {
  const todayKey = toDayKey(now);
  const todaySec = weekSessions
    .filter((s) => s.dayKey === todayKey)
    .reduce((sum, s) => sum + s.durationSec, 0);
  const weekSec = weekSessions.reduce((sum, s) => sum + s.durationSec, 0);
  const goalSec = Math.max(1, goalMinutes * 60);
  const activeDays = new Set(weekSessions.map((s) => s.dayKey)).size;

  const items: FeedItem[] = [];

  // 1-3: สถานะเป้าหมายวันนี้ — มีแถวนี้เสมอ 1 แถว
  if (todaySec >= goalSec) {
    items.push({
      id: 'goal-hit',
      icon: 'goal',
      tone: 'success',
      title: STR.notifications.goalHitTitle,
      body: STR.notifications.goalHitBody(formatDuration(todaySec)),
    });
  } else if (todaySec > 0) {
    const pct = Math.min(100, Math.round((todaySec / goalSec) * 100));
    items.push({
      id: 'goal-progress',
      icon: 'goal',
      tone: 'primary',
      title: STR.notifications.goalProgressTitle(pct),
      body: STR.notifications.goalProgressBody(formatDuration(goalSec - todaySec)),
    });
  } else {
    items.push({
      id: 'idle-today',
      icon: 'idle',
      tone: 'warn',
      title: STR.notifications.idleTitle,
      body:
        streak > 0 ? STR.notifications.idleStreakBody(streak) : STR.notifications.idleBody,
    });
  }

  // 4-5: สตรีค
  if (streak >= 2) {
    items.push({
      id: 'streak',
      icon: 'streak',
      tone: 'success',
      title: STR.notifications.streakTitle(streak),
      body: STR.notifications.streakBody,
    });
  } else if (streak === 0 && weekSessions.length > 0) {
    items.push({
      id: 'streak-broken',
      icon: 'streak',
      tone: 'warn',
      title: STR.notifications.streakBrokenTitle,
      body: STR.notifications.streakBrokenBody,
    });
  }

  // 6: สรุป 7 วัน
  if (weekSec > 0) {
    items.push({
      id: 'week',
      icon: 'week',
      tone: 'info',
      title: STR.notifications.weekTitle,
      body: STR.notifications.weekBody(formatDuration(weekSec), activeDays),
    });
  }

  // 7-8: การแจ้งเตือนรายวัน
  if (reminder?.enabled) {
    const hhmm = `${String(reminder.hour).padStart(2, '0')}:${String(reminder.minute).padStart(2, '0')}`;
    items.push({
      id: 'reminder-next',
      icon: 'reminder',
      tone: 'info',
      title: STR.notifications.reminderNextTitle,
      body: STR.notifications.reminderNextBody(hhmm),
    });
  } else if (reminder !== null) {
    items.push({
      id: 'reminder-off',
      icon: 'reminder',
      tone: 'info',
      title: STR.notifications.reminderOffTitle,
      body: STR.notifications.reminderOffBody,
    });
  }

  return items;
}

/**
 * Logic สถิติการใช้เวลา — use cases: เวลาสะสมรายวัน/สัปดาห์/เดือน,
 * กิจกรรมที่ใช้เวลามากที่สุด, กราฟ 7 วัน, สรุปบน Dashboard
 *
 * เป็น pure functions รับ records ที่หน้าจอ observe มาแล้ว
 * เพื่อให้สถิติอัปเดตอัตโนมัติเมื่อข้อมูลเปลี่ยน (reactive) และทดสอบง่าย
 */
import type { Activity, TimeSession } from '@/database/models';
import { addDays, dayKeysBetween, startOfDay, startOfMonth, startOfWeek, toDayKey } from '@/lib/dates';

export type StatsPeriod = 'daily' | 'weekly' | 'monthly';

export interface ActivityTotal {
  activity: Activity;
  totalSec: number;
  sessionCount: number;
}

export interface PeriodStats {
  totalSec: number;
  sessionCount: number;
  byActivity: ActivityTotal[];
  /** กิจกรรมที่ใช้เวลามากที่สุดในช่วงนี้ */
  topActivity: ActivityTotal | null;
}

export function periodStartDate(period: StatsPeriod, now: Date = new Date()): Date {
  switch (period) {
    case 'daily':
      return startOfDay(now);
    case 'weekly':
      return startOfWeek(now);
    case 'monthly':
      return startOfMonth(now);
  }
}

/** รวมสถิติของช่วงเวลา จาก sessions ที่กรองช่วงมาแล้ว */
export function aggregatePeriodStats(sessions: TimeSession[], activities: Activity[]): PeriodStats {
  const activityById = new Map(activities.map((a) => [a.id, a]));
  const totals = new Map<string, { totalSec: number; sessionCount: number }>();
  let totalSec = 0;

  for (const s of sessions) {
    totalSec += s.durationSec;
    const cur = totals.get(s.activityId) ?? { totalSec: 0, sessionCount: 0 };
    cur.totalSec += s.durationSec;
    cur.sessionCount += 1;
    totals.set(s.activityId, cur);
  }

  const byActivity: ActivityTotal[] = [...totals.entries()]
    .flatMap(([id, t]) => {
      const activity = activityById.get(id);
      return activity ? [{ activity, ...t }] : [];
    })
    .sort((a, b) => b.totalSec - a.totalSec);

  return {
    totalSec,
    sessionCount: sessions.length,
    byActivity,
    topActivity: byActivity[0] ?? null,
  };
}

export interface DayTotal {
  dayKey: string;
  date: Date;
  totalSec: number;
}

/** เวลารวมรายวันย้อนหลัง N วัน (รวมวันนี้) สำหรับกราฟแท่ง */
export function aggregateDailyTotals(
  sessions: TimeSession[],
  days: number,
  now: Date = new Date(),
): DayTotal[] {
  const from = addDays(startOfDay(now), -(days - 1));
  const keys = dayKeysBetween(from, now);

  const perDay = new Map<string, number>(keys.map((k) => [k, 0]));
  for (const s of sessions) {
    if (perDay.has(s.dayKey)) {
      perDay.set(s.dayKey, (perDay.get(s.dayKey) ?? 0) + s.durationSec);
    }
  }

  return keys.map((dayKey, i) => ({
    dayKey,
    date: addDays(from, i),
    totalSec: perDay.get(dayKey) ?? 0,
  }));
}

/**
 * จำนวนวันที่ทำกิจกรรมต่อเนื่องจนถึงปัจจุบัน (streak)
 * นับถอยหลังจากวันนี้ (หรือเริ่มจากเมื่อวานถ้าวันนี้ยังไม่มี) จนเจอวันที่ว่าง
 */
export function currentStreak(sessions: TimeSession[], now: Date = new Date()): number {
  const activeDays = new Set(sessions.map((s) => s.dayKey));
  let streak = 0;
  let cursor = startOfDay(now);
  // ถ้าวันนี้ยังไม่มีกิจกรรม ให้เริ่มนับจากเมื่อวาน (ยังถือว่า streak ไม่ขาด)
  if (!activeDays.has(toDayKey(cursor))) cursor = addDays(cursor, -1);
  while (activeDays.has(toDayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** รวมเวลาต่อกิจกรรม (ใช้ทำ "เวลาสะสม" ในลิสต์กิจกรรม) */
export function totalsByActivity(sessions: TimeSession[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const s of sessions) {
    totals.set(s.activityId, (totals.get(s.activityId) ?? 0) + s.durationSec);
  }
  return totals;
}

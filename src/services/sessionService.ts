/**
 * Logic บันทึก/ค้นประวัติการจับเวลา — use cases: บันทึกเวลาที่ใช้ในกิจกรรม,
 * ดูประวัติ (แสดงทั้งหมด, กรองตามหมวดหมู่, กรองช่วงวันที่)
 */
import { Q } from '@nozbe/watermelondb';

import { database, sessionsCollection } from '@/database';
import type { TimeSession } from '@/database/models';
import { toDayKey } from '@/lib/dates';

export interface SaveSessionInput {
  activityId: string;
  startedAt: Date;
  endedAt: Date;
  durationSec: number;
  note?: string;
}

/** เซสชันที่สั้นกว่านี้ถือว่ากดเล่น ไม่บันทึก */
export const MIN_SESSION_SEC = 5;

export async function saveSession(input: SaveSessionInput): Promise<TimeSession> {
  return database.write(async () =>
    sessionsCollection.create((session) => {
      session.activityId = input.activityId;
      session.startedAt = input.startedAt;
      session.endedAt = input.endedAt;
      session.durationSec = Math.floor(input.durationSec);
      session.dayKey = toDayKey(input.endedAt);
      session.setNote(input.note ?? '');
    }),
  );
}

/**
 * ลบประวัติหนึ่งรายการ — ต้อง markAsDeleted (ไม่ใช่ destroyPermanently) เพราะแอป
 * sync กับคลาวด์: destroyPermanently ไม่ถูกส่งขึ้นคลาวด์ รอบ sync ถัดไปจะดึงกลับมา
 */
export async function deleteSession(session: TimeSession): Promise<void> {
  await database.write(async () => {
    await session.markAsDeleted();
  });
}

export interface HistoryFilter {
  categoryId?: string | null;
  /** day key เริ่มต้น (รวม) เช่น '2026-06-28' — ไม่ใส่ = ทั้งหมด */
  fromDayKey?: string | null;
}

/** Query ประวัติ (ล่าสุดก่อน) ตามตัวกรองของหน้า "ประวัติ" */
export function historyQuery(filter: HistoryFilter = {}) {
  const clauses: Q.Clause[] = [];
  if (filter.fromDayKey) {
    clauses.push(Q.where('day_key', Q.gte(filter.fromDayKey)));
  }
  if (filter.categoryId) {
    clauses.push(Q.on('activities', 'category_id', filter.categoryId));
  }
  clauses.push(Q.sortBy('ended_at', Q.desc));
  return sessionsCollection.query(...clauses);
}

/** Query เซสชันล่าสุดของกิจกรรมหนึ่ง (หน้ารายละเอียดกิจกรรม) */
export function activitySessionsQuery(activityId: string, limit = 20) {
  return sessionsCollection.query(
    Q.where('activity_id', activityId),
    Q.sortBy('ended_at', Q.desc),
    Q.take(limit),
  );
}

/** Query เซสชันทั้งหมดของกิจกรรมหนึ่ง (คำนวณเวลาสะสม/จำนวนครั้ง) */
export function allActivitySessionsQuery(activityId: string) {
  return sessionsCollection.query(Q.where('activity_id', activityId));
}

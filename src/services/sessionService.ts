/**
 * Logic บันทึก/ค้นประวัติการจับเวลา — use cases: บันทึกเวลาที่ใช้ในกิจกรรม,
 * ดูประวัติ (แสดงทั้งหมด, กรองตามหมวดหมู่, กรองช่วงวันที่)
 */
import { Q } from '@nozbe/watermelondb';

import { database, sessionsCollection } from '@/database';
import type { TimeSession } from '@/database/models';
import { currentTzOffsetMin, toDayKey } from '@/lib/dates';

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
      /**
       * ยึด "วันที่เริ่มจับเวลา" ไม่ใช่วันที่จบ
       *
       * เดิมใช้ endedAt ทำให้เซสชัน จันทร์ 23:40 → อังคาร 00:20 ถูกนับเป็นวันอังคาร
       * ทั้ง 40 นาที ผลคือกราฟวันจันทร์ขึ้น 0 ประวัติไม่มีวันจันทร์ และ currentStreak
       * มองไม่เห็นวันจันทร์ — streak ที่ผู้ใช้ต่อไว้จริงเมื่อคืนกลับถูกนับว่าขาด
       * ซ้ำยังทำให้ยอด "วันนี้" ของวันอังคารขึ้น 40 นาทีตั้งแต่ตี 00:20 ทั้งที่ยังไม่ได้ทำอะไร
       *
       * ผู้ใช้เข้าใจว่า "กิจกรรมนี้ทำเมื่อคืนวันจันทร์" การยึดวันที่เริ่มจึงตรงกับความรู้สึกกว่า
       */
      session.dayKey = toDayKey(input.startedAt);
      // เก็บโซนเวลาของเครื่องที่บันทึกไว้คู่กัน เพื่อให้เวลาที่แสดงตรงกับ dayKey
      // เสมอแม้เปิดดูจากเครื่องคนละโซนเวลา (ดู formatThaiTimeAt)
      session.tzOffsetMin = currentTzOffsetMin();
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

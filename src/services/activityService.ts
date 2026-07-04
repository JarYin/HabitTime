/**
 * Logic จัดการกิจกรรม (CRUD) — use cases: เพิ่ม/แก้ไข/ลบกิจกรรม, ดูกิจกรรมทั้งหมด
 * หน้าจอควรเรียกผ่านชั้นนี้เสมอ ไม่แตะ database/crypto ตรง ๆ
 */
import { Q } from '@nozbe/watermelondb';

import { activitiesCollection, database } from '@/database';
import type { Activity } from '@/database/models';

export interface ActivityInput {
  name: string;
  categoryId: string;
  emoji: string;
  color: string;
}

export async function createActivity(input: ActivityInput): Promise<Activity> {
  return database.write(async () =>
    activitiesCollection.create((activity) => {
      activity.setName(input.name.trim());
      activity.categoryId = input.categoryId;
      activity.emoji = input.emoji;
      activity.color = input.color;
      activity.isArchived = false;
    }),
  );
}

export async function updateActivity(activity: Activity, input: ActivityInput): Promise<void> {
  await database.write(async () => {
    await activity.update((a) => {
      a.setName(input.name.trim());
      a.categoryId = input.categoryId;
      a.emoji = input.emoji;
      a.color = input.color;
    });
  });
}

/** ลบกิจกรรมถาวร พร้อมประวัติการจับเวลาทั้งหมดของมัน (ตาม use case "ยืนยันการลบ") */
export async function deleteActivity(activity: Activity): Promise<void> {
  await database.write(async () => {
    const sessions = await activity.sessions.fetch();
    await database.batch(
      ...sessions.map((s) => s.prepareDestroyPermanently()),
      activity.prepareDestroyPermanently(),
    );
  });
}

/** Query กิจกรรมที่ยังใช้งานอยู่ (ใหม่สุดก่อน) — นำไป observe ใน UI */
export function activeActivitiesQuery() {
  return activitiesCollection.query(
    Q.where('is_archived', false),
    Q.sortBy('created_at', Q.desc),
  );
}

export function findActivity(id: string): Promise<Activity> {
  return activitiesCollection.find(id);
}

/**
 * ค้นหาตามชื่อ — ทำใน memory เพราะชื่อถูกเข้ารหัสในฐานข้อมูล
 * (ข้อมูลเป็นของผู้ใช้คนเดียว หลักสิบรายการ จึงไม่มีปัญหาประสิทธิภาพ)
 */
export function filterActivitiesByName(activities: Activity[], search: string): Activity[] {
  const q = search.trim().toLowerCase();
  if (!q) return activities;
  return activities.filter((a) => a.name.toLowerCase().includes(q));
}

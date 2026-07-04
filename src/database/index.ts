/**
 * จุดสร้างฐานข้อมูล WatermelonDB (SQLite บนเครื่อง — ไม่มี sync, ไม่มีเซิร์ฟเวอร์)
 * jsi ปิดไว้: android-jsi native module ไม่ได้ autolink และปลั๊กอิน watermelondb-expo-plugin
 * ยังไม่รองรับ bridgeless architecture ของ RN ตัวใหม่ (getJSIModulePackage ถูกลบไปแล้ว)
 */
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import migrations from './migrations';
import { Activity, Category, TimeSession } from './models';
import schema from './schema';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'habittime',
  jsi: false,
  onSetUpError: (error) => {
    // ฐานข้อมูลเปิดไม่ได้ = แอปใช้งานไม่ได้ — log ไว้ให้เห็นชัดตอน dev
    console.error('[HabitTime] Database failed to load', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Category, Activity, TimeSession],
});

export const categoriesCollection = database.get<Category>('categories');
export const activitiesCollection = database.get<Activity>('activities');
export const sessionsCollection = database.get<TimeSession>('time_sessions');

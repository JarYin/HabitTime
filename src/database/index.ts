/**
 * จุดสร้างฐานข้อมูล WatermelonDB (บนเครื่อง — ไม่มี sync, ไม่มีเซิร์ฟเวอร์)
 * ตัว adapter แยกตาม platform: native = SQLite (adapter.ts), web = LokiJS (adapter.web.ts)
 */
import { Database } from '@nozbe/watermelondb';

import adapter from './adapter';
import { Activity, Category, TimeSession } from './models';

export const database = new Database({
  adapter,
  modelClasses: [Category, Activity, TimeSession],
});

export const categoriesCollection = database.get<Category>('categories');
export const activitiesCollection = database.get<Activity>('activities');
export const sessionsCollection = database.get<TimeSession>('time_sessions');

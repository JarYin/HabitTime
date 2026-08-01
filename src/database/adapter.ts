/**
 * Adapter สำหรับ native (iOS/Android) — SQLite บนเครื่อง
 * jsi ปิดไว้: android-jsi native module ไม่ได้ autolink และปลั๊กอิน watermelondb-expo-plugin
 * ยังไม่รองรับ bridgeless architecture ของ RN ตัวใหม่ (getJSIModulePackage ถูกลบไปแล้ว)
 *
 * เว็บใช้ไฟล์คู่กัน adapter.web.ts (Metro เลือกให้อัตโนมัติตาม platform)
 */
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import migrations from './migrations';
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

export default adapter;

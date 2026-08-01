/**
 * Adapter สำหรับเว็บ (พรีวิวบน GitHub Pages) — LokiJS + IndexedDB
 * SQLiteAdapter ต้องพึ่ง native module ที่เบราว์เซอร์ไม่มี ถ้าปล่อยให้ import
 * บนเว็บจะ throw ตั้งแต่ตอนโหลดโมดูล ทำให้หน้าจอขาวทั้งหน้า
 *
 * ไฟล์นี้ถูกใช้เฉพาะตอน bundle platform=web เท่านั้น (Metro platform extension)
 * bundle ของ iOS/Android ยังใช้ adapter.ts (SQLite) เหมือนเดิม
 */
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

import migrations from './migrations';
import schema from './schema';

const adapter = new LokiJSAdapter({
  schema,
  migrations,
  dbName: 'habittime',
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  onSetUpError: (error) => {
    console.error('[HabitTime] Database failed to load', error);
  },
});

export default adapter;

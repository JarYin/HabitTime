/**
 * Schema migrations — ตอนนี้ยังเป็นเวอร์ชัน 1 จึงไม่มี migration
 * เมื่อแก้ schema ครั้งถัดไป: เพิ่ม version ใน schema.ts แล้วเพิ่มขั้นตอนที่นี่
 * ดู https://watermelondb.dev/docs/Advanced/Migrations
 */
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [],
});

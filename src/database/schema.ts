/**
 * Database Schema ของ HabitTime — อ้างอิงจากเอกสาร SRS 1.0/2.0 (@uploads)
 *
 * โมเดลข้อมูลตามเอกสาร: กิจกรรม (Activity) 1 ── * บันทึกการจับเวลา (TimeSession)
 * และกิจกรรมสังกัดหมวดหมู่ (Category)
 *
 * - activities:     ชื่อ (เข้ารหัส), หมวดหมู่, อิโมจิ, สี   ← use case "เพิ่มกิจกรรม"
 * - time_sessions:  ผลจากปุ่ม "สิ้นสุดและบันทึกเวลา" — ระยะเวลา + วันที่ทำกิจกรรม
 * - categories:     หมวดหมู่ให้เลือก/กรอง (seed ค่าเริ่มต้นตอนเปิดแอปครั้งแรก)
 *
 * หมายเหตุเรื่องความเป็นส่วนตัว: คอลัมน์ *_enc ถูกเข้ารหัส AES-256-GCM
 * ส่วนคอลัมน์ที่ใช้ query (foreign key, day_key, ตัวเลขเวลา) เป็น plaintext
 * เพื่อให้ WHERE / INDEX / อัดรวมสถิติยังทำงานได้ (ดู src/lib/crypto/fieldCipher.ts)
 */
import { appSchema, tableSchema } from '@nozbe/watermelondb';

/**
 * v2 — เพิ่ม time_sessions.tz_offset_min
 *
 * day_key เป็นสตริงเวลาท้องถิ่นของ "เครื่องที่บันทึก" แต่ started_at/ended_at เป็น
 * epoch ms การซิงก์คัดลอก day_key ไปตรง ๆ ค่าทั้งสองจึงหลุดจากกันเมื่อเปิดบัญชี
 * เดียวกันบนเครื่องคนละโซนเวลา (หรือผู้ใช้คนเดียวที่เดินทางข้ามโซน) — แถวประวัติ
 * จะแสดงเวลาตามโซนของเครื่องที่กำลังดู แต่ยังจัดกลุ่มอยู่ใต้วันเดิม
 * เก็บ offset ตอนบันทึกไว้ด้วย เวลาที่แสดงจะได้ตรงกับ day_key เสมอทุกเครื่อง
 */
export const SCHEMA_VERSION = 2;

export default appSchema({
  version: SCHEMA_VERSION,
  tables: [
    tableSchema({
      name: 'categories',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'emoji', type: 'string' },
        { name: 'color', type: 'string' },
        { name: 'is_default', type: 'boolean' },
        { name: 'sort_order', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'activities',
      columns: [
        // ชื่อกิจกรรม — ข้อมูลส่วนตัว จึงเก็บแบบเข้ารหัส
        { name: 'name_enc', type: 'string' },
        { name: 'category_id', type: 'string', isIndexed: true },
        { name: 'emoji', type: 'string' },
        { name: 'color', type: 'string' },
        { name: 'is_archived', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'time_sessions',
      columns: [
        { name: 'activity_id', type: 'string', isIndexed: true },
        // เวลาเริ่ม/จบ (epoch ms) — ended_at คือ "วันที่ทำกิจกรรม" ตามเอกสาร
        { name: 'started_at', type: 'number' },
        { name: 'ended_at', type: 'number' },
        // วินาทีที่จับได้จริง (หักช่วงกดพักแล้ว)
        { name: 'duration_sec', type: 'number' },
        // วันที่ท้องถิ่นรูปแบบ YYYY-MM-DD ใช้กรองช่วงวันที่/ปฏิทิน/สถิติ
        { name: 'day_key', type: 'string', isIndexed: true },
        // นาทีที่ชดเชยจาก UTC ของเครื่องที่บันทึก (ไทย = +420) ใช้แสดงเวลาให้ตรงกับ
        // day_key เสมอ ไม่ว่าจะเปิดดูจากเครื่องที่ตั้งโซนเวลาอะไร
        // isOptional เพราะแถวที่บันทึกก่อน schema v2 ไม่มีค่านี้ (ดู migrations.ts)
        { name: 'tz_offset_min', type: 'number', isOptional: true },
        // โน้ตเพิ่มเติม (เข้ารหัส, ไม่บังคับ)
        { name: 'note_enc', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

/**
 * Schema migrations
 * เมื่อแก้ schema: เพิ่ม SCHEMA_VERSION ใน schema.ts แล้วเพิ่มขั้นตอนที่นี่
 * ดู https://watermelondb.dev/docs/Advanced/Migrations
 *
 * หมายเหตุ: syncService ต้องส่ง migrationsEnabledAtVersion ให้ synchronize() ด้วย
 * ไม่งั้นเครื่องที่ติดตั้งอยู่ก่อนจะคง lastPulledAt เดิมไว้แล้วไม่มีวันดึงข้อมูลย้อนหลัง
 * มาเติมคอลัมน์ใหม่ แถวเก่าจะค้างเป็นค่า default ไปตลอด
 */
import { addColumns, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'time_sessions',
          columns: [{ name: 'tz_offset_min', type: 'number', isOptional: true }],
        }),
      ],
    },
  ],
});

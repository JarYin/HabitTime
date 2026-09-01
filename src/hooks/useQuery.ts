/**
 * Hooks สำหรับ subscribe ข้อมูล WatermelonDB แบบ reactive
 * (ทางเลือกที่เบากว่า HOC withObservables — เข้ากับ function components)
 */
import type { Model, Query } from '@nozbe/watermelondb';
import { useEffect, useState } from 'react';

import { useAppStore } from '@/stores/appStore';

/**
 * subscribe รายการผลลัพธ์ของ query — re-render อัตโนมัติเมื่อข้อมูลเปลี่ยน
 *
 * ล้างผลลัพธ์เดิมทุกครั้งที่ deps เปลี่ยน (เหมือนที่ useRecord ทำ) ไม่งั้นจะค้าง
 * แสดงข้อมูลชุดก่อนหน้าใต้ป้ายชุดใหม่ระหว่างรอ subscription ใหม่ตอบกลับ —
 * เช่นสลับช่วงเวลาในหน้าสถิติจาก "เดือน" เป็น "วัน" แล้วเห็นยอดทั้งเดือนใต้ป้าย "รวมวันนี้"
 */
export function useQueryList<T extends Model>(makeQuery: () => Query<T>, deps: unknown[]): T[] {
  const [records, setRecords] = useState<T[]>([]);
  const dbGeneration = useAppStore((s) => s.dbGeneration);

  useEffect(() => {
    // ตั้งใจรีเซ็ตทันทีที่ deps เปลี่ยน — ถ้ารอให้ subscription ใหม่ตอบก่อน หน้าจอจะ
    // แสดงข้อมูลชุดเก่าใต้ป้ายชุดใหม่ชั่วขณะ (บั๊กที่เห็นชัดในหน้าสถิติตอนสลับช่วงเวลา)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecords([]);
    const subscription = makeQuery().observe().subscribe(setRecords);
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, dbGeneration]);

  return records;
}

/** subscribe จำนวนแถวของ query */
export function useQueryCount<T extends Model>(makeQuery: () => Query<T>, deps: unknown[]): number {
  const [count, setCount] = useState(0);
  const dbGeneration = useAppStore((s) => s.dbGeneration);

  useEffect(() => {
    // เหตุผลเดียวกับ useQueryList — ดูคำอธิบายด้านบน
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCount(0);
    const subscription = makeQuery().observeCount().subscribe(setCount);
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, dbGeneration]);

  return count;
}

/**
 * subscribe record เดี่ยวจาก id — คืน undefined ระหว่างโหลด และ null ถ้าไม่พบ/ถูกลบ
 * (เมื่อ record ถูกลบ observable จะ error → แปลงเป็น null ให้หน้าจอพากลับเอง)
 */
export function useRecord<T extends Model>(
  collection: { findAndObserve: (id: string) => import('rxjs').Observable<T> },
  id: string,
): T | null | undefined {
  const [record, setRecord] = useState<T | null | undefined>(undefined);
  const dbGeneration = useAppStore((s) => s.dbGeneration);

  useEffect(() => {
    // เหตุผลเดียวกับ useQueryList — ดูคำอธิบายด้านบน
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecord(undefined);
    const subscription = collection.findAndObserve(id).subscribe({
      next: setRecord,
      error: () => setRecord(null),
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, dbGeneration]);

  return record;
}

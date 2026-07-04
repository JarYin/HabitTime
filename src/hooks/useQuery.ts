/**
 * Hooks สำหรับ subscribe ข้อมูล WatermelonDB แบบ reactive
 * (ทางเลือกที่เบากว่า HOC withObservables — เข้ากับ function components)
 */
import type { Model, Query } from '@nozbe/watermelondb';
import { useEffect, useState } from 'react';

/** subscribe รายการผลลัพธ์ของ query — re-render อัตโนมัติเมื่อข้อมูลเปลี่ยน */
export function useQueryList<T extends Model>(makeQuery: () => Query<T>, deps: unknown[]): T[] {
  const [records, setRecords] = useState<T[]>([]);

  useEffect(() => {
    const subscription = makeQuery().observe().subscribe(setRecords);
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return records;
}

/** subscribe จำนวนแถวของ query */
export function useQueryCount<T extends Model>(makeQuery: () => Query<T>, deps: unknown[]): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const subscription = makeQuery().observeCount().subscribe(setCount);
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

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

  useEffect(() => {
    setRecord(undefined);
    const subscription = collection.findAndObserve(id).subscribe({
      next: setRecord,
      error: () => setRecord(null),
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return record;
}

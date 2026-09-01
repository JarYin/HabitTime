/**
 * "ตอนนี้" ที่รู้จักการข้ามวัน — คืนค่า Date ที่เปลี่ยนอ้างอิงใหม่เมื่อวันเปลี่ยนจริง
 *
 * ที่ต้องมี: ทุกหน้าเคยคำนวณ `const now = new Date()` ใน render body เฉย ๆ แต่
 * ไม่มี AppState listener ไม่มี interval และไม่มี useFocusEffect ที่ไหนเลย
 * การพับแอปไว้ไม่ได้ unmount หน้าจอ และการกลับเข้ามาก็ไม่ทำให้ re-render
 * ผู้ใช้ที่เปิดแอปค้างข้ามคืนจึงยังเห็นยอดของเมื่อวานภายใต้หัวข้อ "วันนี้"
 * พร้อม streak และเปอร์เซ็นต์เป้าหมายของวันเก่าค้างอยู่จนกว่าจะมีข้อมูลอื่นเปลี่ยน
 *
 * ตัวกระตุ้นสองทาง:
 *   1. กลับเข้าแอป (AppState 'active') — เคสที่พบบ่อยที่สุด
 *   2. ตั้งเวลาไว้ที่เที่ยงคืนพอดี — เผื่อผู้ใช้เปิดหน้าจอค้างไว้ข้ามวัน
 *
 * คืนค่าเป็น Date ที่ "เสถียรตลอดวัน" (อ้างอิงเดิมจนกว่าจะข้ามวัน) จึงใช้เป็น
 * dependency ของ useMemo ได้ตรง ๆ โดยไม่ทำให้ memo พังทุกเรนเดอร์
 */
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { toDayKey } from '@/lib/dates';

/** มิลลิวินาทีจากตอนนี้ถึงเที่ยงคืนถัดไป (บวก 1 วินาทีกันตื่นก่อนเวลา) */
function msUntilNextMidnight(from: Date): number {
  const next = new Date(from);
  next.setHours(24, 0, 1, 0);
  return next.getTime() - from.getTime();
}

export function useToday(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // เปลี่ยนอ้างอิงเฉพาะตอนที่ "วัน" เปลี่ยนจริงเท่านั้น ไม่งั้น useMemo ที่ผูกกับ
    // ค่านี้จะคำนวณใหม่ทุกครั้งที่แอปกลับมา foreground โดยไม่จำเป็น
    const refreshIfDayChanged = () =>
      setNow((prev) => {
        const current = new Date();
        return toDayKey(current) === toDayKey(prev) ? prev : current;
      });

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshIfDayChanged();
    });

    let timer: ReturnType<typeof setTimeout>;
    const scheduleMidnight = () => {
      timer = setTimeout(() => {
        refreshIfDayChanged();
        scheduleMidnight();
      }, msUntilNextMidnight(new Date()));
    };
    scheduleMidnight();

    return () => {
      appStateSub.remove();
      clearTimeout(timer);
    };
  }, []);

  return now;
}

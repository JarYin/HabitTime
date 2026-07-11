/**
 * ทดสอบการเชื่อมต่อ Firestore — เรียกเพื่อยืนยันว่าแก้ปัญหา failed connect ได้แล้ว
 * อ่านเอกสาร health/ping (ไม่ต้องมีอยู่จริง — แค่ต่อ backend สำเร็จก็ถือว่าเชื่อมได้)
 */
import { doc, getDoc } from 'firebase/firestore';

import { db } from './config';

export async function pingFirestore(): Promise<{ ok: boolean; message: string }> {
  try {
    await getDoc(doc(db, '__health__', 'ping'));
    return { ok: true, message: 'เชื่อมต่อ Firestore สำเร็จ ✅' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message: `เชื่อมต่อไม่สำเร็จ: ${message}` };
  }
}

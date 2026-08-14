/**
 * ทดสอบการเชื่อมต่อ Firestore — เรียกจาก dev tools/console เพื่อไล่ปัญหา
 *
 * อ่านเอกสารโปรไฟล์ของผู้ใช้ที่ล็อกอินอยู่ (users/{uid}) ซึ่งเป็น path เดียว
 * ที่ Security Rules อนุญาต — เอกสารจะมีอยู่จริงหรือไม่ก็ได้ แค่ต่อ backend
 * ได้โดยไม่โดนปฏิเสธก็ถือว่าเชื่อมต่อสำเร็จ
 */
import { doc, getDoc } from 'firebase/firestore';

import { currentUser } from '@/services/authService';
import { db } from './config';

export async function pingFirestore(): Promise<{ ok: boolean; message: string }> {
  const user = currentUser();
  if (!user) {
    return { ok: false, message: 'ยังไม่ได้เข้าสู่ระบบ — ล็อกอินก่อนแล้วลองใหม่' };
  }

  try {
    await getDoc(doc(db, 'users', user.uid));
    return { ok: true, message: 'เชื่อมต่อ Firestore สำเร็จ ✅' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message: `เชื่อมต่อไม่สำเร็จ: ${message}` };
  }
}

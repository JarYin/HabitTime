/**
 * จัดการกุญแจเข้ารหัสฐานข้อมูล — เวอร์ชันเว็บ
 *
 * expo-secure-store ไม่มี implementation บนเว็บเลย (ExpoSecureStore.web.js คือ
 * `export default {}`) เรียก getItemAsync แล้วจะ throw ทันที ซึ่งทำให้ init
 * ของแอปพังทั้งชุดและกดปุ่มอะไรไม่ได้ — ฝั่งเว็บจึงเก็บกุญแจใน localStorage แทน
 *
 * ⚠️ ปลอดภัยน้อยกว่าฝั่ง native อย่างมีนัยสำคัญ: native เก็บใน Android Keystore
 *    ที่หนุนด้วยฮาร์ดแวร์และแอปอื่นอ่านไม่ได้ ส่วน localStorage อ่านได้ด้วย
 *    JavaScript ใด ๆ ที่รันบน origin เดียวกัน (เช่นสคริปต์ที่ถูกแทรกผ่าน XSS)
 *    บิลด์เว็บมีไว้พรีวิว UI/flow — อย่าใช้เก็บข้อมูลจริงที่อ่อนไหว
 *
 * รูปแบบกุญแจเหมือนฝั่ง native ทุกอย่าง (AES-256-GCM, 32 ไบต์เก็บเป็น hex)
 */
import * as Crypto from 'expo-crypto';
import { bytesToHex, hexToBytes } from '@noble/ciphers/utils.js';

import { isEncryptionReady, setEncryptionKey } from './fieldCipher';

const KEY_STORAGE_NAME = 'habittime_db_field_key_v1';

export async function initEncryption(): Promise<void> {
  if (isEncryptionReady()) return;

  // ตอน prerender (expo export -p web) โค้ดรันใน Node ที่ไม่มี window เลย —
  // กุญแจชั่วคราวในหน่วยความจำใช้ได้ เพราะไม่มีฐานข้อมูลจริงให้ถอดรหัสอยู่แล้ว
  const inBrowser = typeof window !== 'undefined';
  if (!inBrowser) {
    const keyBytes = await Crypto.getRandomBytesAsync(32);
    setEncryptionKey(new Uint8Array(keyBytes));
    return;
  }

  /**
   * ในเบราว์เซอร์จริงต้องเก็บกุญแจให้ได้จริงเท่านั้น
   *
   * เดิมใช้ `storage?.setItem()` ซึ่งถ้า localStorage ถูกบล็อก (โหมดส่วนตัว,
   * ตั้งค่าปิด site data) จะเงียบ ๆ ไม่บันทึกแล้วสุ่มกุญแจใหม่ทุกครั้งที่เปิดแอป
   * ขณะที่ฐานข้อมูลอยู่ใน IndexedDB ที่ยังอยู่ครบ → เปิดครั้งที่สองถอดรหัสไม่ออก
   * ทั้งหมด → ซิงก์รอบเดียวชื่อกิจกรรมหายเกลี้ยงทุกเครื่อง
   *
   * ยอมให้ init ล้มดังกว่าปล่อยให้ข้อมูลผู้ใช้พังเงียบ ๆ
   */
  let keyHex: string | null;
  try {
    keyHex = window.localStorage.getItem(KEY_STORAGE_NAME);

    if (!keyHex) {
      const keyBytes = await Crypto.getRandomBytesAsync(32);
      keyHex = bytesToHex(new Uint8Array(keyBytes));
      window.localStorage.setItem(KEY_STORAGE_NAME, keyHex);

      // อ่านกลับเพื่อยืนยันว่าเขียนติดจริง — บางเบราว์เซอร์ไม่โยนแต่ก็ไม่บันทึก
      if (window.localStorage.getItem(KEY_STORAGE_NAME) !== keyHex) {
        throw new Error('localStorage did not persist the key');
      }
    }
  } catch (error) {
    throw new Error(
      'ไม่สามารถเก็บกุญแจเข้ารหัสในเบราว์เซอร์นี้ได้ (localStorage ถูกปิดใช้งาน) — ' +
        'กรุณาอนุญาต site data แล้วเปิดใหม่ มิฉะนั้นข้อมูลที่บันทึกไว้จะอ่านไม่ออก',
      { cause: error },
    );
  }

  setEncryptionKey(hexToBytes(keyHex));
}

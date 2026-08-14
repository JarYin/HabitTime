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

  // ตอน prerender (expo export -p web) โค้ดรันใน Node ที่ไม่มี localStorage —
  // optional chaining ทำให้ได้กุญแจชั่วคราวในหน่วยความจำแทนที่จะพัง
  const storage = globalThis.localStorage as Storage | undefined;
  let keyHex = storage?.getItem(KEY_STORAGE_NAME) ?? null;

  if (!keyHex) {
    const keyBytes = await Crypto.getRandomBytesAsync(32);
    keyHex = bytesToHex(new Uint8Array(keyBytes));
    storage?.setItem(KEY_STORAGE_NAME, keyHex);
  }

  setEncryptionKey(hexToBytes(keyHex));
}

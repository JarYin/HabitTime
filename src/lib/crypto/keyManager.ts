/**
 * จัดการกุญแจเข้ารหัสฐานข้อมูล (Data Encryption Key)
 *
 * - สร้างครั้งแรกด้วย CSPRNG (expo-crypto) ขนาด 32 ไบต์
 * - เก็บใน expo-secure-store ซึ่งบน Android หนุนด้วย Android Keystore
 *   (ค่าถูกเข้ารหัสด้วยกุญแจฮาร์ดแวร์ ไม่หลุดออกจากเครื่อง และแอปอื่นอ่านไม่ได้)
 * - โหลดเข้าหน่วยความจำตอนเปิดแอป ก่อน render UI ใด ๆ ที่แตะฐานข้อมูล
 */
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { bytesToHex, hexToBytes } from '@noble/ciphers/utils.js';

import { isEncryptionReady, setEncryptionKey } from './fieldCipher';

const KEY_STORAGE_NAME = 'habittime_db_field_key_v1';

export async function initEncryption(): Promise<void> {
  if (isEncryptionReady()) return;

  let keyHex = await SecureStore.getItemAsync(KEY_STORAGE_NAME);

  if (!keyHex) {
    const keyBytes = await Crypto.getRandomBytesAsync(32);
    keyHex = bytesToHex(new Uint8Array(keyBytes));
    await SecureStore.setItemAsync(KEY_STORAGE_NAME, keyHex, {
      // ให้อ่านได้หลังปลดล็อกเครื่องครั้งแรก — จำเป็นสำหรับ background notification ในอนาคต
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
  }

  setEncryptionKey(hexToBytes(keyHex));
}

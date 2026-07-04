/**
 * เข้ารหัส/ถอดรหัสข้อความระดับฟิลด์ด้วย AES-256-GCM
 *
 * ทำไมไม่เข้ารหัสทั้งไฟล์ฐานข้อมูล (SQLCipher)?
 * WatermelonDB ยังไม่รองรับ SQLCipher อย่างเป็นทางการ (PR Nozbe/WatermelonDB#907
 * และ #1635 ค้างอยู่หลายปี) แนวทางที่ใช้งานได้จริงบน Expo คือเข้ารหัสเฉพาะ
 * ฟิลด์ที่เป็นข้อมูลส่วนตัว (ชื่อกิจกรรม, โน้ต) โดยเก็บกุญแจไว้ใน Android Keystore
 * ส่วนคอลัมน์ที่ใช้ query (id, category_id, day_key, ตัวเลขเวลา) เก็บ plaintext
 * เพื่อให้ WHERE/INDEX ยังทำงานได้ — ค้นหาชื่อกิจกรรมทำใน memory หลังถอดรหัสแทน
 *
 * รูปแบบ payload: "v1:<nonce hex 24 ตัว>:<ciphertext+tag hex>"
 */
import { gcm } from '@noble/ciphers/aes.js';
import { bytesToHex, bytesToUtf8, hexToBytes, utf8ToBytes } from '@noble/ciphers/utils.js';
import * as Crypto from 'expo-crypto';

const VERSION_PREFIX = 'v1';
const NONCE_LENGTH = 12; // 96-bit ตามมาตรฐาน GCM

let masterKey: Uint8Array | null = null;

/** ต้องถูกเรียกจาก initEncryption() ก่อนใช้งานฐานข้อมูลเสมอ */
export function setEncryptionKey(key: Uint8Array): void {
  if (key.length !== 32) {
    throw new Error('Encryption key must be 32 bytes (AES-256)');
  }
  masterKey = key;
}

export function isEncryptionReady(): boolean {
  return masterKey !== null;
}

function requireKey(): Uint8Array {
  if (!masterKey) {
    throw new Error('Encryption key not loaded — call initEncryption() first');
  }
  return masterKey;
}

export function encryptText(plain: string): string {
  const nonce = new Uint8Array(Crypto.getRandomBytes(NONCE_LENGTH));
  const ciphertext = gcm(requireKey(), nonce).encrypt(utf8ToBytes(plain));
  return `${VERSION_PREFIX}:${bytesToHex(nonce)}:${bytesToHex(ciphertext)}`;
}

export function decryptText(payload: string | null | undefined): string {
  if (!payload) return '';
  const parts = payload.split(':');
  if (parts.length !== 3 || parts[0] !== VERSION_PREFIX) {
    // ไม่ใช่รูปแบบที่เข้ารหัส — คืนค่าดิบ (กันข้อมูลจากเวอร์ชันเก่า)
    return payload;
  }
  try {
    const plain = gcm(requireKey(), hexToBytes(parts[1])).decrypt(hexToBytes(parts[2]));
    return bytesToUtf8(plain);
  } catch (e) {
    // ถอดรหัสไม่ได้ (กุญแจผิด/ข้อมูลเสีย) — อย่าทำแอปพัง แสดงเป็นค่าว่างแทน
    console.error('decryptText failed', e);
    return '';
  }
}

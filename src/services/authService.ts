/**
 * Logic การเข้าสู่ระบบด้วยอีเมล/รหัสผ่าน (Firebase Auth)
 * หน้าจอควรเรียกผ่านชั้นนี้เสมอ ไม่เรียก firebase/auth ตรง ๆ
 *
 * ทุกฟังก์ชันโยน Error ที่ .message เป็นภาษาไทยพร้อมแสดงผลได้เลย
 */
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth } from '@/lib/firebase/auth';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';

export interface AuthUser {
  uid: string;
  email: string;
}

/** ชื่อที่เอาไปโชว์ในหน้าโปรไฟล์ — ใช้ส่วนหน้า @ ของอีเมล */
export function displayNameOf(user: AuthUser | null): string {
  if (!user) return 'ผู้ใช้ HabitTime';
  return user.email.split('@')[0] || 'ผู้ใช้ HabitTime';
}

function toAuthUser(user: User): AuthUser {
  return { uid: user.uid, email: user.email ?? '' };
}

/** แปลง error code ของ Firebase เป็นข้อความที่ผู้ใช้อ่านรู้เรื่อง */
function messageFor(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'รูปแบบอีเมลไม่ถูกต้อง';
    case 'auth/missing-password':
      return 'กรุณากรอกรหัสผ่าน';
    case 'auth/weak-password':
      return 'รหัสผ่านสั้นเกินไป ต้องมีอย่างน้อย 6 ตัวอักษร';
    case 'auth/email-already-in-use':
      return 'อีเมลนี้ถูกใช้สมัครไปแล้ว ลองเข้าสู่ระบบแทน';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
    case 'auth/too-many-requests':
      return 'ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่';
    case 'auth/network-request-failed':
      return 'เชื่อมต่ออินเทอร์เน็ตไม่ได้ กรุณาตรวจสอบสัญญาณแล้วลองใหม่';
    case 'auth/operation-not-allowed':
      return 'ยังไม่ได้เปิดวิธีล็อกอินแบบอีเมล/รหัสผ่านใน Firebase Console';
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid':
      return 'ค่า Firebase ในไฟล์ .env ไม่ถูกต้อง';
    default:
      return `เกิดข้อผิดพลาด (${code})`;
  }
}

function toFriendlyError(error: unknown): Error {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  if (code) return new Error(messageFor(code));
  return new Error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่รู้จัก');
}

/** กันเคสที่ยังไม่ได้ใส่ค่าใน .env — บอกให้ตรงจุดดีกว่าปล่อยให้ Firebase ฟ้องมั่ว */
function requireConfigured(): void {
  if (!isFirebaseConfigured) {
    throw new Error('ยังไม่ได้ตั้งค่า Firebase — ใส่ค่าในไฟล์ .env แล้วรีสตาร์ทแอป');
  }
}

export async function registerWithEmail(email: string, password: string): Promise<AuthUser> {
  requireConfigured();
  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = toAuthUser(credential.user);
    // สร้างเอกสารโปรไฟล์ไว้เป็นที่แขวนข้อมูลผู้ใช้ (คอลเลกชันย่อยของ uid นี้)
    await setDoc(
      doc(db, 'users', user.uid),
      { email: user.email, createdAt: serverTimestamp() },
      { merge: true },
    );
    return user;
  } catch (error) {
    throw toFriendlyError(error);
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  requireConfigured();
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return toAuthUser(credential.user);
  } catch (error) {
    throw toFriendlyError(error);
  }
}

export async function sendResetEmail(email: string): Promise<void> {
  requireConfigured();
  if (!email.trim()) throw new Error('กรอกอีเมลก่อน แล้วกด "ลืมรหัสผ่าน?" อีกครั้ง');
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    throw toFriendlyError(error);
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    throw toFriendlyError(error);
  }
}

/**
 * ติดตามสถานะล็อกอิน — เรียกครั้งเดียวตอนแอปเปิด
 * callback จะถูกเรียกทันทีหลัง Firebase อ่าน session ที่เก็บไว้เสร็จ (อาจเป็น null)
 */
export function observeAuth(callback: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => callback(user ? toAuthUser(user) : null));
}

export function currentUser(): AuthUser | null {
  return auth.currentUser ? toAuthUser(auth.currentUser) : null;
}

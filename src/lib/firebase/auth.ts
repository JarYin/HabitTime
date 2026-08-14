/**
 * Firebase Auth ฝั่ง React Native (native)
 *
 * ต้องใช้ initializeAuth + getReactNativePersistence เสมอ ไม่ใช่ getAuth เปล่า ๆ
 * มิฉะนั้น session จะอยู่แค่ในหน่วยความจำ → ปิดแอปแล้วต้องล็อกอินใหม่ทุกครั้ง
 * (persistence เก็บ refresh token ลง AsyncStorage ซึ่งมีขนาดไม่จำกัดเหมือน
 *  SecureStore ที่จำกัด 2 KB ต่อค่า — token ของ Firebase ใหญ่กว่านั้น)
 *
 * ฝั่งเว็บใช้ auth.web.ts แทน (Metro เลือกไฟล์ตาม platform ให้อัตโนมัติ)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as firebaseAuth from 'firebase/auth';
import { getAuth, initializeAuth, type Auth, type Persistence } from 'firebase/auth';

import { firebaseApp } from './config';

/**
 * getReactNativePersistence มีอยู่จริงเฉพาะใน build ฝั่ง react-native ของ
 * @firebase/auth แต่ไฟล์ typings ที่ TypeScript หยิบมาเป็นของฝั่งเว็บ จึงมองไม่เห็น
 * — cast เอาเองตรงนี้จุดเดียว
 */
const { getReactNativePersistence } = firebaseAuth as unknown as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

function createAuth(): Auth {
  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // เรียกซ้ำตอน Fast Refresh — ใช้ instance เดิมที่ initialize ไว้แล้ว
    return getAuth(firebaseApp);
  }
}

export const auth: Auth = createAuth();

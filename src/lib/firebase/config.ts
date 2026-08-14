/**
 * ตั้งค่า Firebase (JS SDK) สำหรับ React Native / Expo
 *
 * จุดสำคัญที่แก้ปัญหา "failed connect" ของ Firestore บน React Native:
 *   ค่าเริ่มต้นของ Firestore ใช้ WebChannel (gRPC-over-HTTP streaming) ซึ่ง
 *   RN/Hermes รองรับไม่ครบ ทำให้ขึ้น error
 *     "Could not reach Cloud Firestore backend. Connection failed ...
 *      WebChannelConnection RPC 'Listen' stream transport errored"
 *   วิธีแก้คือบังคับ long-polling ผ่าน initializeFirestore(...) แทน getFirestore()
 *
 * ค่า config อ่านจาก environment variables (ขึ้นต้นด้วย EXPO_PUBLIC_ ให้ Metro
 * inject ให้อัตโนมัติ) — ใส่ค่าจริงในไฟล์ .env (ดู .env.example)
 */
import { getApp, getApps, initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** ตรวจว่าใส่ค่า config ครบไหม — ถ้าขาดจะเป็นสาเหตุหนึ่งของ failed connect */
const missingKeys = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);

/**
 * true เมื่อ .env ครบทุกค่า — หน้าจอใช้ค่านี้บอกผู้ใช้ให้ชัดว่า "ยังไม่ได้ตั้งค่า"
 * แทนที่จะปล่อยให้ Firebase โยน error auth/invalid-api-key แบบงง ๆ
 */
export const isFirebaseConfigured = missingKeys.length === 0;

if (!isFirebaseConfigured) {
  console.error(
    `[Firebase] ตั้งค่าไม่ครบ ขาด: ${missingKeys.join(', ')}\n` +
      'ใส่ค่าในไฟล์ .env (คัดลอกจาก .env.example) แล้วรีสตาร์ท Metro ด้วย: npx expo start -c',
  );
}

// กัน initialize ซ้ำตอน Fast Refresh
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * Firestore ที่บังคับ long-polling — ต้องเรียก initializeFirestore ก่อน getFirestore
 * ที่ใดในแอป (เรียกครั้งเดียวที่นี่) มิฉะนั้น setting จะไม่ถูกใช้
 */
export const db = initializeFirestore(firebaseApp, {
  // แก้ "WebChannelConnection ... transport errored" / failed connect บน RN
  experimentalForceLongPolling: true,
});

export { firebaseConfig };

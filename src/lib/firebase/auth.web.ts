/**
 * Firebase Auth ฝั่งเว็บ — เวอร์ชันเว็บเก็บ session ลง IndexedDB/localStorage
 * ให้เองอยู่แล้ว จึงใช้ getAuth ได้ตรง ๆ (getReactNativePersistence ไม่มีใน build นี้)
 */
import { getAuth, type Auth } from 'firebase/auth';

import { firebaseApp } from './config';

export const auth: Auth = getAuth(firebaseApp);

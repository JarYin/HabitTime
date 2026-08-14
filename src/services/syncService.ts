/**
 * ตัวควบคุมการซิงก์ข้อมูลระหว่างเครื่อง (WatermelonDB) กับคลาวด์ (Firestore)
 *
 * สถาปัตยกรรมเป็นแบบ local-first: หน้าจอทั้งแอปยังอ่าน/เขียนฐานข้อมูลในเครื่อง
 * เหมือนเดิมทุกอย่าง (ใช้งานออฟไลน์ได้เต็มที่) ชั้นนี้ทำหน้าที่ดันของขึ้น
 * และดึงของใหม่ลงเป็นระยะ ๆ เท่านั้น — sync ล้มเหลวไม่ทำให้แอปใช้ไม่ได้
 *
 * ตัวกระตุ้นการซิงก์:
 *   1. ล็อกอินสำเร็จ (ครั้งแรกจะเป็นการดึงข้อมูลเก่าทั้งหมดลงมา)
 *   2. แก้ข้อมูลในเครื่องแล้วนิ่งครบ 4 วินาที
 *   3. สลับกลับเข้าแอป (เผื่อมีการแก้จากอีกเครื่อง)
 *   4. กดปุ่ม "ซิงก์ตอนนี้" ในหน้าตั้งค่า
 */
import { hasUnsyncedChanges, synchronize } from '@nozbe/watermelondb/sync';
import { AppState } from 'react-native';

import { database } from '@/database';
import { seedDefaultCategoriesIfNeeded } from '@/database/seed';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import {
  createFirestoreSyncBackend,
  SYNCED_TABLES,
  wipeCloudData,
} from '@/lib/firebase/syncBackend';
import { useSyncStore } from '@/stores/syncStore';
import { currentUser } from './authService';

/** uid ของบัญชีที่ข้อมูลในเครื่องตอนนี้เป็นของ — ใช้ตรวจการสลับบัญชี */
const LAST_UID_KEY = 'sync_last_uid';
const LAST_SYNCED_AT_KEY = 'sync_last_synced_at';

/** รอให้ผู้ใช้หยุดแก้ข้อมูลก่อนค่อยยิงขึ้นคลาวด์ ไม่ยิงทุกครั้งที่กดบันทึก */
const LOCAL_CHANGE_DEBOUNCE_MS = 4000;

/** กัน synchronize() ทับกันเอง — WatermelonDB ห้าม sync ซ้อน */
let inFlight: Promise<void> | null = null;

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * ถ้าเครื่องนี้เคยถูกใช้ด้วยบัญชีอื่นมาก่อน ต้องล้างข้อมูลเดิมทิ้งก่อนซิงก์
 * มิฉะนั้นกิจกรรมของคนก่อนหน้าจะถูกดันขึ้นบัญชีใหม่ทั้งดุ้น
 *
 * กรณีที่ยังไม่เคยผูกกับบัญชีไหนเลย (previousUid ว่าง) จะเก็บข้อมูลไว้ตามเดิม —
 * ตีความว่าเป็นข้อมูลที่ผู้ใช้สร้างไว้ตอนยังไม่ได้ล็อกอิน แล้วยกให้บัญชีนี้
 */
async function ensureLocalDataBelongsTo(uid: string): Promise<void> {
  const previousUid = await database.localStorage.get<string>(LAST_UID_KEY);
  if (previousUid === uid) return;

  if (previousUid) {
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
    await seedDefaultCategoriesIfNeeded();
  }

  // ตั้งค่าหลัง reset เสมอ เพราะ unsafeResetDatabase ล้าง localStorage ไปด้วย
  await database.localStorage.set(LAST_UID_KEY, uid);
}

async function runSync(uid: string): Promise<void> {
  const store = useSyncStore.getState();
  store.setSyncing();

  try {
    await ensureLocalDataBelongsTo(uid);

    const backend = createFirestoreSyncBackend(uid);
    await synchronize({
      database,
      pullChanges: backend.pullChanges,
      pushChanges: backend.pushChanges,
      // Firestore ไม่รู้ว่าเครื่องนี้มี record ไหนอยู่แล้ว จึงส่งทุกอย่างมาเป็น
      // "updated" — ธงนี้บอก WatermelonDB ว่าเป็นเรื่องปกติ ให้สร้างใหม่ถ้ายังไม่มี
      sendCreatedAsUpdated: true,
    });

    const now = Date.now();
    await database.localStorage.set(LAST_SYNCED_AT_KEY, now);
    store.setSynced(now);
  } catch (error) {
    // sync พังไม่ควรทำแอปพัง — เก็บข้อความไว้โชว์ในหน้าตั้งค่าแล้วปล่อยผ่าน
    console.error('[HabitTime] sync failed', error);
    useSyncStore.getState().setError(errorMessage(error));
  }
}

/** ซิงก์หนึ่งรอบ — เรียกซ้ำระหว่างที่รอบเก่ายังไม่จบจะได้ Promise ของรอบเดิม */
export function syncNow(): Promise<void> {
  const user = currentUser();
  if (!user || !isFirebaseConfigured) return Promise.resolve();
  if (inFlight) return inFlight;

  inFlight = runSync(user.uid).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** อ่านเวลาซิงก์ล่าสุดที่บันทึกไว้ในเครื่องเข้า store (เรียกตอนแอปเปิด) */
export async function hydrateSyncState(): Promise<void> {
  const at = await database.localStorage.get<number>(LAST_SYNCED_AT_KEY);
  useSyncStore.getState().hydrate(typeof at === 'number' ? at : null);
}

/**
 * เปิดการซิงก์อัตโนมัติ — คืนฟังก์ชันสำหรับปิด (ใช้ใน useEffect cleanup)
 */
export function startAutoSync(): () => void {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const scheduleSync = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void syncNow();
    }, LOCAL_CHANGE_DEBOUNCE_MS);
  };

  // ข้อมูลในเครื่องเปลี่ยน — เช็คก่อนว่าเป็นการแก้ของผู้ใช้จริง ไม่ใช่ผลจากการ
  // ดึงข้อมูลลงมาเอง มิฉะนั้นจะวนเป็นลูป pull → เกิด event → sync → pull
  const changesSub = database.withChangesForTables([...SYNCED_TABLES]).subscribe(() => {
    void hasUnsyncedChanges({ database }).then((dirty) => {
      if (dirty) scheduleSync();
    });
  });

  const appStateSub = AppState.addEventListener('change', (state) => {
    if (state === 'active') void syncNow();
  });

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    changesSub.unsubscribe();
    appStateSub.remove();
  };
}

/**
 * ลบข้อมูลทั้งหมด ทั้งบนเครื่องและบนคลาวด์
 *
 * ต้องลบบนคลาวด์ด้วย ไม่งั้นการซิงก์รอบถัดไปจะดึงทุกอย่างกลับมาใหม่หมด
 * (ลบบนคลาวด์แบบถาวร ไม่ใช่ soft delete — ผู้ใช้ตั้งใจให้มันหายจริง ๆ)
 */
export async function wipeAllData(): Promise<void> {
  const user = currentUser();

  if (user && isFirebaseConfigured) {
    await wipeCloudData(user.uid);
  }

  await database.write(async () => {
    await database.unsafeResetDatabase();
  });
  await seedDefaultCategoriesIfNeeded();

  if (user) {
    await database.localStorage.set(LAST_UID_KEY, user.uid);
  }
  useSyncStore.getState().reset();
}

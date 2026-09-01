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
import { isEncryptionReady } from '@/lib/crypto/fieldCipher';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import {
  createFirestoreSyncBackend,
  SYNCED_TABLES,
  wipeCloudData,
} from '@/lib/firebase/syncBackend';
import { useAppStore } from '@/stores/appStore';
import { useSyncStore } from '@/stores/syncStore';
import { currentUser } from './authService';
import { cancelDailyReminder } from './notificationService';
import { restoreDeviceSettings, snapshotDeviceSettings } from './settingsService';

/** uid ของบัญชีที่ข้อมูลในเครื่องตอนนี้เป็นของ — ใช้ตรวจการสลับบัญชี */
const LAST_UID_KEY = 'sync_last_uid';
const LAST_SYNCED_AT_KEY = 'sync_last_synced_at';

/** รอให้ผู้ใช้หยุดแก้ข้อมูลก่อนค่อยยิงขึ้นคลาวด์ ไม่ยิงทุกครั้งที่กดบันทึก */
const LOCAL_CHANGE_DEBOUNCE_MS = 4000;

/**
 * เพดานเวลาของการซิงก์หนึ่งรอบ
 *
 * ที่ต้องมี: ไม่มี timeout/abort ที่ไหนเลยในเส้นทางนี้ ถ้า Firestore ไม่ตอบ
 * (เกิดได้จริงกับ experimentalForceLongPolling บนเน็ตที่ half-open) promise จะค้าง
 * ตลอดกาล ทำให้ inFlight ไม่มีวันเป็น null → syncNow() ทุกครั้งหลังจากนั้นคืน
 * promise ค้างตัวเดิมและไม่ทำอะไร ส่วนสถานะค้างที่ 'syncing' ซึ่งไป disable ปุ่มซิงก์เอง
 * ผู้ใช้ไม่เห็น error ใด ๆ และต้องปิดแอปทิ้งอย่างเดียว
 */
const SYNC_TIMEOUT_MS = 60_000;

/** กัน synchronize() ทับกันเอง — WatermelonDB ห้าม sync ซ้อน */
let inFlight: Promise<void> | null = null;
/** uid ที่ inFlight กำลังทำงานให้ — ถ้าคนละคนต้องไม่เอา promise เดิมไปใช้ซ้ำ */
let inFlightUid: string | null = null;
/** กำลังลบข้อมูลทั้งหมดอยู่ — ห้ามเริ่มซิงก์รอบใหม่ระหว่างนี้ */
let wiping = false;

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} เกินเวลา ${ms / 1000} วินาที`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
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
    // ธีม/เป้าหมาย/เวลาแจ้งเตือน เป็นค่าของเครื่องไม่ใช่ของบัญชี แต่ unsafeResetDatabase
    // ล้าง localStorage ทั้งก้อน — เก็บไว้ก่อนแล้วคืนหลัง reset
    const deviceSettings = await snapshotDeviceSettings();

    // การแจ้งเตือนที่ตั้งไว้ในระบบปฏิบัติการไม่ได้ถูกลบไปกับฐานข้อมูล ถ้าไม่ยกเลิก
    // ผู้ใช้คนใหม่จะโดนเตือนตามเวลาที่คนก่อนหน้าตั้งไว้
    await cancelDailyReminder().catch((error) =>
      console.warn('[HabitTime] cancel reminder on account switch failed', error),
    );

    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
    await seedDefaultCategoriesIfNeeded();
    await restoreDeviceSettings(deviceSettings);

    // WatermelonDB ไม่ยิง change notification ตอน reset — ต้องบอก hooks เองให้
    // resubscribe ไม่งั้นหน้าจอของผู้ใช้คนใหม่ยังแสดงข้อมูลของคนก่อนหน้าอยู่
    useAppStore.getState().bumpDbGeneration();
  }

  // ตั้งค่าหลัง reset เสมอ เพราะ unsafeResetDatabase ล้าง localStorage ไปด้วย
  await database.localStorage.set(LAST_UID_KEY, uid);
}

async function runSync(uid: string): Promise<void> {
  const store = useSyncStore.getState();
  store.setSyncing();

  try {
    // ไม่มีกุญแจ = ถอดรหัสชื่อ/โน้ตไม่ได้ ถ้าปล่อยให้ซิงก์ต่อ toCloud จะโยน
    // (decryptTextStrict) หรือแย่กว่านั้นคือดันค่าว่างขึ้นไปทับข้อมูลจริงบนคลาวด์
    // แล้วกระจายลงทุกเครื่อง — หยุดตั้งแต่ตรงนี้ปลอดภัยกว่า
    if (!isEncryptionReady()) {
      throw new Error('ยังโหลดกุญแจเข้ารหัสไม่สำเร็จ — หยุดซิงก์ไว้ก่อนเพื่อกันข้อมูลเสียหาย');
    }

    await ensureLocalDataBelongsTo(uid);

    const backend = createFirestoreSyncBackend(uid);
    await withTimeout(
      synchronize({
        database,
        pullChanges: backend.pullChanges,
        pushChanges: backend.pushChanges,
        // Firestore ไม่รู้ว่าเครื่องนี้มี record ไหนอยู่แล้ว จึงส่งทุกอย่างมาเป็น
        // "updated" — ธงนี้บอก WatermelonDB ว่าเป็นเรื่องปกติ ให้สร้างใหม่ถ้ายังไม่มี
        sendCreatedAsUpdated: true,
        /**
         * ต้องส่งด้วย ไม่งั้น areMigrationsEnabled = false
         *
         * เครื่องที่ติดตั้งไว้ก่อนอัปเกรด schema จะคง lastPulledAt เดิมไว้แล้ว
         * ไม่มีวันดึงข้อมูลย้อนหลังมาเติมคอลัมน์ที่เพิ่งเพิ่ม แถวเก่าจะค้างเป็น
         * ค่า default ไปตลอด — ตอนนี้เพิ่ง migrate ไป v2 (tz_offset_min) จึงจำเป็นแล้ว
         */
        migrationsEnabledAtVersion: 1,
      }),
      SYNC_TIMEOUT_MS,
      'การซิงก์',
    );

    const now = Date.now();
    await database.localStorage.set(LAST_SYNCED_AT_KEY, now);
    store.setSynced(now);
  } catch (error) {
    // sync พังไม่ควรทำแอปพัง — เก็บข้อความไว้โชว์ในหน้าตั้งค่าแล้วปล่อยผ่าน
    console.error('[HabitTime] sync failed', error);
    useSyncStore.getState().setError(errorMessage(error));
  }
}

/**
 * ซิงก์หนึ่งรอบ — เรียกซ้ำระหว่างที่รอบเก่ายังไม่จบจะได้ Promise ของรอบเดิม
 *
 * ตัวกันซ้อนต้องผูกกับ uid ด้วย: เดิมถ้ารอบของผู้ใช้ A ยังค้างอยู่แล้ว B ล็อกอินเข้ามา
 * syncNow() ของ B จะได้ promise ของ A กลับไป ซิงก์ของ B ถูกข้ามทั้งหมด
 * ensureLocalDataBelongsTo(B) ไม่เคยทำงาน และ B ก็ถือฐานข้อมูลของ A ต่อไป
 */
export function syncNow(): Promise<void> {
  const user = currentUser();
  if (!user || !isFirebaseConfigured) return Promise.resolve();
  if (wiping) return Promise.resolve();
  if (inFlight && inFlightUid === user.uid) return inFlight;

  const uid = user.uid;
  const previous = inFlight ?? Promise.resolve();

  // รอบของบัญชีเก่ายังค้างอยู่ ต้องรอให้จบก่อน — WatermelonDB ห้าม synchronize() ซ้อน
  inFlightUid = uid;
  inFlight = previous
    .catch(() => undefined)
    .then(() => runSync(uid))
    .finally(() => {
      if (inFlightUid === uid) {
        inFlight = null;
        inFlightUid = null;
      }
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

  // ต้องรอรอบซิงก์ที่ค้างอยู่ให้จบก่อนเสมอ และห้ามให้รอบใหม่เริ่มระหว่างนี้
  //
  // เดิมไม่รอเลย: ถ้า auto-sync อยู่ระหว่าง pull กับ push พอดี การลบคลาวด์จะเสร็จก่อน
  // แล้ว pushChanges ที่ค้างอยู่ commit batch ของมันตามมา สร้างทุกเรคอร์ดขึ้นใหม่บน
  // Firestore ส่วนฐานข้อมูลในเครื่องถูก reset ซึ่งล้าง lastPulledAt ด้วย ซิงก์รอบถัดไป
  // จึงดึงข้อมูลที่ "ลบแล้ว" กลับลงมาทั้งชุด — การลบของผู้ใช้ถูกยกเลิกเงียบ ๆ
  wiping = true;
  try {
    if (inFlight) await inFlight.catch(() => undefined);

    // ค่าของเครื่อง (ธีม/เป้าหมาย) ไม่ใช่ "ข้อมูลกิจกรรม" ที่ผู้ใช้สั่งลบ — เก็บไว้
    const deviceSettings = await snapshotDeviceSettings();

    if (user && isFirebaseConfigured) {
      await wipeCloudData(user.uid);
    }

    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
    await seedDefaultCategoriesIfNeeded();
    await restoreDeviceSettings(deviceSettings);

    if (user) {
      await database.localStorage.set(LAST_UID_KEY, user.uid);
    }
    useSyncStore.getState().reset();
    useAppStore.getState().bumpDbGeneration();
  } finally {
    wiping = false;
  }
}

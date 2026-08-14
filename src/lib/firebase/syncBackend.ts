/**
 * Backend ของ WatermelonDB Sync ที่คุยกับ Cloud Firestore โดยตรง (ไม่ต้องมีเซิร์ฟเวอร์เอง)
 *
 * โครงสร้างข้อมูลบนคลาวด์ — แยกตามผู้ใช้ ป้องกันด้วย firestore.rules:
 *   users/{uid}/categories/{id}
 *   users/{uid}/activities/{id}
 *   users/{uid}/time_sessions/{id}
 *
 * ข้อตกลงสำคัญ 3 ข้อ:
 *
 * 1) ทุกเอกสารมีฟิลด์ syncedAt = serverTimestamp() → ใช้เป็น "นาฬิกากลาง"
 *    การดึงข้อมูลรอบถัดไปถามแค่ syncedAt > lastPulledAt จึงไม่พึ่งนาฬิกาเครื่อง
 *    (นาฬิกาแต่ละเครื่องเพี้ยนไม่ตรงกันได้ ถ้าใช้ Date.now() ข้อมูลจะหายเงียบ ๆ)
 *
 * 2) การลบใช้ soft delete (deleted: true) ไม่ลบเอกสารทิ้ง เพราะถ้าลบจริง
 *    เครื่องอื่นจะ "ไม่เห็น" ว่ามีอะไรหายไป — ต้องเหลือหลุมศพไว้ให้ดึงไปลบตาม
 *
 * 3) ฟิลด์ที่เข้ารหัสบนเครื่อง (name_enc, note_enc) ถูกถอดรหัสก่อนส่งขึ้นคลาวด์
 *    และเข้ารหัสใหม่ตอนดึงลง — กุญแจ AES อยู่ใน SecureStore ของแต่ละเครื่อง
 *    ถ้าส่ง ciphertext ขึ้นไป เครื่องอื่นจะถอดไม่ออก ความปลอดภัยบนคลาวด์
 *    อาศัย Security Rules แทน (ดู firestore.rules)
 */
import type {
  SyncDatabaseChangeSet,
  SyncPullArgs,
  SyncPushArgs,
  SyncTableChangeSet,
} from '@nozbe/watermelondb/sync';
import type { DirtyRaw } from '@nozbe/watermelondb/RawRecord';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';

import { decryptText, encryptText } from '@/lib/crypto/fieldCipher';
import { db } from './config';

/** ตารางที่ sync — ชื่อตรงกับทั้ง WatermelonDB schema และคอลเลกชันบน Firestore */
export const SYNCED_TABLES = ['categories', 'activities', 'time_sessions'] as const;
export type SyncedTable = (typeof SYNCED_TABLES)[number];

const USERS_COLLECTION = 'users';
const SYNCED_AT = 'syncedAt';
const DELETED = 'deleted';

/** writeBatch ของ Firestore จำกัด 500 operation ต่อชุด — เผื่อไว้หน่อย */
const BATCH_LIMIT = 450;

// ── ตัวช่วยแปลงชนิดข้อมูล ───────────────────────────────────────────────────
// ข้อมูลจากคลาวด์เชื่อไม่ได้ 100% (เอกสารเก่า/แก้มือใน Console) — คุมชนิดให้ตรง
// schema ของ WatermelonDB เสมอ ไม่งั้น adapter จะพังตอนเขียนลง SQLite

const asText = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const asBool = (value: unknown): boolean => value === true;

// ── ตัวแปลงข้อมูลรายตาราง ──────────────────────────────────────────────────

interface TableMapper {
  /** raw ในเครื่อง → เอกสารบนคลาวด์ (ตัด _status/_changed ทิ้งโดยปริยาย) */
  toCloud: (raw: DirtyRaw) => DocumentData;
  /** เอกสารบนคลาวด์ → raw ที่ WatermelonDB เอาไปเขียนลงเครื่องได้ */
  toLocal: (id: string, data: DocumentData) => DirtyRaw;
}

const MAPPERS: Record<SyncedTable, TableMapper> = {
  categories: {
    toCloud: (r) => ({
      name: asText(r.name),
      emoji: asText(r.emoji),
      color: asText(r.color),
      isDefault: asBool(r.is_default),
      sortOrder: asNumber(r.sort_order),
      createdAt: asNumber(r.created_at),
      updatedAt: asNumber(r.updated_at),
    }),
    toLocal: (id, d) => ({
      id,
      name: asText(d.name),
      emoji: asText(d.emoji),
      color: asText(d.color),
      is_default: asBool(d.isDefault),
      sort_order: asNumber(d.sortOrder),
      created_at: asNumber(d.createdAt),
      updated_at: asNumber(d.updatedAt),
    }),
  },

  activities: {
    toCloud: (r) => ({
      // ถอดรหัสก่อนขึ้นคลาวด์ เพื่อให้เครื่องอื่น (ที่กุญแจคนละดอก) อ่านได้
      name: decryptText(asText(r.name_enc)),
      categoryId: asText(r.category_id),
      emoji: asText(r.emoji),
      color: asText(r.color),
      isArchived: asBool(r.is_archived),
      createdAt: asNumber(r.created_at),
      updatedAt: asNumber(r.updated_at),
    }),
    toLocal: (id, d) => ({
      id,
      name_enc: encryptText(asText(d.name)),
      category_id: asText(d.categoryId),
      emoji: asText(d.emoji),
      color: asText(d.color),
      is_archived: asBool(d.isArchived),
      created_at: asNumber(d.createdAt),
      updated_at: asNumber(d.updatedAt),
    }),
  },

  time_sessions: {
    toCloud: (r) => ({
      activityId: asText(r.activity_id),
      startedAt: asNumber(r.started_at),
      endedAt: asNumber(r.ended_at),
      durationSec: asNumber(r.duration_sec),
      dayKey: asText(r.day_key),
      note: r.note_enc ? decryptText(asText(r.note_enc)) : '',
      createdAt: asNumber(r.created_at),
      updatedAt: asNumber(r.updated_at),
    }),
    toLocal: (id, d) => {
      const note = asText(d.note);
      return {
        id,
        activity_id: asText(d.activityId),
        started_at: asNumber(d.startedAt),
        ended_at: asNumber(d.endedAt),
        duration_sec: asNumber(d.durationSec),
        day_key: asText(d.dayKey),
        note_enc: note ? encryptText(note) : null,
        created_at: asNumber(d.createdAt),
        updated_at: asNumber(d.updatedAt),
      };
    },
  },
};

// ── ดึงข้อมูลลง (pull) ─────────────────────────────────────────────────────

interface PullTableResult {
  updated: DirtyRaw[];
  deleted: string[];
  /** ค่า syncedAt สูงสุดที่เห็นในรอบนี้ (ms) */
  maxSyncedAt: number;
}

async function pullTable(
  uid: string,
  table: SyncedTable,
  lastPulledAt: number | undefined,
): Promise<PullTableResult> {
  const ref = collection(db, USERS_COLLECTION, uid, table);
  // ครั้งแรก (lastPulledAt ว่าง) ดึงทั้งหมด — รอบถัดไปดึงเฉพาะที่เปลี่ยนหลังจากนั้น
  const q = lastPulledAt
    ? query(ref, where(SYNCED_AT, '>', Timestamp.fromMillis(lastPulledAt)))
    : query(ref);

  const snapshot = await getDocs(q);
  const result: PullTableResult = { updated: [], deleted: [], maxSyncedAt: 0 };
  const mapper = MAPPERS[table];

  snapshot.forEach((snap) => {
    const data = snap.data();

    const syncedAt = data[SYNCED_AT];
    if (syncedAt instanceof Timestamp) {
      result.maxSyncedAt = Math.max(result.maxSyncedAt, syncedAt.toMillis());
    }

    if (data[DELETED] === true) {
      result.deleted.push(snap.id);
    } else {
      result.updated.push(mapper.toLocal(snap.id, data));
    }
  });

  return result;
}

/**
 * ขอเวลาปัจจุบันจากเซิร์ฟเวอร์ Firestore
 *
 * จำเป็นตอนซิงก์ครั้งแรกของบัญชีที่ยังไม่มีข้อมูลบนคลาวด์เลย — ตอนนั้นไม่มี
 * syncedAt ของเอกสารไหนให้อ้างอิง แต่ WatermelonDB บังคับว่า pullChanges()
 * ต้องคืน timestamp ที่มากกว่า 0 (ไม่งั้นโยน "returned invalid timestamp")
 *
 * ไม่ใช้ Date.now() เพราะถ้านาฬิกาเครื่องเดินเร็วกว่าเซิร์ฟเวอร์ หมุดจะถูกตั้ง
 * ล้ำอนาคต แล้วข้อมูลที่เครื่องอื่นเขียนในช่วงนั้นจะถูกข้ามไปอย่างถาวร
 */
async function fetchServerTime(uid: string): Promise<number> {
  const ref = doc(db, USERS_COLLECTION, uid);
  await setDoc(ref, { syncClock: serverTimestamp() }, { merge: true });
  const snapshot = await getDoc(ref);
  const clock: unknown = snapshot.get('syncClock');
  return clock instanceof Timestamp ? clock.toMillis() : Date.now();
}

// ── ส่งข้อมูลขึ้น (push) ────────────────────────────────────────────────────

/** operation เดี่ยว ๆ ที่รอเขียน — รวมแล้วค่อยหั่นเป็น batch ละ 450 */
interface PendingWrite {
  table: SyncedTable;
  id: string;
  data: DocumentData;
  /** true = แค่ปักหลุมศพ (merge) ไม่ทับข้อมูลเดิมทั้งเอกสาร */
  merge: boolean;
}

async function commitWrites(uid: string, writes: PendingWrite[]): Promise<void> {
  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const w of writes.slice(i, i + BATCH_LIMIT)) {
      const ref = doc(db, USERS_COLLECTION, uid, w.table, w.id);
      batch.set(ref, w.data, { merge: w.merge });
    }
    await batch.commit();
  }
}

// ── ประกอบเป็น backend ให้ synchronize() เรียกใช้ ──────────────────────────

export interface FirestoreSyncBackend {
  pullChanges: (args: SyncPullArgs) => Promise<{
    changes: SyncDatabaseChangeSet;
    timestamp: number;
  }>;
  pushChanges: (args: SyncPushArgs) => Promise<void>;
}

export function createFirestoreSyncBackend(uid: string): FirestoreSyncBackend {
  return {
    async pullChanges({ lastPulledAt }) {
      const results = await Promise.all(
        SYNCED_TABLES.map((table) => pullTable(uid, table, lastPulledAt)),
      );

      // typing ของ SyncDatabaseChangeSet เป็น index signature กว้าง ๆ ที่ index
      // ด้วย literal ไม่ได้ — ประกอบเป็น Record ที่แคบกว่าแล้วค่อยส่งออกไป
      const changes = {} as Record<SyncedTable, SyncTableChangeSet>;
      let maxSyncedAt = 0;

      SYNCED_TABLES.forEach((table, i) => {
        const r = results[i];
        // ส่งทุกอย่างที่ยังไม่ถูกลบเป็น "updated" — ฝั่ง Firestore ไม่รู้ว่าเครื่องนี้
        // มี record ไหนอยู่แล้วบ้าง จึงเปิดธง sendCreatedAsUpdated ที่ฝั่ง synchronize()
        changes[table] = { created: [], updated: r.updated, deleted: r.deleted };
        maxSyncedAt = Math.max(maxSyncedAt, r.maxSyncedAt);
      });

      // ใช้ค่าสูงสุดที่ "ดึงมาได้จริง" เป็นหมุดรอบถัดไป ไม่ใช่เวลาเครื่อง
      // ถ้ารอบนี้ไม่มีอะไรใหม่ก็คงหมุดเดิมไว้ (ดีกว่าเลื่อนหมุดข้ามข้อมูลที่ยังไม่เห็น)
      const timestamp = Math.max(maxSyncedAt, lastPulledAt ?? 0);

      return {
        changes: changes as SyncDatabaseChangeSet,
        // 0 = ซิงก์ครั้งแรกและคลาวด์ยังว่างเปล่า ต้องไปขอเวลาจากเซิร์ฟเวอร์มาเป็นหมุดตั้งต้น
        timestamp: timestamp > 0 ? timestamp : await fetchServerTime(uid),
      };
    },

    async pushChanges({ changes }) {
      const writes: PendingWrite[] = [];
      const byTable = changes as Record<string, SyncTableChangeSet | undefined>;

      for (const table of SYNCED_TABLES) {
        const tableChanges = byTable[table];
        if (!tableChanges) continue;

        const mapper = MAPPERS[table];

        for (const raw of [...tableChanges.created, ...tableChanges.updated]) {
          writes.push({
            table,
            id: String(raw.id),
            data: { ...mapper.toCloud(raw), [DELETED]: false, [SYNCED_AT]: serverTimestamp() },
            merge: false,
          });
        }

        for (const id of tableChanges.deleted) {
          writes.push({
            table,
            id,
            // merge เพื่อคงข้อมูลเดิมไว้ดูย้อนหลังได้ใน Console แต่แอปมองว่าถูกลบแล้ว
            data: { [DELETED]: true, [SYNCED_AT]: serverTimestamp() },
            merge: true,
          });
        }
      }

      await commitWrites(uid, writes);
    },
  };
}

/**
 * ลบข้อมูลทั้งหมดของผู้ใช้บนคลาวด์แบบถาวร (ไม่เหลือหลุมศพ)
 * ใช้คู่กับปุ่ม "ลบข้อมูลทั้งหมด" ในหน้าตั้งค่าเท่านั้น — ถ้าลบแค่ในเครื่อง
 * การ sync รอบถัดไปจะดึงข้อมูลกลับมาใหม่หมด
 */
export async function wipeCloudData(uid: string): Promise<void> {
  for (const table of SYNCED_TABLES) {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION, uid, table));
    const ids = snapshot.docs.map((d) => d.id);

    for (let i = 0; i < ids.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      for (const id of ids.slice(i, i + BATCH_LIMIT)) {
        batch.delete(doc(db, USERS_COLLECTION, uid, table, id));
      }
      await batch.commit();
    }
  }
}

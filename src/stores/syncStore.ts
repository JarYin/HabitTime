/**
 * สถานะการซิงก์ข้อมูลกับ Firestore (Zustand) — ใช้โชว์สถานะในหน้าตั้งค่า
 */
import { create } from 'zustand';

export type SyncStatus = 'idle' | 'syncing' | 'error';

interface SyncState {
  status: SyncStatus;
  /** เวลาที่ซิงก์สำเร็จครั้งล่าสุด (epoch ms) — null คือยังไม่เคยสำเร็จ */
  lastSyncedAt: number | null;
  error: string | null;
  setSyncing: () => void;
  setSynced: (at: number) => void;
  setError: (message: string) => void;
  hydrate: (lastSyncedAt: number | null) => void;
  reset: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  lastSyncedAt: null,
  error: null,
  setSyncing: () => set({ status: 'syncing', error: null }),
  setSynced: (at) => set({ status: 'idle', lastSyncedAt: at, error: null }),
  setError: (message) => set({ status: 'error', error: message }),
  hydrate: (lastSyncedAt) => set({ lastSyncedAt }),
  reset: () => set({ status: 'idle', lastSyncedAt: null, error: null }),
}));

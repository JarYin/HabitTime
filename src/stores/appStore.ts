/**
 * สถานะระดับแอป (Zustand) — ผลการ init ในเครื่อง
 * ส่วนการเข้าถึงหน้าจอหลักคุมด้วย useAuthStore (ล็อกอินแล้วหรือยัง)
 */
import { create } from 'zustand';

interface AppState {
  /** โหลดกุญแจเข้ารหัส + seed + ตั้งค่าแจ้งเตือนเสร็จแล้ว */
  ready: boolean;
  setReady: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  ready: false,
  setReady: () => set({ ready: true }),
}));

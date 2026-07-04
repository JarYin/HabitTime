/**
 * สถานะระดับแอป (Zustand) — ผลการ init และธง onboarding
 * ใช้ขับ Stack.Protected ใน root layout
 */
import { create } from 'zustand';

interface AppState {
  /** โหลดกุญแจเข้ารหัส + seed + ตั้งค่าแจ้งเตือนเสร็จแล้ว */
  ready: boolean;
  onboarded: boolean;
  setReady: (onboarded: boolean) => void;
  setOnboarded: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  ready: false,
  onboarded: false,
  setReady: (onboarded) => set({ ready: true, onboarded }),
  setOnboarded: (v) => set({ onboarded: v }),
}));

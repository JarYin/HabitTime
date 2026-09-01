/**
 * สถานะระดับแอป (Zustand) — ผลการ init ในเครื่อง
 * ส่วนการเข้าถึงหน้าจอหลักคุมด้วย useAuthStore (ล็อกอินแล้วหรือยัง)
 */
import { create } from 'zustand';

interface AppState {
  /** โหลดกุญแจเข้ารหัส + seed + ตั้งค่าแจ้งเตือนเสร็จแล้ว */
  ready: boolean;
  setReady: () => void;

  /**
   * ข้อความความผิดพลาดตอน init (null = ปกติ)
   *
   * setReady() อยู่ใน finally จึงทำงานเสมอแม้ initEncryption() จะโยน แอปจึงเปิดใช้ได้
   * ทั้งที่ไม่มีกุญแจ ซึ่งเงียบเกินไป — ผู้ใช้จะเห็นชื่อกิจกรรมกลายเป็นค่าว่างโดยไม่รู้
   * สาเหตุ (การซิงก์ถูกกันไว้แล้วที่ runSync แต่ตัวแอปยังต้องบอกให้รู้)
   */
  initError: string | null;
  setInitError: (message: string) => void;

  /**
   * นับจำนวนครั้งที่ฐานข้อมูลถูกล้างทั้งก้อนด้วย unsafeResetDatabase()
   *
   * ที่ต้องมี: WatermelonDB ไม่ยิง change notification ตอน reset (มันแค่ล้าง cache)
   * observer ใน useQuery จึงไม่รู้ตัวและหน้าจอค้างแสดงข้อมูลชุดเก่าต่อไป
   * เคยทำให้ผู้ใช้คนใหม่เห็นและกดเข้าไปใช้ข้อมูลของคนก่อนหน้าได้หลังสลับบัญชี
   * hooks ที่ subscribe ข้อมูลใช้ค่านี้เป็น dependency เพื่อบังคับ resubscribe
   */
  dbGeneration: number;
  bumpDbGeneration: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  ready: false,
  setReady: () => set({ ready: true }),

  initError: null,
  setInitError: (message) => set({ initError: message }),

  dbGeneration: 0,
  bumpDbGeneration: () => set((s) => ({ dbGeneration: s.dbGeneration + 1 })),
}));

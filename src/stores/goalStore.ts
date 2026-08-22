/**
 * เป้าหมายเวลาต่อวัน — เก็บใน localStorage ซึ่ง observe ไม่ได้
 * จึงถือค่าไว้ใน store ตัวนี้เป็นแหล่งความจริงระหว่างที่แอปเปิดอยู่
 * (Dashboard, หน้าเป้าหมาย และรายการแจ้งเตือน อ่านจากที่เดียวกัน)
 */
import { create } from 'zustand';

import {
  clampGoalMinutes,
  DEFAULT_DAILY_GOAL_MINUTES,
  getDailyGoalMinutes,
  setDailyGoalMinutes,
} from '@/services/settingsService';

interface GoalState {
  minutes: number;
  /** โหลดค่าที่บันทึกไว้ (เรียกตอนเปิดแอป) */
  hydrate: () => Promise<void>;
  setMinutes: (minutes: number) => void;
}

export const useGoalStore = create<GoalState>((set) => ({
  minutes: DEFAULT_DAILY_GOAL_MINUTES,
  hydrate: async () => {
    const minutes = await getDailyGoalMinutes();
    set({ minutes });
  },
  setMinutes: (minutes) => {
    const clamped = clampGoalMinutes(minutes);
    set({ minutes: clamped }); // อัปเดตหน้าจอทันที
    void setDailyGoalMinutes(clamped); // แล้วค่อยเขียนลงเครื่องแบบไม่บล็อก
  },
}));

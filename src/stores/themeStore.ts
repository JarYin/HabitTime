/**
 * สถานะธีม (สว่าง/มืด/อัตโนมัติ) — เชื่อมกับ colorScheme ของ NativeWind
 * และบันทึกค่าลง localStorage เพื่อจำไว้ครั้งถัดไป
 */
import { colorScheme } from 'nativewind';
import { create } from 'zustand';

import { getThemeMode, setThemeMode, type ThemeMode } from '@/services/settingsService';

interface ThemeState {
  mode: ThemeMode;
  /** โหลดค่าที่บันทึกไว้แล้วนำไปใช้ (เรียกตอนเปิดแอป) */
  hydrate: () => Promise<void>;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  hydrate: async () => {
    const mode = await getThemeMode();
    colorScheme.set(mode);
    set({ mode });
  },
  setMode: (mode) => {
    colorScheme.set(mode); // สลับธีมทันที (NativeWind รีเรนเดอร์ dark: และ CSS vars ให้)
    set({ mode });
    void setThemeMode(mode);
  },
}));

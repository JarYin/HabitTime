/**
 * สถานะธีม (สว่าง/มืด/อัตโนมัติ) — เชื่อมกับ colorScheme ของ NativeWind
 * และบันทึกค่าลง localStorage เพื่อจำไว้ครั้งถัดไป
 */
import { colorScheme } from 'nativewind';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { getThemeMode, setThemeMode, type ThemeMode } from '@/services/settingsService';

interface ThemeState {
  mode: ThemeMode;
  /** โหลดค่าที่บันทึกไว้แล้วนำไปใช้ (เรียกตอนเปิดแอป) */
  hydrate: () => Promise<void>;
  setMode: (mode: ThemeMode) => void;
}

/**
 * บนเว็บ colorScheme.set() ของ NativeWind สลับได้แค่คลาส "dark" (ใส่/เอาออก)
 * ไม่เคยใส่คลาส "light" ให้เลย แม้เรียก set('light') ตรง ๆ — ทำให้ตอนเลือกธีม
 * "สว่าง" ขณะ OS เป็นมืด กฎ @media (prefers-color-scheme: dark) ใน global.css
 * ยังจับคู่ :root:not(.light):not(.dark) ได้อยู่ (เพราะไม่มีคลาส .light จริง ๆ)
 * เลยได้สีมืดทั้งที่เลือกสว่างไว้ ต้องจัดการคลาส .light เองตรงนี้แทน
 */
function syncWebLightClass(mode: ThemeMode) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  document.documentElement.classList.toggle('light', mode === 'light');
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  hydrate: async () => {
    const mode = await getThemeMode();
    colorScheme.set(mode);
    syncWebLightClass(mode);
    set({ mode });
  },
  setMode: (mode) => {
    colorScheme.set(mode); // สลับธีมทันที (NativeWind รีเรนเดอร์ dark: และ CSS vars ให้)
    syncWebLightClass(mode);
    set({ mode });
    void setThemeMode(mode);
  },
}));

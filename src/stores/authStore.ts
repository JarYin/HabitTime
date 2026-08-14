/**
 * สถานะการเข้าสู่ระบบ (Zustand) — ใช้ขับ Stack.Protected ใน root layout
 * ข้อมูลมาจาก observeAuth() ที่ subscribe ไว้ครั้งเดียวใน _layout
 */
import { create } from 'zustand';

import type { AuthUser } from '@/services/authService';

interface AuthState {
  /** Firebase อ่าน session ที่เก็บไว้เสร็จแล้ว (ก่อนหน้านี้ยังไม่รู้ว่าล็อกอินอยู่ไหม) */
  ready: boolean;
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  ready: false,
  user: null,
  setUser: (user) => set({ user, ready: true }),
}));

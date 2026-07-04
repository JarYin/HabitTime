/**
 * สถานะนาฬิกาจับเวลา (Zustand — lightweight ตามข้อกำหนดโปรเจกต์)
 * flow ตามเอกสาร SRS: เริ่มจับเวลา → พัก/จับต่อ → สิ้นสุดและบันทึกเวลา
 *
 * เก็บเฉพาะ timestamp กับเวลาสะสม แล้วคำนวณเวลาที่ผ่านไปจากเวลาจริง
 * เพื่อให้เที่ยงตรงแม้แอปถูกพับ/interval ถูกหน่วง
 */
import { create } from 'zustand';

export type TimerStatus = 'idle' | 'running' | 'paused';

interface TimerState {
  activityId: string | null;
  status: TimerStatus;
  /** epoch ms ตอนกดเริ่มครั้งแรกของเซสชันนี้ */
  sessionStartedAt: number | null;
  /** epoch ms ตอนเริ่มช่วง run ปัจจุบัน (null ถ้า pause อยู่) */
  runStartedAt: number | null;
  /** วินาทีสะสมจากช่วง run ก่อนหน้า (เพิ่มขึ้นตอนกดพัก) */
  accumulatedSec: number;

  start: (activityId: string) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  activityId: null,
  status: 'idle',
  sessionStartedAt: null,
  runStartedAt: null,
  accumulatedSec: 0,

  start: (activityId) =>
    set({
      activityId,
      status: 'running',
      sessionStartedAt: Date.now(),
      runStartedAt: Date.now(),
      accumulatedSec: 0,
    }),

  pause: () =>
    set((state) => {
      if (state.status !== 'running' || state.runStartedAt === null) return state;
      return {
        status: 'paused',
        runStartedAt: null,
        accumulatedSec: state.accumulatedSec + (Date.now() - state.runStartedAt) / 1000,
      };
    }),

  resume: () =>
    set((state) => {
      if (state.status !== 'paused') return state;
      return { status: 'running', runStartedAt: Date.now() };
    }),

  reset: () =>
    set({
      activityId: null,
      status: 'idle',
      sessionStartedAt: null,
      runStartedAt: null,
      accumulatedSec: 0,
    }),
}));

/** วินาทีที่จับได้จนถึงตอนนี้ (คำนวณสด — เรียกใน interval ของหน้าจอ) */
export function getElapsedSec(state: Pick<TimerState, 'accumulatedSec' | 'runStartedAt' | 'status'>): number {
  const running = state.status === 'running' && state.runStartedAt !== null
    ? (Date.now() - state.runStartedAt) / 1000
    : 0;
  return state.accumulatedSec + running;
}

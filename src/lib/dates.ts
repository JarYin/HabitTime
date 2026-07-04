/**
 * ยูทิลิตีเกี่ยวกับวันที่/เวลา — ใช้เวลาท้องถิ่นของเครื่องทั้งหมด
 * day key รูปแบบ 'YYYY-MM-DD' ใช้เป็นคอลัมน์ index สำหรับกรอง/จัดกลุ่มตามวัน
 */

export function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** วันจันทร์เป็นวันเริ่มสัปดาห์ (ตามความเข้าใจทั่วไปของผู้ใช้ไทย) */
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay(); // 0 = อาทิตย์
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

export function startOfMonth(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

/** รายชื่อ day key ตั้งแต่ from ถึง to (รวมทั้งสองฝั่ง) */
export function dayKeysBetween(from: Date, to: Date): string[] {
  const keys: string[] = [];
  let cur = startOfDay(from);
  const end = startOfDay(to);
  while (cur.getTime() <= end.getTime()) {
    keys.push(toDayKey(cur));
    cur = addDays(cur, 1);
  }
  return keys;
}

const thaiDateFmt = new Intl.DateTimeFormat('th-TH', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const thaiFullDateFmt = new Intl.DateTimeFormat('th-TH', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const thaiTimeFmt = new Intl.DateTimeFormat('th-TH', {
  hour: '2-digit',
  minute: '2-digit',
});

export function formatThaiDate(date: Date): string {
  return thaiDateFmt.format(date);
}

export function formatThaiFullDate(date: Date): string {
  return thaiFullDateFmt.format(date);
}

export function formatThaiTime(date: Date): string {
  return thaiTimeFmt.format(date);
}

/** แปลงวินาทีเป็นข้อความอ่านง่าย เช่น "1 ชม. 23 นาที", "45 นาที", "30 วิ" */
export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return m > 0 ? `${h} ชม. ${m} นาที` : `${h} ชม.`;
  if (m > 0) return `${m} นาที`;
  return `${s} วิ`;
}

/** รูปแบบนาฬิกาจับเวลา HH:MM:SS */
export function formatStopwatch(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

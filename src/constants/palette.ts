/**
 * สี ธีม อิโมจิ และหมวดหมู่เริ่มต้นของแอป
 * รองรับ 2 โหมด: สว่าง (ครีมอุ่น + น้ำเงิน) และ มืด — สลับได้ที่หน้าตั้งค่า
 * ค่าสีโหมดสว่างดึงตรงจาก Figma tokens
 *
 * การใช้งาน:
 *   - คลาส Tailwind (bg-surface, text-ink, ...) สลับอัตโนมัติผ่าน CSS variables
 *   - ค่าสีใน JS (สีไอคอน/เส้นขอบใน style) ให้ใช้ hook useColors() แทน THEME
 */

export interface ThemeColors {
  background: string;
  surface: string;
  surface2: string;
  stroke: string;
  navBorder: string;
  primary: string;
  primaryDeep: string;
  primarySoft: string;
  ink: string;
  muted: string;
  subtle: string;
  track: string;
  success: string;
  danger: string;
  warn: string;
}

export const LIGHT_COLORS: ThemeColors = {
  background: '#EDE4E4',
  surface: '#FFFFFF',
  surface2: '#F6F0F0',
  stroke: '#E3D9D9',
  navBorder: 'rgba(0,0,0,0.14)',
  primary: '#0F2EF5',
  primaryDeep: '#0021F5',
  primarySoft: '#C0BFE8',
  ink: '#111114',
  muted: '#716C7A',
  subtle: '#A6A2AC',
  track: '#B6B6B6',
  success: '#4E853F',
  danger: '#E5484D',
  warn: '#DEA020',
};

export const DARK_COLORS: ThemeColors = {
  background: '#121216',
  surface: '#1E1E24',
  surface2: '#2A2A31',
  stroke: '#333039',
  navBorder: 'rgba(255,255,255,0.12)',
  primary: '#4E63FF',
  primaryDeep: '#9AA6FF',
  primarySoft: '#2A2E5C',
  ink: '#F4F2F5',
  muted: '#A7A2AE',
  subtle: '#6E6A75',
  track: '#3A363F',
  success: '#6BCB77',
  danger: '#FF6B6B',
  warn: '#F2C14E',
};

/** ค่าเริ่มต้น (โหมดสว่าง) — คงไว้เพื่อความเข้ากันได้ ควรใช้ useColors() ในคอมโพเนนต์ */
export const THEME = LIGHT_COLORS;

/**
 * สีให้เลือกตอนสร้างกิจกรรม (use case "เลือกสี") — ตรงจาก Figma color picker
 * ใช้เหมือนกันทั้งสองโหมด (แสดงคู่กับอิโมจิ+ชื่อเสมอ)
 */
export const ACTIVITY_COLORS = [
  '#84E0EE', // ฟ้าน้ำทะเล
  '#95B8E0', // ฟ้าคราม
  '#5DEE7F', // เขียวมิ้นต์
  '#DEE97B', // เหลืองมะนาว
  '#E57D9C', // ชมพู
  '#397D84', // เขียวเทา
  '#DF6633', // ส้มอิฐ
  '#4E853F', // เขียวใบไม้
] as const;

/**
 * หมวดหมู่เริ่มต้น — seed ลงฐานข้อมูลตอนเปิดแอปครั้งแรก (สีตามดีไซน์ Figma)
 * ช่อง emoji เก็บ "ชื่อไอคอน lucide" (ดู @/constants/icons)
 *
 * ช่อง id ถูกกำหนดตายตัว (ไม่สุ่ม) เพราะทุกเครื่องจะ seed หมวดหมู่ชุดเดียวกันนี้
 * ตอนติดตั้งครั้งแรก ถ้าปล่อยให้สุ่ม id การซิงก์ข้ามเครื่องจะมองว่าเป็นคนละ
 * หมวดหมู่ แล้วได้ "เรียนรู้" ซ้ำสองอันบนคลาวด์
 */
export const DEFAULT_CATEGORIES = [
  { id: 'cat_learning', name: 'เรียนรู้', emoji: 'book-open', color: '#84E0EE' },
  { id: 'cat_health', name: 'สุขภาพ', emoji: 'dumbbell', color: '#5DEE7F' },
  { id: 'cat_mind', name: 'จิตใจ', emoji: 'brain', color: '#95B8E0' },
  { id: 'cat_work', name: 'ทำงาน', emoji: 'laptop', color: '#E57D9C' },
  { id: 'cat_hobby', name: 'งานอดิเรก', emoji: 'palette', color: '#DEE97B' },
  { id: 'cat_practice', name: 'ฝึกฝน', emoji: 'guitar', color: '#DF6633' },
  { id: 'cat_other', name: 'อื่น ๆ', emoji: 'ellipsis', color: '#397D84' },
] as const;

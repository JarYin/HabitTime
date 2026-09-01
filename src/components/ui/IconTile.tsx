import { View } from 'react-native';

import { resolveActivityIcon } from '@/constants/icons';

interface IconTileProps {
  /** ชื่อไอคอน lucide ที่เก็บในฐานข้อมูล (รองรับค่า emoji เก่า — ถูก map ให้อัตโนมัติ) */
  icon?: string | null;
  color: string;
  /** ขนาดกล่อง (px) */
  size?: number;
  className?: string;
}

/** สีเส้นไอคอนบนพื้นพาสเทล — เข้มคงที่ทั้งสองธีมเพราะพื้นกล่องเป็นสีกิจกรรมเสมอ */
export const GLYPH_COLOR = '#1F2024';

/** กล่องสี่เหลี่ยมมุมมนสีตามกิจกรรม พร้อมไอคอน lucide ตรงกลาง (ใช้ทั่วทั้งแอป) */
export default function IconTile({ icon, color, size = 40, className }: IconTileProps) {
  /* eslint-disable react-hooks/static-components --
     false positive: resolveActivityIcon เป็นการ lookup จาก ICON_MAP ระดับโมดูลล้วน ๆ
     คืน reference เดิมเสมอสำหรับชื่อไอคอนเดียวกัน ไม่ได้สร้างคอมโพเนนต์ใหม่ตอน render
     จึงไม่มีปัญหาเรื่อง state ถูกรีเซ็ตตามที่ rule เตือน */
  const Icon = resolveActivityIcon(icon);
  return (
    <View
      className={`items-center justify-center rounded-xl ${className ?? ''}`}
      style={{ width: size, height: size, backgroundColor: color }}
    >
      <Icon size={size * 0.55} color={GLYPH_COLOR} strokeWidth={2} />
    </View>
  );
  /* eslint-enable react-hooks/static-components */
}

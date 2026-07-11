/**
 * คืนชุดสีของธีมปัจจุบัน (สว่าง/มืด) ตาม colorScheme ของ NativeWind
 * ใช้แทนการ import THEME ตรง ๆ เมื่อกำหนดสีใน JS (สีไอคอน, เส้นขอบใน style)
 * คอมโพเนนต์จะรีเรนเดอร์เองเมื่อสลับธีม
 */
import { useColorScheme } from 'nativewind';

import { DARK_COLORS, LIGHT_COLORS, type ThemeColors } from '@/constants/palette';

export function useColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
}

/**
 * เงาที่ปรับตามธีม
 *
 * ที่ต้องมี: ทุกหน้าเคยประกาศ `const cardShadow = { shadowColor: '#000', ... }` ไว้เอง
 * ระดับโมดูล เงาสีดำบนพื้นมืด (#121216) มองไม่เห็นเลย การ์ดจึงเสียมิติทั้งแอป
 * เหลือให้แยกด้วยส่วนต่างระหว่าง surface กับ background เท่านั้น
 *
 * โหมดมืดจึงต้องเพิ่มความทึบและรัศมีขึ้นมาก เงาถึงจะ "อ่านออก" เท่ากับโหมดสว่าง
 * (บนพื้นสว่าง เงาดำจาง ๆ 5% ก็พอ แต่บนพื้นมืดต้องราว 45% ถึงจะเห็นขอบ)
 */
import { useColorScheme } from 'nativewind';

export interface Shadows {
  /** เงาการ์ดทั่วไป — การ์ดสถิติ, แถวประวัติ, กล่องยืนยัน */
  card: {
    shadowColor: string;
    shadowOpacity: number;
    shadowRadius: number;
    shadowOffset: { width: number; height: number };
    elevation: number;
  };
  /** เงาเรืองสีหลัก — ต้องส่งสี primary ของธีมปัจจุบันเข้ามา */
  primary: (color: string) => Shadows['card'];
}

export function useShadows(): Shadows {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    card: {
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.45 : 0.05,
      shadowRadius: isDark ? 12 : 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: isDark ? 3 : 1,
    },
    primary: (color: string) => ({
      shadowColor: color,
      shadowOpacity: isDark ? 0.45 : 0.3,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    }),
  };
}

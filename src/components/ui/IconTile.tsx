import { Text, View } from 'react-native';

interface IconTileProps {
  emoji: string;
  color: string;
  /** ขนาดกล่อง (px) */
  size?: number;
  className?: string;
}

/** กล่องสี่เหลี่ยมมุมมนสีตามกิจกรรม พร้อมอิโมจิตรงกลาง (ใช้ทั่วทั้งแอป) */
export default function IconTile({ emoji, color, size = 40, className }: IconTileProps) {
  return (
    <View
      className={`items-center justify-center rounded-xl ${className ?? ''}`}
      style={{ width: size, height: size, backgroundColor: color }}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

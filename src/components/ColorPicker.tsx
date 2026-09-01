import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { ACTIVITY_COLORS } from '@/constants/palette';
import { GLYPH_COLOR } from '@/components/ui/IconTile';
import { useColors } from '@/hooks/useColors';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

/** แถวเลือกสีของกิจกรรม (use case "เลือกสี") — วงกลมสี มีเช็คเมื่อเลือก */
export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  const c = useColors();
  return (
    <View className="flex-row flex-wrap gap-3">
      {ACTIVITY_COLORS.map((color) => {
        const selected = value === color;
        return (
          <Pressable
            key={color}
            onPress={() => onChange(color)}
            accessibilityRole="radio"
            accessibilityLabel={color}
            accessibilityState={{ selected, checked: selected }}
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{
              backgroundColor: color,
              borderWidth: selected ? 3 : 0,
              borderColor: c.primaryDeep,
            }}
          >
            {/* ใช้ glyph สีเข้มชุดเดียวกับ IconTile — เครื่องหมายถูกสีขาวมองแทบไม่เห็น
                บนสวอตช์ไลม์/มิ้นต์/ฟ้าอ่อนที่อยู่ใน ACTIVITY_COLORS */}
            {selected && <Check size={20} color={GLYPH_COLOR} strokeWidth={3} />}
          </Pressable>
        );
      })}
    </View>
  );
}

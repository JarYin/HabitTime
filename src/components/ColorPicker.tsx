import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { ACTIVITY_COLORS, THEME } from '@/constants/palette';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

/** แถวเลือกสีของกิจกรรม (use case "เลือกสี") */
export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {ACTIVITY_COLORS.map((color) => (
        <Pressable
          key={color}
          onPress={() => onChange(color)}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: color }}
        >
          {value === color && <Ionicons name="checkmark" size={20} color={THEME.background} />}
        </Pressable>
      ))}
    </View>
  );
}

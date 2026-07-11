import { Pressable, View } from 'react-native';

import { ACTIVITY_ICONS, ICON_MAP } from '@/constants/icons';
import { useColors } from '@/hooks/useColors';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

/** ตารางเลือกสัญลักษณ์ของกิจกรรม — ไอคอน lucide ทั้งหมด (use case "เลือกสัญลักษณ์") */
export default function IconPicker({ value, onChange }: IconPickerProps) {
  const c = useColors();
  return (
    <View className="flex-row flex-wrap gap-2.5">
      {ACTIVITY_ICONS.map((name) => {
        const Icon = ICON_MAP[name];
        const selected = value === name;
        return (
          <Pressable
            key={name}
            onPress={() => onChange(name)}
            className="h-11 w-11 items-center justify-center rounded-xl"
            style={{
              backgroundColor: selected ? c.primarySoft : c.surface,
              borderWidth: selected ? 2 : 0,
              borderColor: c.primaryDeep,
            }}
          >
            <Icon size={20} color={selected ? c.primaryDeep : c.muted} strokeWidth={2} />
          </Pressable>
        );
      })}
    </View>
  );
}

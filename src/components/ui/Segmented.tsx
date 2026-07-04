import { Pressable, Text, View } from 'react-native';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** ตัวเลือกช่วงเวลาแบบ segmented (ใช้ในหน้าประวัติ/สถิติ) */
export default function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <View className="flex-row rounded-xl border border-stroke bg-surface p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`flex-1 items-center rounded-lg py-2 ${active ? 'bg-primarySoft' : ''}`}
          >
            <Text className={`text-sm ${active ? 'font-semibold text-primary' : 'text-muted'}`}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

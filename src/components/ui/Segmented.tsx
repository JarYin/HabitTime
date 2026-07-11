import { Pressable, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** ตัวเลือกช่วงเวลาแบบ segmented (วัน/สัปดาห์/เดือน) — สไตล์ Figma */
export default function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const c = useColors();
  return (
    <View
      className="flex-row rounded-2xl bg-surface p-1"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 1,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className="flex-1 items-center rounded-xl py-2.5"
            style={{ backgroundColor: active ? c.primarySoft : 'transparent' }}
          >
            <Text
              className="text-sm"
              style={{
                color: active ? c.primaryDeep : c.muted,
                fontWeight: active ? '700' : '500',
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

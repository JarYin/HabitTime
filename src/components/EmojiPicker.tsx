import { Pressable, Text, View } from 'react-native';

import { ACTIVITY_EMOJIS } from '@/constants/palette';
import { useColors } from '@/hooks/useColors';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

/** ตารางเลือกสัญลักษณ์ของกิจกรรม (use case "เลือกอิโมจิ") */
export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const c = useColors();
  return (
    <View className="flex-row flex-wrap gap-2.5">
      {ACTIVITY_EMOJIS.map((emoji, i) => {
        const selected = value === emoji;
        return (
          <Pressable
            key={`${emoji}-${i}`}
            onPress={() => onChange(emoji)}
            className="h-11 w-11 items-center justify-center rounded-xl"
            style={{
              backgroundColor: selected ? c.primarySoft : c.surface,
              borderWidth: selected ? 2 : 0,
              borderColor: c.primaryDeep,
            }}
          >
            <Text className="text-xl">{emoji}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

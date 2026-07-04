import { Pressable, Text, View } from 'react-native';

import { ACTIVITY_EMOJIS } from '@/constants/palette';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

/** ตารางเลือกอิโมจิของกิจกรรม (use case "เลือกอิโมจิ") */
export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {ACTIVITY_EMOJIS.map((emoji) => (
        <Pressable
          key={emoji}
          onPress={() => onChange(emoji)}
          className={`h-11 w-11 items-center justify-center rounded-xl border ${
            value === emoji ? 'border-primary bg-primarySoft' : 'border-stroke bg-surface'
          }`}
        >
          <Text className="text-xl">{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}

import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import CategoryPills from '@/components/CategoryPills';
import ColorPicker from '@/components/ColorPicker';
import EmojiPicker from '@/components/EmojiPicker';
import { ACTIVITY_COLORS, ACTIVITY_EMOJIS, THEME } from '@/constants/palette';
import { STR } from '@/constants/strings';
import type { Category } from '@/database/models';
import type { ActivityInput } from '@/services/activityService';

interface ActivityFormProps {
  categories: Category[];
  initial?: Partial<ActivityInput>;
  submitLabel: string;
  onSubmit: (input: ActivityInput) => void;
}

/**
 * ฟอร์มเพิ่ม/แก้ไขกิจกรรม — field ตาม use case ในเอกสาร SRS:
 * ใส่ชื่อกิจกรรม → เลือกหมวดหมู่ → เลือกอิโมจิ → เลือกสี → บันทึกกิจกรรม
 */
export default function ActivityForm({ categories, initial, submitLabel, onSubmit }: ActivityFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? ACTIVITY_EMOJIS[0]);
  const [color, setColor] = useState(initial?.color ?? ACTIVITY_COLORS[0]);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError(STR.form.nameRequired);
      return;
    }
    onSubmit({ name, categoryId, emoji, color });
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="pb-10">
      <View className="px-5">
        <Text className="mb-2 mt-4 text-sm font-medium text-muted">{STR.form.name}</Text>
        <TextInput
          value={name}
          onChangeText={(v) => {
            setName(v);
            if (error) setError('');
          }}
          placeholder={STR.form.namePlaceholder}
          placeholderTextColor={THEME.muted}
          className="rounded-xl border border-stroke bg-surface px-4 py-3 text-base text-ink"
          maxLength={60}
        />
        {!!error && <Text className="mt-2 text-sm text-danger">{error}</Text>}

        <Text className="mb-2 mt-6 text-sm font-medium text-muted">{STR.form.category}</Text>
      </View>

      {/* ฟอร์มเลือกหมวดหมู่ ใช้ pills เดียวกับหน้ากรอง แต่ไม่มีตัวเลือก "ทั้งหมด" */}
      <View className="-mx-0">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-5">
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setCategoryId(cat.id)}
              className={`rounded-full border px-4 py-2 ${
                categoryId === cat.id ? 'border-primary bg-primarySoft' : 'border-stroke bg-surface'
              }`}
            >
              <Text
                className={`text-sm ${categoryId === cat.id ? 'font-semibold text-primary' : 'text-muted'}`}
              >
                {cat.emoji} {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View className="px-5">
        <Text className="mb-2 mt-6 text-sm font-medium text-muted">{STR.form.emoji}</Text>
        <EmojiPicker value={emoji} onChange={setEmoji} />

        <Text className="mb-2 mt-6 text-sm font-medium text-muted">{STR.form.color}</Text>
        <ColorPicker value={color} onChange={setColor} />

        <Pressable
          onPress={handleSubmit}
          className="mt-8 items-center rounded-2xl bg-primary py-4 active:opacity-80"
        >
          <Text className="text-base font-bold text-background">{submitLabel}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

import { Check, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import ColorPicker from '@/components/ColorPicker';
import IconPicker from '@/components/IconPicker';
import IconTile from '@/components/ui/IconTile';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { ACTIVITY_ICONS } from '@/constants/icons';
import { ACTIVITY_COLORS } from '@/constants/palette';
import { useColors } from '@/hooks/useColors';
import { STR } from '@/constants/strings';
import type { Category } from '@/database/models';
import type { ActivityInput } from '@/services/activityService';

interface ActivityFormProps {
  categories: Category[];
  initial?: Partial<ActivityInput>;
  submitLabel: string;
  onSubmit: (input: ActivityInput) => void;
  /** ปุ่มยกเลิก (หน้าแก้ไข) — ถ้ามีจะแสดงคู่กับปุ่มบันทึก */
  onCancel?: () => void;
}

/**
 * ฟอร์มเพิ่ม/แก้ไขกิจกรรม (ดีไซน์ตาม Figma "add/edit activity")
 * พรีวิวไอคอน → ชื่อ → หมวดหมู่ → สี → สัญลักษณ์ → บันทึก
 */
export default function ActivityForm({
  categories,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: ActivityFormProps) {
  const c = useColors();
  const [name, setName] = useState(initial?.name ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '');
  const [emoji, setEmoji] = useState<string>(initial?.emoji ?? ACTIVITY_ICONS[0]);
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
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-5 pb-10"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* พรีวิวไอคอน */}
      <View className="mt-1 items-center">
        <IconTile icon={emoji} color={color} size={64} className="rounded-2xl" />
      </View>

      {/* ชื่อกิจกรรม */}
      <Text className="mb-2 mt-6 text-sm font-semibold text-muted">{STR.form.name}</Text>
      <TextInput
        value={name}
        onChangeText={(v) => {
          setName(v);
          if (error) setError('');
        }}
        placeholder={STR.form.namePlaceholder}
        placeholderTextColor={c.subtle}
        className="rounded-2xl bg-surface px-4 py-3.5 text-base text-ink"
        maxLength={60}
      />
      {!!error && <Text className="mt-2 text-sm text-danger">{error}</Text>}

      {/* หมวดหมู่ */}
      <Text className="mb-2 mt-6 text-sm font-semibold text-muted">{STR.form.category}</Text>
      <View className="flex-row flex-wrap gap-2">
        {categories.map((cat) => {
          const active = categoryId === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => setCategoryId(cat.id)}
              className="rounded-full px-4 py-2"
              style={{
                backgroundColor: active ? c.primarySoft : c.surface,
                borderWidth: 1,
                borderColor: active ? c.primaryDeep : 'transparent',
              }}
            >
              <Text
                className="text-sm"
                style={{
                  color: active ? c.primaryDeep : c.muted,
                  fontWeight: active ? '700' : '500',
                }}
              >
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* สี */}
      <Text className="mb-3 mt-6 text-sm font-semibold text-muted">{STR.form.color}</Text>
      <ColorPicker value={color} onChange={setColor} />

      {/* สัญลักษณ์ */}
      <Text className="mb-3 mt-6 text-sm font-semibold text-muted">{STR.form.emoji}</Text>
      <IconPicker value={emoji} onChange={setEmoji} />

      {/* ปุ่ม */}
      {onCancel ? (
        <View className="mt-8 flex-row gap-3">
          <PrimaryButton
            label={STR.detail.cancel}
            onPress={onCancel}
            variant="danger"
            icon={X}
            className="flex-1"
          />
          <PrimaryButton
            label={STR.form.saveEdit}
            onPress={handleSubmit}
            icon={Check}
            className="flex-1"
          />
        </View>
      ) : (
        <PrimaryButton
          label={submitLabel}
          onPress={handleSubmit}
          icon={Check}
          className="mt-8"
        />
      )}
    </ScrollView>
  );
}

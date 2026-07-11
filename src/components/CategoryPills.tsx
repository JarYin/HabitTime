import { Pressable, ScrollView, Text } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { STR } from '@/constants/strings';
import type { Category } from '@/database/models';

interface CategoryPillsProps {
  categories: Category[];
  /** null = ทั้งหมด */
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/** แถบตัวกรองหมวดหมู่แนวนอน (use case "กรองตามหมวดหมู่") — สไตล์ Figma */
export default function CategoryPills({ categories, selectedId, onSelect }: CategoryPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-5"
      className="grow-0"
    >
      <Pill
        label={STR.activities.allCategories}
        active={selectedId === null}
        onPress={() => onSelect(null)}
      />
      {categories.map((cat) => (
        <Pill
          key={cat.id}
          label={cat.name}
          active={selectedId === cat.id}
          onPress={() => onSelect(cat.id)}
        />
      ))}
    </ScrollView>
  );
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full px-4 py-2"
      style={{
        backgroundColor: active ? c.primarySoft : c.surface,
        borderWidth: 1,
        borderColor: active ? c.primaryDeep : 'transparent',
        shadowColor: '#000',
        shadowOpacity: active ? 0 : 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: active ? 0 : 1,
      }}
    >
      <Text
        className="text-sm"
        style={{
          color: active ? c.primaryDeep : c.muted,
          fontWeight: active ? '700' : '500',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

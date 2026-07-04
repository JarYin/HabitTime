import { Pressable, ScrollView, Text } from 'react-native';

import { STR } from '@/constants/strings';
import type { Category } from '@/database/models';

interface CategoryPillsProps {
  categories: Category[];
  /** null = ทั้งหมด */
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/** แถบตัวกรองหมวดหมู่แนวนอน (use case "กรองตามหมวดหมู่") */
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
          label={`${cat.emoji} ${cat.name}`}
          active={selectedId === cat.id}
          onPress={() => onSelect(cat.id)}
        />
      ))}
    </ScrollView>
  );
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-4 py-2 ${
        active ? 'border-primary bg-primarySoft' : 'border-stroke bg-surface'
      }`}
    >
      <Text className={`text-sm ${active ? 'font-semibold text-primary' : 'text-muted'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

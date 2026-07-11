import { router } from 'expo-router';
import { ChevronLeft, Plus, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';

import ActivityCard from '@/components/ActivityCard';
import CategoryPills from '@/components/CategoryPills';
import EmptyState from '@/components/EmptyState';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Screen from '@/components/ui/Screen';
import { useColors } from '@/hooks/useColors';
import { STR } from '@/constants/strings';
import { useQueryList } from '@/hooks/useQuery';
import { activeActivitiesQuery, filterActivitiesByName } from '@/services/activityService';
import { categoriesQuery } from '@/services/categoryService';
import { historyQuery } from '@/services/sessionService';
import { totalsByActivity } from '@/services/statsService';

/** หน้าจัดการกิจกรรมทั้งหมด — เข้าจาก "ดูทั้งหมด" บนหน้าแรก */
export default function ActivitiesScreen() {
  const c = useColors();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const activities = useQueryList(() => activeActivitiesQuery(), []);
  const categories = useQueryList(() => categoriesQuery(), []);
  const allSessions = useQueryList(() => historyQuery(), []);

  const totalByActivity = useMemo(() => totalsByActivity(allSessions), [allSessions]);
  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const visible = useMemo(() => {
    const byCategory = categoryId
      ? activities.filter((a) => a.categoryId === categoryId)
      : activities;
    return filterActivitiesByName(byCategory, search);
  }, [activities, categoryId, search]);

  return (
    <Screen>
      <View className="flex-row items-center px-2 pt-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-surface2"
        >
          <ChevronLeft size={24} color={c.ink} />
        </Pressable>
        <ScreenHeader title={STR.activities.title} className="flex-1 px-1" />
      </View>

      <View className="mt-4 flex-row items-center rounded-2xl bg-surface mx-5 px-3" style={cardShadow}>
        <Search size={18} color={c.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={STR.activities.searchPlaceholder}
          placeholderTextColor={c.subtle}
          className="ml-2 flex-1 py-2.5 text-base text-ink"
        />
      </View>

      <View className="mt-4">
        <CategoryPills categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(a) => a.id}
        contentContainerClassName="px-5 pb-28 pt-3"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon={Search} message={STR.activities.empty} />}
        renderItem={({ item }) => (
          <ActivityCard
            activity={item}
            categoryLabel={categoryNameById.get(item.categoryId)}
            totalSec={totalByActivity.get(item.id) ?? 0}
            onPress={() => router.push(`/activity/${item.id}`)}
            onStartTimer={() => router.push(`/timer/${item.id}`)}
          />
        )}
      />

      <Pressable
        onPress={() => router.push('/activity/new')}
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-85"
        style={primaryShadow}
      >
        <Plus size={30} color="#FFFFFF" />
      </Pressable>
    </Screen>
  );
}

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 1,
} as const;

const primaryShadow = {
  shadowColor: '#0F2EF5',
  shadowOpacity: 0.3,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: 6,
} as const;

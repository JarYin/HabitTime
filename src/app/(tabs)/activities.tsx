import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';

import ActivityCard from '@/components/ActivityCard';
import CategoryPills from '@/components/CategoryPills';
import EmptyState from '@/components/EmptyState';
import Screen from '@/components/ui/Screen';
import { THEME } from '@/constants/palette';
import { STR } from '@/constants/strings';
import { useQueryList } from '@/hooks/useQuery';
import { activeActivitiesQuery, filterActivitiesByName } from '@/services/activityService';
import { categoriesQuery } from '@/services/categoryService';
import { historyQuery } from '@/services/sessionService';
import { totalsByActivity } from '@/services/statsService';

/**
 * หน้าจัดการกิจกรรม — ตามเอกสาร SRS 2.1.2(2):
 * ดูกิจกรรมทั้งหมด + เวลาสะสม, ค้นหา, กรองตามหมวดหมู่, เพิ่ม/เริ่มจับเวลา
 */
export default function ActivitiesScreen() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const activities = useQueryList(() => activeActivitiesQuery(), []);
  const categories = useQueryList(() => categoriesQuery(), []);
  // ดึงทุกเซสชันเพื่อรวม "เวลาสะสม" ต่อกิจกรรม (ข้อมูลผู้ใช้เดียว ปริมาณหลักพันแถว)
  const allSessions = useQueryList(() => historyQuery(), []);

  const totalByActivity = useMemo(() => totalsByActivity(allSessions), [allSessions]);
  const categoryLabelById = useMemo(
    () => new Map(categories.map((c) => [c.id, `${c.emoji} ${c.name}`])),
    [categories],
  );

  const visible = useMemo(() => {
    const byCategory = categoryId
      ? activities.filter((a) => a.categoryId === categoryId)
      : activities;
    return filterActivitiesByName(byCategory, search);
  }, [activities, categoryId, search]);

  return (
    <Screen noBottomInset>
      <View className="px-5 pt-4">
        <Text className="text-xl font-bold text-ink">{STR.activities.title}</Text>

        {/* ค้นหากิจกรรม (ในหน่วยความจำ เพราะชื่อถูกเข้ารหัสใน DB) */}
        <View className="mt-3 flex-row items-center rounded-xl border border-stroke bg-surface px-3">
          <Ionicons name="search" size={18} color={THEME.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={STR.activities.searchPlaceholder}
            placeholderTextColor={THEME.muted}
            className="ml-2 flex-1 py-3 text-base text-ink"
          />
        </View>
      </View>

      <View className="mt-3">
        <CategoryPills categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(a) => a.id}
        contentContainerClassName="px-5 pb-28 pt-3"
        ListEmptyComponent={<EmptyState emoji="🔎" message={STR.activities.empty} />}
        renderItem={({ item }) => (
          <ActivityCard
            activity={item}
            categoryLabel={categoryLabelById.get(item.categoryId)}
            totalSec={totalByActivity.get(item.id) ?? 0}
            totalLabel={STR.activities.totalTime}
            onPress={() => router.push(`/activity/${item.id}`)}
            onStartTimer={() => router.push(`/timer/${item.id}`)}
          />
        )}
      />

      <Pressable
        onPress={() => router.push('/activity/new')}
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:opacity-80"
      >
        <Ionicons name="add" size={30} color={THEME.background} />
      </Pressable>
    </Screen>
  );
}

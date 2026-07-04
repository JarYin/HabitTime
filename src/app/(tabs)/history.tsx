import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { SectionList, Text, TextInput, View } from 'react-native';

import CategoryPills from '@/components/CategoryPills';
import EmptyState from '@/components/EmptyState';
import SessionRow from '@/components/SessionRow';
import Segmented from '@/components/ui/Segmented';
import Screen from '@/components/ui/Screen';
import { THEME } from '@/constants/palette';
import { STR } from '@/constants/strings';
import { useQueryList } from '@/hooks/useQuery';
import {
  addDays,
  formatDuration,
  formatThaiFullDate,
  toDayKey,
} from '@/lib/dates';
import { activeActivitiesQuery } from '@/services/activityService';
import { categoriesQuery } from '@/services/categoryService';
import { historyQuery } from '@/services/sessionService';
import type { TimeSession } from '@/database/models';

type RangeKey = 'week' | 'month' | 'all';

const RANGE_OPTIONS = [
  { value: 'week' as const, label: STR.history.ranges.week },
  { value: 'month' as const, label: STR.history.ranges.month },
  { value: 'all' as const, label: STR.history.ranges.all },
];

function rangeFromDayKey(range: RangeKey): string | null {
  if (range === 'all') return null;
  const days = range === 'week' ? 7 : 30;
  return toDayKey(addDays(new Date(), -(days - 1)));
}

/**
 * หน้าประวัติ — ตามเอกสาร SRS 2.1.2(3):
 * แสดงประวัติทั้งหมด, ค้นหา, กรองตามหมวดหมู่, กรองช่วงวันที่,
 * แสดงเวลาสะสมและวันที่ทำกิจกรรมของแต่ละรายการ
 */
export default function HistoryScreen() {
  const [range, setRange] = useState<RangeKey>('week');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fromDayKey = rangeFromDayKey(range);
  const sessions = useQueryList(
    () => historyQuery({ fromDayKey, categoryId }),
    [fromDayKey, categoryId],
  );
  const activities = useQueryList(() => activeActivitiesQuery(), []);
  const categories = useQueryList(() => categoriesQuery(), []);

  const activityById = useMemo(() => new Map(activities.map((a) => [a.id, a])), [activities]);

  // ค้นหาจากชื่อกิจกรรม (ถอดรหัสแล้ว) ในหน่วยความจำ
  const visibleSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => activityById.get(s.activityId)?.name.toLowerCase().includes(q));
  }, [sessions, search, activityById]);

  // จัดกลุ่มตามวัน (sessions เรียงใหม่→เก่าอยู่แล้ว)
  const sections = useMemo(() => {
    const byDay = new Map<string, TimeSession[]>();
    for (const s of visibleSessions) {
      const list = byDay.get(s.dayKey) ?? [];
      list.push(s);
      byDay.set(s.dayKey, list);
    }
    const todayKey = toDayKey(new Date());
    const yesterdayKey = toDayKey(addDays(new Date(), -1));
    return [...byDay.entries()].map(([dayKey, list]) => ({
      title:
        dayKey === todayKey
          ? STR.common.today
          : dayKey === yesterdayKey
            ? STR.common.yesterday
            : formatThaiFullDate(list[0].endedAt),
      totalSec: list.reduce((sum, s) => sum + s.durationSec, 0),
      data: list,
    }));
  }, [visibleSessions]);

  return (
    <Screen noBottomInset>
      <View className="px-5 pt-4">
        <Text className="text-xl font-bold text-ink">{STR.history.title}</Text>

        <View className="mt-3">
          <Segmented options={RANGE_OPTIONS} value={range} onChange={setRange} />
        </View>

        <View className="mt-3 flex-row items-center rounded-xl border border-stroke bg-surface px-3">
          <Ionicons name="search" size={18} color={THEME.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={STR.history.searchPlaceholder}
            placeholderTextColor={THEME.muted}
            className="ml-2 flex-1 py-3 text-base text-ink"
          />
        </View>
      </View>

      <View className="mt-3">
        <CategoryPills categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(s) => s.id}
        contentContainerClassName="px-5 pb-10 pt-3"
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={<EmptyState emoji="🗓️" message={STR.history.empty} />}
        renderSectionHeader={({ section }) => (
          <View className="mb-2 mt-4 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-ink">{section.title}</Text>
            <Text className="text-xs text-muted">{formatDuration(section.totalSec)}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <SessionRow session={item} activity={activityById.get(item.activityId)} />
        )}
      />
    </Screen>
  );
}

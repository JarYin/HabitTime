import { Calendar, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, SectionList, Text, TextInput, View } from 'react-native';

import CategoryPills from '@/components/CategoryPills';
import EmptyState from '@/components/EmptyState';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Screen from '@/components/ui/Screen';
import SessionRow from '@/components/SessionRow';
import { useColors } from '@/hooks/useColors';
import { useShadows } from '@/hooks/useShadows';
import { STR } from '@/constants/strings';
import { useQueryList } from '@/hooks/useQuery';
import { useToday } from '@/hooks/useToday';
import { addDays, formatDuration, formatThaiDate, toDayKey } from '@/lib/dates';
import { activeActivitiesQuery } from '@/services/activityService';
import { categoriesQuery } from '@/services/categoryService';
import { historyQuery } from '@/services/sessionService';
import type { TimeSession } from '@/database/models';

/**
 * หน้าประวัติ (ดีไซน์ Figma "history page") — ประวัติทั้งหมดจัดกลุ่มตามวัน,
 * ค้นหาจากชื่อกิจกรรม, กรองตามหมวดหมู่
 */
export default function HistoryScreen() {
  const c = useColors();
  const shadows = useShadows();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const now = useToday();

  const sessions = useQueryList(() => historyQuery({ categoryId }), [categoryId]);
  const activities = useQueryList(() => activeActivitiesQuery(), []);
  const categories = useQueryList(() => categoriesQuery(), []);

  const activityById = useMemo(() => new Map(activities.map((a) => [a.id, a])), [activities]);
  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const visibleSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => activityById.get(s.activityId)?.name.toLowerCase().includes(q));
  }, [sessions, search, activityById]);

  const sections = useMemo(() => {
    const byDay = new Map<string, TimeSession[]>();
    for (const s of visibleSessions) {
      const list = byDay.get(s.dayKey) ?? [];
      list.push(s);
      byDay.set(s.dayKey, list);
    }
    const todayKey = toDayKey(now);
    const yesterdayKey = toDayKey(addDays(now, -1));
    return [...byDay.entries()].map(([dayKey, list]) => {
      const prefix =
        dayKey === todayKey
          ? STR.common.today
          : dayKey === yesterdayKey
            ? STR.common.yesterday
            : '';
      return {
        title: `${prefix ? `${prefix} ` : ''}${formatThaiDate(list[0].endedAt)}`,
        totalSec: list.reduce((sum, s) => sum + s.durationSec, 0),
        data: list,
      };
    });
  }, [visibleSessions, now]);

  return (
    <Screen noBottomInset>
      <ScreenHeader
        title={STR.tabs.history}
        className="pt-3"
        right={
          <Pressable
            onPress={() => setSearchOpen((v) => !v)}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-80"
            style={shadows.card}
          >
            <Search size={18} color={c.ink} />
          </Pressable>
        }
      />

      {searchOpen && (
        <View className="mx-5 mt-3 flex-row items-center rounded-2xl bg-surface px-3" style={shadows.card}>
          <Search size={18} color={c.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={STR.history.searchPlaceholder}
            placeholderTextColor={c.subtle}
            autoFocus
            className="ml-2 flex-1 py-2.5 text-base text-ink"
          />
        </View>
      )}

      <View className="mt-4">
        <CategoryPills categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(s) => s.id}
        // ต้องเป็น style ไม่ใช่ contentContainerClassName — react-native-css-interop
        // ลงทะเบียนแค่ ScrollView/FlatList/VirtualizedList/KeyboardAvoidingView
        // ไม่มี SectionList คลาส Tailwind ตรงนี้จึงถูกละเลยเงียบ ๆ แถวชิดขอบจอ
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 }}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon={Calendar} message={STR.history.empty} />}
        renderSectionHeader={({ section }) => (
          <View className="mb-2 mt-4 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-ink">{section.title}</Text>
            <Text className="text-xs font-medium text-muted">{formatDuration(section.totalSec)}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const activity = activityById.get(item.activityId);
          return (
            <SessionRow
              session={item}
              activity={activity}
              subtitle={activity ? categoryNameById.get(activity.categoryId) : undefined}
            />
          );
        }}
      />
    </Screen>
  );
}


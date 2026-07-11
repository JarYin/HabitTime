import { Tabs } from 'expo-router';
import { ChartColumn, Circle, History, House, User, type LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { STR } from '@/constants/strings';

/**
 * แถบแท็บล่างแบบกำหนดเอง — 4 แท็บตามดีไซน์ Figma:
 * หน้าแรก / ประวัติ / สถิติ / โปรไฟล์
 * แท็บที่เลือกจะมี pill สีน้ำเงินอ่อนใต้ไอคอน + ไอคอน/ข้อความสีน้ำเงิน
 */
const TAB_ICON: Record<string, LucideIcon> = {
  index: House,
  history: History,
  stats: ChartColumn,
  profile: User,
};

/**
 * แท็บที่แสดงจริง (ลำดับตามนี้) — กรองด้วยชื่อ route โดยตรงแทนการพึ่ง
 * options.href === null เพราะ custom tabBar ไม่เห็นค่านั้นถูก merge เข้ามาเสมอ
 */
const VISIBLE_TAB_NAMES = ['index', 'history', 'stats', 'profile'];

function TabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const c = useColors();
  return (
    <View
      className="flex-row bg-surface"
      style={{
        borderTopWidth: 1,
        borderTopColor: c.navBorder,
        paddingBottom: insets.bottom,
      }}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        if (options.href === null || !VISIBLE_TAB_NAMES.includes(route.name)) return null;
        const label = options.title ?? route.name;
        const focused = state.index === index;
        const Icon = TAB_ICON[route.name] ?? Circle;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable key={route.key} onPress={onPress} className="flex-1 items-center pt-2 pb-1">
            <View
              className="items-center justify-center rounded-lg px-4 py-1"
              style={{ backgroundColor: focused ? c.primarySoft : 'transparent' }}
            >
              <Icon size={22} color={focused ? c.primaryDeep : c.subtle} />
            </View>
            <Text
              className="mt-0.5 text-[11px]"
              style={{
                color: focused ? c.primaryDeep : c.subtle,
                fontWeight: focused ? '700' : '500',
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: STR.tabs.dashboard }} />
      <Tabs.Screen name="history" options={{ title: STR.tabs.history }} />
      <Tabs.Screen name="stats" options={{ title: STR.tabs.stats }} />
      <Tabs.Screen name="profile" options={{ title: STR.tabs.profile }} />
      {/* หน้าจัดการกิจกรรมเดิม — เข้าผ่าน "ดูทั้งหมด" ไม่แสดงเป็นแท็บ */}
      <Tabs.Screen name="activities" options={{ href: null }} />
    </Tabs>
  );
}

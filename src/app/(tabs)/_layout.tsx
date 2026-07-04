import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { THEME } from '@/constants/palette';
import { STR } from '@/constants/strings';

/** 4 แท็บหลักตามกลุ่ม use case ในเอกสาร: หน้าแรก / จัดการกิจกรรม / ประวัติ / สถิติ */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: THEME.background },
        tabBarStyle: {
          backgroundColor: THEME.surface,
          borderTopColor: THEME.stroke,
        },
        tabBarActiveTintColor: THEME.primary,
        tabBarInactiveTintColor: THEME.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: STR.tabs.dashboard,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: STR.tabs.activities,
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: STR.tabs.history,
          tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: STR.tabs.stats,
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

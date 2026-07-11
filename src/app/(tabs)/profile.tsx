import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Screen from '@/components/ui/Screen';
import { useColors } from '@/hooks/useColors';
import { STR } from '@/constants/strings';
import { useQueryList } from '@/hooks/useQuery';
import { formatDuration } from '@/lib/dates';
import { activeActivitiesQuery } from '@/services/activityService';
import { historyQuery } from '@/services/sessionService';
import { currentStreak } from '@/services/statsService';
import { useAppStore } from '@/stores/appStore';

const DISPLAY_NAME = 'ผู้ใช้ HabitTime';

/** หน้าโปรไฟล์ (ดีไซน์ Figma "profile page") — ข้อมูลผู้ใช้ + สถิติรวม + เมนูตั้งค่า */
export default function ProfileScreen() {
  const activities = useQueryList(() => activeActivitiesQuery(), []);
  const allSessions = useQueryList(() => historyQuery(), []);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  const totalSec = useMemo(
    () => allSessions.reduce((sum, s) => sum + s.durationSec, 0),
    [allSessions],
  );
  const streak = useMemo(() => currentStreak(allSessions), [allSessions]);

  return (
    <Screen noBottomInset>
      <ScrollView contentContainerClassName="pb-10" showsVerticalScrollIndicator={false}>
        <ScreenHeader title={STR.profile.title} className="pt-3" />

        {/* ข้อมูลผู้ใช้ */}
        <View className="mt-4 items-center px-5">
          <View
            className="h-20 w-20 items-center justify-center rounded-full bg-primary"
            style={primaryShadow}
          >
            <Text className="text-3xl font-extrabold text-white">
              {DISPLAY_NAME.trim().charAt(0)}
            </Text>
          </View>
          <Text className="mt-3 text-lg font-extrabold text-ink">{DISPLAY_NAME}</Text>
          <Text className="mt-0.5 text-xs text-muted">{STR.landing.tagline}</Text>

          {/* ป้าย streak */}
          <View
            className="mt-3 flex-row items-center rounded-full px-3 py-1.5"
            style={{ backgroundColor: 'rgba(242,107,58,0.14)' }}
          >
            <Ionicons name="flame" size={13} color="#F26B3A" />
            <Text className="ml-1.5 text-xs font-bold" style={{ color: '#D9531F' }}>
              {STR.profile.streak} {streak} {STR.profile.days}
            </Text>
          </View>
        </View>

        {/* สถิติรวม 3 ช่อง */}
        <View className="mx-5 mt-5 flex-row rounded-2xl bg-surface py-4" style={cardShadow}>
          <StatCol value={formatDuration(totalSec)} label={STR.profile.totalTime} />
          <Divider />
          <StatCol value={String(allSessions.length)} label={STR.profile.times} />
          <Divider />
          <StatCol value={String(activities.length)} label={STR.profile.activities} />
        </View>

        {/* เมนู กลุ่มบัญชี */}
        <View className="mx-5 mt-5 overflow-hidden rounded-2xl bg-surface" style={cardShadow}>
          <MenuRow icon="create-outline" label={STR.profile.editProfile} onPress={() => router.push('/settings')} />
          <RowDivider />
          <MenuRow icon="flag-outline" label={STR.profile.dailyGoal} onPress={() => router.push('/settings')} />
          <RowDivider />
          <MenuRow icon="notifications-outline" label={STR.profile.notifications} onPress={() => router.push('/settings')} />
        </View>

        {/* เมนู กลุ่มระบบ */}
        <View className="mx-5 mt-4 overflow-hidden rounded-2xl bg-surface" style={cardShadow}>
          <MenuRow icon="settings-outline" label={STR.profile.settings} onPress={() => router.push('/settings')} />
          <RowDivider />
          <MenuRow
            icon="log-out-outline"
            label={STR.profile.logout}
            danger
            onPress={() => setConfirmLogout(true)}
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmLogout}
        message={STR.profile.logoutMessage}
        confirmLabel={STR.profile.logout}
        cancelLabel={STR.detail.cancel}
        destructive
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          setOnboarded(false);
        }}
      />
    </Screen>
  );
}

function StatCol({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 items-center px-1">
      <Text className="text-sm font-extrabold text-ink" numberOfLines={1}>
        {value}
      </Text>
      <Text className="mt-0.5 text-[11px] text-muted">{label}</Text>
    </View>
  );
}

function Divider() {
  return <View className="my-1 w-px bg-stroke" />;
}

function RowDivider() {
  return <View className="ml-14 h-px bg-stroke" />;
}

function MenuRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const c = useColors();
  const color = danger ? c.danger : c.ink;
  return (
    <Pressable onPress={onPress} className="flex-row items-center px-4 py-3.5 active:bg-surface2">
      <View className="h-8 w-8 items-center justify-center">
        <Ionicons name={icon} size={20} color={danger ? c.danger : c.primary} />
      </View>
      <Text className="ml-2 flex-1 text-[15px] font-medium" style={{ color }}>
        {label}
      </Text>
      {!danger && <Ionicons name="chevron-forward" size={18} color={c.subtle} />}
    </Pressable>
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

import '../global.css';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';

import { useColors } from '@/hooks/useColors';
import { seedDefaultCategoriesIfNeeded } from '@/database/seed';
import { initEncryption } from '@/lib/crypto/keyManager';
import { configureNotifications } from '@/services/notificationService';
import { isOnboardingDone } from '@/services/settingsService';
import { useAppStore } from '@/stores/appStore';
import { useThemeStore } from '@/stores/themeStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const ready = useAppStore((s) => s.ready);
  const onboarded = useAppStore((s) => s.onboarded);
  const setReady = useAppStore((s) => s.setReady);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const colors = useColors();
  const { colorScheme } = useColorScheme();

  // ไอคอนทั้งแอปเป็น lucide-react-native (SVG) — ไม่ต้อง preload ฟอนต์ไอคอนอีก

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await hydrateTheme(); // นำธีมที่บันทึกไว้มาใช้ก่อนแสดงผล
        // ลำดับสำคัญ: ต้องโหลดกุญแจเข้ารหัสก่อนแตะฐานข้อมูล
        await initEncryption();
        await seedDefaultCategoriesIfNeeded();
        await configureNotifications();
        const done = await isOnboardingDone();
        if (!cancelled) setReady(done);
      } catch (error) {
        console.error('[HabitTime] app init failed', error);
        if (!cancelled) setReady(false);
      } finally {
        SplashScreen.hideAsync();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setReady, hydrateTheme]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="activity/new" />
          <Stack.Screen name="activity/[id]/index" />
          <Stack.Screen name="activity/[id]/edit" />
          <Stack.Screen name="timer/[id]" />
          <Stack.Screen name="settings" />
        </Stack.Protected>
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

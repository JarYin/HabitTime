import '../global.css';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { THEME } from '@/constants/palette';
import { seedDefaultCategoriesIfNeeded } from '@/database/seed';
import { initEncryption } from '@/lib/crypto/keyManager';
import { configureNotifications } from '@/services/notificationService';
import { isOnboardingDone } from '@/services/settingsService';
import { useAppStore } from '@/stores/appStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const ready = useAppStore((s) => s.ready);
  const onboarded = useAppStore((s) => s.onboarded);
  const setReady = useAppStore((s) => s.setReady);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
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
  }, [setReady]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: THEME.background },
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
        </Stack.Protected>
      </Stack>
    </>
  );
}

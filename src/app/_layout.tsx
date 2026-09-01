import '../global.css';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { useColors } from '@/hooks/useColors';
import { STR } from '@/constants/strings';
import { seedDefaultCategoriesIfNeeded } from '@/database/seed';
import { initEncryption } from '@/lib/crypto/keyManager';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import { observeAuth } from '@/services/authService';
import { configureNotifications } from '@/services/notificationService';
import { hydrateSyncState, startAutoSync, syncNow } from '@/services/syncService';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { useGoalStore } from '@/stores/goalStore';
import { useThemeStore } from '@/stores/themeStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const ready = useAppStore((s) => s.ready);
  const setReady = useAppStore((s) => s.setReady);
  const setInitError = useAppStore((s) => s.setInitError);
  const initError = useAppStore((s) => s.initError);
  const authReady = useAuthStore((s) => s.ready);
  const setUser = useAuthStore((s) => s.setUser);
  // ใช้ uid (ไม่ใช่ตัว object) เป็น dependency — onAuthStateChanged ยิงซ้ำตอนต่ออายุ
  // token ด้วย ถ้าผูกกับ object จะเริ่ม/หยุด auto sync ใหม่ทุกครั้งโดยไม่จำเป็น
  const uid = useAuthStore((s) => s.user?.uid ?? null);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const hydrateGoal = useGoalStore((s) => s.hydrate);
  const colors = useColors();
  const { colorScheme } = useColorScheme();

  // ไอคอนทั้งแอปเป็น lucide-react-native (SVG) — ไม่ต้อง preload ฟอนต์ไอคอนอีก

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // ธีมเป็นเรื่องความสวยงามล้วน — แยก try ของตัวเองไว้ ห้ามให้มันพาการโหลด
      // กุญแจเข้ารหัส/ฐานข้อมูลล้มไปด้วย (เคยเกิดบนเว็บ: colorScheme.set() throw
      // แล้ว init ทั้งชุดหยุดกลางคัน จนกดปุ่มอะไรในแอปไม่ได้เลย)
      try {
        await hydrateTheme(); // นำธีมที่บันทึกไว้มาใช้ก่อนแสดงผล
      } catch (error) {
        console.warn('[HabitTime] theme hydrate failed', error);
      }

      try {
        // ลำดับสำคัญ: ต้องโหลดกุญแจเข้ารหัสก่อนแตะฐานข้อมูล
        await initEncryption();
        await seedDefaultCategoriesIfNeeded();
        await configureNotifications();
        await hydrateSyncState();
        await hydrateGoal();
      } catch (error) {
        // ปล่อยให้แอปเปิดต่อได้ (จะได้ไม่ค้างที่จอ splash) แต่ต้องบอกผู้ใช้ให้รู้
        // ไม่งั้นถ้ากุญแจโหลดไม่ขึ้น เขาจะเห็นชื่อกิจกรรมว่างเปล่าโดยไม่รู้สาเหตุ
        // ส่วนการซิงก์ถูกกันไว้แล้วที่ runSync (เช็ค isEncryptionReady) จึงไม่ทำข้อมูลพัง
        console.error('[HabitTime] app init failed', error);
        if (!cancelled) {
          setInitError(error instanceof Error ? error.message : String(error));
        }
      } finally {
        if (!cancelled) setReady();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setReady, setInitError, hydrateTheme, hydrateGoal]);

  // ติดตามสถานะล็อกอินตลอดอายุแอป — Firebase คืนค่าจาก session ที่เก็บไว้ให้เอง
  useEffect(() => {
    if (!isFirebaseConfigured) {
      // ยังไม่ได้ใส่ค่าใน .env — อย่าค้างที่หน้า splash ปล่อยเข้าหน้าล็อกอิน
      // แล้วให้ข้อความ error ในหน้านั้นอธิบายว่าต้องทำอะไร
      setUser(null);
      return;
    }
    return observeAuth(setUser);
  }, [setUser]);

  // ล็อกอินอยู่ = เปิดการซิงก์อัตโนมัติ, ออกจากระบบ = ปิด
  useEffect(() => {
    if (!ready || !uid) return;
    void syncNow();
    return startAutoSync();
  }, [ready, uid]);

  // ซ่อน splash เมื่อพร้อมทั้งฝั่งเครื่องและฝั่ง auth — กันหน้าจอว่างแวบหนึ่ง
  useEffect(() => {
    if (ready && authReady) void SplashScreen.hideAsync();
  }, [ready, authReady]);

  if (!ready || !authReady) return null;

  const signedIn = uid !== null;

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {/* init พลาด = อาจอ่านชื่อกิจกรรมไม่ออกและซิงก์ถูกระงับ ต้องบอกให้เห็นชัด */}
      {initError && (
        <View style={{ backgroundColor: colors.danger, paddingHorizontal: 16, paddingVertical: 10 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
            {STR.common.initFailed}
          </Text>
          <Text style={{ color: '#FFFFFF', fontSize: 11, marginTop: 2 }} numberOfLines={3}>
            {initError}
          </Text>
        </View>
      )}

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="activity/new" />
          <Stack.Screen name="activity/[id]/index" />
          <Stack.Screen name="activity/[id]/edit" />
          <Stack.Screen name="timer/[id]" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="account" />
          <Stack.Screen name="goal" />
          <Stack.Screen name="notifications" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

import { router } from 'expo-router';
import { ChartColumn, Target, Timer, type LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

import PrimaryButton from '@/components/ui/PrimaryButton';
import Screen from '@/components/ui/Screen';
import { useColors } from '@/hooks/useColors';
import { STR } from '@/constants/strings';

const FEATURE_ICONS: LucideIcon[] = [Target, Timer, ChartColumn];

/**
 * หน้าเริ่มต้นใช้งาน (Landing) — โลโก้แอป + จุดเด่น 3 อย่าง + ปุ่มเข้าใช้งาน/เข้าสู่ระบบ
 * ดีไซน์ตาม Figma "landing page"
 *
 * ทั้งสองปุ่มพาไปหน้าเดียวกัน ต่างกันแค่แท็บที่เปิดค้างไว้ (สมัคร / เข้าสู่ระบบ)
 * เมื่อล็อกอินสำเร็จ Stack.Protected ใน root layout จะพาเข้าหน้าหลักเอง
 */
export default function LandingScreen() {
  const c = useColors();

  return (
    <Screen className="px-8">
      <View className="flex-1 items-center justify-center">
        {/* โลโก้ */}
        <View
          className="h-24 w-24 items-center justify-center rounded-3xl bg-primary"
          style={{
            shadowColor: c.primary,
            shadowOpacity: 0.35,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 8,
          }}
        >
          <Timer size={44} color="#FFFFFF" />
        </View>
        <Text className="mt-5 text-3xl font-extrabold text-ink">{STR.appName}</Text>
        <Text className="mt-2 text-sm text-muted">{STR.landing.tagline}</Text>

        {/* จุดเด่น 3 อย่าง */}
        <View className="mt-10 w-full flex-row justify-between">
          {STR.landing.features.map((feat, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <View
                key={feat.label}
                className="mx-1.5 flex-1 items-center rounded-2xl bg-surface py-5"
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 1,
                }}
              >
                <View
                  className="h-11 w-11 items-center justify-center rounded-full bg-primary/12"
                >
                  <Icon size={22} color={c.primary} />
                </View>
                <Text className="mt-3 text-xs font-semibold text-ink">{feat.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ปุ่ม */}
      <View className="pb-6">
        <PrimaryButton
          label={STR.landing.start}
          onPress={() => router.push({ pathname: '/login', params: { mode: 'register' } })}
        />
        <PrimaryButton
          label={STR.landing.haveAccount}
          onPress={() => router.push('/login')}
          variant="outline"
          className="mt-3"
        />
      </View>
    </Screen>
  );
}

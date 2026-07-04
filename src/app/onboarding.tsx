import { useRef, useState } from 'react';
import { FlatList, Pressable, Text, useWindowDimensions, View } from 'react-native';

import Screen from '@/components/ui/Screen';
import { STR } from '@/constants/strings';
import { setOnboardingDone } from '@/services/settingsService';
import { useAppStore } from '@/stores/appStore';

/**
 * หน้าต้อนรับ (Welcome Page ตามเอกสาร SRS) — แนะนำแอป จุดเด่น และนโยบายความเป็นส่วนตัว
 * เวอร์ชัน local-first ไม่มีสมัครสมาชิก/ล็อกอิน: จบ onboarding แล้วเข้าใช้ได้เลย
 */
export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList>(null);
  const [page, setPage] = useState(0);
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  const slides = STR.onboarding.slides;
  const isLast = page === slides.length - 1;

  const finish = async () => {
    await setOnboardingDone();
    setOnboarded(true); // Stack.Protected พาไป (tabs) อัตโนมัติ
  };

  const next = () => {
    if (isLast) {
      void finish();
    } else {
      listRef.current?.scrollToIndex({ index: page + 1, animated: true });
    }
  };

  return (
    <Screen>
      <View className="items-center pt-6">
        <Text className="text-2xl font-extrabold text-primary">{STR.appName}</Text>
        <Text className="mt-1 text-sm text-muted">{STR.tagline}</Text>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width }} className="items-center justify-center px-10">
            <Text className="text-7xl">{item.emoji}</Text>
            <Text className="mt-8 text-center text-2xl font-bold text-ink">{item.title}</Text>
            <Text className="mt-4 text-center text-base leading-7 text-muted">{item.body}</Text>
          </View>
        )}
      />

      <View className="px-8 pb-6">
        <View className="mb-6 flex-row justify-center gap-2">
          {slides.map((s, i) => (
            <View
              key={s.title}
              className={`h-2 rounded-full ${i === page ? 'w-6 bg-primary' : 'w-2 bg-stroke'}`}
            />
          ))}
        </View>
        <Pressable
          onPress={next}
          className="items-center rounded-2xl bg-primary py-4 active:opacity-80"
        >
          <Text className="text-base font-bold text-background">
            {isLast ? STR.onboarding.start : STR.onboarding.next}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import PrimaryButton from '@/components/ui/PrimaryButton';
import Screen from '@/components/ui/Screen';
import { useColors } from '@/hooks/useColors';
import { STR } from '@/constants/strings';
import { setOnboardingDone } from '@/services/settingsService';
import { useAppStore } from '@/stores/appStore';

/**
 * หน้าเข้าสู่ระบบ / สมัครสมาชิก (ดีไซน์ตาม Figma "login page")
 */
export default function LoginScreen() {
  const c = useColors();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  const submit = async () => {
    await setOnboardingDone();
    setOnboarded(true);
  };

  return (
    <Screen className="px-6">
      {/* ปุ่มย้อนกลับ */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        className="mt-1 h-10 w-10 items-center justify-center rounded-full active:bg-surface2"
      >
        <Ionicons name="chevron-back" size={24} color={c.ink} />
      </Pressable>

      <Text className="mt-3 text-2xl font-extrabold text-ink">{STR.login.welcomeBack}</Text>

      {/* สลับเข้าสู่ระบบ / สมัครสมาชิก */}
      <View className="mt-6 flex-row rounded-2xl bg-surface p-1">
        {(['login', 'register'] as const).map((m) => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              className="flex-1 items-center rounded-xl py-2.5"
              style={{ backgroundColor: active ? c.primary : 'transparent' }}
            >
              <Text
                className="text-sm font-bold"
                style={{ color: active ? '#FFFFFF' : c.muted }}
              >
                {m === 'login' ? STR.login.tabLogin : STR.login.tabRegister}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* อีเมล */}
      <Text className="mb-2 mt-7 text-sm font-semibold text-muted">{STR.login.email}</Text>
      <View className="flex-row items-center rounded-2xl bg-surface px-4">
        <Ionicons name="mail-outline" size={18} color={c.muted} />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder={STR.login.emailPlaceholder}
          placeholderTextColor={c.subtle}
          keyboardType="email-address"
          autoCapitalize="none"
          className="ml-2 flex-1 py-3.5 text-base text-ink"
        />
      </View>

      {/* รหัสผ่าน */}
      <Text className="mb-2 mt-4 text-sm font-semibold text-muted">{STR.login.password}</Text>
      <View className="flex-row items-center rounded-2xl bg-surface px-4">
        <Ionicons name="lock-closed-outline" size={18} color={c.muted} />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={STR.login.passwordPlaceholder}
          placeholderTextColor={c.subtle}
          secureTextEntry={!showPassword}
          className="ml-2 flex-1 py-3.5 text-base text-ink"
        />
        <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={c.muted}
          />
        </Pressable>
      </View>

      {mode === 'login' && (
        <Pressable onPress={() => void submit()} hitSlop={6} className="mt-3 self-end">
          <Text className="text-xs font-semibold text-primary">{STR.login.forgot}</Text>
        </Pressable>
      )}

      <PrimaryButton
        label={mode === 'login' ? STR.login.submit : STR.login.submitRegister}
        onPress={() => void submit()}
        className="mt-7"
      />
    </Screen>
  );
}

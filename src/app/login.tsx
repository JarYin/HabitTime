import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import PrimaryButton from '@/components/ui/PrimaryButton';
import Screen from '@/components/ui/Screen';
import { useColors } from '@/hooks/useColors';
import { STR } from '@/constants/strings';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import { registerWithEmail, sendResetEmail, signInWithEmail } from '@/services/authService';

type Mode = 'login' | 'register';

/**
 * หน้าเข้าสู่ระบบ / สมัครสมาชิก (ดีไซน์ตาม Figma "login page")
 *
 * เมื่อล็อกอินสำเร็จไม่ต้อง navigate เอง — observeAuth ใน root layout จะอัปเดต
 * useAuthStore แล้ว Stack.Protected พาเข้าหน้าหลักให้เอง
 */
export default function LoginScreen() {
  const c = useColors();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>(params.mode === 'register' ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const submit = async () => {
    if (busy) return;
    setError(null);
    setNotice(null);

    if (!email.trim()) return setError(STR.login.emailRequired);
    if (!password) return setError(STR.login.passwordRequired);

    setBusy(true);
    try {
      if (mode === 'register') {
        await registerWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const forgotPassword = async () => {
    if (busy) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await sendResetEmail(email);
      setNotice(STR.login.resetSent);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen className="px-6">
      {/* ปุ่มย้อนกลับ */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        className="mt-1 h-10 w-10 items-center justify-center rounded-full active:bg-surface2"
      >
        <ChevronLeft size={24} color={c.ink} />
      </Pressable>

      <Text className="mt-3 text-2xl font-extrabold text-ink">{STR.login.welcome}</Text>

      {/* สลับเข้าสู่ระบบ / สมัครสมาชิก */}
      <View className="mt-6 flex-row rounded-2xl bg-surface p-1">
        {(['login', 'register'] as const).map((m) => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              onPress={() => switchMode(m)}
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
        <Mail size={18} color={c.muted} />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder={STR.login.emailPlaceholder}
          placeholderTextColor={c.subtle}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!busy}
          className="ml-2 flex-1 py-3.5 text-base text-ink"
        />
      </View>

      {/* รหัสผ่าน */}
      <Text className="mb-2 mt-4 text-sm font-semibold text-muted">{STR.login.password}</Text>
      <View className="flex-row items-center rounded-2xl bg-surface px-4">
        <Lock size={18} color={c.muted} />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={STR.login.passwordPlaceholder}
          placeholderTextColor={c.subtle}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          editable={!busy}
          onSubmitEditing={() => void submit()}
          className="ml-2 flex-1 py-3.5 text-base text-ink"
        />
        <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
          {showPassword ? <EyeOff size={18} color={c.muted} /> : <Eye size={18} color={c.muted} />}
        </Pressable>
      </View>

      {mode === 'register' && (
        <Text className="mt-2 text-xs text-subtle">{STR.login.passwordHint}</Text>
      )}

      {mode === 'login' && (
        <Pressable onPress={() => void forgotPassword()} hitSlop={6} className="mt-3 self-end">
          <Text className="text-xs font-semibold text-primary">{STR.login.forgot}</Text>
        </Pressable>
      )}

      {/* ผลลัพธ์ของการกดปุ่มล่าสุด */}
      {!isFirebaseConfigured && (
        <Text className="mt-4 text-sm text-danger">{STR.login.notConfigured}</Text>
      )}
      {error && <Text className="mt-4 text-sm text-danger">{error}</Text>}
      {notice && <Text className="mt-4 text-sm text-success">{notice}</Text>}

      <PrimaryButton
        label={
          busy
            ? STR.login.working
            : mode === 'login'
              ? STR.login.submit
              : STR.login.submitRegister
        }
        onPress={() => void submit()}
        loading={busy}
        className="mt-7"
      />
    </Screen>
  );
}

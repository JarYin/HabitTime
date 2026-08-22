import { KeyRound, Lock, Mail, User } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import PrimaryButton from '@/components/ui/PrimaryButton';
import Screen from '@/components/ui/Screen';
import SubHeader from '@/components/ui/SubHeader';
import { useColors } from '@/hooks/useColors';
import { STR } from '@/constants/strings';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import {
  displayNameOf,
  MAX_DISPLAY_NAME_LENGTH,
  sendResetEmail,
  updateDisplayName,
} from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

/**
 * แก้ไขข้อมูลส่วนตัว — แก้ชื่อที่แสดงได้, อีเมลอ่านอย่างเดียว
 * (ใช้เข้าสู่ระบบ เปลี่ยนในแอปไม่ได้), เปลี่ยนรหัสผ่านผ่านลิงก์รีเซ็ตทางอีเมล
 */
export default function AccountScreen() {
  const c = useColors();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState(user?.displayName ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const nameUnchanged = name.trim() === (user?.displayName ?? '');

  const save = async () => {
    if (busy) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const updated = await updateDisplayName(name);
      setUser(updated);
      setName(updated.displayName ?? '');
      setNotice(STR.account.saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (busy || !user?.email) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await sendResetEmail(user.email);
      setNotice(STR.account.resetSent);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <SubHeader title={STR.account.title} />
      <ScrollView contentContainerClassName="px-5 pb-10">
        {/* วงกลมอวตาร */}
        <View className="items-center py-2">
          <View
            className="h-20 w-20 items-center justify-center rounded-full bg-primary"
            style={primaryShadow}
          >
            <Text className="text-3xl font-extrabold text-white">
              {displayNameOf(user).trim().charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ชื่อที่แสดง */}
        <Text className="mb-2 mt-5 text-sm font-semibold text-muted">
          {STR.account.displayName}
        </Text>
        <View className="flex-row items-center rounded-2xl bg-surface px-4">
          <User size={18} color={c.muted} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={STR.account.namePlaceholder}
            placeholderTextColor={c.subtle}
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            editable={!busy}
            className="ml-2 flex-1 py-3.5 text-base text-ink"
          />
        </View>
        <Text className="mt-2 text-xs text-subtle">{STR.account.nameHint}</Text>

        {/* อีเมล (อ่านอย่างเดียว) */}
        <Text className="mb-2 mt-4 text-sm font-semibold text-muted">{STR.account.email}</Text>
        <View className="flex-row items-center rounded-2xl bg-surface2 px-4">
          <Mail size={18} color={c.muted} />
          <Text className="ml-2 flex-1 py-3.5 text-base text-muted">{user?.email}</Text>
          <Lock size={16} color={c.subtle} />
        </View>
        <Text className="mt-2 text-xs text-subtle">{STR.account.emailLocked}</Text>

        {!isFirebaseConfigured && (
          <Text className="mt-4 text-sm text-danger">{STR.login.notConfigured}</Text>
        )}
        {error && <Text className="mt-4 text-sm text-danger">{error}</Text>}
        {notice && <Text className="mt-4 text-sm text-success">{notice}</Text>}

        <PrimaryButton
          label={busy ? STR.account.saving : STR.account.save}
          onPress={() => void save()}
          loading={busy}
          disabled={!isFirebaseConfigured || nameUnchanged || name.trim().length === 0}
          className="mt-7"
        />

        {/* ความปลอดภัย */}
        <Text className="mb-2 mt-8 text-sm font-semibold text-muted">{STR.account.security}</Text>
        <PrimaryButton
          variant="outline"
          icon={KeyRound}
          label={STR.account.sendReset}
          onPress={() => void resetPassword()}
          disabled={!isFirebaseConfigured || busy}
        />
        <Text className="mt-2 text-xs text-subtle">{STR.account.resetHint}</Text>
      </ScrollView>
    </Screen>
  );
}

const primaryShadow = {
  shadowColor: '#0F2EF5',
  shadowOpacity: 0.3,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: 6,
} as const;

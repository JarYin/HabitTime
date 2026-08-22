import {
  Bell,
  BellOff,
  CalendarDays,
  Clock,
  Flame,
  Target,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import EmptyState from '@/components/EmptyState';
import { STR } from '@/constants/strings';
import { useColors } from '@/hooks/useColors';
import type { FeedIcon, FeedItem, FeedTone } from '@/services/notificationFeedService';

const FEED_ICON: Record<FeedIcon, LucideIcon> = {
  goal: Target,
  streak: Flame,
  idle: Clock,
  week: CalendarDays,
  reminder: Bell,
};

interface NotificationsModalProps {
  visible: boolean;
  items: FeedItem[];
  onClose: () => void;
}

/** popup กระดิ่งแจ้งเตือน — คำนวณจากข้อมูลที่มีอยู่แล้ว ไม่มีตารางเก็บแจ้งเตือน */
export default function NotificationsModal({ visible, items, onClose }: NotificationsModalProps) {
  const c = useColors();

  const toneColor = (tone: FeedTone): string => {
    switch (tone) {
      case 'primary':
        return c.primary;
      case 'success':
        return c.success;
      case 'warn':
        return c.warn;
      case 'info':
        return c.subtle;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 items-center px-5 pt-24"
        style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-h-[70%] rounded-2xl bg-surface p-4"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 10 },
            elevation: 10,
          }}
        >
          <View className="flex-row items-center">
            <Bell size={18} color={c.ink} />
            <Text className="ml-2 flex-1 text-base font-extrabold text-ink">
              {STR.notifications.title}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={18} color={c.subtle} />
            </Pressable>
          </View>

          {items.length === 0 ? (
            <EmptyState icon={BellOff} message={STR.notifications.empty} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
              {items.map((item, i) => {
                const Icon = FEED_ICON[item.icon];
                return (
                  <View key={item.id}>
                    {i > 0 && <View className="ml-12 h-px bg-stroke" />}
                    <View className="flex-row items-start py-3">
                      <View className="h-9 w-9 items-center justify-center rounded-full bg-surface2">
                        <Icon size={17} color={toneColor(item.tone)} />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-sm font-bold text-ink">{item.title}</Text>
                        <Text className="mt-0.5 text-xs leading-5 text-muted">{item.body}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

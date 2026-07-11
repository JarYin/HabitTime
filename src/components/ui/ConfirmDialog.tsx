import { Modal, Pressable, Text, View } from 'react-native';

interface ConfirmDialogProps {
  visible: boolean;
  message: string;
  /** ส่วนของข้อความที่ต้องเน้นสี (เช่น ชื่อกิจกรรม) — ต่อท้าย message */
  highlight?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** กล่องยืนยัน (ดีไซน์ตาม Figma "dialog") — การ์ดขาวลอยกลางจอ + ปุ่มยกเลิก/ยืนยัน */
export default function ConfirmDialog({
  visible,
  message,
  highlight,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        className="flex-1 items-center justify-center px-10"
        style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full rounded-2xl bg-surface p-5"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 10 },
            elevation: 10,
          }}
        >
          <Text className="text-center text-[15px] font-semibold leading-6 text-ink">
            {message}
            {highlight ? <Text className="text-primary"> {highlight}</Text> : null}
          </Text>

          <View className="mt-5 flex-row gap-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 items-center rounded-xl bg-surface2 py-3 active:opacity-80"
            >
              <Text className="text-sm font-bold text-muted">{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className={`flex-1 items-center rounded-xl py-3 active:opacity-80 ${
                destructive ? 'bg-danger' : 'bg-primary'
              }`}
            >
              <Text className="text-sm font-bold text-white">{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

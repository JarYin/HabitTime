import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

interface ConfirmDialogProps {
  visible: boolean;
  message: string;
  /** ส่วนของข้อความที่ต้องเน้นสี (เช่น ชื่อกิจกรรม) — ต่อท้าย message */
  highlight?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  /** รองรับงาน async — กล่องจะกันการกดซ้ำจนกว่างานจะเสร็จ */
  onConfirm: () => void | Promise<void>;
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
  /**
   * Modal แบบ animationType="fade" ยังกดทะลุได้ระหว่างอนิเมชันปิด การกดสองครั้งเร็ว ๆ
   * จึงเรียก onConfirm ซ้ำ — งานลบทำงานสองรอบ รอบสองโยน unhandled rejection
   * และ router.dismissAll() ยิงซ้อนสองครั้ง กันด้วย ref ที่ตั้งค่าทันที (ไม่ใช่ state
   * ที่กว่าจะอัปเดตก็เรนเดอร์ถัดไปแล้ว)
   */
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

  // เปิดกล่องใหม่ต้องเริ่มจากสถานะสะอาดเสมอ ไม่งั้นถ้ารอบก่อนปิดไปตอนยังไม่เสร็จ
  // ปุ่มจะค้างเป็น disabled ตั้งแต่เปิดมา
  useEffect(() => {
    if (!visible) return;
    busyRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBusy(false);
  }, [visible]);

  const handleConfirm = () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);

    void Promise.resolve(onConfirm()).finally(() => {
      busyRef.current = false;
      setBusy(false);
    });
  };

  const handleCancel = () => {
    if (busyRef.current) return;
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <Pressable
        onPress={handleCancel}
        accessibilityRole="button"
        accessibilityLabel={cancelLabel}
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
              onPress={handleCancel}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              accessibilityState={{ disabled: busy }}
              className="flex-1 items-center rounded-xl bg-surface2 py-3 active:opacity-80"
              style={busy ? { opacity: 0.5 } : undefined}
            >
              <Text className="text-sm font-bold text-muted">{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              accessibilityState={{ disabled: busy }}
              className={`flex-1 items-center rounded-xl py-3 active:opacity-80 ${
                destructive ? 'bg-danger' : 'bg-primary'
              }`}
              style={busy ? { opacity: 0.5 } : undefined}
            >
              <Text className="text-sm font-bold text-white">{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

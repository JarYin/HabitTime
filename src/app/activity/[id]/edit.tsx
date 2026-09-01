import { router, useLocalSearchParams } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';

import ActivityForm from '@/components/ActivityForm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Screen from '@/components/ui/Screen';
import SubHeader from '@/components/ui/SubHeader';
import { useColors } from '@/hooks/useColors';
import { STR } from '@/constants/strings';
import { activitiesCollection } from '@/database';
import { useQueryList, useRecord } from '@/hooks/useQuery';
import { deleteActivity, updateActivity } from '@/services/activityService';
import { categoriesQuery } from '@/services/categoryService';

/** หน้าแก้ไขกิจกรรม — use case: แก้ไขรายละเอียด → บันทึก / ลบกิจกรรม (พร้อมยืนยัน) */
export default function EditActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activity = useRecord(activitiesCollection, id);
  const categories = useQueryList(() => categoriesQuery(), []);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const c = useColors();

  // กิจกรรมไม่มีอยู่จริง/ถูกลบไปแล้ว (เช่นซิงก์ดึงการลบจากอีกเครื่องมา) — พากลับเอง
  // เดิมคืนจอเปล่าที่ไม่มี SubHeader จึงไม่มีปุ่มย้อนกลับ ผู้ใช้ติดค้างถาวร
  // (หน้ารายละเอียดจัดการเคสนี้ถูกอยู่แล้ว แต่หน้าแก้ไขไม่เคยได้โค้ดชุดเดียวกัน)
  useEffect(() => {
    if (activity === null) router.back();
  }, [activity]);

  // ยังโหลดอยู่ (undefined) หรือกำลังจะถูกพากลับ — แสดงจอว่างพร้อมหัวข้อไว้ก่อน
  if (!activity || categories.length === 0) {
    return (
      <Screen>
        <SubHeader title={STR.form.editTitle} />
      </Screen>
    );
  }

  return (
    <Screen>
      <SubHeader
        title={STR.form.editTitle}
        right={
          <Pressable
            onPress={() => setConfirmDelete(true)}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-surface2"
          >
            <Trash2 size={20} color={c.danger} />
          </Pressable>
        }
      />
      <ActivityForm
        categories={categories}
        initial={{
          name: activity.name,
          categoryId: activity.categoryId,
          emoji: activity.emoji,
          color: activity.color,
        }}
        submitLabel={STR.form.saveEdit}
        onCancel={() => router.back()}
        onSubmit={async (input) => {
          await updateActivity(activity, input);
          router.back();
        }}
      />

      <ConfirmDialog
        visible={confirmDelete}
        message={STR.detail.deleteConfirmMessage}
        highlight={activity.name}
        confirmLabel={STR.detail.deleteConfirm}
        cancelLabel={STR.detail.cancel}
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          await deleteActivity(activity);
          // ลบแล้วกลับไปหน้าหลักเลย ไม่ใช่แค่ back() ทีละหน้า —
          // ไม่งั้นจะไปโผล่หน้ารายละเอียดของกิจกรรมที่เพิ่งลบไปแล้ว
          router.dismissAll();
        }}
      />
    </Screen>
  );
}

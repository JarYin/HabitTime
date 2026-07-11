import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
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

  if (!activity || categories.length === 0) return <Screen />;

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
            <Ionicons name="trash-outline" size={20} color={c.danger} />
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
          router.back();
        }}
      />
    </Screen>
  );
}

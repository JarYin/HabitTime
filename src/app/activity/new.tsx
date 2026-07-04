import { router } from 'expo-router';

import ActivityForm from '@/components/ActivityForm';
import Screen from '@/components/ui/Screen';
import SubHeader from '@/components/ui/SubHeader';
import { STR } from '@/constants/strings';
import { useQueryList } from '@/hooks/useQuery';
import { createActivity } from '@/services/activityService';
import { categoriesQuery } from '@/services/categoryService';

/** หน้าเพิ่มกิจกรรม — flow: ใส่ชื่อ → เลือกหมวดหมู่ → เลือกอิโมจิ → เลือกสี → บันทึก */
export default function NewActivityScreen() {
  const categories = useQueryList(() => categoriesQuery(), []);

  if (categories.length === 0) return null; // รอ seed หมวดหมู่ (เกิดเฉพาะเสี้ยววินาทีแรก)

  return (
    <Screen>
      <SubHeader title={STR.form.newTitle} />
      <ActivityForm
        categories={categories}
        submitLabel={STR.form.save}
        onSubmit={async (input) => {
          await createActivity(input);
          router.back();
        }}
      />
    </Screen>
  );
}

import { router, useLocalSearchParams } from 'expo-router';

import ActivityForm from '@/components/ActivityForm';
import Screen from '@/components/ui/Screen';
import SubHeader from '@/components/ui/SubHeader';
import { STR } from '@/constants/strings';
import { activitiesCollection } from '@/database';
import { useQueryList, useRecord } from '@/hooks/useQuery';
import { updateActivity } from '@/services/activityService';
import { categoriesQuery } from '@/services/categoryService';

/** หน้าแก้ไขกิจกรรม — use case: แก้ไขรายละเอียด → บันทึกการแก้ไข */
export default function EditActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activity = useRecord(activitiesCollection, id);
  const categories = useQueryList(() => categoriesQuery(), []);

  if (!activity || categories.length === 0) return <Screen />;

  return (
    <Screen>
      <SubHeader title={STR.form.editTitle} />
      <ActivityForm
        categories={categories}
        initial={{
          name: activity.name,
          categoryId: activity.categoryId,
          emoji: activity.emoji,
          color: activity.color,
        }}
        submitLabel={STR.form.saveEdit}
        onSubmit={async (input) => {
          await updateActivity(activity, input);
          router.back();
        }}
      />
    </Screen>
  );
}

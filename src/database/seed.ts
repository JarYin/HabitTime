/**
 * Seed หมวดหมู่เริ่มต้นตอนเปิดแอปครั้งแรก
 * (เอกสาร SRS ให้ผู้ใช้ "เลือกหมวดหมู่" จากรายการที่มีอยู่)
 */
import { DEFAULT_CATEGORIES } from '@/constants/palette';
import { categoriesCollection, database } from './index';

export async function seedDefaultCategoriesIfNeeded(): Promise<void> {
  const count = await categoriesCollection.query().fetchCount();
  if (count > 0) return;

  await database.write(async () => {
    const records = DEFAULT_CATEGORIES.map((cat, index) =>
      categoriesCollection.prepareCreate((c) => {
        // ใช้ id ตายตัวจาก DEFAULT_CATEGORIES เพื่อให้ทุกเครื่องได้ id เดียวกัน
        // มิฉะนั้นการซิงก์จะสร้างหมวดหมู่ซ้ำบนคลาวด์ (ดูหมายเหตุใน palette.ts)
        c._raw.id = cat.id;
        c.name = cat.name;
        c.emoji = cat.emoji;
        c.color = cat.color;
        c.isDefault = true;
        c.sortOrder = index;
      }),
    );
    await database.batch(...records);
  });
}

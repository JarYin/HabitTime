/** Query หมวดหมู่ทั้งหมดตามลำดับที่กำหนด */
import { Q } from '@nozbe/watermelondb';

import { categoriesCollection } from '@/database';

export function categoriesQuery() {
  return categoriesCollection.query(Q.sortBy('sort_order', Q.asc));
}

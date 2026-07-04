import { Model, Query } from '@nozbe/watermelondb';
import type { Associations } from '@nozbe/watermelondb/Model';
import { children, date, field, readonly, text } from '@nozbe/watermelondb/decorators';

import type Activity from './Activity';

/** หมวดหมู่กิจกรรม เช่น การเรียน ออกกำลังกาย (use case "เลือกหมวดหมู่" / "กรองตามหมวดหมู่") */
export default class Category extends Model {
  static table = 'categories';

  static associations: Associations = {
    activities: { type: 'has_many', foreignKey: 'category_id' },
  };

  @text('name') name: string;
  @text('emoji') emoji: string;
  @text('color') color: string;
  @field('is_default') isDefault: boolean;
  @field('sort_order') sortOrder: number;
  @readonly @date('created_at') createdAt: Date;
  @readonly @date('updated_at') updatedAt: Date;

  @children('activities') activities: Query<Activity>;
}

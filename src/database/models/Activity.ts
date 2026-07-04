import { Model, Query, Relation } from '@nozbe/watermelondb';
import type { Associations } from '@nozbe/watermelondb/Model';
import { children, date, field, readonly, relation, text } from '@nozbe/watermelondb/decorators';

import { decryptText, encryptText } from '@/lib/crypto/fieldCipher';
import type Category from './Category';
import type TimeSession from './TimeSession';

/**
 * กิจกรรม (Activity) — เอนทิตีหลักตามเอกสาร SRS
 * ประกอบด้วย ชื่อ, หมวดหมู่, อิโมจิ, สี (use case "เพิ่มกิจกรรม")
 * ชื่อกิจกรรมเป็นข้อมูลส่วนตัว จึงเก็บในคอลัมน์ name_enc แบบเข้ารหัส
 */
export default class Activity extends Model {
  static table = 'activities';

  static associations: Associations = {
    time_sessions: { type: 'has_many', foreignKey: 'activity_id' },
    categories: { type: 'belongs_to', key: 'category_id' },
  };

  @text('name_enc') nameEnc: string;
  @field('category_id') categoryId: string;
  @text('emoji') emoji: string;
  @text('color') color: string;
  @field('is_archived') isArchived: boolean;
  @readonly @date('created_at') createdAt: Date;
  @readonly @date('updated_at') updatedAt: Date;

  @relation('categories', 'category_id') category: Relation<Category>;
  @children('time_sessions') sessions: Query<TimeSession>;

  /** ชื่อกิจกรรม (ถอดรหัสแล้ว) — ห้าม query คอลัมน์นี้ใน SQL, ค้นหาใน memory แทน */
  get name(): string {
    return decryptText(this.nameEnc);
  }

  /** ใช้ภายใน database.write() เท่านั้น */
  setName(plainName: string): void {
    this.nameEnc = encryptText(plainName);
  }
}

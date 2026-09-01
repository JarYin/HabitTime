import { Model, Relation } from '@nozbe/watermelondb';
import type { Associations } from '@nozbe/watermelondb/Model';
import { date, field, readonly, relation, text } from '@nozbe/watermelondb/decorators';

import { decryptText, encryptText } from '@/lib/crypto/fieldCipher';
import type Activity from './Activity';

/**
 * บันทึกการจับเวลา 1 ครั้ง (ประวัติการใช้งานตามเอกสาร SRS)
 * เกิดจาก flow: เริ่มจับเวลา → (พัก/จับต่อ) → สิ้นสุดและบันทึกเวลา
 */
export default class TimeSession extends Model {
  static table = 'time_sessions';

  static associations: Associations = {
    activities: { type: 'belongs_to', key: 'activity_id' },
  };

  @field('activity_id') activityId: string;
  @date('started_at') startedAt: Date;
  @date('ended_at') endedAt: Date;
  @field('duration_sec') durationSec: number;
  @text('day_key') dayKey: string;
  /** นาทีชดเชยจาก UTC ของเครื่องที่บันทึก — null สำหรับแถวที่บันทึกก่อน schema v2 */
  @field('tz_offset_min') tzOffsetMin: number | null;
  @text('note_enc') noteEnc: string | null;
  @readonly @date('created_at') createdAt: Date;
  @readonly @date('updated_at') updatedAt: Date;

  @relation('activities', 'activity_id') activity: Relation<Activity>;

  /** โน้ตประกอบ (ถอดรหัสแล้ว) */
  get note(): string {
    return decryptText(this.noteEnc);
  }

  /** ใช้ภายใน database.write() เท่านั้น */
  setNote(plainNote: string): void {
    this.noteEnc = plainNote ? encryptText(plainNote) : null;
  }
}

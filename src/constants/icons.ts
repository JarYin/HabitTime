/**
 * ทะเบียนไอคอนกิจกรรม — ใช้ lucide-react-native เท่านั้น (ห้าม emoji)
 *
 * ฐานข้อมูลเก็บ "ชื่อไอคอน" (kebab-case ตามชื่อ lucide) ในคอลัมน์ emoji เดิม
 * เพื่อไม่ต้อง migrate schema — resolveActivityIcon() แปลงชื่อ (หรือค่า emoji
 * เก่าที่เคยบันทึกไว้) เป็นคอมโพเนนต์ไอคอนเสมอ
 */
import {
  Bed,
  Bike,
  Book,
  BookOpen,
  Brain,
  Briefcase,
  Camera,
  ChefHat,
  Code,
  Coffee,
  Dog,
  Droplet,
  Dumbbell,
  Ellipsis,
  FileText,
  Flower2,
  FolderOpen,
  Footprints,
  Gamepad2,
  Guitar,
  Headphones,
  Heart,
  HeartHandshake,
  Laptop,
  Leaf,
  Mic,
  Moon,
  Music,
  Palette,
  PartyPopper,
  PenLine,
  Sparkles,
  Sprout,
  Target,
  Timer,
  Trophy,
  type LucideIcon,
} from 'lucide-react-native';

/** ชื่อไอคอน → คอมโพเนนต์ (รวมทั้งตัวที่อยู่ในตัวเลือกและตัวสำรองสำหรับข้อมูลเก่า) */
export const ICON_MAP = {
  'book-open': BookOpen,
  dumbbell: Dumbbell,
  brain: Brain,
  code: Code,
  guitar: Guitar,
  palette: Palette,
  'pen-line': PenLine,
  headphones: Headphones,
  sprout: Sprout,
  coffee: Coffee,
  'party-popper': PartyPopper,
  ellipsis: Ellipsis,
  book: Book,
  laptop: Laptop,
  music: Music,
  camera: Camera,
  'gamepad-2': Gamepad2,
  target: Target,
  moon: Moon,
  heart: Heart,
  dog: Dog,
  droplet: Droplet,
  bike: Bike,
  footprints: Footprints,
  // สำรองสำหรับ map ข้อมูลเก่า (ไม่แสดงในตัวเลือก)
  'flower-2': Flower2,
  trophy: Trophy,
  briefcase: Briefcase,
  'file-text': FileText,
  'folder-open': FolderOpen,
  'chef-hat': ChefHat,
  bed: Bed,
  mic: Mic,
  sparkles: Sparkles,
  leaf: Leaf,
  'heart-handshake': HeartHandshake,
  timer: Timer,
} as const satisfies Record<string, LucideIcon>;

export type ActivityIconName = keyof typeof ICON_MAP;

/** ตัวเลือกสัญลักษณ์ในฟอร์มกิจกรรม (24 ตัว — 12 ตัวแรกตรงกับดีไซน์ Figma) */
export const ACTIVITY_ICONS: ActivityIconName[] = [
  'book-open',
  'dumbbell',
  'brain',
  'code',
  'guitar',
  'palette',
  'pen-line',
  'headphones',
  'sprout',
  'coffee',
  'party-popper',
  'ellipsis',
  'book',
  'laptop',
  'music',
  'camera',
  'gamepad-2',
  'target',
  'moon',
  'heart',
  'dog',
  'droplet',
  'bike',
  'footprints',
];

/** แปลงค่า emoji เก่าที่เคยบันทึกในฐานข้อมูล → ชื่อไอคอน lucide ที่ใกล้เคียงที่สุด */
const EMOJI_TO_ICON: Record<string, ActivityIconName> = {
  '📚': 'book-open',
  '📖': 'book',
  '✏️': 'pen-line',
  '🧠': 'brain',
  '💻': 'laptop',
  '🎓': 'book-open',
  '💪': 'dumbbell',
  '🏃': 'footprints',
  '🚴': 'bike',
  '🏋️': 'dumbbell',
  '🧘': 'flower-2',
  '⚽': 'trophy',
  '💼': 'briefcase',
  '📈': 'target',
  '🛠️': 'code',
  '🎯': 'target',
  '📝': 'file-text',
  '🗂️': 'folder-open',
  '🎨': 'palette',
  '🎸': 'guitar',
  '🎮': 'gamepad-2',
  '📷': 'camera',
  '🍳': 'chef-hat',
  '🌱': 'leaf',
  '🌙': 'moon',
  '😴': 'bed',
  '☕': 'coffee',
  '🚶': 'footprints',
  '🧺': 'ellipsis',
  '🧹': 'ellipsis',
  '🙏': 'heart-handshake',
  '❤️': 'heart',
  '🐶': 'dog',
  '🎧': 'headphones',
  '🗣️': 'mic',
  '💧': 'droplet',
  '✨': 'sparkles',
  '🪴': 'sprout',
  '🎉': 'party-popper',
  '⋯': 'ellipsis',
};

/**
 * คืนคอมโพเนนต์ไอคอนจากค่าที่เก็บในฐานข้อมูล
 * รองรับทั้งชื่อไอคอนใหม่และ emoji เก่า — ไม่รู้จักค่าไหนคืน Timer เป็นค่าเริ่มต้น
 */
export function resolveActivityIcon(value: string | null | undefined): LucideIcon {
  if (!value) return Timer;
  if (value in ICON_MAP) return ICON_MAP[value as ActivityIconName];
  const mapped = EMOJI_TO_ICON[value];
  return mapped ? ICON_MAP[mapped] : Timer;
}

/**
 * ข้อความ UI ทั้งหมดของแอป (ภาษาไทยเป็นหลัก ตามเอกสาร SRS ข้อ 2.2
 * "ออกแบบมาสำหรับผู้ใช้คนไทยโดยเฉพาะ")
 * รวมไว้ที่เดียวเพื่อให้แก้ไข/เพิ่มภาษาได้ง่ายในอนาคต
 */
export const STR = {
  appName: 'HabitTime',
  tagline: 'สร้างวินัย จัดการเวลา ของคุณ',

  tabs: {
    dashboard: 'หน้าแรก',
    activities: 'กิจกรรม',
    history: 'ประวัติ',
    stats: 'สถิติ',
    profile: 'โปรไฟล์',
  },

  landing: {
    tagline: 'สร้างวินัย จัดการเวลาของคุณ',
    features: [{ label: 'ตั้งเป้า' }, { label: 'จับเวลา' }, { label: 'ดูสถิติ' }],
    start: 'เริ่มต้นใช้งาน',
    haveAccount: 'ฉันมีบัญชีอยู่แล้ว',
  },

  login: {
    welcomeBack: 'ยินดีต้อนรับกลับ',
    tabLogin: 'เข้าสู่ระบบ',
    tabRegister: 'สมัครสมาชิก',
    email: 'อีเมล',
    emailPlaceholder: 'you@example.com',
    password: 'รหัสผ่าน',
    passwordPlaceholder: 'รหัสผ่านของคุณ',
    forgot: 'ลืมรหัสผ่าน?',
    submit: 'เข้าสู่ระบบ',
    submitRegister: 'สมัครสมาชิก',
  },

  profile: {
    title: 'โปรไฟล์',
    streak: 'ทำต่อเนื่อง',
    days: 'วัน',
    totalTime: 'เวลารวม',
    times: 'ครั้ง',
    activities: 'กิจกรรม',
    editProfile: 'แก้ไขข้อมูลส่วนตัว',
    dailyGoal: 'เป้าหมายรายวัน',
    notifications: 'การแจ้งเตือน',
    settings: 'ตั้งค่าทั่วไป',
    logout: 'ออกจากระบบ',
    logoutTitle: 'ออกจากระบบ?',
    logoutMessage: 'คุณจะกลับไปยังหน้าเริ่มต้นใช้งาน',
  },

  onboarding: {
    slides: [
      {
        emoji: '⏱️',
        title: 'จับเวลากิจกรรมของคุณ',
        body: 'สร้างกิจกรรม เลือกหมวดหมู่ อิโมจิ และสี แล้วเริ่มจับเวลาได้ทันที ทั้งเรียน ออกกำลังกาย อ่านหนังสือ หรือทำงาน',
      },
      {
        emoji: '📊',
        title: 'เห็นพฤติกรรมการใช้เวลา',
        body: 'ดูประวัติย้อนหลัง สถิติรายวัน รายสัปดาห์ รายเดือน และกิจกรรมที่ใช้เวลามากที่สุด เพื่อปรับปรุงวินัยของตัวเอง',
      },
      {
        emoji: '🔒',
        title: 'ข้อมูลอยู่ที่คุณ 100%',
        body: 'ข้อมูลทั้งหมดถูกเก็บและเข้ารหัสไว้ในเครื่องของคุณเท่านั้น ไม่มีบัญชีผู้ใช้ ไม่มีเซิร์ฟเวอร์ ไม่มีการส่งข้อมูลออกไปไหน',
      },
    ],
    start: 'เริ่มต้นใช้งาน',
    next: 'ถัดไป',
  },

  dashboard: {
    greetingMorning: 'สวัสดีตอนเช้า',
    greetingAfternoon: 'สวัสดีตอนบ่าย',
    greetingEvening: 'สวัสดีตอนเย็น',
    guestName: 'เพื่อน',
    todayTotal: 'เวลารวมวันนี้',
    goalProgress: (pct: number, goalHours: number) => `${pct}% ของเป้าหมาย ${goalHours} ชม.`,
    streak: 'ทำต่อเนื่อง',
    streakValue: (days: number) => `${days} วัน`,
    activitiesToday: 'กิจกรรมวันนี้',
    sessionsToday: 'ครั้งที่บันทึกวันนี้',
    weekTotal: 'รวมสัปดาห์นี้',
    myActivities: 'กิจกรรมของคุณ',
    seeAll: 'ดูทั้งหมด',
    empty: 'ยังไม่มีกิจกรรม แตะปุ่ม + เพื่อสร้างกิจกรรมแรกของคุณ',
    calendar: 'ปฏิทินกิจกรรม',
  },

  activities: {
    title: 'จัดการกิจกรรม',
    searchPlaceholder: 'ค้นหากิจกรรม...',
    allCategories: 'ทั้งหมด',
    add: 'เพิ่มกิจกรรม',
    empty: 'ไม่พบกิจกรรม',
    totalTime: 'เวลาสะสม',
  },

  form: {
    newTitle: 'เพิ่มกิจกรรม',
    editTitle: 'แก้ไขกิจกรรม',
    name: 'ชื่อกิจกรรม',
    namePlaceholder: 'เช่น อ่านหนังสือสอบ, วิ่งตอนเช้า',
    category: 'หมวดหมู่',
    emoji: 'สัญลักษณ์',
    color: 'สี',
    save: 'บันทึกกิจกรรม',
    saveEdit: 'บันทึกการแก้ไข',
    nameRequired: 'กรุณาใส่ชื่อกิจกรรม',
  },

  detail: {
    totalTime: 'เวลาสะสมทั้งหมด',
    sessionCount: 'จำนวนครั้งที่จับเวลา',
    recentSessions: 'ประวัติล่าสุด',
    startTimer: 'เริ่มจับเวลา',
    edit: 'แก้ไข',
    delete: 'ลบกิจกรรม',
    deleteTitle: 'ยืนยันการลบ',
    deleteMessage: 'ต้องการลบกิจกรรมนี้ใช่ไหม? ประวัติการจับเวลาทั้งหมดของกิจกรรมนี้จะถูกลบไปด้วย',
    deleteConfirmMessage: 'คุณแน่ใจหรือไม่ที่จะลบกิจกรรม',
    deleteConfirm: 'ลบ',
    cancel: 'ยกเลิก',
  },

  timer: {
    start: 'เริ่ม',
    pause: 'พัก',
    resume: 'จับต่อ',
    stopLabel: 'หยุด',
    saveLabel: 'บันทึก',
    stopSave: 'สิ้นสุดและบันทึกเวลา',
    discard: 'ทิ้งการจับเวลา',
    discardTitle: 'ทิ้งการจับเวลานี้?',
    discardMessage: 'เวลาที่จับไว้จะไม่ถูกบันทึก',
    saved: 'บันทึกเวลาเรียบร้อย',
    tooShort: 'จับเวลาสั้นเกินไป ยังไม่ถูกบันทึก',
    running: 'กำลังจับเวลา',
    paused: 'พักอยู่',
  },

  history: {
    title: 'ประวัติการจับเวลา',
    searchPlaceholder: 'ค้นหาจากชื่อกิจกรรม...',
    empty: 'ยังไม่มีประวัติในช่วงที่เลือก',
    ranges: {
      week: '7 วัน',
      month: '30 วัน',
      all: 'ทั้งหมด',
    },
  },

  stats: {
    title: 'สถิติ',
    sessionsCount: 'ครั้งที่บันทึก',
    daily: 'วันนี้',
    weekly: 'สัปดาห์นี้',
    monthly: 'เดือนนี้',
    periodDay: 'วัน',
    periodWeek: 'สัปดาห์',
    periodMonth: 'เดือน',
    totalDay: 'เวลารวมวันนี้',
    totalWeek: 'เวลารวมสัปดาห์นี้',
    totalMonth: 'เวลารวมเดือนนี้',
    total: 'เวลารวม',
    topActivity: 'กิจกรรมที่ใช้เวลามากที่สุด',
    mostUsed: 'ใช้เวลามากที่สุด',
    byActivity: 'แยกตามกิจกรรม',
    last7days: 'ย้อนหลัง 7 วัน',
    noData: 'ยังไม่มีข้อมูลในช่วงนี้ เริ่มจับเวลากิจกรรมแรกของคุณเลย',
  },

  settings: {
    title: 'ตั้งค่า',
    theme: 'ธีม',
    themeLight: 'สว่าง',
    themeDark: 'มืด',
    themeSystem: 'อัตโนมัติ',
    reminder: 'เตือนให้จับเวลาทุกวัน',
    reminderTime: 'เวลาแจ้งเตือน',
    reminderBody: 'ได้เวลาสร้างวินัยแล้ว มาจับเวลากิจกรรมของวันนี้กัน',
    privacyTitle: 'ความเป็นส่วนตัว',
    privacyBody:
      'HabitTime เก็บข้อมูลทั้งหมดไว้ในฐานข้อมูลบนเครื่องของคุณเท่านั้น (Offline 100%) ชื่อกิจกรรมและโน้ตถูกเข้ารหัสด้วย AES-256-GCM โดยกุญแจถูกเก็บใน Android Keystore ไม่มีการส่งข้อมูลใด ๆ ออกนอกเครื่อง',
    dataTitle: 'ข้อมูลของฉัน',
    activitiesCount: 'กิจกรรม',
    sessionsCount: 'บันทึกเวลา',
    wipe: 'ลบข้อมูลทั้งหมด',
    wipeTitle: 'ลบข้อมูลทั้งหมด?',
    wipeMessage: 'กิจกรรมและประวัติทั้งหมดจะหายถาวร ไม่สามารถกู้คืนได้',
    wipeConfirm: 'ลบทั้งหมด',
    permissionDenied: 'ไม่ได้รับสิทธิ์แจ้งเตือน กรุณาเปิดในตั้งค่าของระบบ',
  },

  common: {
    minutesShort: 'นาที',
    hoursShort: 'ชม.',
    secondsShort: 'วิ',
    today: 'วันนี้',
    yesterday: 'เมื่อวาน',
  },
} as const;

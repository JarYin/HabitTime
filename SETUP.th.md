# HabitTime — เอกสารโครงสร้างโปรเจกต์และการเซ็ตอัพ

> 🇬🇧 English version: **[SETUP.md](./SETUP.md)**

แอปสร้างวินัยและติดตามเวลากิจกรรม (Activity Time Tracker) — โปรเจกต์จบ
ออกแบบตามเอกสาร SRS `App HabitTime 1.0.pdf` และ `App HabitTime 2.0.pdf` (โฟลเดอร์ `uploads/`)

---

## 1. การตีความเอกสาร SRS → สถาปัตยกรรมแอป

จากการวิเคราะห์ PDF ทั้งสองไฟล์:

- **HabitTime ไม่ใช่ habit tracker แบบติ๊กเช็คอิน** แต่เป็นแอป **จับเวลากิจกรรม**:
  สร้างกิจกรรม (ชื่อ + หมวดหมู่ + อิโมจิ + สี) → จับเวลาแบบ stopwatch (เริ่ม/พัก/สิ้นสุดและบันทึก)
  → ดูประวัติ (ค้นหา, กรองหมวดหมู่, กรองช่วงวันที่) → สถิติ (รายวัน/สัปดาห์/เดือน + กิจกรรมที่ใช้เวลามากที่สุด)
- เอกสารระบุ **Cloud database + ระบบสมาชิก (Guest/User/Admin)** แต่ข้อกำหนดของโปรเจกต์นี้คือ
  **Local 100% เพื่อความเป็นส่วนตัวสูงสุด** จึงตัดสินใจ:
  - ❌ ตัด: สมัครสมาชิก / ล็อกอิน / Admin / Cloud sync
  - ✅ แทนที่ด้วย: หน้า Onboarding (ตาม "Welcome Page" ในเอกสาร) + ข้อมูลทุกอย่างอยู่ใน SQLite บนเครื่อง + เข้ารหัสฟิลด์ที่เป็นข้อมูลส่วนตัว
- เอกสารไม่มี mockup หน้าจอ/สี — โทน **ธีมมืด + ชมพู** ตีความจากสีในไดอะแกรม UML ของเอกสาร 2.0
- ส่วนขยายที่เพิ่มนอกเหนือเอกสาร (ระบุชัดใน comment): **แจ้งเตือนรายวันแบบ local** (ช่วยเรื่อง "สร้างวินัย")

## 2. Tech Stack

| ส่วน | เทคโนโลยี | เหตุผล |
| --- | --- | --- |
| Core | **Expo SDK 57** (React Native 0.86, React 19.2) + **Expo Prebuild** | ได้ native project (`android/`) เต็มรูปแบบ รองรับ native module ของ WatermelonDB |
| ภาษา | **TypeScript** (strict + experimentalDecorators) | type-safe schema/model |
| ฐานข้อมูล | **WatermelonDB 0.28** (SQLite, JSI adapter) | local-first, reactive query, เร็ว |
| Config plugin | `@morrowdigital/watermelondb-expo-plugin` + `expo-build-properties` | ผูก native code ให้อัตโนมัติตอน prebuild |
| เข้ารหัส | **AES-256-GCM ระดับฟิลด์** (`@noble/ciphers`) + กุญแจใน **Android Keystore** (`expo-secure-store`) + `expo-crypto` (CSPRNG) | ดูเหตุผลข้อ 5 |
| State | **Zustand 5** | เบา ไม่มี boilerplate ใช้กับสถานะ stopwatch |
| UI | **NativeWind 4.2** + **tailwindcss 3.4** (ห้ามอัป v4!) | เขียน UI เร็วด้วย className |
| แจ้งเตือน | **expo-notifications** | ตั้งเวลาบนเครื่องผ่าน AlarmManager — ไม่มี push server |

## 3. โครงสร้างโปรเจกต์ (Separation of Concerns)

```
HabitTime/
├── app.json                  # Expo config + plugins (watermelondb, build-properties)
├── babel.config.js           # nativewind preset + decorators (WatermelonDB)
├── metro.config.js           # withNativeWind (input: src/global.css)
├── tailwind.config.js        # ธีมสี (พื้นมืด + ชมพู) — ผ่าน dataviz validator
├── android/                  # native project จาก `expo prebuild` (อย่าแก้มือถ้าไม่จำเป็น)
└── src/
    ├── app/                  # 🖥️ UI LAYER — หน้าจอ (expo-router, file-based)
    │   ├── _layout.tsx       #   init: โหลดกุญแจ → seed → notifications + onboarding gate
    │   ├── onboarding.tsx    #   หน้าต้อนรับ 3 สไลด์ (แทน Welcome Page ของ SRS)
    │   ├── (tabs)/           #   4 แท็บ: หน้าแรก / กิจกรรม / ประวัติ / สถิติ
    │   │   ├── index.tsx     #   Dashboard: สรุปวันนี้ + กราฟ 7 วัน + กิจกรรม
    │   │   ├── activities.tsx#   จัดการกิจกรรม: ค้นหา + กรองหมวดหมู่ + เวลาสะสม
    │   │   ├── history.tsx   #   ประวัติ: กรองช่วงวัน/หมวดหมู่/ค้นหา จัดกลุ่มรายวัน
    │   │   └── stats.tsx     #   สถิติ: วัน/สัปดาห์/เดือน + top activity + bar list
    │   ├── activity/
    │   │   ├── new.tsx       #   เพิ่มกิจกรรม (ชื่อ→หมวดหมู่→อิโมจิ→สี→บันทึก)
    │   │   └── [id]/
    │   │       ├── index.tsx #   รายละเอียด + เวลาสะสม + ลบ(ยืนยัน)
    │   │       └── edit.tsx  #   แก้ไขกิจกรรม
    │   ├── timer/[id].tsx    #   stopwatch: เริ่ม/พัก/จับต่อ/สิ้นสุดและบันทึก
    │   └── settings.tsx      #   แจ้งเตือนรายวัน + ความเป็นส่วนตัว + ลบข้อมูล
    ├── components/           # 🧩 UI components ใช้ซ้ำ (ActivityCard, WeekBars, ...)
    ├── database/             # 💾 DATA LAYER — WatermelonDB
    │   ├── schema.ts         #   ตาราง + คอลัมน์ (version 1)
    │   ├── migrations.ts     #   schema migrations (เพิ่มเมื่อ schema เปลี่ยน)
    │   ├── models/           #   Activity, TimeSession, Category (decorators)
    │   ├── index.ts          #   SQLiteAdapter (jsi) + Database instance
    │   └── seed.ts           #   seed หมวดหมู่เริ่มต้น 7 หมวด
    ├── services/             # ⚙️ LOGIC LAYER — business logic (หน้าจอห้าม query ตรง)
    │   ├── activityService.ts#   CRUD กิจกรรม + ค้นหาชื่อใน memory
    │   ├── sessionService.ts #   บันทึกเซสชัน + query ประวัติตามตัวกรอง
    │   ├── statsService.ts   #   pure functions รวมสถิติ (reactive + ทดสอบง่าย)
    │   ├── categoryService.ts#   query หมวดหมู่
    │   ├── notificationService.ts # แจ้งเตือนรายวัน local
    │   └── settingsService.ts#   key-value settings (database.localStorage)
    ├── stores/               # 🔄 STATE — zustand (timerStore, appStore)
    ├── hooks/                # useQueryList / useQueryCount / useRecord (observe DB)
    ├── lib/
    │   ├── dates.ts          #   day key, สัปดาห์เริ่มวันจันทร์, format ไทย
    │   └── crypto/           # 🔐 fieldCipher (AES-GCM) + keyManager (Keystore)
    └── constants/            # strings.ts (ข้อความไทยรวมศูนย์), palette.ts (สี/อิโมจิ)
```

กติกาการพึ่งพา (dependency rule): `app → components/hooks/stores → services → database/lib`
หน้าจอไม่แตะ `database` ตรง ๆ ยกเว้นส่ง query จาก services เข้า hook observe

## 4. Database Schema (อ้างอิง use cases จาก @uploads)

```
categories (หมวดหมู่ — seed 7 หมวดตอนเปิดครั้งแรก)
├── id            string  (PK, สร้างอัตโนมัติ)
├── name          string      "การเรียน", "ออกกำลังกาย", ...
├── emoji         string      "📚"
├── color         string      "#38BDF8"
├── is_default    boolean
├── sort_order    number
└── created_at / updated_at   number (epoch ms)

activities (กิจกรรม — use case "เพิ่มกิจกรรม": ชื่อ+หมวดหมู่+อิโมจิ+สี)
├── id            string  (PK)
├── name_enc      string  🔐 ชื่อกิจกรรม เข้ารหัส AES-256-GCM
├── category_id   string  (FK → categories, indexed)
├── emoji         string
├── color         string
├── is_archived   boolean
└── created_at / updated_at

time_sessions (บันทึกจับเวลา 1 ครั้ง — "สิ้นสุดและบันทึกเวลา")
├── id            string  (PK)
├── activity_id   string  (FK → activities, indexed)
├── started_at    number  (epoch ms)
├── ended_at      number  (epoch ms) = "วันที่ทำกิจกรรม"
├── duration_sec  number  (หักช่วงกดพักแล้ว)
├── day_key       string  "YYYY-MM-DD" (indexed — กรองช่วงวัน/ปฏิทิน/สถิติ)
├── note_enc      string? 🔐 โน้ต (เข้ารหัส, optional)
└── created_at / updated_at

ความสัมพันธ์:  Category 1 ── * Activity 1 ── * TimeSession
```

ค่าที่คำนวณ (ไม่เก็บในตาราง — คำนวณจาก sessions เสมอ เพื่อไม่ให้ข้อมูลขัดกัน):
เวลาสะสมต่อกิจกรรม, สถิติราย วัน/สัปดาห์/เดือน, กิจกรรมที่ใช้เวลามากที่สุด

## 5. การเข้ารหัส (ทำไมเป็น field-level ไม่ใช่ SQLCipher)

**สถานะจริงของ WatermelonDB (ตรวจสอบ มิ.ย. 2026):** ยังไม่รองรับ SQLCipher อย่างเป็นทางการ —
PR [#907](https://github.com/Nozbe/WatermelonDB/pull/907) และ [#1635](https://github.com/Nozbe/WatermelonDB/pull/1635)
ค้างหลายปีและผู้เขียนถอนตัวแล้ว ทางเลือกที่ใช้งานได้จริงบน Expo คือ:

```
เปิดแอป → keyManager.initEncryption()
           ├─ มีกุญแจใน SecureStore?  → โหลดเข้า memory
           └─ ไม่มี (ครั้งแรก)        → สุ่ม 32 ไบต์ (expo-crypto CSPRNG)
                                        → เก็บใน SecureStore (Android Keystore)
เขียนข้อมูล → activity.setName("อ่านหนังสือ")
              → name_enc = "v1:<nonce 12B hex>:<AES-256-GCM ciphertext+tag hex>"
อ่านข้อมูล  → activity.name (getter) → ถอดรหัสใน memory
```

- ฟิลด์ที่เข้ารหัส: `activities.name_enc`, `time_sessions.note_enc` (ข้อมูลที่ผู้ใช้พิมพ์เอง)
- ฟิลด์ plaintext: id, FK, ตัวเลขเวลา, `day_key` — จำเป็นสำหรับ `WHERE`/index/สถิติ
- ผลข้างเคียง: **ค้นหาชื่อทำใน memory** (`filterActivitiesByName`) — ไม่มีปัญหาเพราะข้อมูลผู้ใช้เดียว
- แนวป้องกันเสริมของ Android เอง: File-Based Encryption เข้ารหัส storage ทั้งเครื่องตั้งแต่ Android 10
- ถ้าอนาคตต้องการเข้ารหัสทั้งไฟล์จริง ๆ: ทางที่ workable คือย้าย storage layer ไป
  `@op-engineering/op-sqlite` (มี SQLCipher option) — ไม่ใช่ patch WatermelonDB

## 6. ขั้นตอน Initialize โปรเจกต์ (ที่ทำไปแล้ว — ทำซ้ำได้ตามนี้)

```bash
# 1) สร้างโปรเจกต์ (Expo SDK 57 + expo-router + TypeScript)
npx create-expo-app@latest HabitTime

# 2) ฐานข้อมูล + state + notifications + crypto
npx expo install expo-secure-store expo-crypto expo-notifications expo-build-properties expo-dev-client
npm install @nozbe/watermelondb zustand @noble/ciphers
npm install @morrowdigital/watermelondb-expo-plugin
npm install -D @babel/plugin-proposal-decorators@^7.29.7   # ต้อง v7 (Babel 7)

# 3) UI
npx expo install nativewind @expo/vector-icons
npm install -D tailwindcss@^3.4.17    # ⚠️ NativeWind 4 ไม่รองรับ tailwind v4

# 4) config ที่แก้: app.json (plugins + android.package), babel.config.js,
#    metro.config.js, tailwind.config.js, tsconfig.json (experimentalDecorators),
#    src/global.css (@tailwind directives), nativewind-env.d.ts

# 5) สร้าง native project
npx expo prebuild --platform android
```

## 7. การ build ลงเครื่อง/emulator

เครื่องที่ใช้พัฒนาต้องมี **JDK และ Android SDK** ก่อน:

1. ติดตั้ง **Android Studio** (มาพร้อม Android SDK + emulator): <https://developer.android.com/studio>
2. ติดตั้ง **JDK 17 หรือ 21** (Temurin: <https://adoptium.net>, หรือใช้ JBR ที่มากับ Android Studio ที่
   `<Android Studio install dir>/jbr`) แล้วตั้ง `JAVA_HOME` — **อย่าใช้ JDK ที่ใหม่กว่านี้** (เช่น JDK 24/25)
   เพราะ Android Gradle Plugin/native build (CMake) ยังไม่รองรับ
3. ตั้ง env var `ANDROID_HOME = %LOCALAPPDATA%\Android\Sdk`

> ### ⚠️ ต้อง build จาก path ที่ไม่มีอักขระนอก ASCII หรือช่องว่าง
> ตัวอย่าง path ที่ **มีปัญหา**: `C:\Users\me\My Projects\โปรเจกต์จบ\HabitTime`
> ตัวอย่าง path ที่ **ใช้ได้**: `C:\projects\HabitTime`
>
> path ที่มีภาษาอื่นนอก ASCII หรือช่องว่างทำให้ CMake/Ninja ของ Android native build
> ล้มเหลวบน Windows (ปัญหาที่รู้จักกันดีของ RN/Expo) — เขียนโค้ด/`tsc`/`prebuild` ทำที่ path ไหนก็ได้
> แต่ `run:android` ควรทำหลังย้ายไป path ที่ปลอดภัยแล้วเท่านั้น

```bash
cd C:\projects\HabitTime
npx expo run:android        # build + ติดตั้ง dev client + เปิดแอป
# ครั้งถัดไปแก้เฉพาะ JS/TS: npx expo start --dev-client
```

**Expo Go ใช้ไม่ได้** (WatermelonDB เป็น native module) — ต้องเป็น dev client จาก `run:android`
หรือ EAS Build (`eas build --profile development --platform android`) ถ้าไม่อยากติดตั้ง Android Studio

## 8. การแจกจ่ายแอปให้ผู้ใช้ทั่วไป (ไม่ผ่าน Play Store)

ใช้ **EAS Build** แบบ internal distribution — ได้ไฟล์ `.apk` พร้อมลิงก์/QR code ให้โหลดตรง:

```bash
npx eas-cli login                                    # ล็อกอิน/สมัครบัญชี Expo (ฟรี)
npx eas-cli build --profile preview --platform android
```

- config อยู่ใน `eas.json` → profile `preview` ตั้ง `distribution: internal` + `buildType: apk`
- build เสร็จจะได้ลิงก์หน้า `expo.dev` ที่มี QR code — ส่งให้ใครก็ได้ เปิดบนมือถือ Android แล้วกด Install
- ไฟล์ `.apk` ไม่หมดอายุ ไม่ต้องผ่านการรีวิวของ Play Store แต่ Android จะเตือน "ไม่รู้จักผู้พัฒนา"
  (ปกติสำหรับแอปนอก Store) ผู้ใช้ต้องกดอนุญาต "install from unknown sources" ครั้งแรก
- **สำคัญ:** ตรวจสอบแล้วว่า build นี้เป็น release build จริง (ฝัง JS bundle มาในตัว ไม่ใช่ dev-client
  ที่ต้องพึ่ง Metro ของผู้พัฒนา) — ใช้งานได้แบบ standalone 100%

## 9. สิ่งที่ควรระวัง / Next Steps

- **อย่าอัป tailwindcss เป็น v4** จนกว่า NativeWind v5 จะ stable
- แก้ schema → เพิ่ม `version` ใน `schema.ts` + เขียน migration ใน `migrations.ts` เสมอ
- WatermelonDB 0.28 + SDK 57 เป็นการจับคู่ที่ใหม่กว่าที่ plugin ทดสอบ (SDK 54) —
  ถ้า JSI adapter มีปัญหาตอนรัน ให้ fallback: `jsi: false` ใน `src/database/index.ts`
  และ `["@morrowdigital/watermelondb-expo-plugin", { "disableJsi": true }]` ใน app.json
- WatermelonDB decorated model fields (`@text`, `@field`, ...) ต้องประกาศแบบธรรมดา
  (ไม่ใช้ `!` หรือ `declare`) เพราะชนกับ legacy decorators ของ Babel — ปิด
  `strictPropertyInitialization` ใน `tsconfig.json` แทน
- ไอเดียต่อยอด: export/backup ข้อมูลเป็นไฟล์ (ยังอยู่บนเครื่อง), streak/เป้าหมายรายวัน,
  ปฏิทินเต็มหน้า, Home-screen widget, ล็อกแอปด้วย biometric (expo-local-authentication),
  รองรับ iOS (ต้องมี Apple Developer Program เพื่อแจกผ่าน TestFlight)

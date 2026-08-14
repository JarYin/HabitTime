# การตั้งค่า Firebase สำหรับ HabitTime

เอกสารนี้อธิบายสิ่งที่ต้องทำใน **Firebase Console** (ฝั่งโค้ดทำเสร็จแล้วทั้งหมด)

---

## 1. ใส่ค่า config ลงไฟล์ `.env`

เปิด Firebase Console → **Project settings** (ไอคอนเฟือง) → แท็บ **General**
→ เลื่อนลงไปที่ **Your apps**

ถ้ายังไม่มีแอป ให้กด **Add app** → เลือกไอคอน **Web** (`</>`) → ตั้งชื่ออะไรก็ได้
→ ไม่ต้องติ๊ก Firebase Hosting → Register app

จะได้ก้อน config หน้าตาแบบนี้ ให้คัดลอกค่าไปใส่ในไฟล์ `.env` ที่ราก project

```js
const firebaseConfig = {
  apiKey: "AIza...",                          // → EXPO_PUBLIC_FIREBASE_API_KEY
  authDomain: "xxx.firebaseapp.com",          // → EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "xxx",                           // → EXPO_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "xxx.firebasestorage.app",   // → EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789",             // → EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123:web:abc"                      // → EXPO_PUBLIC_FIREBASE_APP_ID
};
```

> ค่าเหล่านี้ไม่ใช่ความลับ (ฝังอยู่ในตัวแอปที่แจกอยู่แล้ว) ความปลอดภัยจริงอยู่ที่
> Security Rules ในขั้นที่ 3 — แต่ `.env` ถูก gitignore ไว้ จึงไม่ถูก commit

**แก้ `.env` แล้วต้องรีสตาร์ท Metro ด้วย `npx expo start -c` เสมอ** (ค่าถูกฝังตอน build bundle)

---

## 2. เปิดการล็อกอินด้วยอีเมล/รหัสผ่าน

Console → **Authentication** → **Get started** (ถ้ายังไม่เคยเปิด)
→ แท็บ **Sign-in method** → **Email/Password** → เปิดสวิตช์ **Enable** อันบนสุด
→ **Save**

(อันล่าง "Email link (passwordless sign-in)" ไม่ต้องเปิด)

ถ้าลืมขั้นนี้ ตอนสมัครสมาชิกจะขึ้นข้อความว่า
_"ยังไม่ได้เปิดวิธีล็อกอินแบบอีเมล/รหัสผ่านใน Firebase Console"_

---

## 3. วาง Security Rules

Console → **Firestore Database** → แท็บ **Rules**
→ ลบของเดิมทิ้ง แล้ววางเนื้อหาทั้งไฟล์ [firestore.rules](firestore.rules)
→ กด **Publish**

ขั้นนี้**สำคัญที่สุด** เพราะข้อมูลบนคลาวด์เก็บเป็น plaintext กฎชุดนี้คือสิ่งเดียวที่กัน
ไม่ให้คนอื่นอ่านข้อมูลของผู้ใช้ หลักการคือ "แตะได้เฉพาะเอกสารใต้ `users/{uid ของตัวเอง}`"

> ถ้าตอนสร้าง database เลือก **test mode** ไว้ กฎเริ่มต้นจะเปิดให้ใครก็อ่าน/เขียนได้
> และจะหมดอายุใน 30 วัน — ต้องเปลี่ยนเป็นกฎชุดนี้

ไม่ต้องสร้าง index เพิ่ม — query ที่แอปใช้ (`where('syncedAt', '>', ...)`) เป็น
single-field ซึ่ง Firestore สร้าง index ให้อัตโนมัติอยู่แล้ว

---

## 4. ทดสอบ

```bash
npx expo start -c
```

1. สมัครสมาชิกด้วยอีเมล/รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
2. สร้างกิจกรรม แล้วจับเวลาสัก 1 ครั้ง
3. รอ ~5 วินาที แล้วดูใน Console → **Firestore Database** จะเห็น
   `users/{uid}/activities/...` และ `users/{uid}/time_sessions/...`
4. หน้า **ตั้งค่า** จะมีการ์ด "ซิงก์ข้อมูลกับคลาวด์" บอกเวลาซิงก์ล่าสุด และกดซิงก์เองได้

---

## โครงสร้างข้อมูลบน Firestore

```
users/{uid}                        ← โปรไฟล์ (email, createdAt, syncClock)
  ├── categories/{id}              ← name, emoji, color, isDefault, sortOrder, ...
  ├── activities/{id}              ← name, categoryId, emoji, color, isArchived, ...
  └── time_sessions/{id}           ← activityId, startedAt, endedAt, durationSec, dayKey, note, ...
```

ทุกเอกสารมีฟิลด์เพิ่มอีก 2 ตัวที่ระบบซิงก์ใช้ทำงาน:

| ฟิลด์      | ความหมาย                                                              |
| ---------- | --------------------------------------------------------------------- |
| `syncedAt` | เวลาที่เซิร์ฟเวอร์เขียนเอกสารนี้ ใช้หาว่ามีอะไรเปลี่ยนตั้งแต่ซิงก์ครั้งก่อน |
| `deleted`  | `true` = ถูกลบแล้ว (soft delete) เพื่อให้เครื่องอื่นรู้ว่าต้องลบตาม        |

**อย่าลบฟิลด์สองตัวนี้ทิ้งเองใน Console** — ระบบซิงก์จะมองไม่เห็นการเปลี่ยนแปลง

---

## หลักการทำงานโดยย่อ

แอปเป็น **local-first**: ทุกหน้าจออ่าน/เขียน WatermelonDB ในเครื่องเหมือนเดิม
ใช้งานออฟไลน์ได้ครบทุกฟีเจอร์ ส่วน Firestore เป็นสำเนาสำรอง/ตัวกลางข้ามเครื่อง
ถ้าซิงก์ล้มเหลว (เน็ตหลุด กฎผิด) แอปยังทำงานได้ปกติ แค่ขึ้นสถานะเตือนในหน้าตั้งค่า

ระบบจะซิงก์ให้อัตโนมัติเมื่อ:

1. ล็อกอินสำเร็จ
2. แก้ข้อมูลในเครื่องแล้วนิ่งครบ 4 วินาที
3. สลับกลับเข้าแอป
4. กดปุ่ม "ซิงก์ตอนนี้" ในหน้าตั้งค่า

โค้ดที่เกี่ยวข้อง:

| ไฟล์                                                       | หน้าที่                                        |
| ---------------------------------------------------------- | ---------------------------------------------- |
| [src/lib/firebase/config.ts](src/lib/firebase/config.ts)   | ต่อ Firebase + บังคับ long-polling ให้ Firestore |
| [src/lib/firebase/auth.ts](src/lib/firebase/auth.ts)       | Auth + จำ session ข้ามการปิดแอป (ฝั่ง native)   |
| [src/lib/firebase/syncBackend.ts](src/lib/firebase/syncBackend.ts) | แปลงข้อมูลสองทาง WatermelonDB ↔ Firestore |
| [src/services/authService.ts](src/services/authService.ts) | สมัคร / เข้าสู่ระบบ / รีเซ็ตรหัสผ่าน            |
| [src/services/syncService.ts](src/services/syncService.ts) | ตัวควบคุมว่าจะซิงก์เมื่อไหร่                    |

---

## ปัญหาที่พบบ่อย

| อาการ                                              | สาเหตุ / วิธีแก้                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------- |
| `auth/invalid-api-key`                             | `.env` ยังว่างหรือค่าผิด — ใส่ค่าแล้วรัน `npx expo start -c`          |
| ขึ้นว่ายังไม่ได้เปิดวิธีล็อกอินอีเมล                  | ยังไม่ได้ทำขั้นที่ 2                                                  |
| ซิงก์ไม่สำเร็จ: `Missing or insufficient permissions` | ยังไม่ได้ publish Security Rules (ขั้นที่ 3)                          |
| `Could not reach Cloud Firestore backend`          | โค้ดบังคับ long-polling ไว้แล้ว ถ้ายังเจอให้เช็คว่าเครื่องต่อเน็ตอยู่จริง |
| ล็อกอินแล้วแต่เปิดแอปใหม่ต้องล็อกอินอีก              | AsyncStorage หาย — ต้อง rebuild dev client (`npx expo run:android`)  |

> โปรเจกต์นี้ใช้ native module (WatermelonDB, AsyncStorage) จึงใช้กับ Expo Go ไม่ได้
> ต้องรันผ่าน development build เสมอ

# HabitTime ⏱️

แอปสร้างวินัยและติดตามเวลากิจกรรม (Habit / Activity Time Tracker) สำหรับ Android

**Local-Database 100% · Offline-First · Privacy-Focused** — ข้อมูลทั้งหมดอยู่บนเครื่องผู้ใช้เท่านั้น
ไม่มีบัญชีผู้ใช้ ไม่มีเซิร์ฟเวอร์ ไม่มีการส่งข้อมูลออกนอกเครื่อง

> 🇬🇧 English version: **[README.md](./README.md)**

> 📖 เอกสารฉบับเต็ม (โครงสร้างโปรเจกต์, Database Schema, การเข้ารหัส, วิธี build):
> ดู **[SETUP.th.md](./SETUP.th.md)**

## 📲 ติดตั้งแอป (สำหรับผู้ใช้ทั่วไป — ไม่ต้องเขียนโค้ด)

ไม่ต้องคลอนโปรเจกต์หรือ build เอง แค่ดาวน์โหลด `.apk` แล้วติดตั้งตรงบนมือถือ Android:

1. เปิดลิงก์นี้บนมือถือ Android (หรือสแกน QR code ในหน้านั้น):
   👉 **https://expo.dev/accounts/devaflow/projects/myapp/builds/bd31fa41-c4c5-4763-ad02-756435899b19**
2. กด **Install** เพื่อดาวน์โหลดไฟล์ `.apk`
3. ถ้าเป็นการติดตั้งแอปนอก Play Store ครั้งแรก Android จะขออนุญาต **"ติดตั้งแอปที่ไม่รู้จัก" (Install unknown apps)**
   → กด **อนุญาต/Allow** สำหรับเบราว์เซอร์หรือแอปที่ใช้เปิดลิงก์ แล้วกดติดตั้งอีกครั้ง
4. เปิดแอป **HabitTime** ได้เลย ไม่ต้องล็อกอิน ไม่ต้องต่อเน็ต — ข้อมูลทั้งหมดอยู่ในเครื่องเท่านั้น

> ⚠️ ไฟล์นี้ไม่ได้เซ็นชื่อผ่าน Play Store (เป็น internal build ของ Expo) — Android/Play Protect
> อาจเตือนว่า "ไม่รู้จักผู้พัฒนา" ซึ่งเป็นเรื่องปกติสำหรับแอปที่แจกนอก Store ไม่ใช่ไวรัส
> สามารถกด "ติดตั้งต่อ" ได้ตามปกติ

## Tech Stack

| ส่วน | เทคโนโลยี |
| --- | --- |
| Framework | Expo SDK 57 (React Native 0.86) + Expo Prebuild (dev client) |
| ภาษา | TypeScript (strict) |
| ฐานข้อมูล | WatermelonDB 0.28 (SQLite + JSI) — บนเครื่องเท่านั้น |
| การเข้ารหัส | AES-256-GCM ระดับฟิลด์ (@noble/ciphers) + กุญแจใน Android Keystore (expo-secure-store) |
| State | Zustand 5 |
| UI | NativeWind 4 (Tailwind CSS 3.4) ธีมมืด |
| แจ้งเตือน | expo-notifications (local ล้วน ไม่มี push server) |

## เริ่มต้นแบบเร็ว

```bash
npm install
npx expo prebuild --platform android   # สร้างโฟลเดอร์ android/ (ทำไว้ให้แล้ว)
npx expo run:android                   # ต้องมี JDK 17 + Android Studio/SDK
```

⚠️ **สำคัญ:** WatermelonDB เป็น native module — รันใน **Expo Go ไม่ได้** ต้อง build dev client
และก่อน build จริง **ย้ายโปรเจกต์ไป path ภาษาอังกฤษล้วนไม่มีช่องว่าง** (เช่น `C:\projects\HabitTime`)
(path ที่มีอักขระนอก ASCII หรือช่องว่างทำให้ CMake/Ninja ของ Android build พังบน Windows — ดูรายละเอียดใน SETUP.th.md)

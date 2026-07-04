# HabitTime ⏱️

An activity/habit time tracker app for Android.

**100% local database · Offline-first · Privacy-focused** — all data stays on the user's device.
No accounts, no server, no data ever leaves the device.

> 🇹🇭 ภาษาไทย: **[README.th.md](./README.th.md)**

> 📖 Full documentation (project structure, database schema, encryption, build steps):
> see **[SETUP.md](./SETUP.md)**

## 📲 Install the app (for regular users — no coding required)

No need to clone the repo or build anything. Just download the `.apk` and install it directly on your Android phone:

1. Open this link on your Android phone (or scan the QR code on that page):
   👉 **https://expo.dev/accounts/devaflow/projects/myapp/builds/bd31fa41-c4c5-4763-ad02-756435899b19**
2. Tap **Install** to download the `.apk` file.
3. If this is your first time installing an app outside the Play Store, Android will ask for permission to
   **"Install unknown apps"** → tap **Allow** for the browser/app you used to open the link, then install again.
4. Open the **HabitTime** app — no login, no internet connection needed. All your data stays on your device.

> ⚠️ This file isn't signed through the Play Store (it's an internal Expo build) — Android/Play Protect
> may warn that the developer is "unknown." This is normal for apps distributed outside the Store,
> not a virus. You can safely tap "Install anyway."

## Tech Stack

| Part | Technology |
| --- | --- |
| Framework | Expo SDK 57 (React Native 0.86) + Expo Prebuild (dev client) |
| Language | TypeScript (strict) |
| Database | WatermelonDB 0.28 (SQLite) — on-device only |
| Encryption | Field-level AES-256-GCM (`@noble/ciphers`) + key stored in the Android Keystore (`expo-secure-store`) |
| State | Zustand 5 |
| UI | NativeWind 4 (Tailwind CSS 3.4), dark theme |
| Notifications | expo-notifications (fully local, no push server) |

## Quick start (for developers)

```bash
npm install
npx expo prebuild --platform android   # generates the android/ folder (already done)
npx expo run:android                   # requires JDK 17+ and Android Studio/SDK
```

⚠️ **Important:** WatermelonDB is a native module — it **cannot run in Expo Go**, you must build a dev client.
Also, before building, **make sure your project path contains no spaces or non-ASCII characters**
(e.g. `C:\projects\HabitTime` works, `C:\My Projects\HabitTime` does not) — see [SETUP.md](./SETUP.md) for details.

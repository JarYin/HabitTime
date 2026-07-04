# HabitTime — Project Structure & Setup

> 🇹🇭 ภาษาไทย: **[SETUP.th.md](./SETUP.th.md)**

An activity time tracker app — final school project, designed from the SRS documents
`App HabitTime 1.0.pdf` and `App HabitTime 2.0.pdf` (`uploads/` folder).

---

## 1. Interpreting the SRS documents → app architecture

Based on analysis of both PDFs:

- **HabitTime is not a checkbox-style habit tracker** — it's an **activity time-tracking** app:
  create an activity (name + category + emoji + color) → track it with a stopwatch (start/pause/finish & save)
  → view history (search, filter by category, filter by date range) → view stats (daily/weekly/monthly + top activity by time spent)
- The SRS calls for a **cloud database + membership system (Guest/User/Admin)**, but this project's
  requirement is **100% local for maximum privacy**, so:
  - ❌ Removed: sign-up / login / Admin / cloud sync
  - ✅ Replaced with: an onboarding screen (matching the SRS's "Welcome Page") + all data in on-device SQLite
    + encryption of personally-identifying fields
- The SRS has no screen mockups/color spec — the **dark + pink theme** was interpreted from the UML diagram
  colors in document 2.0
- One addition beyond the SRS (clearly marked in comments): **local daily reminders** (supports the "build discipline" goal)

## 2. Tech Stack

| Part | Technology | Why |
| --- | --- | --- |
| Core | **Expo SDK 57** (React Native 0.86, React 19.2) + **Expo Prebuild** | Full native project (`android/`), needed for WatermelonDB's native module |
| Language | **TypeScript** (strict + experimentalDecorators) | Type-safe schema/models |
| Database | **WatermelonDB 0.28** (SQLite, JSI adapter) | Local-first, reactive queries, fast |
| Config plugin | `@morrowdigital/watermelondb-expo-plugin` + `expo-build-properties` | Wires up native code automatically during prebuild |
| Encryption | **Field-level AES-256-GCM** (`@noble/ciphers`) + key in the **Android Keystore** (`expo-secure-store`) + `expo-crypto` (CSPRNG) | See section 5 |
| State | **Zustand 5** | Lightweight, no boilerplate, used for stopwatch state |
| UI | **NativeWind 4.2** + **tailwindcss 3.4** (do not upgrade to v4!) | Fast UI authoring with className |
| Notifications | **expo-notifications** | On-device scheduling via AlarmManager — no push server |

## 3. Project Structure (Separation of Concerns)

```
HabitTime/
├── app.json                  # Expo config + plugins (watermelondb, build-properties)
├── babel.config.js           # nativewind preset + decorators (WatermelonDB)
├── metro.config.js           # withNativeWind (input: src/global.css)
├── tailwind.config.js        # color theme (dark + pink) — validated against the dataviz skill
├── android/                  # native project from `expo prebuild` (avoid editing by hand)
└── src/
    ├── app/                  # 🖥️ UI LAYER — screens (expo-router, file-based)
    │   ├── _layout.tsx       #   init: load encryption key → seed → notifications + onboarding gate
    │   ├── onboarding.tsx    #   3-slide welcome screen (replaces the SRS's Welcome Page)
    │   ├── (tabs)/           #   4 tabs: home / activities / history / stats
    │   │   ├── index.tsx     #   Dashboard: today's summary + 7-day chart + activities
    │   │   ├── activities.tsx#   Manage activities: search + category filter + total time
    │   │   ├── history.tsx   #   History: filter by date/category/search, grouped by day
    │   │   └── stats.tsx     #   Stats: day/week/month + top activity + bar list
    │   ├── activity/
    │   │   ├── new.tsx       #   Add activity (name → category → emoji → color → save)
    │   │   └── [id]/
    │   │       ├── index.tsx #   Detail view + total time + delete (with confirmation)
    │   │       └── edit.tsx  #   Edit activity
    │   ├── timer/[id].tsx    #   Stopwatch: start/pause/resume/finish & save
    │   └── settings.tsx      #   Daily reminders + privacy + delete data
    ├── components/           # 🧩 Reusable UI components (ActivityCard, WeekBars, ...)
    ├── database/             # 💾 DATA LAYER — WatermelonDB
    │   ├── schema.ts         #   Tables + columns (version 1)
    │   ├── migrations.ts     #   Schema migrations (add one whenever the schema changes)
    │   ├── models/           #   Activity, TimeSession, Category (decorators)
    │   ├── index.ts          #   SQLiteAdapter + Database instance
    │   └── seed.ts           #   Seeds 7 default categories
    ├── services/             # ⚙️ LOGIC LAYER — business logic (screens must not query the DB directly)
    │   ├── activityService.ts#   Activity CRUD + in-memory name search
    │   ├── sessionService.ts #   Save sessions + query history by filter
    │   ├── statsService.ts   #   Pure functions that aggregate stats (reactive, easy to test)
    │   ├── categoryService.ts#   Category queries
    │   ├── notificationService.ts # Local daily reminders
    │   └── settingsService.ts#   Key-value settings (database.localStorage)
    ├── stores/               # 🔄 STATE — zustand (timerStore, appStore)
    ├── hooks/                # useQueryList / useQueryCount / useRecord (observe the DB)
    ├── lib/
    │   ├── dates.ts          #   Day key, week starting Monday, Thai date formatting
    │   └── crypto/           # 🔐 fieldCipher (AES-GCM) + keyManager (Keystore)
    └── constants/            # strings.ts (centralized Thai copy), palette.ts (colors/emoji)
```

Dependency rule: `app → components/hooks/stores → services → database/lib`.
Screens never touch `database` directly, except by passing a query from a service into an observing hook.

## 4. Database Schema (mapped to use cases from the SRS)

```
categories (seeded with 7 defaults on first launch)
├── id            string  (PK, auto-generated)
├── name          string      "Study", "Exercise", ...
├── emoji         string      "📚"
├── color         string      "#38BDF8"
├── is_default    boolean
├── sort_order    number
└── created_at / updated_at   number (epoch ms)

activities (use case "add activity": name + category + emoji + color)
├── id            string  (PK)
├── name_enc      string  🔐 activity name, AES-256-GCM encrypted
├── category_id   string  (FK → categories, indexed)
├── emoji         string
├── color         string
├── is_archived   boolean
└── created_at / updated_at

time_sessions (one tracked session — "finish & save")
├── id            string  (PK)
├── activity_id   string  (FK → activities, indexed)
├── started_at    number  (epoch ms)
├── ended_at      number  (epoch ms) = "date the activity was done"
├── duration_sec  number  (with paused time subtracted)
├── day_key       string  "YYYY-MM-DD" (indexed — used for date-range/calendar/stats filtering)
├── note_enc      string? 🔐 note (encrypted, optional)
└── created_at / updated_at

Relationships:  Category 1 ── * Activity 1 ── * TimeSession
```

Computed values (not stored — always derived from sessions, to avoid data getting out of sync):
total time per activity, daily/weekly/monthly stats, top activity by time spent.

## 5. Encryption (why field-level, not SQLCipher)

**Actual state of WatermelonDB (checked June 2026):** it does not officially support SQLCipher —
PRs [#907](https://github.com/Nozbe/WatermelonDB/pull/907) and [#1635](https://github.com/Nozbe/WatermelonDB/pull/1635)
have been stalled for years and the authors have stepped back from them. The practical approach on Expo is:

```
App opens → keyManager.initEncryption()
             ├─ Key already in SecureStore?  → load it into memory
             └─ No key yet (first launch)    → generate 32 random bytes (expo-crypto CSPRNG)
                                              → store in SecureStore (Android Keystore-backed)
Writing data → activity.setName("Read a book")
               → name_enc = "v1:<12-byte nonce hex>:<AES-256-GCM ciphertext+tag hex>"
Reading data → activity.name (getter) → decrypted in memory
```

- Encrypted fields: `activities.name_enc`, `time_sessions.note_enc` (user-typed personal data)
- Plaintext fields: id, foreign keys, timestamps, `day_key` — needed for `WHERE`/index/stats
- Trade-off: **name search happens in memory** (`filterActivitiesByName`) — not an issue since it's single-user data
- Additional protection from Android itself: File-Based Encryption encrypts all on-device storage since Android 10
- If true whole-file encryption is needed in the future, the workable path is moving the storage layer to
  `@op-engineering/op-sqlite` (which has a SQLCipher option) — not patching WatermelonDB itself

## 6. Steps to initialize the project (already done — reproducible from here)

```bash
# 1) Create the project (Expo SDK 57 + expo-router + TypeScript)
npx create-expo-app@latest HabitTime

# 2) Database + state + notifications + crypto
npx expo install expo-secure-store expo-crypto expo-notifications expo-build-properties expo-dev-client
npm install @nozbe/watermelondb zustand @noble/ciphers
npm install @morrowdigital/watermelondb-expo-plugin
npm install -D @babel/plugin-proposal-decorators@^7.29.7   # must be v7 (Babel 7)

# 3) UI
npx expo install nativewind @expo/vector-icons
npm install -D tailwindcss@^3.4.17    # ⚠️ NativeWind 4 does not support Tailwind v4

# 4) Config files touched: app.json (plugins + android.package), babel.config.js,
#    metro.config.js, tailwind.config.js, tsconfig.json (experimentalDecorators),
#    src/global.css (@tailwind directives), nativewind-env.d.ts

# 5) Generate the native project
npx expo prebuild --platform android
```

## 7. Building on your machine / emulator

Your development machine needs a **JDK and the Android SDK** first:

1. Install **Android Studio** (bundles the Android SDK + emulator): <https://developer.android.com/studio>
2. Install **JDK 17 or 21** (Temurin: <https://adoptium.net>, or use the JBR bundled with Android Studio at
   `<Android Studio install dir>/jbr`) and set `JAVA_HOME` — **do not use a newer JDK** (e.g. JDK 24/25),
   since the Android Gradle Plugin's native build (CMake) doesn't support them yet
3. Set the env var `ANDROID_HOME = %LOCALAPPDATA%\Android\Sdk`

> ### ⚠️ Build from a path with no spaces or non-ASCII characters
> Example of a **problematic** path: `C:\Users\me\My Projects\final-project\HabitTime`
> Example of a **working** path: `C:\projects\HabitTime`
>
> A path containing non-ASCII characters or spaces causes the Android native build's CMake/Ninja step
> to fail on Windows (a well-known RN/Expo issue). Writing code / running `tsc` / `prebuild` works fine
> from any path, but `run:android` should only be run after moving to a safe path.

```bash
cd C:\projects\HabitTime
npx expo run:android        # builds + installs the dev client + opens the app
# for JS/TS-only changes afterwards: npx expo start --dev-client
```

**Expo Go will not work** (WatermelonDB is a native module) — you need a dev client from `run:android`,
or EAS Build (`eas build --profile development --platform android`) if you'd rather not install Android Studio.

## 8. Distributing the app to end users (without the Play Store)

Use **EAS Build** with internal distribution — produces a `.apk` with a shareable link/QR code:

```bash
npx eas-cli login                                    # log in / sign up for a (free) Expo account
npx eas-cli build --profile preview --platform android
```

- Configured in `eas.json` → the `preview` profile sets `distribution: internal` + `buildType: apk`
- Once the build finishes you get an `expo.dev` link with a QR code — share it with anyone, they open it
  on an Android phone and tap Install
- The `.apk` never expires and doesn't need Play Store review, but Android will warn that the developer
  is "unknown" (normal for apps distributed outside the Store) — users must allow "install from unknown
  sources" the first time
- **Important:** this has been verified to be a genuine release build (the JS bundle is embedded, it does
  not depend on the developer's Metro server like a dev-client build would) — it works fully standalone

## 9. Things to watch out for / next steps

- **Do not upgrade tailwindcss to v4** until NativeWind v5 is stable
- When changing the schema → bump `version` in `schema.ts` and always write a migration in `migrations.ts`
- WatermelonDB 0.28 + SDK 57 is a newer combination than the config plugin was tested against (SDK 54) —
  if the JSI adapter causes issues at runtime, fall back to `jsi: false` in `src/database/index.ts`
  and `["@morrowdigital/watermelondb-expo-plugin", { "disableJsi": true }]` in `app.json`
- WatermelonDB's decorated model fields (`@text`, `@field`, ...) must be declared as plain fields
  (no `!` or `declare`) — both conflict with Babel's legacy decorators transform. Disable
  `strictPropertyInitialization` in `tsconfig.json` instead
- Ideas for future work: export/backup data to a file (still on-device), streaks/daily goals,
  a full calendar view, a home-screen widget, biometric app lock (expo-local-authentication),
  iOS support (requires an Apple Developer Program membership to distribute via TestFlight)

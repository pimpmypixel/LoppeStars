## Android — environment variables with react-native-config (Android-focused)

This document explains the minimal, Android-only workflow for environment variables in this repo. It assumes you already installed `react-native-config` and wired `android/app/build.gradle` to apply `dotenv.gradle` (this repo already does that).

Prerequisites
- `.env` file at project root (do NOT commit this)
- `.env.example` committed with placeholders
- `react-native-config` installed and `patch-package` kept if you need to maintain a local patch

Quick checklist
1. Copy template and fill values:

```bash
cp .env.example .env
# edit .env and add real values
```

2. Important values for this repo (examples)

```
SUPABASE_URL_ANDROID=http://10.0.2.2:54321
SUPABASE_ANON_KEY=sb_publishable_...
GOOGLE_WEB_CLIENT_ID=...
GOOGLE_ANDROID_CLIENT_ID=...
FACEBOOK_APP_ID=...
```

3. Rebuild Android (mandatory for native injection)

- If you use Expo-managed + prebuild:

```bash
npm install
npx expo prebuild         # only if you haven't already generated native projects
expo run:android          # rebuild and install on emulator/device
```

- Direct Gradle (no expo-run):

```bash
cd android
./gradlew assembleDebug
# or ./gradlew installDebug to install on emulator
```

Why a rebuild is required
- `react-native-config` injects these values into native build artifacts at compile time. Changing `.env` requires a new native build for the Java/Kotlin resources to be regenerated and included in the APK.

Using values in JS

```ts
import Config from 'react-native-config'

const SUPABASE_URL = Config.SUPABASE_URL || 'http://fallback'
console.log('Supabase URL:', SUPABASE_URL)
```

Debugging tips
- If `Config.<KEY>` is undefined in JS, you likely did not rebuild the native app after changing `.env`.
- For Android emulator, use `10.0.2.2` to reach host machine services (this repo expects that in `.env.example`).
- Add temporary console.log(Config) early in your app bootstrap to inspect available keys during development.

Reproducibility and CI/EAS
- Keep `patches/` directory and `postinstall` script in `package.json` (this repo already has them) so team members apply the same fix during install.
- For CI and EAS builds, set environment variables in the build system (EAS secrets or CI env vars). Do NOT commit a `.env` with secrets.

Common mistakes
- Relying on Metro reload to pick up `.env` changes — Metro won't refresh native-injected values.
- Forgetting to run `npx pod-install` for iOS (ignored here per repo request) — only relevant when you later enable iOS.

If you want, I can also:
- Add a quick `npm run android:rebuild` script to `package.json` that runs `expo prebuild` then `expo run:android` (or direct Gradle) to standardize the workflow for the team.
- Add a tiny verification script that prints `Config.*` in a short Node script or in-app debug screen.

---
End of Android env guide.

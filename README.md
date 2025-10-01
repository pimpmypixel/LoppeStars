# LoppeStars

LoppeStars is a React Native / Expo mobile application that makes it fun to rate flea-market stalls. It authenticates users with Google OAuth, stores data in Supabase, and supports both English and Danish through i18n.

## Table of contents

1. [Getting started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Clone the repository](#clone-the-repository)
   - [Install dependencies](#install-dependencies)
   - [Configure environment variables](#configure-environment-variables)
   - [Start Supabase locally](#start-supabase-locally)
   - [Run the application](#run-the-application)
2. [Architecture overview](#architecture-overview)
3. [OAuth configuration](#oauth-configuration)
   - [Google (configured)](#google-configured)
   - [Facebook (to-do)](#facebook-to-do)
4. [Android configuration notes](#android-configuration-notes)
5. [Environment variable reference](#environment-variable-reference)
6. [Project scripts](#project-scripts)
7. [Troubleshooting & tips](#troubleshooting--tips)

---

## Getting started

The sections below consolidate setup details previously scattered across `ANDROID_CONFIG.md`, `OAUTH_SETUP.md`, and `ENVIRONMENT_MIGRATION.md`.

### Prerequisites

- **Node.js** ≥ 20.x (ships with npm ≥ 10)
- **Bun** ≥ 1.1 (optional, supported via `bun.lock`)
- **Expo CLI** (use `npx expo`; no global install required)
- **Supabase CLI** ≥ 1.195 (`brew install supabase/tap/supabase` or see [docs](https://supabase.com/docs/reference/cli))
- **Android Studio** with SDK 36 / Emulator (for Android builds)
- **Xcode** 15+ (for the iOS simulator)

### Clone the repository

```bash
git clone https://github.com/pimpmypixel/LoppeStars.git
cd LoppeStars
```

### Install dependencies

Choose the package manager you prefer:

```bash
# via npm (default)
npm install

# via bun (uses bun.lock)
bun install
```

> **Tip:** stick with a single package manager for consistency within a workflow.

### Configure environment variables

1. Copy the template and fill in your secrets:

   ```bash
   cp .env.example .env
   ```

2. Update the placeholders in `.env`:

   | Variable | Description |
   | --- | --- |
   | `SUPABASE_URL_ANDROID` | Supabase API URL for the Android emulator (defaults to `http://10.0.2.2:54321`). |
   | `SUPABASE_URL_IOS` | Supabase API URL for the iOS simulator (defaults to `http://127.0.0.1:54321`). |
   | `SUPABASE_ANON_KEY` | Supabase anon (publishable) key. |
   | `GOOGLE_WEB_CLIENT_ID` | Google OAuth web client ID used by the JS app and Supabase. |
   | `GOOGLE_ANDROID_CLIENT_ID` | Google OAuth Android client ID for native sign-in. |
   | `FACEBOOK_APP_ID` | Facebook App ID (only if enabling Facebook login). |

   Keep `.env` out of source control (already handled by `.gitignore`). Production keys belong in your deployment platform or CI/CD secrets.

### Start Supabase locally

1. Install and authenticate the Supabase CLI (only once):

   ```bash
   supabase login
   ```

2. Start the Supabase stack for local development:

   ```bash
   supabase start
   ```

   This boots Postgres, Auth, Storage, and Studio on the default ports. You can inspect the config under `supabase/config.toml`.

### Run the application

1. Start the Expo development server:

   ```bash
   npm run start        # or: bun run start
   ```

2. In another terminal, launch the desired platform:

   ```bash
   npm run android      # builds and opens the Android emulator
   npm run ios          # opens the iOS simulator (macOS only)
   npm run web          # runs the web preview
   ```

3. Helpful scripts:

   - `npm run ts:check` – TypeScript type checking.
   - `npm run ts:watch` – TypeScript watch mode during development.

---

## Architecture overview

- **Frontend:** React Native 0.81.4 with Expo SDK 54
- **Styling:** NativeWind plus shadcn-inspired primitives and Lucide icons
- **Auth:** Google OAuth (`@react-native-google-signin/google-signin`) with Supabase session management
- **Backend:** Supabase (database, auth, storage); local stack on port 54321
- **Data Scraping:** Scrapy spider for fleamarket data from markedskalenderen.dk
- **Image Processing:** FastAPI worker with OpenCV face detection and blurring
- **State & storage:** AsyncStorage for auth persistence; Supabase for user data
- **Localization:** `i18n-js` with Danish and English translations
- **Navigation:** React Navigation bottom tabs with nested stacks
- **Tooling:** TypeScript strict mode, Metro bundler, Expo build tooling, Bun lockfile support

---

## OAuth configuration

### Google (configured)

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and select your project.
2. Enable the **Google Sign-In** API.
3. Create OAuth 2.0 credentials for both **Web** and **Android**:
   - Web client ID → set `GOOGLE_WEB_CLIENT_ID` in `.env` and Supabase (`supabase/config.toml` references it).
   - Android client ID → set `GOOGLE_ANDROID_CLIENT_ID` in `.env` and add it to `android/app/src/main/res/values/strings.xml`.
4. Restart the Supabase stack or the Expo app after changing credentials.

Google OAuth is fully wired up; once the IDs are correct, sign-in works on Android, iOS, and the Expo web preview.

### Facebook (to-do)

1. Create an app in [Meta for Developers](https://developers.facebook.com/).
2. Add Facebook Login and note the **App ID** and **App Secret**.
3. Configure redirect URIs:

   ```
   loppestars://
   exp://192.168.1.xxx:8081
   exp://10.0.2.2:8081
   ```

4. Set `FACEBOOK_APP_ID` (and later the secret) in `.env`.
5. Enable Facebook as a provider in Supabase Authentication with matching redirect URLs.

---

## Android configuration notes

- `android/app/src/main/res/values/strings.xml` must contain the Google Android client ID:

  ```xml
  <string name="server_client_id">YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com</string>
  ```

- The value is not secret; Android verifies the package name and SHA fingerprint.
- Update the value before running `expo run:android` or building with EAS for production.
- For dynamic injection, consider Expo config plugins or Gradle script substitutions.

---

## Environment variable reference

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `SUPABASE_URL_ANDROID` | Supabase REST URL when running on Android (emulator). | ✅ | `http://10.0.2.2:54321` |
| `SUPABASE_URL_IOS` | Supabase REST URL when running on iOS (simulator). | ✅ | `http://127.0.0.1:54321` |
| `SUPABASE_ANON_KEY` | Supabase anon key for auth + database access. | ✅ | – |
| `GOOGLE_WEB_CLIENT_ID` | Google OAuth client ID used by JS app & Supabase. | ✅ | – |
| `GOOGLE_ANDROID_CLIENT_ID` | Google OAuth client ID for native Android. | ✅ | – |
| `FACEBOOK_APP_ID` | Facebook OAuth App ID (only if enabling Facebook login). | Optional | – |

---

## Project scripts

| Script | Description |
| --- | --- |
| `npm run start` | Start the Expo development server. |
| `npm run android` | Build and launch the Android development build. |
| `npm run ios` | Launch the iOS simulator (macOS only). |
| `npm run web` | Run the web build via Expo. |
| `npm run ts:check` | Type-check the project. |
| `npm run ts:watch` | Type-check continuously while editing. |

> Replace `npm` with `bun run` if you installed dependencies using Bun.

---

## Fleamarket Data Scraping

The app includes automated scraping of fleamarket data from markedskalenderen.dk:

### Scraping Infrastructure
- **Scrapy Spider**: Extracts market listings, dates, and features from the website
- **Daily Automation**: Cron job runs scraper at 2 AM daily
- **Data Storage**: Markets stored in Supabase with upsert logic
- **API Endpoints**: FastAPI and Edge Functions serve market data to the app

### Market Data Available
- Market names and municipalities
- Date ranges (start/end dates)
- Location details (address, city, postal code, coordinates)
- Organizer contact information (name, phone, email, website)
- Opening hours and entry fees
- Stall counts and venue types (indoor/outdoor)
- Amenities (food service, parking, toilets, WiFi)
- Special features and descriptions
- Source URLs for reference

### API Endpoints
- `GET /markets/today` - Markets happening today
- `GET /markets/nearby?latitude=...&longitude=...` - Markets within radius
- `GET /markets/search?query=...` - Search markets by name/location

---

## Troubleshooting & tips

- **React Native SVG missing** – reinstall with `npm install react-native-svg@15.12.1`.
- **Reanimated / Worklets mismatch** – keep `react-native-worklets` within `0.5.x - 0.6.x` to satisfy Reanimated’s Gradle checks.
- **Supabase connection errors** – confirm the Supabase stack is running (`supabase status`) and the emulator/simulator can reach the configured URL (`10.0.2.2` for Android, `127.0.0.1` for iOS).
- **Clearing Expo cache** – if Metro misbehaves, run `npx expo start --clear`.
- **Lockfiles** – the repo tracks both `package-lock.json` and `bun.lock`; regenerate the appropriate one when dependencies change.

Happy hacking! Contributions are welcome via issues or pull requests.

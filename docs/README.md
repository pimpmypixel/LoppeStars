# LoppeStars 🎪# LoppeStars



> Make fleamarkets fun again! Rate stalls, discover markets, and share your finds.LoppeStars is a React Native / Expo mobile application that makes it fun to rate flea-market stalls. It authenticates users with Google OAuth, stores data in Supabase, and supports both English and Danish through i18n.



LoppeStars is a React Native mobile app that gamifies flea market visits. Users can discover nearby markets, rate stalls with photos, and browse ratings—all while respecting privacy through automated face blurring.## Table of contents



---1. [Getting started](#getting-started)

   - [Prerequisites](#prerequisites)

## 📖 Documentation   - [Clone the repository](#clone-the-repository)

   - [Install dependencies](#install-dependencies)

**Comprehensive guides for development and deployment:**   - [Configure environment variables](#configure-environment-variables)

   - [Start Supabase locally](#start-supabase-locally)

- **[Development Guide](DEVELOPMENT.md)** - Local setup, OAuth configuration, environment variables, platform-specific notes   - [Run the application](#run-the-application)

- **[Deployment Guide](DEPLOYMENT.md)** - AWS infrastructure, Docker BuildX optimization, monitoring, scaling2. [Architecture overview](#architecture-overview)

- **[Architecture](ARCHITECTURE.md)** - System design, AWS resources, mobile app structure, API design, security3. [OAuth configuration](#oauth-configuration)

- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions for mobile, API, infrastructure   - [Google (configured)](#google-configured)

- **[Design System](DESIGN.md)** - UI/UX guidelines and component library   - [Facebook (to-do)](#facebook-to-do)

- **[Events System](EVENTS_SYSTEM.md)** - Event tracking and analytics implementation4. [Android configuration notes](#android-configuration-notes)

5. [Environment variable reference](#environment-variable-reference)

---6. [Project scripts](#project-scripts)

7. [Troubleshooting & tips](#troubleshooting--tips)

## 🚀 Quick Start

---

### Mobile App (Local Development)

## Getting started

```bash

# Clone and installThe sections below consolidate setup details previously scattered across `ANDROID_CONFIG.md`, `OAUTH_SETUP.md`, and `ENVIRONMENT_MIGRATION.md`.

git clone https://github.com/pimpmypixel/LoppeStars.git

cd LoppeStars/app### Prerequisites

npm install

- **Node.js** ≥ 20.x (ships with npm ≥ 10)

# Configure environment (copy and edit .env)- **Bun** ≥ 1.1 (optional, supported via `bun.lock`)

cp ../.env.example ../.env- **Expo CLI** (use `npx expo`; no global install required)

- **Supabase CLI** ≥ 1.195 (`brew install supabase/tap/supabase` or see [docs](https://supabase.com/docs/reference/cli))

# Start Supabase- **Android Studio** with SDK 36 / Emulator (for Android builds)

supabase start- **Xcode** 15+ (for the iOS simulator)



# Run the app### Clone the repository

npm run android  # Android emulator

npm run ios      # iOS simulator (macOS only)```bash

npm run web      # Web previewgit clone https://github.com/pimpmypixel/LoppeStars.git

```cd LoppeStars

```

### Backend API (Local Development)

### Install dependencies

```bash

# From project rootChoose the package manager you prefer:

cd api

```bash

# With Docker (recommended)# via npm (default)

docker build -t loppestars-api .npm install

docker run -p 8080:8080 --env-file ../.env loppestars-api

# via bun (uses bun.lock)

# Or with Pythonbun install

pip install -r requirements.txt```

uvicorn main:app --reload --port 8080

```> **Tip:** stick with a single package manager for consistency within a workflow.



**See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed setup instructions.**### Configure environment variables



---1. Copy the template and fill in your secrets:



## 🏗️ Tech Stack   ```bash

   cp .env.example .env

### Mobile App (`app/` folder)   ```

- **Framework**: React Native 0.81.4 with Expo SDK 54

- **Styling**: NativeWind (Tailwind CSS) + shadcn/ui-inspired components2. Update the placeholders in `.env`:

- **Navigation**: React Navigation (bottom tabs + nested stacks)

- **Auth**: Google OAuth with Supabase Auth   | Variable | Description |

- **State**: React Context (Auth, Theme) + AsyncStorage   | --- | --- |

- **Localization**: i18n-js (Danish/English)   | `SUPABASE_URL_ANDROID` | Supabase API URL for the Android emulator (defaults to `http://10.0.2.2:54321`). |

- **Icons**: Lucide React Native   | `SUPABASE_URL_IOS` | Supabase API URL for the iOS simulator (defaults to `http://127.0.0.1:54321`). |

   | `SUPABASE_ANON_KEY` | Supabase anon (publishable) key. |

### Backend API (`api/` folder)   | `GOOGLE_WEB_CLIENT_ID` | Google OAuth web client ID used by the JS app and Supabase. |

- **Framework**: FastAPI with Python 3.11   | `GOOGLE_ANDROID_CLIENT_ID` | Google OAuth Android client ID for native sign-in. |

- **Image Processing**: OpenCV with face detection/blurring   | `FACEBOOK_APP_ID` | Facebook App ID (only if enabling Facebook login). |

- **Data Scraping**: Scrapy (markedskalenderen.dk)

- **Deployment**: Docker + AWS ECS Fargate   Keep `.env` out of source control (already handled by `.gitignore`). Production keys belong in your deployment platform or CI/CD secrets.

- **Build**: Docker BuildX with multi-stage caching (5s builds!)

### Start Supabase locally

### Infrastructure (`aws/` folder)

- **Cloud**: AWS (ECS, ALB, VPC, CloudWatch)1. Install and authenticate the Supabase CLI (only once):

- **DNS**: Cloudflare

- **Database**: Supabase Cloud (PostgreSQL)   ```bash

- **Storage**: Supabase Storage (photos)   supabase login

- **IaC**: CloudFormation + custom deployment script   ```



---2. Start the Supabase stack for local development:



## 📁 Project Structure   ```bash

   supabase start

```   ```

loppestars/

├── app/                    # React Native mobile app (Expo)   This boots Postgres, Auth, Storage, and Studio on the default ports. You can inspect the config under `supabase/config.toml`.

│   ├── components/        # Reusable UI components

│   ├── screens/           # Screen components### Run the application

│   ├── navigation/        # Navigation config

│   ├── contexts/          # React Context providers1. Start the Expo development server:

│   ├── hooks/             # Custom hooks

│   ├── utils/             # Utilities (Supabase, i18n, permissions)   ```bash

│   ├── locales/           # Translation files (en.json, da.json)   npm run start        # or: bun run start

│   └── assets/            # Images, icons   ```

├── api/                   # FastAPI backend

│   ├── main.py           # API endpoints2. In another terminal, launch the desired platform:

│   ├── face_processor.py # Face detection/blurring

│   ├── scraper_cron.py   # Market data scraper   ```bash

│   └── scrapy_project/   # Scrapy spiders   npm run android      # builds and opens the Android emulator

├── aws/                   # Infrastructure as Code   npm run ios          # opens the iOS simulator (macOS only)

│   ├── deploy.sh         # Master deployment script   npm run web          # runs the web preview

│   └── lib/              # CloudFormation templates   ```

├── supabase/             # Supabase configuration

│   ├── functions/        # Edge Functions3. Helpful scripts:

│   └── migrations/       # Database migrations

└── docs/                 # Documentation (you are here!)   - `npm run ts:check` – TypeScript type checking.

```   - `npm run ts:watch` – TypeScript watch mode during development.



------



## 🔑 Environment Variables## Architecture overview



**All environment variables are centralized in the root `.env` file.**- **Frontend:** React Native 0.81.4 with Expo SDK 54

- **Styling:** NativeWind plus shadcn-inspired primitives and Lucide icons

### Required for Mobile App- **Auth:** Google OAuth (`@react-native-google-signin/google-signin`) with Supabase session management

- **Backend:** Supabase (database, auth, storage); local stack on port 54321

| Variable | Description | Example |- **Data Scraping:** Scrapy spider for fleamarket data from markedskalenderen.dk

|----------|-------------|---------|- **Image Processing:** FastAPI worker with OpenCV face detection and blurring

| `SUPABASE_URL_ANDROID` | Supabase URL for Android emulator | `http://10.0.2.2:54321` |- **State & storage:** AsyncStorage for auth persistence; Supabase for user data

| `SUPABASE_URL_IOS` | Supabase URL for iOS simulator | `http://127.0.0.1:54321` |- **Localization:** `i18n-js` with Danish and English translations

| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |- **Navigation:** React Navigation bottom tabs with nested stacks

| `GOOGLE_WEB_CLIENT_ID` | Google OAuth web client ID | `512928992479-...apps.googleusercontent.com` |- **Tooling:** TypeScript strict mode, Metro bundler, Expo build tooling, Bun lockfile support

| `GOOGLE_ANDROID_CLIENT_ID` | Google OAuth Android client ID | `512928992479-...apps.googleusercontent.com` |

---

### Required for Backend API

## OAuth configuration

| Variable | Description | Example |

|----------|-------------|---------|### Google (configured)

| `SUPABASE_URL` | Supabase API URL (production) | `https://xxx.supabase.co` |

| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` |1. Open the [Google Cloud Console](https://console.cloud.google.com/) and select your project.

| `SCRAPER_BUCKET` | Supabase storage bucket name | `scraped-data` |2. Enable the **Google Sign-In** API.

3. Create OAuth 2.0 credentials for both **Web** and **Android**:

**See [DEVELOPMENT.md](DEVELOPMENT.md#environment-variables) for full reference.**   - Web client ID → set `GOOGLE_WEB_CLIENT_ID` in `.env` and Supabase (`supabase/config.toml` references it).

   - Android client ID → set `GOOGLE_ANDROID_CLIENT_ID` in `.env` and add it to `android/app/src/main/res/values/strings.xml`.

---4. Restart the Supabase stack or the Expo app after changing credentials.



## 🛠️ Development WorkflowGoogle OAuth is fully wired up; once the IDs are correct, sign-in works on Android, iOS, and the Expo web preview.



### Working on Mobile App### Facebook (to-do)



```bash1. Create an app in [Meta for Developers](https://developers.facebook.com/).

cd app/2. Add Facebook Login and note the **App ID** and **App Secret**.

3. Configure redirect URIs:

# Type checking

npm run ts:check   ```

npm run ts:watch  # Watch mode   loppestars://

   exp://192.168.1.xxx:8081

# Run tests   exp://10.0.2.2:8081

npm test   ```



# Clear cache if needed4. Set `FACEBOOK_APP_ID` (and later the secret) in `.env`.

npx expo start --clear5. Enable Facebook as a provider in Supabase Authentication with matching redirect URLs.

```

---

### Working on API

## Android configuration notes

```bash

cd api/- `android/app/src/main/res/values/strings.xml` must contain the Google Android client ID:



# Test locally  ```xml

uvicorn main:app --reload --port 8080  <string name="server_client_id">YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com</string>

  ```

# Test face blurring

curl -X POST http://localhost:8080/blur-faces \- The value is not secret; Android verifies the package name and SHA fingerprint.

  -F "file=@test-image.jpg"- Update the value before running `expo run:android` or building with EAS for production.

- For dynamic injection, consider Expo config plugins or Gradle script substitutions.

# Deploy to AWS ECS

cd ../aws---

./deploy.sh  # Builds with BuildX, pushes to ECR, updates ECS

```## Environment variable reference



### Database Changes| Variable | Description | Required | Default |

| --- | --- | --- | --- |

```bash| `SUPABASE_URL_ANDROID` | Supabase REST URL when running on Android (emulator). | ✅ | `http://10.0.2.2:54321` |

# Local Supabase| `SUPABASE_URL_IOS` | Supabase REST URL when running on iOS (simulator). | ✅ | `http://127.0.0.1:54321` |

supabase start| `SUPABASE_ANON_KEY` | Supabase anon key for auth + database access. | ✅ | – |

supabase status| `GOOGLE_WEB_CLIENT_ID` | Google OAuth client ID used by JS app & Supabase. | ✅ | – |

supabase db reset  # Reset to migrations| `GOOGLE_ANDROID_CLIENT_ID` | Google OAuth client ID for native Android. | ✅ | – |

| `FACEBOOK_APP_ID` | Facebook OAuth App ID (only if enabling Facebook login). | Optional | – |

# Create migration

supabase migration new my_change---



# Push to production## Project scripts

supabase db push

```| Script | Description |

| --- | --- |

---| `npm run start` | Start the Expo development server. |

| `npm run android` | Build and launch the Android development build. |

## 🎯 Key Features| `npm run ios` | Launch the iOS simulator (macOS only). |

| `npm run web` | Run the web build via Expo. |

### For Users| `npm run ts:check` | Type-check the project. |

- 📍 **Location-based market discovery** - Find flea markets near you| `npm run ts:watch` | Type-check continuously while editing. |

- ⭐ **Stall ratings** - Rate stalls with photos and stars (1-5)

- 📸 **Automatic face blurring** - Privacy-first photo sharing> Replace `npm` with `bun run` if you installed dependencies using Bun.

- 🌍 **Bilingual** - Full Danish and English support

- 🔒 **Secure auth** - Google Sign-In via Supabase---



### For Developers## Fleamarket Data Scraping

- 🚀 **5-second builds** - Docker BuildX with registry cache

- 🔄 **Idempotent deployment** - Run `deploy.sh` safely anytimeThe app includes automated scraping of fleamarket data from markedskalenderen.dk:

- 📊 **Comprehensive monitoring** - CloudWatch logs and metrics

- 🧪 **Type-safe** - TypeScript strict mode### Scraping Infrastructure

- 📦 **Modular architecture** - Clean separation of concerns- **Scrapy Spider**: Extracts market listings, dates, and features from the website

- **Daily Automation**: Cron job runs scraper at 2 AM daily

---- **Data Storage**: Markets stored in Supabase with upsert logic

- **API Endpoints**: FastAPI and Edge Functions serve market data to the app

## 📊 API Endpoints

### Market Data Available

**Base URL:** `https://loppestars.spoons.dk`- Market names and municipalities

- Date ranges (start/end dates)

| Method | Endpoint | Description |- Location details (address, city, postal code, coordinates)

|--------|----------|-------------|- Organizer contact information (name, phone, email, website)

| `GET` | `/health` | Health check |- Opening hours and entry fees

| `POST` | `/blur-faces` | Upload image for face blurring |- Stall counts and venue types (indoor/outdoor)

| `GET` | `/markets/today` | Markets happening today |- Amenities (food service, parking, toilets, WiFi)

| `GET` | `/markets/nearby?lat=...&lon=...` | Markets within radius |- Special features and descriptions

| `GET` | `/markets/search?q=...` | Search markets by name/location |- Source URLs for reference



**See [ARCHITECTURE.md](ARCHITECTURE.md#api-design) for full API documentation.**### API Endpoints

- `GET /markets/today` - Markets happening today

---- `GET /markets/nearby?latitude=...&longitude=...` - Markets within radius

- `GET /markets/search?query=...` - Search markets by name/location

## 🤝 Contributing

---

### Commit Message Guidelines

## Troubleshooting & tips

**Keep commit messages short and descriptive:**

- **React Native SVG missing** – reinstall with `npm install react-native-svg@15.12.1`.

✅ **Good:**- **Reanimated / Worklets mismatch** – keep `react-native-worklets` within `0.5.x - 0.6.x` to satisfy Reanimated’s Gradle checks.

- `Fix BuildX cache not persisting`- **Supabase connection errors** – confirm the Supabase stack is running (`supabase status`) and the emulator/simulator can reach the configured URL (`10.0.2.2` for Android, `127.0.0.1` for iOS).

- `Add face blurring API endpoint`- **Clearing Expo cache** – if Metro misbehaves, run `npx expo start --clear`.

- `Update OAuth redirect URLs`- **Lockfiles** – the repo tracks both `package-lock.json` and `bun.lock`; regenerate the appropriate one when dependencies change.



❌ **Bad:**Happy hacking! Contributions are welcome via issues or pull requests.

- `Fixed the issue where the Docker BuildX cache wasn't persisting across builds due to incorrect ECR configuration`
- `Add new feature`
- `Update code`

**Why?** Short commits are easier to scan in `git log`, cherry-pick, and revert. Details belong in code comments or documentation.

### Development Process

1. **Create feature branch**: `git checkout -b feature/my-feature`
2. **Make changes**: Follow TypeScript strict mode, add tests
3. **Test locally**: Mobile app + API + Supabase
4. **Commit**: Short, descriptive messages
5. **Push**: `git push origin feature/my-feature`
6. **Deploy**: GitHub Actions auto-deploys `main` branch

---

## 🐛 Troubleshooting

**Common issues:**

- **Auth not working?** Check Google OAuth client IDs in `.env` and Google Cloud Console
- **Can't connect to Supabase?** Use `10.0.2.2` for Android, `127.0.0.1` for iOS
- **Build failing?** Clear cache: `npx expo start --clear`
- **Deployment stuck?** Check CloudWatch logs: `aws logs tail /ecs/loppestars --follow`

**See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for comprehensive solutions.**

---

## 📚 Additional Resources

- **Expo Documentation**: https://docs.expo.dev
- **Supabase Documentation**: https://supabase.com/docs
- **React Navigation**: https://reactnavigation.org
- **NativeWind**: https://www.nativewind.dev
- **AWS ECS**: https://aws.amazon.com/ecs

---

## 📄 License

[Add your license here]

---

## 📧 Contact

Questions? Issues? Contributions?

- **GitHub Issues**: [pimpmypixel/LoppeStars/issues](https://github.com/pimpmypixel/LoppeStars/issues)
- **Email**: [your-email@example.com]

---

**Built with ❤️ for flea market enthusiasts** 🎪

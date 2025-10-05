# Development Guide

Complete guide for local development, OAuth configuration, and environment setup.

---

## Local Development Setup

### Mobile App (React Native/Expo)

1. **Install dependencies:**
   ```bash
   cd app
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file:**
   ```bash
   # Supabase (local)
   SUPABASE_URL_ANDROID=http://10.0.2.2:54321
   SUPABASE_URL_IOS=http://127.0.0.1:54321
   SUPABASE_ANON_KEY=<from supabase start>

   # Google OAuth
   GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_ANDROID_CLIENT_ID=xxx.apps.googleusercontent.com

   # Facebook OAuth (optional)
   FACEBOOK_APP_ID=xxx
   ```

4. **Start Supabase locally:**
   ```bash
   supabase start
   ```

   Note the `anon key` and `service_role key` from the output.

5. **Run the app:**
   ```bash
   npm run start        # Expo dev server
   npm run android      # Android emulator
   npm run ios          # iOS simulator (macOS only)
   npm run web          # Web preview
   ```

### Backend API (FastAPI)

1. **Option A: Docker (recommended):**
   ```bash
   docker build -t loppestars-api -f Dockerfile .
   docker run -p 8080:8080 --env-file .env loppestars-api
   ```

2. **Option B: Local Python:**
   ```bash
   cd api
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8080 --reload
   ```

3. **Test API:**
   ```bash
   curl http://localhost:8080/health
   ```

---

## OAuth Configuration

### Google OAuth Setup

#### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Sign-In API**

#### 2. Create OAuth 2.0 Credentials

**Web Client (for Supabase and web preview):**
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `Loppestars Web`
5. Authorized redirect URIs:
   ```
   https://xxx.supabase.co/auth/v1/callback
   http://localhost:54321/auth/v1/callback
   exp://localhost:8081
   ```
6. Copy **Client ID** → `GOOGLE_WEB_CLIENT_ID`

**Android Client (for native sign-in):**
1. Create another OAuth client
2. Application type: **Android**
3. Name: `Loppestars Android`
4. Package name: `com.loppestars` (from `app/app.json`)
5. SHA-1 fingerprint:
   ```bash
   # Debug keystore
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # Production keystore
   keytool -list -v -keystore /path/to/release.keystore -alias loppestars
   ```
6. Copy **Client ID** → `GOOGLE_ANDROID_CLIENT_ID`

#### 3. Configure Supabase

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable **Google** provider
3. Paste **Client ID** (web client)
4. Paste **Client Secret** (web client)
5. Redirect URL: `https://xxx.supabase.co/auth/v1/callback`

#### 4. Configure Android App

Edit `app/android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">Loppestars</string>
    <string name="server_client_id">YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com</string>
</resources>
```

This file is **not committed** to git for security.

#### 5. Test Google Sign-In

```bash
cd app
npm run android
# Click "Continue with Google" button
# Should open Google account picker
```

---

### Facebook OAuth Setup (Optional)

#### 1. Create Facebook App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app
3. Add **Facebook Login** product
4. Note **App ID** and **App Secret**

#### 2. Configure App Settings

1. **Settings > Basic**:
   - App Domains: `loppestars.spoons.dk`, `localhost`
   - Privacy Policy URL: (add yours)
   - Terms of Service URL: (add yours)

2. **Facebook Login > Settings**:
   - Valid OAuth Redirect URIs:
     ```
     https://xxx.supabase.co/auth/v1/callback
     http://localhost:54321/auth/v1/callback
     loppestars://
     exp://192.168.1.xxx:8081
     exp://10.0.2.2:8081
     ```

#### 3. Configure Supabase

1. Supabase Dashboard > Authentication > Providers
2. Enable **Facebook** provider
3. Paste **App ID**
4. Paste **App Secret**
5. Redirect URL: `https://xxx.supabase.co/auth/v1/callback`

#### 4. Configure Mobile App

Add to `.env`:
```bash
FACEBOOK_APP_ID=your_app_id_here
```

Edit `app/app.json`:
```json
{
  "expo": {
    "facebookScheme": "fb<APP_ID>",
    "facebookAppId": "<APP_ID>",
    "facebookDisplayName": "Loppestars"
  }
}
```

#### 5. Test Facebook Login

Currently **not implemented** in the UI. The button exists but needs wiring.

---

## Environment Variables Reference

### Mobile App (`app/.env`)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `SUPABASE_URL_ANDROID` | Supabase URL for Android emulator | ✅ | `http://10.0.2.2:54321` |
| `SUPABASE_URL_IOS` | Supabase URL for iOS simulator | ✅ | `http://127.0.0.1:54321` |
| `SUPABASE_ANON_KEY` | Supabase publishable key | ✅ | `eyJhbG...` |
| `GOOGLE_WEB_CLIENT_ID` | Google OAuth web client ID | ✅ | `xxx.apps.googleusercontent.com` |
| `GOOGLE_ANDROID_CLIENT_ID` | Google OAuth Android client ID | ✅ | `xxx.apps.googleusercontent.com` |
| `FACEBOOK_APP_ID` | Facebook App ID | Optional | `123456789` |

### Backend API (root `.env`)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `SUPABASE_URL` | Supabase REST API URL | ✅ | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin) | ✅ | `eyJhbG...` |
| `SUPABASE_ANON_KEY` | Supabase publishable key | ✅ | `eyJhbG...` |
| `SOURCE_BUCKET` | Source bucket for uploaded photos | ✅ | `stall-photos` |
| `STORAGE_BUCKET` | Destination bucket for processed photos | ✅ | `stall-photos-processed` |
| `API_BASE_URL` | Public API URL | For deployment | `https://loppestars.spoons.dk` |
| `CF_API_TOKEN` | Cloudflare API token | For deployment | `xxx...` |
| `CF_ZONE_ID` | Cloudflare zone ID | For deployment | `xxx...` |

---

## Platform-Specific Notes

### Android Development

#### Emulator Setup
```bash
# List available emulators
emulator -list-avds

# Start emulator
emulator -avd Pixel_6_API_36
```

#### Network Configuration
- Android emulator uses `10.0.2.2` to access host machine's `localhost`
- Set `SUPABASE_URL_ANDROID=http://10.0.2.2:54321`
- If Supabase can't connect, check firewall settings

#### Debug Build
```bash
cd app/android
./gradlew assembleDebug
```

#### Release Build
```bash
# Generate keystore (first time)
keytool -genkey -v -keystore loppestars-release.keystore -alias loppestars -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
cd app/android
./gradlew assembleRelease
```

---

### iOS Development (macOS only)

#### Xcode Setup
```bash
cd app/ios
pod install
```

#### Simulator Setup
```bash
# List available simulators
xcrun simctl list devices

# Start simulator
open -a Simulator
```

#### Network Configuration
- iOS simulator uses `127.0.0.1` for localhost
- Set `SUPABASE_URL_IOS=http://127.0.0.1:54321`

---

## Database Schema

### Key Tables

**markets**
```sql
CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  municipality TEXT,
  start_date DATE,
  end_date DATE,
  latitude DECIMAL,
  longitude DECIMAL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  organizer_name TEXT,
  organizer_phone TEXT,
  organizer_email TEXT,
  organizer_website TEXT,
  features JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**ratings**
```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  market_id UUID REFERENCES markets(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**stall_photos** (Supabase Storage bucket)
- Original uploaded photos
- Processed by face detection API
- Blurred faces for privacy

**stall_photos_processed** (Supabase Storage bucket)
- Processed photos with blurred faces
- Ready for public display

---

## Localization

### Adding Translations

Edit `app/locales/en.json` and `app/locales/da.json`:

```json
{
  "welcome": {
    "title": "Welcome to Loppestars",
    "subtitle": "Rate your favorite flea market stalls"
  }
}
```

### Using Translations

```typescript
import { t } from '../utils/localization';

<Text>{t('welcome.title')}</Text>
<Text>{t('welcome.subtitle')}</Text>
```

### Changing Language

```typescript
import { setLanguage } from '../utils/localization';

setLanguage('da'); // Danish
setLanguage('en'); // English
```

Language selector is available in **More > Language**.

---

## TypeScript

### Type Checking

```bash
cd app
npm run ts:check        # One-time check
npm run ts:watch        # Watch mode
```

### Common Type Issues

**Supabase types:**
```typescript
import { Database } from './types/supabase';

type Market = Database['public']['Tables']['markets']['Row'];
```

**Navigation types:**
```typescript
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  MarketDetails: { marketId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'MarketDetails'>;
```

---

## Testing

### Unit Tests (Not yet implemented)

```bash
cd app
npm test
```

### E2E Tests (Not yet implemented)

```bash
cd app
npm run test:e2e
```

### Manual Testing Checklist

- [ ] Google OAuth login works
- [ ] Location permission requested
- [ ] Camera permission requested
- [ ] Markets load correctly
- [ ] Can take photo of stall
- [ ] Rating slider works
- [ ] Photo upload succeeds
- [ ] Face blurring works
- [ ] Language switcher works
- [ ] Dark mode works
- [ ] Logout clears session

---

## Debugging

### React Native Debugger

```bash
# Install React Native Debugger
brew install --cask react-native-debugger

# Start debugger
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

### Flipper

```bash
# Install Flipper
brew install --cask flipper

# Start Flipper
open -a Flipper
```

### Chrome DevTools

```bash
# Start Metro bundler
npm run start

# Press 'd' in terminal
# Select "Open Debugger"
```

### View Logs

```bash
# iOS
npx react-native log-ios

# Android
npx react-native log-android

# Both
npx expo start
# Press 'r' to reload
# Press 'j' to open debugger
```

---

## Common Development Tasks

### Clear Metro Cache

```bash
npx expo start --clear
```

### Clear AsyncStorage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.clear();
```

### Reset Simulator

```bash
# iOS
xcrun simctl erase all

# Android
adb shell pm clear com.loppestars
```

### Update Dependencies

```bash
cd app
npm update
npm outdated  # Check for updates
```

### Generate App Icons

```bash
# Place icon.png (1024x1024) in app/assets/
npx expo prebuild
```

---

## Next Steps

- Read **[Architecture](ARCHITECTURE.md)** for technical details
- See **[Deployment Guide](DEPLOYMENT.md)** for production deployment
- Check **[Troubleshooting](TROUBLESHOOTING.md)** for common issues

---

**Happy coding!** 💻

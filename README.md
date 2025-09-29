# LoppeStars

A React Native/Expo mobile application for rating flea market stalls with Google OAuth authentication and Supabase backend integration.

## Environment Setup

This project uses environment variables to manage sensitive configuration. Follow these steps to set up your development environment:

### 1. Environment Variables Setup

Copy the environment template:
```bash
cp .env.example .env
```

Update the `.env` file with your actual values:

- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `GOOGLE_WEB_CLIENT_ID`: Your Google OAuth web client ID

The default values for local development URLs are already set correctly:
- `SUPABASE_URL_ANDROID=http://10.0.2.2:54321` (for Android emulator)  
- `SUPABASE_URL_IOS=http://127.0.0.1:54321` (for iOS simulator)

### 2. Google OAuth Configuration

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sign-in API
4. Create credentials (OAuth 2.0 Client IDs) for:
   - **Web application** (for React Native JavaScript code and Supabase)
   - **Android** (for native Android OAuth)
5. Add your web client ID to the `.env` file as `GOOGLE_WEB_CLIENT_ID`
6. Add your Android client ID to `android/app/src/main/res/values/strings.xml`

**Important**: The Android client ID must be in the `strings.xml` file for native Android OAuth to work. See `ANDROID_CONFIG.md` for details.

### 3. Supabase Local Development

Start your local Supabase instance:
```bash
supabase start
```

The environment variables will be automatically used by both:
- React Native app (via react-native-dotenv)
- Supabase local instance (via config.toml)

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the App

```bash
npm run start      # Start Expo development server
npm run android    # Run on Android
npm run ios        # Run on iOS
```

## Security Notes

- **Never commit the `.env` file** - it's already in `.gitignore`
- Use `.env.example` as a template for new developers
- For production deployments, set environment variables in your deployment platform
- The Google OAuth client ID in `supabase/config.toml` uses environment variable substitution: `env(GOOGLE_WEB_CLIENT_ID)`

## Architecture

- **Frontend**: React Native 0.81.4 with Expo SDK 54
- **Backend**: Supabase (local development on port 54321)
- **Auth**: Google Sign-in via `@react-native-google-signin/google-signin`
- **Database**: PostgreSQL via Supabase (local instance)
- **Environment**: react-native-dotenv for environment variable management
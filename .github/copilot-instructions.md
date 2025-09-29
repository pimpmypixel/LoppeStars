# Copilot Instructions for Loppestars

## Project Overview
This is a React Native/Expo mobile application with Google OAuth authentication and Supabase backend integration. The app is currently in early development with basic auth functionality.

## Architecture & Stack
- **Frontend**: React Native 0.81.4 with Expo SDK 54
- **Backend**: Supabase (local development on port 54321)
- **Auth**: Google Sign-in via `@react-native-google-signin/google-signin`
- **Database**: PostgreSQL via Supabase (local instance)
- **UI**: Standard React Native components (React Native Elements removed due to compatibility issues)
- **State**: AsyncStorage for auth persistence

## Key Files & Structure
```
App.tsx                    # Main app entry point with AuthWrapper
components/
  Auth.tsx                 # Google OAuth implementation  
  AuthWrapper.tsx          # Session management wrapper
navigation/
  AppNavigator.tsx         # Bottom tab navigation setup
screens/
  HomeScreen.tsx           # Home tab with logout functionality
  CameraScreen.tsx         # Camera tab with photo capture
  FormScreen.tsx           # Form tab for item submission
utils/supabase.ts          # Supabase client configuration
supabase/config.toml       # Local Supabase configuration
keys/                      # OAuth credentials (not committed)
```

## Development Patterns

### Navigation Structure
- Bottom tab navigation with 3 screens: Home, Camera, Form
- AuthWrapper manages authentication state and screen transitions
- Session persistence with automatic auth state monitoring
- Clean logout functionality that returns to login screen

### Authentication Flow
- Google OAuth → Supabase authentication working end-to-end
- Uses Android-compatible URLs (10.0.2.2 for emulator)
- Auto-refresh tokens on app state changes (foreground/background)
- AsyncStorage for session persistence on mobile platforms

### Camera Integration
- Expo Camera with take picture and image picker functionality
- Proper permission handling and user prompts
- Image preview with save/retake options
- Front/back camera toggle

### Form Handling
- Multi-field form with validation
- Supabase user context integration
- Loading states and error handling
- Keyboard-aware scrollable interface

### Supabase Integration
- Local development setup with full Supabase stack
- Studio available on port 54323
- Email testing via Inbucket on port 54324
- Google OAuth provider configured in `supabase/config.toml`
- No database migrations or seed files currently

### Component Patterns
- Functional components with hooks
- Direct export from component functions (no named exports)
- StyleSheet for component styling
- Platform-specific configurations in supabase client

## Development Workflow

### Local Development
```bash
npm run start          # Start Expo development server
npm run android        # Run on Android
npm run ios           # Run on iOS
npm run web           # Run in web browser
```

### Supabase Local Development
- Supabase CLI manages local instance via `supabase/config.toml`
- Database runs on port 54322, API on 54321
- Google OAuth configured with client IDs in config

### Build Process
- Uses Expo CLI for bundling (`export:embed` command)
- Android build configuration in `android/app/build.gradle`
- New Architecture disabled in `app.json` (due to dependency compatibility issues)

## Configuration Notes
- Google OAuth client IDs are environment-specific
- Hardcoded Supabase URL/key for local development
- Platform detection for web vs. mobile storage
- TypeScript strict mode enabled
- React Native Elements UI library removed to resolve build compatibility issues

## Current State
- Complete Google OAuth → Supabase authentication flow working
- Bottom tab navigation with 3 functional screens
- Camera functionality with proper permissions
- Form submission with validation and user context
- Session management and logout functionality
- Android builds successfully compile and run
- Ready for business logic development and data models

When implementing features, the foundation is solid - focus on extending the existing screens with business logic and connecting forms to Supabase database tables.
- Supabase client configured but auth integration is commented out
- No database schema or business logic yet
- Ready for feature development on top of auth foundation

When implementing features, prioritize completing the OAuth → Supabase auth flow in `components/Auth.tsx` before adding new functionality.
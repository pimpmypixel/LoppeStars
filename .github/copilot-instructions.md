# Copilot Instructions for Loppestars

## Project Overview
This is a React Native/Expo mobile application with Google and Facebook OAuth authentication and Supabase backend integration.
The app makes it fun and easy to rate the stalls at your local flea market in a friendly way.

## Architecture & Stack
- **Frontend**: React Native 0.81.4 with Expo SDK 54
- **Backend**: Supabase (local development on port 54321)
- **Auth**: Google Sign-in via `@react-native-google-signin/google-signin`
- **Database**: PostgreSQL via Supabase (local instance)
- **UI**: Standard React Native components with custom header/footer system
- **State**: AsyncStorage for auth persistence and app state
- **Localization**: i18n-js with Danish and English support
- **Permissions**: Expo Camera and Location with persistent permission storage
- **Navigation**: React Navigation bottom tabs (Home | Add Item | More)

## Key Files & Structure
```
App.tsx                    # Main app entry point with AuthWrapper and localization init
components/
  Auth.tsx                 # Google OAuth implementation with logo and localized UI
  AuthWrapper.tsx          # Session management wrapper with permissions request
  AppHeader.tsx            # Reusable header component for all authenticated screens
  AppFooter.tsx            # Reusable footer component with logo and localized text
  Logo.tsx                 # Logo component with multiple sizes (small/medium/large)
  CameraModal.tsx          # Full-screen camera modal with localized UI
  LanguageSelector.tsx     # Language switcher component (English/Danish)
screens/
  HomeScreen.tsx           # Home tab with welcome message, logo, and localized content
  FormScreen.tsx           # Form tab with localized labels, validation, and camera integration
  MoreScreen.tsx           # More tab with menu items, language selector, and logout
navigation/
  AppNavigator.tsx         # Bottom tab navigation with localized tab names
utils/
  supabase.ts              # Supabase client configuration
  localization.ts          # i18n configuration and language management
  permissions.ts           # Camera and location permissions management
locales/
  en.json                  # English translations for all app strings
  da.json                  # Danish translations for all app strings
supabase/config.toml       # Local Supabase configuration
keys/                      # OAuth credentials (not committed)
assets/
  logo.png                 # App logo (284x279 PNG)
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
- Automatic permissions request (camera + location) on successful login
- Logo display on auth screen with localized welcome messages

### Camera Integration
- Expo Camera integrated as full-screen modal (not standalone screen)
- Triggered from form screen via "Add Photo" button
- Proper permission handling with localized prompts and settings redirect
- Image preview with save/retake options, front/back camera toggle
- Gallery access via ImagePicker with consistent UI

### Form Handling
- Multi-field form with localized labels and validation messages
- Supabase user context integration, loading states and error handling
- Keyboard-aware scrollable interface with photo integration
- All validation and user feedback messages localized

### Localization & UI
- Complete i18n implementation with Danish and English support
- Device locale detection with Danish default for Danish users
- Language selector in More screen for manual switching
- Logo integration: auth screen (large), footer (small), home screen (large)
- Consistent header/footer system across all authenticated screens
- All user-facing strings localized (forms, navigation, messages, etc.)

### Permissions Management
- Camera and location permissions requested automatically on login
- Permission status stored in AsyncStorage for persistence
- Localized permission dialogs with settings redirect on denial
- Graceful handling of denied permissions with user feedback

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
- Localization via `t()` function throughout all components
- Logo component with size props: 'small' | 'medium' | 'large'
- Consistent header/footer pattern with localized content

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
- Full localization system (Danish/English) with language switcher
- Logo integration on auth, home, and footer components
- Automatic permission requests for camera and location on login
- Android builds successfully compile and run
- Ready for business logic development and data models

When implementing features, the foundation is solid - focus on extending the existing screens with business logic and connecting forms to Supabase database tables.
- Supabase client configured but auth integration is commented out
- No database schema or business logic yet
- Ready for feature development on top of auth foundation

When implementing features, prioritize completing the OAuth → Supabase auth flow in `components/Auth.tsx` before adding new functionality.
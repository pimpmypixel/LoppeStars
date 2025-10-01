# Copilot Instructions for Loppestars

## Project Overview
This is a React Native/Expo mobile application with Google OAuth authentication and Supabase backend integration.
**The mobile app code is located in the `app/` folder.** The app makes it fun and easy to rate the stalls at your local flea market in a friendly way. Users can browse nearby markets, rate stalls with photos, and view their ratings.

## Architecture & Stack
- **Frontend**: React Native 0.81.4 with Expo SDK 54 (located in `app/` folder)
- **Backend**: Supabase Cloud
- **Infrastructure**: AWS ECS with Docker containers for faceblur and scraping services, Cloudflare DNS
- **Auth**: Google Sign-in via `@react-native-google-signin/google-signin` and Supabase Auth
- **Database**: PostgreSQL via Supabase Cloud
- **UI**: NativeWind with shadcn/ui-inspired components, Lucide icons
- **State**: React Context for auth and theme, AsyncStorage for persistence
- **Localization**: i18n-js with Danish and English support
- **Permissions**: Expo Camera, Location, and Media Library with persistent permission storage
- **Navigation**: React Navigation bottom tabs (Home | Markets | Add Item | More) with nested stack in More
- **Image Processing**: Expo Image Manipulator for photo uploads
- **Build Tooling**: Expo CLI, TypeScript strict mode, Metro bundler
- **Configuration**: All environment variables centralized in root `.env` file

## Key Files & Structure
**All mobile app files are located in the `app/` folder:**
```
app/
  App.tsx                    # Main app entry point with ThemeProvider, AuthProvider, and AuthWrapper
  components/
    AuthWrapper.tsx          # Session management wrapper with OAuth deep linking
    SupabaseOfficialAuth.tsx # Google OAuth login screen with Supabase integration
    AuthGuard.tsx            # HOC for protecting authenticated routes
    AppHeader.tsx            # Reusable header component for all authenticated screens
    AppFooter.tsx            # Reusable footer component with logo and localized text
    Logo.tsx                 # Logo component with multiple sizes (small/medium/large)
    CameraModal.tsx          # Full-screen camera modal with photo capture and gallery access
    RatingSlider.tsx         # Custom star rating component
    PhotoUploadProgress.tsx  # Progress indicator for photo uploads
    LanguageSelector.tsx     # Language switcher component (English/Danish)
    ui/                      # shadcn/ui-inspired component library
  contexts/
    AuthContext.tsx          # Authentication state management
    ThemeContext.tsx         # Theme provider with light/dark mode support
  hooks/
    usePhotoUpload.ts        # Custom hook for photo upload logic
  screens/
    HomeScreen.tsx           # Home tab with welcome message and app overview
    MarketsScreen.tsx        # Markets tab with location-based market discovery
    RatingScreen.tsx         # Add Item tab with stall rating form, camera integration
    MoreScreen.tsx           # More tab with menu items and nested navigation
    more/                    # Nested screens under More tab
      MyRatingsScreen.tsx    # User's submitted ratings
      AboutScreen.tsx        # App information
      PrivacyScreen.tsx       # Privacy policy
      OrganiserScreen.tsx    # For market organizers
      AdvertisingScreen.tsx  # Advertising information
      ContactScreen.tsx      # Contact details
  navigation/
    AppNavigator.tsx         # Bottom tab navigation setup
    MoreNavigator.tsx        # Stack navigator for More tab screens
  utils/
    supabase.ts              # Supabase client configuration with platform-specific URLs
    localization.ts          # i18n configuration and language management
    permissions.ts           # Camera, location, and media permissions management
    imageUpload.ts           # Photo upload utilities with Supabase storage
  locales/
    en.json                  # English translations for all app strings
    da.json                  # Danish translations for all app strings
  types/
    env.d.ts                 # Environment variable types
    lucide-react-native.d.ts # Icon library types
    react-native-config.d.ts # Config plugin types
  assets/
    logo.png                 # App logo (284x279 PNG)
    adaptive-icon.png        # Android adaptive icon
    favicon.png              # Web favicon
    splash-icon.png          # App splash screen icon
  android/                   # Android-specific configuration
  ios/                      # iOS-specific configuration
```

**Other project directories:**
```
supabase/                   # Supabase backend (functions, migrations, workers)
aws/                       # AWS CDK infrastructure deployment (ECS, Docker containers)
docs/                      # Documentation files
keys/                      # OAuth credentials (not committed)
```

## Development Patterns

### Navigation Structure
- Bottom tab navigation with 4 screens: Home, Markets, Add Item (Rating), More
- More tab uses nested stack navigation for sub-screens
- AuthWrapper manages authentication state and screen transitions
- AuthGuard HOC protects screens requiring authentication
- Session persistence with AsyncStorage and Supabase session monitoring
- Clean logout functionality that returns to login screen

### Authentication Flow
- Google OAuth via Supabase Auth with native Google Sign-In
- Deep linking support for OAuth callbacks
- Platform-specific Supabase URLs (10.0.2.2 for Android emulator, 127.0.0.1 for iOS)
- Auto-refresh tokens and session management
- AsyncStorage for session persistence on mobile platforms
- Automatic permissions request (camera + location) on successful login
- Logo display on auth screen with localized welcome messages

### Camera and Photo Integration
- Expo Camera integrated as full-screen modal (CameraModal component)
- Triggered from rating screen via camera button
- Proper permission handling with localized prompts and settings redirect
- Image preview with save/retake options, front/back camera toggle
- Gallery access via ImagePicker with consistent UI
- Photo upload to Supabase Storage with progress tracking
- Image manipulation for optimization before upload

### Form Handling and Rating System
- Stall rating form with photo upload, location, and rating slider
- Multi-field form with localized labels and validation messages
- Supabase integration for storing ratings and market data
- Location services for market discovery and stall positioning
- Loading states, error handling, and user feedback
- All validation and user feedback messages localized

### Markets and Location Services
- Location-based market discovery with distance calculation
- Market listings with active/inactive status
- GPS permission management with graceful degradation
- Market details with stall information and ratings

### Localization & UI
- Complete i18n implementation with Danish and English support
- Device locale detection with Danish default for Danish users
- Language selector in More screen for manual switching
- Logo integration: auth screen (large), footer (small), home screen (large)
- Consistent header/footer system across all authenticated screens
- Theme support with light/dark mode (context-based)
- shadcn/ui-inspired component library with NativeWind styling
- All user-facing strings localized (forms, navigation, messages, etc.)

### Permissions Management
- Camera, location, and media library permissions requested automatically on login
- Permission status stored in AsyncStorage for persistence
- Localized permission dialogs with settings redirect on denial
- Graceful handling of denied permissions with user feedback

### Supabase Integration
- Cloud-hosted Supabase instance for production and development
- Database schema managed through Supabase dashboard
- Edge Functions for server-side logic
- Storage for photo uploads
- Auth providers configured (Google OAuth working)
- Real-time subscriptions for live data updates

### Component Patterns
- Functional components with hooks
- Direct export from component functions (no named exports)
- NativeWind for styling with Tailwind CSS classes
- Platform-specific configurations in utils
- Localization via `t()` function throughout all components
- Context providers for global state (Auth, Theme)
- Custom hooks for reusable logic (usePhotoUpload)
- TypeScript strict mode with proper type definitions
- shadcn/ui component library with consistent API

## Development Workflow

### Local Development
```bash
cd app/
npm run start          # Start Expo development server
npm run android        # Run on Android emulator
npm run ios           # Run on iOS simulator (macOS only)
npm run web           # Run in web browser
npm run ts:check      # TypeScript type checking
npm run ts:watch      # TypeScript watch mode
```

### Supabase Cloud Development
- Cloud-hosted Supabase instance for production and development
- Database schema managed through Supabase dashboard
- Google OAuth configured with client IDs in environment
- Migrations in `supabase/migrations/`
- Edge Functions in `supabase/functions/`

### Build Process
- Uses Expo CLI for bundling and native builds
- Android build configuration in `android/app/build.gradle`
- iOS configuration in `ios/` folder
- Environment variables managed via `react-native-config`
- EAS Build for production builds

## Configuration Notes
- Google OAuth client IDs are environment-specific (web and Android)
- Supabase URLs differ by platform for local development
- Environment variables loaded via `react-native-config`
- Platform detection for web vs. mobile storage
- TypeScript strict mode enabled
- NativeWind for styling with Tailwind configuration
- Patch-package used for dependency patches
- All environment variables centralized in root `.env` file

## Current State
- Complete Google OAuth → Supabase authentication flow working
- Bottom tab navigation with 4 functional screens (Home, Markets, Rating, More)
- Location-based market discovery and display
- Stall rating system with photo upload and GPS integration
- Camera functionality with proper permissions and image processing
- Full localization system (Danish/English) with language switcher
- Theme support with context-based light/dark mode
- Supabase database integration with migrations and storage
- Edge Functions for server-side processing
- Comprehensive permission management
- Ready for production deployment and feature extensions

When implementing features, the foundation is solid with authentication, navigation, theming, and core functionality in place. Focus on extending the rating system, market management, and user experience enhancements.
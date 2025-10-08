# Copilot Instructions for Loppestars

## Key Agent Guidelines (2025)
- **Use `bun` for all JS/TS package management and scripts.** Never use `npm` or `yarn` commands.
- **Do not generate .md summaries or documentation files after each agent task.** Only update or create documentation when explicitly requested.
- **Commit messages must be short, clear, and include a relevant emoji.** Example: `fix: 🐛 handle missing API key in AndroidManifest`
- **The ECS deploy GitHub Actions workflow is fully functional.** It includes Cloudflare DNS check/update and CloudWatch log group creation. No manual post-deploy steps are needed.
- **Each main folder should have a `.vscode/` directory with a `copilot-instructions.md` for folder-specific Copilot guidance.** Always check for and follow these local instructions when working in a subproject.

## Project Overview
This is an app that makes it fun and easy to rate the stalls at your local flea market in a friendly way. Users can browse nearby markets, rate the market and the stalls with photos, and view ratings.
It consists of several central components and services, including a Supabase Cloud instance and a Dockerized API for face pixelation and market data scraping, deployed on AWS ECS. Github Actions is used for CI/CD of the Docker API. Copilot Tnstructions are provided globally as well as on a per-folder basis.

**The mobile app code is located in the `app/` folder.** The app  is a React Native/Expo mobile application. It has Google OAuth authentication and Supabase backend integration.
**The Dockerized FastApi is located in the `api/` folder.** It provides endpoints for face detection and pixelation in images, as well as a Scrapy web scraper for fetching market data from multiple local websites. The API can run locally and is deployed to AWS ECS behind a public loadbalancer using GitHub Actions for CI/CD. The DNS for the loadbalancer is hosted in **CloudFlare**. Supabase cron edge function is used to trigger the scraper once a day.
**The Supabase backend is located in the `supabase/` folder.** It contains database migrations and edge functions. The Supabase instance is hosted on Supabase Cloud and must not be run locally. The `api-proxy` edge function is used to interact with the Docker API from the mobile app.
**The AWS infrastructure code is located in the `aws/` folder.** It contains an AWS CDK project that defines the ECS cluster, service, and task definition for deploying the Docker API. The infrastructure is deployed using `cdk deploy` and is hosted in the eu-central-1 region.



## Architecture & Stack
- **Frontend**: React Native 0.81.4 with Expo SDK 54 (located in `app/` folder)
- **Backend**: Supabase Cloud
- **Infrastructure**: AWS ECS with Docker containers for faceblur and scraping services, Cloudflare DNS
- **CI/CD**: GitHub Actions for automated Docker API deployment to AWS ECS
- **API**: FastAPI with OpenCV for face detection and pixelation, Scrapy for web scraping (located in `api/` folder)
- **Database**: PostgreSQL via Supabase Cloud
- **Storage**: Supabase Storage for photo uploads
- **Auth**: Google OAuth via Supabase Auth and native Google Sign-In
- **Localization**: i18n-js with Danish and English support
- **State Management**: All state is controller hierarchically using Zustand and AsyncStorage
- **Navigation**: React Navigation with bottom tabs and nested stacks
- **Styling**: UI Kitten
- **Auth**: Google Sign-in via `@react-native-google-signin/google-signin` and Supabase Auth
- **Permissions**: Expo Camera, Location, and Media Library with persistent permission storage
- **Configuration**: All environment variables centralized in root `.env` file
- **TypeScript**: Strict mode enabled with proper type definitions

## Development Patterns

### Navigation Structure
- Bottom tab navigation with 4 screens: Home, Markets, Add Item (Rating), More
- More tab uses nested stack navigation for sub-screens
- AuthWrapper manages authentication state and screen transitions
- AuthGuard HOC protects screens requiring authentication
- Session persistence with AsyncStorage and Supabase session monitoring
- Clean logout functionality that returns to login screen

### Authentication Flow
- Google OAuth via Supabase Auth with native Google and Facebook Sign-In
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
- Face detection and pixelation via Docker API endpoint
- Loading states, error handling, and user feedback

### Form Handling and Rating System
- Stall rating form with photo upload, location, and rating stars 1-10
- Multi-field form with localized labels and validation messages
- Supabase integration for storing ratings and market data
- Location services for market discovery and stall positioning
- Loading states, error handling, and user feedback
- All validation and user feedback messages localized

### Markets and Location Services
- Location-based market discovery with distance calculation
- Market listings with average ratings and photo thumbnails
- Market detail screen with stall listings and ratings
- Map integration with Google Maps SDK for market locations
- Market search functionality with real-time filtering
- GPS permission management with graceful degradation
- Market details with stall information and ratings

### Localization & UI
- Complete i18n implementation with Danish and English support
- Device locale detection with Danish default for Danish users
- Language selector in More screen for manual switching
- Logo integration: auth screen (large), footer (small), home screen (large)
- Consistent header/footer system across all authenticated screens
- Theme support with light/dark mode (context-based)
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
- UI Kitten for consistent styling
- Zustand for state management with context providers
- AsyncStorage for persistent storage
- Modular folder structure (components, screens, hooks, utils)
- Reusable components (Button, Input, Header, Footer, MarketItem)
- Centralized API client for Supabase and Docker API interactions
- Error handling and loading states in all async operations
- Theming with context and custom hooks
- Form components with validation and user feedback
- Image handling with Expo Camera and ImagePicker
- Location services with Expo Location
- Platform-specific configurations in utils
- Localization via `t()` function throughout all components
- Context providers for global state (Auth, Theme)
- Custom hooks for reusable logic (usePhotoUpload)

bun run start          # Start Expo development server
bun run web           # Run in web browser
## Development Workflow

### App Development (always use bun)
```bash
cd app/
bun run start          # Start Expo development server
bun run android        # Run on Android emulator
bun run ios            # Run on iOS simulator (macOS only)
bun run web            # Run in web browser
bun run ts:check       # TypeScript type checking
bun run ts:watch       # TypeScript watch mode
```

### Supabase Cloud Development
- Cloud-hosted Supabase instance for production and development
- Database schema managed through Supabase dashboard
- Google OAuth configured with client IDs in environment
- Migrations in `supabase/migrations/`
- Edge Functions in `supabase/functions/`


### Build Process
- Uses Expo CLI for bundling and native builds (always invoked via bun)
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

## Docker API & CI/CD

### API Structure
The API is located in the `api/` folder and includes:
- `main.py` - FastAPI application with face processing endpoints
- `face_processor.py` - Face detection and blurring logic using OpenCV
- `scraper_cron.py` - Scheduled market data scraping
- `scrapy_project/` - Scrapy spiders for market listings
- `requirements.txt` - Python dependencies
- `Dockerfile` (root level) - Container definition for ECS deployment


### Deployment Pipeline
**IMPORTANT**: When making changes to the Docker API (`api/` folder or root `Dockerfile`):
1. **Edit** API files, dependencies, or Dockerfile.
2. **Commit & Push** with a short, clear, emoji commit message to `main` or `kitty`.
3. **Monitor GitHub Actions**:
   - Use `gh run list --limit 1 | cat` to check latest workflow status
   - Use `gh run view <RUN_ID> --log | cat` for logs if failed
   - Workflow: `.github/workflows/deploy-ecs.yml`
4. **Verify Deployment**:
   - Workflow completes successfully (✅ SUCCESS)
   - ECS service runs new task with latest image digest
   - Cloudflare DNS and CloudWatch log group are checked/updated automatically
   - No manual post-deploy steps required

### GitHub Actions Workflow
The automated deployment workflow (`.github/workflows/deploy-ecs.yml`):
- **Triggers**: Push to `main` or `kitty` branches
- **Steps**:
  1. Checkout code
  2. Configure AWS credentials
  3. Login to Amazon ECR
  4. Build Docker image with build args (Supabase credentials, bucket names)
  5. Push image to ECR with commit SHA tag
  6. Register new ECS task definition (family: `loppestars`, container: `web`)
  7. Update ECS service with new task definition
  8. Wait for deployment to stabilize
  9. Verify deployment by comparing image digests

### Common CI/CD Issues & Solutions
1. **ECR Immutable Tag Error**: Only use commit SHA tags, never `latest`
2. **Cluster/Service Discovery**: Use first available cluster/service (CDK-generated names)
3. **Container Name Mismatch**: Task definition must use container name `web` (not `loppestars-container`)
4. **Task Definition Format**: Ensure valid JSON with proper quotes, no trailing commas
5. **Environment Variables**: Set as GitHub Secrets (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, AWS credentials)

### AWS Infrastructure
- **Region**: eu-central-1
- **ECS Cluster**: LoppestarsEcsStack-ClusterEB0386A7-3Mzih57cTorn (Fargate)
- **ECS Service**: LoppestarsEcsStack-Service9571FDD8-mtj8oW2z8iEu
- **ECR Repository**: cdk-hnb659fds-container-assets-035338517878-eu-central-1
- **Task Definition**: Family `loppestars`, Container `web`, Port 8080
- **Resources**: 256 CPU, 512 MB memory
- **Logging**: CloudWatch logs group `/ecs/loppestars`
- **Execution Role**: arn:aws:iam::035338517878:role/ecsTaskExecutionRole

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
- **Connectivity check system on app startup (database + API health verification)**
- **Automated Docker API deployment via GitHub Actions to AWS ECS**
- Ready for production deployment and feature extensions

When implementing features, the foundation is solid with authentication, navigation, theming, and core functionality in place. Focus on extending the rating system, market management, and user experience enhancements.

**When working on the API**: Always commit with a short, emoji message, push to trigger CI/CD, and monitor GitHub Actions for ECS and Cloudflare DNS updates.
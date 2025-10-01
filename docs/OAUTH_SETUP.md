# OAuth Setup Instructions

## Current Status
✅ Google OAuth - Already configured and working  
🚧 Facebook OAuth - Needs setup (placeholder ID in .env)

## Google OAuth (Working)
- Web Client ID: `512928992479-i0sf04bb1qkn1eic3pbh0oj1hpq9iq3q.apps.googleusercontent.com`
- Android Client ID: `512928992479-md76h3p9hk83et9eg9g71jp0ho01os52.apps.googleusercontent.com`
- Status: ✅ Configured in Supabase and working

## Facebook OAuth Setup (TODO)

### 1. Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app for "Consumer" use case
3. Add "Facebook Login" product
4. Get your App ID from the app dashboard

### 2. Configure OAuth URLs
Add these redirect URLs to your Facebook app settings:
```
loppestars://
exp://192.168.1.108:8081
exp://10.0.2.2:8081
```

### 3. Update Environment Variables
Replace the placeholder in `.env`:
```bash
FACEBOOK_APP_ID=your_actual_facebook_app_id_here
```

### 4. Configure Supabase
Add Facebook as OAuth provider in Supabase:
1. Go to Authentication > Providers
2. Enable Facebook
3. Add your App ID and App Secret
4. Set redirect URL: `http://localhost:54321/auth/v1/callback`

## Testing
- **Emulator**: Uses Google OAuth (working)  
- **Real Device**: Will use both Google and Facebook OAuth once Facebook is configured
- **Expo Go**: Compatible with expo-auth-session (no native modules needed)

## Next Steps
1. Get Facebook App ID and update .env
2. Configure Facebook OAuth in Supabase  
3. Test on real device via Expo Go
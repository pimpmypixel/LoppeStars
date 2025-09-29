# Android Configuration Notes

## Important: strings.xml File

The file `/android/app/src/main/res/values/strings.xml` contains the Android-specific Google OAuth client ID:

```xml
<string name="server_client_id">512928992479-md76h3p9hk83et9eg9g71jp0ho01os52.apps.googleusercontent.com</string>
```

**This file must be kept intact for Android OAuth to work properly.**

## Why Different Client IDs?

- **Web Client ID** (`GOOGLE_WEB_CLIENT_ID`): Used by React Native JavaScript code and Supabase
- **Android Client ID**: Used by the native Android OAuth implementation

Both are required for full OAuth functionality across platforms.

## Security Considerations

While the Android client ID is in the strings.xml file, this is standard practice for Android OAuth:

1. **Android Client IDs are not secret** - They're designed to be bundled with the app
2. **The strings.xml file is compiled into the APK** - It's not accessible as plain text in production
3. **OAuth security relies on package name + SHA fingerprint** - Not just the client ID

## Future Migration Options

If you want to move the Android client ID to environment variables:

1. **Option 1**: Use Expo Config Plugins to replace strings.xml values during build
2. **Option 2**: Use gradle build scripts to inject environment variables
3. **Option 3**: Use a prebuild script that modifies strings.xml before compilation

For now, keeping it in strings.xml is the most reliable approach that ensures Android OAuth continues to work.

## Development Setup

When setting up a new development environment:

1. Ensure the `.env` file contains both web and Android client IDs
2. The strings.xml file should remain unchanged
3. Both values should match your Google Cloud Console OAuth configuration

## Production Deployment

For production builds:
- The strings.xml file will be automatically included in the Android APK
- Ensure your production Google OAuth configuration includes both client IDs
- Update the strings.xml with production Android client ID if different from development
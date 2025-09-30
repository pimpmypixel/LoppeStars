If you see `Missing Supabase configuration` at runtime, it means the app couldn't read SUPABASE_* values from the environment.

Common causes and fixes:

- This repo uses `react-native-config` to inject native env variables into Android/iOS builds. After changing `.env`, you must rebuild native apps (expo run:android / expo run:ios or a fresh EAS build) for the native side to pick up new values.

- For Metro/JS-only runs (Expo Go), ensure you have a `.env` at project root and use a dev-only fallback in `utils/supabase.ts` if you want a JS-only override.

- Do NOT commit `.env` with secrets. Use `.env.example` for placeholders.

Quick checks:
- Verify `.env` exists at project root and contains SUPABASE_URL or SUPABASE_URL_IOS/ANDROID and SUPABASE_ANON_KEY.
- If running on Android emulator, `SUPABASE_URL_ANDROID` should use `http://10.0.2.2:54321` for local Supabase.

If you want, I can add a JS-only fallback that reads from process.env or a `.env.local` file for Metro development (non-native).
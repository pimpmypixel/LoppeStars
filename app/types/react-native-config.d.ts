declare module 'react-native-config' {
  type ConfigValue = string | undefined;

  interface Env {
    SUPABASE_URL?: ConfigValue;
    SUPABASE_URL_ANDROID?: ConfigValue;
    SUPABASE_URL_IOS?: ConfigValue;
    SUPABASE_ANON_KEY?: ConfigValue;
    GOOGLE_WEB_CLIENT_ID?: ConfigValue;
    GOOGLE_ANDROID_CLIENT_ID?: ConfigValue;
    FACEBOOK_APP_ID?: ConfigValue;
  }

  const Config: Env & Record<string, ConfigValue>;
  export default Config;
}

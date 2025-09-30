import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../utils/supabase';
import { t } from '../utils/localization';
import Logo from './Logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Text } from './ui/text';
import { Facebook, Mail, Shield } from 'lucide-react-native';

// Complete the auth session for web browser
WebBrowser.maybeCompleteAuthSession();

type OAuthProvider = 'google' | 'facebook';

type ParsedParams = {
  access_token?: string;
  refresh_token?: string;
  code?: string;
  error?: string;
  error_description?: string;
};

export default function SupabaseOfficialAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);

  // Create redirect URI for this app
  const redirectTo = useMemo(
    () =>
      makeRedirectUri({
        scheme: 'loppestars',
        path: 'auth/callback',
        preferLocalhost: true,
      }),
    []
  );

  const resetLoadingState = useCallback(() => {
    setIsLoading(false);
    setLoadingProvider(null);
  }, []);

  const handleOAuthResponse = useCallback(
    async (url?: string | null) => {
      if (!url) {
        return;
      }

      const { params } = QueryParams.getQueryParams(url);
      const parsed = params as ParsedParams;

      if (parsed?.error || parsed?.error_description) {
        console.error('❌ Supabase OAuth error:', parsed.error, parsed.error_description);
        Alert.alert(t('common.error'), parsed.error_description || parsed.error || t('auth.signInError'));
        resetLoadingState();
        return;
      }

      try {
        if (parsed?.access_token && parsed?.refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token,
          });

          if (error) {
            throw error;
          }
        } else if (parsed?.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(parsed.code);
          if (error) {
            throw error;
          }
        }
      } catch (error: any) {
        console.error('❌ Supabase session error:', error);
        Alert.alert(t('common.error'), error?.message || t('auth.signInError'));
      } finally {
        resetLoadingState();
      }
    },
    [resetLoadingState]
  );

  useEffect(() => {
    const subscription = Linking.addEventListener('url', event => handleOAuthResponse(event.url));

    Linking.getInitialURL().then(initialUrl => {
      if (initialUrl) {
        handleOAuthResponse(initialUrl);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [handleOAuthResponse]);

  const performOAuth = useCallback(
    async (provider: OAuthProvider) => {
      try {
        setIsLoading(true);
        setLoadingProvider(provider);

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
            skipBrowserRedirect: true,
          },
        });

        if (error) {
          throw error;
        }

        if (data?.url) {
          const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

          if (result.type === 'success') {
            await handleOAuthResponse(result.url);
          } else if (result.type === 'cancel') {
            resetLoadingState();
          }
        }
      } catch (error: any) {
        console.error(`❌ ${provider} OAuth error:`, error);
        Alert.alert(t('common.error'), error?.message || t('auth.signInError'));
        resetLoadingState();
      }
    },
    [redirectTo, handleOAuthResponse, resetLoadingState]
  );

  return (
    <View className="flex-1 items-center justify-center bg-background px-6" {...({} as any)}>
      <Card className="w-full max-w-md gap-6">
        <CardHeader className="items-center gap-3 pb-0">
          <Logo size="large" />
          <CardTitle className="text-center text-2xl">
            {t('common.welcome')}
          </CardTitle>
          <CardDescription className="text-center text-base">
            {t('auth.pleaseSignIn')}
          </CardDescription>
        </CardHeader>

        <CardContent className="gap-4 pt-6">
          <Button
            variant="destructive"
            className="h-12"
            onPress={() => performOAuth('google')}
            disabled={isLoading}
            {...({} as any)}
          >
            {loadingProvider === 'google' ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View className="flex-row items-center gap-2" {...({} as any)}>
                <Mail size={20} color="#ffffff" />
                <Text className="text-primary-foreground text-base font-semibold">
                  {t('auth.signInWithGoogle')}
                </Text>
              </View>
            )}
          </Button>

          <Button
            className="h-12 bg-[#1877F2] dark:bg-[#1877F2]"
            onPress={() => performOAuth('facebook')}
            disabled={isLoading}
            {...({} as any)}
          >
            {loadingProvider === 'facebook' ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View className="flex-row items-center gap-2" {...({} as any)}>
                <Facebook size={20} color="#ffffff" />
                <Text className="text-primary-foreground text-base font-semibold">
                  {t('auth.signInWithFacebook')}
                </Text>
              </View>
            )}
          </Button>

          <Button
            variant="link"
            className="justify-center"
            onPress={() => Linking.openURL('https://loppestars.com/privacy')}
            {...({} as any)}
          >
            <View className="flex-row items-center gap-2" {...({} as any)}>
              <Shield size={18} color="#2563eb" />
              <Text className="underline">{t('auth.privacyPolicy')}</Text>
            </View>
          </Button>

          <Card className="border-dashed border-muted bg-muted/40">
            <CardContent className="items-center gap-2 p-4">
              <Text variant="muted" className="text-center text-sm">
                {t('auth.signIn')}
              </Text>
              <Text variant="muted" className="text-center text-xs text-muted-foreground/80">
                Redirect URI: {redirectTo}
              </Text>
            </CardContent>
          </Card>

          {__DEV__ && (
            <Card className="bg-card/60">
              <CardContent className="gap-3">
                <Text variant="muted" className="text-xs">
                  OAuth debug
                </Text>
                <Button
                  variant="outline"
                  className="h-10"
                  onPress={async () => {
                    console.log('🔧 Manual session check triggered...');
                    const { data: session, error } = await supabase.auth.getSession();
                    if (session?.session?.user) {
                      console.log('✅ Session found:', session.session.user.email);
                      Alert.alert('Session Found', session.session.user.email ?? '');
                    } else {
                      Alert.alert('No Session', 'No authenticated session found');
                    }
                    if (error) {
                      console.error('❌ Manual check error:', error);
                      Alert.alert('Error', error.message);
                    }
                  }}
                  {...({} as any)}
                >
                  <Text className="font-medium">Check Session</Text>
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </View>
  );
}
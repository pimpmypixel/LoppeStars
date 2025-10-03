import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, View, StyleSheet } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../utils/supabase';
import { useTranslation } from '../utils/localization';
import Logo from './Logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui-kitten';
import { Button } from './ui-kitten';
import { Text } from './ui-kitten';
import { Facebook, Mail, Shield } from 'lucide-react-native';
import { OAuthProvider, ParsedParams } from '../types/components/SupabaseOfficialAuth';
import { Layout } from '@ui-kitten/components';

export default function SupabaseOfficialAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const { t } = useTranslation();

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
    <Layout style={styles.container} level="2">
      <Card style={styles.card}>
        <CardHeader style={styles.cardHeader}>
          <Logo size="large" />
          <CardTitle style={styles.title}>
            {t('common.welcome')}
          </CardTitle>
          <CardDescription style={styles.description}>
            {t('auth.pleaseSignIn')}
          </CardDescription>
        </CardHeader>

        <CardContent style={styles.cardContent}>
          <Button
            variant="destructive"
            style={styles.authButton}
            onPress={() => performOAuth('google')}
            disabled={isLoading}
          >
            {loadingProvider === 'google' ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View style={styles.buttonContent}>
                <Mail size={20} color="#ffffff" />
                <Text style={styles.buttonText}>
                  {t('auth.signInWithGoogle')}
                </Text>
              </View>
            )}
          </Button>

          <Button
            style={{ ...styles.authButton, ...styles.facebookButton }}
            onPress={() => performOAuth('facebook')}
            disabled={isLoading}
          >
            {loadingProvider === 'facebook' ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View style={styles.buttonContent}>
                <Facebook size={20} color="#ffffff" />
                <Text style={styles.buttonText}>
                  {t('auth.signInWithFacebook')}
                </Text>
              </View>
            )}
          </Button>

          <Button
            variant="link"
            style={styles.linkButton}
            onPress={() => Linking.openURL('https://loppestars.com/privacy')}
          >
            <View style={styles.buttonContent}>
              <Shield size={18} color="#2563eb" />
              <Text style={styles.linkText}>{t('auth.privacyPolicy')}</Text>
            </View>
          </Button>

          <Card style={styles.infoCard}>
            <CardContent style={styles.infoCardContent}>
              <Text variant="muted" style={styles.infoText}>
                {t('auth.signIn')}
              </Text>
              <Text variant="small" style={styles.redirectText}>
                Redirect URI: {redirectTo}
              </Text>
            </CardContent>
          </Card>

          {__DEV__ && (
            <Card style={styles.debugCard}>
              <CardContent style={styles.debugCardContent}>
                <Text variant="small" style={styles.debugText}>
                  OAuth debug
                </Text>
                <Button
                  variant="outline"
                  style={styles.debugButton}
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
                >
                  <Text>Check Session</Text>
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 450,
  },
  cardHeader: {
    alignItems: 'center',
    gap: 12,
    paddingBottom: 0,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
  },
  description: {
    textAlign: 'center',
    fontSize: 16,
  },
  cardContent: {
    gap: 16,
    paddingTop: 24,
  },
  authButton: {
    height: 48,
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    justifyContent: 'center',
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  infoCard: {
    borderStyle: 'dashed',
    borderWidth: 1,
    opacity: 0.7,
  },
  infoCardContent: {
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 14,
  },
  redirectText: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.8,
  },
  debugCard: {
    opacity: 0.8,
  },
  debugCardContent: {
    gap: 12,
  },
  debugText: {
    fontSize: 12,
  },
  debugButton: {
    height: 40,
  },
});
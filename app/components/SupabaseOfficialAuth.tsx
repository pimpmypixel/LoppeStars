import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, View, StyleSheet, TouchableOpacity } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../utils/supabase';
import { useTranslation } from '../utils/localization';
import Logo from './Logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from './ui-kitten';
import { Text } from './ui-kitten';
import { OAuthProvider, ParsedParams } from '../types/components/SupabaseOfficialAuth';
import { Layout, Icon } from '@ui-kitten/components';
import { GoogleIcon, FacebookIcon } from './icons';

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
          <View style={styles.authButtonsRow}>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => performOAuth('google')}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {loadingProvider === 'google' ? (
                <ActivityIndicator size="small" color="#FF9500" />
              ) : (
                <GoogleIcon width={30} height={30} style={styles.googleIcon} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.facebookButton}
              onPress={() => performOAuth('facebook')}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {loadingProvider === 'facebook' ? (
                <ActivityIndicator size="small" color="#FF9500" />
              ) : (
                <FacebookIcon width={32} height={32} style={styles.facebookIcon} />
              )}
            </TouchableOpacity>
          </View>

          {/* <Button
            // variant="ghost"
            style={styles.privacyButton}
            onPress={() => Linking.openURL('https://loppestars.com/privacy')}
          >
            <View style={styles.privacyButtonContent}>
              <Icon name="shield" style={styles.privacyIcon} fill="#FF9500" />
              <Text style={styles.privacyButtonText}>{t('auth.privacyPolicy')}</Text>
            </View>
          </Button> */}

          {/* <Card style={styles.infoCard}>
            <CardContent style={styles.infoCardContent}>
              <Text variant="muted" style={styles.infoText}>
                {t('auth.signIn')}
              </Text>
              <Text variant="small" style={styles.redirectText}>
                Redirect URI: {redirectTo}
              </Text>
            </CardContent>
          </Card> */}

          {__DEV__ && (
            <Card style={styles.debugCard}>
              <CardContent style={styles.debugCardContent}>
                <View style={styles.debugHeader}>
                  <Icon name="settings" style={styles.debugIcon} fill="#FF9500" />
                  <Text style={styles.debugText}>
                    OAuth Debug
                  </Text>
                </View>
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
                  <View style={styles.debugButtonContent}>
                    <Icon name="checkmark-circle" style={styles.debugButtonIcon} fill="#FF9500" />
                    <Text style={styles.debugButtonText}>Check Session</Text>
                  </View>
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
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.1)',
  },
  cardHeader: {
    alignItems: 'center',
    gap: 16,
    paddingBottom: 8,
    paddingTop: 8,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  description: {
    textAlign: 'center',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
  cardContent: {
    gap: 16,
    paddingTop: 24,
  },
  authButtonsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  googleButton: {
    flex: 1,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'transparent',
    // shadowColor: '#4285F4',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.2,
    // shadowRadius: 8,
    // elevation: 6,
    borderWidth: 3,
    borderColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  facebookButton: {
    flex: 1,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'transparent',
    // shadowColor: '#1877F2',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.2,
    // shadowRadius: 8,
    // elevation: 6,
    borderWidth: 3,
    borderColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    width: '100%',
  },
  buttonIcon: {
    marginRight: 8,
  },
  brandIcon: {
    width: 36,
    height: 36,
  },
  googleIcon: {
    // SVG component handles its own sizing
  },
  facebookIcon: {
    // SVG component handles its own sizing
  },
  privacyIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
    flexShrink: 1,
    textAlign: 'center',
  },
  privacyButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  privacyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  privacyButtonText: {
    color: '#FF9500',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
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
    borderRadius: 16,
    borderColor: 'rgba(255, 149, 0, 0.2)',
    borderWidth: 1,
    backgroundColor: 'rgba(255, 149, 0, 0.03)',
    opacity: 0.9,
  },
  debugCardContent: {
    gap: 16,
  },
  debugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  debugIcon: {
    width: 16,
    height: 16,
  },
  debugText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
  },
  debugButton: {
    height: 44,
    borderRadius: 12,
    borderColor: 'rgba(255, 149, 0, 0.4)',
    backgroundColor: 'rgba(255, 149, 0, 0.08)',
  },
  debugButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  debugButtonIcon: {
    width: 16,
    height: 16,
  },
  debugButtonText: {
    color: '#FF9500',
    fontSize: 13,
    fontWeight: '500',
  },
});
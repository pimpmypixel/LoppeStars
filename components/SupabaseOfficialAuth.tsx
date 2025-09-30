import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../utils/supabase';
import { t } from '../utils/localization';
import Logo from './Logo';

// Complete the auth session for web browser
WebBrowser.maybeCompleteAuthSession(); // required for web only

export default function SupabaseOfficialAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'facebook' | null>(null);
  
  // Create redirect URI for this app
  const redirectTo = makeRedirectUri();

  console.log('🔧 Redirect URI:', redirectTo);

  const createSessionFromUrl = async (url: string) => {
    console.log('🔧 Creating session from URL:', url);
    const { params, errorCode } = QueryParams.getQueryParams(url);

    if (errorCode) {
      console.error('❌ OAuth error code:', errorCode);
      throw new Error(errorCode);
    }
    
    const { access_token, refresh_token } = params;
    console.log('🔧 Tokens extracted:', { 
      hasAccessToken: !!access_token, 
      hasRefreshToken: !!refresh_token 
    });

    if (!access_token) {
      console.log('🔧 No access token found in URL');
      return;
    }

    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    
    if (error) {
      console.error('❌ Error setting session:', error);
      throw error;
    }
    
    console.log('✅ Session created successfully:', data.session?.user?.email);
    return data.session;
  };

  const performGoogleOAuth = async () => {
    try {
      console.log('🔧 Starting Google OAuth with official Supabase method...');
      setIsLoading(true);
      setLoadingProvider('google');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });

      if (error) {
        console.error('❌ Supabase OAuth error:', error);
        throw error;
      }

      if (data?.url) {
        console.log('🔧 OAuth URL generated, opening browser...');
        console.log('🔧 Redirect URI:', redirectTo);
        
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        console.log('🔧 Browser session result:', res);

        if (res.type === 'success') {
          console.log('✅ OAuth success, creating session from URL...');
          const { url } = res;
          await createSessionFromUrl(url);
        } else if (res.type === 'cancel') {
          console.log('🔧 User cancelled OAuth');
        } else {
          console.log('🔧 OAuth result:', res.type);
        }
      }
    } catch (error: any) {
      console.error('❌ Google OAuth error:', error);
      Alert.alert(t('common.error'), `Google sign-in failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const performFacebookOAuth = async () => {
    try {
      console.log('🔧 Starting Facebook OAuth with official Supabase method...');
      setIsLoading(true);
      setLoadingProvider('facebook');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error('❌ Supabase Facebook OAuth error:', error);
        throw error;
      }

      if (data?.url) {
        console.log('🔧 Facebook OAuth URL generated, opening browser...');
        
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        console.log('🔧 Facebook browser session result:', res);

        if (res.type === 'success') {
          console.log('✅ Facebook OAuth success, creating session from URL...');
          const { url } = res;
          await createSessionFromUrl(url);
        } else if (res.type === 'cancel') {
          console.log('🔧 User cancelled Facebook OAuth');
        }
      }
    } catch (error: any) {
      console.error('❌ Facebook OAuth error:', error);
      Alert.alert(t('common.error'), `Facebook sign-in failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  // Handle linking into app from OAuth redirect
  const url = Linking.useURL();
  useEffect(() => {
    if (url) {
      console.log('🔗 Deep link detected:', url);
      createSessionFromUrl(url).catch(console.error);
    }
  }, [url]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Logo size="large" />
        <Text style={styles.welcomeText}>{t('common.welcome')}</Text>
        <Text style={styles.subtitle}>{t('auth.pleaseSignIn')}</Text>
      </View>

      <View style={styles.buttonContainer}>
        {/* Google Sign In Button */}
        <TouchableOpacity
          style={[styles.socialButton, styles.googleButton]}
          onPress={performGoogleOAuth}
          disabled={isLoading}
        >
          {loadingProvider === 'google' ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text style={styles.googleButtonText}>📧</Text>
              <Text style={styles.socialButtonText}>
                {t('auth.signInWithGoogle') || 'Sign in with Google'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Facebook Sign In Button */}
        <TouchableOpacity
          style={[styles.socialButton, styles.facebookButton]}
          onPress={performFacebookOAuth}
          disabled={isLoading}
        >
          {loadingProvider === 'facebook' ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text style={styles.facebookButtonText}>📘</Text>
              <Text style={styles.socialButtonText}>
                {t('auth.signInWithFacebook') || 'Sign in with Facebook'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            Official Supabase OAuth method with proper redirect handling.
          </Text>
        </View>

        {/* Debug Info */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Using Official Supabase OAuth
            </Text>
            <Text style={styles.debugText}>
              Redirect URI: {redirectTo}
            </Text>
            
            <TouchableOpacity
              style={styles.debugButton}
              onPress={async () => {
                console.log('🔧 Manual session check triggered...');
                const { data: session, error } = await supabase.auth.getSession();
                if (session?.session?.user) {
                  console.log('✅ Manual check - Session found:', session.session.user.email);
                  Alert.alert('Session Found', `User: ${session.session.user.email}`);
                } else {
                  console.log('❌ Manual check - No session');
                  Alert.alert('No Session', 'No authenticated session found');
                }
                if (error) {
                  console.error('❌ Manual check error:', error);
                  Alert.alert('Error', `Session check error: ${error.message}`);
                }
              }}
            >
              <Text style={styles.debugButtonText}>Check Session</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 8,
    minHeight: 50,
  },
  googleButton: {
    backgroundColor: '#db4437',
  },
  facebookButton: {
    backgroundColor: '#4267B2',
  },
  socialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  googleButtonText: {
    fontSize: 20,
  },
  facebookButtonText: {
    fontSize: 20,
  },
  instructionContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    width: '90%',
  },
  instructionText: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center',
    lineHeight: 20,
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  debugButton: {
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
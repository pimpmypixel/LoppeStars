import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Config from 'react-native-config';
import { supabase } from '../utils/supabase';
import { t } from '../utils/localization';
import Logo from './Logo';
import { Facebook, Mail } from 'lucide-react-native';

// Complete the auth session for web browser
WebBrowser.maybeCompleteAuthSession();

export default function SupabaseAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'facebook' | null>(null);

  const googleClientId = Config.GOOGLE_WEB_CLIENT_ID ?? '';
  const facebookAppId = Config.FACEBOOK_APP_ID ?? '';
  const hasGoogleClientId = Boolean(Config.GOOGLE_WEB_CLIENT_ID);
  const hasFacebookAppId = Boolean(Config.FACEBOOK_APP_ID);

  // Use explicit Expo proxy URL that Google accepts
  const redirectUri = 'https://auth.expo.io/@anonymous/loppestars';

  // Google OAuth configuration
  const googleDiscovery = AuthSession.useAutoDiscovery('https://accounts.google.com');
  
  const [googleRequest, googleResponse, googlePromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleClientId || 'missing-google-client-id',
      scopes: ['openid', 'profile', 'email'],
      redirectUri: redirectUri,
    },
    googleDiscovery
  );

  // Facebook OAuth configuration  
  const facebookDiscovery = {
    authorizationEndpoint: 'https://www.facebook.com/v19.0/dialog/oauth',
  };

  const [facebookRequest, facebookResponse, facebookPromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: facebookAppId || 'missing-facebook-app-id',
      scopes: ['public_profile', 'email'],
      redirectUri: redirectUri,
    },
    facebookDiscovery
  );

  // Debug logging
  useEffect(() => {
    console.log('🔧 OAuth Debug Info:');
    console.log('   Redirect URI:', redirectUri);
    console.log('   Google Client ID:', googleClientId);
    console.log('   Facebook App ID:', facebookAppId);
  }, []);

  // Handle Google OAuth response
  useEffect(() => {
    if (googleResponse) {
      console.log('🔧 Google OAuth response received!');
      console.log('   Type:', googleResponse.type);
      console.log('   Full response:', JSON.stringify(googleResponse, null, 2));
      
      if (googleResponse.type === 'success') {
        console.log('✅ Google OAuth successful!');
        if (googleResponse.params.code) {
          console.log('🔧 Authorization code received, exchanging for tokens...');
          handleGoogleSuccess(googleResponse.params.code);
        } else {
          console.error('❌ No authorization code in successful response');
          Alert.alert(t('common.error'), 'Missing authorization code');
          setIsLoading(false);
          setLoadingProvider(null);
        }
      } else if (googleResponse.type === 'error') {
        console.error('❌ Google OAuth error:', googleResponse.error);
        console.error('   Error description:', googleResponse.params?.error_description);
        Alert.alert(t('common.error'), `Google sign-in failed: ${googleResponse.error}`);
        setIsLoading(false);
        setLoadingProvider(null);
      } else if (googleResponse.type === 'cancel') {
        console.log('🔧 Google OAuth cancelled by user');
        setIsLoading(false);
        setLoadingProvider(null);
      } else {
        console.log('🔧 Google OAuth response type:', googleResponse.type);
        setIsLoading(false);
        setLoadingProvider(null);
      }
    }
  }, [googleResponse]);

  // Handle Facebook OAuth response
  useEffect(() => {
    if (facebookResponse) {
      console.log('🔧 Facebook OAuth response:', JSON.stringify(facebookResponse, null, 2));
      
      if (facebookResponse.type === 'success') {
        handleFacebookSuccess(facebookResponse.params.access_token);
      } else if (facebookResponse.type === 'error') {
        console.error('❌ Facebook OAuth error:', facebookResponse.error);
        Alert.alert(t('common.error'), `Facebook sign-in failed: ${facebookResponse.error}`);
        setIsLoading(false);
        setLoadingProvider(null);
      } else if (facebookResponse.type === 'cancel') {
        setIsLoading(false);
        setLoadingProvider(null);
      }
    }
  }, [facebookResponse]);

  const handleGoogleSuccess = async (code: string) => {
    try {
      console.log('🔧 Processing Google OAuth code...');
      console.log('   Authorization code length:', code.length);
      console.log('   Using redirect URI:', redirectUri);
      
      // Exchange code for tokens
      const tokenRequestBody = {
        client_id: googleClientId,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      };
      
      console.log('🔧 Token exchange request:', JSON.stringify(tokenRequestBody, null, 2));
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(tokenRequestBody).toString(),
      });

      console.log('🔧 Token response status:', tokenResponse.status);
      
      const tokens = await tokenResponse.json();
      console.log('🔧 Token response:', JSON.stringify(tokens, null, 2));
      
      if (tokens.error) {
        throw new Error(tokens.error_description || tokens.error);
      }

      if (!tokens.id_token) {
        throw new Error('No ID token received from Google');
      }

      console.log('✅ Google tokens received successfully');

      // Sign in to Supabase with the ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: tokens.id_token,
      });

      if (error) {
        console.error('❌ Supabase Google auth error:', error);
        Alert.alert(t('common.error'), `${t('auth.signInError')}: ${error.message}`);
      } else {
        console.log('✅ Supabase Google auth successful!');
        console.log('   User:', data?.user?.email);
      }

    } catch (error: any) {
      console.error('❌ Google token exchange error:', error);
      Alert.alert(t('common.error'), `Google sign-in failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleFacebookSuccess = async (accessToken: string) => {
    try {
      console.log('🔧 Processing Facebook access token...');

      // Sign in to Supabase with Facebook provider
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'facebook',
        token: accessToken,
      });

      if (error) {
        console.error('❌ Supabase Facebook auth error:', error);
        Alert.alert(t('common.error'), `${t('auth.signInError')}: ${error.message}`);
      } else {
        console.log('✅ Supabase Facebook auth successful!');
      }

    } catch (error: any) {
      console.error('❌ Facebook auth processing error:', error);
      Alert.alert(t('common.error'), `Facebook sign-in failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (!hasGoogleClientId) {
        Alert.alert(t('common.error'), 'Google web client ID is not set. Please update your .env file.');
        return;
      }
      console.log('🔧 Starting Google sign-in...');
      console.log('   Google Request Ready:', !!googleRequest);
      console.log('   Redirect URI:', redirectUri);
      
      setIsLoading(true);
      setLoadingProvider('google');
      
      if (!googleRequest) {
        throw new Error('Google auth request not ready');
      }

      const result = await googlePromptAsync();
      console.log('🔧 Google prompt result:', JSON.stringify(result, null, 2));
      
      // Set a timeout in case the response doesn't come back
      setTimeout(() => {
        if (loadingProvider === 'google') {
          console.log('🔧 OAuth timeout - no response received');
          setIsLoading(false);
          setLoadingProvider(null);
          Alert.alert(
            t('common.error'), 
            'Sign-in timed out. Please try again or check your network connection.'
          );
        }
      }, 30000); // 30 second timeout
      
    } catch (error: any) {
      console.error('❌ Google sign-in initiation error:', error);
      Alert.alert(t('common.error'), `Google sign-in failed: ${error.message}`);
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const signInWithFacebook = async () => {
    try {
      if (!hasFacebookAppId) {
        Alert.alert(t('common.error'), 'Facebook app ID is not set. Please update your .env file.');
        return;
      }
      console.log('🔧 Starting Facebook sign-in...');
      setIsLoading(true);
      setLoadingProvider('facebook');
      
      if (!facebookRequest) {
        throw new Error('Facebook auth request not ready');
      }

      await facebookPromptAsync();
    } catch (error: any) {
      console.error('❌ Facebook sign-in initiation error:', error);
      Alert.alert(t('common.error'), `Facebook sign-in failed: ${error.message}`);
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

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
          onPress={signInWithGoogle}
          disabled={isLoading}
        >
          {loadingProvider === 'google' ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Mail size={22} color="white" style={styles.icon} />
              <Text style={styles.socialButtonText}>
                {t('auth.signInWithGoogle') || 'Sign in with Google'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Facebook Sign In Button */}
        <TouchableOpacity
          style={[styles.socialButton, styles.facebookButton]}
          onPress={signInWithFacebook}
          disabled={isLoading}
        >
          {loadingProvider === 'facebook' ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Facebook size={22} color="white" style={styles.icon} />
              <Text style={styles.socialButtonText}>
                {t('auth.signInWithFacebook') || 'Sign in with Facebook'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.privacyLink}
          onPress={() => Linking.openURL('https://loppestars.com/privacy')}
        >
          <Text style={styles.privacyText}>
            {t('auth.privacyPolicy')}
          </Text>
        </TouchableOpacity>

        {/* Debug Info */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Using Supabase OAuth with WebBrowser
            </Text>
            <Text style={styles.debugText}>
              Redirect: loppestars://auth/callback
            </Text>
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
  icon: {
    marginRight: 10,
  },
  privacyLink: {
    marginTop: 20,
    padding: 10,
  },
  privacyText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
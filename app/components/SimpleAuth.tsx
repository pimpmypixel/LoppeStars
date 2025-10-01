import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity, Linking, ActivityIndicator, AppState } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Config from 'react-native-config';
import { supabase } from '../utils/supabase';
import { t } from '../utils/localization';
import Logo from './Logo';
import { Facebook, Mail } from 'lucide-react-native';

// Complete the auth session for web browser
WebBrowser.maybeCompleteAuthSession();

export default function SimpleAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'facebook' | null>(null);

  // Debug logging
  useEffect(() => {
    console.log('🔧 Simple OAuth Debug Info:');
    console.log('   Google Client ID:', Config.GOOGLE_WEB_CLIENT_ID);
    console.log('   Facebook App ID:', Config.FACEBOOK_APP_ID);
  }, []);

  // Listen for app state changes to detect returning from OAuth
  useEffect(() => {
    const handleAppStateChange = (nextAppState: any) => {
      console.log('🔧 App state changed to:', nextAppState);
      if (nextAppState === 'active') {
        console.log('🔧 App became active - starting aggressive session check...');
        
        // More aggressive session checking when returning from OAuth
        let checkAttempts = 0;
        const maxCheckAttempts = 20;
        
        const checkSessionRepeatedly = async () => {
          checkAttempts++;
          console.log(`🔧 Active state session check ${checkAttempts}/${maxCheckAttempts}`);
          
          try {
            const { data: session, error } = await supabase.auth.getSession();
            if (session?.session?.user) {
              console.log('✅ Session detected after app became active:', session.session.user.email);
              return true;
            } else if (error) {
              console.log('❌ Session error after app became active:', error);
              return false;
            } else {
              console.log('🔧 No session found after app became active');
            }
            
            // Continue checking for up to 10 seconds
            if (checkAttempts < maxCheckAttempts) {
              setTimeout(checkSessionRepeatedly, 500);
            }
          } catch (err) {
            console.error('❌ Error checking session after app state change:', err);
          }
        };
        
        // Start checking immediately, then every 500ms
        checkSessionRepeatedly();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      console.log('🔧 Starting Google sign-in with Supabase direct OAuth...');
      setIsLoading(true);
      setLoadingProvider('google');

      // Use Supabase's signInWithOAuth with proper flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('❌ Supabase OAuth error:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      if (data?.url) {
        console.log('🔧 OAuth URL generated:', data.url);
        console.log('🔧 Opening OAuth URL in browser...');
        
        // Open the OAuth URL in the browser
        const result = await WebBrowser.openBrowserAsync(data.url, {
          showTitle: true,
          toolbarColor: '#6200EE',
          controlsColor: '#FFFFFF',
          enableBarCollapsing: false,
        });
        console.log('🔧 Browser result:', result);
        
        // Handle different browser result types
        if (result.type === 'opened') {
          console.log('🔧 Browser opened - starting session polling...');
          // Start polling immediately since browser opened successfully
        } else if (result.type === 'dismiss' || result.type === 'cancel') {
          console.log('🔧 User returned from OAuth browser, polling for session...');
        }
        
        // Poll for session regardless of result type (except 'locked' or errors)
        if (result.type === 'opened' || result.type === 'dismiss' || result.type === 'cancel') {
          
          // Poll for session up to 30 seconds
          let attempts = 0;
          const maxAttempts = 30;
          
          const pollForSession = async (): Promise<boolean> => {
            attempts++;
            console.log(`🔧 Session check attempt ${attempts}/${maxAttempts}`);
            
            const { data: session, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              console.error('❌ Session error:', sessionError);
              return false;
            }
            
            if (session?.session?.user) {
              console.log('✅ Successfully signed in:', session.session.user.email);
              // Force trigger auth state change to ensure UI updates
              setTimeout(() => {
                supabase.auth.getSession();
              }, 100);
              return true;
            }
            
            if (attempts < maxAttempts) {
              // More frequent polling in first 10 seconds, then slower
              const delay = attempts <= 10 ? 500 : 1000;
              await new Promise(resolve => setTimeout(resolve, delay));
              return pollForSession();
            }
            
            console.log('❌ Session polling timeout - OAuth may have failed');
            return false;
          };
          
          await pollForSession();
        }
        
        if (result.type === 'cancel') {
          console.log('🔧 User cancelled OAuth');
        } else if (result.type === 'opened') {
          console.log('🔧 OAuth browser opened - polling in background');
        } else {
          console.log('✅ OAuth completed');
        }
      }

    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);
      Alert.alert(t('common.error'), `Google sign-in failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const signInWithFacebook = async () => {
    try {
      console.log('🔧 Starting Facebook sign-in with Supabase direct OAuth...');
      setIsLoading(true);
      setLoadingProvider('facebook');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: 'loppestars://auth/callback',
          skipBrowserRedirect: false,
        }
      });

      if (error) {
        console.error('❌ Supabase Facebook OAuth error:', error);
        throw error;
      }

      if (data?.url) {
        console.log('🔧 Opening Facebook OAuth URL in browser...');
        
        const result = await WebBrowser.openBrowserAsync(data.url);
        console.log('🔧 Facebook browser result:', result);
        
        if (result.type === 'cancel') {
          console.log('🔧 User cancelled Facebook OAuth');
        } else {
          console.log('✅ Facebook OAuth completed');
        }
      }

    } catch (error: any) {
      console.error('❌ Facebook sign-in error:', error);
      Alert.alert(t('common.error'), `Facebook sign-in failed: ${error.message}`);
    } finally {
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

        {/* Instructions */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            After signing in, return to this app to continue.
          </Text>
        </View>

        {/* Debug Info */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Using Supabase Direct OAuth
            </Text>
            <Text style={styles.debugText}>
              Opens in system browser
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
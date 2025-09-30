import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { GOOGLE_WEB_CLIENT_ID } from 'react-native-dotenv';
import { supabase } from '../utils/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function DirectAuthTest() {
  const [loading, setLoading] = useState(false);

  const testDirectGoogleAuth = async () => {
    try {
      setLoading(true);
      console.log('🧪 Testing direct Google OAuth...');
      
      // Create discovery document
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
      };

      // Configure the request
      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_WEB_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.Code,
        redirectUri: 'loppestars://auth/callback',
        extraParams: {},
        state: 'test-state',
      });

      console.log('🧪 Redirect URI:', request.redirectUri);
      console.log('🧪 Request configured');

      const result = await request.promptAsync(discovery);
      console.log('🧪 Auth result:', result);

      if (result.type === 'success') {
        console.log('✅ Direct OAuth success!');
        console.log('🧪 Auth code:', result.params.code);

        // Exchange code for tokens
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: GOOGLE_WEB_CLIENT_ID,
            code: result.params.code,
            redirectUri: request.redirectUri!,
            extraParams: {},
          },
          discovery
        );

        console.log('🧪 Token exchange result:', tokenResult.accessToken ? '✅ Got tokens' : '❌ No tokens');

        if (tokenResult.idToken) {
          // Sign in to Supabase with the ID token
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: tokenResult.idToken,
          });

          if (error) {
            console.error('❌ Supabase ID token error:', error);
          } else {
            console.log('✅ Supabase sign in success:', data.user?.email);
          }
        }
      } else {
        console.log('❌ Direct OAuth failed:', result.type);
      }

    } catch (error: any) {
      console.error('❌ Direct auth test error:', error);
      Alert.alert('Test Error', error?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OAuth Debug Test</Text>
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={testDirectGoogleAuth}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Direct Google OAuth'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
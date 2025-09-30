import React from 'react';
import { View, Alert, TouchableOpacity, Linking } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Config from 'react-native-config';
import { supabase } from '../utils/supabase';
import { t } from '../utils/localization';
import Logo from './Logo';
import { Button } from './ui/button';
import { Text } from './ui/text';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function Auth() {

    const ensureGoogleClientId = React.useCallback(() => {
        if (!Config.GOOGLE_WEB_CLIENT_ID) {
            Alert.alert(t('common.error'), 'Google web client ID is not set. Please update your .env file.');
            return false;
        }
        return true;
    }, []);

    React.useEffect(() => {
        if (!Config.GOOGLE_WEB_CLIENT_ID) {
            console.warn('⚠️ GOOGLE_WEB_CLIENT_ID is not defined in the environment configuration. Google Sign-In will fail.');
            return;
        }

        GoogleSignin.configure({
            webClientId: Config.GOOGLE_WEB_CLIENT_ID,
            scopes: ['email', 'profile'],
        });
    }, []);

    const testGoogleSigninOnly = async () => {
        try {
            if (!ensureGoogleClientId()) {
                return;
            }
            console.log('🔧 Testing Google Sign-in ONLY...');
            await GoogleSignin.hasPlayServices();
            console.log('✅ Google Play Services available');

            const userInfo = await GoogleSignin.signIn();
            Alert.alert('Google Sign-in Success', `Welcome ${userInfo.data?.user?.name}!`);

            // Sign out immediately for testing
            await GoogleSignin.signOut();
            console.log('✅ Signed out successfully');

        } catch (error: any) {
            console.error('❌ Google Sign-in test error:', error);
            Alert.alert('Google Sign-in Error', error.message || 'Unknown error');
        }
    };

    const signIn = async () => {
        try {
            if (!ensureGoogleClientId()) {
                return;
            }
            console.log('🔧 Starting Google sign-in process...');

            await GoogleSignin.hasPlayServices();
            console.log('✅ Google Play Services available');

            const userInfo = await GoogleSignin.signIn();
            console.log('✅ Google Sign-in successful');

            if (userInfo.data?.idToken) {
                console.log('🔧 Attempting Supabase auth...');
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: userInfo.data.idToken,
                });

                if (error) {
                    console.error('❌ Supabase auth error:', error);
                    Alert.alert(t('common.error'), `${t('auth.signInError')}: ${error.message}`);
                } else {
                    console.log('✅ Supabase auth successful!');
                }
            } else {
                console.error('❌ No idToken received from Google sign-in');
                Alert.alert(t('common.error'), t('auth.signInError'));
            }

        } catch (error: any) {
            console.error('❌ Sign-in error:', error);
            Alert.alert(t('common.error'), `${t('auth.signInError')}: ${error.message || 'Unknown error'}`);
        }
    };

    return (
        <View className="flex-1 justify-center items-center bg-background p-5" {...({} as any)}>
            <Card className="w-full max-w-sm">
                <CardHeader className="items-center">
                    <Logo size="large" />
                    <CardTitle className="text-center mt-5">
                        {t('common.welcome')}
                    </CardTitle>
                    <Text variant="muted" className="text-center mt-2">
                        {t('auth.pleaseSignIn')}
                    </Text>
                </CardHeader>

                <CardContent className="gap-4">
                    <Button
                        variant="outline"
                        className="bg-black border-black"
                        onPress={signIn}
                        {...({} as any)}
                    >
                        <Text className="text-white font-medium">
                            🔵 {t('auth.signInWithGoogle')}
                        </Text>
                    </Button>

                    <TouchableOpacity
                        className="items-center py-2"
                        onPress={() => Linking.openURL('https://loppestars.com/privacy')}
                        {...({} as any)}
                    >
                        <Text variant="muted" className="text-xs underline">
                            {t('auth.privacyPolicy')}
                        </Text>
                    </TouchableOpacity>
                </CardContent>
            </Card>
        </View>
    );
}

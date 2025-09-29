import React from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity, Linking } from 'react-native';
import {
    GoogleSignin,
    GoogleSigninButton,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import { supabase } from '../utils/supabase';
import { t } from '../utils/localization';
import Logo from './Logo';
import { GOOGLE_WEB_CLIENT_ID } from 'react-native-dotenv';

export default function Auth() {

    // Configure Google Sign-in once when component loads
    React.useEffect(() => {
        GoogleSignin.configure({
            webClientId: GOOGLE_WEB_CLIENT_ID,
            scopes: [
                'email',
                'profile',
            ],
        });
    }, []);

    const testGoogleSigninOnly = async () => {
        try {
            console.log('🔧 Testing Google Sign-in ONLY...');
            await GoogleSignin.hasPlayServices();
            console.log('✅ Google Play Services available');

            const userInfo = await GoogleSignin.signIn();
            console.log('✅ Google Sign-in successful!');
            console.log('🔧 User info:', JSON.stringify(userInfo, null, 2));

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
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Logo size="large" />
                <Text style={styles.welcomeText}>{t('common.welcome')}</Text>
                <Text style={styles.subtitle}>{t('auth.pleaseSignIn')}</Text>
            </View>

            <View style={styles.buttonContainer}>
                <GoogleSigninButton
                    size={GoogleSigninButton.Size.Wide}
                    color={GoogleSigninButton.Color.Dark}
                    onPress={signIn}
                />

                {/* Simple test button */}
                {/* <TouchableOpacity
                    style={styles.testButton}
                    onPress={testGoogleSigninOnly}
                >
                    <Text style={styles.testButtonText}>
                        Test Google Sign-in
                    </Text>
                </TouchableOpacity> */}

                <TouchableOpacity
                    style={styles.privacyLink}
                    onPress={() => Linking.openURL('https://loppestars.com/privacy')}
                >
                    <Text style={styles.privacyText}>
                        {t('auth.privacyPolicy')}
                    </Text>
                </TouchableOpacity>
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
    testButton: {
        marginTop: 15,
        padding: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        width: '80%',
        alignItems: 'center',
    },
    testButtonText: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
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
});

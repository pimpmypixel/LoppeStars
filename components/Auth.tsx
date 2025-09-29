import React from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import {
    GoogleSignin,
    GoogleSigninButton,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import { supabase } from '../utils/supabase';
import { t } from '../utils/localization';
import Logo from './Logo';


export default function () {

    // Test Supabase connectivity
    const testSupabaseConnection = async () => {
        try {
            console.log('Testing Supabase connection...');
            const { data, error } = await supabase.auth.getSession();
            // console.log('Supabase connection test - data:', data);
            console.log('Supabase connection test - error:', error);
        } catch (err) {
            console.log('Supabase connection test failed:', err);
        }
    };

    const signIn = async () => {
        try {
            await testSupabaseConnection();
            
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            
            if (userInfo.data?.idToken) {
                console.log('Attempting Supabase auth with idToken...');
                try {
                    const { data, error } = await supabase.auth.signInWithIdToken({
                        provider: 'google',
                        token: userInfo.data.idToken,
                    });
                    if (error) {
                        console.log('Supabase auth error details:', {
                            name: error.name,
                            message: error.message,
                            status: error.status,
                        });
                        Alert.alert(t('common.error'), t('auth.signInError'));
                    }
                } catch (authError) {
                    console.log('Supabase auth exception:', authError);
                    Alert.alert(t('common.error'), t('auth.signInError'));
                }
            } else {
                console.log('No idToken received from Google sign-in');
                Alert.alert(t('common.error'), t('auth.signInError'));
            }

        } catch (error: any) {
            console.log('error', JSON.stringify(error, null, 2));
            Alert.alert(t('common.error'), t('auth.signInError'));
        }
    };

    GoogleSignin.configure({
        webClientId: '512928992479-i0sf04bb1qkn1eic3pbh0oj1hpq9iq3q.apps.googleusercontent.com', // client ID of type WEB for your server. Required to get the `idToken` on the user object, and for offline access.
        scopes: [
            /* what APIs you want to access on behalf of the user, default is email and profile
            this is just an example, most likely you don't need this option at all! */
            'https://www.googleapis.com/auth/drive.readonly',
        ],
        // offlineAccess: false, // if you want to access Google API on behalf of the user FROM YOUR SERVER
        // hostedDomain: '', // specifies a hosted domain restriction
        // forceCodeForRefreshToken: false, // [Android] related to `serverAuthCode`, read the docs link below *.
        // accountName: '', // [Android] specifies an account name on the device that should be used
        // iosClientId: '<FROM DEVELOPER CONSOLE>', // [iOS] if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
        // googleServicePlistPath: '', // [iOS] if you renamed your GoogleService-Info file, new name here, e.g. "GoogleService-Info-Staging"
        // openIdRealm: '', // [iOS] The OpenID2 realm of the home web server. This allows Google to include the user's OpenID Identifier in the OpenID Connect ID token.
        // profileImageSize: 120, // [iOS] The desired height (and width) of the profile image. Defaults to 120px
    });


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
});
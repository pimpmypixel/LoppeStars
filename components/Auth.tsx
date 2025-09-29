import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
    GoogleSignin,
    GoogleSigninButton,
    statusCodes,
} from '@react-native-google-signin/google-signin';

import { supabase } from '../utils/supabase';


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

    // Somewhere in your code
    const signIn = async () => {
        try {
            // Test connection first
            await testSupabaseConnection();
            
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            // console.log('userInfo', JSON.stringify(userInfo.data, null, 2));
            
            if (userInfo.data?.idToken) {
                console.log('Attempting Supabase auth with idToken...');
                try {
                    const { data, error } = await supabase.auth.signInWithIdToken({
                        provider: 'google',
                        token: userInfo.data.idToken,
                    });
                    // console.log('Supabase auth data:', JSON.stringify(data, null, 2));
                    if (error) {
                        console.log('Supabase auth error details:', {
                            name: error.name,
                            message: error.message,
                            status: error.status,
                            // @ts-ignore
                            cause: error.cause,
                        });
                    }
                } catch (authError) {
                    console.log('Supabase auth exception:', authError);
                }
            } else {
                console.log('No idToken received from Google sign-in');
            }

            // if (isSuccessResponse(response)) {
            //     setState({ userInfo: response.data });
            // } else {
            //     // sign in was cancelled by user
            // }

        } catch (error: any) {
            console.log('error', JSON.stringify(error, null, 2));
            // if (isErrorWithCode(error)) {
            //     switch (error.code) {
            //         case statusCodes.IN_PROGRESS:
            //             // operation (eg. sign in) already in progress
            //             break;
            //         case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            //             // Android only, play services not available or outdated
            //             break;
            //         default:
            //         // some other error happened
            //     }
            // } else {
            //     // an error that's not related to google sign in occurred
            // }
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
            <GoogleSigninButton
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Dark}
                onPress={signIn}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
});
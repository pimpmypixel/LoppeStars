import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../utils/supabase';
import { t } from '../utils/localization';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import LanguageSelector from '../components/LanguageSelector';

export default function MoreScreen() {
    const navigation = useNavigation();
    const [refreshKey, setRefreshKey] = useState(0);
    const [userInfo, setUserInfo] = useState<{ email?: string; sessionId?: string }>({});

    useEffect(() => {
        const getUserInfo = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: { session } } = await supabase.auth.getSession();
            setUserInfo({
                email: user?.email,
                sessionId: session?.access_token?.slice(-8) // Show last 8 characters
            });
        };
        getUserInfo();
    }, []);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            Alert.alert(t('common.error'), t('auth.signOutError'));
            console.error('Sign out error:', error);
        }
    };

    const handleMenuPress = (screen: string) => {
        navigation.navigate(screen as never);
    };

    const handleContact = () => {
        Linking.openURL('mailto:contact@loppestars.com');
    };

    const handleLanguageChange = () => {
        // Force re-render to update all localized strings
        setRefreshKey(prev => prev + 1);
    };

    const menuItems = [
        { title: t('more.privacy'), onPress: () => handleMenuPress('Privacy') },
        { title: t('more.organiser'), onPress: () => handleMenuPress('Organiser') },
        { title: t('more.advertising'), onPress: () => handleMenuPress('Advertising') },
        { title: t('more.about'), onPress: () => handleMenuPress('About') },
        { title: t('more.contact'), onPress: () => handleMenuPress('Contact') },
    ];

    return (
        <View style={styles.container} key={refreshKey}>
            <AppHeader title={t('more.more')} />

            <ScrollView style={styles.scrollView}>
                <LanguageSelector onLanguageChange={handleLanguageChange} />
                
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            onPress={item.onPress}
                        >
                            <Text style={styles.menuItemText}>{item.title}</Text>
                            <Text style={styles.menuItemArrow}>›</Text>
                        </TouchableOpacity>
                    ))}

                    <View style={styles.separator} />

                    <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
                        <Text style={styles.signOutText}>{t('auth.signOut')}</Text>
                    </TouchableOpacity>
                    
                    {/* User session info */}
                    <View style={styles.userInfoContainer}>
                        {userInfo.email && (
                            <Text style={styles.userInfoText}>
                                {t('user.email')}: {userInfo.email}
                            </Text>
                        )}
                        {userInfo.sessionId && (
                            <Text style={styles.userInfoText}>
                                {t('user.sessionId')}: ...{userInfo.sessionId}
                            </Text>
                        )}
                    </View>
                </View>
            </ScrollView>

            <AppFooter />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    menuContainer: {
        backgroundColor: 'white',
        marginTop: 20,
        marginHorizontal: 20,
        borderRadius: 12,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuItemText: {
        fontSize: 17,
        color: '#333',
    },
    menuItemArrow: {
        fontSize: 18,
        color: '#ccc',
    },
    separator: {
        height: 20,
        backgroundColor: '#f5f5f5',
    },
    signOutButton: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        alignItems: 'center',
    },
    signOutText: {
        fontSize: 17,
        color: '#ff3b30',
        fontWeight: '600',
    },
    userInfoContainer: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        alignItems: 'center',
    },
    userInfoText: {
        fontSize: 10,
        color: '#999',
        marginTop: 2,
    },
});
import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { useTranslation } from '../utils/localization';
import { Layout } from '@ui-kitten/components';
import AppHeader from '../components/AppHeader';
import LanguageSelector from '../components/LanguageSelector';
import { Button, Text, Card, CardContent } from '../components/ui-kitten';
import { Lock } from 'lucide-react-native';

export default function MoreScreen() {
    const navigation = useNavigation();
    const { user, session, signOut } = useAuth();
    const [refreshKey, setRefreshKey] = useState(0);
    const { t } = useTranslation();

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            Alert.alert(t('common.error'), t('auth.signOutError'));
            console.error('Sign out error:', error);
        }
    };

    const handleMenuPress = (screen: string) => {
        navigation.navigate(screen as never);
    };

    const handleLanguageChange = () => {
        // Force re-render to update all localized strings
        setRefreshKey(prev => prev + 1);
    };

    const menuItems = [
        { title: t('myRatings.title'), onPress: () => handleMenuPress('MyRatings') },
        { title: t('more.privacy'), onPress: () => handleMenuPress('Privacy') },
        { title: t('more.organiser'), onPress: () => handleMenuPress('Organiser') },
        { title: t('more.advertising'), onPress: () => handleMenuPress('Advertising') },
        { title: t('more.about'), onPress: () => handleMenuPress('About') },
        { title: t('more.contact'), onPress: () => handleMenuPress('Contact') },
    ];

    return (
        <Layout style={styles.container} level="1" key={refreshKey}>
            <AppHeader title={t('more.more')} />

            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    <LanguageSelector onLanguageChange={handleLanguageChange} />

                    <Card>
                        <CardContent style={styles.menuCard}>
                            {menuItems.map((item, index) => (
                                <View key={index}>
                                    <TouchableOpacity
                                        style={styles.menuItem}
                                        onPress={item.onPress}
                                    >
                                        <Text style={styles.menuText}>{item.title}</Text>
                                        <Text style={styles.chevron}>›</Text>
                                    </TouchableOpacity>
                                    {index < menuItems.length - 1 && (
                                        <View style={styles.separator} />
                                    )}
                                </View>
                            ))}
                        </CardContent>
                    </Card>

                    <Button
                        variant="destructive"
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <View style={styles.logoutContent}>
                            <Lock size={18} color="#ef4444" />
                            <Text style={styles.logoutText}>{t('auth.signOut')}</Text>
                            {user?.email && (
                                <Text variant="muted" style={styles.emailText}>
                                    {user.email}
                                </Text>
                            )}
                        </View>
                    </Button>
                </View>
            </ScrollView>
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1C1917',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        gap: 20,
    },
    menuCard: {
        padding: 0,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 56,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 149, 0, 0.1)',
    },
    menuText: {
        textAlign: 'left',
        flex: 1,
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    chevron: {
        color: '#FF9500',
        fontSize: 24,
        fontWeight: '600',
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(255, 149, 0, 0.1)',
        marginHorizontal: 16,
    },
    logoutButton: {
        height: 56,
        borderWidth: 2,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 16,
        marginTop: 12,
    },
    logoutContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    logoutText: {
        color: '#EF4444',
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: 0.3,
    },
    emailText: {
        color: '#A8A29E',
        fontSize: 12,
    },
});
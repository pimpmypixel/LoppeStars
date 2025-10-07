import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { useTranslation } from '../utils/localization';
import { Layout, Icon } from '@ui-kitten/components';
import AppHeader from '../components/AppHeader';
import LanguageSelector from '../components/LanguageSelector';
import { Button, Text, Card, CardContent } from '../components/ui-kitten';
import { MoreStackParamList } from '../types/navigation';
import { useScrapingStore } from '../stores/scrapingStore';
import { checkAdminStatus } from '../utils/adminCheck';

export default function MoreScreen() {
    const navigation = useNavigation<StackNavigationProp<MoreStackParamList>>();
    const { user, session, signOut } = useAuth();
    const [refreshKey, setRefreshKey] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const { t } = useTranslation();
    const { isScrapingActive, lastScrapingResult, setScrapingActive, setScrapingResult } = useScrapingStore();

    const handleLogout = async () => {
        try {
            console.log('🔓 Logout button pressed');
            await signOut();
            console.log('✅ Logout successful - session cleared');
            // AuthWrapper will automatically redirect to login screen
        } catch (error) {
            console.error('❌ Logout error:', error);
            Alert.alert(t('common.error'), t('auth.signOutError'));
        }
    };

    const handleMenuPress = (screen: keyof MoreStackParamList) => {
        try {
            console.log(`Navigating to: ${screen}`);
            navigation.navigate(screen);
        } catch (error) {
            console.error('Navigation error:', error);
            Alert.alert(t('common.error'), 'Navigation failed');
        }
    };

    const handleLanguageChange = () => {
        // Force re-render to update all localized strings
        setRefreshKey(prev => prev + 1);
    };

    const handleTriggerScraper = async () => {
        if (isScrapingActive) return;
        
        setScrapingActive(true);
        try {
            console.log('🔄 Triggering scraper...');
            const { data, error } = await supabase.functions.invoke('trigger-scraper');
            
            if (error) {
                console.error('❌ Scraper trigger error:', error);
                setScrapingResult({
                    success: false,
                    message: error.message || t('admin.scraperError'),
                    timestamp: new Date().toISOString()
                });
                Alert.alert(t('common.error'), t('admin.scraperError') + ': ' + error.message);
            } else {
                console.log('✅ Scraper triggered successfully:', data);
                setScrapingResult({
                    success: true,
                    message: t('admin.scraperTriggered'),
                    timestamp: new Date().toISOString()
                });
                Alert.alert(t('common.success'), t('admin.scraperTriggered'));
            }
        } catch (error) {
            console.error('❌ Scraper trigger error:', error);
            setScrapingResult({
                success: false,
                message: t('admin.scraperError'),
                timestamp: new Date().toISOString()
            });
            Alert.alert(t('common.error'), t('admin.scraperError'));
        }
    };

    // Check admin status when session changes
    useEffect(() => {
        const checkAdmin = async () => {
            if (session) {
                console.log('🔄 Starting admin check for session:', session.user?.email);
                const adminStatus = await checkAdminStatus(session);
                setIsAdmin(adminStatus);
                console.log(`🔐 Final admin status for ${session.user?.email}: ${adminStatus}`);
            } else {
                console.log('❌ No session available, setting admin to false');
                setIsAdmin(false);
            }
        };
        
        checkAdmin();
    }, [session]);

    const menuItems = [
        { title: t('myRatings.title'), onPress: () => handleMenuPress('MyRatings') },
        { title: t('more.privacy'), onPress: () => handleMenuPress('Privacy') },
        { title: t('more.organiser'), onPress: () => handleMenuPress('Organiser') },
        { title: t('more.advertising'), onPress: () => handleMenuPress('Advertising') },
        { title: t('more.about'), onPress: () => handleMenuPress('About') },
        { title: t('more.contact'), onPress: () => handleMenuPress('Contact') },
    ];

    const adminItems = [
        { 
            title: t('admin.triggerScraper'), 
            onPress: handleTriggerScraper,
            isLoading: isScrapingActive,
            icon: 'refresh-outline'
        },
        { title: t('myRatings.title'), onPress: () => handleMenuPress('MyRatings') },
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
                    {isAdmin && (
                    <Card style={styles.adminCard}>
                        <CardContent style={styles.menuCard}>
                            <Text style={styles.adminTitle}>{t('admin.title')}</Text>
                            {adminItems.map((item, index) => (
                                <View key={index}>
                                    <TouchableOpacity
                                        style={[styles.menuItem, item.isLoading && styles.disabledMenuItem]}
                                        onPress={item.onPress}
                                        disabled={item.isLoading}
                                    >
                                        <View style={styles.adminItemContent}>
                                            {item.icon && (
                                                <Icon 
                                                    name={item.icon} 
                                                    style={styles.adminItemIcon} 
                                                    fill={item.isLoading ? '#A8A29E' : '#FF9500'} 
                                                />
                                            )}
                                            <Text style={StyleSheet.flatten([
                                                styles.menuText, 
                                                item.isLoading && styles.disabledText
                                            ])}>
                                                {item.title}
                                            </Text>
                                        </View>
                                        {item.isLoading ? (
                                            <ActivityIndicator size="small" color="#FF9500" />
                                        ) : (
                                            <Text style={styles.chevron}>›</Text>
                                        )}
                                    </TouchableOpacity>
                                    {index < adminItems.length - 1 && (
                                        <View style={styles.separator} />
                                    )}
                                </View>
                            ))}
                        </CardContent>
                    </Card>)}

                    <Card style={styles.logoutCard}>
                        <CardContent style={styles.logoutCardContent}>
                            <TouchableOpacity
                                style={styles.logoutButton}
                                onPress={handleLogout}
                                activeOpacity={0.7}
                            >
                                <View style={styles.logoutContent}>
                                    <View style={styles.logoutIconContainer}>
                                        <Icon name="log-out-outline" style={styles.logoutIcon} fill="#FF9500" />
                                    </View>
                                    <View style={styles.logoutTextContainer}>
                                        <Text style={styles.logoutText}>{t('auth.signOut')}</Text>
                                        {user?.email && (
                                            <Text style={styles.emailText}>
                                                {user.email}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </CardContent>
                    </Card>
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
    logoutCard: {
        backgroundColor: '#292524',
        borderWidth: 1,
        borderColor: 'rgba(255, 149, 0, 0.2)',
        borderRadius: 16,
        marginTop: 12,
    },
    logoutCardContent: {
        padding: 0,
    },
    logoutButton: {
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    logoutContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    logoutIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 149, 0, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 149, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutTextContainer: {
        flex: 1,
        flexDirection: 'column',
        gap: 4,
    },
    logoutText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 17,
    },
    emailText: {
        color: '#A8A29E',
        fontSize: 13,
        fontWeight: '400',
    },
    logoutIcon: {
        width: 24,
        height: 24,
    },
    adminCard: {
        backgroundColor: '#1F2937',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderRadius: 16,
    },
    adminTitle: {
        color: '#60A5FA',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    adminItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    adminItemIcon: {
        width: 20,
        height: 20,
    },
    disabledMenuItem: {
        opacity: 0.6,
    },
    disabledText: {
        color: '#A8A29E',
    },
});
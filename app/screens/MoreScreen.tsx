import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { t } from '../utils/localization';
import AppHeader from '../components/AppHeader';
import LanguageSelector from '../components/LanguageSelector';
import { Button } from '../components/ui/button';
import { Text } from '../components/ui/text';
import { Card, CardContent } from '../components/ui/card';
import { Lock } from 'lucide-react-native';

export default function MoreScreen() {
    const navigation = useNavigation();
    const { user, session, signOut } = useAuth();
    const [refreshKey, setRefreshKey] = useState(0);

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
        <View className="flex-1 bg-[#f5f5f5]" key={refreshKey} {...({} as any)}>
            <AppHeader title={t('more.more')} />

            <ScrollView className="flex-1" {...({} as any)}>
                <View className="p-5 gap-5" {...({} as any)}>
                    <LanguageSelector onLanguageChange={handleLanguageChange} />

                    <Card>
                        <CardContent className="p-0">
                            {menuItems.map((item, index) => (
                                <View key={index} {...({} as any)}>
                                    <Button
                                        variant="ghost"
                                        className="flex-row justify-between items-center h-14 px-4 rounded-none border-b border-border"
                                        onPress={item.onPress}
                                        {...({} as any)}
                                    >
                                        <Text className="text-left flex-1">{item.title}</Text>
                                        <Text className="text-muted-foreground">›</Text>
                                    </Button>
                                    {index < menuItems.length - 1 && (
                                        <View className="h-px bg-border mx-4" {...({} as any)} />
                                    )}
                                </View>
                            ))}

                        </CardContent>
                    </Card>

                    <Button
                        variant="destructive"
                        className="flex-row outline border-red-500 bg-white items-center justify-center gap-2 h-12"
                        onPress={handleLogout}
                        {...({} as any)}
                    >
                        <Lock size={18} color="#f00" />
                        <Text className="text-red-500 font-semibold">{t('auth.signOut')}</Text>
                        {user?.email && (
                            <Text variant="muted" className="text-red-200 text-xs">
                                {user.email}
                            </Text>
                        )}
                    </Button>

                </View>
            </ScrollView>
        </View>
    );
}
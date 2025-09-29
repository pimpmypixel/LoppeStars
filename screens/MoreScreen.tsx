import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { supabase } from '../utils/supabase';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';

export default function MoreScreen() {
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
            console.error('Sign out error:', error);
        }
    };

    const handleMenuPress = (item: string) => {
        Alert.alert(item, `${item} page would open here`);
    };

    const handleContact = () => {
        Linking.openURL('mailto:contact@loppestars.com');
    };

    const menuItems = [
        { title: 'Privacy', onPress: () => handleMenuPress('Privacy') },
        { title: 'Organiser', onPress: () => handleMenuPress('Organiser') },
        { title: 'Advertising', onPress: () => handleMenuPress('Advertising') },
        { title: 'About', onPress: () => handleMenuPress('About') },
        { title: 'Contact', onPress: handleContact },
    ];

    return (
        <View style={styles.container}>
            <AppHeader title="More" />

            <ScrollView style={styles.scrollView}>
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
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
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
});
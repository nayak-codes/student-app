import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { resetPassword, updateUserProfile } from '../src/services/authService';

export default function SettingsScreen() {
    const router = useRouter();
    const { logout, user, userProfile, refreshProfile } = useAuth();
    const { colors, isDark, toggleTheme } = useTheme();
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

    useEffect(() => {
        if (userProfile?.preferences) {
            setNotificationsEnabled(userProfile.preferences.notifications);
        }
    }, [userProfile]);

    const handleLogout = async () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                            router.replace('/login');
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Failed to log out');
                        }
                    },
                },
            ]
        );
    };

    const handlePasswordReset = async () => {
        if (!user?.email) {
            Alert.alert('Error', 'No email found for this user.');
            return;
        }

        Alert.alert(
            'Change Password',
            `Send a password reset email to ${user.email}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send Email',
                    onPress: async () => {
                        try {
                            await resetPassword(user.email!);
                            Alert.alert('Success', 'Password reset email sent. Check your inbox.');
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to send reset email.');
                        }
                    }
                }
            ]
        );
    };

    const toggleNotifications = async (val: boolean) => {
        setNotificationsEnabled(val); // Optimistic update
        if (user) {
            try {
                await updateUserProfile(user.uid, {
                    preferences: {
                        language: userProfile?.preferences?.language || 'en',
                        notifications: val
                    }
                });
                await refreshProfile(); // Sync local state
            } catch (error) {
                console.error('Failed to update notifications', error);
                setNotificationsEnabled(!val); // Revert on error
                Alert.alert('Error', 'Failed to update settings');
            }
        }
    };

    const SettingItem = ({ icon, label, onPress, value, type = 'link' }: any) => (
        <TouchableOpacity
            style={[styles.item, { borderBottomColor: colors.border }]}
            onPress={type === 'switch' ? () => onPress(!value) : onPress}
            disabled={false}
            activeOpacity={0.7}
        >
            <View style={styles.itemLeft}>
                <View style={[styles.iconBox, { backgroundColor: colors.iconBox }]}>
                    <Ionicons name={icon} size={20} color={colors.primary} />
                </View>
                <Text style={[styles.itemLabel, { color: colors.text }]}>{label}</Text>
            </View>
            {type === 'switch' ? (
                <Switch
                    value={value}
                    onValueChange={onPress}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={value ? '#FFFFFF' : '#F1F5F9'}
                />
            ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <SettingItem
                        icon="person-outline"
                        label="Edit Profile"
                        onPress={() => router.push('/full-profile')}
                    />
                    <SettingItem
                        icon="lock-closed-outline"
                        label="Change Password"
                        onPress={handlePasswordReset}
                    />
                    <SettingItem
                        icon="shield-checkmark-outline"
                        label="Privacy & Security"
                        onPress={() => router.push({ pathname: '/content/[type]', params: { type: 'privacy' } })}
                    />
                </View>

                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <SettingItem
                        icon="notifications-outline"
                        label="Push Notifications"
                        type="switch"
                        value={notificationsEnabled}
                        onPress={toggleNotifications}
                    />
                    <SettingItem
                        icon={isDark ? "moon" : "moon-outline"}
                        label="Dark Mode"
                        type="switch"
                        value={isDark}
                        onPress={toggleTheme}
                    />
                </View>

                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <SettingItem
                        icon="information-circle-outline"
                        label="About App"
                        onPress={() => router.push({ pathname: '/content/[type]', params: { type: 'about' } })}
                    />
                    <SettingItem
                        icon="document-text-outline"
                        label="Terms of Service"
                        onPress={() => router.push({ pathname: '/content/[type]', params: { type: 'terms' } })}
                    />
                </View>

                <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: isDark ? colors.cardBorder : '#FEE2E2' }]} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
        backgroundColor: '#FFF',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemLabel: {
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '500',
    },
    logoutButton: {
        marginTop: 8,
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    logoutText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
    },
    versionText: {
        textAlign: 'center',
        marginTop: 24,
        color: '#94A3B8',
        fontSize: 12,
    },
});

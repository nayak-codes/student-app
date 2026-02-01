// Profile Menu - "You" Tab (Polished & Professional)
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
    Animated,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import {
    getPendingFriendRequests
} from '../../src/services/connectionService';
import { getHistory, HistoryItem } from '../../src/services/historyService';
import { Playlist } from '../../src/services/playlistService';

const ProfileMenuScreen = () => {
    const router = useRouter();
    const { userProfile, user } = useAuth(); // Need user for ID
    const { colors, isDark } = useTheme();

    const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);

    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [customPlaylists, setCustomPlaylists] = useState<Playlist[]>([]);

    useFocusEffect(
        useCallback(() => {
            loadRecentHistory();
            loadPendingRequests();
        }, [user?.uid])
    );

    const loadRecentHistory = async () => {
        const history = await getHistory();
        setRecentHistory(history.slice(0, 5));
    };

    const loadPendingRequests = async () => {
        if (user?.uid) {
            const requests = await getPendingFriendRequests(user.uid);
            setPendingRequests(requests);
        }
    };



    const MenuOption = ({ icon, label, subLabel, onPress, iconBg, iconColor }: any) => {
        // Default colors if not provided, respecting dark mode
        const finalIconBg = iconBg || colors.iconBox;
        const finalIconColor = iconColor || colors.textSecondary;

        return (
            <TouchableOpacity style={styles.menuOption} onPress={onPress} activeOpacity={0.7}>
                <View style={[styles.menuIconContainer, { backgroundColor: finalIconBg }]}>
                    {React.cloneElement(icon, { size: 22, color: finalIconColor })}
                </View>
                <View style={styles.menuTextContainer}>
                    <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
                    {subLabel && <Text style={styles.menuSubLabel}>{subLabel}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
        );
    };

    // Collapsible Header Logic
    const scrollY = useRef(new Animated.Value(0)).current;
    const diffClamp = Animated.diffClamp(scrollY, 0, 110);
    const translateY = diffClamp.interpolate({
        inputRange: [0, 110],
        outputRange: [0, -110],
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            {/* App Header (Matches Home Screen) */}
            <Animated.View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                transform: [{ translateY }],
                backgroundColor: colors.background,
            }}>
                <SafeAreaView edges={['top']} style={[styles.safeHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                    <View style={styles.headerContent}>
                        <View style={styles.brandContainer}>
                            <Text style={[styles.brandText]}>Vidhyardhi</Text>
                        </View>

                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => router.push('/screens/universal-search')}
                            >
                                <Ionicons name="search-outline" size={26} color={colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => router.push('/notifications')}
                            >
                                <View>
                                    <Ionicons name="notifications-outline" size={26} color={colors.text} />
                                    {pendingRequests.length > 0 && <View style={styles.notificationDot} />}
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push('/conversations')}>
                                <Ionicons name="chatbubble-ellipses-outline" size={26} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40, paddingTop: 110 }}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >

                {/* User Profile Snippet */}
                <TouchableOpacity
                    style={styles.profileSnippet}
                    onPress={() => router.push('/full-profile')}
                    activeOpacity={0.7}
                >
                    <View style={styles.avatarContainer}>
                        {userProfile?.photoURL ? (
                            <Image source={{ uri: userProfile.photoURL }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.iconBox }]}>
                                <Text style={styles.avatarText}>
                                    {userProfile?.name?.charAt(0).toUpperCase() || 'S'}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: colors.text }]}>{userProfile?.name || 'Student Name'}</Text>
                        <Text style={styles.userHandle}>@{userProfile?.username || 'student'}</Text>
                    </View>
                </TouchableOpacity>

                <View style={[styles.sectionDivider, { backgroundColor: colors.cardBorder }]} />

                {/* History Section */}
                <View style={styles.section}>
                    <View style={[styles.sectionHeader, { justifyContent: 'flex-end' }]}>
                        <TouchableOpacity
                            onPress={() => router.push('/history')}
                            style={[styles.historyButtonBox, { backgroundColor: colors.cardBorder }]}
                        >
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>History</Text>
                            <Ionicons name="arrow-forward" size={20} color={colors.text} style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyList}>
                        {recentHistory.length > 0 ? recentHistory.map((item) => (
                            <TouchableOpacity key={item.id + item.timestamp} style={styles.historyCard}>
                                {item.image ? (
                                    <Image source={{ uri: item.image }} style={styles.historyImage} />
                                ) : (
                                    <View style={[styles.historyImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cardBorder }]}>
                                        <Ionicons
                                            name={item.type === 'pdf' ? 'document-text' : 'newspaper'}
                                            size={32}
                                            color="#94A3B8"
                                        />
                                    </View>
                                )}
                                {(item.type === 'video' || item.type === 'clip') && (
                                    <View style={styles.historyOverlay}>
                                        <Text style={styles.historyTime}>{item.type === 'clip' ? 'Short' : 'Video'}</Text>
                                    </View>
                                )}
                                <Text style={[styles.historyTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
                                <Text style={styles.historyMeta} numberOfLines={1}>{item.subtitle || 'Viewed'}</Text>
                            </TouchableOpacity>
                        )) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: colors.textSecondary }}>No recent history</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>

                {/* VISUAL SEPARATOR */}
                <View style={[styles.sectionDivider, { backgroundColor: colors.cardBorder }]} />

                {/* Create Section (Polished - Clean & Professional) */}
                <View style={styles.menuGroup}>
                    <TouchableOpacity
                        style={[styles.createCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? '#000' : '#64748B' }]}
                        onPress={() => router.push('/create-post')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.createCardContent}>
                            <View style={[styles.createIconBox, { backgroundColor: colors.primary }]}>
                                <Ionicons name="add" size={28} color="#FFF" />
                            </View>
                            <View style={styles.createTextContent}>
                                <Text style={[styles.createTitle, { color: colors.text }]}>Create New</Text>
                                <Text style={styles.createSubtitle}>Post, Video, Event, or Resource</Text>
                            </View>
                            <View style={[styles.arrowBox, { backgroundColor: colors.iconBox }]}>
                                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* VISUAL SEPARATOR */}
                <View style={[styles.sectionDivider, { backgroundColor: colors.cardBorder }]} />

                {/* Library Section */}
                <View style={styles.menuGroup}>
                    <Text style={styles.groupTitle}>Library</Text>

                    <MenuOption
                        icon={<Ionicons name="cloud-download" />}
                        label="Downloads"
                        subLabel="Your saved resources"
                        onPress={() => router.push('/downloads')}
                    />

                    <MenuOption
                        icon={<MaterialIcons name="folder" />}
                        label="Your Files"
                        subLabel="Documents & Certificates"
                        onPress={() => router.push('/document-vault')}
                    />
                </View>

                {/* Playlists */}
                <View style={styles.menuGroup}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 }}>
                        <Text style={styles.groupTitle}>Playlists</Text>
                        <TouchableOpacity onPress={() => router.push('/create-playlist')}>
                            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>+ New</Text>
                        </TouchableOpacity>
                    </View>

                    <MenuOption
                        icon={<Ionicons name="heart" />}
                        label="Liked "
                        subLabel="Your favorites"
                        onPress={() => router.push('/playlists/liked')}
                    />
                    <MenuOption
                        icon={<Ionicons name="bookmark" />}
                        label="Saved"
                        subLabel="Read for later"
                        onPress={() => router.push('/playlists/saved')}
                    />
                    <MenuOption
                        icon={<Ionicons name="time" />}
                        label="Watch Later"
                        subLabel="Unwatched videos"
                        onPress={() => router.push('/playlists/watch-later')}
                    />

                    <MenuOption
                        icon={<Ionicons name="albums" />}
                        label="Your Playlists"
                        subLabel="Manage your collections"
                        onPress={() => router.push('/playlists')}
                    />
                </View>

                <View style={[styles.sectionDivider, { backgroundColor: colors.cardBorder }]} />

                <View style={styles.menuGroup}>
                    <MenuOption
                        icon={<Feather name="settings" />}
                        label="Settings"
                        onPress={() => router.push('/settings')}
                    />
                    <MenuOption
                        icon={<Feather name="help-circle" />}
                        label="Help & feedback"
                        onPress={() => router.push('/help')}
                    />
                </View>

            </ScrollView >

            {/* Static Top Black Card - Instagram Style (outside scrolling content) */}
            <View style={[styles.topBlackCard, { backgroundColor: colors.background }]} />

        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#FFFFFF', // Dynamic
    },
    safeHeader: {
        // backgroundColor: '#FFFFFF', // Dynamic
        borderBottomWidth: 1,
        // borderBottomColor: '#F1F5F9', // Dynamic
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#3F51B5', // Kept brand color
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    actionButton: {
        padding: 4,
    },
    notificationDot: {
        position: 'absolute',
        top: 2,
        right: 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        borderWidth: 1.5,
        borderColor: '#FFF',
    },
    headerAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    headerAvatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerAvatarText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    profileSnippet: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    avatarPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        // backgroundColor: '#EEF2FF', // Dynamic
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4F46E5',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        // color: '#0F172A', // Dynamic
        marginBottom: 4,
    },
    userHandle: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    sectionDivider: {
        height: 8,
        // backgroundColor: '#F8FAFC', // Dynamic
        marginBottom: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        // color: '#0F172A', // Dynamic
    },
    historyButtonBox: {
        flexDirection: 'row',
        alignItems: 'center',
        // backgroundColor: '#F1F5F9', // Dynamic
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    viewAllButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
    },
    viewAllText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
    },
    historyList: {
        paddingHorizontal: 20,
        gap: 12,
    },
    historyCard: {
        width: 140,
    },
    historyImage: {
        width: 140,
        height: 80,
        borderRadius: 12,
        marginBottom: 8,
        // backgroundColor: '#F1F5F9', // Dynamic
    },
    historyOverlay: {
        position: 'absolute',
        bottom: 60,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    historyTime: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '600',
    },
    historyTitle: {
        fontSize: 13,
        fontWeight: '600',
        // color: '#1E293B', // Dynamic
        marginBottom: 2,
    },
    historyMeta: {
        fontSize: 11,
        color: '#64748B',
    },
    menuGroup: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    groupTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    menuOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 8,
    },
    menuIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '600',
        // color: '#0F172A', // Dynamic
        marginBottom: 2,
    },
    menuSubLabel: {
        fontSize: 13,
        color: '#64748B',
    },
    // Premium Create Card Styles (Clean & Professional)
    createCard: {
        // backgroundColor: '#FFFFFF', // Dynamic
        borderRadius: 16,
        borderWidth: 1,
        // borderColor: '#E2E8F0', // Dynamic
        padding: 5,
        // Using subtle shadow for "lifted" feel but not heavy
        // shadowColor: '#64748B', // Dynamic
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    createCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    createIconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        // backgroundColor: '#4F46E5', // Dynamic but likely brand constant
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    createTextContent: {
        flex: 1,
    },
    createTitle: {
        fontSize: 16,
        fontWeight: '700',
        // color: '#0F172A', // Dynamic
        marginBottom: 2,
    },
    createSubtitle: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    arrowBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        // backgroundColor: '#F1F5F9', // Dynamic
        justifyContent: 'center',
        alignItems: 'center',
    },
    topBlackCard: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        // backgroundColor: '#000', // FIXED: now uses dynamic background in component
        zIndex: 1001,
    },
});

export default ProfileMenuScreen;

// Profile Menu - "You" Tab (Polished & Professional)
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NotificationsModal } from '../../src/components/NotificationsModal';
import { useAuth } from '../../src/contexts/AuthContext';
import {
    acceptFriendRequest,
    getPendingFriendRequests,
    rejectFriendRequest
} from '../../src/services/connectionService';
import { getHistory, HistoryItem } from '../../src/services/historyService';

const ProfileMenuScreen = () => {
    const router = useRouter();
    const { userProfile, user } = useAuth(); // Need user for ID

    const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);
    const [notificationsVisible, setNotificationsVisible] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);

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

    const handleAcceptRequest = async (requestId: string) => {
        await acceptFriendRequest(requestId);
        loadPendingRequests(); // Refresh
    };

    const handleRejectRequest = async (requestId: string) => {
        await rejectFriendRequest(requestId);
        loadPendingRequests(); // Refresh
    };

    const MenuOption = ({ icon, label, subLabel, onPress, iconBg = "#F1F5F9", iconColor = "#334155" }: any) => (
        <TouchableOpacity style={styles.menuOption} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.menuIconContainer, { backgroundColor: iconBg }]}>
                {React.cloneElement(icon, { size: 22, color: iconColor })}
            </View>
            <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>{label}</Text>
                {subLabel && <Text style={styles.menuSubLabel}>{subLabel}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* App Header (Matches Home Screen) */}
            <SafeAreaView edges={['top']} style={styles.safeHeader}>
                <View style={styles.headerContent}>
                    <View style={styles.brandContainer}>
                        <Text style={styles.brandText}>Vidhyarthi</Text>
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push('/screens/universal-search')}
                        >
                            <Ionicons name="search-outline" size={26} color="#0F172A" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => setNotificationsVisible(true)}
                        >
                            <View>
                                <Ionicons name="notifications-outline" size={26} color="#0F172A" />
                                {pendingRequests.length > 0 && <View style={styles.notificationDot} />}
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/conversations')}>
                            <Ionicons name="chatbubble-ellipses-outline" size={26} color="#0F172A" />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

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
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {userProfile?.name?.charAt(0).toUpperCase() || 'S'}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{userProfile?.name || 'Student Name'}</Text>
                        <Text style={styles.userHandle}>@{userProfile?.username || 'student'}</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.sectionDivider} />

                {/* History Section */}
                <View style={styles.section}>
                    <View style={[styles.sectionHeader, { justifyContent: 'flex-end' }]}>
                        <TouchableOpacity
                            onPress={() => router.push('/history')}
                            style={styles.historyButtonBox}
                        >
                            <Text style={styles.sectionTitle}>History</Text>
                            <Ionicons name="arrow-forward" size={20} color="#0F172A" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyList}>
                        {recentHistory.length > 0 ? recentHistory.map((item) => (
                            <TouchableOpacity key={item.id + item.timestamp} style={styles.historyCard}>
                                {item.image ? (
                                    <Image source={{ uri: item.image }} style={styles.historyImage} />
                                ) : (
                                    <View style={[styles.historyImage, { justifyContent: 'center', alignItems: 'center' }]}>
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
                                <Text style={styles.historyTitle} numberOfLines={2}>{item.title}</Text>
                                <Text style={styles.historyMeta} numberOfLines={1}>{item.subtitle || 'Viewed'}</Text>
                            </TouchableOpacity>
                        )) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: '#94A3B8' }}>No recent history</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>

                {/* Create Section (Moved & Polished) */}
                <View style={[styles.menuGroup, { marginBottom: 32 }]}>
                    <TouchableOpacity
                        style={styles.createCard}
                        onPress={() => router.push('/create-post')}
                        activeOpacity={0.9}
                    >
                        <View style={styles.createCardContent}>
                            <View style={styles.createIconBox}>
                                <Ionicons name="add" size={32} color="#FFF" />
                            </View>
                            <View style={styles.createTextContent}>
                                <Text style={styles.createTitle}>Create New</Text>
                                <Text style={styles.createSubtitle}>Post, Video, Event, or Resource</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#FFF" style={{ opacity: 0.8 }} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Library Section */}
                <View style={styles.menuGroup}>
                    <Text style={styles.groupTitle}>Library</Text>

                    <MenuOption
                        icon={<Ionicons name="play-circle" />}
                        label="Your videos"
                        onPress={() => router.push('/full-profile')}
                    />

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
                    <Text style={styles.groupTitle}>Playlists</Text>
                    <MenuOption
                        icon={<Ionicons name="heart" />}
                        label="Liked videos"
                        subLabel="226 videos"
                    />
                    <MenuOption
                        icon={<Ionicons name="save" />}
                        label="saved"
                        subLabel="226 videos"
                    />
                    <MenuOption
                        icon={<Ionicons name="time" />}
                        label="Watch Later"
                        subLabel="Unwatched videos"
                    />
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.menuGroup}>
                    <MenuOption
                        icon={<Feather name="settings" />}
                        label="Settings"
                    />
                    <MenuOption
                        icon={<Feather name="help-circle" />}
                        label="Help & feedback"
                    />
                </View>

            </ScrollView>

            <NotificationsModal
                visible={notificationsVisible}
                onClose={() => setNotificationsVisible(false)}
                pendingRequests={pendingRequests}
                onAccept={handleAcceptRequest}
                onReject={handleRejectRequest}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    safeHeader: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
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
        color: '#3F51B5', // Matches Home Screen
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
        backgroundColor: '#EEF2FF',
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
        color: '#0F172A',
        marginBottom: 4,
    },
    userHandle: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    sectionDivider: {
        height: 8,
        backgroundColor: '#F8FAFC',
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
        color: '#0F172A',
    },
    historyButtonBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
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
        backgroundColor: '#F1F5F9',
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
        color: '#1E293B',
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
        color: '#0F172A',
        marginBottom: 2,
    },
    menuSubLabel: {
        fontSize: 13,
        color: '#64748B',
    },
    // Premium Create Card Styles
    createCard: {
        backgroundColor: '#4F46E5',
        borderRadius: 20,
        padding: 6,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    createCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    createIconBox: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    createTextContent: {
        flex: 1,
    },
    createTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 4,
    },
    createSubtitle: {
        fontSize: 13,
        color: '#E0E7FF',
        fontWeight: '500',
    },
});

export default ProfileMenuScreen;

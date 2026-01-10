// Profile Menu - "You" Tab (Professional White Theme)
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';

const ProfileMenuScreen = () => {
    const router = useRouter();
    const { userProfile } = useAuth();

    const historyItems = [
        { id: '1', title: 'Hook Step Lyrical', nav: 'Video', views: '2.6M', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=60' },
        { id: '2', title: 'Shorts', nav: 'Shorts', views: '13 watched', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=60' },
        { id: '3', title: 'Start DJ Songs', nav: 'Playlist', views: '2 videos', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60' },
    ];

    const MenuOption = ({ icon, label, subLabel, onPress, color = "#1E293B" }: any) => (
        <TouchableOpacity style={styles.menuOption} onPress={onPress}>
            <View style={styles.menuIconContainer}>
                {icon}
            </View>
            <View style={styles.menuTextContainer}>
                <Text style={[styles.menuLabel, { color }]}>{label}</Text>
                {subLabel && <Text style={styles.menuSubLabel}>{subLabel}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* App Header */}
            <View style={styles.appHeader}>
                <Text style={styles.logoText}>Vidhyarthi</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="search-outline" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <View>
                            <Ionicons name="notifications-outline" size={24} color="#1E293B" />
                            <View style={styles.notificationBadge} />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/full-profile')}>
                        {userProfile?.photoURL ? (
                            <Image source={{ uri: userProfile.photoURL }} style={styles.headerAvatar} />
                        ) : (
                            <View style={[styles.headerAvatar, { backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{userProfile?.name?.charAt(0).toUpperCase() || 'S'}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

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
                        <Text style={styles.userHandle}>@{userProfile?.username || 'student'} • View channel &rsaquo;</Text>
                    </View>
                </TouchableOpacity>

                {/* History Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>History</Text>
                        <TouchableOpacity style={styles.viewAllButton}>
                            <Text style={styles.viewAllText}>View all</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyList}>
                        {historyItems.map((item) => (
                            <TouchableOpacity key={item.id} style={styles.historyCard}>
                                <Image source={{ uri: item.image }} style={styles.historyImage} />
                                <View style={styles.historyOverlay}>
                                    <Text style={styles.historyTime}>2:30</Text>
                                </View>
                                <Text style={styles.historyTitle} numberOfLines={2}>{item.title}</Text>
                                <Text style={styles.historyMeta}>{item.views}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Library / My Content */}
                <View style={styles.menuGroup}>
                    <Text style={styles.groupTitle}>Library</Text>

                    <MenuOption
                        icon={<Ionicons name="play-circle-outline" size={24} color="#1E293B" />}
                        label="Your videos"
                        onPress={() => router.push('/full-profile')}
                    />

                    <MenuOption
                        icon={<Ionicons name="download-outline" size={24} color="#1E293B" />}
                        label="Downloads"
                        subLabel="20 videos • 1.2 GB"
                        onPress={() => router.push('/document-vault')}
                    />

                    <MenuOption
                        icon={<MaterialIcons name="folder-open" size={24} color="#1E293B" />}
                        label="Your Files"
                        subLabel="Documents & Certificates"
                        onPress={() => router.push('/document-vault')}
                    />
                </View>

                {/* Upload Actions (Replaces Premium) */}
                <View style={styles.menuGroup}>
                    <Text style={styles.groupTitle}>Create & Share</Text>
                    <MenuOption
                        icon={<Ionicons name="add-circle-outline" size={24} color="#4F46E5" />}
                        label="Add Post / Video"
                        subLabel="Share knowledge with the community"
                        color="#4F46E5"
                        onPress={() => router.push('/create-post')}
                    />
                </View>

                {/* Playlists */}
                <View style={styles.menuGroup}>
                    <Text style={styles.groupTitle}>Playlists</Text>
                    <MenuOption
                        icon={<Ionicons name="heart-outline" size={24} color="#1E293B" />}
                        label="Liked videos"
                        subLabel="226 videos"
                    />
                    <MenuOption
                        icon={<Ionicons name="time-outline" size={24} color="#1E293B" />}
                        label="Watch Later"
                        subLabel="Unwatched videos"
                    />
                </View>

                <View style={styles.divider} />

                <View style={styles.menuGroup}>
                    <MenuOption
                        icon={<Feather name="settings" size={22} color="#1E293B" />}
                        label="Settings"
                    />
                    <MenuOption
                        icon={<Feather name="help-circle" size={22} color="#1E293B" />}
                        label="Help & feedback"
                    />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // White background
    },
    appHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    logoText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#4F46E5', // Indigo-600
        letterSpacing: -0.5,
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    iconButton: {
        padding: 4,
    },
    notificationBadge: {
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
    profileSnippet: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        marginBottom: 8,
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    avatarPlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#E0E7FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4F46E5',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 4,
    },
    userHandle: {
        fontSize: 14,
        color: '#64748B',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    viewAllButton: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    viewAllText: {
        fontSize: 12,
        color: '#475569',
    },
    historyList: {
        paddingHorizontal: 20,
        gap: 12,
    },
    historyCard: {
        width: 150,
    },
    historyImage: {
        width: 150,
        height: 84,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#F1F5F9',
    },
    historyOverlay: {
        position: 'absolute',
        bottom: 60,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 4,
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
        fontWeight: '500',
        color: '#1E293B',
        marginBottom: 2,
    },
    historyMeta: {
        fontSize: 11,
        color: '#64748B',
    },
    menuGroup: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    groupTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 12,
    },
    menuOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    menuIconContainer: {
        width: 32,
        alignItems: 'flex-start',
        marginRight: 12,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '400',
    },
    menuSubLabel: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 20,
        marginBottom: 24, // Added more spacing
    }
});

export default ProfileMenuScreen;

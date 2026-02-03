import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../src/config/firebase';
import { useTheme } from '../src/contexts/ThemeContext';
import { UserProfile } from '../src/services/authService';

const { width } = Dimensions.get('window');

export default function ChatUserInfoScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const params = useLocalSearchParams();

    const userId = params.userId as string;
    const conversationId = params.conversationId as string;
    const initialName = params.name as string;
    const initialPhoto = params.photoURL as string;

    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserInfo();
    }, [userId]);

    const fetchUserInfo = async () => {
        try {
            if (!userId) return;
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                setUserData(userDoc.data() as UserProfile);
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMuteNotifications = () => {
        Alert.alert('Mute Notifications', 'This feature will be implemented soon');
    };

    const handleSearch = () => {
        Alert.alert('Search', 'Search in conversation coming soon');
    };

    const handleBlock = () => {
        Alert.alert('Block User', 'Are you sure you want to block this user?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Block', style: 'destructive', onPress: () => console.log('Block user') }
        ]);
    };

    const handleViewProfile = () => {
        router.push({ pathname: '/public-profile', params: { userId } });
    };

    const displayPhoto = userData?.photoURL || userData?.profilePhoto || initialPhoto;
    const displayName = userData?.name || initialName || 'User';
    const displayHeadline = userData?.headline || userData?.exam || 'Student';
    const displayBio = userData?.bio || userData?.about;

    if (loading && !initialName) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: '#020617' }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Dark Professional Background - No Blobs */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#020617' }]} />

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Contact Info</Text>
                    <TouchableOpacity style={styles.backButton}>
                        <Ionicons name="ellipsis-vertical" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                    {/* Profile Card */}
                    <LinearGradient
                        colors={['#1E293B', '#0F172A']}
                        style={styles.profileCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.avatarContainer}>
                            {displayPhoto ? (
                                <Image source={{ uri: displayPhoto }} style={styles.profileImage} />
                            ) : (
                                <LinearGradient
                                    colors={['#6366F1', '#8B5CF6']}
                                    style={[styles.profileImage, styles.profileImagePlaceholder]}
                                >
                                    <Text style={{ fontSize: 36, fontWeight: '700', color: '#FFF' }}>
                                        {displayName.charAt(0).toUpperCase()}
                                    </Text>
                                </LinearGradient>
                            )}
                            <View style={styles.onlineBadge} />
                        </View>

                        <Text style={styles.profileName}>{displayName}</Text>
                        <Text style={styles.profileStatus}>{displayHeadline}</Text>

                        {/* Action Bar */}
                        <View style={styles.actionBar}>
                            <TouchableOpacity style={styles.actionButton} onPress={handleSearch}>
                                <View style={styles.actionButtonIcon}>
                                    <Ionicons name="search" size={22} color="#94A3B8" />
                                </View>
                                <Text style={styles.actionLabel}>Search</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} onPress={handleMuteNotifications}>
                                <View style={styles.actionButtonIcon}>
                                    <Ionicons name="notifications-off" size={22} color="#94A3B8" />
                                </View>
                                <Text style={styles.actionLabel}>Mute</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} onPress={handleViewProfile}>
                                <View style={styles.actionButtonIcon}>
                                    <Ionicons name="person" size={22} color="#94A3B8" />
                                </View>
                                <Text style={styles.actionLabel}>Profile</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>

                    {/* About Section */}
                    {displayBio && (
                        <View style={styles.glassSection}>
                            <Text style={styles.sectionTitle}>About</Text>
                            <Text style={styles.aboutText}>{displayBio}</Text>
                        </View>
                    )}

                    {/* Media Placeholders */}
                    <View style={styles.glassSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Media, Links, and Docs</Text>
                            <Ionicons name="chevron-forward" size={16} color="#475569" />
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 12 }}>
                            {[1, 2, 3].map((_, i) => (
                                <View key={i} style={styles.mediaPlaceholder}>
                                    <Ionicons name="image-outline" size={24} color="#334155" />
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Danger Zone */}
                    <View style={styles.dangerSection}>
                        <TouchableOpacity style={styles.dangerRow} onPress={() => Alert.alert('Report', 'Report user')}>
                            <Ionicons name="flag-outline" size={20} color="#EF4444" style={{ marginRight: 12 }} />
                            <Text style={styles.dangerText}>Report {displayName}</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.dangerRow} onPress={handleBlock}>
                            <Ionicons name="ban-outline" size={20} color="#EF4444" style={{ marginRight: 12 }} />
                            <Text style={styles.dangerText}>Block {displayName}</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617', // Slate 950
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    profileCard: {
        alignItems: 'center',
        marginBottom: 24,
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#0F172A',
    },
    profileImagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#10B981',
        borderWidth: 3,
        borderColor: '#0F172A',
    },
    profileName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#F8FAFC',
        marginBottom: 4,
        textAlign: 'center',
    },
    profileStatus: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 28,
        textAlign: 'center',
        fontWeight: '500',
    },
    actionBar: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
        justifyContent: 'center',
    },
    actionButton: {
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    actionButtonIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
    },
    glassSection: {
        marginBottom: 16,
        padding: 20,
        borderRadius: 20,
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: '#334155',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#F1F5F9',
        marginBottom: 8,
    },
    aboutText: {
        fontSize: 14,
        color: '#94A3B8',
        lineHeight: 22,
    },
    mediaPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 10,
        backgroundColor: '#0F172A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dangerSection: {
        marginTop: 8,
        backgroundColor: '#1E293B',
        borderRadius: 20,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#334155',
    },
    dangerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    dangerText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#EF4444',
    },
    divider: {
        height: 1,
        backgroundColor: '#334155',
        marginLeft: 48,
    }
});

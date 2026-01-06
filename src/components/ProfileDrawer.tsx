// LinkedIn-Style Profile Drawer Component
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../services/authService';
import { getProfileStats, ProfileStats } from '../services/profileStatsService';

interface ProfileDrawerProps {
    visible: boolean;
    onClose: () => void;
}

const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ visible, onClose }) => {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<ProfileStats>({
        profileViewers: 0,
        postImpressions: 0,
        lastUpdated: new Date().toISOString(),
    });
    const [slideAnim] = useState(new Animated.Value(-300));

    useEffect(() => {
        if (visible) {
            loadStats();
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: -300,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const loadStats = async () => {
        if (user) {
            const profileStats = await getProfileStats(user.uid);
            setStats(profileStats);
        }
    };

    const handleViewFullProfile = () => {
        onClose();
        router.push('/full-profile');
    };

    const handleLogout = () => {
        onClose();
        logout();
        router.replace('/');
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <Animated.View
                    style={[
                        styles.drawerContainer,
                        { transform: [{ translateX: slideAnim }] },
                    ]}
                >
                    <SafeAreaView style={styles.drawer} edges={['top', 'bottom']}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Header Section */}
                            <LinearGradient
                                colors={['#4F46E5', '#7C3AED']}
                                style={styles.header}
                            >
                                <View style={styles.avatarContainer}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>
                                            {userProfile?.name?.charAt(0).toUpperCase() || 'S'}
                                        </Text>
                                    </View>
                                    <View style={styles.verifiedBadge}>
                                        <MaterialCommunityIcons
                                            name="shield-check"
                                            size={16}
                                            color="#10B981"
                                        />
                                    </View>
                                </View>

                                <Text style={styles.userName}>{userProfile?.name || 'Student'}</Text>
                                {userProfile?.headline && (
                                    <Text style={styles.headline} numberOfLines={2}>
                                        {userProfile.headline}
                                    </Text>
                                )}
                                {userProfile?.location && (
                                    <View style={styles.locationRow}>
                                        <Ionicons name="location" size={12} color="rgba(255,255,255,0.9)" />
                                        <Text style={styles.locationText}>
                                            {userProfile.location.city}
                                            {userProfile.location.state ? `, ${userProfile.location.state}` : ''}
                                        </Text>
                                    </View>
                                )}
                                {userProfile?.education && userProfile.education.length > 0 && (
                                    <View style={styles.collegeRow}>
                                        <Ionicons name="school" size={12} color="rgba(255,255,255,0.9)" />
                                        <Text style={styles.collegeText} numberOfLines={1}>
                                            {userProfile.education[0].institution}
                                        </Text>
                                    </View>
                                )}
                            </LinearGradient>

                            {/* Stats Section */}
                            <View style={styles.statsSection}>
                                <TouchableOpacity
                                    style={styles.statItem}
                                    onPress={handleViewFullProfile}
                                >
                                    <Text style={styles.statValue}>{stats.profileViewers}</Text>
                                    <Text style={styles.statLabel}>profile viewers</Text>
                                </TouchableOpacity>

                                <View style={styles.divider} />

                                <TouchableOpacity
                                    style={styles.statItem}
                                    onPress={handleViewFullProfile}
                                >
                                    <Text style={styles.statValue}>{stats.postImpressions}</Text>
                                    <Text style={styles.statLabel}>post impressions</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Menu Items */}
                            <View style={styles.menuSection}>
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={handleViewFullProfile}
                                >
                                    <View style={styles.menuIconContainer}>
                                        <Ionicons name="person" size={20} color="#4F46E5" />
                                    </View>
                                    <Text style={styles.menuText}>View Full Profile</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                                </TouchableOpacity>

                                <View style={styles.menuDivider} />

                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => {
                                        onClose();
                                        router.push('/document-vault');
                                    }}
                                >
                                    <View style={styles.menuIconContainer}>
                                        <Ionicons name="folder" size={20} color="#10B981" />
                                    </View>
                                    <Text style={styles.menuText}>My Documents</Text>
                                    <View style={styles.menuBadge}>
                                        <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                                </TouchableOpacity>

                                <View style={styles.menuDivider} />

                                <TouchableOpacity style={styles.menuItem}>
                                    <View style={styles.menuIconContainer}>
                                        <Ionicons name="bookmark" size={20} color="#4F46E5" />
                                    </View>
                                    <Text style={styles.menuText}>Saved Posts</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                                </TouchableOpacity>

                                <View style={styles.menuDivider} />

                                <TouchableOpacity style={styles.menuItem}>
                                    <View style={styles.menuIconContainer}>
                                        <Ionicons name="people" size={20} color="#4F46E5" />
                                    </View>
                                    <Text style={styles.menuText}>Groups</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>

                            {/* Settings */}
                            <View style={styles.menuSection}>
                                <TouchableOpacity style={styles.menuItem}>
                                    <View style={styles.menuIconContainer}>
                                        <Ionicons name="settings" size={20} color="#64748B" />
                                    </View>
                                    <Text style={styles.menuText}>Settings</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>

                            {/* Logout Button */}
                            <View style={styles.logoutSection}>
                                <TouchableOpacity
                                    style={styles.logoutButton}
                                    onPress={handleLogout}
                                >
                                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                                    <Text style={styles.logoutText}>Logout</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Premium Banner */}
                            <View style={styles.premiumBanner}>
                                <View style={styles.premiumContent}>
                                    <Text style={styles.premiumMultiplier}>2.6x</Text>
                                    <Text style={styles.premiumText}>
                                        Premium members are 2.6x more likely to get opportunities
                                    </Text>
                                </View>
                                <TouchableOpacity style={styles.premiumButton}>
                                    <Text style={styles.premiumButtonText}>Try Premium</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </SafeAreaView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    drawerContainer: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 300,
    },
    drawer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 24,
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFF',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 3,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 4,
        textAlign: 'center',
    },
    headline: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.95)',
        textAlign: 'center',
        marginTop: 4,
        paddingHorizontal: 16,
        lineHeight: 18,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    locationText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    collegeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 4,
        paddingHorizontal: 16,
    },
    collegeText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
        flex: 1,
    },
    statsSection: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0A66C2',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        color: '#64748B',
    },
    divider: {
        width: 1,
        backgroundColor: '#E2E8F0',
    },
    menuSection: {
        backgroundColor: '#FFF',
        marginTop: 8,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    menuIconContainer: {
        width: 32,
        marginRight: 12,
    },
    menuText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#1E293B',
    },
    menuBadge: {
        marginLeft: 'auto',
        marginRight: 8,
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginLeft: 64,
    },
    logoutSection: {
        marginTop: 8,
        paddingHorizontal: 20,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FEE2E2',
        backgroundColor: '#FEF2F2',
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#EF4444',
        marginLeft: 8,
    },
    premiumBanner: {
        margin: 16,
        padding: 16,
        backgroundColor: '#FFFBEB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    premiumContent: {
        marginBottom: 12,
    },
    premiumMultiplier: {
        fontSize: 24,
        fontWeight: '700',
        color: '#D97706',
        marginBottom: 4,
    },
    premiumText: {
        fontSize: 12,
        color: '#78716C',
        lineHeight: 16,
    },
    premiumButton: {
        backgroundColor: '#D97706',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    premiumButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
});

export default ProfileDrawer;

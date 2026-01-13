import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/contexts/AuthContext';
import { Education } from '../src/services/authService';
import {
    followUser,
    getConnectionStatus,
    sendFriendRequest,
    unfollowUser
} from '../src/services/connectionService';


const ProfileDetailsScreen = () => {
    const { user: authUser, userProfile } = useAuth();
    const router = useRouter();
    const { userId, userName, userPhoto, userEmail } = useLocalSearchParams<{
        userId: string;
        userName?: string;
        userPhoto?: string;
        userEmail?: string;
    }>();

    const [profileData, setProfileData] = useState<any>(null);
    const [connectionStatus, setConnectionStatus] = useState({
        isFriend: false,
        isFollowing: false,
        isFollower: false,
        friendshipStatus: 'none' as 'pending' | 'accepted' | 'none',
        pendingRequestSentByMe: false,
    });
    const [loadingConnection, setLoadingConnection] = useState(false);

    // Fetch user profile data
    useEffect(() => {
        const fetchProfile = async () => {
            if (userId && userId !== authUser?.uid) {
                try {
                    const { getUserProfile } = await import('../src/services/authService');
                    const profile = await getUserProfile(userId);
                    setProfileData(profile);
                } catch (error) {
                    console.error('Error fetching profile:', error);
                }
            } else {
                setProfileData(userProfile);
            }
        };
        fetchProfile();
    }, [userId]);

    const displayProfile = profileData || userProfile;
    const displayName = displayProfile?.name || userName || 'User';
    const displayPhoto = displayProfile?.photoURL || displayProfile?.profilePhoto || userPhoto || '';
    const displayEmail = displayProfile?.email || userEmail || '';

    const handleSendMessage = async () => {
        if (!authUser || !userId) {
            Alert.alert('Error', 'Please log in to send messages');
            return;
        }

        if (userId === authUser.uid) {
            Alert.alert('Error', 'You cannot message yourself');
            return;
        }

        try {
            const { getOrCreateConversation } = await import('../src/services/chatService');
            const conversationId = await getOrCreateConversation(
                authUser.uid,
                userId,
                {
                    name: displayName,
                    photoURL: displayPhoto,
                    email: displayEmail,
                }
            );

            router.push({
                pathname: '/chat-screen',
                params: {
                    conversationId,
                    otherUserId: userId,
                    otherUserName: displayName,
                    otherUserPhoto: displayPhoto,
                },
            });
        } catch (error) {
            console.error('Error starting conversation:', error);
            Alert.alert('Error', 'Failed to start conversation');
        }
    };

    // Load connection status
    useEffect(() => {
        const loadConnectionStatus = async () => {
            if (userId && authUser && userId !== authUser.uid) {
                try {
                    const status = await getConnectionStatus(authUser.uid, userId);
                    setConnectionStatus({
                        isFriend: status.isFriend,
                        isFollowing: status.isFollowing,
                        isFollower: status.isFollower,
                        friendshipStatus: status.friendshipStatus || 'none',
                        pendingRequestSentByMe: status.pendingRequestSentByMe || false,
                    });
                } catch (error) {
                    console.error('Error loading connection status:', error);
                }
            }
        };
        loadConnectionStatus();
    }, [userId, authUser]);

    const handleConnect = async () => {
        if (!userId || !authUser || loadingConnection) return;

        try {
            setLoadingConnection(true);
            await sendFriendRequest(userId);
            Alert.alert('Success', 'Friend request sent!');

            // Reload connection status
            const status = await getConnectionStatus(authUser.uid, userId);
            setConnectionStatus({
                isFriend: status.isFriend,
                isFollowing: status.isFollowing,
                isFollower: status.isFollower,
                friendshipStatus: status.friendshipStatus || 'none',
                pendingRequestSentByMe: status.pendingRequestSentByMe || false,
            });
        } catch (error: any) {
            console.error('Error sending friend request:', error);
            Alert.alert('Error', error.message || 'Failed to send request');
        } finally {
            setLoadingConnection(false);
        }
    };

    const handleFollow = async () => {
        if (!userId || !authUser || loadingConnection) return;

        try {
            setLoadingConnection(true);
            if (connectionStatus.isFollowing) {
                await unfollowUser(userId);
                Alert.alert('Success', 'Unfollowed');
            } else {
                await followUser(userId);
                Alert.alert('Success', 'Now following!');
            }

            // Reload connection status
            const status = await getConnectionStatus(authUser.uid, userId);
            setConnectionStatus({
                isFriend: status.isFriend,
                isFollowing: status.isFollowing,
                isFollower: status.isFollower,
                friendshipStatus: status.friendshipStatus || 'none',
                pendingRequestSentByMe: status.pendingRequestSentByMe || false,
            });
        } catch (error: any) {
            console.error('Error following/unfollowing:', error);
            Alert.alert('Error', error.message || 'Failed to follow/unfollow');
        } finally {
            setLoadingConnection(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{displayName}</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Profile Card with Avatar */}
            {userId && userId !== authUser?.uid && (
                <View style={styles.profileCard}>
                    {displayPhoto ? (
                        <Image source={{ uri: displayPhoto }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarInitials}>
                                {displayName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{displayName}</Text>
                        <Text style={styles.profileRole}>{displayProfile?.role || 'Student'}</Text>
                    </View>
                </View>
            )}

            {/* Action Buttons */}
            {userId && userId !== authUser?.uid && (
                <View style={styles.actionRow}>
                    {/* Smart Connection Button */}
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={connectionStatus.isFriend ? undefined : handleConnect}
                        disabled={loadingConnection || connectionStatus.isFriend || connectionStatus.pendingRequestSentByMe}
                    >
                        {loadingConnection ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <>
                                <Ionicons name="person-add" size={18} color="#FFF" />
                                <Text style={styles.primaryButtonText}>
                                    {connectionStatus.isFriend
                                        ? '✓ Friends'
                                        : connectionStatus.pendingRequestSentByMe
                                            ? 'Request Sent'
                                            : 'Add Friend'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Follow Button */}
                    <TouchableOpacity
                        style={[styles.secondaryButton, { marginRight: 8 }]}
                        onPress={handleFollow}
                        disabled={loadingConnection}
                    >
                        {loadingConnection ? (
                            <ActivityIndicator size="small" color="#4F46E5" />
                        ) : (
                            <>
                                <Ionicons
                                    name={connectionStatus.isFollowing ? "checkmark" : "person-add"}
                                    size={18}
                                    color="#4F46E5"
                                />
                                <Text style={styles.secondaryButtonText}>
                                    {connectionStatus.isFollowing ? 'Following' : 'Follow'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Message Button */}
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleSendMessage}
                    >
                        <Ionicons name="chatbubble" size={18} color="#4F46E5" />
                        <Text style={styles.secondaryButtonText}>Message</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>


                {userProfile?.about && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <Text style={styles.aboutText}>{userProfile.about}</Text>
                    </View>
                )}

                {userProfile?.skills && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Skills</Text>

                        {userProfile.skills.technical && userProfile.skills.technical.length > 0 && (
                            <View style={styles.skillCategory}>
                                <Text style={styles.categoryTitle}>Technical Skills</Text>
                                <View style={styles.skillsContainer}>
                                    {userProfile.skills.technical.map((skill: string, index: number) => (
                                        <View key={index} style={[styles.skillChip, styles.technicalChip]}>
                                            <Text style={styles.technicalText}>{skill}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {userProfile.skills.softSkills && userProfile.skills.softSkills.length > 0 && (
                            <View style={styles.skillCategory}>
                                <Text style={styles.categoryTitle}>Soft Skills</Text>
                                <View style={styles.skillsContainer}>
                                    {userProfile.skills.softSkills.map((skill: string, index: number) => (
                                        <View key={index} style={[styles.skillChip, styles.softChip]}>
                                            <Text style={styles.softText}>{skill}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {userProfile.skills.languages && userProfile.skills.languages.length > 0 && (
                            <View style={styles.skillCategory}>
                                <Text style={styles.categoryTitle}>Languages</Text>
                                <View style={styles.skillsContainer}>
                                    {userProfile.skills.languages.map((skill: string, index: number) => (
                                        <View key={index} style={[styles.skillChip, styles.languageChip]}>
                                            <Text style={styles.languageText}>{skill}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {userProfile?.education && userProfile.education.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Education</Text>
                        {userProfile.education.map((edu: Education, index: number) => (
                            <View key={index} style={styles.educationCard}>
                                <View style={styles.educationIcon}>
                                    <Ionicons name="school" size={24} color="#4F46E5" />
                                </View>
                                <View style={styles.educationInfo}>
                                    <Text style={styles.educationInstitution}>{edu.institution}</Text>
                                    <Text style={styles.educationDegree}>{edu.degree}</Text>
                                    <Text style={styles.educationPeriod}>
                                        {edu.startYear} - {edu.endYear || 'Present'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    {userProfile?.location && (
                        <View style={styles.infoRow}>
                            <Ionicons name="location" size={20} color="#64748B" />
                            <Text style={styles.infoText}>
                                {userProfile.location.city}, {userProfile.location.state}
                            </Text>
                        </View>
                    )}
                    <View style={styles.infoRow}>
                        <Ionicons name="school" size={20} color="#64748B" />
                        <Text style={styles.contactText}>{userProfile?.exam || 'Student'}</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    placeholder: {
        width: 32,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
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
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitials: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '700',
    },
    profileInfo: {
        marginLeft: 16,
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    profileRole: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        marginTop: 16,
    },
    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4F46E5',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    secondaryButtonText: {
        color: '#4F46E5',
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    section: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 12,
    },
    aboutText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
    },
    skillCategory: {
        marginBottom: 16,
    },
    categoryTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    technicalChip: {
        backgroundColor: '#EEF2FF',
        borderColor: '#C7D2FE',
    },
    technicalText: {
        color: '#4F46E5',
        fontSize: 12,
        fontWeight: '600',
    },
    softChip: {
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0',
    },
    softText: {
        color: '#059669',
        fontSize: 12,
        fontWeight: '600',
    },
    languageChip: {
        backgroundColor: '#FEF3C7',
        borderColor: '#FDE68A',
    },
    languageText: {
        color: '#D97706',
        fontSize: 12,
        fontWeight: '600',
    },
    // Education Styles
    educationCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    educationIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    educationInfo: {
        flex: 1,
    },
    educationItem: {
        marginBottom: 16,
    },
    educationInstitution: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
    },
    educationDegree: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    educationYear: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    educationPeriod: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    // Contact/Info Styles
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    contactText: {
        fontSize: 14,
        color: '#475569',
        marginLeft: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 14,
        color: '#334155',
        marginLeft: 12,
        flex: 1,
    },
});

export default ProfileDetailsScreen;

// Full Profile Details Page
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
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
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => Alert.alert('Connect', 'Connection request sent!')}
                    >
                        <Ionicons name="person-add" size={18} color="#FFF" />
                        <Text style={styles.primaryButtonText}>Connect</Text>
                    </TouchableOpacity>
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
                        <Text style={styles.infoText}>{userProfile?.exam || 'Student'}</Text>
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    section: {
        backgroundColor: '#FFF',
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 16,
    },
    aboutText: {
        fontSize: 15,
        lineHeight: 24,
        color: '#334155',
    },
    skillCategory: {
        marginBottom: 20,
    },
    categoryTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
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
        borderColor: '#4F46E5',
    },
    technicalText: {
        fontSize: 14,
        color: '#4F46E5',
        fontWeight: '500',
    },
    softChip: {
        backgroundColor: '#F0FDF4',
        borderColor: '#10B981',
    },
    softText: {
        fontSize: 14,
        color: '#10B981',
        fontWeight: '500',
    },
    languageChip: {
        backgroundColor: '#FFF7ED',
        borderColor: '#F59E0B',
    },
    languageText: {
        fontSize: 14,
        color: '#F59E0B',
        fontWeight: '500',
    },
    educationCard: {
        flexDirection: 'row',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
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
    educationInstitution: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    educationDegree: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 2,
    },
    educationField: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 4,
    },
    educationPeriod: {
        fontSize: 13,
        color: '#94A3B8',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    infoText: {
        fontSize: 15,
        color: '#334155',
    },
    /* New profile styles - removed duplicate, using the one below */
    profileLeft: {
        marginRight: 12,
    },
    avatar: {
        width: 92,
        height: 92,
        borderRadius: 46,
    },
    avatarPlaceholder: {
        width: 92,
        height: 92,
        borderRadius: 46,
        backgroundColor: '#E6F0FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitials: {
        fontSize: 28,
        fontWeight: '700',
        color: '#334155',
    },
    profileRight: {
        flex: 1,
    },
    nameText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
    },
    headlineText: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
        marginBottom: 6,
    },
    aboutTextSmall: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 10,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    statItem: {
        alignItems: 'center',
        minWidth: 56,
    },
    statNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
    },
    progressContainer: {
        marginTop: 12,
    },
    progressBarBackground: {
        height: 6,
        backgroundColor: '#EEF2FF',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: 6,
        backgroundColor: '#4F46E5',
    },
    progressText: {
        marginTop: 6,
        fontSize: 12,
        color: '#64748B',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginTop: 12,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: '#4F46E5',
        paddingVertical: 12,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginRight: 8,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    primaryButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 15,
    },
    ghostButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E6E9F2',
        paddingVertical: 12,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 18,
    },
    ghostButtonText: {
        color: '#64748B',
        fontWeight: '600',
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#FFF',
        paddingVertical: 12,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginLeft: 8,
        borderWidth: 1.5,
        borderColor: '#4F46E5',
    },
    secondaryButtonText: {
        color: '#4F46E5',
        fontWeight: '700',
        fontSize: 15,
    },
    profileCard: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 12,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    profileRole: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },

    // Docs Styles
    docsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        gap: 12,
    },
    docCard: {
        width: '31%',
        aspectRatio: 0.8,
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    docIconContainer: {
        alignSelf: 'center',
        marginVertical: 8,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    docTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 8,
    },
    docStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 8,
    },
    docStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    docStatText: {
        fontSize: 10,
        color: '#64748B',
    },

    /* Tabs styles */
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFF',
        marginTop: 20,
        paddingHorizontal: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: '#6D28D9',
    },
    tabLabel: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4,
        fontWeight: '500',
    },
    tabLabelActive: {
        color: '#6D28D9',
    },
    /* Feed styles */
    feedContainer: {
        marginTop: 16,
    },
    loaderContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    feedList: {
        paddingHorizontal: 12,
    },
    emptyContainer: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#94A3B8',
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#CBD5E1',
        marginTop: 4,
    },
    /* Post card styles */
    postCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginVertical: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6D28D9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    avatarText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    postType: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    /* Grid Styles */
    feedListGrid: {
        paddingHorizontal: 0,
        marginHorizontal: -1,
    },
    feedRow: {
        gap: 1,
    },
    gridItem: {
        flex: 1,
        maxWidth: '33.33%',
        aspectRatio: 1,
        marginBottom: 1,
        position: 'relative',
        backgroundColor: '#f1f5f9',
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    gridPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#cbd5e1',
        padding: 4,
    },
    gridTextPreview: {
        fontSize: 10,
        color: '#475569',
        textAlign: 'center',
        marginTop: 4,
    },
    gridIconOverlay: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 4,
        padding: 2,
    },
    /* Modal Styles */
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    closeButton: {
        padding: 4,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
    },
    /* Post Image Styles */
    postImage: {
        width: '100%',
        height: 300,
    },
    videoContainer: {
        width: '100%',
        height: 200,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoText: {
        marginTop: 8,
        color: '#64748B',
        fontSize: 14,
    },
    postContent: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 8,
    },
    postText: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 20,
    },
    tagsContainer: {
        flexDirection: 'row',
        marginTop: 8,
        flexWrap: 'wrap',
    },
    tag: {
        marginRight: 6,
        marginTop: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 6,
    },
    tagText: {
        fontSize: 12,
        color: '#4F46E5',
        fontWeight: '500',
    },
    postFooter: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    footerText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#64748B',
    },
    imageFallback: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    fullImage: {
        width: '100%',
        height: '80%',
    },
});

export default ProfileDetailsScreen;

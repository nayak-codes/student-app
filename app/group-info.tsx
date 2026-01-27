import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayRemove, arrayUnion, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
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
import { auth, db } from '../src/config/firebase';
import { useTheme } from '../src/contexts/ThemeContext';
import { UserProfile } from '../src/services/authService';
import { Conversation } from '../src/services/chatService';

export default function GroupInfoScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const params = useLocalSearchParams();

    const conversationId = params.conversationId as string;

    const [groupData, setGroupData] = useState<Conversation | null>(null);
    const [members, setMembers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCreator, setIsCreator] = useState(false);

    useEffect(() => {
        fetchGroupInfo();
    }, [conversationId]);

    const fetchGroupInfo = async () => {
        try {
            const groupDoc = await getDoc(doc(db, 'conversations', conversationId));
            if (groupDoc.exists()) {
                const data = groupDoc.data() as Conversation;
                setGroupData(data);

                // Check if current user is admin
                const currentUserId = auth.currentUser?.uid;
                setIsAdmin(data.admins?.includes(currentUserId || '') || false);

                // Check if current user is the creator
                setIsCreator(data.createdBy === currentUserId);

                // Fetch member details
                const memberPromises = data.participants.map(async (userId) => {
                    const userDoc = await getDoc(doc(db, 'users', userId));
                    return { id: userId, ...userDoc.data() } as UserProfile;
                });

                const memberData = await Promise.all(memberPromises);
                setMembers(memberData);
            }
        } catch (error) {
            console.error('Error fetching group info:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMembers = () => {
        router.push({
            pathname: '/select-members',
            params: { conversationId, isAddingToGroup: 'true' }
        });
    };

    const handleMakeAdmin = async (userId: string) => {
        if (!isAdmin) return;

        try {
            await updateDoc(doc(db, 'conversations', conversationId), {
                admins: arrayUnion(userId)
            });
            Alert.alert('Success', 'Member is now an admin');
            fetchGroupInfo();
        } catch (error) {
            console.error('Error making admin:', error);
            Alert.alert('Error', 'Failed to make member admin');
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!isAdmin) return;

        Alert.alert(
            'Remove Member',
            'Are you sure you want to remove this member?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db, 'conversations', conversationId), {
                                participants: arrayRemove(userId),
                                admins: arrayRemove(userId)
                            });
                            Alert.alert('Success', 'Member removed');
                            fetchGroupInfo();
                        } catch (error) {
                            console.error('Error removing member:', error);
                            Alert.alert('Error', 'Failed to remove member');
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteGroup = () => {
        if (!isCreator) {
            Alert.alert('Error', 'Only group creator can delete the group');
            return;
        }

        Alert.alert(
            'Delete Group',
            'Are you sure you want to permanently delete this group? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'conversations', conversationId));
                            router.back();
                            router.back(); // Go back twice to leave group chat
                            Alert.alert('Success', 'Group deleted successfully');
                        } catch (error) {
                            console.error('Error deleting group:', error);
                            Alert.alert('Error', 'Failed to delete group');
                        }
                    }
                }
            ]
        );
    };

    const handleExitGroup = () => {
        Alert.alert(
            'Exit Group',
            'Are you sure you want to exit this group?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Exit',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const currentUserId = auth.currentUser?.uid;
                            if (currentUserId) {
                                await updateDoc(doc(db, 'conversations', conversationId), {
                                    participants: arrayRemove(currentUserId),
                                    admins: arrayRemove(currentUserId)
                                });
                                router.back();
                                router.back(); // Go back twice to leave chat screen
                            }
                        } catch (error) {
                            console.error('Error exiting group:', error);
                            Alert.alert('Error', 'Failed to exit group');
                        }
                    }
                }
            ]
        );
    };

    const handleMuteNotifications = () => {
        Alert.alert('Mute Notifications', 'This feature will be implemented soon');
    };

    const handleAddImportantMember = async (userId: string) => {
        if (!isAdmin) {
            Alert.alert('Permission Denied', 'Only admins can manage important members');
            return;
        }

        try {
            const currentImportant = groupData?.importantMembers || [];

            // Check if already important
            if (currentImportant.includes(userId)) {
                Alert.alert('Already Added', 'This member is already in the important members list');
                return;
            }

            // Check max limit
            if (currentImportant.length >= 5) {
                Alert.alert('Limit Reached', 'You can only have up to 5 important members');
                return;
            }

            await updateDoc(doc(db, 'conversations', conversationId), {
                importantMembers: arrayUnion(userId)
            });

            Alert.alert('Success', 'Member added to important members');
            fetchGroupInfo();
        } catch (error) {
            console.error('Error adding important member:', error);
            Alert.alert('Error', 'Failed to add important member');
        }
    };

    const handleRemoveImportantMember = async (userId: string) => {
        if (!isAdmin) {
            Alert.alert('Permission Denied', 'Only admins can manage important members');
            return;
        }

        try {
            await updateDoc(doc(db, 'conversations', conversationId), {
                importantMembers: arrayRemove(userId)
            });

            Alert.alert('Success', 'Member removed from important members');
            fetchGroupInfo();
        } catch (error) {
            console.error('Error removing important member:', error);
            Alert.alert('Error', 'Failed to remove important member');
        }
    };

    const renderMember = (member: UserProfile) => {
        const currentUserId = auth.currentUser?.uid;
        const isMemberAdmin = groupData?.admins?.includes(member.id) || false;
        const isCurrentUser = member.id === currentUserId;
        const isImportant = groupData?.importantMembers?.includes(member.id) || false;

        return (
            <TouchableOpacity
                key={member.id}
                style={[styles.memberItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
                onPress={() => {
                    if (!isCurrentUser) {
                        router.push({ pathname: '/public-profile', params: { userId: member.id } });
                    }
                }}
                onLongPress={() => {
                    if (isAdmin && !isCurrentUser) {
                        Alert.alert(
                            member.name,
                            'What would you like to do?',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                ...(!isMemberAdmin ? [{
                                    text: 'Make Admin',
                                    onPress: () => handleMakeAdmin(member.id)
                                }] : []),
                                ...(isImportant ? [{
                                    text: '⭐ Remove from Important',
                                    onPress: () => handleRemoveImportantMember(member.id)
                                }] : [{
                                    text: '⭐ Mark as Important',
                                    onPress: () => handleAddImportantMember(member.id)
                                }]),
                                {
                                    text: 'Remove from Group',
                                    style: 'destructive',
                                    onPress: () => handleRemoveMember(member.id)
                                }
                            ]
                        );
                    }
                }}
            >
                <View style={styles.memberLeft}>
                    {member.photoURL || member.profilePhoto ? (
                        <Image
                            source={{ uri: member.photoURL || member.profilePhoto }}
                            style={styles.memberAvatar}
                        />
                    ) : (
                        <View style={[styles.memberAvatar, styles.memberAvatarPlaceholder, { backgroundColor: colors.primary }]}>
                            <Text style={styles.memberAvatarText}>
                                {member.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}

                    <View style={styles.memberInfo}>
                        <View style={styles.memberNameRow}>
                            <Text style={[styles.memberName, { color: colors.text }]}>
                                {member.name}
                                {isCurrentUser && ' (You)'}
                            </Text>
                            {isMemberAdmin && (
                                <View style={[styles.adminBadge, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.adminBadgeText}>Admin</Text>
                                </View>
                            )}
                            {isImportant && (
                                <View style={[styles.importantBadge, { backgroundColor: '#FEF3C7' }]}>
                                    <Ionicons name="star" size={12} color="#F59E0B" />
                                </View>
                            )}
                        </View>
                        <Text style={[styles.memberStatus, { color: colors.textSecondary }]}>
                            {member.headline || member.exam || 'Member'}
                        </Text>
                    </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Group Info</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Group Header */}
                <View style={[styles.groupHeader, { backgroundColor: colors.card }]}>
                    {groupData?.groupIcon ? (
                        <Image source={{ uri: groupData.groupIcon }} style={styles.groupIcon} />
                    ) : (
                        <View style={[styles.groupIcon, styles.groupIconPlaceholder, { backgroundColor: '#10B981' }]}>
                            <Ionicons name="people" size={48} color="#FFF" />
                        </View>
                    )}
                    <Text style={[styles.groupName, { color: colors.text }]}>
                        {groupData?.groupName}
                    </Text>
                    <Text style={[styles.groupDescription, { color: colors.textSecondary }]}>
                        {groupData?.groupDescription || 'No description'}
                    </Text>
                    <Text style={[styles.groupStats, { color: colors.textSecondary }]}>
                        Created {groupData?.createdAt ? new Date(groupData.createdAt.toMillis()).toLocaleDateString() : 'recently'}
                    </Text>

                    {/* Action Buttons - WhatsApp Style */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
                            <Ionicons name="search-outline" size={24} color="#10B981" />
                            <Text style={[styles.actionButtonText, { color: colors.text }]}>Search</Text>
                        </TouchableOpacity>
                        {isAdmin && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}
                                onPress={handleAddMembers}
                            >
                                <Ionicons name="person-add-outline" size={24} color="#10B981" />
                                <Text style={[styles.actionButtonText, { color: colors.text }]}>Add</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Group Description Section */}
                {groupData?.groupDescription && groupData.groupDescription !== 'No description' && (
                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <View style={styles.descriptionSection}>
                            <Text style={[styles.descriptionText, { color: colors.text }]}>
                                {groupData.groupDescription}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Mute Notifications */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <TouchableOpacity
                        style={[styles.actionItem, { borderBottomWidth: 0 }]}
                        onPress={handleMuteNotifications}
                    >
                        <View style={[styles.actionIconContainer, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                            <Ionicons name="notifications-off-outline" size={24} color={colors.text} />
                        </View>
                        <Text style={[styles.actionText, { color: colors.text }]}>Mute Notifications</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Important Members Section */}
                {groupData?.importantMembers && groupData.importantMembers.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Important Members
                            </Text>
                        </View>
                        <View style={[styles.membersContainer, { backgroundColor: colors.card }]}>
                            {members
                                .filter(m => groupData.importantMembers?.includes(m.id))
                                .map(renderMember)}
                        </View>
                    </>
                )}

                {/* Members Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        {members.length} {members.length === 1 ? 'Member' : 'Members'}
                    </Text>
                </View>

                <View style={[styles.membersContainer, { backgroundColor: colors.card }]}>
                    {members.map(renderMember)}
                </View>

                {/* Exit Group */}
                <View style={[styles.section, { backgroundColor: colors.card, marginTop: 24 }]}>
                    <TouchableOpacity
                        style={[styles.actionItem, isCreator && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                        onPress={handleExitGroup}
                    >
                        <View style={[styles.actionIconContainer, { backgroundColor: '#FEE2E2' }]}>
                            <Ionicons name="exit-outline" size={24} color="#EF4444" />
                        </View>
                        <Text style={[styles.actionText, { color: '#EF4444' }]}>Exit Group</Text>
                        <Ionicons name="chevron-forward" size={20} color="#EF4444" />
                    </TouchableOpacity>

                    {/* Delete Group - Only for Creator */}
                    {isCreator && (
                        <TouchableOpacity
                            style={[styles.actionItem, { borderBottomWidth: 0 }]}
                            onPress={handleDeleteGroup}
                        >
                            <View style={[styles.actionIconContainer, { backgroundColor: '#FEE2E2' }]}>
                                <Ionicons name="trash-outline" size={24} color="#DC2626" />
                            </View>
                            <Text style={[styles.actionText, { color: '#DC2626', fontWeight: '700' }]}>Delete Group</Text>
                            <Ionicons name="chevron-forward" size={20} color="#DC2626" />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ height: 32 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    groupHeader: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
    },
    groupIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },
    groupIconPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    groupName: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    groupDescription: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 8,
    },
    groupStats: {
        fontSize: 12,
        marginBottom: 20,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginTop: 24,
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        minWidth: 100,
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 4,
    },
    descriptionSection: {
        padding: 16,
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 20,
    },
    section: {
        marginTop: 16,
        borderRadius: 12,
        marginHorizontal: 16,
        overflow: 'hidden',
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    actionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    membersContainer: {
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
    },
    memberLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    memberAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    memberAvatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    memberAvatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    memberInfo: {
        flex: 1,
    },
    memberNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
    adminBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    adminBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFF',
    },
    importantBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
    },
    memberStatus: {
        fontSize: 13,
    },
});

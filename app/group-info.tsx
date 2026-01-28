import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayRemove, arrayUnion, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db, storage } from '../src/config/firebase';
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
    const [showAllMembers, setShowAllMembers] = useState(false);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editImage, setEditImage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

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
            if (currentImportant.length >= 15) {
                Alert.alert('Limit Reached', 'You can only have up to 15 important members');
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

    const startEditing = () => {
        setEditName(groupData?.groupName || '');
        setEditDescription(groupData?.groupDescription || '');
        setEditImage(groupData?.groupIcon || null);
        setIsEditing(true);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setEditImage(result.assets[0].uri);
        }
    };

    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            let imageUrl = editImage;
            if (editImage && editImage !== groupData?.groupIcon && !editImage.startsWith('http')) {
                const response = await fetch(editImage);
                const blob = await response.blob();
                const storageRef = ref(storage, `groups/${conversationId}/icon_${Date.now()}`);
                await uploadBytes(storageRef, blob);
                imageUrl = await getDownloadURL(storageRef);
            }

            await updateDoc(doc(db, 'conversations', conversationId), {
                groupName: editName,
                groupDescription: editDescription,
                groupIcon: imageUrl
            });

            setGroupData(prev => prev ? ({ ...prev, groupName: editName, groupDescription: editDescription, groupIcon: imageUrl || undefined }) : null);
            setIsEditing(false);
            Alert.alert('Success', 'Group updated');
        } catch (error) {
            console.error('Error updating:', error);
            Alert.alert('Error', 'Failed to update');
        } finally {
            setSaving(false);
        }
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
                {/* Professional Group Header */}
                <View style={[styles.groupHeader, { backgroundColor: colors.card, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }]}>
                    {/* Edit Button for Admin */}
                    {isAdmin && !isEditing && (
                        <TouchableOpacity style={styles.editButton} onPress={startEditing}>
                            <Ionicons name="create-outline" size={20} color={colors.text} />
                        </TouchableOpacity>
                    )}

                    {isEditing ? (
                        <View style={{ width: '100%', alignItems: 'center' }}>
                            <TouchableOpacity onPress={pickImage} style={styles.editImageOverlay}>
                                {editImage ? (
                                    <Image source={{ uri: editImage }} style={styles.groupIcon} />
                                ) : (
                                    <View style={[styles.groupIcon, styles.groupIconPlaceholder, { backgroundColor: '#10B981' }]}>
                                        <Ionicons name="camera" size={32} color="#FFF" />
                                    </View>
                                )}
                                <View style={styles.cameraBadge}>
                                    <Ionicons name="camera" size={14} color="#FFF" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        groupData?.groupIcon ? (
                            <Image source={{ uri: groupData.groupIcon }} style={styles.groupIcon} />
                        ) : (
                            <View style={[styles.groupIcon, styles.groupIconPlaceholder, { backgroundColor: '#10B981', shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 10 }]}>
                                <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#FFF' }}>
                                    {groupData?.groupName?.charAt(0)?.toUpperCase()}
                                </Text>
                            </View>
                        )
                    )}

                    {isEditing ? (
                        <View style={{ width: '100%', alignItems: 'center' }}>
                            <TextInput
                                style={[styles.editInput, { color: colors.text, borderBottomColor: colors.primary, fontSize: 24, fontWeight: 'bold', textAlign: 'center' }]}
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Group Name"
                                placeholderTextColor={colors.textSecondary}
                            />
                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
                                    onPress={() => setIsEditing(false)}
                                >
                                    <Text style={{ color: colors.text }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                                    onPress={handleSaveChanges}
                                    disabled={saving}
                                >
                                    {saving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF' }}>Save</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <Text style={[styles.groupName, { color: colors.text }]}>
                            {groupData?.groupName}
                        </Text>
                    )}



                    <View style={styles.statsRow}>
                        <View style={styles.statBadge}>
                            <Ionicons name="people" size={12} color={colors.textSecondary} />
                            <Text style={[styles.statText, { color: colors.textSecondary }]}>
                                {members.length} Members
                            </Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBadge}>
                            <Ionicons name="calendar" size={12} color={colors.textSecondary} />
                            <Text style={[styles.statText, { color: colors.textSecondary }]}>
                                {groupData?.createdAt ? new Date(groupData.createdAt.toMillis()).toLocaleDateString() : 'Active'}
                            </Text>
                        </View>
                    </View>

                    {/* Professional Action Bar */}
                    <View style={styles.actionBar}>
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                            <Ionicons name="search" size={20} color={colors.primary} />
                            <Text style={[styles.actionLabel, { color: colors.text }]}>Search</Text>
                        </TouchableOpacity>

                        {isAdmin && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}
                                onPress={handleAddMembers}
                            >
                                <Ionicons name="person-add" size={20} color={colors.primary} />
                                <Text style={[styles.actionLabel, { color: colors.text }]}>Add</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}
                            onPress={handleMuteNotifications}
                        >
                            <Ionicons name="notifications-off" size={20} color={colors.textSecondary} />
                            <Text style={[styles.actionLabel, { color: colors.text }]}>Mute</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#FEE2E2' }]}
                            onPress={handleExitGroup}
                        >
                            <Ionicons name="log-out" size={20} color="#DC2626" />
                            <Text style={[styles.actionLabel, { color: '#DC2626' }]}>Exit</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Description Card (New Separate Box) */}
                {(groupData?.groupDescription || isEditing) && (
                    <View style={[styles.section, { backgroundColor: colors.card, padding: 16, marginTop: 16 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
                        </View>

                        {isEditing ? (
                            <TextInput
                                style={[styles.descriptionInput, { color: colors.text, borderColor: colors.border }]}
                                value={editDescription}
                                onChangeText={setEditDescription}
                                multiline
                                placeholder="Enter description..."
                                placeholderTextColor={colors.textSecondary}
                            />
                        ) : (
                            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                                {groupData?.groupDescription || 'No description'}
                            </Text>
                        )}
                    </View>
                )}

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

                {/* Members Section (Redesigned) */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Community ({members.length})
                    </Text>
                    {!showAllMembers && members.length > 5 && (
                        <Text style={{ color: colors.primary, fontSize: 12 }}>Showing top 5</Text>
                    )}
                </View>

                <View style={[styles.membersContainer, { backgroundColor: colors.card, paddingVertical: 8 }]}>
                    {(showAllMembers ? members : members.slice(0, 5)).map((item, index) => (
                        <View key={item.id}>
                            {renderMember(item)}
                            {index < (showAllMembers ? members.length : 5) - 1 && (
                                <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 76, opacity: 0.5 }} />
                            )}
                        </View>
                    ))}

                    {members.length > 5 && (
                        <TouchableOpacity
                            style={styles.viewAllButton}
                            onPress={() => setShowAllMembers(!showAllMembers)}
                        >
                            <Text style={[styles.viewAllText, { color: colors.primary }]}>
                                {showAllMembers ? 'Show Less' : `View All ${members.length} Members`}
                            </Text>
                            <Ionicons
                                name={showAllMembers ? "chevron-up" : "chevron-down"}
                                size={16}
                                color={colors.primary}
                            />
                        </TouchableOpacity>
                    )}
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
        paddingVertical: 12,
        paddingHorizontal: 16,
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
        marginTop: 2,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        marginTop: 4,
        gap: 6,
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        marginBottom: 24,
        gap: 12,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    editButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    editInput: {
        borderBottomWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: 16,
        width: '80%',
    },
    descriptionInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        height: 100,
        textAlignVertical: 'top',
    },
    editImageOverlay: {
        position: 'relative',
        marginBottom: 16,
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#10B981',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    statText: {
        fontSize: 13,
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: 16,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    actionBar: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        width: '100%',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    actionLabel: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: '500',
    },
});

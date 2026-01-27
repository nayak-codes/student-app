import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getOrCreateConversation, sendMessage, sendSharedPost } from '../services/chatService';
import { getFriends } from '../services/connectionService';

interface ShareToFriendsModalProps {
    visible: boolean;
    onClose: () => void;
    postToShare: any; // Using any for FeedItem temporarily
}

const ShareToFriendsModal: React.FC<ShareToFriendsModalProps> = ({ visible, onClose, postToShare }) => {
    const { user } = useAuth();
    const { colors, isDark } = useTheme();
    const [friends, setFriends] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [sendingMap, setSendingMap] = useState<{ [key: string]: boolean }>({}); // Track sending state per user
    const [sentMap, setSentMap] = useState<{ [key: string]: boolean }>({}); // Track sent state per user
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (visible && user) {
            loadFriendsAndGroups();
        }
    }, [visible, user]);

    const loadFriendsAndGroups = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Load friends
            const friendsList = await getFriends(user.uid);
            setFriends(friendsList);

            // Load groups where user is a participant
            const groupsQuery = query(
                collection(db, 'conversations'),
                where('type', '==', 'group'),
                where('participants', 'array-contains', user.uid)
            );
            const groupsSnapshot = await getDocs(groupsQuery);
            const groupsList = groupsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                isGroup: true
            }));
            setGroups(groupsList);
        } catch (error) {
            console.error("Error loading friends and groups:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (friend: any) => {
        if (!user || !postToShare) return;

        setSendingMap(prev => ({ ...prev, [friend.userId]: true }));

        try {
            // 1. Ensure conversation exists
            const conversationId = await getOrCreateConversation(
                user.uid,
                friend.userId,
                {
                    name: friend.name,
                    photoURL: friend.photoURL,
                    email: friend.email
                }
            );

            // 2. Send the shared post
            const postData = {
                ...postToShare,
                content: postToShare.title || postToShare.content || 'Video Clip',
            };

            await sendSharedPost(conversationId, postData);

            setSentMap(prev => ({ ...prev, [friend.userId]: true }));
        } catch (error) {
            console.error("Error sharing to friend:", error);
        } finally {
            setSendingMap(prev => ({ ...prev, [friend.userId]: false }));
        }
    };

    const handleSendToGroup = async (group: any) => {
        if (!user || !postToShare) return;

        setSendingMap(prev => ({ ...prev, [group.id]: true }));

        try {
            // Send message to group
            await sendMessage(group.id, `Shared: ${postToShare.title || postToShare.content || 'a post'}`);

            setSentMap(prev => ({ ...prev, [group.id]: true }));
        } catch (error) {
            console.error("Error sharing to group:", error);
        } finally {
            setSendingMap(prev => ({ ...prev, [group.id]: false }));
        }
    };

    // Combine friends and groups into one list
    const combinedList = [
        ...friends.map(f => ({ ...f, type: 'friend', displayName: f.name, key: f.userId })),
        ...groups.map(g => ({ ...g, type: 'group', displayName: g.groupName, key: g.id }))
    ];

    const filteredList = combinedList.filter(item =>
        item.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderFriendItem = ({ item }: { item: any }) => {
        const itemKey = item.type === 'group' ? item.id : item.userId;
        const isSending = sendingMap[itemKey];
        const isSent = sentMap[itemKey];
        const isGroup = item.type === 'group';

        return (
            <View style={[styles.friendItem, { borderBottomColor: colors.border }]}>
                <View style={styles.friendInfo}>
                    {isGroup ? (
                        // Group icon
                        <View style={[styles.avatar, { backgroundColor: '#10B981' }]}>
                            <Ionicons name="people" size={20} color="#FFF" />
                        </View>
                    ) : item.photoURL ? (
                        <Image source={{ uri: item.photoURL }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                            <Text style={styles.avatarLetter}>{item.displayName?.charAt(0) || '?'}</Text>
                        </View>
                    )}
                    <View>
                        <Text style={[styles.friendName, { color: colors.text }]}>{item.displayName}</Text>
                        {isGroup && (
                            <Text style={[styles.groupSubtext, { color: colors.textSecondary }]}>
                                {item.participants?.length || 0} members
                            </Text>
                        )}
                    </View>
                </View>

                <TouchableOpacity
                    style={[
                        styles.sendBtn,
                        isSent ? styles.sentBtn : { backgroundColor: colors.primary }
                    ]}
                    onPress={() => !isSent && !isSending && (isGroup ? handleSendToGroup(item) : handleSend(item))}
                    disabled={isSent || isSending}
                >
                    {isSending ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Text style={[styles.sendBtnText, isSent && { color: colors.textSecondary }]}>
                            {isSent ? 'Sent' : 'Send'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={styles.header}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Send to</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                        <Ionicons name="search" size={20} color={colors.textSecondary} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search friends..."
                            placeholderTextColor={colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                    ) : (
                        <FlatList
                            data={filteredList}
                            renderItem={renderFriendItem}
                            keyExtractor={(item) => item.key}
                            ListEmptyComponent={
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    No friends or groups found!
                                </Text>
                            }
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '70%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    friendInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarLetter: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    friendName: {
        fontSize: 16,
        fontWeight: '600',
    },
    groupSubtext: {
        fontSize: 12,
        marginTop: 2,
    },
    sendBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 70,
        alignItems: 'center',
    },
    sentBtn: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#94A3B8',
    },
    sendBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 15,
    },
});

export default ShareToFriendsModal;

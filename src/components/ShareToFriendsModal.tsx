import { Ionicons } from '@expo/vector-icons';
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
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getOrCreateConversation, sendSharedPost } from '../services/chatService';
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
    const [loading, setLoading] = useState(false);
    const [sendingMap, setSendingMap] = useState<{ [key: string]: boolean }>({}); // Track sending state per user
    const [sentMap, setSentMap] = useState<{ [key: string]: boolean }>({}); // Track sent state per user
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (visible && user) {
            loadFriends();
        }
    }, [visible, user]);

    const loadFriends = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const friendsList = await getFriends(user.uid);
            setFriends(friendsList);
        } catch (error) {
            console.error("Error loading friends:", error);
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
            // Convert FeedItem to a format suitable for chat message if needed
            // For now passing postToShare directly as it mimics the structure expected by sendSharedPost (needs content, etc.)
            // We might need to ensure postToShare has 'content' field if it's from FeedItem which has 'title'
            const postData = {
                ...postToShare,
                content: postToShare.title || postToShare.content || 'Video Clip',
                // Add any other necessary fields
            };

            await sendSharedPost(conversationId, postData);

            setSentMap(prev => ({ ...prev, [friend.userId]: true }));
        } catch (error) {
            console.error("Error sharing to friend:", error);
            // Optionally show error toast
        } finally {
            setSendingMap(prev => ({ ...prev, [friend.userId]: false }));
        }
    };

    const filteredFriends = friends.filter(friend =>
        friend.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderFriendItem = ({ item }: { item: any }) => {
        const isSending = sendingMap[item.userId];
        const isSent = sentMap[item.userId];

        return (
            <View style={[styles.friendItem, { borderBottomColor: colors.border }]}>
                <View style={styles.friendInfo}>
                    {item.photoURL ? (
                        <Image source={{ uri: item.photoURL }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                            <Text style={styles.avatarLetter}>{item.name?.charAt(0) || '?'}</Text>
                        </View>
                    )}
                    <Text style={[styles.friendName, { color: colors.text }]}>{item.name}</Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.sendBtn,
                        isSent ? styles.sentBtn : { backgroundColor: colors.primary }
                    ]}
                    onPress={() => !isSent && !isSending && handleSend(item)}
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
                            data={filteredFriends}
                            renderItem={renderFriendItem}
                            keyExtractor={(item) => item.userId}
                            ListEmptyComponent={
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    No friends found. Use the Search tab to find people!
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

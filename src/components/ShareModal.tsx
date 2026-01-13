import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Conversation, sendSharedPDF, sendSharedPost, subscribeToConversations } from '../services/chatService';

interface ShareModalProps {
    visible: boolean;
    onClose: () => void;
    shareType: 'post' | 'pdf' | null;
    shareData: any;
}

const ShareModal: React.FC<ShareModalProps> = ({ visible, onClose, shareType, shareData }) => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [sharing, setSharing] = useState<string | null>(null);

    useEffect(() => {
        if (!visible || !user) return;

        setLoading(true);
        const unsubscribe = subscribeToConversations(user.uid, (fetchedConversations) => {
            setConversations(fetchedConversations);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [visible, user]);

    const handleShare = async (conversationId: string) => {
        if (!shareData || sharing) return;

        setSharing(conversationId);

        try {
            if (shareType === 'post') {
                await sendSharedPost(conversationId, shareData);
            } else if (shareType === 'pdf') {
                await sendSharedPDF(conversationId, shareData);
            }

            // Close modal after successful share
            onClose();
        } catch (error) {
            console.error('Error sharing content:', error);
        } finally {
            setSharing(null);
        }
    };

    const renderConversation = ({ item }: { item: Conversation }) => {
        if (!user) return null;

        // Get other participant's details
        const otherUserId = item.participants.find(id => id !== user.uid);
        if (!otherUserId) return null;

        const otherUser = item.participantDetails[otherUserId];
        const isSharing = sharing === item.id;

        return (
            <TouchableOpacity
                style={styles.conversationItem}
                onPress={() => handleShare(item.id)}
                disabled={isSharing}
            >
                <View style={styles.avatarContainer}>
                    {otherUser?.photoURL ? (
                        <Image
                            source={{ uri: otherUser.photoURL }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.conversationInfo}>
                    <Text style={styles.userName}>{otherUser?.name || 'Unknown User'}</Text>
                    {item.lastMessage && (
                        <Text style={styles.lastMessage} numberOfLines={1}>
                            {item.lastMessage.text}
                        </Text>
                    )}
                </View>
                {isSharing ? (
                    <ActivityIndicator size="small" color="#4F46E5" />
                ) : (
                    <Ionicons name="send" size={20} color="#4F46E5" />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Share to Friend</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#1E293B" />
                        </TouchableOpacity>
                    </View>

                    {/* Preview */}
                    <View style={styles.previewContainer}>
                        <Ionicons
                            name={shareType === 'post' ? 'document-text' : 'document'}
                            size={32}
                            color="#4F46E5"
                        />
                        <Text style={styles.previewText} numberOfLines={2}>
                            {shareType === 'post'
                                ? `Sharing: ${shareData?.content?.substring(0, 50)}...`
                                : `Sharing document: ${shareData?.title || 'Untitled'}`
                            }
                        </Text>
                    </View>

                    {/* Conversations List */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#4F46E5" />
                        </View>
                    ) : conversations.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={64} color="#CBD5E1" />
                            <Text style={styles.emptyTitle}>No conversations yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Start a chat with someone first to share content
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={conversations}
                            renderItem={renderConversation}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    closeButton: {
        padding: 4,
    },
    previewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8FAFC',
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 12,
    },
    previewText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#64748B',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    emptySubtitle: {
        marginTop: 8,
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#F8FAFC',
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarPlaceholder: {
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    conversationInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    lastMessage: {
        fontSize: 14,
        color: '#64748B',
    },
});

export default ShareModal;

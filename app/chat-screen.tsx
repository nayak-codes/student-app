import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { auth } from '../src/config/firebase';
import {
    markMessagesAsRead,
    Message,
    sendMessage,
    subscribeToMessages
} from '../src/services/chatService';

const ChatScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { conversationId, otherUserId, otherUserName, otherUserPhoto } = params;

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (!conversationId || typeof conversationId !== 'string') {
            return;
        }

        // Subscribe to messages
        const unsubscribe = subscribeToMessages(conversationId, (msgs) => {
            setMessages(msgs);
            setLoading(false);

            // Mark messages as read
            const currentUser = auth.currentUser;
            if (currentUser) {
                markMessagesAsRead(conversationId, currentUser.uid);
            }
        });

        return () => unsubscribe();
    }, [conversationId]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0 && flatListRef.current) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim() || sending || !conversationId || typeof conversationId !== 'string') return;

        const textToSend = inputText.trim();
        setInputText('');
        setSending(true);

        try {
            await sendMessage(conversationId, textToSend);
        } catch (error) {
            console.error('Error sending message:', error);
            // Restore message on error
            setInputText(textToSend);
        } finally {
            setSending(false);
        }
    };

    const formatMessageTime = (timestamp: any): string => {
        if (!timestamp) return '';

        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;

        return `${displayHours}:${displayMinutes} ${ampm}`;
    };

    const renderMessage = ({ item, index }: { item: Message; index: number }) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return null;

        const isOwnMessage = item.senderId === currentUser.uid;
        const showDateDivider = index === 0 ||
            (messages[index - 1] &&
                Math.abs(item.timestamp?.toMillis() - messages[index - 1].timestamp?.toMillis()) > 3600000); // 1 hour

        const isSharedContent = item.messageType === 'sharedPost' || item.messageType === 'sharedPDF';

        return (
            <View>
                {showDateDivider && (
                    <View style={styles.dateDividerContainer}>
                        <View style={styles.dateDividerLine} />
                        <Text style={styles.dateDividerText}>
                            {formatMessageTime(item.timestamp)}
                        </Text>
                        <View style={styles.dateDividerLine} />
                    </View>
                )}
                <View
                    style={[
                        styles.messageRow,
                        isOwnMessage ? styles.ownMessageRow : styles.otherMessageRow,
                    ]}
                >
                    {!isOwnMessage && (
                        <View style={styles.messageAvatarContainer}>
                            {otherUserPhoto && typeof otherUserPhoto === 'string' && otherUserPhoto.length > 0 ? (
                                <Image
                                    source={{ uri: otherUserPhoto }}
                                    style={styles.messageAvatar}
                                />
                            ) : (
                                <View style={[styles.messageAvatar, styles.avatarPlaceholder]}>
                                    <Text style={styles.avatarText}>
                                        {typeof otherUserName === 'string' ? otherUserName.charAt(0).toUpperCase() : 'U'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Render shared content or normal message */}
                    {isSharedContent && item.sharedContent ? (
                        <View style={[
                            styles.sharedContentCard,
                            isOwnMessage ? styles.ownSharedCard : styles.otherSharedCard
                        ]}>
                            <View style={styles.sharedContentHeader}>
                                <Ionicons
                                    name={item.messageType === 'sharedPost' ? 'document-text' : 'document'}
                                    size={20}
                                    color="#4F46E5"
                                />
                                <Text style={styles.sharedContentLabel}>
                                    {item.messageType === 'sharedPost' ? 'Shared Post' : 'Shared Document'}
                                </Text>
                            </View>

                            {item.messageType === 'sharedPost' && item.sharedContent.contentData ? (
                                <View style={styles.sharedPostContent}>
                                    <Text style={styles.sharedPostAuthor}>
                                        @{item.sharedContent.contentData.userName}
                                    </Text>
                                    <Text style={styles.sharedPostText} numberOfLines={3}>
                                        {item.sharedContent.contentData.content}
                                    </Text>
                                    {item.sharedContent.contentData.imageUrl && (
                                        <View style={styles.sharedPostImageContainer}>
                                            <Ionicons name="image" size={16} color="#64748B" />
                                            <Text style={styles.sharedPostImageText}>Image attached</Text>
                                        </View>
                                    )}
                                </View>
                            ) : item.messageType === 'sharedPDF' && item.sharedContent.contentData ? (
                                <View style={styles.sharedPDFContent}>
                                    <Ionicons name="document" size={32} color="#4F46E5" />
                                    <Text style={styles.sharedPDFTitle}>
                                        {item.sharedContent.contentData.title || 'Untitled Document'}
                                    </Text>
                                </View>
                            ) : null}

                            <Text style={styles.sharedContentTime}>
                                {formatMessageTime(item.timestamp)}
                            </Text>
                        </View>
                    ) : (
                        <View
                            style={[
                                styles.messageBubble,
                                isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.messageText,
                                    isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                                ]}
                            >
                                {item.text}
                            </Text>
                            <Text style={[
                                styles.messageTimeInline,
                                isOwnMessage ? styles.ownMessageTimeInline : styles.otherMessageTimeInline
                            ]}>
                                {formatMessageTime(item.timestamp)}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <View style={styles.headerAvatarContainer}>
                        {otherUserPhoto && typeof otherUserPhoto === 'string' && otherUserPhoto.length > 0 ? (
                            <Image
                                source={{ uri: otherUserPhoto }}
                                style={styles.headerAvatar}
                            />
                        ) : (
                            <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
                                <Text style={styles.headerAvatarText}>
                                    {typeof otherUserName === 'string' ? otherUserName.charAt(0).toUpperCase() : 'U'}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerName} numberOfLines={1}>
                            {otherUserName}
                        </Text>
                    </View>
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerButton}>
                        <Ionicons name="ellipsis-vertical" size={20} color="#64748B" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Messages */}
            <KeyboardAvoidingView
                style={styles.chatContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4F46E5" />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.messagesList}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="chatbubble-outline" size={64} color="#CBD5E1" />
                                <Text style={styles.emptyTitle}>Start the conversation</Text>
                                <Text style={styles.emptySubtitle}>
                                    Send a message to {otherUserName}
                                </Text>
                            </View>
                        }
                    />
                )}

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.attachButton}>
                        <Ionicons name="add-circle-outline" size={28} color="#4F46E5" />
                    </TouchableOpacity>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Type a message..."
                            placeholderTextColor="#94A3B8"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={1000}
                        />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!inputText.trim() || sending) && styles.sendButtonDisabled,
                        ]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Ionicons name="send" size={20} color="#FFF" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        marginRight: 12,
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatarContainer: {
        position: 'relative',
        marginRight: 10,
    },
    headerAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    headerInfo: {
        flex: 1,
    },
    headerAvatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    avatarPlaceholder: {
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    onlineStatus: {
        fontSize: 12,
        color: '#10B981',
        marginTop: 1,
        fontWeight: '500',
    },
    headerRight: {
        flexDirection: 'row',
        gap: 8,
    },
    headerButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesList: {
        padding: 16,
        paddingBottom: 8,
    },
    dateDividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    dateDividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E2E8F0',
    },
    dateDividerText: {
        fontSize: 11,
        color: '#64748B',
        marginHorizontal: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    ownMessageRow: {
        justifyContent: 'flex-end',
    },
    otherMessageRow: {
        justifyContent: 'flex-start',
    },
    messageAvatarContainer: {
        marginRight: 8,
    },
    messageAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    avatarText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
    messageBubble: {
        maxWidth: '75%',
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 6,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },
    ownMessageBubble: {
        backgroundColor: '#4F46E5',
        borderBottomRightRadius: 4,
    },
    otherMessageBubble: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
        marginBottom: 2,
    },
    ownMessageText: {
        color: '#FFFFFF',
    },
    otherMessageText: {
        color: '#1E293B',
    },
    messageTimeInline: {
        fontSize: 10,
        marginTop: 2,
        fontWeight: '500',
    },
    ownMessageTimeInline: {
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'right',
    },
    otherMessageTimeInline: {
        color: '#94A3B8',
        textAlign: 'right',
    },
    // Shared Content Card Styles
    sharedContentCard: {
        maxWidth: '80%',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    ownSharedCard: {
        borderColor: '#A78BFA',
    },
    otherSharedCard: {
        borderColor: '#E2E8F0',
    },
    sharedContentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    sharedContentLabel: {
        marginLeft: 8,
        fontSize: 12,
        fontWeight: '600',
        color: '#4F46E5',
        textTransform: 'uppercase',
    },
    sharedPostContent: {
        paddingVertical: 8,
    },
    sharedPostAuthor: {
        fontSize: 13,
        fontWeight: '700',
        color: '#4F46E5',
        marginBottom: 4,
    },
    sharedPostText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#334155',
    },
    sharedPostImageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    sharedPostImageText: {
        marginLeft: 6,
        fontSize: 12,
        color: '#64748B',
    },
    sharedPDFContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    sharedPDFTitle: {
        marginLeft: 12,
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        flex: 1,
    },
    sharedContentTime: {
        fontSize: 10,
        color: '#94A3B8',
        marginTop: 8,
        textAlign: 'right',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    attachButton: {
        marginRight: 8,
        marginBottom: 4,
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 16,
        paddingVertical: 8,
        maxHeight: 100,
    },
    input: {
        fontSize: 16,
        color: '#1E293B',
        maxHeight: 80,
        minHeight: 20,
        paddingTop: 0,
        paddingBottom: 0,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    emptySubtitle: {
        marginTop: 8,
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },
});

export default ChatScreen;

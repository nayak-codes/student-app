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
        const showTimestamp = index === 0 ||
            (messages[index - 1] &&
                Math.abs(item.timestamp?.toMillis() - messages[index - 1].timestamp?.toMillis()) > 300000); // 5 minutes

        return (
            <View style={styles.messageWrapper}>
                {showTimestamp && (
                    <Text style={styles.timestampDivider}>
                        {formatMessageTime(item.timestamp)}
                    </Text>
                )}
                <View
                    style={[
                        styles.messageContainer,
                        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
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
                    </View>
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
                    <Text style={styles.headerName} numberOfLines={1}>
                        {otherUserName}
                    </Text>
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerButton}>
                        <Ionicons name="call-outline" size={22} color="#4F46E5" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton}>
                        <Ionicons name="videocam-outline" size={22} color="#4F46E5" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Messages */}
            <KeyboardAvoidingView
                style={styles.chatContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    headerAvatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    avatarPlaceholder: {
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1E293B',
        flex: 1,
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
    messageWrapper: {
        marginBottom: 16,
    },
    timestampDivider: {
        textAlign: 'center',
        fontSize: 12,
        color: '#94A3B8',
        marginBottom: 12,
        marginTop: 8,
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    ownMessageContainer: {
        justifyContent: 'flex-end',
    },
    otherMessageContainer: {
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
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 18,
    },
    ownMessageBubble: {
        backgroundColor: '#4F46E5',
        borderBottomRightRadius: 4,
    },
    otherMessageBubble: {
        backgroundColor: '#FFF',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    ownMessageText: {
        color: '#FFF',
    },
    otherMessageText: {
        color: '#1E293B',
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
        fontSize: 15,
        color: '#1E293B',
        maxHeight: 80,
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

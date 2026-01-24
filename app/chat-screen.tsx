import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PostDetailModal from '../src/components/PostDetailModal';
import { auth } from '../src/config/firebase';
import { useTheme } from '../src/contexts/ThemeContext';
import {
    markMessagesAsRead,
    Message,
    sendMessage,
    subscribeToMessages
} from '../src/services/chatService';

const ChatScreen = () => {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const params = useLocalSearchParams();
    const { conversationId, otherUserId, otherUserName, otherUserPhoto } = params;

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [postModalVisible, setPostModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const flatListRef = useRef<FlatList>(null);

    // Collapsible Header Vars
    const scrollY = React.useRef(new Animated.Value(0)).current;
    const headerHeight = 90; // Approx height of Chat Header
    const diffClamp = Animated.diffClamp(scrollY, 0, headerHeight);
    const translateY = diffClamp.interpolate({
        inputRange: [0, headerHeight],
        outputRange: [0, -headerHeight],
    });

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
        const displayMinutes = minutes < 10 ? `0${minutes} ` : minutes;

        return `${displayHours}:${displayMinutes} ${ampm} `;
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
                        <View style={[styles.dateDividerLine, { backgroundColor: colors.border }]} />
                        <Text style={[styles.dateDividerText, { color: colors.textSecondary }]}>
                            {formatMessageTime(item.timestamp)}
                        </Text>
                        <View style={[styles.dateDividerLine, { backgroundColor: colors.border }]} />
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
                                <View style={[styles.messageAvatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.avatarText}>
                                        {typeof otherUserName === 'string' ? otherUserName.charAt(0).toUpperCase() : 'U'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Render shared content or normal message */}
                    {isSharedContent && item.sharedContent ? (
                        <TouchableOpacity
                            style={[
                                styles.sharedContentCard,
                                isOwnMessage ? styles.ownSharedCard : styles.otherSharedCard,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: isOwnMessage ? colors.primary : colors.border
                                }
                            ]}
                            onPress={() => {
                                if (item.messageType === 'sharedPost' && item.sharedContent?.contentData) {
                                    setSelectedPost(item.sharedContent.contentData);
                                    setPostModalVisible(true);
                                }
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.sharedContentHeader, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC', borderBottomColor: colors.border }]}>
                                <Ionicons
                                    name={item.messageType === 'sharedPost' ? 'document-text' : 'document'}
                                    size={20}
                                    color={colors.primary}
                                />
                                <Text style={[styles.sharedContentLabel, { color: colors.primary }]}>
                                    {item.messageType === 'sharedPost' ? 'Shared Post' : 'Shared Document'}
                                </Text>
                            </View>

                            {item.messageType === 'sharedPost' && item.sharedContent.contentData ? (
                                <View style={styles.sharedPostContent}>
                                    {/* Image first if available */}
                                    {item.sharedContent.contentData.imageUrl && (
                                        <Image
                                            source={{ uri: item.sharedContent.contentData.imageUrl }}
                                            style={styles.sharedPostImage}
                                            resizeMode="cover"
                                        />
                                    )}

                                    {/* Author and content */}
                                    <View style={styles.sharedPostTextContainer}>
                                        <View style={styles.sharedPostMeta}>
                                            <Text style={[styles.sharedPostAuthor, { color: colors.text }]}>
                                                {item.sharedContent.contentData.userName}
                                            </Text>
                                            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                                        </View>
                                        <Text style={[styles.sharedPostText, { color: colors.textSecondary }]} numberOfLines={2}>
                                            {item.sharedContent.contentData.content}
                                        </Text>
                                    </View>
                                </View>
                            ) : item.messageType === 'sharedPDF' && item.sharedContent.contentData ? (
                                <View style={styles.sharedPDFContent}>
                                    <Ionicons name="document" size={32} color={colors.primary} />
                                    <Text style={[styles.sharedPDFTitle, { color: colors.text }]}>
                                        {item.sharedContent.contentData.title || 'Untitled Document'}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </View>
                            ) : null}

                            <Text style={[styles.sharedContentTime, { color: colors.textSecondary }]}>
                                {formatMessageTime(item.timestamp)}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View
                            style={[
                                styles.messageBubble,
                                isOwnMessage ? [styles.ownMessageBubble, { backgroundColor: colors.primary }] : [styles.otherMessageBubble, { backgroundColor: colors.card }],
                            ]}
                        >
                            <Text
                                style={[
                                    styles.messageText,
                                    isOwnMessage ? styles.ownMessageText : [styles.otherMessageText, { color: colors.text }],
                                ]}
                            >
                                {item.text}
                            </Text>
                            <Text style={[
                                styles.messageTimeInline,
                                isOwnMessage ? styles.ownMessageTimeInline : [styles.otherMessageTimeInline, { color: colors.textSecondary }]
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
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            {/* Collapsible Header */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    elevation: 4,
                    backgroundColor: colors.background,
                    transform: [{ translateY }],
                }}
            >
                <SafeAreaView edges={['top']}>
                    <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>

                        <View style={styles.headerCenter}>
                            <View style={styles.headerAvatarContainer}>
                                {otherUserPhoto && typeof otherUserPhoto === 'string' && otherUserPhoto.length > 0 ? (
                                    <Image
                                        source={{ uri: otherUserPhoto }}
                                        style={styles.headerAvatar}
                                    />
                                ) : (
                                    <View style={[styles.headerAvatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                                        <Text style={styles.headerAvatarText}>
                                            {typeof otherUserName === 'string' ? otherUserName.charAt(0).toUpperCase() : 'U'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.headerInfo}>
                                <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>
                                    {otherUserName}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.headerRight}>
                            <TouchableOpacity style={[styles.headerButton, { backgroundColor: isDark ? colors.background : '#EEF2FF' }]}>
                                <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </Animated.View>

            {/* Messages */}
            <KeyboardAvoidingView
                style={styles.chatContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={[styles.messagesList, { paddingTop: 100 }]} // Add top padding
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: false }
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>Start the conversation</Text>
                                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                    Send a message to {otherUserName}
                                </Text>
                            </View>
                        }
                    />
                )}

                {/* Input Area */}
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TouchableOpacity style={styles.attachButton}>
                        <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
                    </TouchableOpacity>

                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.background : '#F8FAFC', borderColor: colors.border }]}>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Type a message..."
                            placeholderTextColor={colors.textSecondary}
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
                            { backgroundColor: colors.primary }
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

            {/* Post Detail Modal */}
            <PostDetailModal
                visible={postModalVisible}
                onClose={() => {
                    setPostModalVisible(false);
                    setSelectedPost(null);
                }}
                postData={selectedPost}
            />
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
        minWidth: '85%',
        maxWidth: '100%',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 0,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    ownSharedCard: {
        borderColor: '#C7D2FE',
    },
    otherSharedCard: {
        borderColor: '#E2E8F0',
    },
    sharedContentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 0,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    sharedContentLabel: {
        marginLeft: 8,
        fontSize: 11,
        fontWeight: '700',
        color: '#4F46E5',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sharedPostContent: {
        paddingVertical: 0,
    },
    sharedPostMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    sharedPostAuthor: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        flex: 1,
    },
    sharedPostText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#64748B',
    },
    sharedPostTextContainer: {
        padding: 12,
        paddingTop: 10,
        paddingBottom: 12,
    },
    sharedPostImage: {
        width: '100%',
        height: 200,
        backgroundColor: '#F1F5F9',
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
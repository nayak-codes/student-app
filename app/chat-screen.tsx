import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
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
import { getPostById } from '../src/services/postsService';

const SharedPostCard = ({ itemData, onPress }: { itemData: any, onPress: () => void }) => {
    const [stats, setStats] = useState({
        views: itemData.views || 0,
        likes: itemData.likes || 0
    });

    useEffect(() => {
        const fetchLatestStats = async () => {
            if (itemData.id) {
                const latestPost = await getPostById(itemData.id);
                if (latestPost) {
                    setStats({
                        views: latestPost.viewCount || latestPost.likes || 0,
                        likes: latestPost.likes || 0
                    });
                }
            }
        };
        fetchLatestStats();
    }, [itemData.id]);

    // Try all possible image keys including thumbnailUrl
    const displayImage = itemData.imageUrl || itemData.thumbnail || itemData.thumbnailUrl || itemData.mediaUrl || itemData.image;

    return (
        <TouchableOpacity
            style={styles.sharedClipContainer}
            onPress={onPress}
            activeOpacity={0.9}
        >
            {/* 1. Image Layer (Full Size) */}
            {displayImage ? (
                <Image
                    source={{ uri: displayImage }}
                    style={styles.sharedClipImage}
                    resizeMode="cover"
                />
            ) : (
                <View style={[styles.sharedClipImage, { backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="film" size={48} color="rgba(255,255,255,0.2)" />
                </View>
            )}

            {/* 2. Center Play Overlay */}
            <View style={styles.centerOverlay}>
                <Ionicons name="play-circle" size={56} color="rgba(255,255,255,0.9)" />
            </View>

            {/* 3. Gradient Overlay (Explore Style) */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
                locations={[0, 0.4, 0.7, 1]}
                style={styles.bottomOverlay}
            >
                <Text style={styles.clipTitle} numberOfLines={2}>
                    {itemData.content || itemData.title || 'Shared Clip'}
                </Text>
                <View style={styles.clipAuthorRow}>
                    <View style={styles.clipAvatarBase}>
                        <Text style={styles.clipAvatarText}>
                            {itemData.userName?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <Text style={styles.clipAuthorName}>
                        {itemData.userName || 'Unknown'}
                    </Text>
                </View>

                {/* 4. Stats Pill (Bottom Right) */}
                <View style={styles.statsPill}>
                    <Ionicons name="play" size={10} color="#FFF" />
                    <Text style={styles.statsText}>
                        {stats.views > 1000 ? `${(stats.views / 1000).toFixed(1)}k` : stats.views}
                    </Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const ChatScreen = () => {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const params = useLocalSearchParams();

    // Helper to ensure we access string params, not arrays
    const getString = (val: string | string[] | undefined) => Array.isArray(val) ? val[0] : val;

    const conversationId = getString(params.conversationId);
    const otherUserId = getString(params.otherUserId);
    const otherUserName = getString(params.otherUserName);
    const otherUserPhoto = getString(params.otherUserPhoto);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [postModalVisible, setPostModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const flatListRef = useRef<FlatList>(null);

    // Collapsible Header Vars - REMOVED for Static Header
    // const scrollY = React.useRef(new Animated.Value(0)).current; 
    // Static Header implementation requires no animation logic

    useEffect(() => {
        if (!conversationId || typeof conversationId !== 'string') {
            return;
        }

        // Mark messages as read when entering screen
        if (auth.currentUser) {
            markMessagesAsRead(conversationId, auth.currentUser.uid);
        }

        const unsubscribe = subscribeToMessages(conversationId, (newMessages) => {
            setMessages(newMessages);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [conversationId]);

    const handleSend = async () => {
        if (!inputText.trim() || !conversationId || typeof conversationId !== 'string') return;

        setSending(true);
        try {
            await sendMessage(conversationId, inputText.trim());
            setInputText('');
        } catch (error) {
            console.error('Error sending message:', error);
            // alert('Failed to send message'); // Removed alert for smoother UX
        } finally {
            setSending(false);
        }
    };

    const formatMessageTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const renderDateHeader = (date: Date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let dateString = '';
        if (isSameDay(date, today)) {
            dateString = 'Today';
        } else if (isSameDay(date, yesterday)) {
            dateString = 'Yesterday';
        } else {
            dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        }

        return (
            <View style={styles.dateHeader}>
                <Text style={styles.dateHeaderText}>{dateString}</Text>
            </View>
        );
    };

    const renderMessage = ({ item, index }: { item: Message; index: number }) => {
        const isOwnMessage = item.senderId === auth.currentUser?.uid;
        const messageDate = item.timestamp?.toDate ? item.timestamp.toDate() : new Date();
        const prevMessage = messages[index + 1];
        const prevMessageDate = prevMessage?.timestamp?.toDate ? prevMessage.timestamp.toDate() : null;

        const showDateHeader = !prevMessageDate || !isSameDay(messageDate, prevMessageDate);
        const isSharedContent = item.messageType === 'sharedPost' || item.messageType === 'sharedPDF';

        return (
            <View>
                {showDateHeader && renderDateHeader(messageDate)}
                <View style={[
                    styles.messageContainer,
                    isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
                ]}>
                    {/* Message Row Layout */}
                    {!isOwnMessage && (
                        <View style={styles.avatarContainer}>
                            {item.senderPhoto ? (
                                <Image source={{ uri: item.senderPhoto }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>
                                        {item.senderName?.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {isSharedContent ? (
                        <TouchableOpacity
                            style={[
                                styles.sharedContentCard,
                                isOwnMessage ? styles.ownSharedCard : styles.otherSharedCard,
                                {
                                    backgroundColor: item.messageType === 'sharedPost' ? 'transparent' : colors.card,
                                    borderColor: item.messageType === 'sharedPost' ? 'transparent' : (isOwnMessage ? colors.primary : colors.border),
                                    borderWidth: item.messageType === 'sharedPost' ? 0 : 1,
                                    elevation: item.messageType === 'sharedPost' ? 0 : 2,
                                    width: item.messageType === 'sharedPost' ? (Dimensions.get('window').width / 2 - 20) : 250,
                                    borderRadius: item.messageType === 'sharedPost' ? 20 : 12,
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
                            {item.messageType !== 'sharedPost' && (
                                <View style={[styles.sharedContentHeader, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC', borderBottomColor: colors.border }]}>
                                    <Ionicons
                                        name={'document'}
                                        size={20}
                                        color={colors.primary}
                                    />
                                    <Text style={[styles.sharedContentLabel, { color: colors.primary }]}>
                                        {'Shared Document'}
                                    </Text>
                                </View>
                            )}

                            {item.messageType === 'sharedPost' && item.sharedContent?.contentData ? (
                                <SharedPostCard
                                    itemData={item.sharedContent.contentData}
                                    onPress={() => {
                                        if (item.sharedContent?.contentData) {
                                            setSelectedPost(item.sharedContent.contentData);
                                            setPostModalVisible(true);
                                        }
                                    }}
                                />
                            ) : item.messageType === 'sharedPDF' && item.sharedContent?.contentData ? (
                                <View style={styles.sharedPDFContent}>
                                    <Ionicons name="document" size={32} color={colors.primary} />
                                    <Text style={[styles.sharedPDFTitle, { color: colors.text }]}>
                                        {item.sharedContent?.contentData?.title || 'Untitled Document'}
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
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            {/* Static Header without Animation */}
            <View style={styles.headerContainer}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.headerProfileContainer} activeOpacity={0.7}>
                        {otherUserPhoto ? (
                            <Image source={{ uri: otherUserPhoto }} style={styles.headerAvatar} />
                        ) : (
                            <View style={[styles.headerAvatarPlaceholder, { backgroundColor: colors.primary }]}>
                                <Text style={styles.headerAvatarText}>
                                    {otherUserName?.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <View style={styles.headerInfo}>
                            <Text style={styles.headerName}>{otherUserName}</Text>
                            <Text style={styles.headerStatus}>Online</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.headerRight}>
                        <TouchableOpacity style={[styles.headerButton, { backgroundColor: '#1F2C34' }]}>
                            <Ionicons name="videocam" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.headerButton, { backgroundColor: '#1F2C34' }]}>
                            <Ionicons name="call" size={20} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.headerButton, { backgroundColor: '#1F2C34' }]}>
                            <Ionicons name="ellipsis-vertical" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
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
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.messagesList}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    />
                )}
                {messages.length === 0 && !loading && (
                    <View style={styles.emptyState}>
                        <Ionicons name="chatbubbles-outline" size={64} color={colors.border} />
                        <Text style={styles.emptyTitle}>No messages yet</Text>
                        <Text style={styles.emptySubtitle}>Start the conversation!</Text>
                    </View>
                )}

                {/* Input Area */}
                <View style={[styles.inputContainer, {
                    backgroundColor: isDark ? '#1F2C34' : '#FFF', // Make input container dark in dark mode
                    borderTopColor: isDark ? '#374151' : '#F1F5F9'
                }]}>
                    <TouchableOpacity style={styles.attachButton}>
                        <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
                    </TouchableOpacity>

                    <View style={[styles.inputWrapper, {
                        backgroundColor: isDark ? '#2D3748' : '#F0F2F5' // Darker input bg
                    }]}>
                        <TextInput
                            style={[styles.input, { color: isDark ? '#F8FAFC' : '#1E293B' }]}
                            placeholder="Message"
                            placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            { backgroundColor: inputText.trim() ? colors.primary : '#374151' }, // Darker disabled state
                            !inputText.trim() && styles.sendButtonDisabled
                        ]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || sending}
                    >
                        <Ionicons name="send" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <PostDetailModal
                visible={postModalVisible}
                onClose={() => setPostModalVisible(false)}
                postData={selectedPost}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // NEW STATIC HEADER STYLES
    headerContainer: {
        backgroundColor: '#000000', // Black Header
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        zIndex: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 60,
        paddingHorizontal: 16,
    },
    backButton: {
        padding: 8,
        marginRight: 4,
    },
    headerProfileContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E2E8F0',
    },
    headerAvatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerAvatarText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
    },
    headerInfo: {
        marginLeft: 12,
    },
    headerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF', // White Text
    },
    headerStatus: {
        fontSize: 12,
        color: '#22c55e', // Online green
        fontWeight: '500',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // Space between buttons
    },
    headerButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
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
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
    },
    dateHeader: {
        alignItems: 'center',
        marginVertical: 16,
    },
    dateHeaderText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94A3B8',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    messageContainer: {
        marginBottom: 16,
        maxWidth: '80%',
    },
    ownMessageContainer: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse', // Align items to end
    },
    otherMessageContainer: {
        alignSelf: 'flex-start',
        flexDirection: 'row', // Align avatar and bubble in row
        alignItems: 'flex-end',
    },
    avatarContainer: {
        marginRight: 8,
        width: 32,
        height: 32,
        marginBottom: 2, // Align with bottom of bubble
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E2E8F0',
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    avatarText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
    messageBubble: {
        borderRadius: 18,
        padding: 12,
        maxWidth: '100%',
        elevation: 2,
    },
    ownMessageBubble: {
        backgroundColor: '#243266ff', // Pure Red
        borderBottomRightRadius: 4,
        borderTopRightRadius: 18,
        borderBottomLeftRadius: 18,
        borderTopLeftRadius: 18,
    },
    otherMessageBubble: {
        backgroundColor: '#334155', // Dark Slate Gray
        borderBottomLeftRadius: 4,
        borderTopLeftRadius: 18,
        borderBottomRightRadius: 18,
        borderTopRightRadius: 18,
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
        color: '#FFFFFF',
    },
    messageTimeInline: {
        fontSize: 10,
        alignSelf: 'flex-end',
        opacity: 0.8,
    },
    ownMessageTimeInline: {
        color: 'rgba(255, 255, 255, 0.9)',
    },
    otherMessageTimeInline: {
        color: 'rgba(255, 255, 255, 0.7)',
    },

    // SHARED CONTENT CARD STYLES
    sharedContentCard: {
        width: 250,
        backgroundColor: '#FFF',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 2,
    },
    ownSharedCard: {
        borderBottomRightRadius: 0,
    },
    otherSharedCard: {
        borderBottomLeftRadius: 0,
    },
    sharedContentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
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
    sharedClipContainer: {
        width: '100%',
        height: 320, // Taller for clip look
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#1E293B', // Dark placeholder background
    },
    sharedClipImage: {
        width: '100%',
        height: '100%',
    },
    centerOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    bottomOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        paddingBottom: 16,
        backgroundColor: 'rgba(0,0,0,0.4)', // Dim bottom for text readability
        justifyContent: 'flex-end',
        zIndex: 2,
    },
    clipTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    clipAuthorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    clipAvatarBase: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 6,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    clipAvatarText: {
        fontSize: 10,
        color: '#FFF',
        fontWeight: '700',
    },
    clipAuthorName: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '500',
        opacity: 0.9,
    },
    statsPill: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        zIndex: 3,
    },
    statsText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '600',
        marginLeft: 4,
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
        backgroundColor: '#F0F2F5',
        borderRadius: 24, // Pill shape
        borderWidth: 0, // No border
        borderColor: 'transparent',
        paddingHorizontal: 20,
        paddingVertical: 10,
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
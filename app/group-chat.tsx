import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import GroupOptionsSheet from '../src/components/GroupOptionsSheet';
import ImportantMembersCard from '../src/components/ImportantMembersCard';
import { auth, db } from '../src/config/firebase';
import { useTheme } from '../src/contexts/ThemeContext';
import { UserProfile } from '../src/services/authService';
import {
    Conversation,
    markMessagesAsRead,
    Message,
    sendMessage,
    subscribeToMessages
} from '../src/services/chatService';

export default function GroupChatScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const params = useLocalSearchParams();

    const getString = (val: string | string[] | undefined) => Array.isArray(val) ? val[0] : val;

    const conversationId = getString(params.conversationId);
    const groupName = getString(params.groupName);
    const groupIcon = getString(params.groupIcon);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [groupData, setGroupData] = useState<Conversation | null>(null);
    const [showOptionsSheet, setShowOptionsSheet] = useState(false);
    const [filteredUserId, setFilteredUserId] = useState<string | null>(null);
    const [importantMembers, setImportantMembers] = useState<UserProfile[]>([]);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (!conversationId || typeof conversationId !== 'string') {
            return;
        }

        // Subscribe to group details for real-time updates (Important Members, etc.)
        const unsubscribeGroup = onSnapshot(doc(db, 'conversations', conversationId), async (groupDoc) => {
            if (groupDoc.exists()) {
                const data = groupDoc.data() as Conversation;
                setGroupData(data);

                // Fetch important members details
                if (data.importantMembers && data.importantMembers.length > 0) {
                    try {
                        const memberProfiles = await Promise.all(
                            data.importantMembers.map(async (userId) => {
                                const userDoc = await getDoc(doc(db, 'users', userId));
                                if (userDoc.exists()) {
                                    return { id: userId, ...userDoc.data() } as UserProfile;
                                }
                                return null;
                            })
                        );
                        setImportantMembers(memberProfiles.filter(m => m !== null) as UserProfile[]);
                    } catch (error) {
                        console.error('Error fetching important members:', error);
                    }
                } else {
                    setImportantMembers([]);
                }
            }
        });

        // Mark messages as read
        if (auth.currentUser) {
            markMessagesAsRead(conversationId, auth.currentUser.uid);
        }

        const unsubscribe = subscribeToMessages(conversationId, (newMessages) => {
            setMessages(newMessages);
            setLoading(false);
        });

        return () => {
            unsubscribe();
            unsubscribeGroup();
        };
    }, [conversationId]);

    const handleSend = async () => {
        if (!inputText.trim() || !conversationId || typeof conversationId !== 'string') return;

        setSending(true);
        try {
            await sendMessage(conversationId, inputText.trim());
            setInputText('');
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (error) {
            console.error('Error sending message:', error);
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
        const prevMessage = messages[index - 1];
        const prevMessageDate = prevMessage?.timestamp?.toDate ? prevMessage.timestamp.toDate() : null;

        const showDateHeader = !prevMessageDate || !isSameDay(messageDate, prevMessageDate);

        // Show sender name for group messages (for others' messages)
        const showSenderName = !isOwnMessage;
        const senderName = item.senderName || 'Unknown';

        return (
            <View>
                {showDateHeader && renderDateHeader(messageDate)}
                <View style={[
                    styles.messageContainer,
                    isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
                ]}>
                    {/* Avatar for other users */}
                    {!isOwnMessage && (
                        <TouchableOpacity
                            style={styles.avatarContainer}
                            onPress={() => router.push({ pathname: '/public-profile', params: { userId: item.senderId } })}
                        >
                            {item.senderPhoto ? (
                                <Image source={{ uri: item.senderPhoto }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>
                                        {senderName.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}

                    <View style={{ flex: 1 }}>
                        {/* Sender Name (for group chats) */}
                        {showSenderName && (
                            <Text style={[styles.senderName, { color: colors.textSecondary }]}>
                                {senderName}
                            </Text>
                        )}

                        {/* Message Bubble */}
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
                    </View>
                </View>
            </View>
        );
    };

    const memberCount = groupData?.participants?.length || 0;

    // Filter messages if a user is selected
    const displayedMessages = filteredUserId
        ? messages.filter(msg => msg.senderId === filteredUserId)
        : messages;

    const handleSelectMember = (userId: string) => {
        setFilteredUserId(userId);
    };

    const handleClearFilter = () => {
        setFilteredUserId(null);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            {/* Header */}
            <View style={styles.headerContainer}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.headerProfileContainer}
                        activeOpacity={0.7}
                        onPress={() => {
                            router.push({
                                pathname: '/group-info',
                                params: { conversationId }
                            });
                        }}
                    >
                        {groupIcon ? (
                            <Image source={{ uri: groupIcon }} style={styles.headerAvatar} />
                        ) : (
                            <View style={[styles.headerAvatarPlaceholder, { backgroundColor: '#10B981' }]}>
                                <Ionicons name="people" size={20} color="#FFF" />
                            </View>
                        )}
                        <View style={styles.headerInfo}>
                            <Text style={styles.headerName}>{groupName || 'Group'}</Text>
                            <Text style={styles.headerStatus}>
                                {memberCount} {memberCount === 1 ? 'member' : 'members'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.headerRight}>
                        <TouchableOpacity style={[styles.headerButton, { backgroundColor: '#1F2C34' }]}>
                            <Ionicons name="videocam" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.headerButton, { backgroundColor: '#1F2C34' }]}>
                            <Ionicons name="call" size={20} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.headerButton, { backgroundColor: '#1F2C34' }]}
                            onPress={() => setShowOptionsSheet(true)}
                        >
                            <Ionicons name="ellipsis-vertical" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Important Members Filter Card */}
            {importantMembers.length > 0 && (
                <ImportantMembersCard
                    importantMembers={importantMembers}
                    onSelectMember={handleSelectMember}
                    onClearFilter={handleClearFilter}
                    activeMemberId={filteredUserId}
                />
            )}

            {/* Filter Indicator */}
            {filteredUserId && (
                <View style={[styles.filterIndicator, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
                    <Ionicons name="filter" size={16} color="#10B981" />
                    <Text style={[styles.filterText, { color: colors.text }]}>
                        Filtering: {importantMembers.find(m => m.id === filteredUserId)?.name}
                    </Text>
                    <Text style={[styles.filterCount, { color: colors.textSecondary }]}>
                        ({displayedMessages.length} messages)
                    </Text>
                </View>
            )}

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
                        data={displayedMessages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.messagesList}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    />
                )}
                {messages.length === 0 && !loading && (
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIconContainer, { backgroundColor: colors.card }]}>
                            <Ionicons name="people-outline" size={48} color={colors.primary} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>Welcome to {groupName}!</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                            Start the conversation with your group members
                        </Text>
                    </View>
                )}

                {/* Input Area */}
                <View style={[styles.inputContainer, {
                    backgroundColor: isDark ? '#1F2C34' : '#FFF',
                    borderTopColor: isDark ? '#374151' : '#F1F5F9'
                }]}>
                    <TouchableOpacity style={styles.attachButton}>
                        <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
                    </TouchableOpacity>

                    <View style={[styles.inputWrapper, {
                        backgroundColor: isDark ? '#2D3748' : '#F0F2F5'
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
                            { backgroundColor: inputText.trim() ? colors.primary : '#374151' },
                            !inputText.trim() && styles.sendButtonDisabled
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

            {/* Group Options Bottom Sheet */}
            <GroupOptionsSheet
                visible={showOptionsSheet}
                onClose={() => setShowOptionsSheet(false)}
                options={[
                    {
                        icon: 'information-circle-outline',
                        label: 'Group Info',
                        onPress: () => router.push({
                            pathname: '/group-info',
                            params: { conversationId }
                        })
                    },
                    {
                        icon: 'search-outline',
                        label: 'Search Messages',
                        onPress: () => Alert.alert('Search', 'Feature coming soon')
                    },
                    {
                        icon: 'notifications-off-outline',
                        label: 'Mute Notifications',
                        onPress: () => Alert.alert('Mute', 'Feature coming soon')
                    },
                    {
                        icon: 'exit-outline',
                        label: 'Exit Group',
                        destructive: true,
                        onPress: () => {
                            Alert.alert(
                                'Exit Group',
                                'Are you sure you want to exit this group?',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Exit',
                                        style: 'destructive',
                                        onPress: () => router.back()
                                    }
                                ]
                            );
                        }
                    }
                ]}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        backgroundColor: '#000000',
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
    headerInfo: {
        marginLeft: 12,
    },
    headerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    headerStatus: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
        marginBottom: 12,
        maxWidth: '80%',
    },
    ownMessageContainer: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    otherMessageContainer: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    avatarContainer: {
        marginRight: 8,
        width: 32,
        height: 32,
        marginBottom: 2,
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
    senderName: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        marginLeft: 12,
    },
    messageBubble: {
        borderRadius: 18,
        padding: 12,
        maxWidth: '100%',
        elevation: 2,
    },
    ownMessageBubble: {
        backgroundColor: '#25D366',
        borderBottomRightRadius: 4,
        borderTopRightRadius: 18,
        borderBottomLeftRadius: 18,
        borderTopLeftRadius: 18,
    },
    otherMessageBubble: {
        backgroundColor: '#334155',
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
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderTopWidth: 1,
    },
    attachButton: {
        padding: 4,
        marginRight: 8,
    },
    inputWrapper: {
        flex: 1,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        maxHeight: 100,
    },
    input: {
        fontSize: 15,
        maxHeight: 80,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    filterIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 6,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
    },
    filterCount: {
        fontSize: 12,
    },
});


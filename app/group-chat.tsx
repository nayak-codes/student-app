import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Clipboard,
    Dimensions,
    FlatList,
    Image,
    ImageBackground,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ChatAttachmentMenu, { AttachmentType } from '../src/components/ChatAttachmentMenu';
import DocumentViewer from '../src/components/DocumentViewer';
import GroupOptionsSheet from '../src/components/GroupOptionsSheet';
import ImportantMembersCard from '../src/components/ImportantMembersCard';
import MediaPreviewModal, { AttachmentPreview } from '../src/components/MediaPreviewModal';
import { EmojiTray, ReactionChips } from '../src/components/MessageReactions';
import PollCreator from '../src/components/PollCreator';
import PollMessage from '../src/components/PollMessage';
import ReplyPreview, { QuotedMessageBubble } from '../src/components/ReplyPreview';
import GroupRoleBadge from '../src/components/GroupRoleBadge';
import { auth, db } from '../src/config/firebase';
import { useTheme } from '../src/contexts/ThemeContext';
import { UserProfile } from '../src/services/authService';
import {
    addReaction,
    Conversation,
    deleteMessage,
    markMessagesAsRead,
    Message,
    pinMessage,
    sendMessage,
    setMessagePriority,
    setTypingStatus,
    subscribeToMessages,
    subscribeToTyping,
    voteOnPoll,
    toggleAnnouncementOnly
} from '../src/services/chatService';
import { incrementViews, LibraryResource } from '../src/services/libraryService';
import { pickDocument, pickImage, takePhoto, uploadMedia } from '../src/services/mediaService';



// Session persistence for filter visibility
const filterCheckState = new Map<string, boolean>();

export default function GroupChatScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { isConnected } = useNetInfo();
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        if (Platform.OS === 'android') {
            const showSub = Keyboard.addListener('keyboardDidShow', (e: any) => setKeyboardHeight(e.endCoordinates.height));
            const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
            return () => { showSub.remove(); hideSub.remove(); };
        }
    }, []);

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
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [showPollCreator, setShowPollCreator] = useState(false);
    const [filteredUserId, setFilteredUserId] = useState<string | null>(null);
    const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreview | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [filteredMediaType, setFilteredMediaType] = useState<'all' | 'image' | 'pdf' | 'other'>('all');
    const [importantMembers, setImportantMembers] = useState<UserProfile[]>([]);

    // ── New Polish State ──
    const [replyTo, setReplyTo] = useState<{ messageId: string; text: string; senderName: string; messageType?: string } | null>(null);
    const [emojiTrayVisible, setEmojiTrayVisible] = useState(false);
    const [emojiTrayMessage, setEmojiTrayMessage] = useState<Message | null>(null);
    const [emojiTrayPosition, setEmojiTrayPosition] = useState({ x: 0, y: 0 });
    const [typingNames, setTypingNames] = useState<string[]>([]);
    const [contextMenuMessage, setContextMenuMessage] = useState<Message | null>(null);
    const typingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initialize with persisted state
    const [showImportantMembersCard, setShowImportantMembersCard] = useState(() => {
        if (typeof params.conversationId === 'string') {
            return filterCheckState.has(params.conversationId) ? filterCheckState.get(params.conversationId)! : false;
        }
        return false;
    });

    // Update persistence when state changes
    useEffect(() => {
        const id = getString(params.conversationId);
        if (id) {
            filterCheckState.set(id, showImportantMembersCard);
        }
    }, [showImportantMembersCard, params.conversationId]);


    const flatListRef = useRef<FlatList>(null);

    // Mark messages as read only when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (conversationId && auth.currentUser) {
                markMessagesAsRead(conversationId, auth.currentUser.uid);
            }
        }, [conversationId])
    );

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

        const unsubscribe = subscribeToMessages(conversationId, (newMessages) => {
            setMessages(newMessages);
            setLoading(false);

            // Auto mark new messages as read since the user is on this screen
            if (auth.currentUser) {
                const hasUnread = newMessages.some(m => m.senderId !== auth.currentUser?.uid && !m.read);
                if (hasUnread) {
                    markMessagesAsRead(conversationId, auth.currentUser.uid);
                }
            }
        });

        return () => {
            unsubscribe();
            unsubscribeGroup();
        };
    }, [conversationId]);

    // Typing subscription
    useEffect(() => {
        if (!conversationId || !auth.currentUser) return;
        const unsubTyping = subscribeToTyping(conversationId, auth.currentUser.uid, setTypingNames);
        return () => unsubTyping();
    }, [conversationId]);

    // Document Viewer State
    const [viewerVisible, setViewerVisible] = useState(false);
    const [selectedResource, setSelectedResource] = useState<LibraryResource | null>(null);

    const handleOpenDocument = async (resource: LibraryResource) => {
        try {
            if (resource.id) await incrementViews(resource.id);
            setSelectedResource(resource);
            setViewerVisible(true);
        } catch (error) {
            console.error("Error opening document:", error);
        }
    };

    const handleAttachmentSelect = async (type: AttachmentType) => {
        setShowAttachmentMenu(false);
        try {
            if (type === 'gallery') {
                const uri = await pickImage();
                if (uri) {
                    setPreviewAttachment({ uri, type: 'image' });
                    setShowPreview(true);
                }
            } else if (type === 'camera') {
                const photoUri = await takePhoto();
                if (photoUri) {
                    setPreviewAttachment({ uri: photoUri, type: 'image' });
                    setShowPreview(true);
                }
            } else if (type === 'document') {
                const docUri = await pickDocument();
                if (docUri) {
                    const name = docUri.split('/').pop() || 'Document';
                    setPreviewAttachment({ uri: docUri, type: 'file', name });
                    setShowPreview(true);
                }
            } else if (type === 'poll') {
                setShowPollCreator(true);
            } else {
                Alert.alert('Feature Coming Soon', `The ${type} feature is under development.`);
            }
        } catch (error) {
            console.error('Error handling attachment:', error);
            Alert.alert('Error', 'Failed to select attachment');
        }
    };

    const handleSendAttachment = async (caption: string) => {
        if (!previewAttachment || !conversationId) return;

        setSending(true);
        try {
            let mediaUrl: string | null = null;
            let path = '';

            if (previewAttachment.type === 'image') {
                path = `chat-images/${conversationId}`;
            } else {
                path = `chat-files/${conversationId}`;
            }

            mediaUrl = await uploadMedia(previewAttachment.uri, path);

            if (mediaUrl) {
                await sendMessage(
                    conversationId,
                    caption, // Send caption as text
                    auth.currentUser?.uid || '',
                    auth.currentUser?.displayName || 'User',
                    previewAttachment.type === 'image' ? 'image' : 'file',
                    mediaUrl
                );
                setShowPreview(false);
                setPreviewAttachment(null);
            } else {
                Alert.alert('Error', 'Failed to upload attachment');
            }
        } catch (error) {
            console.error('Error sending attachment:', error);
            Alert.alert('Error', 'Failed to send attachment');
        } finally {
            setSending(false);
        }
    };

    const handleCreatePoll = async (question: string, options: string[], allowMultiple: boolean) => {
        if (!conversationId) return;
        setSending(true);
        try {
            await sendMessage(
                conversationId,
                'Poll: ' + question,
                auth.currentUser?.uid || '',
                auth.currentUser?.displayName || 'User',
                'poll',
                undefined,
                undefined,
                { question, options, allowMultiple }
            );
        } catch (error) {
            console.error("Error creating poll:", error);
            Alert.alert('Error', 'Failed to create poll');
        } finally {
            setSending(false);
        }
    };

    const handleVote = async (messageId: string, optionId: string) => {
        if (!conversationId || !auth.currentUser) return;
        try {
            await voteOnPoll(conversationId, messageId, optionId, auth.currentUser.uid);
        } catch (error) {
            console.log("Vote error", error);
        }
    };

    const handleSend = async () => {
        const textToSend = inputText.trim();
        if (!textToSend || !conversationId) return;

        const currentReplyTo = replyTo;
        setInputText('');
        setReplyTo(null);
        setSending(true);
        // Clear typing
        if (auth.currentUser) {
            setTypingStatus(conversationId, auth.currentUser.uid, auth.currentUser.displayName || 'User', false);
        }

        try {
            await sendMessage(
                conversationId,
                textToSend,
                auth.currentUser?.uid || '',
                auth.currentUser?.displayName || 'User',
                'text',
                undefined,
                undefined,
                undefined,
                currentReplyTo || undefined
            );
        } catch (error) {
            console.error("Error sending message:", error);
            setInputText(textToSend);
            Alert.alert('Delivery Failed', 'Message could not be sent. Please check your connection.');
        } finally {
            setSending(false);
        }
    };

    // Typing detection
    const handleInputChange = (text: string) => {
        setInputText(text);
        if (!conversationId || !auth.currentUser) return;
        setTypingStatus(conversationId, auth.currentUser.uid, auth.currentUser.displayName || 'User', true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if (auth.currentUser) {
                setTypingStatus(conversationId, auth.currentUser.uid, auth.currentUser.displayName || 'User', false);
            }
        }, 3000);
    };

    // Reaction handler
    const handleReaction = async (emoji: string) => {
        if (!emojiTrayMessage || !conversationId || !auth.currentUser) return;
        await addReaction(conversationId, emojiTrayMessage.id, emoji, auth.currentUser.uid);
    };

    // Sender color palette (consistent, per name)
    const SENDER_COLORS = ['#EF4444', '#F97316', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B'];
    const getSenderColor = (name: string) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
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

    const renderMessage = ({ item, index, currentMessages }: { item: Message; index: number; currentMessages: Message[] }) => {
        const isOwnMessage = item.senderId === auth.currentUser?.uid;
        const messageDate = item.timestamp?.toDate ? item.timestamp.toDate() : new Date();

        // Fix for Inverted List: Calculate index in original chronological list
        const originalIndex = currentMessages.length - 1 - index;
        const prevMessage = currentMessages[originalIndex - 1]; // Previous in chronological order
        const prevMessageDate = prevMessage?.timestamp?.toDate ? prevMessage.timestamp.toDate() : null;

        const showDateHeader = !prevMessageDate || !isSameDay(messageDate, prevMessageDate);

        // Show sender name for group messages (for others' messages)
        const showSenderName = !isOwnMessage && (item.messageType !== 'text' || item.text.length > 0);
        const senderName = item.senderName || 'Unknown';
        const senderColor = getSenderColor(senderName);

        return (
            <View>
                {showDateHeader && renderDateHeader(messageDate)}
                <View style={{ flexDirection: 'row', justifyContent: isOwnMessage ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={{ maxWidth: '80%' }}
                        onLongPress={() => {
                            setContextMenuMessage(item);
                        }}
                    >
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
                                        <View style={[styles.avatarPlaceholder, { backgroundColor: senderColor }]}>
                                            <Text style={styles.avatarText}>
                                                {senderName.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}

                            <View style={{ maxWidth: Dimensions.get('window').width * 0.72 }}>
                                {/* Sender Name with unique color and Role Badge */}
                                {showSenderName && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                        <Text style={[styles.senderName, { color: senderColor, marginBottom: 0 }]}>
                                            {senderName}
                                        </Text>
                                        <GroupRoleBadge role={groupData?.roles?.[item.senderId] || 'student'} />
                                    </View>
                                )}

                                {/* POLL MESSAGE */}
                                {item.messageType === 'poll' && item.poll ? (
                                    <PollMessage
                                        message={item}
                                        currentUserId={auth.currentUser?.uid || ''}
                                        onVote={(optionId) => handleVote(item.id, optionId)}
                                    />
                                ) : (
                                    /* Reply context + STANDARD MESSAGE BUBBLE */
                                    /* STANDARD MESSAGE BUBBLE */
                                    <View style={[
                                        styles.messageBubble,
                                        isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
                                        (item.priority === 'important') && { borderWidth: 1.5, borderColor: '#EF4444' },
                                        (item.priority === 'medium') && { borderWidth: 1.5, borderColor: '#EAB308' },
                                        (item.messageType === 'image') && {
                                            paddingHorizontal: 0,
                                            paddingTop: 0,
                                            paddingBottom: item.text ? 10 : 0,
                                            overflow: 'hidden'
                                        }
                                    ]}>
                                        {/* Priority Header */}
                                        {item.priority === 'important' && (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: item.replyTo ? 4 : 6, marginTop: (item.messageType === 'image') ? 8 : 0, marginHorizontal: (item.messageType === 'image') ? 12 : 0 }}>
                                                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                                                <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: 'bold', marginLeft: 4, textTransform: 'uppercase' }}>Important</Text>
                                            </View>
                                        )}
                                        {item.priority === 'medium' && (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: item.replyTo ? 4 : 6, marginTop: (item.messageType === 'image') ? 8 : 0, marginHorizontal: (item.messageType === 'image') ? 12 : 0 }}>
                                                <Ionicons name="warning" size={14} color="#EAB308" />
                                                <Text style={{ fontSize: 11, color: '#EAB308', fontWeight: 'bold', marginLeft: 4, textTransform: 'uppercase' }}>Attention</Text>
                                            </View>
                                        )}
                                        {/* Quoted / Reply preview inside bubble */}
                                        {item.replyTo && (
                                            <QuotedMessageBubble replyTo={item.replyTo} isOwnMessage={isOwnMessage} />
                                        )}
                                        {/* Image Attachment */}
                                        {item.messageType === 'image' && item.mediaUrl && (
                                            <TouchableOpacity onPress={() => router.push({
                                                pathname: '/image-viewer',
                                                params: { images: item.mediaUrl }
                                            })}>
                                                <Image
                                                    source={{ uri: item.mediaUrl }}
                                                    style={styles.mediaImage}
                                                    resizeMode="cover"
                                                />
                                            </TouchableOpacity>
                                        )}

                                        {/* File Attachment */}
                                        {item.messageType === 'file' && item.mediaUrl && (
                                            <TouchableOpacity
                                                style={styles.fileContainer}
                                                onPress={() => Linking.openURL(item.mediaUrl!)}
                                            >
                                                <Ionicons name="document-text" size={32} color="#FFF" />
                                                <View style={styles.fileInfo}>
                                                    <Text style={styles.fileName} numberOfLines={1}>{item.text || 'Document'}</Text>
                                                    <Text style={styles.fileType}>Tap to view</Text>
                                                </View>
                                            </TouchableOpacity>
                                        )}

                                        {/* Text Content (if any, or if strictly text message) */}
                                        {(item.text && item.messageType !== 'file') ? (
                                            <Text style={[
                                                styles.messageText,
                                                isOwnMessage ? styles.ownMessageText : { color: '#F8FAFC' },
                                                (item.messageType === 'image') && { marginHorizontal: 12, marginTop: 8 }
                                            ]}>
                                                {item.text}
                                            </Text>
                                        ) : null}

                                        <Text style={[styles.messageTimeInline, isOwnMessage ? styles.ownMessageTimeInline : styles.otherMessageTimeInline]}>
                                            {formatMessageTime(item.timestamp)}
                                        </Text>

                                        {/* Shared Content Placeholders (Legacy) */}
                                        {item.messageType === 'sharedPost' && <Text style={{ color: '#FFF', fontStyle: 'italic' }}>[Shared Post]</Text>}
                                        {item.messageType === 'sharedPDF' && item.sharedContent?.contentData ? (
                                            <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#1E293B' : '#FFF', overflow: 'hidden', borderRadius: 12, marginTop: 4 }}>
                                                <TouchableOpacity
                                                    activeOpacity={0.8}
                                                    onPress={() => handleOpenDocument(item.sharedContent!.contentData)}
                                                    style={{ width: 80, height: 110, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' }}
                                                >
                                                    {item.sharedContent!.contentData.coverImage ? (
                                                        <Image
                                                            source={{ uri: item.sharedContent!.contentData.coverImage }}
                                                            style={{ width: '100%', height: '100%' }}
                                                            resizeMode="cover"
                                                        />
                                                    ) : (
                                                        <View style={{ width: '100%', height: '100%' }}>
                                                            {item.sharedContent!.contentData.fileUrl &&
                                                                item.sharedContent!.contentData.fileUrl.includes('cloudinary') &&
                                                                item.sharedContent!.contentData.fileUrl.toLowerCase().endsWith('.pdf') && (
                                                                    <Image
                                                                        source={{ uri: item.sharedContent!.contentData.fileUrl.replace('/upload/', '/upload/w_400,q_auto,f_jpg/').replace(/\.pdf$/i, '.jpg') }}
                                                                        style={{ width: '100%', height: '100%', position: 'absolute', zIndex: 2 }}
                                                                        resizeMode="cover"
                                                                    />
                                                                )}

                                                            <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: 4, zIndex: 1 }}>
                                                                <LinearGradient
                                                                    colors={['#4F46E5', '#312E81']}
                                                                    style={StyleSheet.absoluteFill}
                                                                />
                                                                <Ionicons name="book" size={24} color="#FFF" style={{ opacity: 0.9 }} />
                                                                <Text style={{ color: '#FFF', fontSize: 8, marginTop: 4, textAlign: 'center', fontWeight: '700' }} numberOfLines={2}>
                                                                    {item.sharedContent!.contentData.type === 'notes' ? 'NOTES' : 'PDF'}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    )}
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    activeOpacity={0.7}
                                                    onPress={() => router.push({ pathname: '/document-detail', params: { id: item.sharedContent!.contentData.id } })}
                                                    style={{ flex: 1, padding: 10, paddingTop: 14, minWidth: 140 }}
                                                >
                                                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 4, lineHeight: 18 }} numberOfLines={2}>
                                                        {item.sharedContent!.contentData.title || 'Untitled Book'}
                                                    </Text>
                                                    {item.sharedContent!.contentData.uploaderName ? (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                            {item.sharedContent!.contentData.uploaderAvatar ? (
                                                                <Image
                                                                    source={{ uri: item.sharedContent!.contentData.uploaderAvatar }}
                                                                    style={{ width: 16, height: 16, borderRadius: 8, marginRight: 4 }}
                                                                />
                                                            ) : (
                                                                <View style={{
                                                                    width: 16, height: 16, borderRadius: 8,
                                                                    backgroundColor: colors.primary,
                                                                    alignItems: 'center', justifyContent: 'center',
                                                                    marginRight: 4
                                                                }}>
                                                                    <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '700' }}>
                                                                        {item.sharedContent!.contentData.uploaderName.charAt(0).toUpperCase()}
                                                                    </Text>
                                                                </View>
                                                            )}
                                                            <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '500' }} numberOfLines={1}>
                                                                {item.sharedContent!.contentData.uploaderName}
                                                            </Text>
                                                        </View>
                                                    ) : (!item.sharedContent!.contentData.author || item.sharedContent!.contentData.author === 'Unknown Author') ? (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                            {item.senderPhoto ? (
                                                                <Image
                                                                    source={{ uri: item.senderPhoto }}
                                                                    style={{ width: 14, height: 14, borderRadius: 7, marginRight: 4 }}
                                                                />
                                                            ) : (
                                                                <Ionicons name="person-circle" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                                                            )}
                                                            <Text style={{ fontSize: 11, color: colors.textSecondary }} numberOfLines={1}>
                                                                {isOwnMessage ? 'Shared by You' : (item.senderName ? `Shared by ${item.senderName}` : 'Shared Document')}
                                                            </Text>
                                                        </View>
                                                    ) : (
                                                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 8 }} numberOfLines={1}>
                                                            {item.sharedContent!.contentData.author}
                                                        </Text>
                                                    )}
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        {item.sharedContent!.contentData.rating ? (
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 }}>
                                                                <Text style={{ fontSize: 10, fontWeight: '700', color: '#B45309' }}>
                                                                    {item.sharedContent!.contentData.rating}
                                                                </Text>
                                                                <Ionicons name="star" size={10} color="#B45309" style={{ marginLeft: 2 }} />
                                                            </View>
                                                        ) : (
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 }}>
                                                                <Text style={{ fontSize: 9, fontWeight: '600', color: '#64748B' }}>New</Text>
                                                            </View>
                                                        )}
                                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                            <Ionicons name="eye-outline" size={12} color={colors.textSecondary} />
                                                            <Text style={{ fontSize: 10, color: colors.textSecondary, marginLeft: 2 }}>
                                                                {item.sharedContent!.contentData.views || '0'}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                        ) : null}
                                    </View>
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Reaction chips below bubble */}
                    {item.reactions && Object.keys(item.reactions).length > 0 && (
                        <ReactionChips
                            reactions={item.reactions}
                            currentUserId={auth.currentUser?.uid || ''}
                            onPress={(emoji) => addReaction(conversationId!, item.id, emoji, auth.currentUser?.uid || '')}
                            isOwnMessage={isOwnMessage}
                        />
                    )}
                </View>
            </View>
        );
    };

    const memberCount = groupData?.participants?.length || 0;

    // Filter messages if a user is selected
    const userMessages = filteredUserId
        ? messages.filter(msg => msg.senderId === filteredUserId)
        : messages;

    const displayedMessages = userMessages.filter(msg => {
        if (filteredMediaType === 'all') return true;
        if (filteredMediaType === 'pdf') return msg.messageType === 'sharedPDF';
        // Assuming sharedPost contains images/media. 'other' captures text.
        if (filteredMediaType === 'image') return msg.messageType === 'sharedPost';
        if (filteredMediaType === 'other') return msg.messageType === 'text';
        return true;
    });

    // Calculate counts for the selected user
    const counts = {
        all: userMessages.length,
        pdf: userMessages.filter(m => m.messageType === 'sharedPDF').length,
        image: userMessages.filter(m => m.messageType === 'sharedPost').length,
        other: userMessages.filter(m => m.messageType === 'text').length
    };

    // Find the most recently pinned message
    const pinnedMessages = messages.filter(m => m.pinned);
    const latestPinnedMessage = pinnedMessages.length > 0 ? pinnedMessages[pinnedMessages.length - 1] : null;

    const handleSelectMember = (userId: string) => {
        setFilteredUserId(userId);
        setFilteredMediaType('all'); // Reset media type when changing user
    };

    const handleClearFilter = () => {
        setFilteredUserId(null);
        setFilteredMediaType('all');
    };

    const handleContextMenuAction = (action: string) => {
        if (!contextMenuMessage) return;
        const msg = contextMenuMessage;
        setContextMenuMessage(null);
        if (action === 'reply') {
            setReplyTo({ messageId: msg.id, text: msg.text, senderName: msg.senderName || 'Unknown', messageType: msg.messageType });
        } else if (action === 'copy') {
            if (msg.text) Clipboard.setString(msg.text);
        } else if (action === 'delete') {
            Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteMessage(conversationId!, msg.id);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete message');
                        }
                    }
                },
            ]);
        } else if (action === 'mark-important') {
            setMessagePriority(conversationId!, msg.id, 'important');
        } else if (action === 'mark-medium') {
            setMessagePriority(conversationId!, msg.id, 'medium');
        } else if (action === 'mark-normal') {
            setMessagePriority(conversationId!, msg.id, 'normal');
        } else if (action === 'pin-message') {
            pinMessage(conversationId!, msg.id, true);
        } else if (action === 'unpin-message') {
            pinMessage(conversationId!, msg.id, false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#000000' }]} edges={['left', 'right', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            {/* Emoji Tray Popup */}
            <EmojiTray
                visible={emojiTrayVisible}
                onClose={() => setEmojiTrayVisible(false)}
                onSelectEmoji={handleReaction}
                position={emojiTrayPosition}
            />

            {/* ─── WhatsApp-style Message Context Menu ─── */}
            <Modal
                visible={!!contextMenuMessage}
                transparent
                animationType="fade"
                onRequestClose={() => setContextMenuMessage(null)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' }}
                    activeOpacity={1}
                    onPress={() => setContextMenuMessage(null)}
                >
                    <View style={{
                        backgroundColor: '#1E293B',
                        borderRadius: 20,
                        overflow: 'hidden',
                        width: Dimensions.get('window').width * 0.82,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.4,
                        shadowRadius: 16,
                        elevation: 20,
                    }}>
                        {/* Emoji Quick-Reactions Row */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
                            {['❤️', '😂', '😮', '😢', '👍', '🙏'].map(emoji => (
                                <TouchableOpacity
                                    key={emoji}
                                    onPress={() => {
                                        if (contextMenuMessage) {
                                            addReaction(conversationId!, contextMenuMessage.id, emoji, auth.currentUser?.uid || '');
                                        }
                                        setContextMenuMessage(null);
                                    }}
                                    style={{ padding: 4 }}
                                >
                                    <Text style={{ fontSize: 28 }}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Message preview */}
                        {contextMenuMessage?.text ? (
                            <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }} numberOfLines={2}>{contextMenuMessage.text}</Text>
                            </View>
                        ) : null}

                        {/* Action Buttons */}
                        {[
                            { icon: 'arrow-undo-outline', label: 'Reply', action: 'reply' },
                            { icon: 'copy-outline', label: 'Copy', action: 'copy' },
                            // Admin Only options: Message Priority
                            ...((groupData?.admins?.includes(auth.currentUser?.uid || '') || groupData?.createdBy === auth.currentUser?.uid)
                                ? [
                                    { icon: contextMenuMessage?.pinned ? 'pin-off' : 'pin', label: contextMenuMessage?.pinned ? 'Unpin Message' : 'Pin Message', action: contextMenuMessage?.pinned ? 'unpin-message' : 'pin-message', color: '#10B981' },
                                    { icon: 'alert-circle', label: 'Mark Important', action: 'mark-important', color: '#EF4444' },
                                    { icon: 'warning', label: 'Mark Medium', action: 'mark-medium', color: '#EAB308' },
                                    { icon: 'information-circle-outline', label: 'Mark Normal', action: 'mark-normal', color: '#A8B5C8' },
                                ]
                                : []),
                            ...(contextMenuMessage?.senderId === auth.currentUser?.uid || groupData?.admins?.includes(auth.currentUser?.uid || '') || groupData?.createdBy === auth.currentUser?.uid
                                ? [{ icon: 'trash-outline', label: 'Delete', action: 'delete', color: '#EF4444' }]
                                : []),
                        ].map((opt, i, arr) => (
                            <TouchableOpacity
                                key={opt.action}
                                onPress={() => handleContextMenuAction(opt.action)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 15,
                                    paddingHorizontal: 20,
                                    borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                                    borderBottomColor: 'rgba(255,255,255,0.06)',
                                }}
                            >
                                <Ionicons
                                    name={opt.icon as any}
                                    size={20}
                                    color={opt.color || '#A8B5C8'}
                                    style={{ marginRight: 14 }}
                                />
                                <Text style={{ fontSize: 16, color: opt.color || '#F1F5F9', fontWeight: '500' }}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Header */}
            <View style={styles.headerContainer}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>

                    {/* Offline Indicator */}
                    {isConnected === false && (
                        <View style={{
                            position: 'absolute',
                            top: 60,
                            left: 0,
                            right: 0,
                            backgroundColor: '#EF4444',
                            paddingVertical: 4,
                            zIndex: 100,
                            alignItems: 'center'
                        }}>
                            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>
                                Offline Mode
                            </Text>
                        </View>
                    )}

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

            {/* Group Announcement Banner */}
            {groupData?.groupAnnouncement ? (
                <View style={[styles.announcementBanner, { backgroundColor: isDark ? '#1E2D3D' : '#EFF6FF' }]}>
                    <Ionicons name="megaphone" size={14} color="#6366F1" />
                    <Text style={[styles.announcementText, { color: isDark ? '#E2E8F0' : '#1E293B' }]} numberOfLines={1}>
                        {groupData.groupAnnouncement}
                    </Text>
                </View>
            ) : null}

            {/* Announcement Mode Banner */}
            {groupData?.announcementOnly && (
                <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', paddingVertical: 6, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="megaphone-outline" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>
                        Announcements Only
                    </Text>
                </View>
            )}

            {/* Pinned Message Banner */}
            {latestPinnedMessage && (
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={{
                        backgroundColor: '#1E293B',
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: 'rgba(255,255,255,0.05)',
                        zIndex: 40
                    }}
                    onPress={() => {
                        // In a real app, this would scroll to the message
                        Alert.alert('Pinned Message', latestPinnedMessage.text || 'Media attachment');
                    }}
                >
                    <Ionicons name="pin" size={16} color="#10B981" style={{ marginRight: 12, transform: [{ rotate: '45deg' }] }} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '600', marginBottom: 2 }}>Pinned Message</Text>
                        <Text style={{ color: '#F8FAFC', fontSize: 13 }} numberOfLines={1}>
                            {latestPinnedMessage.text || (latestPinnedMessage.messageType === 'image' ? '📸 Photo' : '📎 Document')}
                        </Text>
                    </View>
                </TouchableOpacity>
            )}

            {/* Custom Professional Background */}
            <View style={{ flex: 1, backgroundColor: isDark ? '#0b141a' : '#EFEAE2' }}>

                    {/* Important Members Filter Card */}
                    {importantMembers.length > 0 && (showImportantMembersCard ? (
                        <ImportantMembersCard
                            importantMembers={importantMembers}
                            onSelectMember={handleSelectMember}
                            onClearFilter={handleClearFilter}
                            activeMemberId={filteredUserId}
                            onHide={() => {
                                setShowImportantMembersCard(false);
                                setFilteredUserId(null); // Clear filter
                                setFilteredMediaType('all');
                            }}
                            onAddMember={
                                groupData?.admins?.includes(auth.currentUser?.uid || '')
                                    ? () => router.push({ pathname: '/group-info', params: { conversationId } })
                                    : undefined
                            }
                        />
                    ) : (
                        <TouchableOpacity
                            style={[styles.showFiltersButton, {
                                backgroundColor: '#0F172A',
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderWidth: 1,
                                borderTopWidth: 0,
                                width: 44,
                                height: 28,
                                paddingHorizontal: 0,
                                paddingVertical: 0,
                                borderTopLeftRadius: 0,
                                borderTopRightRadius: 0,
                                borderBottomLeftRadius: 14,
                                borderBottomRightRadius: 14,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginTop: 0,
                                position: 'absolute',
                                top: 0,
                                right: 16,
                                zIndex: 50,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5
                            }]}
                            onPress={() => setShowImportantMembersCard(true)}
                        >
                            <Ionicons name="chevron-down" size={18} color={colors.primary} />
                        </TouchableOpacity>
                    ))}

                    {/* Filter Indicator & Sub-filters */}
                    {filteredUserId && (
                        <View style={[styles.filterIndicator, { backgroundColor: 'rgba(30, 41, 59, 0.9)' }]}>
                            <View style={styles.filterRow}>
                                <Ionicons name="filter" size={16} color="#10B981" />
                                <Text style={[styles.filterText, { color: colors.text }]}>
                                    Filtering: {importantMembers.find(m => m.id === filteredUserId)?.name}
                                </Text>
                            </View>

                            {/* Media Type Buttons */}
                            <View style={styles.mediaFiltersRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.mediaFilterChip,
                                        filteredMediaType === 'all' && styles.mediaFilterChipActive
                                    ]}
                                    onPress={() => setFilteredMediaType('all')}
                                >
                                    <Text style={[
                                        styles.mediaFilterText,
                                        filteredMediaType === 'all' && styles.mediaFilterTextActive,
                                        { color: filteredMediaType === 'all' ? '#FFF' : colors.text }
                                    ]}>
                                        All ({counts.all})
                                    </Text>
                                </TouchableOpacity>

                                {counts.image > 0 && (
                                    <TouchableOpacity
                                        style={[
                                            styles.mediaFilterChip,
                                            filteredMediaType === 'image' && styles.mediaFilterChipActive
                                        ]}
                                        onPress={() => setFilteredMediaType('image')}
                                    >
                                        <Text style={[
                                            styles.mediaFilterText,
                                            filteredMediaType === 'image' && styles.mediaFilterTextActive,
                                            { color: filteredMediaType === 'image' ? '#FFF' : colors.text }
                                        ]}>
                                            Images ({counts.image})
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {counts.pdf > 0 && (
                                    <TouchableOpacity
                                        style={[
                                            styles.mediaFilterChip,
                                            filteredMediaType === 'pdf' && styles.mediaFilterChipActive
                                        ]}
                                        onPress={() => setFilteredMediaType('pdf')}
                                    >
                                        <Text style={[
                                            styles.mediaFilterText,
                                            filteredMediaType === 'pdf' && styles.mediaFilterTextActive,
                                            { color: filteredMediaType === 'pdf' ? '#FFF' : colors.text }
                                        ]}>
                                            PDFs ({counts.pdf})
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {counts.other > 0 && (
                                    <TouchableOpacity
                                        style={[
                                            styles.mediaFilterChip,
                                            filteredMediaType === 'other' && styles.mediaFilterChipActive
                                        ]}
                                        onPress={() => setFilteredMediaType('other')}
                                    >
                                        <Text style={[
                                            styles.mediaFilterText,
                                            filteredMediaType === 'other' && styles.mediaFilterTextActive,
                                            { color: filteredMediaType === 'other' ? '#FFF' : colors.text }
                                        ]}>
                                            Others ({counts.other})
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Messages */}
                    <KeyboardAvoidingView
                        style={[styles.chatContainer, Platform.OS === 'android' && { paddingBottom: Math.max(keyboardHeight, insets.bottom) }]}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        enabled={Platform.OS === 'ios'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                    >
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                            </View>
                        ) : (
                            <FlatList
                                ref={flatListRef}
                                data={[...displayedMessages].reverse()}
                                renderItem={(props) => renderMessage({ ...props, currentMessages: displayedMessages })}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={styles.messagesList}
                                inverted={true}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                        {messages.length === 0 && !loading && (
                            <View style={styles.emptyState}>
                                <View style={[styles.groupEmptyIcon]}>
                                    <Text style={{ fontSize: 56 }}>🎓</Text>
                                </View>
                                <Text style={[styles.emptyTitle, { color: '#FFF' }]}>Welcome to {groupName}!</Text>
                                <Text style={[styles.emptySubtitle, { color: 'rgba(255,255,255,0.6)' }]}>
                                    Break the ice! Share notes, ask doubts, or just say hi to your group 👋
                                </Text>
                            </View>
                        )}
                        {/* Typing Indicator */}
                        {typingNames.length > 0 && (
                            <View style={styles.typingRow}>
                                <View style={styles.typingDots}>
                                    <View style={[styles.typingDot, { backgroundColor: '#94A3B8' }]} />
                                    <View style={[styles.typingDot, { backgroundColor: '#94A3B8', marginHorizontal: 3 }]} />
                                    <View style={[styles.typingDot, { backgroundColor: '#94A3B8' }]} />
                                </View>
                                <Text style={styles.typingText}>
                                    {typingNames.length === 1
                                        ? `${typingNames[0]} is typing…`
                                        : `${typingNames.slice(0, 2).join(', ')} are typing…`}
                                </Text>
                            </View>
                        )}

                        {/* Reply Preview */}
                        <ReplyPreview replyTo={replyTo} onClear={() => setReplyTo(null)} />

                        {/* Input Area */}
                        {(groupData?.announcementOnly && !groupData.admins?.includes(auth.currentUser?.uid || '') && groupData.createdBy !== auth.currentUser?.uid) ? (
                            <View style={[styles.inputContainer, { justifyContent: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.border }]}>
                                <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
                                    Only admins can send messages
                                </Text>
                            </View>
                        ) : (
                            <View style={[styles.inputContainer, { paddingBottom: 12, opacity: isConnected === false ? 0.5 : 1 }]}>
                                <TouchableOpacity
                                    style={[styles.plusButton, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}
                                    onPress={() => setShowAttachmentMenu(true)}
                                    disabled={isConnected === false}
                                >
                                    <Ionicons name="add" size={24} color={isDark ? '#FFF' : '#0F172A'} />
                                </TouchableOpacity>

                                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
                                    <TextInput
                                        style={[styles.input, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                                        placeholder={isConnected === false ? "Offline" : "Message"}
                                        placeholderTextColor={isDark ? "#9CA3AF" : "#64748B"}
                                        value={inputText}
                                        onChangeText={handleInputChange}
                                        multiline
                                        cursorColor={isDark ? "#FFFFFF" : "#0F172A"}
                                        editable={isConnected !== false}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.sendButton,
                                        { backgroundColor: inputText.trim() ? '#6366F1' : (isDark ? '#4B5563' : '#CBD5E1') }
                                    ]}
                                    onPress={handleSend}
                                    disabled={!inputText.trim() || sending || isConnected === false}
                                >
                                    {sending ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <Ionicons name="send" size={20} color="#FFF" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </KeyboardAvoidingView>
            </View>

            {/* Poll Creator Modal */}
            <PollCreator
                visible={showPollCreator}
                onClose={() => setShowPollCreator(false)}
                onSubmit={handleCreatePoll}
            />

            {/* Attachment Menu */}
            <ChatAttachmentMenu
                visible={showAttachmentMenu}
                onClose={() => setShowAttachmentMenu(false)}
                onSelect={handleAttachmentSelect}
            />

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
                    },
                    ...(groupData?.admins?.includes(auth.currentUser?.uid || '') || groupData?.createdBy === auth.currentUser?.uid
                        ? [
                            {
                                icon: groupData?.announcementOnly ? 'megaphone' : 'megaphone-outline' as any,
                                label: groupData?.announcementOnly ? 'Disable Announcements Only' : 'Enable Announcements Only',
                                onPress: async () => {
                                    if (!conversationId || !groupData) return;
                                    try {
                                        await toggleAnnouncementOnly(conversationId, !groupData.announcementOnly);
                                        setShowOptionsSheet(false);
                                    } catch (e) {
                                        Alert.alert('Error', 'Failed to update announcement mode');
                                    }
                                }
                            }
                        ]
                        : [])
                ]}
            />
            {selectedResource && (
                <DocumentViewer
                    visible={viewerVisible}
                    onClose={() => setViewerVisible(false)}
                    documentUrl={selectedResource.fileUrl}
                    documentName={selectedResource.title}
                    documentType={selectedResource.type}
                />
            )}
            <MediaPreviewModal
                visible={showPreview}
                attachment={previewAttachment}
                onClose={() => {
                    setShowPreview(false);
                    setPreviewAttachment(null);
                }}
                onSend={handleSendAttachment}
                uploading={sending}
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
        zIndex: 100,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
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
        paddingBottom: 16, // Reduced since input is relative now
    },
    dateHeader: {
        alignItems: 'center',
        marginVertical: 16,
    },
    dateHeaderText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#E2E8F0',
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    messageContainer: {
        marginBottom: 4,
        alignItems: 'flex-start',
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
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        overflow: 'hidden',
        flexShrink: 1,
    },
    ownMessageBubble: {
        backgroundColor: '#6366F1', // Fallback if no gradient
        borderBottomRightRadius: 2,
    },
    otherMessageBubble: {
        backgroundColor: '#334155', // Slate 700 for better contrast
        borderBottomLeftRadius: 2,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)', // Glass border
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    mediaImage: {
        width: 260,
        height: 346, // Standardized 3:4 Portrait Ratio
        borderRadius: 18,
        backgroundColor: '#1E293B',
    },
    fileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.2)',
        width: 240,
        marginBottom: 4,
    },
    fileInfo: {
        flex: 1,
        marginLeft: 12,
    },
    fileName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 2,
    },
    fileType: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
        marginBottom: 2,
        flexShrink: 1,
    },
    ownMessageText: {
        color: '#FFFFFF',
    },
    otherMessageText: {
        color: '#F8FAFC',
    },
    messageTimeInline: {
        fontSize: 9,
        alignSelf: 'flex-end',
        opacity: 0.75,
        marginTop: 2,
    },
    ownMessageTimeInline: {
        color: 'rgba(255, 255, 255, 0.9)',
    },
    otherMessageTimeInline: {
        color: 'rgba(255, 255, 255, 0.6)',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    groupEmptyIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.08)',
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
    announcementBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(99,102,241,0.2)',
    },
    announcementText: {
        flex: 1,
        fontSize: 12,
        fontWeight: '500',
    },
    typingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 6,
        gap: 8,
    },
    typingDots: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    typingText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        fontStyle: 'italic',
    },
    replyBtn: {
        justifyContent: 'center',
        alignSelf: 'center',
        padding: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end', // Align buttons to bottom as input grows
        paddingHorizontal: 8,
        paddingVertical: 12,
        backgroundColor: 'transparent',
    },
    inputWrapper: {
        flex: 1,
        justifyContent: 'center',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 4,
        marginRight: 8,
        minHeight: 50,
        maxHeight: 120,
    },
    input: {
        flex: 1,
        fontSize: 16,
        maxHeight: 100,
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    inputRightIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    attachButton: {
        padding: 8,
    },
    plusButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1.5, // Add border for the outlined look in screenshot
        borderColor: '#6366F1', // Match theme
    },
    sendButton: {
        width: 48,
        height: 48, // Slightly larger for emphasis
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    showFiltersButton: {
        alignSelf: 'flex-end',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginRight: 16,
        marginTop: 8,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        elevation: 1,
    },
    showFiltersText: {
        fontSize: 13,
        fontWeight: '600',
    },
    filterIndicator: {
        flexDirection: 'column',
        alignItems: 'stretch',
        paddingVertical: 10,
        paddingHorizontal: 16,
        gap: 10,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
    },
    mediaFiltersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    mediaFilterChip: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        backgroundColor: '#E5E7EB',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    mediaFilterChipActive: {
        backgroundColor: '#000000ff',
    },
    mediaFilterText: {
        fontSize: 11,
        fontWeight: '500',
    },
    mediaFilterTextActive: {
        fontWeight: '600',
        color: '#FFF',
    },
});


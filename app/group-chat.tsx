import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ImageBackground,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
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
import PollCreator from '../src/components/PollCreator';
import PollMessage from '../src/components/PollMessage';
import { auth, db } from '../src/config/firebase';
import { useTheme } from '../src/contexts/ThemeContext';
import { UserProfile } from '../src/services/authService';
import {
    Conversation,
    markMessagesAsRead,
    Message,
    sendMessage,
    subscribeToMessages,
    voteOnPoll
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
        if (!inputText.trim() || !conversationId) return;

        const textToSend = inputText.trim();
        setInputText(''); // Clear input immediately
        setSending(true);

        try {
            await sendMessage(conversationId, textToSend, auth.currentUser?.uid || '', auth.currentUser?.displayName || 'User');
        } catch (error) {
            console.error("Error sending message:", error);
            Alert.alert('Error', 'Failed to send message');
            setInputText(textToSend); // Restore text on error
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
        const showSenderName = !isOwnMessage && (item.messageType !== 'text' || item.text.length > 0);
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

                    <View>
                        {/* Sender Name (for group chats) */}
                        {showSenderName && (
                            <Text style={[styles.senderName, { color: colors.textSecondary }]}>
                                {senderName}
                            </Text>
                        )}

                        {/* POLL MESSAGE */}
                        {item.messageType === 'poll' && item.poll ? (
                            <PollMessage
                                message={item}
                                currentUserId={auth.currentUser?.uid || ''}
                                onVote={(optionId) => handleVote(item.id, optionId)}
                            />
                        ) : (
                            /* STANDARD MESSAGE BUBBLE */
                            <View style={[
                                styles.messageBubble,
                                isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
                            ]}>
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
                                    <Text style={[styles.messageText, isOwnMessage ? styles.ownMessageText : { color: '#F8FAFC' }]}>
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
                                                                source={{ uri: item.sharedContent!.contentData.fileUrl.replace(/\.pdf$/i, '.jpg') }}
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
                                            style={{ flex: 1, padding: 10, justifyContent: 'center', minWidth: 140 }}
                                        >
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 4 }} numberOfLines={2}>
                                                {item.sharedContent!.contentData.title || 'Untitled Book'}
                                            </Text>
                                            <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 6 }} numberOfLines={1}>
                                                {item.sharedContent!.contentData.author || 'Unknown Author'}
                                            </Text>
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

                        {/* Interactive Message Gradient for Own Text Messages Only currently overridden to plain view above for simplicity in mixed types. 
                           If we want gradient specifically for text-only own messages, we can conditionally wrap. 
                           For now, the style ownMessageBubble has background color or we can re-add LinearGradient if desired.
                           To keep it simple and consistent with attachments, I used View. 
                           If you want Gradient back for text, we can check. 
                           Let's re-add Gradient for own text messages specifically if requested, but View is safer for mixed content.
                           The original code had LinearGradient. Let's try to preserve it for text-only own messages.
                        */}
                    </View>
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

    const handleSelectMember = (userId: string) => {
        setFilteredUserId(userId);
        setFilteredMediaType('all'); // Reset media type when changing user
    };

    const handleClearFilter = () => {
        setFilteredUserId(null);
        setFilteredMediaType('all');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#000000' }]} edges={['left', 'right', 'bottom']}>
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

            {/* Custom Professional Background */}
            <View style={{ flex: 1, backgroundColor: isDark ? '#0b141a' : '#E5E5E5' }}>
                <ImageBackground
                    source={require('../assets/chat-background-doodle.png')}
                    style={{ flex: 1 }}
                    resizeMode="cover"
                    imageStyle={{ opacity: isDark ? 0.08 : 0.05 }}
                >

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
                        <View style={[styles.inputContainer, { paddingBottom: 12 }]}>
                            <TouchableOpacity
                                style={[styles.plusButton, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}
                                onPress={() => setShowAttachmentMenu(true)}
                            >
                                <Ionicons name="add" size={24} color={isDark ? '#FFF' : '#0F172A'} />
                            </TouchableOpacity>

                            <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
                                <TextInput
                                    style={[styles.input, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                                    placeholder="Message"
                                    placeholderTextColor={isDark ? "#9CA3AF" : "#64748B"}
                                    value={inputText}
                                    onChangeText={setInputText}
                                    multiline
                                    cursorColor={isDark ? "#FFFFFF" : "#0F172A"}
                                />
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    { backgroundColor: inputText.trim() ? '#6366F1' : (isDark ? '#4B5563' : '#CBD5E1') }
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
                </ImageBackground>
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
                    }
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
        maxWidth: '75%',
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
        alignSelf: 'flex-start',
        overflow: 'hidden',
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
        width: 240,
        height: 180,
        borderRadius: 8,
        marginBottom: 4,
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
        alignItems: 'center', // Center vertically
        paddingHorizontal: 8,
        paddingVertical: 12,
        backgroundColor: 'transparent', // Ensure it blends with background
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 25, // Full pill shape
        paddingHorizontal: 16,
        paddingVertical: 4, // Reduce vertical padding a bit
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


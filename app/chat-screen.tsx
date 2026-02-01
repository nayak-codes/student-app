import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
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
import { MediaPreviewModalProps } from '../src/components/MediaPreviewModal';
import PollCreator from '../src/components/PollCreator';
import PollMessage from '../src/components/PollMessage';
import PostDetailModal from '../src/components/PostDetailModal';
import { auth } from '../src/config/firebase';
import { useTheme } from '../src/contexts/ThemeContext';
import {
    markMessagesAsRead,
    Message,
    sendMessage,
    subscribeToMessages,
    voteOnPoll
} from '../src/services/chatService';
import { incrementViews, LibraryResource } from '../src/services/libraryService';
import { pickDocument, pickImage, takePhoto, uploadMedia } from '../src/services/mediaService';
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

// Component for Standard Post (Image/Text) display in chat
const StandardSharedPostCard = ({ itemData }: { itemData: any }) => {
    const { colors, isDark } = useTheme();
    const displayImage = itemData.imageUrl || itemData.thumbnail || itemData.thumbnailUrl || itemData.mediaUrl || itemData.image;

    return (
        <View style={{ width: '100%', overflow: 'hidden' }}>
            {/* Image Section */}
            {displayImage ? (
                <Image
                    source={{ uri: displayImage }}
                    style={{ width: '100%', height: 200, backgroundColor: isDark ? '#334155' : '#E2E8F0' }}
                    resizeMode="cover"
                />
            ) : (
                <View style={{ width: '100%', height: 140, backgroundColor: isDark ? '#334155' : '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="image-outline" size={32} color={isDark ? '#94A3B8' : '#94A3B8'} />
                </View>
            )}

            {/* Content Section */}
            <View style={{ padding: 12, backgroundColor: isDark ? '#1E293B' : '#FFF' }}>
                <Text numberOfLines={2} style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                    {itemData.content || itemData.title || 'Shared Post'}
                </Text>

                {/* Author User Row */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: isDark ? '#334155' : '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: isDark ? '#475569' : '#E2E8F0' }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#F8FAFC' : '#64748B' }}>
                            {itemData.userName?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '500' }} numberOfLines={1}>
                        {itemData.userName || 'Unknown'}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const ChatScreen = () => {
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

    // Helper to ensure we access string params, not arrays
    const getString = (val: string | string[] | undefined) => Array.isArray(val) ? val[0] : val;

    const conversationId = getString(params.conversationId);
    const otherUserId = getString(params.otherUserId);
    const otherUserName = getString(params.otherUserName);
    const otherUserPhoto = getString(params.otherUserPhoto);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);

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
    const [sending, setSending] = useState(false);
    const [postModalVisible, setPostModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState<any>(null);

    // New State for Attachments/Polls
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [previewAttachment, setPreviewAttachment] = useState<MediaPreviewModalProps['attachment'] | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [showPollCreator, setShowPollCreator] = useState(false);

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
        if (!inputText.trim() || !conversationId) return;

        setSending(true);
        try {
            await sendMessage(
                conversationId,
                inputText.trim(),
                auth.currentUser?.uid || '',
                auth.currentUser?.displayName || 'User',
                'text'
            );
            setInputText('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
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
            setShowPollCreator(false);
        } catch (error) {
            console.error('Error creating poll:', error);
            Alert.alert('Error', 'Failed to create poll');
        }
    };

    const handleVote = async (messageId: string, optionId: string) => {
        if (!auth.currentUser) return;
        try {
            await voteOnPoll(conversationId!, messageId, auth.currentUser.uid, optionId);
        } catch (error) {
            console.error('Error voting:', error);
            Alert.alert('Error', 'Failed to vote');
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
        const prevMessage = messages[index - 1]; // Compare with chronologically newer message
        const prevMessageDate = prevMessage?.timestamp?.toDate ? prevMessage.timestamp.toDate() : null;

        const showDateHeader = !prevMessageDate || !isSameDay(messageDate, prevMessageDate);
        const isSharedContent = item.messageType === 'sharedPost' || item.messageType === 'sharedPDF';

        // Determine if it's a "Clip" (vertical video) or just a regular post
        const sharedData = item.sharedContent?.contentData;
        const isClip = item.messageType === 'sharedPost' && sharedData && (
            sharedData.type === 'clip' ||
            (sharedData.videoLink && (sharedData.videoLink.includes('/shorts/') || sharedData.videoLink.includes('#shorts')))
        );

        return (
            <View>
                {showDateHeader && renderDateHeader(messageDate)}
                <View style={[
                    styles.messageContainer,
                    isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
                ]}>
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
                                        {item.senderName?.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Poll Message */}
                    {item.messageType === 'poll' && item.poll ? (
                        <PollMessage
                            message={item}
                            currentUserId={auth.currentUser?.uid || ''}
                            onVote={(optionId) => handleVote(item.id, optionId)}
                        />
                    ) : (
                        /* Standard Bubble or Shared Content */
                        isSharedContent ? (
                            <View
                                style={[
                                    styles.sharedContentCard,
                                    isOwnMessage ? styles.ownSharedCard : styles.otherSharedCard,
                                    {
                                        backgroundColor: isClip ? 'transparent' : colors.card,
                                        borderColor: isClip ? 'transparent' : (isOwnMessage ? colors.primary : colors.border),
                                        borderWidth: isClip ? 0 : 1,
                                        elevation: isClip ? 0 : 2,
                                        width: isClip ? (Dimensions.get('window').width / 2 - 20) : (Dimensions.get('window').width * 0.75),
                                        borderRadius: isClip ? 20 : 12,
                                    }
                                ]}
                            >
                                {item.messageType === 'sharedPost' && item.sharedContent?.contentData ? (
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            const data = item.sharedContent!.contentData;
                                            if (data.type === 'clip') {
                                                router.push({
                                                    pathname: '/screens/shorts-player' as any,
                                                    params: { shortId: data.id },
                                                });
                                            } else if (isClip && data.videoLink) {
                                                router.push({
                                                    pathname: '/screens/video-player' as any,
                                                    params: {
                                                        videoUri: data.videoLink,
                                                        postId: data.id,
                                                        title: data.content || 'Untitled Video',
                                                        description: data.content || '',
                                                        authorName: data.userName,
                                                        authorId: data.userId,
                                                        likes: data.likes,
                                                        views: data.viewCount || 0,
                                                        date: data.createdAt ? new Date(data.createdAt).toISOString() : '',
                                                        thumbnail: data.thumbnailUrl || data.imageUrl || data.userProfilePhoto,
                                                        authorImage: data.userProfilePhoto
                                                    },
                                                });
                                            } else {
                                                setSelectedPost(data);
                                                setPostModalVisible(true);
                                            }
                                        }}
                                    >
                                        {isClip ? (
                                            <SharedPostCard itemData={item.sharedContent.contentData} onPress={() => { }} />
                                        ) : (
                                            <StandardSharedPostCard itemData={item.sharedContent.contentData} />
                                        )}
                                        <Text style={[styles.sharedContentTime, { color: isClip ? '#FFF' : colors.textSecondary }]}>
                                            {formatMessageTime(item.timestamp)}
                                        </Text>
                                    </TouchableOpacity>
                                ) : item.messageType === 'sharedPDF' && item.sharedContent?.contentData ? (
                                    /* Unified Library Book Card (Always Card View) */
                                    <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#1E293B' : '#FFF', overflow: 'hidden', borderRadius: 12 }}>
                                        {/* Cover - Opens Viewer */}
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => handleOpenDocument(item.sharedContent!.contentData)}
                                            style={{ width: 90, height: 120, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' }}
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
                                                        <Ionicons name="book" size={32} color="#FFF" style={{ opacity: 0.9 }} />
                                                        <Text style={{ color: '#FFF', fontSize: 8, marginTop: 4, textAlign: 'center', fontWeight: '700' }} numberOfLines={2}>
                                                            {item.sharedContent!.contentData.type === 'notes' ? 'NOTES' : 'PDF'}
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}
                                        </TouchableOpacity>

                                        {/* Details - Opens Detail Page */}
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={() => router.push({ pathname: '/document-detail', params: { id: item.sharedContent!.contentData.id } })}
                                            style={{ flex: 1, padding: 12, justifyContent: 'center' }}
                                        >
                                            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 }} numberOfLines={2}>
                                                {item.sharedContent!.contentData.title || 'Untitled Book'}
                                            </Text>
                                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8 }} numberOfLines={1}>
                                                {item.sharedContent!.contentData.author || 'Unknown Author'}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                {item.sharedContent!.contentData.rating ? (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#B45309' }}>
                                                            {item.sharedContent!.contentData.rating}
                                                        </Text>
                                                        <Ionicons name="star" size={10} color="#B45309" style={{ marginLeft: 2 }} />
                                                    </View>
                                                ) : (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                        <Text style={{ fontSize: 10, fontWeight: '600', color: '#64748B' }}>New</Text>
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
                        ) : (
                            /* Regular Text / Image / File Bubble */
                            <View style={[
                                styles.messageBubble,
                                isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
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

                                {/* Text Content */}
                                {(item.text && item.messageType !== 'file') && (
                                    <Text style={[
                                        styles.messageText,
                                        isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                                    ]}>
                                        {item.text}
                                    </Text>
                                )}

                                <Text style={[
                                    styles.messageTimeInline,
                                    isOwnMessage ? styles.ownMessageTimeInline : [styles.otherMessageTimeInline, { color: colors.textSecondary }]
                                ]}>
                                    {formatMessageTime(item.timestamp)}
                                </Text>
                            </View>
                        )
                    )
                    }
                </View >
            </View >
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

                    <TouchableOpacity
                        style={styles.headerProfileContainer}
                        activeOpacity={0.7}
                        onPress={() => router.push({ pathname: '/public-profile', params: { userId: otherUserId } })}
                    >
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

            {/* Chat Background with Doodle Wallpaper */}
            <View style={{ flex: 1, backgroundColor: isDark ? '#0b141a' : '#E5E5E5' }}>
                <ImageBackground
                    source={require('../assets/chat-background-doodle.png')}
                    style={{ flex: 1, width: '100%', height: '100%' }}
                    resizeMode="cover"
                    imageStyle={{ opacity: isDark ? 0.08 : 0.05 }} // Subtle texturere
                >
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
                                <Ionicons name="chatbubbles-outline" size={64} color={isDark ? 'rgba(255,255,255,0.5)' : colors.border} />
                                <Text style={[styles.emptyTitle, { color: isDark ? '#FFF' : '#1E293B' }]}>No messages yet</Text>
                                <Text style={[styles.emptySubtitle, { color: isDark ? 'rgba(255,255,255,0.7)' : '#64748B' }]}>Start the conversation!</Text>
                            </View>
                        )}

                        {/* Input Area */}
                        <View style={[styles.inputContainer, {
                            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255,255,255,0.9)',
                            paddingBottom: 12, // Standard padding
                            paddingTop: 12,
                            height: undefined,
                        }]}>
                            <TouchableOpacity
                                style={[styles.plusButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0', borderColor: 'transparent' }]}
                                onPress={() => setShowAttachmentMenu(true)}
                            >
                                <Ionicons name="add" size={24} color={isDark ? '#FFF' : '#0F172A'} />
                            </TouchableOpacity>

                            <View style={[styles.inputWrapper, {
                                backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#F1F5F9',
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'transparent'
                            }]}>
                                <TextInput
                                    style={[styles.input, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                                    placeholder="Message"
                                    placeholderTextColor={isDark ? "rgba(255,255,255,0.5)" : "#64748B"}
                                    value={inputText}
                                    onChangeText={setInputText}
                                    multiline
                                    cursorColor={isDark ? "#FFFFFF" : "#0F172A"}
                                />
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    { backgroundColor: inputText.trim() ? '#6366F1' : (isDark ? 'rgba(255,255,255,0.1)' : '#CBD5E1') }
                                ]}
                                onPress={handleSend}
                                disabled={!inputText.trim() || sending}
                            >
                                <Ionicons name="send" size={20} color={inputText.trim() || isDark ? "#FFF" : "#94A3B8"} />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </ImageBackground>
            </View>

            <ChatAttachmentMenu
                visible={showAttachmentMenu}
                onClose={() => setShowAttachmentMenu(false)}
                onSelect={handleAttachmentSelect}
            />

            <PollCreator
                visible={showPollCreator}
                onClose={() => setShowPollCreator(false)}
                onSubmit={handleCreatePoll}
            />

            <PostDetailModal
                visible={postModalVisible}
                onClose={() => setPostModalVisible(false)}
                postData={selectedPost}
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
        backgroundColor: '#6366F1', // Primary Indigo
        borderBottomRightRadius: 4,
        borderTopRightRadius: 18,
        borderBottomLeftRadius: 18,
        borderTopLeftRadius: 18,
    },
    otherMessageBubble: {
        backgroundColor: '#334155', // Solid Dark Slate for readability
        borderBottomLeftRadius: 4,
        borderTopLeftRadius: 18,
        borderBottomRightRadius: 18,
        borderTopRightRadius: 18,
        borderWidth: 0, // Remove border for clean look
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



    // MEDIA & FILE STYLES
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

    // EXISTING STYLES...
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
    // Input Styles matching GroupChat
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    plusButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    inputWrapper: {
        flex: 1,
        borderRadius: 24,
        marginRight: 8,
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        maxHeight: 100,
        paddingTop: 10,
        paddingBottom: 10,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});

export default ChatScreen;
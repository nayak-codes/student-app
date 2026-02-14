// Ultra-Clean Student Profile Screen
import { Ionicons } from '@expo/vector-icons';


import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionToast from '../src/components/ActionToast';
import AddEducationModal from '../src/components/AddEducationModal';
import ClipsFeed from '../src/components/ClipsFeed';
import DocumentViewer from '../src/components/DocumentViewer';
import EditProfileModal from '../src/components/EditProfileModal';
import { EventCard } from '../src/components/EventCard';
import FeedPost from '../src/components/feed/FeedPost';
import BookCard from '../src/components/library/BookCard';
import ProfileOptionsModal from '../src/components/ProfileOptionsModal';
import ShareModal from '../src/components/ShareModal';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { Education } from '../src/services/authService';
import {
    followUser,
    getConnectionStatus,
    getPendingFriendRequests,
    sendFriendRequest,
    subscribeToNetworkStats,
    unfollowUser
} from '../src/services/connectionService';
import { EventItem } from '../src/services/eventService';
import { getUserResources, LibraryResource } from '../src/services/libraryService';
import {
    addReaction,
    deletePost,
    getAllPosts,
    incrementViewCount,
    likePost,
    Post,
    ReactionType,
    savePost,
    unlikePost,
    unsavePost,
    updatePost
} from '../src/services/postsService';
import { updatePostImpressions } from '../src/services/profileStatsService';

type TabType = 'posts' | 'docs' | 'clips' | 'events' | 'playlists';



// Edit Post Modal
const EditPostModal: React.FC<{
    visible: boolean;
    post: Post | null;
    onClose: () => void;
    onSave: (postId: string, newContent: string) => Promise<void>;
}> = ({ visible, post, onClose, onSave }) => {
    const { colors, isDark } = useTheme();
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (post) {
            setContent(post.content);
        }
    }, [post]);

    const handleSave = async () => {
        if (!post) return;
        setSaving(true);
        await onSave(post.id, content);
        setSaving(false);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={[styles.modalContainer, { margin: 20, borderRadius: 16, maxHeight: 400, backgroundColor: colors.card }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Post</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ padding: 16 }}>
                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 12,
                                padding: 12,
                                height: 150,
                                textAlignVertical: 'top',
                                fontSize: 16,
                                color: colors.text,
                                backgroundColor: colors.background
                            }}
                            multiline
                            value={content}
                            onChangeText={setContent}
                            placeholder="What's on your mind?"
                            placeholderTextColor={colors.textSecondary}
                        />
                        <TouchableOpacity
                            style={{
                                backgroundColor: colors.primary,
                                paddingVertical: 12,
                                borderRadius: 12,
                                marginTop: 16,
                                alignItems: 'center',
                                opacity: saving ? 0.7 : 1
                            }}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};




// ... (existing imports)

// Video List Item Component - YouTube Style
const VideoListItem: React.FC<{ post: Post; onPress: (post: Post) => void; onDelete?: (post: Post) => void; onEdit?: (post: Post) => void; }> = ({ post, onPress, onDelete, onEdit }) => {
    const { colors, isDark } = useTheme();
    const [showOptions, setShowOptions] = useState(false);

    const handleOptions = () => {
        const buttons: any[] = [
            { text: 'Cancel', style: 'cancel' as const },
        ];

        if (onEdit) {
            buttons.push({ text: 'Edit', onPress: () => onEdit(post) });
        }

        if (onDelete) {
            buttons.push({ text: 'Delete', style: 'destructive' as const, onPress: () => onDelete(post) });
        }

        Alert.alert('Post Options', 'Choose an action', buttons);
    };

    return (
        <TouchableOpacity
            style={[styles.videoListItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
            activeOpacity={0.9}
            onPress={() => onPress(post)}
        >
            {/* Thumbnail */}
            <View style={styles.videoListThumbnailContainer}>
                {(post.thumbnailUrl || post.imageUrl) ? (
                    <Image source={{ uri: post.thumbnailUrl || post.imageUrl }} style={styles.videoListThumbnail} resizeMode="cover" />
                ) : (
                    <View style={[styles.videoListThumbnail, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="play-circle" size={32} color="#FFF" />
                    </View>
                )}
                <View style={styles.videoDurationBadge}>
                    <Text style={styles.videoDurationText}>3:45</Text>{/* Mock Duration */}
                </View>
            </View>

            {/* Details */}
            <View style={styles.videoListDetails}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[styles.videoListTitle, { color: colors.text }]} numberOfLines={2}>{post.content || 'Untitled Video'}</Text>
                    {(onDelete || onEdit) && (
                        <TouchableOpacity style={{ paddingLeft: 8 }} onPress={handleOptions}>
                            <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={[styles.videoListMeta, { color: colors.textSecondary }]}>
                    {post.userName} • {post.viewCount || 0} views • 2 hours ago
                </Text>
            </View>
        </TouchableOpacity>
    );
};



// ... (existing components)
const PostGridItem: React.FC<{ post: Post; onPress: (post: Post) => void }> = ({ post, onPress }) => {
    const { colors } = useTheme();
    return (
        <Pressable
            style={({ pressed }) => [
                styles.gridItem,
                { opacity: pressed ? 0.9 : 1, backgroundColor: colors.border }
            ]}
            onPress={() => onPress(post)}
        >
            {post.imageUrl ? (
                <Image source={{ uri: post.imageUrl }} style={styles.gridImage} resizeMode="cover" />
            ) : post.videoLink ? (
                <View style={[styles.gridImage, styles.gridPlaceholder]}>
                    <Ionicons name="play" size={24} color="#FFF" />
                </View>
            ) : (
                <View style={[styles.gridImage, styles.gridPlaceholder, { backgroundColor: colors.cardBorder }]}>
                    <Ionicons name="text" size={24} color={colors.textSecondary} />
                    <Text style={[styles.gridTextPreview, { color: colors.textSecondary }]} numberOfLines={2}>{post.content}</Text>
                </View>
            )}
            {post.type === 'video' && (
                <View style={styles.gridIconOverlay}>
                    <Ionicons name="play" size={12} color="#FFF" />
                </View>
            )}
            {post.type === 'note' && (
                <View style={styles.gridIconOverlay}>
                    <Ionicons name="document-text" size={12} color="#FFF" />
                </View>
            )}
        </Pressable>
    );
};

// Detail Modal Component
const PostDetailModal: React.FC<{
    visible: boolean;
    post: Post | null;
    onClose: () => void;
    onImagePress: (uri: string) => void;
    onVideoPress: (link: string, post: Post) => void;
    onDelete?: (post: Post) => void | Promise<void>;
    onEdit?: (post: Post) => void | Promise<void>;
    onLike: (postId: string) => void;
    onReact: (postId: string, reaction: ReactionType) => void;
    onShare: (postId: string) => void;
    onSave: (postId: string) => void;
    onComment: (postId: string) => void;
    currentUserId: string;
}> = ({ visible, post, onClose, onImagePress, onVideoPress, onDelete, onEdit, onLike, onReact, onShare, onSave, onComment, currentUserId }) => {
    const { colors, isDark } = useTheme();

    if (!post) return null;

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Post</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                    <FeedPost
                        post={post}
                        currentUserId={currentUserId}
                        onLike={onLike}
                        onReact={onReact}
                        onComment={onComment}
                        onShare={onShare}
                        onSave={onSave}
                        onDelete={() => onDelete && onDelete(post)}
                        onEdit={() => onEdit && onEdit(post)}
                        currentUserLiked={post.likedBy?.includes(currentUserId || '')}
                        currentUserSaved={post.savedBy?.includes(currentUserId || '')}
                        currentUserReaction={post.reactedBy?.[currentUserId || '']}
                        isVisible={true}
                    />
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

const ProfileScreen = () => {
    // 1. Navigation & Route Params
    const router = useRouter();
    const { userId } = useLocalSearchParams<{ userId: string }>();

    // 2. Auth Context (Current User)
    const { user: authUser, userProfile: authUserProfile, refreshProfile } = useAuth();
    const { colors, isDark } = useTheme();

    // 3. Derived State (Who are we viewing?)
    const isOwnProfile = authUser?.uid === userId; // Check if viewing own profile
    const targetUserId = userId;

    // DEBUG: Log to help troubleshoot
    useEffect(() => {
        console.log('=== PROFILE SCREEN DEBUG ===');
        console.log('userId from params:', userId);
        console.log('authUser.uid:', authUser?.uid);
        console.log('isOwnProfile:', isOwnProfile);
        console.log('targetUserId:', targetUserId);
        console.log('========================');
    }, [userId, authUser?.uid, isOwnProfile]);

    // 4. Component State
    // Profile Data (either own or fetched)
    const [publicUserProfile, setPublicUserProfile] = useState<any | null>(null); // Using any for now to match UserProfile/User mix
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [showProfilePicViewer, setShowProfilePicViewer] = useState(false);

    // UI State
    const [activeTab, setActiveTab] = useState<TabType>('posts');
    const [filterType, setFilterType] = useState<'recent' | 'old' | 'popular'>('recent');
    const [scrollY, setScrollY] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Connection state
    const [connectionStatus, setConnectionStatus] = useState({
        isFriend: false,
        isFollowing: false,
        isFollower: false,
        friendshipStatus: 'none' as 'pending' | 'accepted' | 'none',
        pendingRequestSentByMe: false,
    });
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);

    const [loadingConnection, setLoadingConnection] = useState(false);

    // Data State
    const [posts, setPosts] = useState<Post[]>([]);

    const [resources, setResources] = useState<LibraryResource[]>([]);
    const [events, setEvents] = useState<EventItem[]>([]);

    // Stats State
    const [stats, setStats] = useState({
        posts: 0,
        likes: 0,
        followers: 0,
        friends: 0,
        streak: 0,
    });

    // Modals State
    const [showEditModal, setShowEditModal] = useState(false);
    const [showEducationModal, setShowEducationModal] = useState(false);
    const [editingEducation, setEditingEducation] = useState<Education | undefined>(undefined);

    const [editPostModalVisible, setEditPostModalVisible] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);

    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list'); // Default to list view

    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerUri, setViewerUri] = useState<string>('');
    const [docViewerVisible, setDocViewerVisible] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<LibraryResource | null>(null);

    // Clips Feed State
    const [showClipsFeed, setShowClipsFeed] = useState(false);
    const [initialClipIndex, setInitialClipIndex] = useState(0);

    // 5. Computed Display Values
    // If it's own profile, priority is authUserProfile (Firestore) > authUser (Auth)
    // If public, priority is publicUserProfile
    const displayProfile = isOwnProfile ? (authUserProfile || authUser) : publicUserProfile;

    const displayName = (displayProfile as any)?.name || (displayProfile as any)?.displayName || 'Student';
    const photoURL = (displayProfile as any)?.profilePhoto || (displayProfile as any)?.photoURL || (displayProfile as any)?.bannerUrl; // bannerUrl fallback is specific to the messy types, maybe remove
    const coverPhoto = (displayProfile as any)?.coverPhoto || (displayProfile as any)?.bannerUrl;
    const role = (displayProfile as any)?.role || 'Student';
    const username = (displayProfile as any)?.username || displayName.toLowerCase().replace(/\s/g, '');
    const about = (displayProfile as any)?.about;
    const institution = (displayProfile as any)?.institution || (displayProfile as any)?.education?.[0]?.institution;



    // Use Ref to track latest profile for async loadData
    const displayProfileRef = useRef(displayProfile);
    useEffect(() => {
        displayProfileRef.current = displayProfile;
    }, [displayProfile]);

    // 6. Data Fetching
    const loadData = async () => {
        if (!targetUserId) return;

        try {
            // A. Fetch Profile if not own
            if (!isOwnProfile) {
                setLoadingProfile(true);
                const fetchedProfile = await import('../src/services/authService').then(m => m.getUserProfile(targetUserId));
                setPublicUserProfile(fetchedProfile);
            }

            // B. Fetch Posts & Resources
            const [allPosts, userResources, userEvents] = await Promise.all([
                getAllPosts(),
                getUserResources(targetUserId),
                import('../src/services/eventService').then(m => m.getUserEvents(targetUserId))
            ]);

            // Filter posts for this user
            const userPosts = allPosts.filter(p => p.userId === targetUserId);
            setPosts(userPosts);

            setResources(userResources);
            setEvents(userEvents);

            // C. Calculate Stats
            const totalLikes = userPosts.reduce((sum, post) => sum + post.likes, 0) +
                userResources.reduce((sum, doc) => sum + (doc.likes || 0), 0);
            const totalHelpful = userResources.reduce((sum, doc) => sum + (doc.downloads || 0), 0);

            const currentProfile = displayProfileRef.current as any;

            setStats({
                posts: userPosts.length + userResources.length,
                likes: totalLikes,
                followers: currentProfile?.networkStats?.followersCount ?? currentProfile?.connections?.length ?? 0,
                friends: currentProfile?.networkStats?.friendsCount ?? 0,
                streak: currentProfile?.progress?.studyStreak ?? 5,
            });

            if (isOwnProfile) {
                await updatePostImpressions(targetUserId, userPosts);
            }

        } catch (error) {
            console.error('Error loading profile data:', error);
            if (!isOwnProfile && !publicUserProfile) {
                Alert.alert("Error", "Failed to load user profile");
                router.back();
            }
        } finally {
            setLoadingProfile(false);
        }
    };

    // Load connection status and pending requests
    const loadConnectionData = async () => {
        if (!authUser) return;

        try {
            // Load pending requests (for notification badge)
            const requests = await getPendingFriendRequests(authUser.uid);
            setPendingRequests(requests);

            // Load connection status with target user if not own profile
            if (!isOwnProfile && targetUserId) {
                const status = await getConnectionStatus(authUser.uid, targetUserId);
                setConnectionStatus({
                    isFriend: status.isFriend,
                    isFollowing: status.isFollowing,
                    isFollower: status.isFollower,
                    friendshipStatus: status.friendshipStatus || 'none',
                    pendingRequestSentByMe: status.pendingRequestSentByMe || false,
                });
            }
        } catch (error) {
            console.error('Error loading connection data:', error);
        }
    };

    // Real-time stats subscription
    useEffect(() => {
        if (!targetUserId) return;

        const unsubscribe = subscribeToNetworkStats(targetUserId, (newStats) => {
            setStats(prev => ({
                ...prev,
                followers: newStats.followersCount,
                friends: newStats.friendsCount || 0, // Ensure friends property exists in stats object if you plan to use it
            }));

            // Note: You might want to update other stats if they are part of the state
            // For now, updating followers which maps to followersCount
            // You may need to update the stats state definition to include friends count explicitly 
            // or map it accordingly. 
            // Assuming 'followers' in stats state is used for the Followers count display.
            // If you want to show 'Network' count (friends), you should check where that is displayed.
            // The user asked for "network and followers", so let's update accordingly.
        });

        return () => unsubscribe();
    }, [targetUserId]);

    // Handle connection actions
    const handleConnect = async () => {
        if (!authUser || !targetUserId) return;
        try {
            await sendFriendRequest(targetUserId);
            // Alert.alert('Success', 'Friend request sent!'); // REPLACED
            showToast('Network request sent');
            loadConnectionData(); // Refresh status
        } catch (error) {
            console.error('Error sending friend request:', error);
            Alert.alert('Error', 'Failed to send friend request');
        }
    };

    const handleFollow = async () => {
        if (!authUser || !targetUserId) return;
        setLoadingConnection(true);
        try {
            if (connectionStatus.isFollowing) {
                await unfollowUser(targetUserId);
                // Alert.alert('Success', 'Unfollowed user'); // REPLACED
                showToast('Unsubscribed');
            } else {
                await followUser(targetUserId);
                // Alert.alert('Success', 'Now following!'); // REPLACED
                showToast('Subscribed!');
            }
            loadConnectionData();
        } catch (error) {
            console.error('Error toggling follow:', error);
            Alert.alert('Error', 'Failed to update follow status');
        } finally {
            setLoadingConnection(false);
        }
    };



    // Modals State
    const [showProfileOptions, setShowProfileOptions] = useState(false);
    const [showShareSheet, setShowShareSheet] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '' });

    const showToast = (message: string) => {
        setToast({ visible: true, message });
    };

    const handleHideToast = () => {
        setToast(prev => ({ ...prev, visible: false }));
    };

    // ... (rest of states)

    const handleProfileOptions = () => {
        setShowProfileOptions(true);
    };

    useEffect(() => {
        loadData();
        loadConnectionData();
    }, [targetUserId]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        if (isOwnProfile && refreshProfile) await refreshProfile();
        await loadData();
        await loadConnectionData();
        setIsRefreshing(false);
    };


    // 7. Event Handlers
    const openPostModal = (post: Post) => {
        setSelectedPost(post);
        setDetailModalVisible(true);
    };

    const closePostModal = () => {
        setDetailModalVisible(false);
        setSelectedPost(null);
    };

    const handleEditPost = (post: Post) => {
        setEditingPost(post);
        setEditPostModalVisible(true);
    };

    const handleDeletePost = async (post: Post) => {
        Alert.alert(
            "Delete Post",
            "Are you sure you want to delete this post?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                        if (!authUser?.uid) return;
                        await deletePost(post.id, authUser.uid);
                        if (detailModalVisible) closePostModal();
                        handleRefresh();
                    }
                }
            ]
        );
    };

    const savePostEdit = async (postId: string, newContent: string) => {
        try {
            if (!authUser?.uid) return;
            await updatePost(postId, authUser.uid, { content: newContent });
            handleRefresh();
        } catch (error) {
            Alert.alert("Error", "Failed to update post");
        }
    };





    // Interaction Handlers for FeedPost
    const handleLike = async (postId: string) => {
        if (!authUser?.uid) return;
        try {
            const post = posts.find(p => p.id === postId);
            if (!post) return;

            // Optimistic update
            const isLiked = post.likedBy?.includes(authUser.uid);
            const newLikedBy = isLiked
                ? post.likedBy.filter(id => id !== authUser.uid)
                : [...(post.likedBy || []), authUser.uid];

            setPosts(prev => prev.map(p =>
                p.id === postId
                    ? { ...p, likedBy: newLikedBy, likes: newLikedBy.length }
                    : p
            ));

            if (isLiked) {
                await unlikePost(postId, authUser.uid);
            } else {
                await likePost(postId, authUser.uid);
            }
        } catch (error) {
            console.error('Like error:', error);
        }
    };

    const handleReact = async (postId: string, reaction: ReactionType) => {
        if (!authUser?.uid) return;
        try {
            const post = posts.find(p => p.id === postId);
            if (!post) return;

            // Optimistic update
            const currentReactions = post.reactedBy || {};
            const newReactions = { ...currentReactions, [authUser.uid]: reaction };

            setPosts(prev => prev.map(p =>
                p.id === postId
                    ? { ...p, reactedBy: newReactions }
                    : p
            ));

            await addReaction(postId, authUser.uid, reaction);
        } catch (error) {
            console.error('Reaction error:', error);
        }
    };

    const handleSavePost = async (postId: string) => {
        if (!authUser?.uid) return;
        try {
            const post = posts.find(p => p.id === postId);
            if (!post) return;

            const isSaved = post.savedBy?.includes(authUser.uid);
            const newSavedBy = isSaved
                ? post.savedBy.filter(id => id !== authUser.uid)
                : [...(post.savedBy || []), authUser.uid];

            setPosts(prev => prev.map(p =>
                p.id === postId
                    ? { ...p, savedBy: newSavedBy }
                    : p
            ));

            if (isSaved) {
                await unsavePost(postId, authUser.uid);
            } else {
                await savePost(postId, authUser.uid);
            }
        } catch (error) {
            console.error('Save error:', error);
        }
    };

    const handleShare = async (postId: string) => {
        try {
            const post = posts.find(p => p.id === postId);
            if (!post) return;

            await Share.share({
                title: 'Share Post',
                message: `Check out this post by ${post.userName}: ${post.content.substring(0, 50)}...`,
                url: `studentverse://post/${postId}`
            });
            await incrementViewCount(postId);
        } catch (error) {
            console.log('Share dismissed or error');
        }
    };

    const handleComment = (postId: string) => {
        const post = posts.find(p => p.id === postId);
        if (post) openPostModal(post);
    };

    const openImageViewer = (uri: string) => {
        if (!uri) return;
        setViewerUri(uri);
        setViewerVisible(true);
    };

    const closeImageViewer = () => {
        setViewerVisible(false);
        setViewerUri('');
    };

    const [showVideoPlayer, setShowVideoPlayer] = useState(false);

    // Video logic
    const openVideo = (link: string, post?: Post) => {
        if (!link) return;

        // If YouTube, open in browser/app
        if (link.includes('youtube.com') || link.includes('youtu.be')) {
            Linking.openURL(link).catch(err => console.error("Couldn't load page", err));
        } else {
            // New YouTube-style Player Screen
            router.push({
                pathname: '/screens/video-player',
                params: {
                    videoUri: link,
                    postId: post?.id,
                    title: post?.content,
                    description: post?.content,
                    authorName: displayName,
                    authorImage: photoURL,
                    authorId: targetUserId,
                    likes: post?.likes,
                    views: post?.viewCount || 0,
                    date: post?.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'
                }
            });
        }
    };

    const openResource = (resource: LibraryResource) => {
        if (resource.type === 'pdf') {
            setSelectedDoc(resource);
            setDocViewerVisible(true);
        } else {
            // For now just show PDF viewer or do nothing
            Alert.alert("Info", "Only PDF viewing supported currently.");
        }
    };

    // Filter & Sort Logic
    const getFilteredAndSortedContent = () => {
        let content: any[] = [];
        const isDocs = activeTab === 'docs';

        // 1. Filter by Tab
        switch (activeTab) {
            case 'posts':
                // Show all posts except clips if we want to separate them?
                // Or just show everything that isn't explicitly a clip?
                // Current logic implies 'posts' includes standard posts.
                content = posts.filter(p => !p.type || p.type === 'image' || p.type === 'note' || p.type === 'news');
                break;
            case 'clips':
                // Handled in render directly for specific logic, but keeping this safe
                // STRICTER FILTER: Only type='clip' OR link has 'shorts'
                content = posts.filter(p => p.type === 'clip' || (p.videoLink && p.videoLink.includes('shorts')));
                break;
            case 'events':
                content = [...events];
                break;
            case 'docs':
                content = [...resources];
                break;

            default:
                content = [...posts];
        }

        // 2. Sort
        return content.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            const likesA = a.likes || 0;
            const likesB = b.likes || 0;

            switch (filterType) {
                case 'recent':
                    return dateB - dateA; // Newest first
                case 'old':
                    return dateA - dateB; // Oldest first
                case 'popular':
                    return likesB - likesA; // Most likes first
                default:
                    return 0;
            }
        });
    };

    const hasContent = getFilteredAndSortedContent().length > 0;

    if (loadingProfile && !displayProfile) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        progressViewOffset={120}
                    />
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Banner & Header */}
                <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
                    <View style={[styles.channelBanner, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                        {coverPhoto ? (
                            <Image source={{ uri: coverPhoto }} style={styles.bannerImage} resizeMode="cover" />
                        ) : (
                            <LinearGradient
                                colors={isDark ? ['#4c1d95', '#5b21b6', '#7c3aed'] : ['#6366f1', '#8b5cf6', '#d946ef']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.bannerPlaceholder}
                            />
                        )}
                        <View style={styles.topBarOverlay}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.iconButtonBlur}>
                                <Ionicons name="arrow-back" size={20} color="#FFF" />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }} />

                            {/* Notification Bell with Badge */}
                            <TouchableOpacity
                                style={[styles.iconButtonBlur, { marginLeft: 8 }]}
                                onPress={() => router.push('/notifications')}
                            >
                                <Ionicons name="notifications-outline" size={20} color="#FFF" />
                                {pendingRequests.length > 0 && (
                                    <View style={styles.notificationBadge}>
                                        <Text style={styles.notificationBadgeText}>
                                            {pendingRequests.length}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {isOwnProfile && (
                                <TouchableOpacity style={[styles.iconButtonBlur, { marginLeft: 8 }]}>
                                    <Ionicons name="settings-outline" size={20} color="#FFF" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Profile Info */}
                    <View style={styles.profileInfoContainer}>
                        <View style={styles.ytAvatarContainer}>
                            <TouchableOpacity activeOpacity={0.9} onPress={() => setShowProfilePicViewer(true)}>
                                {photoURL ? (
                                    <Image source={{ uri: photoURL }} style={[styles.ytAvatar, { borderColor: colors.background }]} />
                                ) : (
                                    <View style={[styles.ytAvatar, { backgroundColor: colors.primary, borderColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                                        <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold' }}>
                                            {displayName.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <Text style={[styles.ytName, { color: colors.text }]}>{displayName}</Text>
                            <View style={[styles.roleBadge, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF', borderColor: isDark ? '#334155' : '#E0E7FF' }]}>
                                <Text style={[styles.roleBadgeText, { color: colors.primary }]}>{role}</Text>
                            </View>
                        </View>
                        {/* Handle & Stats Combined Row */}
                        <View style={styles.ytHandleRow}>
                            <Text style={[styles.ytHandleText, { color: colors.textSecondary }]}>@{username}</Text>
                            <Text style={[styles.ytHandleSeparator, { color: colors.border }]}>•</Text>
                            <Text style={[styles.ytHandleText, { color: colors.textSecondary }]}>{stats.followers} Followers</Text>
                            <Text style={[styles.ytHandleSeparator, { color: colors.border }]}>•</Text>
                            <Text style={[styles.ytHandleText, { color: colors.textSecondary }]}>{stats.posts} Posts</Text>
                        </View>

                        {/* Bio - Left align */}
                        {about && (
                            <View style={styles.ytBioContainer}>
                                <Text style={[styles.ytBioText, { color: colors.textSecondary }]} numberOfLines={3}>
                                    {about}
                                    <Text style={{ color: colors.primary, fontWeight: '600' }} onPress={() => router.push({ pathname: '/profile-details', params: { userId: targetUserId } })}>
                                        {' '}...more
                                    </Text>
                                </Text>
                                {institution && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, opacity: 0.8 }}>
                                        <Ionicons name="school-outline" size={14} color={colors.textSecondary} />
                                        <Text style={[styles.ytLinkText, { marginLeft: 4, marginTop: 0, color: colors.primary }]}>{institution}</Text>
                                    </View>
                                )}
                            </View>
                        )}



                        <View style={styles.ytActionsRow}>
                            {/* Action Buttons (Public Profile - Follow/Message Only) */}
                            <View style={styles.actionButtonsContainer}>
                                {/* DUAL ACCOUNT SYSTEM LOGIC */}

                                {/* 1. CREATOR ACCOUNT: Show Follow + Connect + Message */}
                                {role === 'creator' ? (
                                    <>
                                        {/* Main Action Button - Subscribe */}
                                        {role === 'creator' && !isOwnProfile && (
                                            <TouchableOpacity
                                                style={[
                                                    styles.actionButton,
                                                    styles.primaryButton,
                                                    connectionStatus.isFollowing && styles.followingButton
                                                ]}
                                                onPress={handleFollow}
                                                activeOpacity={0.8}
                                            >
                                                {loadingConnection ? (
                                                    <ActivityIndicator color="#FFF" size="small" />
                                                ) : (
                                                    <>
                                                        <Ionicons
                                                            name={connectionStatus.isFollowing ? "notifications" : "notifications-outline"}
                                                            size={20}
                                                            color={connectionStatus.isFollowing ? "#FFF" : "#FFF"}
                                                            style={{ marginRight: 8 }}
                                                        />
                                                        <Text style={[
                                                            styles.actionButtonText,
                                                            styles.primaryButtonText,
                                                            connectionStatus.isFollowing && styles.followingButtonText
                                                        ]}>
                                                            {connectionStatus.isFollowing ? 'Following' : 'Follow'}
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        )}
                                        {/* Three Dots Button for Connect/Options */}
                                        <TouchableOpacity
                                            style={[
                                                styles.ytSecondaryButton,
                                                {
                                                    flex: 0,
                                                    width: 52, // Square button
                                                    backgroundColor: isDark ? '#334155' : '#FFF',
                                                    borderColor: colors.border,
                                                    paddingHorizontal: 0
                                                }
                                            ]}
                                            onPress={handleProfileOptions}
                                        >
                                            <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    /* 2. STUDENT ACCOUNT: Show Connect (Primary) + Message (if friend) - NO FOLLOW */
                                    <>
                                        {connectionStatus.isFriend ? (
                                            /* If Connected: Show Message (Primary) */
                                            <TouchableOpacity
                                                style={[styles.ytPrimaryButton, { flex: 1, backgroundColor: colors.primary, paddingHorizontal: 4 }]}
                                                onPress={async () => {
                                                    if (!targetUserId || !authUser) return;
                                                    try {
                                                        const { getOrCreateConversation } = await import('../src/services/chatService');
                                                        const conversationId = await getOrCreateConversation(
                                                            authUser.uid,
                                                            targetUserId,
                                                            {
                                                                name: displayName,
                                                                photoURL: photoURL || '',
                                                                email: (displayProfile as any)?.email || '',
                                                            }
                                                        );
                                                        router.push({
                                                            pathname: '/chat-screen',
                                                            params: { conversationId, otherUserId: targetUserId, otherUserName: displayName, otherUserPhoto: photoURL || '' },
                                                        });
                                                    } catch (error) {
                                                        console.error('Error starting conversation:', error);
                                                        Alert.alert('Error', 'Failed to start conversation');
                                                    }
                                                }}
                                            >
                                                <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" />
                                                <Text style={[styles.ytSecondaryButtonText, { color: '#FFF', marginLeft: 4, fontSize: 13 }]}>Message</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            /* If Not Connected: Show Connect (Primary) */
                                            <TouchableOpacity
                                                style={[
                                                    styles.ytPrimaryButton,
                                                    { flex: 1, backgroundColor: colors.primary, paddingHorizontal: 4 },
                                                    connectionStatus.friendshipStatus === 'pending' && { backgroundColor: isDark ? '#334155' : '#E2E8F0' }
                                                ]}
                                                onPress={handleConnect}
                                                disabled={connectionStatus.friendshipStatus === 'pending' || loadingConnection}
                                            >
                                                {loadingConnection ? (
                                                    <ActivityIndicator size="small" color="#FFF" />
                                                ) : (
                                                    <>
                                                        <Ionicons
                                                            name={connectionStatus.friendshipStatus === 'pending' ? "time" : "person-add"}
                                                            size={20}
                                                            color={connectionStatus.friendshipStatus === 'pending' ? colors.text : "#FFF"}
                                                        />
                                                        <Text style={[
                                                            styles.ytSecondaryButtonText,
                                                            { color: connectionStatus.friendshipStatus === 'pending' ? colors.text : '#FFF', marginLeft: 4, fontSize: 13 }
                                                        ]} numberOfLines={1}>
                                                            {connectionStatus.friendshipStatus === 'pending' ? "Requested" : "Connect"}
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        )}
                                    </>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={[styles.ytTabsContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ytTabsContent}>
                            <TouchableOpacity
                                style={[styles.ytTab, activeTab === 'posts' && styles.ytTabActive, { borderBottomColor: activeTab === 'posts' ? colors.text : 'transparent' }]}
                                onPress={() => setActiveTab('posts')}
                            >
                                <Text style={[styles.ytTabText, { color: colors.textSecondary }, activeTab === 'posts' && { color: colors.text }]}>Posts</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.ytTab, activeTab === 'clips' && styles.ytTabActive, { borderBottomColor: activeTab === 'clips' ? colors.text : 'transparent' }]}
                                onPress={() => setActiveTab('clips')}
                            >
                                <Text style={[styles.ytTabText, { color: colors.textSecondary }, activeTab === 'clips' && { color: colors.text }]}>Clips</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.ytTab, activeTab === 'events' && styles.ytTabActive, { borderBottomColor: activeTab === 'events' ? colors.text : 'transparent' }]}
                                onPress={() => setActiveTab('events')}
                            >
                                <Text style={[styles.ytTabText, { color: colors.textSecondary }, activeTab === 'events' && { color: colors.text }]}>Events</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.ytTab, activeTab === 'docs' && styles.ytTabActive, { borderBottomColor: activeTab === 'docs' ? colors.text : 'transparent' }]}
                                onPress={() => setActiveTab('docs')}
                            >
                                <Text style={[styles.ytTabText, { color: colors.textSecondary }, activeTab === 'docs' && { color: colors.text }]}>Docs</Text>
                            </TouchableOpacity>


                        </ScrollView>
                    </View>

                    {/* Sub-Section Filters (Recent, Old, Popular) - Hide on Home */}
                    {/* Sub-Section Filters (Recent, Old, Popular) - Hide on Home */}{
                        <View style={[styles.subFilterContainer, { backgroundColor: colors.background }]}>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                {['recent', 'old', 'popular'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.subFilterChip,
                                            { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: colors.border },
                                            filterType === type && { backgroundColor: isDark ? '#334155' : '#E2E8F0', borderColor: colors.text }
                                        ]}
                                        onPress={() => setFilterType(type as any)}
                                    >
                                        <Text style={[
                                            styles.subFilterText,
                                            { color: colors.textSecondary },
                                            filterType === type && { color: colors.text }
                                        ]}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* View Toggle (Grid/List) - Visible only for Posts */}
                            {activeTab === 'posts' && (
                                <TouchableOpacity
                                    style={{ marginLeft: 'auto', padding: 8 }}
                                    onPress={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
                                >
                                    <Ionicons
                                        name={viewMode === 'grid' ? "list" : "grid-outline"}
                                        size={20}
                                        color={colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    }

                    {/* Content Grid */}
                </View>
                <View style={styles.contentSection}>
                    <View style={styles.postsGrid}>
                        {!hasContent ? (
                            <View style={styles.emptyPostsState}>
                                <Ionicons name={activeTab === 'docs' ? "document-text-outline" : "school-outline"} size={48} color={colors.border} />
                                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{isOwnProfile ? 'Share your knowledge' : 'No content yet'}</Text>
                                {isOwnProfile && <Text style={{ color: colors.textSecondary, marginTop: 4, fontSize: 13 }}>Upload {activeTab === 'docs' ? 'documents' : 'posts'} to inspire others.</Text>}
                            </View>
                        ) : (
                            <View style={[
                                styles.gridContainer,
                                (activeTab === 'posts') && viewMode === 'list' && {
                                    flexDirection: 'column',
                                    flexWrap: 'nowrap',
                                    width: Dimensions.get('window').width,
                                    alignSelf: 'center'
                                }
                            ]}>
                                {activeTab === 'docs' ? (
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', paddingHorizontal: 16 }}>
                                        {getFilteredAndSortedContent().map((item: any, index: number) => (
                                            <BookCard
                                                key={item.id}
                                                item={item}
                                                onPressCover={(resource) => {
                                                    // PDF/Notes -> Open Viewer
                                                    if (!resource.isPremium && (resource.type === 'pdf' || resource.type === 'notes')) {
                                                        setSelectedDoc(resource);
                                                        setDocViewerVisible(true);
                                                    } else {
                                                        // Fallback to details (or if premium)
                                                        router.push({ pathname: '/document-detail', params: { id: resource.id } });
                                                    }
                                                }}
                                                onPressInfo={(resource) => {
                                                    // Info -> Open Details Page
                                                    router.push({ pathname: '/document-detail', params: { id: resource.id } });
                                                }}
                                                style={{
                                                    marginBottom: 16,
                                                    width: '30%',
                                                    marginRight: index % 3 === 2 ? 0 : '5%'
                                                }}
                                            />
                                        ))}
                                    </View>
                                ) : activeTab === 'clips' ? (
                                    <View style={styles.clipsGridContainer}>
                                        {/* Filter specifically for SHORTS/CLIPS structure based on URL or Type */}
                                        {posts.filter(p => p.type === 'clip' || (p.videoLink && p.videoLink.includes('shorts'))).map((item: any, index: number) => {
                                            // Determine thumbnail
                                            let thumbnailUrl = item.thumbnailUrl || item.imageUrl;
                                            if (!thumbnailUrl && item.videoLink) {
                                                const match = item.videoLink.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
                                                if (match) thumbnailUrl = `https://img.youtube.com/vi/${match[1]}/0.jpg`;
                                            }

                                            return (
                                                <Pressable
                                                    key={item.id}
                                                    style={styles.clipCardItem}
                                                    onPress={() => {
                                                        // Increment view count in background (non-blocking)
                                                        incrementViewCount(item.id);

                                                        // Launch the ClipsFeed player
                                                        setInitialClipIndex(index);
                                                        setShowClipsFeed(true);
                                                    }}
                                                >
                                                    {/* Thumbnail */}
                                                    {thumbnailUrl ? (
                                                        <Image
                                                            source={{ uri: thumbnailUrl }}
                                                            style={styles.clipThumbnail}
                                                            resizeMode="cover"
                                                        />
                                                    ) : (
                                                        <View style={[styles.clipThumbnail, { backgroundColor: isDark ? '#334155' : '#CBD5E1', justifyContent: 'center', alignItems: 'center' }]}>
                                                            <Ionicons name="film" size={40} color={colors.textSecondary} />
                                                            <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12 }}>Clip</Text>
                                                        </View>
                                                    )}

                                                    {/* Gradient Overlay */}
                                                    <LinearGradient
                                                        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
                                                        locations={[0, 0.4, 0.7, 1]}
                                                        style={styles.clipGradient}
                                                    >
                                                        {/* Bottom section - title + creator */}
                                                        <View style={styles.clipContent}>
                                                            {/* Title */}
                                                            <Text style={styles.clipTitle} numberOfLines={1}>
                                                                {item.content || 'Untitled'}
                                                            </Text>

                                                            {/* Creator row */}
                                                            <View style={styles.clipMetaRow}>
                                                                <View style={styles.clipAuthor}>
                                                                    <View style={styles.clipAvatar}>
                                                                        {item.userProfilePhoto ? (
                                                                            <Image source={{ uri: item.userProfilePhoto }} style={{ width: '100%', height: '100%' }} />
                                                                        ) : (
                                                                            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>
                                                                                {item.userName.charAt(0).toUpperCase()}
                                                                            </Text>
                                                                        )}
                                                                    </View>
                                                                    <Text style={styles.clipAuthorName} numberOfLines={1}>
                                                                        {item.userName}
                                                                    </Text>
                                                                </View>

                                                                {/* Combined play + view count bubble */}
                                                                <View style={styles.clipStats}>
                                                                    <Ionicons name="play" size={10} color="#FFF" />
                                                                    <Text style={styles.clipViewsText}>
                                                                        {item.viewCount && item.viewCount > 0
                                                                            ? item.viewCount > 1000 ? `${(item.viewCount / 1000).toFixed(1)}K` : item.viewCount
                                                                            : '0'}
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    </LinearGradient>
                                                </Pressable>
                                            );
                                        })}
                                        {posts.filter(p => p.type === 'clip' || (p.videoLink && p.videoLink.includes('shorts'))).length === 0 && (
                                            <View style={{ padding: 40, alignItems: 'center', width: '100%' }}>
                                                <Ionicons name="videocam-outline" size={48} color={colors.textSecondary} />
                                                <Text style={{ marginTop: 12, color: colors.textSecondary }}>No clips yet</Text>
                                            </View>
                                        )}
                                    </View>
                                ) : activeTab === 'events' ? (
                                    <View style={{ padding: 16, width: '100%' }}>
                                        {events.map(event => (
                                            <EventCard
                                                key={event.id}
                                                event={event}
                                                forceWhite={true}
                                                style={{ width: '100%' }}
                                                onPress={(item: any) => router.push({ pathname: '/event-detail', params: { event: JSON.stringify(item) } })}
                                            />
                                        ))}
                                        {events.length === 0 && (
                                            <View style={{ padding: 40, alignItems: 'center' }}>
                                                <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
                                                <Text style={{ marginTop: 12, color: colors.textSecondary }}>No events yet</Text>
                                            </View>
                                        )}
                                    </View>
                                ) : activeTab === 'posts' ? (
                                    viewMode === 'list' ? (
                                        getFilteredAndSortedContent().map((item: any) => (
                                            <FeedPost
                                                key={item.id}
                                                post={item}
                                                currentUserId={authUser?.uid || ''}
                                                onLike={handleLike}
                                                onReact={handleReact}
                                                onComment={handleComment}
                                                onShare={handleShare}
                                                onSave={handleSavePost}
                                                onDelete={isOwnProfile ? () => handleDeletePost(item) : undefined}
                                                onEdit={isOwnProfile ? () => savePostEdit(item.id, item.content) : undefined}
                                                currentUserLiked={item.likedBy?.includes(authUser?.uid || '')}
                                                currentUserSaved={item.savedBy?.includes(authUser?.uid || '')}
                                                currentUserReaction={item.reactedBy?.[authUser?.uid || '']}
                                                isVisible={true}
                                            />
                                        ))
                                    ) : (
                                        getFilteredAndSortedContent().map((item: any) => (
                                            <PostGridItem
                                                key={item.id}
                                                post={item}
                                                onPress={openPostModal}
                                            />
                                        ))
                                    )
                                ) : (
                                    getFilteredAndSortedContent().map((item: any) => (
                                        <PostGridItem
                                            key={item.id}
                                            post={item}
                                            onPress={openPostModal}
                                        />
                                    ))
                                )}
                            </View>
                        )}
                    </View>
                </View>

            </ScrollView>

            <EditProfileModal
                visible={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSaved={handleRefresh}
            />

            <AddEducationModal
                visible={showEducationModal}
                onClose={() => {
                    setShowEducationModal(false);
                    setEditingEducation(undefined);
                }}
                onSaved={handleRefresh}
                userId={authUser?.uid || ''}
                editingEducation={editingEducation}
            />

            <EditPostModal
                visible={editPostModalVisible}
                post={editingPost}
                onClose={() => setEditPostModalVisible(false)}
                onSave={savePostEdit}
            />

            <PostDetailModal
                visible={detailModalVisible}
                post={selectedPost}
                onClose={closePostModal}
                onImagePress={openImageViewer}
                onVideoPress={openVideo}
                onDelete={isOwnProfile ? handleDeletePost : undefined}
                onEdit={isOwnProfile ? handleEditPost : undefined}
                onLike={handleLike}
                onReact={handleReact}
                onComment={handleComment}
                onShare={handleShare}
                onSave={handleSavePost}
                currentUserId={authUser?.uid || ''}
            />

            <Modal visible={viewerVisible} transparent={true} onRequestClose={closeImageViewer}>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.closeButton} onPress={closeImageViewer}>
                        <Ionicons name="close" size={30} color="#FFF" />
                    </TouchableOpacity>
                    <Image
                        source={{ uri: viewerUri }}
                        style={styles.fullImage}
                        resizeMode="contain"
                    />
                </View>
            </Modal>

            <DocumentViewer
                visible={showProfilePicViewer}
                onClose={() => setShowProfilePicViewer(false)}
                documentUrl={photoURL || ''}
                documentName={`${displayName}'s Profile`}
                documentType="image"
            />

            {/* ClipsFeed Modal */}
            <Modal
                visible={showClipsFeed}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowClipsFeed(false)}
            >
                <ClipsFeed
                    initialIndex={initialClipIndex}
                    data={posts.filter(p => p.type === 'clip' || (p.videoLink && p.videoLink.includes('shorts'))).map(p => ({
                        id: p.id,
                        type: 'clip',
                        title: p.content,
                        author: p.userName,
                        likes: p.likes,
                        comments: p.comments,
                        saved: false,
                        timeAgo: new Date(p.createdAt).toLocaleDateString(),
                        imageUrl: p.imageUrl,
                        videoLink: p.videoLink,
                        userId: p.userId
                    }))}
                    onClose={() => setShowClipsFeed(false)}
                />
            </Modal>



            <DocumentViewer
                visible={docViewerVisible}
                onClose={() => {
                    setDocViewerVisible(false);
                    setSelectedDoc(null);
                }}
                documentUrl={selectedDoc?.fileUrl || ''}
                documentName={selectedDoc?.title || 'Document'}
                documentType={selectedDoc?.type || 'pdf'}
            />

            <ProfileOptionsModal
                visible={showProfileOptions}
                onClose={() => setShowProfileOptions(false)}
                options={[
                    ...(role === 'creator' ? [
                        connectionStatus.isFriend ? {
                            label: 'Message',
                            subtitle: 'Start a conversation',
                            icon: 'chatbubble-ellipses-outline' as const,
                            onPress: async () => {
                                // Close modal first
                                setShowProfileOptions(false);

                                if (!authUser || !targetUserId) return;
                                try {
                                    const { getOrCreateConversation } = await import('../src/services/chatService');
                                    const conversationId = await getOrCreateConversation(
                                        authUser.uid,
                                        targetUserId,
                                        {
                                            name: displayName,
                                            photoURL: photoURL,
                                            email: ''
                                        }
                                    );
                                    router.push({
                                        pathname: '/chat-screen',
                                        params: {
                                            conversationId,
                                            otherUserId: targetUserId,
                                            otherUserName: displayName,
                                            otherUserPhoto: photoURL || ''
                                        }
                                    });
                                } catch (error) {
                                    console.error('Error starting chat:', error);
                                    Alert.alert('Error', 'Failed to start conversation');
                                }
                            }
                        } : {
                            label: connectionStatus.friendshipStatus === 'pending' ? 'Request Sent' : 'Network',
                            subtitle: connectionStatus.friendshipStatus === 'pending' ? 'Waiting for approval' : 'Add to your network',
                            icon: (connectionStatus.friendshipStatus === 'pending' ? 'time-outline' : 'people-outline') as any, // Changed icon for Network
                            onPress: connectionStatus.friendshipStatus === 'pending' ? () => { } : handleConnect
                        }
                    ] : []), // Only add connect/message option if creator (since hidden from main view)
                    {
                        label: 'Share Profile',
                        subtitle: 'Share with friends',
                        icon: 'share-social-outline' as const,
                        onPress: () => {
                            // Share.share({ ... }) // REPLACED
                            setShowShareSheet(true);
                        }
                    },
                    {
                        label: 'Report User',
                        subtitle: 'I\'m concerned about this user',
                        icon: 'flag-outline' as const,
                        onPress: () => Alert.alert('Report', 'User reported. We will review this profile.'),
                        isDestructive: true
                    },
                    {
                        label: 'Block User',
                        subtitle: 'They won\'t be able to contact you',
                        icon: 'ban-outline' as const,
                        onPress: () => Alert.alert('Block', `Are you sure you want to block ${displayName}?`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Block', style: 'destructive', onPress: () => Alert.alert('Blocked', 'User has been blocked.') }
                        ]),
                        isDestructive: true
                    }
                ]}
            />

            <ActionToast
                visible={toast.visible}
                message={toast.message}
                onHide={handleHideToast}
            />

            <ShareModal
                visible={showShareSheet}
                onClose={() => setShowShareSheet(false)}
                shareType="profile"
                shareData={{
                    id: targetUserId,
                    content: displayName || 'User'
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF', // YouTubes white background
    },
    // YouTube Header Styles
    headerContainer: {
        backgroundColor: '#FFF',
    },
    channelBanner: {
        height: 100, // Reduced banner height
        backgroundColor: '#E2E8F0',
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    bannerPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#94A3B8', // Placeholder grey
    },
    topBarOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 16,
        paddingTop: Platform.OS === 'android' ? 8 : 8,
    },
    iconButtonBlur: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfoContainer: {
        paddingHorizontal: 16, // Keep standard edge spacing
        paddingTop: 12,
        paddingBottom: 4,
        zIndex: 20, // Ensure it sits above banner for touches
    },
    ytAvatarContainer: {
        marginTop: -48, // Overlap banner slightly (half of 96)
        marginBottom: 12,
        alignItems: 'flex-start', // Left align
        // paddingLeft removed to align with parent container
    },
    ytAvatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 4,
        borderColor: '#FFF',
        backgroundColor: '#FFF',
    },
    ytName: {
        fontSize: 26,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
        textAlign: 'left', // Left align
        // paddingHorizontal removed
    },
    ytHandleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        // paddingHorizontal removed
        marginBottom: 16,
    },
    ytHandleText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    ytHandleSeparator: {
        marginHorizontal: 8,
        color: '#CBD5E1',
        fontSize: 14,
    },
    roleBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    roleBadgeText: {
        fontSize: 10,
        color: '#4F46E5',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    statDividerVertical: {
        width: 1,
        height: 32, // Taller divider
        backgroundColor: '#E2E8F0',
    },
    ytBioContainer: {
        marginTop: 0,
        // paddingHorizontal removed
        alignItems: 'flex-start', // Left align
        marginBottom: 8, // Reduced from 24
    },
    ytBioText: {
        fontSize: 15, // Improved readability
        color: '#334155',
        lineHeight: 24,
        textAlign: 'left', // Left align
    },
    ytLinkText: {
        color: '#4F46E5', // Color link
        fontWeight: '600',
        fontSize: 13,
    },
    ytActionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4, // Reduced from 8
        marginBottom: 24, // Reduced from 32
        paddingHorizontal: 0, // Removed extra padding
    },
    ytPrimaryButton: {
        backgroundColor: '#4F46E5',
        paddingVertical: 14, // Taller buttons
        paddingHorizontal: 20,
        borderRadius: 12,
        flex: 1,
        alignItems: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, // Stronger shadow
        shadowRadius: 10,
        elevation: 6,
        height: 52,
        justifyContent: 'center',
    },
    ytPrimaryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    ytSecondaryButton: {
        backgroundColor: '#FFF',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        flex: 1,
        alignItems: 'center',
        borderWidth: 1.5, // Thicker border
        borderColor: '#E2E8F0',
        height: 52,
        justifyContent: 'center',
    },
    ytSecondaryButtonText: {
        color: '#334155',
        fontSize: 16,
        fontWeight: '700',
    },
    // YouTube Tabs
    // Pill Tabs
    ytTabsContainer: {
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        flexDirection: 'row',
    },
    ytTabsContent: {
        paddingHorizontal: 0,
        paddingVertical: 0,
        flexGrow: 1,
    },
    ytTab: {
        // flex: 1, // Removed to allow scrolling
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16, // Increased height
        paddingHorizontal: 20, // Horizontal padding for scroll
        marginRight: 0,
        backgroundColor: 'transparent',
        borderRadius: 0,
    },
    ytTabActive: {
        borderBottomWidth: 3, // Thicker indicator
        borderBottomColor: '#0F172A',
        backgroundColor: 'transparent',
    },
    ytTabText: {
        fontSize: 16, // Increased font size
        fontWeight: '600',
        color: '#64748B',
    },
    ytTabTextActive: {
        color: '#0F172A',
    },
    contentSection: {
        flex: 1,
        // minHeight removed to prevent whitespace
        marginTop: 0,
    },
    postsGrid: {
        flex: 1,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    postCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginVertical: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    /* Grid Styles */
    gridItem: {
        width: '33.33%',
        aspectRatio: 1,
        marginBottom: 1,
        position: 'relative',
        backgroundColor: '#f1f5f9',
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    gridPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#cbd5e1',
        padding: 4,
    },
    gridTextPreview: {
        fontSize: 10,
        color: '#475569',
        textAlign: 'center',
        marginTop: 4,
    },
    postType: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    postContent: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 8,
    },
    /* Added Styles for Post Card and Modals */
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 8,
    },
    userInfo: {
        marginLeft: 8,
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    tagsContainer: {
        flexDirection: 'row',
        marginTop: 8,
        flexWrap: 'wrap',
    },
    tag: {
        marginRight: 6,
        marginTop: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 6,
    },
    tagText: {
        fontSize: 12,
        color: '#4F46E5',
        fontWeight: '500',
    },
    postFooter: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    footerText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#64748B',
    },
    imageFallback: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    fullImage: {
        width: '100%',
        height: '80%',
    },
    postImage: {
        width: '100%',
        height: 300,
    },
    postText: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 20,
    },
    videoContainer: {
        width: '100%',
        height: 200,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoText: {
        marginTop: 8,
        color: '#64748B',
        fontSize: 14,
    },
    gridIconOverlay: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 4,
        padding: 2,
    },
    // Button Styles
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 24, // Pill shape
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    primaryButton: {
        backgroundColor: '#6366F1', // Indigo/Professional Blue
        flex: 1,
        marginRight: 10,
    },
    followingButton: {
        backgroundColor: '#334155', // Slate 700 for 'Subscribed' state (dark mode friendly)
        borderWidth: 1,
        borderColor: '#475569',
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    primaryButtonText: {
        color: '#FFFFFF',
    },
    followingButtonText: {
        color: '#E2E8F0', // Lighter text for dark button
    },



    // Missing Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    closeButton: {
        padding: 4,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
    },

    // Video List Item Styles
    videoListItem: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 12,
        backgroundColor: '#FFF',
    },
    videoListThumbnailContainer: {
        width: 140, // Fixed width for Thumbnail
        aspectRatio: 16 / 9,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#F1F5F9', // Placeholder color
    },
    videoListThumbnail: {
        width: '100%',
        height: '100%',
    },
    videoDurationBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    videoDurationText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '600',
    },
    videoListDetails: {
        flex: 1,
        paddingVertical: 4,
    },
    videoListTitle: {
        fontSize: 14,
        fontWeight: '500', // Semi-bold for title
        color: '#0F172A',
        lineHeight: 20,
        marginBottom: 4,
    },
    videoListMeta: {
        fontSize: 12,
        color: '#64748B',
    },

    // Clips Grid Styles
    clipsGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 2,
        gap: 2,
    },
    clipCardItem: {
        width: '32.5%',
        aspectRatio: 9 / 16,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 2,
    },
    clipThumbnail: {
        width: '100%',
        height: '100%',
    },
    clipGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 200,
        justifyContent: 'flex-end',
        padding: 10,
    },
    clipContent: {
        width: '100%',
    },
    clipTitle: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '700',
        lineHeight: 15,
        marginBottom: 5,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    clipMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    clipAuthor: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    clipAvatar: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        overflow: 'hidden',
    },
    clipAuthorName: {
        color: '#E2E8F0',
        fontSize: 10,
        fontWeight: '600',
        marginLeft: 5,
        flex: 1,
    },
    clipStats: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    clipViewsText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '600',
        marginLeft: 3,
    },

    // Other Missing Styles
    notificationBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    notificationBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        marginTop: 16,
        paddingHorizontal: 16,
        gap: 12,
        width: '100%',
    },
    subFilterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        backgroundColor: '#FFF',
    },
    subFilterChip: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    subFilterText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    emptyPostsState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginTop: 12,
    },
    homeSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 24,
        marginBottom: 12,
    },
    homeSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4F46E5',
    },
    horizontalList: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
});

export default ProfileScreen;
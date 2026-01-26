import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    AppState,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { getUserProfile } from '../../src/services/authService';
import { addToHistory } from '../../src/services/historyService';
import { addComment, Comment, getAllPosts, getComments, getPostById, incrementViewCount, likeComment, Post, unlikeComment } from '../../src/services/postsService';

const { width, height } = Dimensions.get('window');

const VideoPlayerScreen = () => {
    const isFocused = useIsFocused();
    const [appStateVisible, setAppStateVisible] = useState(AppState.currentState);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            setAppStateVisible(nextAppState);
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, isDark } = useTheme();
    const { user, userProfile } = useAuth();

    // Parse params (some might be strings that need parsing if passed as objects, but usually simple types work directly)
    const videoUri = params.videoUri as string;
    const postId = params.postId as string;
    const initialTitle = params.title as string;
    const initialDescription = params.description as string;
    const authorName = params.authorName as string;
    const authorImage = params.authorImage as string;
    const authorId = params.authorId as string;
    const likes = params.likes ? parseInt(params.likes as string) : 0;

    const [viewCount, setViewCount] = useState(params.views ? parseInt(params.views as string) : 0);
    const date = params.date as string;
    const thumbnail = params.thumbnail as string;

    // expo-video Player Setup
    const player = useVideoPlayer(videoUri, player => {
        player.loop = false;
    });

    // Lifecycle Management for Playback
    useEffect(() => {
        if (isFocused && appStateVisible === 'active') {
            player.play();
        } else {
            player.pause();
        }
    }, [isFocused, appStateVisible, player]);

    // console.log('VideoPlayerScreen Params:', { videoUri, postId, initialTitle });

    // const [loadingVideo, setLoadingVideo] = useState(true); // Handled by expo-video internal UI or can be added back with listeners
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [relatedVideos, setRelatedVideos] = useState<Post[]>([]);
    const [loadingRelated, setLoadingRelated] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [showDescription, setShowDescription] = useState(false);
    const [subscriberCount, setSubscriberCount] = useState(0);
    const [realCommentCount, setRealCommentCount] = useState(0);

    // Comments State
    const [commentsVisible, setCommentsVisible] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

    useEffect(() => {
        loadRelatedContent();
        fetchComments();

        // Track view and add to history
        if (postId) {
            incrementViewCount(postId).catch(err => console.log('View tracking failed:', err));

            // Add to history
            addToHistory({
                id: postId,
                type: 'video',
                title: initialTitle || 'Untitled Video',
                subtitle: authorName || 'Unknown Creator',
                image: thumbnail || authorImage, // Best effort thumbnail
                url: videoUri
            }).catch((err: any) => console.error('Failed to add video to history:', err));
        }
    }, [postId]);

    const loadRelatedContent = async () => {
        try {
            const allPosts = await getAllPosts();
            // Filter: Video type + Not the current video + (Optional: same author or purely random)
            const filtered = allPosts
                .filter(p => p.type === 'video' && p.id !== postId)
                .slice(0, 10); // Take 10 related videos
            setRelatedVideos(filtered);
        } catch (error) {
            console.error('Error loading related videos:', error);
        } finally {
            setLoadingRelated(false);
        }
    };

    const fetchComments = async () => {
        if (!postId) return;
        try {
            setLoadingComments(true);
            const fetchedComments = await getComments(postId);
            setComments(fetchedComments);
            setRealCommentCount(fetchedComments.length);
        } catch (error) {
            console.error("Failed to load comments", error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim() || !user || !postId) return;

        try {
            setSubmittingComment(true);
            const commentText = newComment.trim();
            // Optimistic Update
            const tempId = Date.now().toString();
            const tempComment: Comment = {
                id: tempId,
                postId,
                userId: user.uid,
                userName: userProfile?.name || user.displayName || 'User',
                userPhoto: userProfile?.profilePhoto || user.photoURL || undefined,
                text: commentText,
                likes: 0,
                likedBy: [],
                parentId: replyingTo ? replyingTo.id : null,
                createdAt: new Date()
            };

            setComments(prev => [tempComment, ...prev]);
            setNewComment('');
            setReplyingTo(null); // Reset reply state
            setRealCommentCount(prev => prev + 1);

            // API Call
            await addComment(postId, user.uid, tempComment.userName, tempComment.userPhoto, commentText, tempComment.parentId);

            // Refresh
            fetchComments();

        } catch (error) {
            console.error("Error posting comment:", error);
            Alert.alert("Error", "Failed to post comment. Please try again.");
            fetchComments();
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleLikeComment = async (comment: Comment) => {
        if (!user || !postId) return;

        const isLiked = comment.likedBy?.includes(user.uid);
        const newLikes = (comment.likes || 0) + (isLiked ? -1 : 1);
        const newLikedBy = isLiked
            ? comment.likedBy?.filter(id => id !== user.uid)
            : [...(comment.likedBy || []), user.uid];

        // Optimistic update
        setComments(comments.map(c =>
            c.id === comment.id
                ? { ...c, likes: newLikes, likedBy: newLikedBy }
                : c
        ));

        try {
            if (isLiked) {
                await unlikeComment(postId, comment.id, user.uid);
            } else {
                await likeComment(postId, comment.id, user.uid);
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            fetchComments(); // Revert on error
        }
    };

    const handleReply = (comment: Comment) => {
        setReplyingTo(comment);
        // Focus input usually handled automatically by conditional rendering or a ref
    };

    const renderCommentItem = (item: Comment, isReply = false) => {
        const isLiked = user && item.likedBy?.includes(user?.uid || '');
        return (
            <View style={[styles.commentItem, isReply && styles.replyItem]} key={item.id}>
                {item.userPhoto ? (
                    <Image source={{ uri: item.userPhoto }} style={[styles.commentAvatar, isReply && styles.replyAvatar]} />
                ) : (
                    <View style={[styles.commentAvatar, isReply && styles.replyAvatar, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>{item.userName?.charAt(0) || 'U'}</Text>
                    </View>
                )}
                <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                        <Text style={[styles.commentUser, { color: colors.textSecondary }]}>
                            @{item.userName?.replace(/\s/g, '').toLowerCase() || 'user'} • 2h
                        </Text>
                    </View>
                    <Text style={[styles.commentBody, { color: colors.text }]}>{item.text}</Text>

                    <View style={styles.commentActions}>
                        <TouchableOpacity style={styles.commentAction} onPress={() => handleLikeComment(item)}>
                            <Ionicons name={isLiked ? "thumbs-up" : "thumbs-up-outline"} size={14} color={isLiked ? colors.primary : colors.textSecondary} />
                            <Text style={[styles.commentActionText, { color: isLiked ? colors.primary : colors.textSecondary }]}>
                                {item.likes || 0}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.commentAction}>
                            <Ionicons name="thumbs-down-outline" size={14} color={colors.textSecondary} />
                        </TouchableOpacity>

                        {!isReply && (
                            <TouchableOpacity
                                style={styles.commentAction}
                                onPress={() => handleReply(item)}
                            >
                                <Text style={[styles.commentActionText, { color: colors.textSecondary }]}>Reply</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <TouchableOpacity style={{ padding: 4 }}>
                    <Ionicons name="ellipsis-vertical" size={12} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>
        );
    };

    // organize comments into threads
    const rootComments = comments.filter(c => !c.parentId);
    const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

    // Video Controls for Modal
    const togglePlayPause = () => {
        if (player.playing) {
            player.pause();
        } else {
            player.play();
        }
    };

    const seekBy = (seconds: number) => {
        player.currentTime += seconds;
    };

    // Fetch author stats and latest post data
    useEffect(() => {
        const fetchStats = async () => {
            if (authorId) {
                const profile = await getUserProfile(authorId);
                if (profile) {
                    const count = profile.networkStats?.followersCount || profile.followers?.length || 0;
                    setSubscriberCount(count);
                }
            }
            // Fetch fresh post data (comments, likes, views if available)
            if (postId) {
                const freshPost = await getPostById(postId);
                if (freshPost) {
                    setRealCommentCount(freshPost.comments || 0);
                    if (freshPost.viewCount !== undefined) {
                        setViewCount(freshPost.viewCount);
                    }
                    // Optionally update likes too if we want fresher data
                    // setLikes(freshPost.likes); // We assume passed params are OK, but this is better
                }
            }
        };
        fetchStats();
    }, [authorId, postId]);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this video: ${initialTitle} on Vidhyardi!`,
                url: videoUri, // iOS only
            });
        } catch (error) {
            console.error(error);
        }
    };

    const formatViews = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            {/* 1. Video Player Container - Sticky/Top */}
            <View style={styles.playerContainer}>
                <View style={styles.videoWrapper}>
                    {videoUri && !errorMsg ? (
                        <>
                            <VideoView
                                player={player}
                                style={styles.video}
                                contentFit="contain"
                                allowsFullscreen
                                allowsPictureInPicture
                            />

                        </>
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                            <Ionicons name="alert-circle" size={48} color="#EF4444" />
                            <Text style={{ color: '#FFF', marginTop: 12, textAlign: 'center' }}>
                                {errorMsg || 'Video unavailable'}
                            </Text>
                            {videoUri && (
                                <TouchableOpacity
                                    style={{ marginTop: 20, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
                                    onPress={() => Linking.openURL(videoUri)}
                                >
                                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Open in Browser</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
                {/* Back Button Overlay */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-down" size={32} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>

                {/* 2. Video Info Section */}
                <View style={styles.infoSection}>
                    <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={showDescription ? undefined : 2}>
                        {initialTitle || "Untitled Video"}
                    </Text>

                    <View style={styles.metaRow}>
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {formatViews(viewCount)} views • {date || 'Recently'}
                        </Text>
                        <TouchableOpacity onPress={() => setShowDescription(!showDescription)}>
                            <Text style={[styles.moreText, { color: colors.textSecondary }]}>
                                {showDescription ? '...less' : '...more'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Collapsible Description */}
                    {showDescription && (
                        <View style={[styles.descriptionBox, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                            <Text style={[styles.descriptionText, { color: colors.text }]}>
                                {initialDescription || "No description provided."}
                            </Text>
                        </View>
                    )}
                </View>

                {/* 3. Action Bar */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.actionBar}
                >
                    <TouchableOpacity
                        style={[styles.actionPill, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                        onPress={() => setIsLiked(!isLiked)}
                    >
                        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? "#EF4444" : colors.text} />
                        <Text style={[styles.actionText, { color: colors.text }]}>
                            {isLiked ? (likes + 1) : likes}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionPill, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                        onPress={handleShare}
                    >
                        <Ionicons name="share-social-outline" size={20} color={colors.text} />
                        <Text style={[styles.actionText, { color: colors.text }]}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionPill, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                        onPress={() => Alert.alert('Saved', 'Video saved to your playlist.')}
                    >
                        <Ionicons name="bookmark-outline" size={20} color={colors.text} />
                        <Text style={[styles.actionText, { color: colors.text }]}>Save</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionPill, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                    >
                        <Ionicons name="flag-outline" size={20} color={colors.text} />
                        <Text style={[styles.actionText, { color: colors.text }]}>Report</Text>
                    </TouchableOpacity>
                </ScrollView>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* 4. Channel Info */}
                <View style={styles.channelSection}>
                    <View style={styles.channelRow}>
                        <TouchableOpacity
                            style={styles.channelInfo}
                            onPress={() => {
                                if (authorId) router.push({ pathname: '/public-profile', params: { userId: authorId } });
                            }}
                        >
                            {authorImage ? (
                                <Image source={{ uri: authorImage }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{authorName?.[0] || 'U'}</Text>
                                </View>
                            )}
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text style={[styles.channelName, { color: colors.text }]} numberOfLines={1}>
                                    {authorName || 'Unknown Creator'}
                                </Text>
                                <Text style={[styles.subscriberCount, { color: colors.textSecondary }]}>
                                    {formatViews(subscriberCount)} subscribers
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.subscribeButton, { backgroundColor: isSubscribed ? (isDark ? '#334155' : '#E2E8F0') : colors.text }]}
                            onPress={() => {
                                const newState = !isSubscribed;
                                setIsSubscribed(newState);
                                if (newState) {
                                    Alert.alert('Subscribed', `You have subscribed to ${authorName || 'this channel'}.`);
                                }
                            }}
                        >
                            <Text style={[styles.subscribeText, { color: isSubscribed ? colors.text : colors.background }]}>
                                {isSubscribed ? 'Subscribed' : 'Subscribe'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* 5. Comments Teaser */}
                <TouchableOpacity
                    style={[styles.commentsTeaser, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}
                    onPress={() => setCommentsVisible(true)}
                >
                    <View style={styles.commentsHeader}>
                        <Text style={[styles.commentsTitle, { color: colors.text }]}>Comments</Text>
                        <Text style={[styles.commentsCount, { color: colors.textSecondary }]}>{realCommentCount}</Text>
                    </View>
                    <View style={styles.commentPreview}>
                        {comments.length > 0 ? (
                            <>
                                {comments[0].userPhoto ? (
                                    <Image source={{ uri: comments[0].userPhoto }} style={styles.miniAvatar} />
                                ) : (
                                    <View style={[styles.miniAvatar, { backgroundColor: '#64748B' }]} />
                                )}
                                <Text style={[styles.commentText, { color: colors.text }]} numberOfLines={1}>
                                    {comments[0].text}
                                </Text>
                            </>
                        ) : (
                            <Text style={[styles.commentText, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                                Add a comment...
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>

                {/* 6. Up Next / Related Videos */}
                <View style={styles.relatedSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Up Next</Text>

                    {loadingRelated ? (
                        <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
                    ) : (
                        relatedVideos.map((item) => (
                            <Pressable
                                key={item.id}
                                style={styles.relatedItem}
                                onPress={() => {
                                    // Push new video params onto stack (or replace)
                                    // Using push to allow back navigation
                                    router.replace({
                                        pathname: '/screens/video-player',
                                        params: {
                                            videoUri: item.videoLink,
                                            postId: item.id,
                                            title: item.content, // Using content as title fallback
                                            description: item.content,
                                            authorName: item.userName,
                                            authorImage: item.userProfilePhoto,
                                            authorId: item.userId,
                                            likes: item.likes,
                                            views: item.viewCount || 0,
                                            date: new Date(item.createdAt).toLocaleDateString(),
                                            thumbnail: item.thumbnailUrl || item.imageUrl
                                        }
                                    });
                                }}
                            >
                                {/* Thumbnail */}
                                <View style={styles.relatedThumbnailContainer}>
                                    {(item.thumbnailUrl || item.imageUrl) ? (
                                        <Image source={{ uri: item.thumbnailUrl || item.imageUrl }} style={styles.relatedThumbnail} resizeMode="cover" />
                                    ) : (
                                        <LinearGradient
                                            colors={['#1F2937', '#000']}
                                            style={styles.relatedThumbnail}
                                        >
                                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                                <Ionicons name="play-circle" size={32} color="#FFF" />
                                            </View>
                                        </LinearGradient>
                                    )}
                                    <View style={styles.durationBadge}>
                                        <Text style={styles.durationText}>5:20</Text>
                                    </View>
                                </View>

                                {/* details */}
                                <View style={styles.relatedDetails}>
                                    <Text style={[styles.relatedTitle, { color: colors.text }]} numberOfLines={2}>
                                        {item.content || 'Untitled Video'}
                                    </Text>
                                    <Text style={[styles.relatedMeta, { color: colors.textSecondary }]}>
                                        {item.userName}
                                    </Text>
                                    <Text style={[styles.relatedMeta, { color: colors.textSecondary }]}>
                                        {item.likes} likes • {item.viewCount || 0} views
                                    </Text>
                                </View>
                            </Pressable>
                        ))
                    )}
                </View>

                {/* Bottom Spacing */}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* REPLACE MODAL WITH ABSOLUTE VIEW */}
            {commentsVisible && (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={[styles.commentsOverlay, { backgroundColor: isDark ? '#0F172A' : '#FFF' }]}
                >
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <View style={styles.dragHandle} />
                        <View style={styles.headerRow}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Comments</Text>
                            <Text style={[styles.modalCount, { color: colors.textSecondary }]}>{realCommentCount}</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => {
                                    setCommentsVisible(false);
                                    setReplyingTo(null);
                                }}
                            >
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Comments List */}
                    {loadingComments ? (
                        <View style={styles.centered}>
                            <ActivityIndicator color={colors.primary} size="large" />
                        </View>
                    ) : (
                        <FlatList
                            data={rootComments}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <View>
                                    {renderCommentItem(item)}
                                    {/* Render Replies */}
                                    {getReplies(item.id).map(reply => (
                                        renderCommentItem(reply, true)
                                    ))}
                                </View>
                            )}
                            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                            ListEmptyComponent={
                                <View style={styles.emptyComments}>
                                    <Ionicons name="chatbubble-outline" size={48} color={colors.border} />
                                    <Text style={{ color: colors.textSecondary, marginTop: 12 }}>No comments yet. Be the first!</Text>
                                </View>
                            }
                        />
                    )}

                    {/* Input Area */}
                    <View style={[styles.inputContainer, { borderTopColor: colors.border, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                        {replyingTo && (
                            <View style={styles.replyingBanner}>
                                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                                    Replying to <Text style={{ fontWeight: 'bold' }}>@{replyingTo.userName}</Text>
                                </Text>
                                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                                    <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                            {userProfile?.profilePhoto ? (
                                <Image source={{ uri: userProfile.profilePhoto }} style={styles.inputAvatar} />
                            ) : (
                                <View style={[styles.inputAvatar, { backgroundColor: colors.primary }]} />
                            )}
                            <TextInput
                                style={[styles.input, { color: colors.text, backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}
                                placeholder={replyingTo ? "Add a reply..." : "Add a comment..."}
                                placeholderTextColor={colors.textSecondary}
                                value={newComment}
                                onChangeText={setNewComment}
                                multiline
                            />
                            <TouchableOpacity
                                disabled={!newComment.trim() || submittingComment}
                                onPress={handlePostComment}
                                style={[styles.sendButton, { opacity: !newComment.trim() ? 0.5 : 1 }]}
                            >
                                <Ionicons name="send" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            )}
        </SafeAreaView>
    );
};

// Updated Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    playerContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
    },
    videoWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 5,
    },
    backButton: {
        position: 'absolute',
        top: 10,
        left: 10,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 10,
    },
    contentScroll: {
        flex: 1,
    },
    infoSection: {
        padding: 16,
        paddingBottom: 8,
    },
    videoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        lineHeight: 24,
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    metaText: {
        fontSize: 12,
    },
    moreText: {
        fontSize: 12,
        fontWeight: '600',
    },
    descriptionBox: {
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 20,
    },
    actionBar: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    actionPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 24,
        gap: 6,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: 4,
    },
    channelSection: {
        padding: 12,
        paddingHorizontal: 16,
    },
    channelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    channelInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    channelName: {
        fontSize: 15,
        fontWeight: '600',
    },
    subscriberCount: {
        fontSize: 12,
    },
    subscribeButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginLeft: 8,
    },
    subscribeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    commentsTeaser: {
        marginHorizontal: 16,
        marginVertical: 12,
        padding: 12,
        borderRadius: 12,
    },
    commentsHeader: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    commentsTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    commentsCount: {
        fontSize: 14,
    },
    commentPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    miniAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    commentText: {
        fontSize: 13,
        flex: 1,
    },
    relatedSection: {
        paddingTop: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 16,
        marginBottom: 12,
    },
    relatedItem: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        height: 90, // Fixed height specifically for 16:9 thumbnail
    },
    relatedThumbnailContainer: {
        width: 160,
        height: 90,
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 12,
        position: 'relative',
    },
    relatedThumbnail: {
        width: '100%',
        height: '100%',
    },
    durationBadge: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    durationText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '600',
    },
    relatedDetails: {
        flex: 1,
        justifyContent: 'flex-start',
        paddingTop: 4,
    },
    relatedTitle: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 18,
        marginBottom: 4,
    },
    relatedMeta: {
        fontSize: 12,
        lineHeight: 16,
    },
    // Modal Styles
    commentsOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%', // YouTube style partial height
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        elevation: 10,
        zIndex: 100,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    replyItem: {
        paddingLeft: 40,
        marginTop: -8, // Tighter grouping
    },
    replyAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    replyingBanner: {
        position: 'absolute',
        top: -30,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 6,
        paddingHorizontal: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalHeader: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(128,128,128,0.1)',
        alignItems: 'center',
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(128,128,128,0.3)',
        borderRadius: 2,
        marginBottom: 12,
    },
    headerRow: {
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalCount: {
        fontSize: 14,
        marginLeft: 6,
    },
    closeButton: {
        padding: 4,
        marginLeft: 'auto',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    commentAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 12,
    },
    commentContent: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    commentUser: {
        fontSize: 12,
        fontWeight: '500',
    },
    commentBody: {
        fontSize: 14,
        lineHeight: 20,
    },
    commentActions: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 20,
    },
    commentAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    commentActionText: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyComments: {
        alignItems: 'center',
        padding: 40,
    },
    inputContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 34 : 12,
        borderTopWidth: 1,
    },
    inputAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 12,
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: 14,
        maxHeight: 100,
    },
    sendButton: {
        marginLeft: 12,
        padding: 8,
    }
});

export default VideoPlayerScreen;

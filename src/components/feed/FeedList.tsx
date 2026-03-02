import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetInfo } from '@react-native-community/netinfo';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, DeviceEventEmitter, FlatList, NativeScrollEvent, NativeSyntheticEvent, RefreshControl, StyleProp, StyleSheet, Text, View, ViewStyle, ViewToken } from 'react-native';
import ShareModal from '../../components/ShareModal';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { shouldShowPost } from '../../services/hypeService';
import { addReaction, deletePost, getAllPosts, likePost, Post, ReactionType, removeReaction, savePost, unlikePost, unsavePost } from '../../services/postsService';
import CommentsBottomSheet from '../CommentsBottomSheet';
import OfflineState from '../OfflineState';
import FeedPost from './FeedPost';

interface FeedListProps {
    onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    contentContainerStyle?: StyleProp<ViewStyle>;
}

export interface FeedListRef {
    scrollToTop: () => void;
}

const FeedList = React.forwardRef<FeedListRef, FeedListProps>(({ onScroll, contentContainerStyle }, ref) => {
    const { colors } = useTheme();
    const { isConnected } = useNetInfo();
    const flatListRef = useRef<FlatList>(null);
    const [allPosts, setAllPosts] = useState<Post[]>([]);
    const [posts, setPosts] = useState<Post[]>([]); // Regular posts (not clips)
    const [clips, setClips] = useState<Post[]>([]); // Clips only
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [shareData, setShareData] = useState<any>(null);
    const [commentsModalVisible, setCommentsModalVisible] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string>('');
    const { user, userProfile, logout } = useAuth();

    // Track which posts are currently visible in viewport
    const [visiblePostIds, setVisiblePostIds] = useState<Set<string>>(new Set());
    // Track posts seen historically across sessions
    const [historicalSeenIds, setHistoricalSeenIds] = useState<Set<string>>(new Set());

    React.useImperativeHandle(ref, () => ({
        scrollToTop: () => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }
    }));

    const fetchPosts = async (isManualRefresh = false) => {
        try {
            // 1. Load seen posts first to use in scoring
            let currentSeenIds = new Set<string>();
            try {
                const seenStr = await AsyncStorage.getItem('seenPostIds');
                if (seenStr) {
                    currentSeenIds = new Set(JSON.parse(seenStr));
                    setHistoricalSeenIds(currentSeenIds);
                }
            } catch (e) {
                console.error("Error loading seen posts:", e);
            }

            const fetchedPosts = await getAllPosts(100);
            setAllPosts(fetchedPosts);

            // Get current user's role to access studentStatus
            const userStudentStatus = userProfile?.studentStatus;
            const userRole = userProfile?.role || 'student';
            const followingIds = userProfile?.following || [];

            // SMART HYPE ALGORITHM: Filter posts based on tier visibility
            const visiblePosts = fetchedPosts.filter(post =>
                shouldShowPost(post, userStudentStatus, userRole)
            );

            // Separate clips from regular posts (from visible posts only)
            const clipPosts = visiblePosts.filter(p => p.type === 'clip');
            // Filter out 'clip' AND 'video' from main feed (LinkedIn style text/image focus)
            const regularPosts = visiblePosts.filter(p => p.type !== 'clip' && p.type !== 'video');

            const now = new Date().getTime();

            const sortedPosts = regularPosts.sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
                const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
                const timeA = dateA.getTime();
                const timeB = dateB.getTime();

                // Dynamic Score
                // Score = Engagement (likes + comments) + Recency Weight + Random Factor
                // On refresh, random factor is HUGE to guarantee a shuffle. On initial load, it's smaller and recency matters more.
                const randomMultiplier = isManualRefresh ? 40 : 5;
                const recencyMultiplier = isManualRefresh ? 2 : 15;

                // Penalty: If a post has already been seen, its 'recency' power is reset so it isn't stuck at the top every load.
                const appliedRecencyMultiplierA = currentSeenIds.has(a.id) ? 1 : recencyMultiplier;
                const appliedRecencyMultiplierB = currentSeenIds.has(b.id) ? 1 : recencyMultiplier;

                const scoreA =
                    ((a.likes || 0) + (a.comments || 0)) * 2 +
                    (Math.max(0, 7 - (now - timeA) / (1000 * 60 * 60 * 24))) * appliedRecencyMultiplierA +
                    (Math.random() * randomMultiplier);

                const scoreB =
                    ((b.likes || 0) + (b.comments || 0)) * 2 +
                    (Math.max(0, 7 - (now - timeB) / (1000 * 60 * 60 * 24))) * appliedRecencyMultiplierB +
                    (Math.random() * randomMultiplier);

                return scoreB - scoreA;
            });

            // Set the posts directly
            setPosts(sortedPosts);

        } catch (error: any) {
            console.error('Error fetching posts:', error);
            if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
                console.warn('Feed permission error. Logging out.');
                await logout();
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    React.useEffect(() => {
        let mounted = true;

        fetchPosts().then(() => {
            if (mounted && flatListRef.current && posts.length > 0) {
                // Initial load complete
            }
        });

        return () => {
            mounted = false;
        };
    }, []);

    const onRefresh = useCallback(() => {
        if (isConnected === false) {
            DeviceEventEmitter.emit('SHOW_TOAST', { message: "Could not refresh. Check internet.", isOffline: true });
            return;
        }
        setRefreshing(true);
        fetchPosts(true);
    }, [isConnected]);

    const handleLike = async (postId: string) => {
        if (!user) return;

        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;

        const post = posts[postIndex];
        const isLiked = post.likedBy?.includes(user.uid);

        if (isLiked) {
            await unlikePost(postId, user.uid);
            const updatedPosts = [...posts];
            updatedPosts[postIndex] = {
                ...post,
                likes: post.likes - 1,
                likedBy: post.likedBy.filter(id => id !== user.uid)
            };
            setPosts(updatedPosts);
        } else {
            await likePost(postId, user.uid);
            const updatedPosts = [...posts];
            updatedPosts[postIndex] = {
                ...post,
                likes: post.likes + 1,
                likedBy: [...(post.likedBy || []), user.uid]
            };
            setPosts(updatedPosts);
        }
    };

    const handleReaction = async (postId: string, reactionType: ReactionType) => {
        if (!user) return;

        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;

        const post = posts[postIndex];
        const previousReaction = post.reactedBy?.[user.uid];
        const previousReactions = post.reactions || {
            like: 0, celebrate: 0, support: 0, insightful: 0, love: 0, funny: 0, hype: 0
        };

        let newReactions = { ...previousReactions };
        let newReactedBy = { ...(post.reactedBy || {}) };

        // Optimistic Update Logic
        if (previousReaction === reactionType) {
            // Remove reaction
            newReactions[reactionType] = Math.max(0, (newReactions[reactionType] || 0) - 1);
            delete newReactedBy[user.uid];
        } else {
            // Add or Change reaction
            if (previousReaction) {
                // Decrement old reaction
                newReactions[previousReaction] = Math.max(0, (newReactions[previousReaction] || 0) - 1);
            }
            // Increment new reaction
            newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
            newReactedBy[user.uid] = reactionType;
        }

        const updatedPosts = [...posts];
        updatedPosts[postIndex] = {
            ...post,
            reactions: newReactions,
            reactedBy: newReactedBy,
            // Sync legacy likes if reaction is 'like'
            likes: reactionType === 'like' ? (
                previousReaction === 'like' ? post.likes - 1 : (previousReaction ? post.likes : post.likes + 1)
            ) : post.likes,
            likedBy: reactionType === 'like' ? (
                previousReaction === 'like' ? (post.likedBy || []).filter(id => id !== user.uid) : [...(post.likedBy || []), user.uid]
            ) : (post.likedBy || [])
        };
        setPosts(updatedPosts);

        try {
            if (previousReaction === reactionType) {
                await removeReaction(postId, user.uid);
            } else {
                await addReaction(postId, user.uid, reactionType);
            }
        } catch (error) {
            console.error('Error handling reaction:', error);
            // Revert optimistic update on error
            const revertedPosts = [...posts];
            revertedPosts[postIndex] = post;
            setPosts(revertedPosts);
        }
    };

    const handleComment = (postId: string) => {
        setSelectedPostId(postId);
        setCommentsModalVisible(true);
    };

    const handleDelete = async (postId: string) => {
        if (!user?.uid) return;

        try {
            await deletePost(postId, user.uid);
            Alert.alert('Success', 'Post deleted successfully');
            // Refresh feed
            await fetchPosts();
        } catch (error: any) {
            console.error('Error deleting post:', error);
            Alert.alert('Error', error.message || 'Failed to delete post');
        }
    };

    const handleEdit = (postId: string) => {
        // Navigate to edit screen (to be implemented)
        Alert.alert('Edit Post', 'Edit functionality coming soon!');
    };

    const handleShare = async (postId: string) => {
        try {
            const post = posts.find(p => p.id === postId);
            if (!post) return;

            setShareData(post);
            setShareModalVisible(true);
        } catch (error) {
            console.error('Error sharing post:', error);
            Alert.alert('Error', 'Failed to share post');
        }
    };

    const handleSave = async (postId: string) => {
        if (!user) return;

        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;

        const post = posts[postIndex];
        const isSaved = post.savedBy?.includes(user.uid);

        if (isSaved) {
            await unsavePost(postId, user.uid);
            const updatedPosts = [...posts];
            updatedPosts[postIndex] = {
                ...post,
                savedBy: post.savedBy.filter(id => id !== user.uid)
            };
            setPosts(updatedPosts);
        } else {
            await savePost(postId, user.uid);
            const updatedPosts = [...posts];
            updatedPosts[postIndex] = {
                ...post,
                savedBy: [...(post.savedBy || []), user.uid]
            };
            setPosts(updatedPosts);
        }
    };



    // Viewability tracking for performance optimization
    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        const visibleIds = new Set(
            viewableItems
                .map(item => item.item?.id)
                .filter(id => id !== undefined)
        );
        setVisiblePostIds(visibleIds);

        // Update historical seen tracking
        setHistoricalSeenIds(prev => {
            let changed = false;
            const next = new Set(prev);
            viewableItems.forEach(item => {
                if (item.item?.id && !next.has(item.item.id)) {
                    next.add(item.item.id);
                    changed = true;
                }
            });

            if (changed) {
                // Limit to last 300 seen posts so storage doesn't bloat
                const arr = Array.from(next);
                const truncated = arr.length > 300 ? arr.slice(-300) : arr;

                // Fire and forget Async storage
                AsyncStorage.setItem('seenPostIds', JSON.stringify(truncated))
                    .catch(e => console.error("Error saving seen posts:", e));

                return new Set(truncated);
            }
            return prev;
        });

    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 100,
    }).current;

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#3F51B5" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: 'transparent' }]}>
            {isConnected === false && posts.length > 0 && (
                <View style={[styles.offlineBanner, { backgroundColor: '#EF4444' }]}>
                    <Text style={styles.offlineText}>Offline Mode</Text>
                </View>
            )}
            <FlatList
                ref={flatListRef}
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <>
                        <FeedPost
                            post={item}
                            currentUserId={user?.uid || ''}
                            currentUserLiked={item.likedBy?.includes(user?.uid || '')}
                            currentUserSaved={item.savedBy?.includes(user?.uid || '')}
                            currentUserReaction={item.reactedBy?.[user?.uid || '']}
                            onLike={handleLike}
                            onReact={handleReaction}
                            onComment={handleComment}
                            onShare={handleShare}
                            onSave={handleSave}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            isVisible={visiblePostIds.has(item.id)}
                        />

                    </>
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                        progressViewOffset={120}
                    />
                }
                onViewableItemsChanged={onViewableItemsChanged}
                onScroll={onScroll} // Pass scroll event up
                viewabilityConfig={viewabilityConfig}
                contentContainerStyle={[
                    posts.length === 0 ? styles.emptyContainer : styles.listContent,
                    contentContainerStyle // Append external styles (e.g. padding for header)
                ]}
                ListEmptyComponent={
                    isConnected === false ? (
                        <OfflineState onRetry={fetchPosts} />
                    ) : (
                        <View style={styles.emptyView}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No posts yet. Be the first to share!</Text>
                        </View>
                    )
                }
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                removeClippedSubviews={true}
            />

            {/* Share Modal */}
            <ShareModal
                visible={shareModalVisible}
                onClose={() => {
                    setShareModalVisible(false);
                    setShareData(null);
                }}
                shareType="post"
                shareData={shareData}
            />

            {/* Comments Bottom Sheet */}
            <CommentsBottomSheet
                visible={commentsModalVisible}
                postId={selectedPostId}
                onClose={() => {
                    setCommentsModalVisible(false);
                    setSelectedPostId('');
                }}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyView: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    offlineBanner: {
        paddingVertical: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    offlineText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFF',
    },
});

export default FeedList;
import { useNetInfo } from '@react-native-community/netinfo';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, NativeScrollEvent, NativeSyntheticEvent, RefreshControl, StyleProp, StyleSheet, Text, View, ViewStyle, ViewToken } from 'react-native';
import ShareModal from '../../components/ShareModal';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { shouldShowPost } from '../../services/hypeService';
import { addReaction, deletePost, getAllPosts, likePost, Post, ReactionType, removeReaction, savePost, unlikePost, unsavePost } from '../../services/postsService';
import CommentsBottomSheet from '../CommentsBottomSheet';
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

    React.useImperativeHandle(ref, () => ({
        scrollToTop: () => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }
    }));

    const fetchPosts = async () => {
        try {
            const fetchedPosts = await getAllPosts();
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

            // Shuffle helper
            const shuffle = (array: any[]) => {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
                return array;
            };

            // DYNAMIC FEED LOGIC: "Shuffled Priority Pool"
            // Goal: Top of feed should be high quality (My/Network/New/Popular) but DYNAMIC (Change order on refresh).
            const dynamicMix = (postsToMix: Post[]) => {
                const myUid = user?.uid;

                // 1. Create a "Priority Candidates" Pool
                // These are posts eligible to be at the very top.
                const priorityCandidates = new Map<string, Post>();

                // Helper to add to pool
                const addToPool = (p: Post) => priorityCandidates.set(p.id, p);

                // A. My Posts & Network Posts
                postsToMix.filter(p => p.userId === myUid || followingIds.includes(p.userId))
                    .forEach(addToPool);

                // B. Popular/Hyped Posts
                postsToMix.filter(p => (p.reactions?.hype || 0) > 0 || p.likes > 5)
                    .forEach(addToPool);

                // C. Top 10 Global Newest (to ensure fresh content is in the mix)
                [...postsToMix].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 10)
                    .forEach(addToPool);

                // 2. Select the HEAD (Top 4 Posts)
                // We take all priority candidates, SHUFFLE them, and pick the top 4.
                // This ensures the top 4 are always "Good" posts, but the order changes every refresh.
                const allCandidates = Array.from(priorityCandidates.values());
                const shuffledCandidates = shuffle([...allCandidates]);

                const HEAD_SIZE = 4;
                const headPosts = shuffledCandidates.slice(0, HEAD_SIZE);
                const headIds = new Set(headPosts.map(p => p.id));

                // 3. Select the TAIL (Everything else)
                // Everything not in the head is shuffled into the tail.
                const tailPosts = postsToMix.filter(p => !headIds.has(p.id));
                const shuffledTail = shuffle([...tailPosts]);

                console.log(`Feed Mix: Pool=${allCandidates.length}, Head=${headPosts.length}, Tail=${tailPosts.length}`);

                // Combine
                return [...headPosts, ...shuffledTail];
            };

            // V1: Clips removed - only regular posts
            setPosts(dynamicMix(regularPosts));

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

    useEffect(() => {
        fetchPosts();
    }, []);

    const onRefresh = useCallback(() => {
        if (isConnected === false) {
            Alert.alert("Offline", "You are currently offline. Cannot refresh feed.");
            return;
        }
        setRefreshing(true);
        fetchPosts();
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
            {isConnected === false && (
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
                    <View style={styles.emptyView}>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No posts yet. Be the first to share!</Text>
                    </View>
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
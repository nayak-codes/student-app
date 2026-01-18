
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Share, StyleSheet, Text, View, ViewToken } from 'react-native';
import ShareModal from '../../components/ShareModal';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { addReaction, deletePost, getAllPosts, likePost, Post, ReactionType, removeReaction, savePost, unlikePost, unsavePost } from '../../services/postsService';
import CommentsBottomSheet from '../CommentsBottomSheet';
import FeedPost from './FeedPost';
import ShortsGrid from './ShortsGrid';

const FeedList: React.FC = () => {
    const { colors } = useTheme();
    const [allPosts, setAllPosts] = useState<Post[]>([]);
    const [posts, setPosts] = useState<Post[]>([]); // Regular posts (not clips)
    const [clips, setClips] = useState<Post[]>([]); // Clips only
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [shareData, setShareData] = useState<any>(null);
    const [commentsModalVisible, setCommentsModalVisible] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string>('');
    const { user } = useAuth();

    // Track which posts are currently visible in viewport
    const [visiblePostIds, setVisiblePostIds] = useState<Set<string>>(new Set());


    const fetchPosts = async () => {
        try {
            const fetchedPosts = await getAllPosts();
            setAllPosts(fetchedPosts);

            // Separate clips from regular posts
            const clipPosts = fetchedPosts.filter(p => p.type === 'clip');
            const regularPosts = fetchedPosts.filter(p => p.type !== 'clip');

            setClips(clipPosts);
            setPosts(regularPosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchPosts();
    }, []);

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
        const currentUserReaction = post.reactedBy?.[user.uid];

        try {
            if (currentUserReaction === reactionType) {
                // Remove reaction if clicking same reaction
                await removeReaction(postId, user.uid);
            } else {
                // Add or change reaction
                await addReaction(postId, user.uid, reactionType);
            }

            // Refresh this specific post's data
            // In a real app, you'd update optimistically or fetch just this post
            fetchPosts();
        } catch (error) {
            console.error('Error handling reaction:', error);
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

            Alert.alert(
                'Share Post',
                'Choose how you want to share this post',
                [
                    {
                        text: 'Share to Friend',
                        onPress: () => {
                            setShareData(post);
                            setShareModalVisible(true);
                        },
                    },
                    {
                        text: 'Share Externally',
                        onPress: async () => {
                            const result = await Share.share({
                                message: `Check out this post by ${post.userName}!\n\n${post.content}`,
                            });

                            if (result.action === Share.sharedAction) {
                                console.log('Post shared successfully');
                            }
                        },
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                ],
                { cancelable: true }
            );
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
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
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
                        {/* Show shorts after 2nd post */}
                        {index === 1 && clips.length > 0 && (
                            <ShortsGrid shorts={clips.slice(0, 8)} />
                        )}
                    </>
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
                }
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                contentContainerStyle={posts.length === 0 ? styles.emptyContainer : styles.listContent}
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
};

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
});

export default FeedList;

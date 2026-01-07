
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { getAllPosts, likePost, Post, unlikePost } from '../../services/postsService';
import FeedPost from './FeedPost';

const FeedList: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();

    const fetchPosts = async () => {
        try {
            const fetchedPosts = await getAllPosts();
            setPosts(fetchedPosts);
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

        // Optimistic update handled in FeedPost mainly, but if we need to sync state here:
        // We can rely on the FeedPost internal state for immediate feedback
        // and just fire the API call here.

        // However, to keep global state consistent if we reload, we should update the valid post in our list
        // This is a bit complex for a simple feed, so for now we'll just fire the API call.
        // The FeedPost component handles the UI toggle locally.

        // Ideally, we should check if currently liked, but FeedPost passes us the event.
        // A better approach is to pass the current "liked" state from FeedPost or check it here.
        // For simplicity: we assume the UI component toggles correctly.
        // We need to know if we are liking or unliking. 
        // Let's change FeedPost slightly? No, FeedPost just says "onLike".
        // We can find the post and toggle.

        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;

        const post = posts[postIndex];
        const isLiked = post.likedBy?.includes(user.uid);

        if (isLiked) {
            await unlikePost(postId, user.uid);
            // Update local state
            const updatedPosts = [...posts];
            updatedPosts[postIndex] = {
                ...post,
                likes: post.likes - 1,
                likedBy: post.likedBy.filter(id => id !== user.uid)
            };
            setPosts(updatedPosts);
        } else {
            await likePost(postId, user.uid);
            // Update local state
            const updatedPosts = [...posts];
            updatedPosts[postIndex] = {
                ...post,
                likes: post.likes + 1,
                likedBy: [...(post.likedBy || []), user.uid]
            };
            setPosts(updatedPosts);
        }
    };

    const handleComment = (postId: string) => {
        console.log('Open comments for', postId);
        // Navigate to comments screen or open modal
    };

    const handleShare = (postId: string) => {
        console.log('Share post', postId);
        // Open share sheet
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#3F51B5" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <FeedPost
                        post={item}
                        currentUserLiked={item.likedBy?.includes(user?.uid || '')}
                        onLike={handleLike}
                        onComment={handleComment}
                        onShare={handleShare}
                    />
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3F51B5']} />
                }
                contentContainerStyle={posts.length === 0 ? styles.emptyContainer : styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyView}>
                        <Text style={styles.emptyText}>No posts yet. Be the first to share!</Text>
                    </View>
                }
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

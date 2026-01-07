
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Post } from '../../services/postsService';

interface FeedPostProps {
    post: Post;
    onLike: (postId: string) => void;
    onComment: (postId: string) => void;
    onShare: (postId: string) => void;
    currentUserLiked: boolean;
}

const FeedPost: React.FC<FeedPostProps> = ({ post, onLike, onComment, onShare, currentUserLiked }) => {
    const [aspectRatio, setAspectRatio] = useState(1);
    const [liked, setLiked] = useState(currentUserLiked);
    const [likeCount, setLikeCount] = useState(post.likes);

    React.useEffect(() => {
        if (post.imageUrl) {
            Image.getSize(post.imageUrl, (width, height) => {
                setAspectRatio(width / height);
            }, (err) => {
                console.log('Error getting image size:', err);
            });
        }
    }, [post.imageUrl]);

    const handleLike = () => {
        const newLikedState = !liked;
        setLiked(newLikedState);
        setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
        onLike(post.id);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    {/* Placeholder Avatar - in real app, use user profile image */}
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{post.userName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View>
                        <Text style={styles.userName}>{post.userName}</Text>
                        <Text style={styles.userExam}>{post.userExam}</Text>
                    </View>
                </View>
                <TouchableOpacity>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
                </TouchableOpacity>
            </View>

            {/* Content Media - Image/Video */}
            <View style={styles.content}>
                {post.imageUrl ? (
                    <Image
                        source={{ uri: post.imageUrl }}
                        style={[styles.postImage, { aspectRatio }]}
                        resizeMode="cover"
                    />
                ) : null}

                {/* Video Placeholder */}
                {post.type === 'video' && !post.imageUrl && (
                    <View style={styles.videoPlaceholder}>
                        <Ionicons name="play-circle-outline" size={64} color="#fff" />
                        <Text style={{ color: 'white', marginTop: 8 }}>Video Content</Text>
                    </View>
                )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <View style={styles.actionLeft}>
                    <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
                        <Ionicons
                            name={liked ? "heart" : "heart-outline"}
                            size={28}
                            color={liked ? "#ff3b30" : "#333"}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onComment(post.id)} style={styles.actionButton}>
                        <Ionicons name="chatbubble-outline" size={26} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onShare(post.id)} style={styles.actionButton}>
                        <Ionicons name="paper-plane-outline" size={26} color="#333" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity>
                    <Ionicons name="bookmark-outline" size={26} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Footer: Likes, Caption, Time */}
            <View style={styles.footer}>
                <Text style={styles.likes}>{likeCount} likes</Text>

                {/* Caption */}
                {post.content ? (
                    <View style={styles.captionContainer}>
                        <Text style={styles.captionText}>
                            <Text style={styles.captionUsername}>{post.userName} </Text>
                            {post.content}
                        </Text>
                    </View>
                ) : null}

                <Text style={styles.timeAgo}>
                    {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'Just now'}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#efefef', // Subtle separator
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14, // Standard spacing
        paddingVertical: 10,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#3F51B5', // Primary color
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    userName: {
        fontWeight: '700',
        fontSize: 14,
        color: '#262626',
    },
    userExam: {
        fontSize: 12,
        color: '#666',
    },
    content: {
        marginBottom: 5,
    },
    postText: {
        paddingHorizontal: 12,
        paddingBottom: 10,
        fontSize: 15,
        lineHeight: 22,
        color: '#333',
    },
    postImage: {
        width: '100%',
        aspectRatio: 1, // Standard Square Post
        backgroundColor: '#f1f1f1',
    },
    videoPlaceholder: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 12,
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        marginRight: 18,
    },
    footer: {
        paddingHorizontal: 14,
    },
    likes: {
        fontWeight: '700',
        fontSize: 14,
        color: '#262626',
        marginBottom: 4,
    },
    timeAgo: {
        fontSize: 12,
        color: '#8e8e8e',
        marginTop: 4,
    },
    captionContainer: {
        marginTop: 6,
    },
    captionText: {
        fontSize: 14,
        color: '#262626',
        lineHeight: 18,
    },
    captionUsername: {
        fontWeight: '700',
    },
});

export default FeedPost;

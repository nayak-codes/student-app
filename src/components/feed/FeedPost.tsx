
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Post } from '../../services/postsService';
import PostOptionsModal from '../PostOptionsModal';

interface FeedPostProps {
    post: Post;
    currentUserId: string;
    onLike: (postId: string) => void;
    onReact: (postId: string, reactionType: any) => void;
    onComment: (postId: string) => void;
    onShare: (postId: string) => void;
    onSave: (postId: string) => void;
    onDelete: (postId: string) => void;
    onEdit: (postId: string) => void;
    currentUserLiked?: boolean;
    currentUserSaved?: boolean;
    currentUserReaction?: any;
    isVisible?: boolean;
}

const FeedPost: React.FC<FeedPostProps> = ({
    post,
    currentUserId,
    onLike,
    onComment,
    onShare,
    onSave,
    onDelete,
    onEdit,
    currentUserLiked,
    currentUserSaved,
    isVisible = true
}) => {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const [aspectRatio, setAspectRatio] = useState(1);
    const [liked, setLiked] = useState(currentUserLiked);
    const [saved, setSaved] = useState(currentUserSaved);
    const [likeCount, setLikeCount] = useState(post.likes);
    const [showOptionsModal, setShowOptionsModal] = useState(false);

    const isOwnPost = post.userId === currentUserId;

    React.useEffect(() => {
        if (post.imageUrl) {
            Image.getSize(post.imageUrl, (width, height) => {
                setAspectRatio(width / height);
            });
        }
    }, [post.imageUrl]);

    const handleProfilePress = () => {
        router.push({
            pathname: '/public-profile' as any,
            params: { userId: post.userId },
        });
    };

    const handleLike = () => {
        const newLikedState = !liked;
        setLiked(newLikedState);
        setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
        onLike(post.id);
    };

    const handleSave = () => {
        setSaved(!saved);
        onSave(post.id);
    };

    const handleVideoPress = () => {
        router.push({
            pathname: '/screens/video-player' as any,
            params: {
                videoUri: post.videoLink,
                postId: post.id,
                title: post.content || 'Untitled Video',
                description: post.content || '',
                authorName: post.userName,
                authorId: post.userId,
                likes: post.likes,
                views: post.viewCount || 0,
                date: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '',
                thumbnail: post.thumbnailUrl || post.imageUrl,
            },
        });
    };

    const isVideo = post.type === 'video' || post.type === 'clip';

    // Video posts render differently (like explore feed)
    if (isVideo) {
        return (
            <View style={[styles.container, { backgroundColor: colors.card, marginBottom: 0 }]}>
                {/* Video Thumbnail */}
                {post.thumbnailUrl && (
                    <TouchableOpacity onPress={handleVideoPress} activeOpacity={0.9} style={styles.videoContainer}>
                        <Image
                            source={{ uri: post.thumbnailUrl }}
                            style={styles.videoThumbnailFeed}
                            resizeMode="cover"
                        />
                        {/* Duration badge only */}
                        {post.duration && (
                            <View style={styles.durationBadgeFeed}>
                                <Text style={styles.durationTextFeed}>{post.duration}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}

                {/* Profile Info Below (simplified - just author + time) */}
                <View style={[styles.videoMetaFeed, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={handleProfilePress} style={styles.videoMetaContent}>
                        <View style={[styles.avatarSmall, { backgroundColor: colors.primary }]}>
                            {post.userProfilePhoto ? (
                                <Image source={{ uri: post.userProfilePhoto }} style={styles.avatarSmall} />
                            ) : (
                                <Text style={styles.avatarTextSmall}>{post.userName.charAt(0).toUpperCase()}</Text>
                            )}
                        </View>
                        <View style={styles.videoTextFeed}>
                            <Text style={[styles.videoTitleFeed, { color: colors.text }]} numberOfLines={2}>
                                {post.content || 'Untitled Video'}
                            </Text>
                            <Text style={[styles.videoSubtitleFeed, { color: colors.textSecondary }]}>
                                {post.userName} • {post.createdAt ? formatDistanceToNow(new Date(post.createdAt)) : 'Just now'} • {post.viewCount || 0} views
                            </Text>
                        </View>
                    </TouchableOpacity>
                    {isOwnPost && (
                        <TouchableOpacity onPress={() => setShowOptionsModal(true)} style={{ padding: 8 }}>
                            <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Post Options Modal */}
                <PostOptionsModal
                    visible={showOptionsModal}
                    onClose={() => setShowOptionsModal(false)}
                    onEdit={() => onEdit(post.id)}
                    onDelete={() => onDelete(post.id)}
                />
            </View>
        );
    }

    // Regular posts (images/text) keep the original layout
    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.userInfo} onPress={handleProfilePress}>
                    <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                        {post.userProfilePhoto ? (
                            <Image source={{ uri: post.userProfilePhoto }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>{post.userName.charAt(0).toUpperCase()}</Text>
                        )}
                    </View>
                    <View>
                        <Text style={[styles.userName, { color: colors.text }]}>{post.userName}</Text>
                        <Text style={[styles.userExam, { color: colors.textSecondary }]}>{post.userExam}</Text>
                    </View>
                </TouchableOpacity>
                {isOwnPost && (
                    <TouchableOpacity onPress={() => setShowOptionsModal(true)}>
                        <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Content */}
            <View style={styles.content}>
                {post.type === 'image' && post.imageUrl && (
                    <Image
                        source={{ uri: post.imageUrl }}
                        style={[styles.postImage, { aspectRatio }]}
                        resizeMode="cover"
                    />
                )}
            </View>

            {/* Actions - Unique Circular Style */}
            <View style={styles.actionsWrapper}>
                <View style={styles.actions}>
                    {/* Like Button */}
                    <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
                        <View style={[
                            styles.iconCircle,
                            liked && styles.likeActive,
                            { backgroundColor: liked ? '#EF4444' : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)') }
                        ]}>
                            <Ionicons
                                name={liked ? "heart" : "heart-outline"}
                                size={20}
                                color={liked ? "#FFF" : colors.text}
                            />
                        </View>
                        {likeCount > 0 && (
                            <Text style={[styles.actionCount, { color: colors.text }]}>
                                {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Comment Button */}
                    <TouchableOpacity onPress={() => onComment(post.id)} style={styles.actionButton}>
                        <View style={[
                            styles.iconCircle,
                            post.comments > 0 && styles.commentActive,
                            { backgroundColor: post.comments > 0 ? '#3B82F6' : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)') }
                        ]}>
                            <Ionicons
                                name="chatbubble-outline"
                                size={20}
                                color={post.comments > 0 ? '#FFF' : colors.text}
                            />
                        </View>
                        {post.comments > 0 && (
                            <Text style={[styles.actionCount, { color: colors.text }]}>
                                {post.comments > 999 ? `${(post.comments / 1000).toFixed(1)}k` : post.comments}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Share Button */}
                    <TouchableOpacity onPress={() => onShare(post.id)} style={styles.actionButton}>
                        <View style={[
                            styles.iconCircle,
                            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
                        ]}>
                            <Ionicons name="share-outline" size={20} color={colors.text} />
                        </View>
                    </TouchableOpacity>

                    {/* Save Button */}
                    <TouchableOpacity onPress={handleSave} style={styles.actionButton}>
                        <View style={[
                            styles.iconCircle,
                            saved && styles.saveActive,
                            { backgroundColor: saved ? '#10B981' : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)') }
                        ]}>
                            <Ionicons
                                name={saved ? "bookmark" : "bookmark-outline"}
                                size={20}
                                color={saved ? '#FFF' : colors.text}
                            />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                {likeCount > 0 && (
                    <Text style={[styles.likes, { color: colors.text }]}>
                        {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
                    </Text>
                )}

                {post.content && (
                    <View style={styles.captionContainer}>
                        <Text style={[styles.captionText, { color: colors.text }]}>
                            <Text style={styles.captionUsername}>{post.userName} </Text>
                            {post.content}
                        </Text>
                    </View>
                )}

                <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
                    {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'Just now'}
                </Text>
            </View>

            {/* Post Options Modal */}
            <PostOptionsModal
                visible={showOptionsModal}
                onClose={() => setShowOptionsModal(false)}
                onEdit={() => onEdit(post.id)}
                onDelete={() => onDelete(post.id)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
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
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    userName: {
        fontWeight: '700',
        fontSize: 14,
    },
    userExam: {
        fontSize: 12,
        marginTop: 2,
    },
    content: {
        marginBottom: 4,
    },
    postImage: {
        width: '100%',
    },
    videoPlaceholder: {
        width: '100%',
        aspectRatio: 16 / 9,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    playText: {
        fontSize: 14,
        fontWeight: '600',
    },
    playButtonOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    actionsWrapper: {
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    likeActive: {
        backgroundColor: '#EF4444',
    },
    commentActive: {
        backgroundColor: '#3B82F6',
    },
    saveActive: {
        backgroundColor: '#10B981',
    },
    actionCount: {
        fontSize: 13,
        fontWeight: '700',
    },
    footer: {
        paddingHorizontal: 14,
        paddingBottom: 8,
    },
    likes: {
        fontWeight: '700',
        fontSize: 14,
        marginBottom: 6,
    },
    captionContainer: {
        marginTop: 4,
        marginBottom: 6,
    },
    captionText: {
        fontSize: 14,
        lineHeight: 18,
    },
    captionUsername: {
        fontWeight: '700',
    },
    timeAgo: {
        fontSize: 11,
        marginTop: 4,
    },
    // Video Feed Styles (like explore)
    videoContainer: {
        position: 'relative',
    },
    videoThumbnailFeed: {
        width: '100%',
        height: 230,
        backgroundColor: '#000',
    },
    playIconContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -28 }, { translateY: -28 }],
    },
    durationBadgeFeed: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    durationTextFeed: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '600',
    },
    videoMetaFeed: {
        flexDirection: 'row',
        padding: 12,
        paddingTop: 14,
        paddingBottom: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    videoMetaContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarTextSmall: {
        fontSize: 16,
        fontWeight: '700',
        color: '#F8FAFC',
    },
    videoTextFeed: {
        flex: 1,
        marginRight: 8,
    },
    videoTitleFeed: {
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 20,
        marginBottom: 4,
    },
    videoSubtitleFeed: {
        fontSize: 12,
        fontWeight: '500',
    },
});

export default FeedPost;

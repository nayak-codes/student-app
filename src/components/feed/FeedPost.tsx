
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Post, ReactionType } from '../../services/postsService';
import PostOptionsModal from '../PostOptionsModal';

interface FeedPostProps {
    post: Post;
    currentUserId: string;
    onLike: (postId: string) => void;
    onReact: (postId: string, reactionType: ReactionType) => void;
    onComment: (postId: string) => void;
    onShare: (postId: string) => void;
    onSave: (postId: string) => void;
    onDelete?: (postId: string) => void;
    onEdit?: (postId: string) => void;
    currentUserLiked?: boolean; // Legacy
    currentUserSaved?: boolean;
    currentUserReaction?: ReactionType;
    isVisible?: boolean;
}

const REACTIONS: Record<ReactionType, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
    like: { icon: 'thumbs-up', color: '#3B82F6', label: 'Like' },
    celebrate: { icon: 'ribbon', color: '#10B981', label: 'Celebrate' }, // Using ribbon for celebrate/clap equivalent
    support: { icon: 'heart-circle', color: '#8B5CF6', label: 'Support' },
    love: { icon: 'heart', color: '#EF4444', label: 'Love' },
    insightful: { icon: 'bulb', color: '#F59E0B', label: 'Insight' },
    funny: { icon: 'happy', color: '#06B6D4', label: 'Funny' },
    hype: { icon: 'flame', color: '#FF4500', label: 'Hype' },
};

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
    currentUserReaction,
    onReact,
    isVisible = true
}) => {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const [aspectRatio, setAspectRatio] = useState(1);

    // State
    const [saved, setSaved] = useState(currentUserSaved);
    const [userReaction, setUserReaction] = useState<ReactionType | null>(
        ((currentUserReaction as any) === 'doubt' ? 'hype' : currentUserReaction) || (currentUserLiked ? 'like' : null)
    );
    const [showReactions, setShowReactions] = useState(false);
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const screenWidth = Dimensions.get('window').width;
    const [sliderWidth, setSliderWidth] = useState(screenWidth);

    // Animation for picker
    const [fadeAnim] = useState(new Animated.Value(0));

    const isOwnPost = post.userId === currentUserId;

    // Unified Image Logic
    const galleryImages = (post.imageUrls && post.imageUrls.length > 0) ? post.imageUrls : (post.imageUrl ? [post.imageUrl] : []);

    // Determine total reactions count (including local optimistic update if needed)
    // For simplicity, we use post.reactions count + delta or just rely on post.likes (legacy) + post.reactions keys
    // Since backend structure is hybrid, let's calculate display count.
    // If post.reactions exists, sum values. Else use post.likes.
    const getReactionCount = () => {
        if (post.reactions) {
            return Object.values(post.reactions).reduce((a, b) => a + b, 0);
        }
        return post.likes;
    };
    const reactionCount = getReactionCount();

    useEffect(() => {
        if (post.imageUrl) {
            Image.getSize(post.imageUrl, (width, height) => {
                setAspectRatio(width / height);
            });
        }
    }, [post.imageUrl]);

    useEffect(() => {
        setUserReaction(
            ((currentUserReaction as any) === 'doubt' ? 'hype' : currentUserReaction) || (currentUserLiked ? 'like' : null)
        );
    }, [currentUserReaction, currentUserLiked]);

    useEffect(() => {
        if (showReactions) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [showReactions]);

    const handleProfilePress = () => {
        router.push({
            pathname: '/public-profile' as any,
            params: { userId: post.userId },
        });
    };

    const handleRegularPress = () => {
        // Always close picker if it's open
        if (showReactions) {
            setShowReactions(false);
            return;
        }

        if (userReaction) {
            // If already reacted, remove reaction (toggle off)
            setUserReaction(null);
            onReact(post.id, userReaction); // API handles removal if same type
        } else {
            // Default to 'like'
            setUserReaction('like');
            onReact(post.id, 'like');
        }
    };

    const handleLongPress = () => {
        setShowReactions(true);
    };

    const handleReactionSelect = (type: ReactionType) => {
        setUserReaction(type);
        onReact(post.id, type);
        setShowReactions(false);
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
                thumbnail: post.thumbnailUrl || post.imageUrl || post.userProfilePhoto, // Capture thumbnail
                authorImage: post.userProfilePhoto // Pass author image too
            },
        });
    };

    const isVideo = post.type === 'video' || post.type === 'clip';

    // Video Post Render
    if (isVideo) {
        return (
            <View style={[styles.container, { backgroundColor: colors.card, marginBottom: 0 }]}>
                {post.thumbnailUrl && (
                    <TouchableOpacity onPress={handleVideoPress} activeOpacity={0.9} style={styles.videoContainer}>
                        <Image source={{ uri: post.thumbnailUrl }} style={styles.videoThumbnailFeed} resizeMode="cover" />
                        {post.duration && (
                            <View style={styles.durationBadgeFeed}>
                                <Text style={styles.durationTextFeed}>{post.duration}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
                {/* Simplified Video Meta */}
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
                            <Text style={[styles.videoTitleFeed, { color: colors.text }]} numberOfLines={2}>{post.content || 'Untitled Video'}</Text>
                            <Text style={[styles.videoSubtitleFeed, { color: colors.textSecondary }]}>{post.userName} • {post.viewCount || 0} views</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowOptionsModal(true)} style={{ padding: 8 }}>
                        <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
                <PostOptionsModal
                    visible={showOptionsModal}
                    onClose={() => setShowOptionsModal(false)}
                    onDelete={() => onDelete?.(post.id)}
                    onEdit={() => onEdit?.(post.id)}
                    onSave={handleSave}
                    onReport={() => console.log('Reported')}
                    isOwnPost={isOwnPost}
                    isSaved={saved}
                />
            </View>
        );
    }

    // Regular Post Render
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
                        <Text style={[styles.userExam, { color: colors.textSecondary }]}>
                            {post.userHeadline || post.userExam}
                        </Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowOptionsModal(true)}>
                    <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Content (Caption Top) */}
            <View style={styles.content}>
                {post.content && (
                    <TouchableOpacity
                        style={styles.captionContainer}
                        activeOpacity={1}
                        onPress={() => setExpanded(!expanded)}
                    >
                        <Text
                            style={[styles.captionText, { color: colors.text }]}
                            numberOfLines={expanded ? undefined : 2}
                        >
                            {expanded ? post.content : post.content.replace(/\n/g, ' ')}
                        </Text>
                        {expanded && post.content.length > 100 && (
                            <Text style={{ color: colors.textSecondary, marginTop: 2, fontSize: 13 }}>View less</Text>
                        )}
                    </TouchableOpacity>
                )}
                {/* Multi-Photo Carousel or Single Image */}
                {galleryImages.length > 0 ? (
                    <View>
                        {galleryImages.length > 1 ? (
                            <ScrollView
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                scrollEventThrottle={16}
                                onScroll={(e) => {
                                    const offset = e.nativeEvent.contentOffset.x;
                                    if (screenWidth > 0) {
                                        const index = Math.round(offset / screenWidth);
                                        setCurrentImageIndex(index);
                                    }
                                }}
                                style={{ width: screenWidth, aspectRatio: aspectRatio || 4 / 3 }}
                            >
                                {galleryImages.map((url, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        activeOpacity={0.95}
                                        onPress={() => {
                                            router.push({
                                                pathname: '/image-viewer' as any,
                                                params: {
                                                    images: JSON.stringify(galleryImages),
                                                    index: index
                                                }
                                            });
                                        }}
                                    >
                                        <Image
                                            source={{ uri: url }}
                                            style={{ width: screenWidth, height: '100%', aspectRatio: aspectRatio }}
                                            resizeMode="cover"
                                        />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        ) : (
                            <TouchableOpacity
                                activeOpacity={0.95}
                                onPress={() => {
                                    router.push({
                                        pathname: '/image-viewer' as any,
                                        params: {
                                            images: JSON.stringify(galleryImages),
                                            index: 0
                                        }
                                    });
                                }}
                            >
                                <Image source={{ uri: galleryImages[0] }} style={{ width: screenWidth, aspectRatio: aspectRatio || 4 / 3 }} resizeMode="cover" />
                            </TouchableOpacity>
                        )}

                        {/* 1/N Badge */}
                        {galleryImages.length > 1 && (
                            <View style={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                                borderRadius: 12,
                                paddingHorizontal: 10,
                                paddingVertical: 4
                            }}>
                                <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>
                                    {currentImageIndex + 1}/{galleryImages.length}
                                </Text>
                            </View>
                        )}
                        {/* Pagination Dots */}
                        {galleryImages.length > 1 && (
                            <View style={{ flexDirection: 'row', justifyContent: 'center', position: 'absolute', bottom: 10, width: '100%' }}>
                                {galleryImages.map((_, i) => (
                                    <View
                                        key={i}
                                        style={{
                                            width: 8, height: 8, borderRadius: 4, marginHorizontal: 4,
                                            backgroundColor: i === currentImageIndex ? colors.primary : 'rgba(255,255,255,0.6)'
                                        }}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                ) : null}
            </View>

            {/* Footer Wrapper */}
            <View style={styles.footerWrapper}>

                {/* 1. Social Stats (Reactions Only) */}
                {(reactionCount > 0 || (post.viewCount || 0) > 0) && (
                    <View style={styles.socialCountsContainer}>
                        <View style={styles.socialCountsLeft}>
                            {reactionCount > 0 && (
                                <View style={styles.bgIconContainer}>
                                    {/* Show first 3 active reactions from global stats if available, else generic icons */}
                                    <View style={[styles.miniIconBg, { backgroundColor: '#3B82F6', zIndex: 3 }]}>
                                        <Ionicons name="thumbs-up" size={10} color="#FFF" />
                                    </View>
                                    {/* Just generic stack for now */}
                                    {reactionCount > 1 && (
                                        <View style={[styles.miniIconBg, { backgroundColor: '#F59E0B', marginLeft: -6, zIndex: 2 }]}>
                                            <Ionicons name="bulb" size={10} color="#FFF" />
                                        </View>
                                    )}
                                    {reactionCount > 5 && (
                                        <View style={[styles.miniIconBg, { backgroundColor: '#EF4444', marginLeft: -6, zIndex: 1 }]}>
                                            <Ionicons name="heart" size={10} color="#FFF" />
                                        </View>
                                    )}
                                    <Text style={[styles.socialCountText, { color: colors.textSecondary }]}>
                                        {reactionCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                        {/* Views (Right side) */}
                        {(post.viewCount || 0) > 0 && (
                            <View style={styles.socialCountsRight}>
                                <Text style={[styles.socialCountText, { color: colors.textSecondary }]}>
                                    {post.viewCount} views
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={[styles.separator, { backgroundColor: colors.border }]} />

                {/* 2. Action Buttons */}
                <View style={styles.actionButtonsRow}>

                    {/* Dynamic Like / Reaction Button */}
                    <View style={{ flex: 1 }}>
                        <TouchableOpacity
                            onPress={handleRegularPress}
                            onLongPress={handleLongPress}
                            delayLongPress={300} // Fast response
                            style={styles.newActionButton}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={(userReaction && REACTIONS[userReaction]) ? REACTIONS[userReaction].icon : "thumbs-up-outline"}
                                size={22}
                                color={(userReaction && REACTIONS[userReaction]) ? REACTIONS[userReaction].color : colors.textSecondary}
                            />
                            <Text style={[
                                styles.newActionText,
                                { color: (userReaction && REACTIONS[userReaction]) ? REACTIONS[userReaction].color : colors.textSecondary }
                            ]}>
                                {(userReaction && REACTIONS[userReaction]) ? REACTIONS[userReaction].label : "Like"}
                            </Text>
                        </TouchableOpacity>

                        {/* Reaction Picker Overlay - Removed Blocking Modal */}
                        {/* We rely on zIndex for the picker to be clickable. 
                            Clicking the Like button again will close it via handleRegularPress. 
                        */}
                        {/* Inline Absolute Picker (Better for relative positioning) */}
                    </View>

                    {/* Comment Button (With Count) */}
                    <TouchableOpacity
                        onPress={() => onComment(post.id)}
                        style={styles.newActionButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="chatbox-outline"
                            size={22}
                            color={colors.textSecondary}
                        />
                        <Text style={[styles.newActionText, { color: colors.textSecondary }]}>
                            Comment {post.comments > 0 ? `• ${post.comments}` : ''}
                        </Text>
                    </TouchableOpacity>

                    {/* Hype (Flame) Button - NEW FEATURE */}
                    <TouchableOpacity
                        onPress={() => {
                            const newReaction = userReaction === 'hype' ? null : 'hype';
                            setUserReaction(newReaction);
                            onReact(post.id, 'hype');
                        }}
                        style={styles.newActionButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={userReaction === 'hype' ? "flame" : "flame-outline"}
                            size={22}
                            color={userReaction === 'hype' ? "#FF4500" : colors.textSecondary}
                        />
                        <Text style={[
                            styles.newActionText,
                            { color: userReaction === 'hype' ? "#FF4500" : colors.textSecondary }
                        ]}>
                            Hype
                        </Text>
                    </TouchableOpacity>

                    {/* Share Button */}
                    <TouchableOpacity
                        onPress={() => onShare(post.id)}
                        style={styles.newActionButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="arrow-redo-outline"
                            size={22}
                            color={colors.textSecondary}
                        />
                        <Text style={[styles.newActionText, { color: colors.textSecondary }]}>
                            Share
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Footer Time */}
            <View style={styles.footer}>
                <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
                    {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'Just now'}
                </Text>
            </View>

            <PostOptionsModal
                visible={showOptionsModal}
                onClose={() => setShowOptionsModal(false)}
                onDelete={() => onDelete?.(post.id)}
                onEdit={() => onEdit?.(post.id)}
                onSave={handleSave}
                onReport={() => console.log('Reported')}
                isOwnPost={isOwnPost}
                isSaved={saved}
            />

            {/* Reaction Picker - Moved to Root for Clickability */}
            {showReactions && (
                <Animated.View style={[styles.reactionPicker, { opacity: fadeAnim, backgroundColor: colors.card }]}>
                    {Object.entries(REACTIONS).map(([type, data]) => (
                        <TouchableOpacity
                            key={type}
                            style={styles.reactionOption}
                            onPress={() => handleReactionSelect(type as ReactionType)}
                        >
                            <View style={[styles.reactionIconCircle, { backgroundColor: data.color + '20' }]}>
                                <Ionicons name={data.icon} size={24} color={data.color} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 12 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
    userInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    userName: { fontWeight: '700', fontSize: 14 },
    userExam: { fontSize: 12, marginTop: 2 },
    content: { marginBottom: 4 },
    postImage: { width: '100%' },
    videoPlaceholder: { width: '100%', aspectRatio: 16 / 9, justifyContent: 'center', alignItems: 'center', gap: 8 },
    playText: { fontSize: 14, fontWeight: '600' },
    playButtonOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.3)' },
    playButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 255, 255, 0.9)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },

    // New Footer Styles
    footerWrapper: { paddingHorizontal: 14, zIndex: 10 }, // zIndex for picker
    socialCountsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    socialCountsLeft: { flexDirection: 'row', alignItems: 'center' },
    socialCountsRight: { flexDirection: 'row', alignItems: 'center' },
    bgIconContainer: { flexDirection: 'row', alignItems: 'center' },
    miniIconBg: { width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#FFF' },
    socialCountText: { fontSize: 12, marginLeft: 6 },
    separator: { height: 1, width: '100%' },
    actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, position: 'relative' },
    newActionButton: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 4, gap: 4 },
    newActionText: { fontSize: 11, fontWeight: '600' },
    footer: { paddingHorizontal: 14, paddingBottom: 8 },
    captionContainer: { marginTop: 4, marginBottom: 8, paddingHorizontal: 14 },
    captionText: { fontSize: 14, lineHeight: 18 },
    timeAgo: { fontSize: 11, marginTop: 4 },

    // Reaction Picker Styles
    reactionPicker: {
        position: 'absolute',
        bottom: 60, // Positioned relative to card bottom
        left: 14,   // Aligned with left padding
        backgroundColor: 'white',
        borderRadius: 30,
        padding: 6,
        flexDirection: 'row',
        gap: 8,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        zIndex: 100,
    },
    reactionOption: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    reactionIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reactionOverlayBackdrop: {
        flex: 1,
        backgroundColor: 'transparent',
    },

    // Video Styles
    videoContainer: { position: 'relative' },
    videoThumbnailFeed: { width: '100%', height: 230, backgroundColor: '#000' },
    playIconContainer: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -28 }, { translateY: -28 }] },
    durationBadgeFeed: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0, 0, 0, 0.75)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    durationTextFeed: { color: '#FFF', fontSize: 11, fontWeight: '600' },
    videoMetaFeed: { flexDirection: 'row', padding: 12, paddingTop: 14, paddingBottom: 12, alignItems: 'center', justifyContent: 'space-between' },
    videoMetaContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatarSmall: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarTextSmall: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
    videoTextFeed: { flex: 1, marginRight: 8 },
    videoTitleFeed: { fontSize: 15, fontWeight: '600', lineHeight: 20, marginBottom: 4 },
    videoSubtitleFeed: { fontSize: 12, fontWeight: '500' },
});

export default FeedPost;

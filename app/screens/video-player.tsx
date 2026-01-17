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
    Image,
    Linking,
    Pressable,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { getUserProfile } from '../../src/services/authService';
import { getAllPosts, getPostById, Post } from '../../src/services/postsService';

const { width } = Dimensions.get('window');

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

    // Parse params (some might be strings that need parsing if passed as objects, but usually simple types work directly)
    const videoUri = params.videoUri as string;
    const postId = params.postId as string;
    const initialTitle = params.title as string;
    const initialDescription = params.description as string;
    const authorName = params.authorName as string;
    const authorImage = params.authorImage as string;
    const authorId = params.authorId as string;
    const likes = params.likes ? parseInt(params.likes as string) : 0;
    const views = params.views ? parseInt(params.views as string) : 0;
    const date = params.date as string;



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

    console.log('VideoPlayerScreen Params:', { videoUri, postId, initialTitle });

    // const [loadingVideo, setLoadingVideo] = useState(true); // Handled by expo-video internal UI or can be added back with listeners
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [relatedVideos, setRelatedVideos] = useState<Post[]>([]);
    const [loadingRelated, setLoadingRelated] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [showDescription, setShowDescription] = useState(false);
    const [subscriberCount, setSubscriberCount] = useState(0);
    const [realCommentCount, setRealCommentCount] = useState(0);

    useEffect(() => {
        loadRelatedContent();
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
                            {formatViews(views)} views • {date || 'Recently'}
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
                    onPress={() => Alert.alert('Comments', 'Comments section will be available soon!')}
                >
                    <View style={styles.commentsHeader}>
                        <Text style={[styles.commentsTitle, { color: colors.text }]}>Comments</Text>
                        <Text style={[styles.commentsCount, { color: colors.textSecondary }]}>{realCommentCount || "128"}</Text>
                    </View>
                    <View style={styles.commentPreview}>
                        <View style={[styles.miniAvatar, { backgroundColor: '#64748B' }]} />
                        <Text style={[styles.commentText, { color: colors.text }]} numberOfLines={1}>
                            This is extremely helpful for my exams! Thanks for sharing.
                        </Text>
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
                                    router.push({
                                        pathname: '/screens/video-player',
                                        params: {
                                            videoUri: item.videoLink,
                                            postId: item.id,
                                            title: item.content, // Using content as title fallback
                                            description: item.content,
                                            authorName: item.userName,
                                            authorImage: undefined, // Post type doesn't have userImage yet
                                            authorId: item.userId,
                                            likes: item.likes,
                                            views: 0, // Mock or fetch
                                            date: new Date(item.createdAt).toLocaleDateString()
                                        }
                                    });
                                }}
                            >
                                {/* Thumbnail */}
                                <View style={styles.relatedThumbnailContainer}>
                                    {item.imageUrl ? (
                                        <Image source={{ uri: item.imageUrl }} style={styles.relatedThumbnail} resizeMode="cover" />
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
                                        {item.likes} likes • 2 days ago
                                    </Text>
                                </View>
                            </Pressable>
                        ))
                    )}
                </View>

                {/* Bottom Spacing */}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

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
        width: 20,
        height: 20,
        borderRadius: 10,
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
});

export default VideoPlayerScreen;

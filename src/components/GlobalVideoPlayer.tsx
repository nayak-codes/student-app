import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    BackHandler,
    Dimensions,
    Image,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useVideoPlayerContext } from '../contexts/VideoPlayerContext';
import { getUserProfile } from '../services/authService';
import { addToHistory } from '../services/historyService';
import { getAllPosts, incrementViewCount, likePost, Post, savePost, unlikePost, unsavePost } from '../services/postsService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MiniPlayerHeight = 60;
const TabBarHeight = 60;

const GlobalVideoPlayerContent = ({ currentVideo }: { currentVideo: any }) => {
    const router = useRouter();
    const { isMinimized, isPlaying, minimizeVideo, expandVideo, closeVideo, togglePlayPause, playVideo } = useVideoPlayerContext();
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    // Standard Animated values
    const animatedHeight = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const animatedTop = useRef(new Animated.Value(0)).current;
    const videoWidth = useRef(new Animated.Value(SCREEN_WIDTH)).current;
    const videoHeight = useRef(new Animated.Value(SCREEN_WIDTH * 9 / 16)).current;
    const contentOpacity = useRef(new Animated.Value(1)).current;
    const miniOpacity = useRef(new Animated.Value(0)).current;

    const [subscriberCount, setSubscriberCount] = useState(0);
    const [relatedVideos, setRelatedVideos] = useState<Post[]>([]);
    const [localLiked, setLocalLiked] = useState(false);
    const [localLikeCount, setLocalLikeCount] = useState(0);
    const [localSaved, setLocalSaved] = useState(false);

    const player = useVideoPlayer(currentVideo.videoLink, (player) => {
        player.loop = false;
        player.play();
    });

    useEffect(() => {
        if (currentVideo.videoLink) {
            player.replace(currentVideo.videoLink);
            player.play();
        }
    }, [currentVideo.id, currentVideo.videoLink]);

    useEffect(() => {
        if (isPlaying) player.play();
        else player.pause();
    }, [isPlaying, player]);

    // Animate layout when minimizing/expanding
    useEffect(() => {
        const toMini = isMinimized;
        const duration = 300;

        Animated.parallel([
            Animated.spring(animatedHeight, {
                toValue: toMini ? MiniPlayerHeight : SCREEN_HEIGHT,
                useNativeDriver: false,
                friction: 8,
            }),
            Animated.spring(animatedTop, {
                toValue: toMini ? (SCREEN_HEIGHT - TabBarHeight - MiniPlayerHeight - insets.bottom - 10) : 0,
                useNativeDriver: false,
                friction: 8,
            }),
            Animated.spring(videoWidth, {
                toValue: toMini ? 90 : SCREEN_WIDTH,
                useNativeDriver: false,
                friction: 8,
            }),
            Animated.spring(videoHeight, {
                toValue: toMini ? MiniPlayerHeight : (SCREEN_WIDTH * 9 / 16),
                useNativeDriver: false,
                friction: 8,
            }),
            Animated.timing(contentOpacity, {
                toValue: toMini ? 0 : 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(miniOpacity, {
                toValue: toMini ? 1 : 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [isMinimized]);

    useEffect(() => {
        if (user) {
            setLocalLiked(currentVideo.likedBy?.includes(user.uid) || false);
            setLocalLikeCount(currentVideo.likes || 0);
            setLocalSaved(currentVideo.savedBy?.includes(user.uid) || false);
        }

        addToHistory({
            id: currentVideo.id,
            type: 'video',
            title: currentVideo.title || currentVideo.content,
            subtitle: currentVideo.userName,
            image: currentVideo.thumbnailUrl || currentVideo.imageUrl,
            url: currentVideo.videoLink
        }).catch(err => console.error('History add failed', err));
        incrementViewCount(currentVideo.id);

        if (currentVideo.userId) {
            getUserProfile(currentVideo.userId).then(profile => {
                if (profile) setSubscriberCount(profile.networkStats?.followersCount || profile.followers?.length || 0);
            });
        }

        getAllPosts().then(all => {
            const filtered = all.filter(p => p.type === 'video' && p.id !== currentVideo.id).slice(0, 10);
            setRelatedVideos(filtered);
        });
    }, [currentVideo.id, user]);

    useEffect(() => {
        const onBackPress = () => {
            if (!isMinimized) {
                minimizeVideo();
                return true;
            }
            return false;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => backHandler.remove();
    }, [isMinimized, minimizeVideo]);

    const handleLike = async () => {
        if (!user) return;
        const newLiked = !localLiked;
        setLocalLiked(newLiked);
        setLocalLikeCount(prev => newLiked ? prev + 1 : prev - 1);
        try {
            if (newLiked) await likePost(currentVideo.id, user.uid);
            else await unlikePost(currentVideo.id, user.uid);
        } catch { setLocalLiked(!newLiked); setLocalLikeCount(prev => newLiked ? prev - 1 : prev + 1); }
    };

    const handleSave = async () => {
        if (!user) return;
        const newSaved = !localSaved;
        setLocalSaved(newSaved);
        try {
            if (newSaved) await savePost(currentVideo.id, user.uid);
            else await unsavePost(currentVideo.id, user.uid);
        } catch { setLocalSaved(!newSaved); }
    };

    const handleShare = async () => {
        Share.share({ message: `Check out: ${currentVideo.title} \n${currentVideo.videoLink}` });
    };

    const handleComment = () => {
        minimizeVideo();
        router.push({ pathname: '/post-comments', params: { postId: currentVideo.id } });
    };

    return (
        <Animated.View style={[styles.mainContainer, {
            height: animatedHeight,
            top: animatedTop,
            left: isMinimized ? 10 : 0,
            right: isMinimized ? 10 : 0,
            borderRadius: isMinimized ? 12 : 0,
            backgroundColor: isMinimized ? (isDark ? '#1E293B' : '#F1F5F9') : colors.background,
        }]}>
            <Pressable style={{ flex: 1 }} onPress={isMinimized ? expandVideo : undefined}>

                {/* Video */}
                <Animated.View style={[styles.videoWrapper, {
                    width: videoWidth,
                    height: videoHeight,
                    marginTop: isMinimized ? 0 : insets.top,
                }]}>
                    <VideoView player={player} style={styles.videoView} contentFit={isMinimized ? "cover" : "contain"} nativeControls={!isMinimized} />
                    {!isMinimized && (
                        <TouchableOpacity style={styles.minimizeButton} onPress={minimizeVideo}>
                            <Ionicons name="chevron-down" size={32} color="#FFF" />
                        </TouchableOpacity>
                    )}
                </Animated.View>

                {/* Expanded Content */}
                <Animated.View style={[{ opacity: contentOpacity, flex: 1 }, !isMinimized && { display: 'flex' }]}>
                    <ScrollView contentContainerStyle={{ paddingBottom: TabBarHeight + 100 }} showsVerticalScrollIndicator={false}>
                        <View style={styles.infoSection}>
                            <Text style={[styles.videoTitle, { color: colors.text }]}>{currentVideo.title || "Untitled"}</Text>
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{currentVideo.viewCount || 0} views</Text>
                            <View style={styles.actionRow}>
                                <TouchableOpacity style={styles.actionButton} onPress={handleLike}><Ionicons name={localLiked ? "heart" : "heart-outline"} size={24} color={localLiked ? "#EF4444" : colors.text} /><Text style={[styles.actionText, { color: colors.text }]}>{localLikeCount}</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton} onPress={handleComment}><Ionicons name="chatbubble-outline" size={22} color={colors.text} /><Text style={[styles.actionText, { color: colors.text }]}>{currentVideo.comments || 'Comment'}</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton} onPress={handleShare}><Ionicons name="share-social-outline" size={24} color={colors.text} /><Text style={[styles.actionText, { color: colors.text }]}>Share</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton} onPress={handleSave}><Ionicons name={localSaved ? "bookmark" : "bookmark-outline"} size={22} color={localSaved ? colors.primary : colors.text} /><Text style={[styles.actionText, { color: colors.text }]}>Save</Text></TouchableOpacity>
                            </View>
                        </View>
                        <View style={[styles.channelSection, { borderColor: colors.border }]}>
                            <View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={{ color: '#FFF' }}>{currentVideo.userName?.[0]}</Text></View>
                            <Text style={[styles.channelName, { color: colors.text }]}>{currentVideo.userName}</Text>
                            <TouchableOpacity style={[styles.subscribeButton, { backgroundColor: isDark ? '#FFF' : '#0F172A' }]}><Text style={[styles.subscribeText, { color: isDark ? '#000' : '#FFF' }]}>Subscribe</Text></TouchableOpacity>
                        </View>
                        <View style={styles.relatedSection}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Up Next</Text>
                            {relatedVideos.map((item) => (
                                <Pressable key={item.id} style={styles.relatedItem} onPress={() => playVideo(item)}>
                                    <View style={styles.relatedThumbContainer}>
                                        <Image source={{ uri: item.thumbnailUrl || item.imageUrl }} style={styles.relatedThumbnail} />
                                    </View>
                                    <View style={styles.relatedDetails}>
                                        <Text style={[styles.relatedTitle, { color: colors.text }]} numberOfLines={2}>{item.title || item.content}</Text>
                                        <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{item.userName}</Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    </ScrollView>
                </Animated.View>

                {/* Mini Controls */}
                <Animated.View style={[styles.miniControlsContainer, { opacity: miniOpacity }]} pointerEvents={isMinimized ? 'auto' : 'none'}>
                    <View style={styles.miniInfo}>
                        <Text style={[styles.miniTitle, { color: colors.text }]} numberOfLines={1}>{currentVideo.title}</Text>
                        <Text style={[styles.miniAuthor, { color: colors.textSecondary }]} numberOfLines={1}>{currentVideo.userName}</Text>
                    </View>
                    <View style={styles.miniButtons}>
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); togglePlayPause(); }} style={{ padding: 4 }}><Ionicons name={isPlaying ? "pause" : "play"} size={22} color={colors.text} /></TouchableOpacity>
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); closeVideo(); }} style={{ marginLeft: 12, padding: 4 }}><Ionicons name="close" size={22} color={colors.text} /></TouchableOpacity>
                    </View>
                </Animated.View>
            </Pressable>
        </Animated.View>
    );
};

const GlobalVideoPlayer = () => {
    const { currentVideo } = useVideoPlayerContext();
    if (!currentVideo) return null;
    return <GlobalVideoPlayerContent currentVideo={currentVideo} />;
};

const styles = StyleSheet.create({
    mainContainer: {
        position: 'absolute',
        zIndex: 1000,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    videoWrapper: {
        backgroundColor: '#000',
        overflow: 'hidden',
    },
    videoView: {
        width: '100%',
        height: '100%',
    },
    minimizeButton: {
        position: 'absolute',
        top: 10,
        left: 10,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    miniControlsContainer: {
        position: 'absolute',
        left: 90,
        right: 0,
        top: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingRight: 16,
    },
    miniInfo: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    miniTitle: {
        fontSize: 13,
        fontWeight: '600',
    },
    miniAuthor: {
        fontSize: 11,
    },
    miniButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoSection: { padding: 16 },
    videoTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    metaText: { fontSize: 12 },
    actionRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.2)' },
    actionButton: { alignItems: 'center', padding: 8 },
    actionText: { fontSize: 12, marginTop: 4, fontWeight: '500' },
    channelSection: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderBottomWidth: 1 },
    avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    channelName: { flex: 1, fontWeight: '600' },
    subscribeButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    subscribeText: { fontSize: 12, fontWeight: '700' },
    relatedSection: { padding: 16 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
    relatedItem: { flexDirection: 'row', marginBottom: 16, height: 80 },
    relatedThumbContainer: { width: 140, height: 80, borderRadius: 8, overflow: 'hidden', marginRight: 10 },
    relatedThumbnail: { width: '100%', height: '100%' },
    relatedDetails: { flex: 1, justifyContent: 'center' },
    relatedTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
});

export default GlobalVideoPlayer;
